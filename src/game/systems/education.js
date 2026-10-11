import {SCHOOL_PROFILES,SCHOOL_START,SCHOOL_END,ATTENDANCE_SECONDS,PUPILS_PER_TEACHER,schoolKindForAge} from '../../config/education.js';
import {CATALOG} from '../../config/catalog.js';
import {capacityFactor} from '../../config/building-economy.js';
import {DAY_SECONDS} from '../../config/simulation.js';
import {calendar} from './clock.js';
import {route} from './roads.js';
import {distance} from './world.js';

const caches=new WeakMap();
const blankStudy=()=>({tile:null,assetId:null,kind:null,sessionDay:-1,sessionSeconds:0,totalSeconds:0,attendedDays:0,lastAttendanceDay:-1,lastAttendanceSequence:0});
const open=t=>!!t?.active&&!!t.sewage&&(t.fire||0)<60;
export function schoolPosts(t){const p=SCHOOL_PROFILES[t?.kind];return p?Math.floor(p.teachers*capacityFactor(t)):0;}
function schoolRows(s){
 const people=new Map(s.citizens.map(c=>[c.id,c]));
 return s.firms.filter(f=>SCHOOL_PROFILES[s.tiles[f.home]?.kind]).map(f=>{
  const t=s.tiles[f.home],p=SCHOOL_PROFILES[t.kind],staff=f.employees.map(id=>people.get(id)).filter(c=>c&&c.work===f.id&&c.age>=18&&c.age<65&&c.health>=40&&route(s,c.home,f.home,'walk').length);
  const designSeats=Math.floor(p.seats*capacityFactor(t)*(s.budgets?.school??100)/100);
  return {tile:f.home,assetId:t.assetId,kind:t.kind,firmId:f.id,designSeats,posts:schoolPosts(t),staff:staff.map(c=>c.id),capacity:open(t)?Math.min(designSeats,staff.length*PUPILS_PER_TEACHER):0,pupils:[],reason:!t.connected?'Thiếu đường nối cổng':!t.power?'Thiếu điện':!t.water?'Thiếu nước sạch':!t.sewage?'Thiếu xử lý nước thải':(t.fire||0)>=60?'Trường không an toàn':!staff.length?'Chưa có giáo viên có đường tới trường':''};
 });
}
// Rebuild allocation on a changed world, never per frame or per pupil/tick.
export function reconcileEducation(s,{force=false}={}){
 const old=caches.get(s),stamp=`${s.graphVersion}:${s.citizens.length}:${s.firms.length}:${s.budgets?.school??100}`;
 if(!force&&old?.stamp===stamp&&old.network===s.network)return old;
 const rows=schoolRows(s),byTile=new Map(rows.map(r=>[r.tile,r])),pupils=s.citizens.filter(c=>schoolKindForAge(c.age)),access=new Map();
 const reachable=(c,r)=>{const key=`${c.home}:${r.tile}`;if(!access.has(key)){const t=s.tiles[r.tile],radius=CATALOG[t.kind].range*Math.sqrt(capacityFactor(t)*(s.budgets?.school??100)/100);access.set(key,distance(c.home,r.tile)<=radius&&route(s,c.home,r.tile,'walk').length>0);}return access.get(key);};
 const assign=(c,r)=>{Object.assign(c.study,{tile:r.tile,assetId:r.assetId,kind:r.kind});r.pupils.push(c.id);};
 for(const c of pupils){c.study??=blankStudy();const r=byTile.get(c.study.tile);if(r&&r.assetId===c.study.assetId&&r.kind===schoolKindForAge(c.age)&&r.pupils.length<r.capacity&&reachable(c,r))assign(c,r);else{c.study.tile=null;c.study.assetId=null;c.study.kind=null;}}
 for(const c of pupils)if(c.study.tile==null){const candidates=rows.filter(r=>r.kind===schoolKindForAge(c.age)&&r.pupils.length<r.capacity).sort((a,b)=>distance(c.home,a.tile)-distance(c.home,b.tile)||a.tile-b.tile);const r=candidates.find(r=>reachable(c,r));if(r)assign(c,r);}
 const value={stamp,network:s.network,rows,byTile,pupils};caches.set(s,value);return value;
}
export function schoolSnapshot(s,tile){
 const ctx=reconcileEducation(s),r=ctx.byTile.get(tile),people=new Map(s.citizens.map(c=>[c.id,c]));
 if(!r)return null;
 const present=r.staff.filter(id=>{const c=people.get(id);return c?.state==='at-work'&&!c.journey&&c.goal===r.tile;}).length;
 const inClass=r.pupils.filter(id=>{const c=people.get(id);return c?.state==='at-school'&&!c.journey&&c.goal===r.tile;}).length;
 return {...r,present,inClass,today:r.pupils.filter(id=>people.get(id)?.study?.lastAttendanceDay===Math.floor(s.clock.seconds/DAY_SECONDS)).length};
}
export function educationSnapshot(s){const ctx=reconcileEducation(s),eligible=ctx.pupils.length,assigned=ctx.rows.reduce((v,r)=>v+r.pupils.length,0);return {eligible,assigned,accessPct:eligible?assigned/eligible*100:undefined,capacity:ctx.rows.reduce((v,r)=>v+r.capacity,0),schools:ctx.rows.length};}
export function schoolEnrollmentValid(s,c){const u=c.study;return u?.tile!=null&&SCHOOL_PROFILES[s.tiles[u.tile]?.kind]&&s.tiles[u.tile].assetId===u.assetId&&open(s.tiles[u.tile]);}
export function updateEducation(s,emitEvent){
 const ctx=reconcileEducation(s),day=Math.floor(s.clock.seconds/DAY_SECONDS),time=s.clock.seconds%DAY_SECONDS,date=calendar(s.clock.seconds);
 if(date.weekday===0||date.weekday===6||time<SCHOOL_START||time>=SCHOOL_END)return;
 const people=new Map(s.citizens.map(c=>[c.id,c]));
 for(const r of ctx.rows){
  if(!open(s.tiles[r.tile]))continue;
  let seats=r.staff.filter(id=>{const c=people.get(id);return c?.state==='at-work'&&!c.journey&&c.goal===r.tile;}).length*PUPILS_PER_TEACHER;
  for(const id of r.pupils){const c=people.get(id),u=c?.study;if(!c||c.state!=='at-school'||c.journey||c.goal!==r.tile||!schoolEnrollmentValid(s,c)||seats--<=0)continue;
   if(u.sessionDay!==day){u.sessionDay=day;u.sessionSeconds=0;}
   u.sessionSeconds++;u.totalSeconds++;
   if(u.sessionSeconds>=ATTENDANCE_SECONDS&&u.lastAttendanceDay!==day){
    u.lastAttendanceDay=day;u.attendedDays++;u.lastAttendanceSequence=s.nextEventId;c.education=Math.min(100,(c.education||0)+1);
    emitEvent(s,'school-attendance-completed',c.id,{job:`school-attendance-${c.id}-${day}`,school:r.tile,asset:r.assetId,day,applied:true});
   }
  }
 }
}
export function validateStudy(u,c,raw,size,tiles=raw.tiles){
 if(u==null)return;
 const integer=v=>Number.isSafeInteger(v)&&v>=0;
 if(!u||!schoolKindForAge(c.age)||!['sessionSeconds','totalSeconds','attendedDays','lastAttendanceSequence'].every(k=>integer(u[k]))||u.sessionSeconds>6*3600||u.sessionSeconds>u.totalSeconds||u.totalSeconds>raw.clock.seconds||u.attendedDays>Math.floor(raw.clock.seconds/DAY_SECONDS)+1||!['sessionDay','lastAttendanceDay'].every(k=>Number.isInteger(u[k])&&u[k]>=-1&&u[k]<=Math.floor(raw.clock.seconds/DAY_SECONDS))||u.lastAttendanceSequence>=raw.nextEventId||u.attendedDays===0&&(u.lastAttendanceDay!==-1||u.lastAttendanceSequence!==0)||u.attendedDays>0&&(u.lastAttendanceDay<0||u.lastAttendanceSequence===0))throw new Error('Tiến trình học không hợp lệ.');
 if(u.tile==null){if(u.assetId!==null||u.kind!==null)throw new Error('Chỗ học không hợp lệ.');return;}
 if(!Number.isInteger(u.tile)||u.tile<0||u.tile>=size*size||u.kind!==schoolKindForAge(c.age)||tiles[u.tile]?.kind!==u.kind||u.assetId!==tiles[u.tile]?.assetId)throw new Error('Chỗ học tham chiếu trường không tồn tại.');
}
