import {LEISURE_PROFILES,LEISURE_VERSION,LEISURE_VISIT_COOLDOWN,LEISURE_RETRY_SECONDS,LEISURE_TREE_UPDATE_SECONDS,LEISURE_PHASES,WALKABLE_MAX_METERS} from '../../config/leisure.js';
import {capacityFactor} from '../../config/building-economy.js';
import {CELL_METERS} from '../../config/simulation.js';
import {route} from './roads.js';
import {roadForAccess,roadNeighbors} from './road-network.js';
import {startJourney} from './citizens.js';
import {distance,clamp} from './world.js';
import {weatherState} from './weather.js';
import {calendar} from './clock.js';

const caches=new WeakMap(),walkCaches=new WeakMap();
const healthcareBusy=c=>['requesting','travelling','waiting','treatment','returning'].includes(c.care?.phase);
const clinicalReservation=c=>['travelling','waiting','treatment','returning'].includes(c.care?.phase);
const open=t=>!!t?.active&&!!t.connected&&!!t.power&&!!t.water&&!!t.sewage&&(t.fire||0)<30;
const hash=id=>[...id].reduce((v,ch)=>(Math.imul(v,31)+ch.charCodeAt(0))>>>0,26);
export const leisureJourneyReserved=c=>['travelling','visiting','returning'].includes(c.leisure?.phase);
export const leisureArrivalState=(c,goal)=>c.leisure?.tile===goal&&['travelling','visiting'].includes(c.leisure.phase)?'at-park':null;
function createVisit(s,c){return {version:LEISURE_VERSION,phase:'idle',tile:null,assetId:null,job:null,episode:0,requestedAt:-1,startedAt:-1,progress:0,required:0,completed:0,lastCompletedAt:-1,lastCompletedSequence:0,lastJob:null,lastTile:null,lastAssetId:null,lastDuration:0,nextVisitAt:s.clock.seconds+45+hash(c.id)%120,reason:''};}
function ensureLeisure(s){
 s.leisureVersion=LEISURE_VERSION;s.leisure??={version:LEISURE_VERSION,lastTick:null,lastTreesAt:s.clock.seconds,parks:[],completed:0};
 for(const c of s.citizens)c.leisure??=createVisit(s,c);
 const old=new Map(s.leisure.parks.map(p=>[p.assetId,p]));
 s.leisure.parks=s.tiles.flatMap((t,tile)=>{const p=LEISURE_PROFILES[t.kind];if(!p)return[];const row=old.get(t.assetId)||{tile,kind:t.kind,assetId:t.assetId,completed:0,trees:p.trees.map(([x,y],i)=>({id:`tree-${t.assetId}-${i}`,x,y,health:100}))};row.tile=tile;row.kind=t.kind;return[row];});
}
function walkDistance(s,home,to){const roads=route(s,home,to,'walk');return roads.length?(roads.length+1)*CELL_METERS:Infinity;}
function parkCapacity(s,r){const t=s.tiles[r.tile],p=LEISURE_PROFILES[r.kind];return open(t)?Math.floor(p.capacity*capacityFactor(t)*(s.budgets?.park??100)/100):0;}
export function reconcileLeisure(s,{force=false}={}){
 const stamp=`${s.graphVersion}:${s.citizens.length}:${s.budgets?.park??100}`,old=caches.get(s);
 if(!force&&old?.stamp===stamp&&old.network===s.network&&old.state===s.leisure&&old.citizens===s.citizens)return old;
 ensureLeisure(s);
 const rows=s.leisure.parks,byTile=new Map(rows.map(r=>[r.tile,r])),byHome=new Map();
 for(const c of s.citizens)if(!byHome.has(c.home))byHome.set(c.home,rows.filter(r=>walkDistance(s,c.home,r.tile)<=LEISURE_PROFILES[r.kind].rangeMeters).sort((a,b)=>distance(c.home,a.tile)-distance(c.home,b.tile)||a.tile-b.tile));
 const value={stamp,network:s.network,state:s.leisure,citizens:s.citizens,rows,byTile,byHome};caches.set(s,value);return value;
}
function facilityReason(t){return !t.connected?'Thiếu đường nối cổng':!t.power?'Thiếu điện chiếu sáng':!t.water?'Thiếu nước tưới':!t.sewage?'Thiếu xử lý nước thải':(t.fire||0)>=30?'Công viên đang có cháy':!t.active?'Công viên chưa hoạt động':'';}
function facilityRow(s,r,visitors){const tile=r.tile,capacity=parkCapacity(s,r);return {tile,kind:r.kind,assetId:r.assetId,capacity,reserved:visitors.length,travelling:visitors.filter(c=>c.leisure.phase==='travelling').length,present:visitors.filter(c=>c.leisure.phase==='visiting'&&c.state==='at-park'&&!c.journey&&c.goal===tile).length,completed:r.completed,healthyTrees:r.trees.filter(t=>t.health>=60).length,trees:r.trees.map(t=>({...t})),reason:facilityReason(s.tiles[tile])};}
export function leisureFacilitySnapshot(s,tile){const r=reconcileLeisure(s).byTile.get(tile);return r?facilityRow(s,r,s.citizens.filter(c=>c.leisure?.tile===tile&&c.leisure.assetId===r.assetId&&['travelling','visiting'].includes(c.leisure.phase))):null;}
export function walkableHousing(s){
 const homes=s.tiles.flatMap((t,i)=>t.kind==='residential'&&t.residents>0?[{tile:i,residents:t.residents}]:[]),destinations=s.tiles.flatMap((t,i)=>(LEISURE_PROFILES[t.kind]||['commercial','school','secondarySchool'].includes(t.kind))&&open(t)?[i]:[]);
 // A multi-source walk graph finds the nearest actual amenity in O(roads),
 // instead of one breadth-first route for every home/amenity pair each render.
 const key=`${s.graphVersion}:${destinations.join(',')}`;let cache=walkCaches.get(s);
 if(!cache||cache.key!==key||cache.network!==s.network){const hops=new Map(),queue=[];for(const i of destinations){const road=roadForAccess(s,i,'walk');if(road!==undefined&&!hops.has(road)){hops.set(road,0);queue.push(road);}}
  const maxHops=Math.floor(WALKABLE_MAX_METERS/CELL_METERS)-2;
  for(let n=0;n<queue.length;n++){const i=queue[n],step=hops.get(i);if(step>=maxHops)continue;for(const other of roadNeighbors(s,i,'walk'))if(!hops.has(other)){hops.set(other,step+1);queue.push(other);}}
  cache={key,network:s.network,hops};walkCaches.set(s,cache);
 }
 let accessible=0,total=0;for(const h of homes){total+=h.residents;const road=roadForAccess(s,h.tile,'walk');if(cache.hops.has(road))accessible+=h.residents;}
 return {population:total,accessible,pct:total?accessible/total*100:undefined};
}
export function leisureSnapshot(s){const ctx=reconcileLeisure(s),visitors=new Map(ctx.rows.map(r=>[r.tile,[]]));for(const c of s.citizens)if(['travelling','visiting'].includes(c.leisure?.phase)&&ctx.byTile.get(c.leisure.tile)?.assetId===c.leisure.assetId)visitors.get(c.leisure.tile).push(c);const rows=ctx.rows.map(r=>facilityRow(s,r,visitors.get(r.tile))),walkable=walkableHousing(s);return {parks:rows.length,capacity:rows.reduce((n,r)=>n+r.capacity,0),present:rows.reduce((n,r)=>n+r.present,0),travelling:rows.reduce((n,r)=>n+r.travelling,0),completed:s.leisure.completed,healthyTrees:rows.reduce((n,r)=>n+r.healthyTrees,0),walkableHousingPct:walkable.pct,walkable,rows};}
function beginWalk(s,c,goal){
 if(c.journey)c.retryOrigin=Math.min(s.tiles.length-1,Math.max(0,Math.floor(c.position.y/CELL_METERS)*s.mapSize+Math.floor(c.position.x/CELL_METERS)));
 c.journey=null;c.busPlan=null;c.missionTrip=null;c.state='home';const privateCar=c.vehicle;c.vehicle=null;
 try{startJourney(s,c,goal,route,s.mapSize,false);}finally{c.vehicle=privateCar;}
 if(c.missionTrip)c.missionTrip.purpose=goal===c.home?'home':'leisure';
}
function clearVisit(u){u.phase='idle';u.tile=null;u.assetId=null;u.job=null;u.progress=0;u.required=0;u.startedAt=-1;}
function returnHome(s,c,reason=''){
 const u=c.leisure;u.phase='returning';u.tile=null;u.assetId=null;u.reason=reason;
 if(c.goal===c.home&&!c.journey&&c.state!=='blocked'){clearVisit(u);c.state='home';return;}
 beginWalk(s,c,c.home);
}
function updateTrees(s){
 const u=s.leisure;if(s.clock.seconds-u.lastTreesAt<LEISURE_TREE_UPDATE_SECONDS)return;const minutes=Math.min(60,(s.clock.seconds-u.lastTreesAt)/LEISURE_TREE_UPDATE_SECONDS);u.lastTreesAt=s.clock.seconds;
 const weather=weatherState(s);
 for(const r of u.parks){const t=s.tiles[r.tile],water=!!t.water,budget=(s.budgets?.park??100)/100;
  for(const tree of r.trees){const damage=(!water?.4:0)+(weather.kind==='heat'?.15:0)+(t.fire||0)/100*3+(t.pollution||0)/100*.15;const care=water&&(t.fire||0)<20?.3*Math.min(1.5,budget):0;tree.health=clamp(tree.health+(care-damage)*minutes,0,100);}
 }
}
export function updateLeisure(s,emitEvent){
 const ctx=reconcileLeisure(s),now=s.clock.seconds;if(s.leisure.lastTick===now)return;s.leisure.lastTick=now;updateTrees(s);
 for(const c of s.citizens){const u=c.leisure;
  // Healthcare or a real duty assignment owns the current journey. Never send
  // a patient away from treatment just because a prior park trip existed.
  if(c.municipalAssignment||clinicalReservation(c)){if(leisureJourneyReserved(c)){clearVisit(u);u.nextVisitAt=now+LEISURE_RETRY_SECONDS;u.reason='Nhường lịch cho y tế / nhiệm vụ công';}continue;}
  if(u.phase==='returning'&&!c.journey&&c.goal===c.home&&c.state!=='blocked'){clearVisit(u);c.state='home';}
  if(['travelling','visiting'].includes(u.phase)){
   const r=ctx.byTile.get(u.tile);
   if(!r||r.assetId!==u.assetId||!parkCapacity(s,r)){u.nextVisitAt=now+LEISURE_RETRY_SECONDS;returnHome(s,c,!r?'Công viên đã tháo dỡ':'Công viên tạm đóng');continue;}
   if(u.phase==='travelling'&&!c.journey&&c.goal===r.tile&&c.state!=='blocked'){u.phase='visiting';u.startedAt=now;u.required=LEISURE_PROFILES[r.kind].visitSeconds;u.progress=0;c.state='at-park';u.reason='Đang sử dụng công viên';}
  }
 }
 const visitorsByPark=new Map(ctx.rows.map(r=>[r.tile,[]]));
 for(const c of s.citizens)if(c.leisure?.phase==='visiting'&&ctx.byTile.get(c.leisure.tile)?.assetId===c.leisure.assetId&&c.goal===c.leisure.tile&&c.state==='at-park'&&!c.journey&&!healthcareBusy(c)&&!c.municipalAssignment)visitorsByPark.get(c.leisure.tile).push(c);
 for(const r of ctx.rows){const capacity=parkCapacity(s,r);if(!capacity)continue;
  const visitors=visitorsByPark.get(r.tile).sort((a,b)=>a.leisure.startedAt-b.leisure.startedAt||a.id.localeCompare(b.id));
  for(const c of visitors.slice(0,capacity)){const u=c.leisure;u.progress++;if(u.progress<u.required)continue;
   u.completed++;u.lastCompletedAt=now;u.lastCompletedSequence=s.nextEventId;u.lastJob=u.job;u.lastTile=r.tile;u.lastAssetId=r.assetId;u.lastDuration=u.required;u.nextVisitAt=now+LEISURE_VISIT_COOLDOWN;s.leisure.completed++;r.completed++;
   emitEvent(s,'leisure-visit-completed',c.id,{job:u.job,place:'park',facility:r.tile,asset:r.assetId,duration:u.required,applied:true});returnHome(s,c);
  }
 }
 const reservations=new Map(ctx.rows.map(r=>[r.tile,0])),time=now%86400,weekday=calendar(now).weekday;
 for(const c of s.citizens)if(['travelling','visiting'].includes(c.leisure?.phase)&&ctx.byTile.get(c.leisure.tile)?.assetId===c.leisure.assetId)reservations.set(c.leisure.tile,reservations.get(c.leisure.tile)+1);
 for(const c of s.citizens){const u=c.leisure;if(u.phase!=='idle'||now<u.nextVisitAt||c.journey||c.busPlan||c.municipalAssignment||healthcareBusy(c)||!['home','sleeping'].includes(c.state)||c.health<40||c.state==='sleeping'&&hash(c.id)%4!==0)continue;
  // Reserve the school commute before departure, so a nearby park cannot
  // capture a pupil's journey between 07:00 and the end of the school day.
  if(c.study?.tile!=null&&weekday!==0&&weekday!==6&&time>=7*3600&&time<14*3600)continue;
  const work=s.firms.find(f=>f.id===c.work);
  if(work?.active&&(work.serviceShift?Math.floor(time/(8*3600))===Math.max(0,work.employees.indexOf(c.id))%3:time>=c.schedule.depart-1800&&time<c.schedule.return))continue;
  const candidates=(ctx.byHome.get(c.home)||[]).filter(r=>parkCapacity(s,r)>(reservations.get(r.tile)||0)&&route(s,c.goal,r.tile,'walk').length),r=candidates[0];
  if(!r){u.nextVisitAt=now+LEISURE_RETRY_SECONDS;u.reason='Chưa có công viên có đường đi bộ và chỗ trống';continue;}
  u.episode++;u.job=`leisure-${c.id}-${u.episode}`;u.tile=r.tile;u.assetId=r.assetId;u.phase='travelling';u.requestedAt=now;u.startedAt=-1;u.progress=0;u.required=0;u.reason='Đi bộ tới công viên';reservations.set(r.tile,(reservations.get(r.tile)||0)+1);beginWalk(s,c,r.tile);
 }
}
export function leisureEventValid(s,e){
 const c=s.citizens.find(c=>c.id===e.entity),u=c?.leisure,r=s.leisure?.parks.find(r=>r.tile===e.facility&&r.assetId===e.asset);
 return e.type==='leisure-visit-completed'&&e.applied===true&&e.place==='park'&&c&&u&&r&&c.state==='at-park'&&!c.journey&&c.goal===r.tile&&u.phase==='visiting'&&u.progress===u.required&&u.required===LEISURE_PROFILES[r.kind].visitSeconds&&u.lastCompletedSequence===e.sequence&&u.lastCompletedAt===s.clock.seconds&&u.lastJob===e.job&&u.job===e.job&&u.lastAssetId===e.asset&&u.lastTile===e.facility&&e.duration===u.required;
}
export function validateLeisure(raw,size,tiles=raw.tiles){
 if(raw.leisureVersion==null&&raw.leisure==null)return;
 const bad=()=>{throw new Error('Hoạt động công viên không hợp lệ.');},integer=n=>Number.isSafeInteger(n)&&n>=0,time=n=>Number.isInteger(n)&&n>=-1&&n<=raw.clock.seconds,tile=n=>integer(n)&&n<size*size,u=raw.leisure;
 if(raw.leisureVersion!==LEISURE_VERSION||!u||u.version!==LEISURE_VERSION||!integer(u.completed)||!time(u.lastTreesAt)||u.lastTick!=null&&!time(u.lastTick)||!Array.isArray(u.parks)||u.parks.length>size*size)bad();
 const parks=new Map();for(const p of u.parks){const profile=LEISURE_PROFILES[p.kind];if(!tile(p.tile)||!profile||parks.has(p.tile)||tiles[p.tile]?.kind!==p.kind||tiles[p.tile]?.assetId!==p.assetId||!integer(p.completed)||!Array.isArray(p.trees)||p.trees.length!==profile.trees.length||p.trees.some((t,n)=>t.id!==`tree-${p.assetId}-${n}`||t.x!==profile.trees[n][0]||t.y!==profile.trees[n][1]||!Number.isFinite(t.health)||t.health<0||t.health>100))bad();parks.set(p.tile,p);}
 let completed=0;for(const c of raw.citizens){const v=c.leisure;if(v==null)continue;
  if(v.version!==LEISURE_VERSION||!LEISURE_PHASES.includes(v.phase)||!['episode','progress','required','completed','lastCompletedSequence','lastDuration'].every(k=>integer(v[k]))||v.completed>v.episode||v.progress>v.required||v.required>45||!['requestedAt','startedAt','lastCompletedAt'].every(k=>time(v[k]))||v.lastCompletedSequence>=raw.nextEventId||!integer(v.nextVisitAt)||v.nextVisitAt>raw.clock.seconds+LEISURE_VISIT_COOLDOWN||typeof v.reason!=='string'||v.reason.length>180)bad();completed+=v.completed;
  if(['travelling','visiting'].includes(v.phase)){const p=parks.get(v.tile);if(!p||p.assetId!==v.assetId||v.job!==`leisure-${c.id}-${v.episode}`||v.requestedAt<0||clinicalReservation(c)||c.municipalAssignment)bad();if(v.phase==='travelling'&&(v.progress||v.required||v.startedAt!==-1))bad();if(v.phase==='visiting'&&(c.goal!==v.tile||c.journey||c.state!=='at-park'||v.startedAt<0||v.required!==LEISURE_PROFILES[p.kind].visitSeconds||v.progress>=v.required))bad();}
  else if(v.tile!==null||v.assetId!==null||v.phase==='idle'&&(v.job!==null||v.progress||v.required||v.startedAt!==-1))bad();
  if(v.completed===0){if(v.lastCompletedAt!==-1||v.lastCompletedSequence!==0||v.lastJob!==null||v.lastTile!==null||v.lastAssetId!==null||v.lastDuration!==0)bad();}
  else if(!tile(v.lastTile)||typeof v.lastAssetId!=='string'||typeof v.lastJob!=='string'||!v.lastJob.startsWith(`leisure-${c.id}-`)||!v.lastCompletedSequence||v.lastCompletedAt<0||![30,45].includes(v.lastDuration))bad();
 }
 if(completed>u.completed||u.parks.reduce((n,p)=>n+p.completed,0)>u.completed)bad();
}
