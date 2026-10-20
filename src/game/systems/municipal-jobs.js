import {MUNICIPAL_PROFILES,MUNICIPAL_MAX_JOBS,MUNICIPAL_MAX_HISTORY,MUNICIPAL_MIN_WASTE,MUNICIPAL_WASTE_PER_RESIDENT_DAY,MUNICIPAL_JOB_SCAN_SECONDS,FIRE_INSPECTION_INITIAL_SECONDS,FIRE_INSPECTION_COOLDOWN_SECONDS} from '../../config/municipal-jobs.js';
import {capacityFactor} from '../../config/building-economy.js';
import {DAY_SECONDS,STEP_SECONDS,CELL_METERS} from '../../config/simulation.js';
import {route} from './roads.js';
import {mobilityPath} from './mobility-path.js';
import {remainingRouteValid} from './road-network.js';
import {roadControllers} from './road-controller.js';
import {weatherState} from './weather.js';
import {position,distance,distanceMeters,clamp} from './world.js';
import {recordCash} from './economy.js';

const serviceBudget=p=>({firefighting:'fire',security_patrol:'police',waste_collection:'waste'}[p.service]);
const operational=t=>!!t?.active&&!!t.sewage&&(t.fire||0)<60;
const pointTile=(s,p)=>Math.min(s.tiles.length-1,Math.max(0,Math.floor(p.y/CELL_METERS)*s.mapSize+Math.floor(p.x/CELL_METERS)));
const profileFor=d=>MUNICIPAL_PROFILES[d.kind];
const now=s=>s.clock.seconds;
const activeJob=j=>!['completed','cancelled'].includes(j.status);
const reconcileCaches=new WeakMap();
export const municipalPosts=t=>MUNICIPAL_PROFILES[t?.kind]?Math.floor(MUNICIPAL_PROFILES[t.kind].posts*capacityFactor(t)):0;
export function createMunicipal(s){
 const generated=s.tiles.reduce((sum,t)=>sum+(t.kind==='residential'?(t.garbage||0):0),0);
 return {version:1,nextJob:1,lastTick:null,lastScan:-1,depots:[],jobs:[],history:[],patrols:{},inspections:{},waste:{at:now(s),generated,collected:0}};
}
function peopleMap(s){return new Map(s.citizens.map(c=>[c.id,c]));}
function staffRows(s,d,people){
 const f=s.firms.find(f=>f.home===d.tile),p=profileFor(d);
 return (f?.employees||[]).map(id=>people.get(id)).filter(c=>c&&c.work===f.id&&c.age>=18&&c.age<65&&c.health>=40&&route(s,c.home,d.tile,'walk').length&&(!c.municipalAssignment||c.municipalAssignment.assetId===d.assetId)).slice(0,municipalPosts(s.tiles[d.tile]));
}
function reason(s,d,staff){const t=s.tiles[d.tile],p=profileFor(d);return !t.connected?'Thiếu đường nối cổng':!t.power?'Thiếu điện':!t.water?'Thiếu nước sạch':!t.sewage?'Thiếu xử lý nước thải':(t.fire||0)>=60?'Trạm không an toàn':staff.length<p.crew?'Thiếu nhân viên có đường tới trạm':'';}
function releaseCrew(s,v,d){
 for(const id of v.crew){const c=s.citizens.find(c=>c.id===id);if(!c||c.municipalAssignment?.vehicleId!==v.id)continue;
  delete c.municipalAssignment;c.journey=null;
  if(d&&s.tiles[d.tile]?.assetId===d.assetId){c.goal=d.tile;c.position={...v.position};c.state='at-work';c.waitReason='';}
  else{c.goal=pointTile(s,c.position);c.retryOrigin=c.goal;c.retryGoal=c.home;c.retryVersion=-1;c.state='blocked';c.waitReason='Trạm đã tháo dỡ; tìm đường về nhà';}
 }
 v.crew=[];
}
function archive(s,j){if(j.archived)return;j.archived=true;s.municipal.history.push({id:j.id,service:j.service,target:j.target,targetAsset:j.targetAsset,facility:j.facility,facilityAsset:j.facilityAsset,status:j.status,amount:j.amount||0,startedAt:j.startedAt,completedAt:j.completedAt??null,resultSequence:j.resultSequence||0,reason:j.reason||'',...(j.service==='fire_inspection'?{facilityKind:j.facilityKind,inspectionStartedAt:j.inspectionStartedAt??null,inspectionCostBC:j.inspectionCostBC??0,inspectionSeconds:j.inspectionSeconds??0,inspectionWork:j.work,hazardBefore:j.hazardBefore??null,hazardAfter:j.hazardAfter??null,hazardReduction:j.hazardReduction??0}:{})});s.municipal.history=s.municipal.history.slice(-MUNICIPAL_MAX_HISTORY);}
function cancel(s,j,v,d,why){
 j.reason=why;j.cancelledAt=now(s);j.cancelled=true;
 if(v&&d&&s.tiles[d.tile]?.assetId===d.assetId){j.status='returning';v.state='returning';if(!setJourney(s,v,pointTile(s,v.position),d.tile)){v.state='blocked';v.reason='Không có đường quay về trạm';}return;}
 j.status='cancelled';archive(s,j);if(v){releaseCrew(s,v,null);v.jobId=null;v.journey=null;v.speed=0;v.reason=why;}
}
export function reconcileMunicipal(s,{force=true}={}){
 s.municipal??=createMunicipal(s);s.municipalVersion=1;
 const budgets=['fire','police','waste'].map(k=>s.budgets?.[k]??100).join(','),cached=reconcileCaches.get(s);
 if(!force&&cached?.state===s.municipal&&cached.tiles===s.tiles&&cached.graph===s.graphVersion&&cached.budgets===budgets)return s.municipal;
 const u=s.municipal,old=new Map(u.depots.map(d=>[d.assetId,d]));u.inspections??={};
 const assets=new Set(s.tiles.filter(t=>t.assetId).map(t=>t.assetId));for(const id of Object.keys(u.inspections))if(!assets.has(id))delete u.inspections[id];
 const rows=s.tiles.flatMap((t,tile)=>{const p=MUNICIPAL_PROFILES[t.kind];if(!p)return[];const prior=old.get(t.assetId),d=prior||{tile,assetId:t.assetId,kind:t.kind,fleet:[]};d.tile=tile;d.kind=t.kind;
  const vehicles=Math.max(1,Math.floor(p.vehicles*capacityFactor(t)*((s.budgets?.[serviceBudget(p)]??100)/100)));
  for(let i=d.fleet.length;i<vehicles;i++)d.fleet.push({id:`municipal-${t.assetId}-${i}`,kind:'municipal',fleetIndex:i,artId:p.artId,state:'idle',position:position(tile,s.mapSize,s),visualYaw:0,speed:0,travelled:0,journey:null,jobId:null,crew:[],water:p.water||0,cargo:0,readyAt:now(s),reason:''});
  // A busy upgraded vehicle may finish its trip even if the budget is reduced.
  d.fleet=d.fleet.filter((v,i)=>i<vehicles||v.jobId);return[d];
 });
 const byAsset=new Map(rows.map(d=>[d.assetId,d]));
 for(const d of u.depots)if(!byAsset.has(d.assetId))for(const v of d.fleet){const j=u.jobs.find(j=>j.id===v.jobId);if(j)cancel(s,j,v,null,'Trạm đã tháo dỡ');else releaseCrew(s,v,null);}
 u.depots=rows;
 for(const j of u.jobs.filter(j=>j.status==='queued'))if(s.tiles[j.target]?.assetId!==j.targetAsset)cancel(s,j,null,null,'Công trình đích đã tháo dỡ');
 for(const j of u.jobs.filter(activeJob))if(!byAsset.has(j.facilityAsset)&&j.facilityAsset!=null){j.status='cancelled';j.reason='Trạm đã tháo dỡ';archive(s,j);}
 // Any crew orphaned by a legacy or demolition transition returns through roads.
 const fleetIds=new Set(rows.flatMap(d=>d.fleet.map(v=>v.id)));
 for(const c of s.citizens)if(c.municipalAssignment&&!fleetIds.has(c.municipalAssignment.vehicleId)){const temporary={id:c.municipalAssignment.vehicleId,crew:[c.id]};releaseCrew(s,temporary,null);}
 u.jobs=u.jobs.filter(activeJob);
 reconcileCaches.set(s,{state:u,tiles:s.tiles,graph:s.graphVersion,budgets,buildings:s.tiles.flatMap((t,i)=>t.assetId?[i]:[]),homes:s.tiles.flatMap((t,i)=>t.kind==='residential'?[i]:[])});return u;
}
function addJob(s,service,target,priority){
 const u=s.municipal,t=s.tiles[target];if(!t.assetId||u.jobs.length>=MUNICIPAL_MAX_JOBS||u.jobs.some(j=>j.service===service&&j.targetAsset===t.assetId))return;
 u.jobs.push({id:`municipal-job-${u.nextJob++}`,service,target,targetAsset:t.assetId,priority,status:'queued',createdAt:now(s),startedAt:null,facility:null,facilityAsset:null,vehicleId:null,work:0,amount:0,resultSequence:0});
}
function generateRequests(s){
 const u=s.municipal;
 for(const i of reconcileCaches.get(s).buildings){const t=s.tiles[i];
  if((t.fire||0)>1&&t.assetId)addJob(s,'firefighting',i,100+(t.fire||0));
  if(['residential','commercial','industrial'].includes(t.kind)&&t.assetId){
   const inspection=u.inspections[t.assetId]??={dueAt:now(s)+FIRE_INSPECTION_INITIAL_SECONDS,lastCompletedAt:null};
   if(now(s)>=inspection.dueAt&&(t.fire||0)<=1)addJob(s,'fire_inspection',i,5+Math.min(40,t.hazard||0));
  }
  if(t.kind==='residential'&&t.residents>0){
   if((t.garbage||0)>=MUNICIPAL_MIN_WASTE)addJob(s,'waste_collection',i,20+(t.garbage||0));
   if(now(s)-(u.patrols[t.assetId]??-600)>=600)addJob(s,'security_patrol',i,10+(t.crime||0));
  }
 }
 u.jobs.sort((a,b)=>b.priority-a.priority||a.createdAt-b.createdAt||a.id.localeCompare(b.id));u.lastScan=now(s);
}
function setJourney(s,v,origin,destination){
 const roads=route(s,origin,destination,'car');if(!roads.length)return false;
 v.journey={id:`${v.id}-${now(s)}`,origin,destination,mode:'car',speed:profileFor(s.municipal.depots.find(d=>d.fleet.includes(v))).speed,path:mobilityPath(s,origin,destination,roads,s.mapSize,'car',v.position),segment:0,distance:0,departedAt:now(s),graphVersion:s.graphVersion,laneVersion:1};v.goal=destination;v.reason='';return true;
}
function dispatch(s,people){
 const u=s.municipal;
 for(const d of u.depots){const p=profileFor(d),staff=staffRows(s,d,people),available=staff.filter(c=>!c.municipalAssignment&&!c.journey&&c.state==='at-work'&&c.goal===d.tile);if(!operational(s.tiles[d.tile])||staff.length<p.crew)continue;
  for(const v of d.fleet){if(v.state!=='idle'||now(s)<v.readyAt||available.length<p.crew)continue;
   const candidates=u.jobs.filter(j=>j.status==='queued'&&(j.service===p.service||j.service==='fire_inspection'&&p.service==='firefighting')&&distance(j.target,d.tile)<=p.range*Math.sqrt(capacityFactor(s.tiles[d.tile])*(s.budgets?.[serviceBudget(p)]??100)/100)).sort((a,b)=>b.priority-a.priority||distance(a.target,d.tile)-distance(b.target,d.tile)||a.createdAt-b.createdAt);
   const j=candidates.find(j=>route(s,d.tile,j.target,'car').length&&route(s,j.target,d.tile,'car').length);if(!j)continue;
   if(j.service==='fire_inspection'&&s.money<p.inspectionCostBC){j.reason='Thiếu ngân quỹ vật tư kiểm tra phòng cháy';continue;}
   if(!setJourney(s,v,d.tile,j.target))continue;
   v.jobId=j.id;v.state='outbound';v.crew=available.splice(0,p.crew).map(c=>c.id);v.reason='';j.status='outbound';j.facility=d.tile;j.facilityAsset=d.assetId;j.vehicleId=v.id;j.startedAt=now(s);if(j.service==='fire_inspection')j.facilityKind=d.kind;
   for(const id of v.crew){const c=people.get(id);c.municipalAssignment={vehicleId:v.id,facility:d.tile,assetId:d.assetId};}
  }
 }
}
function move(s,v,control,factor){
 const j=v.journey;if(!j)return true;
 if(j.graphVersion!==s.graphVersion){if(!remainingRouteValid(s,j.path.slice(Math.max(0,j.segment-1)),'car')){v.state='blocked';v.reason='Đường đã bị ngắt; chờ kết nối lại';v.speed=0;return false;}j.graphVersion=s.graphVersion;}
 const controlled=control(v);v.speed=j.actualSpeed=controlled.speed*factor;v.reason=controlled.reason;let remaining=v.speed*STEP_SECONDS;
 while(remaining>0&&j.segment<j.path.length-1){const a=j.path[j.segment],b=j.path[j.segment+1],length=distanceMeters(a,b),travelled=Math.min(remaining,Math.max(0,length-j.distance));j.distance+=travelled;remaining-=travelled;v.travelled+=travelled;const t=length?Math.min(1,j.distance/length):1;v.position={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};v.visualYaw=Math.atan2(b.x-a.x,b.y-a.y);if(j.distance>=length-1e-8){j.segment++;j.distance=0;}}
 if(j.segment===j.path.length-1){v.journey=null;v.speed=0;return true;}return false;
}
function synchronizeCrew(s,v,d,people){for(const id of v.crew){const c=people.get(id);if(!c||c.municipalAssignment?.vehicleId!==v.id)continue;c.position={...v.position};c.goal=v.goal??d.tile;c.journey=v.journey;c.state=v.journey?'in-vehicle':'at-work';c.waitReason=v.reason||'';}}
function complete(s,j,v,emitEvent){
 if(j.resultSequence||j.amount<=0)return;
 j.completedAt=now(s);j.resultSequence=s.nextEventId;
 emitEvent(s,'municipal-job-completed',j.id,{job:j.id,service:j.service,target:j.target,targetAsset:j.targetAsset,facility:j.facility,facilityAsset:j.facilityAsset,vehicle:v.id,amount:j.amount,applied:true,...(j.service==='fire_inspection'?{inspectionStartedAt:j.inspectionStartedAt,inspectionSeconds:j.inspectionSeconds,inspectionCostBC:j.inspectionCostBC,hazardBefore:j.hazardBefore,hazardAfter:j.hazardAfter,hazardReduction:j.hazardReduction}:{})});
}
function returnToDepot(s,j,v,d){j.status='returning';v.state='returning';if(!setJourney(s,v,j.target,d.tile)){v.state='blocked';v.reason='Không có đường quay về trạm';}}
function finishReturn(s,j,v,d,emitEvent){
 const p=profileFor(d);
 if(j.service==='waste_collection'&&v.cargo>0){s.municipal.waste.collected+=v.cargo;if(!j.cancelled){j.amount=v.cargo;complete(s,j,v,emitEvent);}v.cargo=0;}
 j.status=j.resultSequence?'completed':'cancelled';j.reason=j.resultSequence?'':j.reason||'Không còn nhu cầu hoặc hết tài nguyên';archive(s,j);releaseCrew(s,v,d);v.jobId=null;v.state='refilling';v.refillJob=j.id;v.readyAt=now(s)+p.refillSeconds;v.goal=d.tile;v.reason='Dỡ rác / chuẩn bị xe';
}
function perform(s,j,v,d,emitEvent){
 const t=s.tiles[j.target],p=profileFor(d);
 if(j.service==='fire_inspection'){
  if((t.fire||0)>1){cancel(s,j,v,d,'Phát hiện cháy; ưu tiên đội dập lửa');return;}
  if(!operational(s.tiles[d.tile])){v.reason='Tạm dừng kiểm tra: trạm thiếu tiện ích';return;}
  if(j.inspectionStartedAt==null){
   if(s.money<p.inspectionCostBC){v.reason='Thiếu ngân quỹ vật tư kiểm tra phòng cháy';return;}
   recordCash(s,`municipal-inspection-supply:${j.id}`,'municipal-inspection-supplies',-p.inspectionCostBC,j.id);j.inspectionStartedAt=now(s);j.inspectionCostBC=p.inspectionCostBC;
  }
  j.work++;j.inspectionSeconds=p.inspectionSeconds;
  if(j.work>=p.inspectionSeconds){
   j.hazardBefore=t.hazard||0;t.hazard=clamp(j.hazardBefore-p.inspectionReduction,0,100);j.hazardAfter=t.hazard;j.hazardReduction=j.hazardBefore-j.hazardAfter;j.amount=1;
   s.municipal.inspections[t.assetId]={lastCompletedAt:now(s),dueAt:now(s)+FIRE_INSPECTION_COOLDOWN_SECONDS};complete(s,j,v,emitEvent);returnToDepot(s,j,v,d);
  }
  return;
 }
 j.work++;
 if(j.service==='firefighting'){
  const spent=Math.min(v.water,p.waterRate,t.fire||0);t.fire=clamp((t.fire||0)-spent,0,100);t.hazard=clamp((t.hazard||0)-spent*.5,0,100);v.water-=spent;j.amount+=spent;
  if((t.fire||0)<=1||v.water<=0){if(j.amount>0)complete(s,j,v,emitEvent);returnToDepot(s,j,v,d);}
 }else if(j.service==='waste_collection'){
  if(j.work>=p.workSeconds){const amount=Math.min(t.garbage||0,p.cargo-v.cargo);t.garbage=clamp((t.garbage||0)-amount,0,100);v.cargo+=amount;j.amount+=amount;returnToDepot(s,j,v,d);}
 }else if(j.work>=p.workSeconds){const before=t.crime||0;t.crime=clamp(before-4,0,100);s.municipal.patrols[t.assetId]=now(s);j.amount=Math.max(.1,before-t.crime);complete(s,j,v,emitEvent);returnToDepot(s,j,v,d);}
}
export function updateMunicipal(s,emitEvent){
 const u=reconcileMunicipal(s,{force:false});if(u.lastTick===now(s))return;u.lastTick=now(s);
 const people=peopleMap(s);
 // Garbage follows the same design rate as the old daily simulation, now posted
 // once per shared simulation second. A truck cannot collect mere coverage.
 for(const i of reconcileCaches.get(s).homes){const t=s.tiles[i];if(t.residents){const amount=t.residents*MUNICIPAL_WASTE_PER_RESIDENT_DAY/DAY_SECONDS*STEP_SECONDS;t.garbage=clamp((t.garbage||0)+amount,0,100);u.waste.generated+=amount;}}
 u.waste.at=now(s);
 if(u.lastScan<0||now(s)-u.lastScan>=MUNICIPAL_JOB_SCAN_SECONDS)generateRequests(s);
 if(u.jobs.some(j=>j.status==='queued'))dispatch(s,people);const actors=municipalActors(s),control=actors.length?roadControllers(s,actors):null,factor=weatherState(s).roadSpeedFactor;
 for(const d of u.depots)for(const v of d.fleet){const p=profileFor(d),j=u.jobs.find(j=>j.id===v.jobId);
  if(v.state==='refilling'){
   if(now(s)>=v.readyAt&&operational(s.tiles[d.tile])){
    if(s.money<p.supplyCostBC){v.reason='Thiếu ngân quỹ nhiên liệu / vật tư';continue;}
    recordCash(s,`municipal-supply:${v.refillJob||v.id+':'+v.readyAt}`,'municipal-supplies',-p.supplyCostBC,d.assetId);
    v.water=p.water||0;v.state='idle';v.reason='';delete v.refillJob;
   }continue;
  }
  if(!j)continue;
  if(!j.cancelled&&s.tiles[j.target]?.assetId!==j.targetAsset){cancel(s,j,v,d,'Công trình đích đã tháo dỡ');synchronizeCrew(s,v,d,people);continue;}
  if(v.crew.length<p.crew||v.crew.some(id=>!people.get(id)||people.get(id).work!==s.firms.find(f=>f.home===d.tile)?.id||people.get(id).health<40)){v.speed=0;v.reason='Tổ nhân viên thiếu người hoặc không đủ sức khỏe';synchronizeCrew(s,v,d,people);continue;}
  if(v.state==='blocked'){
   const origin=pointTile(s,v.position),destination=j.status==='returning'?d.tile:j.target;
   if(setJourney(s,v,origin,destination))v.state=j.status==='returning'?'returning':'outbound';else{v.reason='Đường đã bị ngắt; chờ kết nối lại';synchronizeCrew(s,v,d,people);continue;}
  }
  if(v.state==='outbound'&&move(s,v,control,factor)){v.state='servicing';j.status='servicing';v.reason={firefighting:'Dập lửa tại hiện trường',fire_inspection:'Kiểm tra phòng cháy tại công trình',waste_collection:'Thu gom rác tại nhà',security_patrol:'Tuần tra tại khu dân cư'}[j.service];}
  if(v.state==='servicing')perform(s,j,v,d,emitEvent);
  else if(v.state==='returning'&&move(s,v,control,factor))finishReturn(s,j,v,d,emitEvent);
  synchronizeCrew(s,v,d,people);
 }
 u.jobs=u.jobs.filter(activeJob);
}
export function municipalActors(s){return(s.municipal?.depots||[]).flatMap(d=>d.fleet.filter(v=>v.jobId).map(v=>v));}
export function municipalFacilitySnapshot(s,tile){
 const u=reconcileMunicipal(s,{force:false}),d=u.depots.find(d=>d.tile===tile);if(!d)return null;const people=peopleMap(s),staff=staffRows(s,d,people),p=profileFor(d),present=staff.filter(c=>c.municipalAssignment||!c.journey&&c.state==='at-work'&&c.goal===tile).length;
 return {tile,assetId:d.assetId,kind:d.kind,service:p.service,services:p.service==='firefighting'?['firefighting','fire_inspection']:[p.service],posts:municipalPosts(s.tiles[tile]),staff:staff.map(c=>c.id),present,crew:p.crew,vehicles:d.fleet.length,activeVehicles:d.fleet.filter(v=>v.jobId).length,capacity:p.service==='waste_collection'?p.cargo*d.fleet.length:p.service==='firefighting'?p.water*d.fleet.length:d.fleet.length,queue:u.jobs.filter(j=>(j.service===p.service||p.service==='firefighting'&&j.service==='fire_inspection')&&j.status==='queued').length,completed:u.history.filter(j=>j.facilityAsset===d.assetId&&j.status==='completed').length,inspection:p.service==='firefighting'?{duration:p.inspectionSeconds,cost:p.inspectionCostBC,maxHazardReduction:p.inspectionReduction,cooldown:FIRE_INSPECTION_COOLDOWN_SECONDS,completed:u.history.filter(j=>j.facilityAsset===d.assetId&&j.service==='fire_inspection'&&j.status==='completed').length}:null,reason:reason(s,d,staff)||(present<p.crew?'Nhân viên chưa tới trạm':''),fleet:d.fleet.map(v=>({id:v.id,state:v.state,crew:v.crew.length,water:v.water,cargo:v.cargo,reason:v.reason,job:v.jobId}))};
}
export function municipalSnapshot(s){const u=reconcileMunicipal(s,{force:false});return {facilities:u.depots.map(d=>municipalFacilitySnapshot(s,d.tile)),queue:u.jobs.filter(j=>j.status==='queued').length,active:u.jobs.filter(j=>j.status!=='queued').length,completed:u.history.filter(j=>j.status==='completed').length,waste:{...u.waste,collectedPct:u.waste.generated>0?Math.min(100,u.waste.collected/u.waste.generated*100):undefined},services:Object.fromEntries(['firefighting','fire_inspection','security_patrol','waste_collection'].map(service=>[service,{queued:u.jobs.filter(j=>j.service===service&&j.status==='queued').length,active:u.jobs.filter(j=>j.service===service&&j.status!=='queued').length,completed:u.history.filter(j=>j.service===service&&j.status==='completed').length}]))};}
export function municipalEventValid(s,e){
 const j=s.municipal?.jobs.find(j=>j.id===e.job);
 if(!(e.type==='municipal-job-completed'&&e.applied===true&&j&&j.resultSequence===e.sequence&&j.completedAt===now(s)&&j.service===e.service&&j.amount===e.amount&&j.amount>0&&j.facilityAsset===e.facilityAsset&&s.tiles[j.facility]?.assetId===j.facilityAsset&&j.targetAsset===e.targetAsset&&s.tiles[j.target]?.assetId===j.targetAsset&&j.vehicleId===e.vehicle))return false;
 if(j.service!=='fire_inspection')return true;
 const d=s.municipal.depots.find(d=>d.assetId===j.facilityAsset),v=d?.fleet.find(v=>v.id===j.vehicleId),p=d&&profileFor(d),f=s.firms.find(f=>f.home===j.facility);
 return !!p&&p.service==='firefighting'&&!!v&&!!f&&v.state==='servicing'&&!v.journey&&v.crew.length===p.crew&&v.crew.every(id=>{const c=s.citizens.find(c=>c.id===id);return c?.municipalAssignment?.vehicleId===v.id&&c.work===f.id&&c.health>=40;})&&distanceMeters(v.position,position(j.target,s.mapSize,s))<.5&&j.work>=p.inspectionSeconds&&j.inspectionStartedAt>=j.startedAt&&now(s)-j.inspectionStartedAt>=p.inspectionSeconds-1&&j.inspectionCostBC===p.inspectionCostBC&&j.inspectionSeconds===p.inspectionSeconds&&e.inspectionStartedAt===j.inspectionStartedAt&&e.inspectionSeconds===j.inspectionSeconds&&e.inspectionCostBC===j.inspectionCostBC&&e.hazardBefore===j.hazardBefore&&e.hazardAfter===j.hazardAfter&&e.hazardReduction===j.hazardReduction&&j.hazardReduction===Math.min(j.hazardBefore,p.inspectionReduction)&&s.tiles[j.target].hazard===j.hazardAfter&&s.municipal.inspections[j.targetAsset]?.lastCompletedAt===now(s)&&s.ledger.receipts.includes(`municipal-inspection-supply:${j.id}`);
}
export function validateMunicipal(raw,city,size){
 const u=raw.municipal;if(u==null)return;
 const bad=()=>{throw new Error('Vận hành dịch vụ đô thị không hợp lệ.');},integer=n=>Number.isSafeInteger(n)&&n>=0,tile=i=>integer(i)&&i<size*size,time=n=>integer(n)&&n<=raw.clock.seconds,point=p=>p&&[p.x,p.y,p.z].every(Number.isFinite)&&p.x>=0&&p.y>=0&&p.x<=size*20&&p.y<=size*20&&Math.abs(p.z)<10000,identifier=id=>typeof id==='string'&&id.length>0&&id.length<=140;
 if(u.version!==1||raw.municipalVersion!==1||!integer(u.nextJob)||u.nextJob<1||u.lastTick!=null&&!time(u.lastTick)||!Number.isInteger(u.lastScan)||u.lastScan< -1||u.lastScan>raw.clock.seconds||!Array.isArray(u.depots)||u.depots.length>size*size||!Array.isArray(u.jobs)||u.jobs.length>MUNICIPAL_MAX_JOBS||!Array.isArray(u.history)||u.history.length>MUNICIPAL_MAX_HISTORY||!u.patrols||Array.isArray(u.patrols)||Object.keys(u.patrols).length>size*size||Object.values(u.patrols).some(n=>!time(n))||!u.waste||!time(u.waste.at)||![u.waste.generated,u.waste.collected].every(n=>Number.isFinite(n)&&n>=0)||JSON.stringify(u).length>800000)bad();
 if(u.inspections!=null&&(!u.inspections||typeof u.inspections!=='object'||Array.isArray(u.inspections)||Object.keys(u.inspections).length>size*size||Object.entries(u.inspections).some(([id,v])=>!identifier(id)||!v||!integer(v.dueAt)||v.dueAt>raw.clock.seconds+FIRE_INSPECTION_COOLDOWN_SECONDS||v.lastCompletedAt!=null&&(!time(v.lastCompletedAt)||v.dueAt!==v.lastCompletedAt+FIRE_INSPECTION_COOLDOWN_SECONDS))))bad();
 const ids=new Set(),people=new Map(raw.citizens.map(c=>[c.id,c])),fleets=new Map(),jobs=new Map();
 for(const d of u.depots){const p=profileFor(d);if(!p||!tile(d.tile)||city.tiles[d.tile]?.kind!==d.kind||city.tiles[d.tile]?.assetId!==d.assetId||ids.has(d.assetId)||!Array.isArray(d.fleet)||d.fleet.length>12)bad();ids.add(d.assetId);for(const v of d.fleet){if(!identifier(v.id)||fleets.has(v.id)||v.kind!=='municipal'||v.artId!==p.artId||!['idle','outbound','servicing','returning','blocked','refilling'].includes(v.state)||!point(v.position)||![v.speed,v.travelled,v.water,v.cargo,v.visualYaw,v.readyAt].every(Number.isFinite)||v.speed<0||v.speed>p.speed||v.travelled<0||v.water<0||v.water>(p.water||0)||v.cargo<0||v.cargo>(p.cargo||0)||!Array.isArray(v.crew)||v.crew.length>p.crew||new Set(v.crew).size!==v.crew.length||v.crew.some(id=>people.get(id)?.municipalAssignment?.vehicleId!==v.id))bad();fleets.set(v.id,{v,d});const j=v.journey;if(j&&(!['car'].includes(j.mode)||!tile(j.origin)||!tile(j.destination)||!Array.isArray(j.path)||j.path.length<2||j.path.length>size*size*20||j.path.some(p=>!point(p)||p.road!=null&&!tile(p.road))||!integer(j.segment)||j.segment>=j.path.length-1||!Number.isFinite(j.distance)||j.distance<0||j.speed!==p.speed||!integer(j.graphVersion)))bad();}}
 const inspectionProof=(j,work)=>{const p=MUNICIPAL_PROFILES[j.facilityKind];if(!p||p.service!=='firefighting'||!integer(work)||work<p.inspectionSeconds||j.amount!==1||!time(j.inspectionStartedAt)||!time(j.completedAt)||j.completedAt-j.inspectionStartedAt<p.inspectionSeconds-1||j.inspectionCostBC!==p.inspectionCostBC||j.inspectionSeconds!==p.inspectionSeconds||!raw.ledger?.receipts?.includes(`municipal-inspection-supply:${j.id}`)||![j.hazardBefore,j.hazardAfter,j.hazardReduction].every(n=>Number.isFinite(n)&&n>=0&&n<=100)||j.hazardBefore-j.hazardAfter!==j.hazardReduction||j.hazardReduction!==Math.min(j.hazardBefore,p.inspectionReduction))bad();};
 for(const j of u.jobs){if(!identifier(j.id)||jobs.has(j.id)||!['firefighting','fire_inspection','security_patrol','waste_collection'].includes(j.service)||!['queued','outbound','servicing','returning'].includes(j.status)||!tile(j.target)||!j.cancelled&&city.tiles[j.target]?.assetId!==j.targetAsset||!time(j.createdAt)||!integer(j.work)||!Number.isFinite(j.amount)||j.amount<0||!integer(j.resultSequence)||j.resultSequence>=raw.nextEventId)bad();if(j.status==='queued'){if(j.vehicleId!=null||j.facility!=null||j.resultSequence)bad();}else{const pair=fleets.get(j.vehicleId);if(!pair||pair.v.jobId!==j.id||pair.d.tile!==j.facility||pair.d.assetId!==j.facilityAsset||!time(j.startedAt)||pair.v.crew.length!==profileFor(pair.d).crew)bad();}if(j.resultSequence&&(!time(j.completedAt)||!j.amount))bad();
  if(j.service==='fire_inspection'){
   const p=MUNICIPAL_PROFILES[j.facilityKind];if(j.amount>1||j.status!=='queued'&&(!p||p.service!=='firefighting'||j.work>p.inspectionSeconds||fleets.get(j.vehicleId)?.d.kind!==j.facilityKind))bad();
   if(j.inspectionStartedAt!=null){if(!p||!time(j.inspectionStartedAt)||j.inspectionStartedAt<j.startedAt||j.inspectionCostBC!==p.inspectionCostBC||!raw.ledger?.receipts?.includes(`municipal-inspection-supply:${j.id}`))bad();}else if(j.work)bad();
   if(j.resultSequence){inspectionProof(j,j.work);if(city.tiles[j.target]?.assetId===j.targetAsset&&u.inspections?.[j.targetAsset]?.lastCompletedAt!==j.completedAt)bad();}
  }
  jobs.set(j.id,j);}
 for(const {v} of fleets.values())if(v.jobId!=null&&!jobs.has(v.jobId)||v.jobId==null&&v.crew.length||v.state==='idle'&&v.journey)bad();
 const historyIds=new Set();for(const j of u.history){if(!identifier(j.id)||historyIds.has(j.id)||jobs.has(j.id)||!['completed','cancelled'].includes(j.status)||!['firefighting','fire_inspection','security_patrol','waste_collection'].includes(j.service)||!tile(j.target)||j.facility!=null&&!tile(j.facility)||!Number.isFinite(j.amount)||j.amount<0||!integer(j.resultSequence)||j.resultSequence>=raw.nextEventId||j.status==='completed'&&(!j.resultSequence||!time(j.completedAt)||!j.amount))bad();if(j.service==='fire_inspection'&&j.status==='completed')inspectionProof(j,j.inspectionWork);historyIds.add(j.id);}
 for(const c of raw.citizens)if(c.municipalAssignment){const pair=fleets.get(c.municipalAssignment.vehicleId);if(!pair||!pair.v.crew.includes(c.id)||c.municipalAssignment.assetId!==pair.d.assetId||c.municipalAssignment.facility!==pair.d.tile)bad();}
}
