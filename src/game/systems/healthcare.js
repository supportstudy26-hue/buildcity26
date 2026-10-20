import {HEALTHCARE_PROFILES,HEALTHCARE_VERSION,CARE_PHASES,CARE_NEED_HEALTH,CARE_URGENT_HEALTH,CHECKUP_INTERVAL_SECONDS,CARE_RETRY_SECONDS,HEALTH_ASSESSMENT_SECONDS} from '../../config/healthcare.js';
import {CATALOG} from '../../config/catalog.js';
import {capacityFactor} from '../../config/building-economy.js';
import {CELL_METERS} from '../../config/simulation.js';
import {route} from './roads.js';
import {distance} from './world.js';
import {leisureJourneyReserved} from './leisure.js';
import {calendar} from './clock.js';
import {startJourney} from './citizens.js';
import {recordCash} from './economy.js';

const caches=new WeakMap(),reserved=new Set(['travelling','waiting','treatment','returning']);
const healthyStaff=c=>c&&c.age>=18&&c.age<65&&c.health>=40;
const open=t=>!!t?.active&&!!t.sewage&&(t.fire||0)<60;
const hash=id=>[...id].reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,26);
export function healthcarePosts(t){const p=HEALTHCARE_PROFILES[t?.kind];return p?Math.floor(p.staff*capacityFactor(t)):0;}
export function healthcareJourneyReserved(c){return reserved.has(c.care?.phase);}
export function healthcareArrivalState(c,goal){return c.care?.tile===goal&&['travelling','waiting','treatment'].includes(c.care.phase)?'at-clinic':null;}
function createCare(s,c){
  return {version:HEALTHCARE_VERSION,phase:'idle',tile:null,assetId:null,job:null,episode:0,requestedAt:-1,queuedAt:-1,startedAt:-1,progress:0,required:0,urgent:false,paid:0,reason:'',completed:0,lastCompletedAt:-1,lastCompletedSequence:0,lastJob:null,lastTile:null,lastAssetId:null,lastStartedAt:-1,lastDuration:0,lastHealthBefore:0,lastHealthAfter:0,nextCheckAt:s.clock.seconds+60+hash(c.id)%300};
}
function ensureHealthcare(s){
  s.healthcareVersion=HEALTHCARE_VERSION;
  s.healthcare??={version:HEALTHCARE_VERSION,lastTick:null,lastAssessmentAt:s.clock.seconds,completed:0};
  for(const c of s.citizens)c.care??=createCare(s,c);
}
function facilityRows(s){
  const people=new Map(s.citizens.map(c=>[c.id,c]));
  return s.firms.filter(f=>HEALTHCARE_PROFILES[s.tiles[f.home]?.kind]).map(f=>{
    const t=s.tiles[f.home],p=HEALTHCARE_PROFILES[t.kind],budget=(s.budgets?.clinic??100)/100;
    const staff=f.employees.map(id=>people.get(id)).filter(c=>healthyStaff(c)&&c.work===f.id&&route(s,c.home,f.home,'walk').length).map(c=>c.id);
    const beds=Math.floor(p.beds*capacityFactor(t)),fundedBeds=Math.floor(beds*budget),capacity=open(t)?Math.min(beds,fundedBeds,staff.length*p.bedsPerStaff):0;
    const reason=!t.connected?'Thiếu đường nối cổng':!t.power?'Thiếu điện':!t.water?'Thiếu nước sạch':!t.sewage?'Thiếu xử lý nước thải':(t.fire||0)>=60?'Cơ sở không an toàn':!staff.length?'Chưa có nhân viên y tế có đường tới nơi':'';
    return {tile:f.home,assetId:t.assetId,kind:t.kind,firmId:f.id,posts:healthcarePosts(t),staff,beds,fundedBeds,capacity,queueCapacity:capacity*p.queuePerBed,reason,profile:p};
  });
}
// Cache static route/catchment data by analyzed graph, not each render frame.
export function reconcileHealthcare(s,{force=false}={}){
  ensureHealthcare(s);
  const stamp=`${s.graphVersion}:${s.citizens.length}:${s.firms.length}:${s.budgets?.clinic??100}`,old=caches.get(s);
  if(!force&&old?.stamp===stamp&&old.network===s.network)return old;
  const rows=facilityRows(s),byTile=new Map(rows.map(r=>[r.tile,r])),reachable=new Map();
  const canAccess=(home,r)=>{const key=`${home}:${r.tile}`;if(!reachable.has(key)){const radius=CATALOG[r.kind].range*Math.sqrt(capacityFactor(s.tiles[r.tile])*(s.budgets?.clinic??100)/100);reachable.set(key,distance(home,r.tile)<=radius&&route(s,home,r.tile,'walk').length>0);}return reachable.get(key);};
  const byHome=new Map();for(const c of s.citizens)if(!byHome.has(c.home))byHome.set(c.home,rows.filter(r=>canAccess(c.home,r)).sort((a,b)=>distance(c.home,a.tile)-distance(c.home,b.tile)||a.tile-b.tile));
  const value={stamp,network:s.network,rows,byTile,byHome};caches.set(s,value);return value;
}
function patientGroups(s){const groups=new Map();for(const c of s.citizens)if(['travelling','waiting','treatment'].includes(c.care?.phase)){const patients=groups.get(c.care.tile)||[];patients.push(c);groups.set(c.care.tile,patients);}return groups;}
function currentRow(s,r,people,groups){
  const present=r.staff.filter(id=>{const c=people.get(id);return healthyStaff(c)&&c.work===r.firmId&&c.state==='at-work'&&!c.journey&&c.goal===r.tile&&!healthcareJourneyReserved(c);});
  const capacity=open(s.tiles[r.tile])?Math.min(r.capacity,present.length*r.profile.bedsPerStaff):0;
  const patients=(groups.get(r.tile)||[]).filter(c=>c.care.assetId===r.assetId);
  const occupied=patients.filter(c=>c.care.phase==='treatment'),waiting=patients.filter(c=>c.care.phase==='waiting'),travelling=patients.filter(c=>c.care.phase==='travelling');
  const reason=r.reason||(!present.length?'Nhân viên chưa tới cơ sở':s.money<r.profile.supplies?'Thiếu kinh phí vật tư khám bệnh':'');
  return {...r,present:present.length,presentIds:present,capacity,patients:patients.map(c=>c.id),occupied:occupied.length,waiting:waiting.length,travelling:travelling.length,freeBeds:Math.max(0,capacity-occupied.length),reason};
}
export function healthcareFacilitySnapshot(s,tile){const ctx=reconcileHealthcare(s),r=ctx.byTile.get(tile);return r?currentRow(s,r,new Map(s.citizens.map(c=>[c.id,c])),patientGroups(s)):null;}
export const facilitySnapshot=healthcareFacilitySnapshot;
export function healthcareSnapshot(s){
  const ctx=reconcileHealthcare(s),people=new Map(s.citizens.map(c=>[c.id,c])),groups=patientGroups(s),rows=ctx.rows.map(r=>currentRow(s,r,people,groups)),remaining=new Map(rows.map(r=>[r.tile,r.capacity&&s.money>=r.profile.supplies?r.present*r.profile.residentsPerStaff:0]));
  let accessible=0;for(const c of s.citizens){const r=(ctx.byHome.get(c.home)||[]).find(r=>(remaining.get(r.tile)||0)>0);if(r){remaining.set(r.tile,remaining.get(r.tile)-1);accessible++;}}
  return {population:s.citizens.length,accessible,accessPct:s.citizens.length?accessible/s.citizens.length*100:undefined,facilities:rows.length,staff:rows.reduce((n,r)=>n+r.staff.length,0),present:rows.reduce((n,r)=>n+r.present,0),beds:rows.reduce((n,r)=>n+r.beds,0),capacity:rows.reduce((n,r)=>n+r.capacity,0),occupied:rows.reduce((n,r)=>n+r.occupied,0),waiting:rows.reduce((n,r)=>n+r.waiting,0),travelling:rows.reduce((n,r)=>n+r.travelling,0),requesting:s.citizens.filter(c=>c.care?.phase==='requesting').length,completed:s.healthcare.completed,rows};
}
function beginJourney(s,c,goal){
  const size=Math.sqrt(s.tiles.length);
  if(c.journey)c.retryOrigin=Math.min(s.tiles.length-1,Math.max(0,Math.floor(c.position.y/CELL_METERS)*size+Math.floor(c.position.x/CELL_METERS)));
  c.journey=null;c.busPlan=null;c.missionTrip=null;c.state='home';
  startJourney(s,c,goal,route,size,false);
  if(c.missionTrip)c.missionTrip.purpose=goal===c.home?'home':'healthcare';
}
function returnHome(s,c,reason=''){
  const u=c.care;u.phase='returning';u.reason=reason;u.tile=null;u.assetId=null;
  if(c.goal===c.home&&!c.journey){c.state='home';u.phase='idle';u.job=null;u.progress=0;u.required=0;u.paid=0;return;}
  beginJourney(s,c,c.home);
}
function syncHomeHealth(s,home=null,inhabitants=null){
  const totals=new Map();for(const c of inhabitants||s.citizens){if(home!=null&&c.home!==home)continue;const row=totals.get(c.home)||{total:0,count:0};row.total+=c.health;row.count++;totals.set(c.home,row);}
  for(const [tile,row] of totals)s.tiles[tile].health=row.total/row.count;
}
function assessHealth(s){
  const now=s.clock.seconds;if(now-s.healthcare.lastAssessmentAt<HEALTH_ASSESSMENT_SECONDS)return;
  const minutes=Math.min(60,(now-s.healthcare.lastAssessmentAt)/HEALTH_ASSESSMENT_SECONDS);s.healthcare.lastAssessmentAt=now;
  const sources=s.tiles.flatMap((t,i)=>t.kind==='industrial'||['waste','wasteCenter'].includes(t.kind)?[i]:[]);
  for(const c of s.citizens){const t=s.tiles[c.home],pollution=Math.min(100,Math.max(0,sources.reduce((n,i)=>n+Math.max(0,7-distance(c.home,i))*5,0)+(!t.sewage?12:0)+(t.garbage||0)*.18));
    // Exposure and age are actual inputs. A service radius does not heal.
    const loss=(pollution/100*.02+(t.garbage||0)/100*.025+(!t.water ? .025 : 0)+(!t.sewage ? .02 : 0)+(t.fire||0)/100*.1+(c.age>=65 ? .004 : 0))*minutes;
    c.health=Math.max(0,Math.min(100,c.health-loss));
  }
  syncHomeHealth(s);
}
function requestCare(s,c,clinician){
  const u=c.care;if(u.phase!=='idle')return;
  // Staff do not all abandon a new clinic for routine checkups at once.
  if(clinician&&c.health>=CARE_NEED_HEALTH){if(s.clock.seconds>=u.nextCheckAt)u.nextCheckAt=s.clock.seconds+CHECKUP_INTERVAL_SECONDS;return;}
  if(s.clock.seconds<u.nextCheckAt&&c.health>=CARE_URGENT_HEALTH)return;
  if(c.health>=CARE_NEED_HEALTH){
   const time=s.clock.seconds%86400,weekday=calendar(s.clock.seconds).weekday,schoolDay=weekday>0&&weekday<6,timeReserved=schoolDay&&time>=7*3600&&time<14*3600&&(c.study?.tile!=null||s.firms.find(f=>f.id===c.work)?.school);
   if(timeReserved||c.journey||c.busPlan||c.municipalAssignment||leisureJourneyReserved(c)||!['home','sleeping'].includes(c.state))return;
  }
  u.phase='requesting';u.requestedAt=s.clock.seconds;u.urgent=c.health<CARE_URGENT_HEALTH;u.reason=c.health<CARE_NEED_HEALTH?'Cần khám do sức khỏe suy giảm':'Đến lịch kiểm tra sức khỏe';
}
const triage=(a,b)=>Number(b.care.urgent)-Number(a.care.urgent)||a.health-b.health||a.care.requestedAt-b.care.requestedAt||a.id.localeCompare(b.id);
export function updateHealthcare(s,emitEvent){
  const ctx=reconcileHealthcare(s),now=s.clock.seconds;if(s.healthcare.lastTick===now)return;
  s.healthcare.lastTick=now;assessHealth(s);
  const people=new Map(s.citizens.map(c=>[c.id,c])),inhabitants=new Map(),clinicians=new Set(ctx.rows.flatMap(r=>r.staff));
  for(const c of s.citizens){const row=inhabitants.get(c.home)||[];row.push(c);inhabitants.set(c.home,row);}
  for(const c of s.citizens){const u=c.care;
    if(u.phase==='returning'&&!c.journey&&c.goal===c.home&&c.state!=='blocked'){u.phase='idle';u.job=null;u.progress=0;u.required=0;u.paid=0;c.state='home';}
    if(['travelling','waiting','treatment'].includes(u.phase)){
      const r=ctx.byTile.get(u.tile);
      if(!r||r.assetId!==u.assetId){u.nextCheckAt=now+CARE_RETRY_SECONDS;returnHome(s,c,'Cơ sở đã tháo dỡ hoặc thay thế');continue;}
      if(u.phase==='travelling'&&!c.journey&&c.goal===r.tile&&c.state!=='blocked'){u.phase='waiting';u.queuedAt=now;c.state='at-clinic';}
      if(u.phase==='waiting'||u.phase==='treatment')c.state='at-clinic';
    }
    requestCare(s,c,clinicians.has(c.id));
  }
  const groups=patientGroups(s),rows=ctx.rows.map(r=>currentRow(s,r,people,groups));
  for(const r of rows){
    const atFacility=r.patients.map(id=>people.get(id)).filter(c=>c?.state==='at-clinic'&&!c.journey&&c.goal===r.tile);
    const treating=atFacility.filter(c=>c.care.phase==='treatment').sort((a,b)=>a.care.startedAt-b.care.startedAt||triage(a,b));
    const waiting=atFacility.filter(c=>c.care.phase==='waiting').sort(triage);
    let slots=Math.max(0,r.capacity-treating.length);
    for(const c of waiting){const u=c.care;if(!slots){u.reason=r.reason||'Đang chờ giường trống và nhân viên';continue;}
      const supplies=u.urgent?r.profile.urgentSupplies:r.profile.supplies;
      if(s.money<supplies){u.reason='Thiếu kinh phí vật tư điều trị';continue;}
      recordCash(s,`health-supply:${u.job}`,'healthcare-supplies',-supplies,u.job);
      u.paid=supplies;u.startedAt=now;u.required=u.urgent?r.profile.urgentSeconds:r.profile.treatmentSeconds;u.progress=0;u.phase='treatment';u.reason='Đang khám và điều trị';treating.push(c);slots--;
    }
    for(const [n,c] of treating.entries()){
      const u=c.care;if(n>=r.capacity){u.reason=r.reason||'Tạm dừng: thiếu nhân viên hoặc giường hoạt động';continue;}
      u.progress++;u.reason='Đang khám và điều trị';if(u.progress<u.required)continue;
      const before=c.health;c.health=Math.min(100,c.health+r.profile.recovery);syncHomeHealth(s,c.home,inhabitants.get(c.home));u.completed++;u.lastCompletedAt=now;u.lastCompletedSequence=s.nextEventId;u.lastJob=u.job;u.lastTile=r.tile;u.lastAssetId=r.assetId;u.lastStartedAt=u.startedAt;u.lastDuration=u.required;u.lastHealthBefore=before;u.lastHealthAfter=c.health;u.nextCheckAt=now+CHECKUP_INTERVAL_SECONDS;s.healthcare.completed++;
      emitEvent(s,'healthcare-treatment-completed',c.id,{job:u.job,facility:r.tile,asset:r.assetId,duration:u.required,healthBefore:before,healthAfter:c.health,result:before<CARE_NEED_HEALTH?'treated':'screened',applied:true});
      returnHome(s,c);
    }
  }
  // Admit to a bounded real waiting queue. Paths start at the citizen's current
  // destination/position; no arrival or recovery is granted on assignment.
  const reservations=new Map([...patientGroups(s)].map(([tile,patients])=>[tile,patients.length]));
  for(const c of s.citizens.filter(c=>c.care.phase==='requesting'&&!c.journey&&!c.busPlan&&c.state!=='blocked').sort(triage)){
    const u=c.care;
    const candidates=(ctx.byHome.get(c.home)||[]).filter(r=>r.capacity>0&&open(s.tiles[r.tile])&&route(s,c.goal,r.tile,'walk').length);
    const r=candidates.find(r=>(reservations.get(r.tile)||0)<r.queueCapacity);
    if(!r){u.reason=candidates.length?'Hàng chờ đã đầy':(ctx.rows.find(r=>r.reason)?.reason||'Chưa có cơ sở y tế còn công suất và đường tới nơi');continue;}
    u.episode++;u.job=`care-${c.id}-${u.episode}`;u.tile=r.tile;u.assetId=r.assetId;u.phase='travelling';u.queuedAt=-1;u.startedAt=-1;u.progress=0;u.required=0;u.paid=0;u.reason='Đang tới cơ sở y tế';reservations.set(r.tile,(reservations.get(r.tile)||0)+1);beginJourney(s,c,r.tile);
  }
}
// Called by campaign recording while the applied patient result is still at
// the facility. Pure validation: it does not allocate staff, progress or cash.
export function healthcareEventValid(s,e){
  if(e?.type!=='healthcare-treatment-completed'||e.applied!==true)return false;
  const c=s.citizens.find(c=>c.id===e.entity),u=c?.care,t=s.tiles[e.facility],p=HEALTHCARE_PROFILES[t?.kind],f=s.firms.find(f=>f.home===e.facility);
  if(!c||!u||!p||!f||!open(t)||c.state!=='at-clinic'||c.journey||c.goal!==e.facility||u.phase!=='treatment'||u.tile!==e.facility||u.assetId!==e.asset||t.assetId!==e.asset||u.lastTile!==e.facility||u.lastAssetId!==e.asset||u.lastCompletedSequence!==e.sequence||u.lastCompletedAt!==s.clock.seconds||u.lastJob!==e.job||u.job!==e.job||u.progress!==u.required||u.lastDuration!==e.duration||u.lastHealthBefore!==e.healthBefore||u.lastHealthAfter!==e.healthAfter||c.health!==e.healthAfter||e.healthAfter<e.healthBefore||!['screened','treated'].includes(e.result)||!s.ledger.receipts.includes(`health-supply:${e.job}`))return false;
  return f.employees.some(id=>{const staff=s.citizens.find(c=>c.id===id);return healthyStaff(staff)&&staff.work===f.id&&staff.state==='at-work'&&!staff.journey&&staff.goal===f.home&&!healthcareJourneyReserved(staff);});
}
export function validateCare(u,c,raw,size,tiles=raw.tiles){
  if(u==null)return;
  const bad=()=>{throw new Error('Tiến trình khám chữa bệnh không hợp lệ.');},integer=v=>Number.isSafeInteger(v)&&v>=0,time=v=>Number.isInteger(v)&&v>=-1&&v<=raw.clock.seconds,inMap=i=>Number.isInteger(i)&&i>=0&&i<size*size;
  if(!u||u.version!==HEALTHCARE_VERSION||!CARE_PHASES.includes(u.phase)||!['episode','completed','progress','required','paid','lastCompletedSequence','lastDuration'].every(k=>integer(u[k]))||u.completed>u.episode||u.progress>u.required||u.required>240||u.paid>360||!['requestedAt','queuedAt','startedAt','lastCompletedAt','lastStartedAt'].every(k=>time(u[k]))||!Number.isInteger(u.nextCheckAt)||u.nextCheckAt<0||u.nextCheckAt>raw.clock.seconds+CHECKUP_INTERVAL_SECONDS||typeof u.urgent!=='boolean'||typeof u.reason!=='string'||u.reason.length>180||!Number.isFinite(c.health)||c.health<0||c.health>100||![u.lastHealthBefore,u.lastHealthAfter].every(h=>Number.isFinite(h)&&h>=0&&h<=100)||u.lastHealthAfter<u.lastHealthBefore||u.lastCompletedSequence>=raw.nextEventId)bad();
  if(u.completed===0){if(u.lastCompletedAt!==-1||u.lastCompletedSequence!==0||u.lastJob!==null||u.lastTile!==null||u.lastAssetId!==null||u.lastStartedAt!==-1||u.lastDuration!==0)bad();}
  else if(!inMap(u.lastTile)||typeof u.lastAssetId!=='string'||!u.lastAssetId||u.lastStartedAt<0||u.lastCompletedAt<u.lastStartedAt||u.lastDuration<60||u.lastCompletedAt-u.lastStartedAt<u.lastDuration-1||u.lastCompletedSequence===0||typeof u.lastJob!=='string'||!u.lastJob.startsWith(`care-${c.id}-`)||!raw.ledger?.receipts?.includes(`health-supply:${u.lastJob}`))bad();
  if(['travelling','waiting','treatment'].includes(u.phase)){
    if(!inMap(u.tile)||!HEALTHCARE_PROFILES[tiles[u.tile]?.kind]||u.assetId!==tiles[u.tile].assetId||u.job!==`care-${c.id}-${u.episode}`||u.requestedAt<0)bad();
    if(u.phase==='travelling'&&(u.required!==0||u.progress!==0||u.paid!==0))bad();
    if(u.phase==='waiting'&&(c.goal!==u.tile||c.journey||c.state!=='at-clinic'||u.queuedAt<0||u.required!==0||u.progress!==0||u.paid!==0))bad();
    if(u.phase==='treatment'){const p=HEALTHCARE_PROFILES[tiles[u.tile].kind];if(c.goal!==u.tile||c.journey||c.state!=='at-clinic'||u.startedAt<0||u.queuedAt<0||u.progress>=u.required||u.required!==(u.urgent?p.urgentSeconds:p.treatmentSeconds)||u.paid!==(u.urgent?p.urgentSupplies:p.supplies)||!raw.ledger?.receipts?.includes(`health-supply:${u.job}`))bad();}
  }else if(u.tile!==null||u.assetId!==null)bad();
  if(u.phase==='idle'&&(u.job!==null||u.progress!==0||u.required!==0||u.paid!==0)||u.phase==='requesting'&&(u.job!==null||u.requestedAt<0))bad();
}
export function validateHealthcare(raw,size,tiles=raw.tiles){
  if(raw.healthcareVersion==null&&raw.healthcare==null)return;
  const h=raw.healthcare;if(raw.healthcareVersion!==HEALTHCARE_VERSION||!h||h.version!==HEALTHCARE_VERSION||!Number.isSafeInteger(h.completed)||h.completed<0||h.completed>1e9||!Number.isInteger(h.lastAssessmentAt)||h.lastAssessmentAt<0||h.lastAssessmentAt>raw.clock.seconds||h.lastTick!=null&&(!Number.isInteger(h.lastTick)||h.lastTick<0||h.lastTick>raw.clock.seconds))throw new Error('Trạng thái y tế không hợp lệ.');
  if(raw.citizens.reduce((n,c)=>n+(c.care?.completed||0),0)>h.completed)throw new Error('Số lượt điều trị không đối chiếu được.');
  for(const c of raw.citizens)validateCare(c.care,c,raw,size,tiles);
}
