import {GOODS,LOGISTICS_PROFILES,LOGISTICS_VERSION,FREIGHT_CAPACITY,MAX_FREIGHT_TRUCKS,ORDER_DEADLINE_SECONDS,logisticsKind} from '../../config/logistics.js';
import {capacityFactor} from '../../config/building-economy.js';
import {route} from './roads.js';
import {mobilityPath} from './mobility-path.js';
import {remainingRouteValid} from './road-network.js';
import {roadControllers} from './road-controller.js';
import {position,distanceMeters} from './world.js';
import {weatherState} from './weather.js';
import {recordCash} from './economy.js';
import {emit} from './events.js';
export {logisticsPosts} from '../../config/logistics.js';

const keys=Object.keys(GOODS),zero=()=>Object.fromEntries(keys.map(k=>[k,0]));
const reconcileCaches=new WeakMap(),staffCaches=new WeakMap();
const open=t=>!!t?.active&&!!t?.connected&&!!t?.sewage&&(t.fire||0)<60;
const volume=stock=>keys.reduce((n,k)=>n+(stock[k]||0),0);
const capacity=(s,f)=>Math.floor(LOGISTICS_PROFILES[f.kind].capacity*capacityFactor(s.tiles[f.tile]));
const facilitiesByAsset=s=>new Map(s.logistics.facilities.map(f=>[f.assetId,f]));
const onSite=(s,f)=>{let cached=staffCaches.get(s);if(!cached||cached.at!==s.clock.seconds||cached.firms!==s.firms||cached.people!==s.citizens||cached.graph!==s.graphVersion){const firms=new Map(s.firms.map(v=>[v.id,{...v,staff:new Set(v.employees)}])),counts=new Map();for(const c of s.citizens){const firm=firms.get(c.work);if(firm?.staff.has(c.id)&&c.state==='at-work'&&!c.journey&&c.goal===firm.home&&c.health>=40)counts.set(firm.home,(counts.get(firm.home)||0)+1);}cached={at:s.clock.seconds,firms:s.firms,people:s.citizens,graph:s.graphVersion,counts};staffCaches.set(s,cached);}return cached.counts.get(f.tile)||0;};
const free=(s,f)=>capacity(s,f)-volume(f.stock);
const pending=(s,f,g)=>s.logistics.orders.filter(o=>o.destinationAsset===f.assetId&&o.goods===g&&['queued','travelling','blocked'].includes(o.state)).reduce((n,o)=>n+o.quantity,0);
const reason=(s,f)=>!s.tiles[f.tile]?.connected?'Chưa nối đường về cổng':!s.tiles[f.tile]?.power?'Thiếu điện':!s.tiles[f.tile]?.water?'Thiếu nước':!s.tiles[f.tile]?.sewage?'Thiếu xử lý nước thải':(s.tiles[f.tile]?.fire||0)>=60?'Công trình không an toàn':!onSite(s,f)?'Chờ nhân viên đến làm':'';

export function initializeLogistics(s){
 if(s.logistics)return s.logistics;
 s.logistics={version:LOGISTICS_VERSION,nextId:1,lastUpdate:s.clock.seconds-1,facilities:[],orders:[],trucks:[],totals:{generated:zero(),used:zero(),consumed:zero(),lost:zero(),imported:zero(),delivered:zero(),completed:0},consumerSeconds:0};
 reconcileLogistics(s);return s.logistics;
}
export function reconcileLogistics(s,{force=true}={}){
 if(!s.logistics)return initializeLogistics(s);
 const cached=reconcileCaches.get(s);if(!force&&cached?.state===s.logistics&&cached.graph===s.graphVersion)return s.logistics;
 staffCaches.delete(s);
 const l=s.logistics,old=new Map(l.facilities.map(f=>[f.assetId,f])),next=[];
 for(let tile=0;tile<s.tiles.length;tile++){const t=s.tiles[tile],kind=logisticsKind(t);if(!kind||!t.assetId)continue;const saved=old.get(t.assetId);old.delete(t.assetId);next.push(saved?{...saved,tile,kind}:{tile,assetId:t.assetId,kind,stock:zero(),cycles:0,progress:0,production:zero(),consumed:zero(),sales:0,reason:''});}
 for(const f of old.values())for(const g of keys)l.totals.lost[g]+=f.stock[g];
 l.facilities=next;
 // Lost destinations never receive goods. Moving cargo remains owned by its
 // truck until a physical return or a recorded loss; queued orders hold no stock.
 const exists=facilitiesByAsset(s);
 for(const o of l.orders)if(o.state==='queued'&&(!exists.has(o.destinationAsset)||o.originAsset&&!exists.has(o.originAsset))){o.state='cancelled';o.closedAt=s.clock.seconds;o.reason='Công trình nguồn hoặc đích đã tháo dỡ';}
 for(const v of l.trucks)if(!exists.has(v.destinationAsset)&&v.state!=='returning')returnCargo(s,v,'Đích đã tháo dỡ');
 l.trucks=l.trucks.filter(v=>v.quantity>0);
 reconcileCaches.set(s,{state:l,graph:s.graphVersion});
 return l;
}

function order(s,source,destination,goods,quantity){
 const l=s.logistics;if(l.orders.filter(o=>['queued','travelling','blocked'].includes(o.state)).length>=128)return;
 const id=`freight-order-${l.nextId++}`,origin=source?.tile??s.world?.geography?.entryTile??0;
 l.orders.push({id,goods,quantity:Math.min(FREIGHT_CAPACITY,Math.max(1,Math.ceil(quantity))),origin,destination:destination.tile,originAsset:source?.assetId??null,destinationAsset:destination.assetId,state:'queued',createdAt:s.clock.seconds,dueAt:s.clock.seconds+ORDER_DEADLINE_SECONDS,delivered:0,completedAt:null,completedSequence:0,reason:''});
}
function requestStock(s,destination,goods,target,sourceKinds){
 if(!open(s.tiles[destination.tile]))return;
 const wanted=Math.min(target-destination.stock[goods]-pending(s,destination,goods),free(s,destination));if(wanted<=0)return;
 const sources=s.logistics.facilities.filter(f=>f.assetId!==destination.assetId&&sourceKinds.includes(f.kind)&&open(s.tiles[f.tile]));
 // Prefer warehouses when distributing. A producer can wait for its real next
 // batch instead of manufacturing free cargo to fill a requested order.
 sources.sort((a,b)=>sourceKinds.indexOf(a.kind)-sourceKinds.indexOf(b.kind)||(b.stock[goods]>0)-(a.stock[goods]>0)||Math.abs(a.tile-destination.tile)-Math.abs(b.tile-destination.tile));
 const source=sources.find(f=>route(s,f.tile,destination.tile,'car').length);
 if(source)order(s,source,destination,goods,wanted);
 else if(goods==='agricultural'&&!s.logistics.facilities.some(f=>f.kind==='farm'))order(s,null,destination,goods,wanted);
 else if(sources.length)order(s,sources[0],destination,goods,wanted);
 else destination.reason=`Chưa có nguồn ${GOODS[goods].name.toLowerCase()}`;
}
function dispatch(s){
 const l=s.logistics,byAsset=facilitiesByAsset(s);
 for(const o of l.orders){
  if(o.state!=='queued'||l.trucks.length>=MAX_FREIGHT_TRUCKS)continue;
  const from=byAsset.get(o.originAsset),to=byAsset.get(o.destinationAsset);
  if(!to){o.state='cancelled';o.closedAt=s.clock.seconds;continue;}
  if(!open(s.tiles[to.tile])||from&&!open(s.tiles[from.tile])){o.reason='Nguồn hoặc đích thiếu tiện ích';continue;}
  if(!onSite(s,to)||from&&!onSite(s,from)){o.reason='Chờ nhân viên bốc dỡ tại nguồn và đích';continue;}
  if(from&&from.stock[o.goods]<o.quantity){o.reason='Chờ đủ hàng tại nguồn';continue;}
  if(free(s,to)<o.quantity){o.reason='Kho nhận không còn đủ chỗ';continue;}
  const roads=route(s,o.origin,o.destination,'car');if(!roads.length){o.reason='Không có đường xe tải hợp lệ';continue;}
  const importCost=from?0:o.quantity*GOODS[o.goods].importPrice;
  if(importCost>s.money){o.reason='Ngân quỹ không đủ nhập nguyên liệu';continue;}
  if(from)from.stock[o.goods]-=o.quantity;
  else {recordCash(s,`${o.id}:purchase`,'logistics-import',-importCost,o.id);l.totals.imported[o.goods]+=o.quantity;l.totals.generated[o.goods]+=o.quantity;}
  const path=mobilityPath(s,o.origin,o.destination,roads,s.mapSize,'car'),journey={origin:o.origin,destination:o.destination,mode:'car',path,segment:0,distance:0,speed:35/3.6,actualSpeed:0,graphVersion:s.graphVersion,laneVersion:1};
  l.trucks.push({id:`truck-${o.id}`,kind:'freight',orderId:o.id,goods:o.goods,quantity:o.quantity,originAsset:o.originAsset,destinationAsset:o.destinationAsset,state:'travelling',position:{...path[0]},journey,travelled:0,heading:0,speed:0,waitReason:'',blockedVersion:-1,blockedAt:null});o.state='travelling';o.reason='';
 }
}
function returnCargo(s,v,message){
 const source=s.logistics.facilities.find(f=>f.assetId===v.originAsset),o=s.logistics.orders.find(o=>o.id===v.orderId);if(o){o.state='cancelled';o.closedAt=s.clock.seconds;o.reason=message;}
 if(!source){s.logistics.totals.lost[v.goods]+=v.quantity;v.quantity=0;v.state='lost';v.journey=null;return;}
 v.destinationAsset=source.assetId;v.state='returning';v.waitReason=`Trả hàng: ${message}`;v.retryGoal=source.tile;v.journey=null;v.arrived=false;v.blockedVersion=-1;
}
function planFromPosition(s,v,destination){
 const current=Math.min(s.tiles.length-1,Math.max(0,Math.floor(v.position.y/20)*s.mapSize+Math.floor(v.position.x/20))),roads=route(s,current,destination,'car');
 if(!roads.length){v.blockedVersion=s.graphVersion;v.speed=0;v.waitReason='Đường xe tải bị ngắt';v.blockedAt??=s.clock.seconds;return false;}
 v.journey={origin:current,destination,mode:'car',path:mobilityPath(s,current,destination,roads,s.mapSize,'car',v.position),segment:0,distance:0,speed:35/3.6,actualSpeed:0,graphVersion:s.graphVersion,laneVersion:1};v.blockedAt=null;v.retryGoal=null;return true;
}
function updateTrucks(s,emitEvent){
 const l=s.logistics,control=roadControllers(s),byAsset=facilitiesByAsset(s);
 for(const v of l.trucks){
  if(!v.quantity)continue;
  let to=byAsset.get(v.destinationAsset);if(!to){returnCargo(s,v,'Đích không còn tồn tại');to=byAsset.get(v.destinationAsset);if(!to)continue;}
  if(!v.journey){if(v.blockedVersion===s.graphVersion||!planFromPosition(s,v,to.tile))continue;}
  const j=v.journey;
  if(j.graphVersion!==s.graphVersion){if(!remainingRouteValid(s,j.path.slice(Math.max(0,j.segment-1)),'car')){v.journey=null;v.retryGoal=to.tile;v.blockedVersion=-1;v.blockedAt??=s.clock.seconds;v.speed=0;v.state=v.state==='returning'?'returning':'blocked';const o=l.orders.find(o=>o.id===v.orderId);if(o?.state==='travelling')o.state='blocked';continue;}j.graphVersion=s.graphVersion;}
  if(!v.arrived&&j.segment<j.path.length-1){
  const controlled=control({id:v.id,kind:v.kind,position:v.position,journey:j});let speed=controlled.speed*weatherState(s).roadSpeedFactor;
  const a=j.path[j.segment],b=j.path[j.segment+1],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;v.heading=Math.atan2(dx,dy);v.waitReason=controlled.reason;
  // Freight spacing is bounded by the 12-truck simulation fleet.
  for(const other of l.trucks)if(other!==v&&other.quantity&&Math.abs((other.position.z||0)-v.position.z)<2){const rx=other.position.x-v.position.x,ry=other.position.y-v.position.y,ahead=(rx*dx+ry*dy)/d,side=Math.abs((-rx*dy+ry*dx)/d);if(Math.cos(other.heading-v.heading)>.8&&ahead>0&&side<1.9&&ahead<8+speed){speed=Math.min(speed,Math.max(0,ahead-8));v.waitReason='Giữ khoảng cách xe tải';}}
  j.actualSpeed=speed;v.speed=speed;let remaining=speed;
  while(remaining>0&&j.segment<j.path.length-1){const p=j.path[j.segment],q=j.path[j.segment+1],length=distanceMeters(p,q),travel=Math.min(remaining,Math.max(0,length-j.distance));j.distance+=travel;v.travelled+=travel;remaining-=travel;const t=length?Math.min(1,j.distance/length):1;v.position={x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,z:p.z+(q.z-p.z)*t};if(j.distance>=length-1e-8){j.segment++;j.distance=0;}}
  }
  if(!v.arrived&&j.segment!==j.path.length-1)continue;
  v.speed=0;
  if(!open(s.tiles[to.tile])||!onSite(s,to)||free(s,to)<v.quantity){v.arrived=true;j.segment=j.path.length-2;j.distance=distanceMeters(j.path[j.segment],j.path.at(-1));v.waitReason='Chờ nơi nhận hoạt động, có nhân viên và đủ chỗ';v.blockedAt??=s.clock.seconds;if(s.clock.seconds-v.blockedAt>=120&&v.state!=='returning')returnCargo(s,v,v.waitReason);continue;}
  to.stock[v.goods]+=v.quantity;
  if(v.state==='returning'){v.quantity=0;v.journey=null;v.state='returned';continue;}
  const o=l.orders.find(o=>o.id===v.orderId);
  if(!o||!['travelling','blocked'].includes(o.state)){l.totals.lost[v.goods]+=v.quantity;to.stock[v.goods]-=v.quantity;v.quantity=0;v.state='lost';continue;}
  o.state='completed';o.delivered=v.quantity;o.completedAt=s.clock.seconds;o.completedSequence=s.nextEventId;o.reason='';l.totals.delivered[v.goods]+=v.quantity;l.totals.completed++;
  recordCash(s,`${o.id}:transport`,'logistics-transport',-v.quantity*.15,o.id);
  // The proof is committed before emission. Replayed/fabricated events have no
  // matching order sequence, applied quantity and destination asset.
  emitEvent(s,'freight-delivered',o.id,{order:o.id,goods:o.goods,amount:v.quantity,origin:o.origin,destination:o.destination,originAsset:o.originAsset,destinationAsset:o.destinationAsset,applied:true});
  v.quantity=0;v.journey=null;v.state='delivered';
 }
 l.trucks=l.trucks.filter(v=>v.quantity>0);
}
function production(s){
 const l=s.logistics;
 for(const f of l.facilities){const p=LOGISTICS_PROFILES[f.kind],recipe=p.recipe;f.reason=reason(s,f);if(!recipe||f.reason)continue;
  const input=volume(recipe.input),output=volume(recipe.output),cost=recipe.cost;
  if(keys.some(g=>f.stock[g]<(recipe.input[g]||0))){f.reason='Chờ nguyên liệu';continue;}
  if(free(s,f)+input<output){f.reason='Kho đầy · cần giao hàng ra';continue;}
  if(s.money<cost){f.reason='Thiếu ngân sách vận hành';continue;}
  f.progress++;if(f.progress<recipe.seconds)continue;f.progress=0;f.cycles++;
  recordCash(s,`production:${f.assetId}:${f.cycles}`,'logistics-production',-cost,f.assetId);
  for(const g of keys){const take=recipe.input[g]||0,make=recipe.output[g]||0;f.stock[g]-=take;f.stock[g]+=make;l.totals.used[g]+=take;l.totals.generated[g]+=make;f.production[g]+=make;}
 }
}
function consume(s){
 const l=s.logistics;if(++l.consumerSeconds<60)return;l.consumerSeconds=0;
 const shops=l.facilities.filter(f=>f.kind==='shop'&&open(s.tiles[f.tile])&&onSite(s,f)>0),population=s.citizens.length;if(!population||!shops.length)return;
 // Actual household purchases spend household savings; no city grant creates
 // fictitious sales. Insufficient savings or stock leaves unmet consumption.
 let food=Math.max(1,Math.ceil(population/25)),manufactured=Math.max(1,Math.ceil(population/100));
 for(const f of shops)for(const goods of ['food','manufactured']){let wanted=goods==='food'?food:manufactured;const take=Math.min(f.stock[goods],wanted);if(!take)continue;let accepted=0;
  for(const h of s.households){if(accepted>=take)break;const price=GOODS[goods].salePrice;if(h.savings>=price){h.savings-=price;accepted++;}}
  if(!accepted)continue;f.stock[goods]-=accepted;f.consumed[goods]+=accepted;l.totals.consumed[goods]+=accepted;f.sales+=accepted*GOODS[goods].salePrice;
  recordCash(s,`sales:${f.assetId}:${s.clock.seconds}:${goods}`,'logistics-sales-tax',accepted*GOODS[goods].salePrice*(s.taxes?.commercial??10)/100,f.assetId);
  if(goods==='food')food-=accepted;else manufactured-=accepted;
 }
}
export function updateLogistics(s,emitEvent=emit){
 const l=initializeLogistics(s);if(l.lastUpdate===s.clock.seconds)return;
 reconcileLogistics(s,{force:false});l.lastUpdate=s.clock.seconds;production(s);consume(s);updateTrucks(s,emitEvent);
 if(s.clock.seconds%10===0){for(const f of l.facilities){
  if(f.kind==='warehouse'){requestStock(s,f,'agricultural',48,['farm']);requestStock(s,f,'food',32,['food_factory']);requestStock(s,f,'manufactured',24,['industrial_plant']);}
  if(['food_factory','industrial_plant'].includes(f.kind))requestStock(s,f,'agricultural',36,['warehouse','farm']);
  if(f.kind==='shop'){requestStock(s,f,'food',18,['warehouse','food_factory']);requestStock(s,f,'manufactured',12,['warehouse','industrial_plant']);}
 }dispatch(s);}
 // Closed orders remain long enough for mission windows and event validation;
 // active requests are never discarded, so a blocked order cannot be duplicated.
 const active=l.orders.filter(o=>['queued','travelling','blocked'].includes(o.state)),closed=l.orders.filter(o=>!active.includes(o)&&(o.completedAt??o.closedAt??o.createdAt)>s.clock.seconds-1200);l.orders=[...active,...closed.slice(-(700-active.length))];
}
export function logisticsFacilitySnapshot(s,tile){initializeLogistics(s);const f=s.logistics.facilities.find(f=>f.tile===tile);if(!f)return null;const p=LOGISTICS_PROFILES[f.kind];return {...structuredClone(f),name:p.name,staffPresent:onSite(s,f),capacity:capacity(s,f),used:volume(f.stock),active:open(s.tiles[tile])&&onSite(s,f)>0,recipe:p.recipe??null,reason:reason(s,f)||f.reason,incoming:s.logistics.orders.filter(o=>o.destinationAsset===f.assetId&&['queued','travelling','blocked'].includes(o.state)).map(o=>({...o})),outgoing:s.logistics.orders.filter(o=>o.originAsset===f.assetId&&['queued','travelling','blocked'].includes(o.state)).map(o=>({...o}))};}
export function logisticsSnapshot(s){initializeLogistics(s);const l=s.logistics,now=s.clock.seconds,due=l.orders.filter(o=>o.dueAt<=now&&o.dueAt>now-600),fulfilled=due.filter(o=>o.state==='completed'&&o.completedAt<=o.dueAt).length;return {facilities:l.facilities.length,trucks:l.trucks.length,queued:l.orders.filter(o=>o.state==='queued').length,blocked:l.orders.filter(o=>o.state==='blocked'||o.state==='queued'&&o.reason).length,stock:l.facilities.reduce((n,f)=>{for(const g of keys)n[g]+=f.stock[g];return n;},zero()),cargo:l.trucks.reduce((n,v)=>{n[v.goods]+=v.quantity;return n;},zero()),totals:structuredClone(l.totals),due:due.length,fulfilled,supplyFulfillmentPct:due.length?fulfilled/due.length*100:undefined};}
export function freightActors(s){return (s.logistics?.trucks||[]).map(v=>({id:v.id,kind:'freight',artId:v.goods==='food'?'pv-refrigerated-truck':'pv-medium-truck',position:{...v.position},state:v.speed>0?'travelling':'blocked',speed:v.speed,visualYaw:v.heading,travelled:v.travelled,journey:v.journey,goal:v.journey?.destination,cargo:{goods:v.goods,name:GOODS[v.goods].name,quantity:v.quantity,capacity:FREIGHT_CAPACITY},waitReason:v.waitReason,orderId:v.orderId}));}
export function logisticsEventValid(s,e){
 if(e.type!=='freight-delivered'||e.applied!==true||e.order!==e.entity)return false;
 const o=s.logistics?.orders.find(o=>o.id===e.order),t=s.tiles[e.destination];
 return !!o&&o.state==='completed'&&o.completedSequence===e.sequence&&o.completedAt===e.seconds&&o.goods===e.goods&&o.delivered===e.amount&&o.quantity===e.amount&&o.origin===e.origin&&o.destination===e.destination&&o.originAsset===e.originAsset&&o.destinationAsset===e.destinationAsset&&t?.assetId===e.destinationAsset&&logisticsKind(t)!=null&&e.amount>0;
}
export function logisticsConservation(s){const l=s.logistics,stock=zero();for(const f of l.facilities)for(const g of keys)stock[g]+=f.stock[g];for(const v of l.trucks)stock[v.goods]+=v.quantity;return Object.fromEntries(keys.map(g=>[g,{accounted:l.totals.generated[g]-l.totals.used[g]-l.totals.consumed[g]-l.totals.lost[g],present:stock[g]}]));}

export function validateLogistics(raw,size,tiles=raw.tiles){
 const l=raw.logistics;if(l==null)return;
 const fail=()=>{throw new Error('Dữ liệu logistics không hợp lệ.');},integer=v=>Number.isSafeInteger(v)&&v>=0,inMap=i=>integer(i)&&i<size*size,goods=stock=>stock&&keys.every(k=>integer(stock[k])),time=v=>integer(v)&&v<=raw.clock.seconds,pos=p=>p&&[p.x,p.y,p.z].every(Number.isFinite)&&p.x>=0&&p.y>=0&&p.x<=size*20&&p.y<=size*20&&Math.abs(p.z)<10000;
 if(l.version!==LOGISTICS_VERSION||!integer(l.nextId)||l.nextId<1||!Number.isInteger(l.lastUpdate)||l.lastUpdate< -1||l.lastUpdate>raw.clock.seconds||!integer(l.consumerSeconds)||l.consumerSeconds>=60||!Array.isArray(l.facilities)||l.facilities.length>size*size||!Array.isArray(l.orders)||l.orders.length>700||!Array.isArray(l.trucks)||l.trucks.length>MAX_FREIGHT_TRUCKS||!l.totals||!integer(l.totals.completed)||['generated','used','consumed','lost','imported','delivered'].some(k=>!goods(l.totals[k])))fail();
 const assets=new Map(),orders=new Map(),truckOrders=new Set();
 for(const f of l.facilities){if(!inMap(f.tile)||tiles[f.tile]?.assetId!==f.assetId||logisticsKind(tiles[f.tile])!==f.kind||assets.has(f.assetId)||!goods(f.stock)||!goods(f.production)||!goods(f.consumed)||!integer(f.cycles)||!integer(f.progress)||f.progress>=(LOGISTICS_PROFILES[f.kind].recipe?.seconds??1)||!Number.isFinite(f.sales)||f.sales<0||typeof f.reason!=='string'||f.reason.length>180||volume(f.stock)>LOGISTICS_PROFILES[f.kind].capacity*capacityFactor(tiles[f.tile]))fail();assets.set(f.assetId,f);}
 for(const o of l.orders){const n=/^freight-order-(\d+)$/.exec(o.id);if(!n||Number(n[1])>=l.nextId||orders.has(o.id)||!keys.includes(o.goods)||!integer(o.quantity)||o.quantity<1||o.quantity>FREIGHT_CAPACITY||!inMap(o.origin)||!inMap(o.destination)||!['queued','travelling','blocked','completed','cancelled'].includes(o.state)||!time(o.createdAt)||!integer(o.dueAt)||o.dueAt!==o.createdAt+ORDER_DEADLINE_SECONDS||!integer(o.delivered)||o.delivered>o.quantity||!integer(o.completedSequence)||o.completedSequence>=raw.nextEventId||typeof o.reason!=='string'||o.reason.length>180||o.closedAt!=null&&!time(o.closedAt))fail();
  if(o.state==='completed'&&(!time(o.completedAt)||o.completedAt<o.createdAt||o.delivered!==o.quantity||o.completedSequence===0)||o.state!=='completed'&&(o.completedAt!==null||o.completedSequence!==0||o.delivered!==0))fail();
  if(['queued','travelling','blocked'].includes(o.state)&&(!assets.has(o.destinationAsset)||o.state==='queued'&&o.originAsset&&!assets.has(o.originAsset)))fail();orders.set(o.id,o);
 }
 for(const v of l.trucks){const o=orders.get(v.orderId),j=v.journey;if(!o||truckOrders.has(v.orderId)||v.id!==`truck-${o.id}`||v.goods!==o.goods||!integer(v.quantity)||v.quantity!==o.quantity||v.quantity<1||!['travelling','blocked','returning'].includes(v.state)||!assets.has(v.destinationAsset)||!pos(v.position)||!Number.isFinite(v.travelled)||v.travelled<0||!Number.isFinite(v.heading)||!Number.isFinite(v.speed)||v.speed<0||v.speed>35/3.6||typeof v.waitReason!=='string'||v.waitReason.length>180||!Number.isInteger(v.blockedVersion)||v.blockedAt!=null&&!time(v.blockedAt)||v.retryGoal!=null&&!inMap(v.retryGoal))fail();
  if(v.state==='returning'?o.state!=='cancelled'||v.destinationAsset!==v.originAsset:!['travelling','blocked'].includes(o.state)||v.destinationAsset!==o.destinationAsset)fail();
  if(j&&(!inMap(j.origin)||!inMap(j.destination)||j.mode!=='car'||!Array.isArray(j.path)||j.path.length<2||j.path.length>size*size*40+2||j.path.some(p=>!pos(p)||p.road!=null&&!inMap(p.road))||!integer(j.segment)||j.segment>=j.path.length-1||!Number.isFinite(j.distance)||j.distance<0||j.distance>distanceMeters(j.path[j.segment],j.path[j.segment+1])+.0001||j.speed!==35/3.6||!Number.isFinite(j.actualSpeed)||j.actualSpeed<0||j.actualSpeed>j.speed||!integer(j.graphVersion)))fail();
  if(v.arrived!=null&&typeof v.arrived!=='boolean'||v.arrived&&(!j||j.segment!==j.path.length-2||Math.abs(j.distance-distanceMeters(j.path[j.segment],j.path.at(-1)))>.0001||distanceMeters(v.position,j.path.at(-1))>.0001))fail();truckOrders.add(v.orderId);
 }
 if(l.orders.some(o=>['travelling','blocked'].includes(o.state)&&!truckOrders.has(o.id)))fail();
 const balances=logisticsConservation({logistics:l});if(keys.some(g=>balances[g].accounted!==balances[g].present||l.totals.imported[g]>l.totals.generated[g]||l.totals.delivered[g]<0))fail();
}
