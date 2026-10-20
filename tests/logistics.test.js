import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeLogistics,reconcileLogistics,updateLogistics,logisticsSnapshot,logisticsFacilitySnapshot,logisticsConservation,freightActors,validateLogistics,logisticsEventValid} from '../src/game/systems/logistics.js';
import {LOGISTICS_PROFILES} from '../src/config/logistics.js';
const at=(x,y)=>y*64+x;
function town(){
 const s={mapSize:64,clock:{seconds:0,step:0},graphVersion:0,nextEventId:1,weatherMode:'clear',money:1000000,taxes:{commercial:10},tiles:Array.from({length:64*64},()=>({terrain:'grass',kind:null,level:0,residents:0})),firms:[],citizens:[],vehicles:[],households:[],events:[],world:{legacyFlat:true,geography:{entryTile:at(0,3)}},ledger:{openingCash:1000000,entries:[],receipts:[]}};
 const connected=new Set();for(let x=0;x<15;x++){s.tiles[at(x,3)]={kind:'road',terrain:'grass',assetId:`road-${x}`,level:1};connected.add(at(x,3));}s.network={connected};
 for(const [x,y,kind] of [[2,2,'farm'],[5,2,'foodFactory'],[8,2,'freightWarehouse'],[11,2,'commercial'],[6,4,'industrial']]){
  const tile=at(x,y),assetId=`asset-${tile}`,id=`firm-${assetId}`,person=`worker-${tile}`;
  s.tiles[tile]={kind,terrain:'grass',assetId,level:1,active:true,connected:true,power:true,water:true,sewage:true,fire:0};s.firms.push({id,home:tile,employees:[person],active:true});s.citizens.push({id:person,home:at(11,2),work:id,state:'at-work',goal:tile,journey:null,health:100,position:{x:(x+.5)*20,y:(y+.5)*20,z:0}});
 }s.households.push({id:'household-buyers',savings:100000});initializeLogistics(s);return s;
}
function emit(s,type,entity,detail){const e={type,entity,seconds:s.clock.seconds,sequence:s.nextEventId++,id:`event-${s.nextEventId-1}`,...detail};s.events.push(e);return e;}
function run(s,n){for(let i=0;i<n;i++){s.clock.seconds++;s.clock.step=s.clock.seconds;updateLogistics(s,emit);}}
function conservation(s){for(const b of Object.values(logisticsConservation(s)))assert.equal(b.present,b.accounted);}
function save(s){return structuredClone(s);}

test('actual farm inputs become food/manufactured, travel through warehouse, shops consume paid stock',()=>{
 const s=town();run(s,1800);
 const m=logisticsSnapshot(s);assert.ok(m.totals.generated.agricultural>0);assert.ok(m.totals.generated.food>0);assert.ok(m.totals.generated.manufactured>0);assert.ok(m.totals.used.agricultural>0);assert.equal(m.totals.imported.agricultural,0);assert.ok(m.totals.delivered.food>0);assert.ok(m.totals.delivered.manufactured>0);assert.ok(m.totals.consumed.food>0);assert.ok(m.totals.consumed.manufactured>0);assert.ok(s.households[0].savings<100000);
 const warehouse=s.logistics.facilities.find(f=>f.kind==='warehouse');assert.ok(s.events.some(e=>e.type==='freight-delivered'&&e.destinationAsset===warehouse.assetId));assert.ok(s.events.some(e=>e.type==='freight-delivered'&&e.originAsset===warehouse.assetId&&s.tiles[e.destination].kind==='commercial'));
 assert.ok(s.ledger.entries.some(e=>e.category==='logistics-production'));assert.ok(s.ledger.entries.some(e=>e.category==='logistics-transport'));assert.ok(s.ledger.entries.some(e=>e.category==='logistics-sales-tax'));conservation(s);assert.doesNotThrow(()=>validateLogistics(save(s),64));
});

test('production requires employees physically present and utilities; zero demand is not fulfilled',()=>{
 const s=town();for(const c of s.citizens)c.state='home';run(s,300);assert.equal(logisticsSnapshot(s).totals.generated.agricultural,0);assert.ok(logisticsFacilitySnapshot(s,at(2,2)).reason.includes('nhân viên'));
 for(const c of s.citizens)c.state='at-work';s.tiles[at(2,2)].water=false;s.tiles[at(2,2)].active=false;run(s,300);assert.equal(logisticsSnapshot(s).totals.generated.agricultural,0);
 assert.ok(logisticsFacilitySnapshot(s,at(2,2)).reason.includes('nước'));const empty=town();empty.logistics.orders=[];assert.equal(logisticsSnapshot(empty).supplyFulfillmentPct,undefined);conservation(s);
});

test('freight carries real cargo, follows lanes, and only accepted arrival records one completion',()=>{
 const s=town();run(s,100);assert.ok(s.logistics.trucks.length);const v=s.logistics.trucks[0],o=s.logistics.orders.find(o=>o.id===v.orderId);assert.notEqual(o.state,'completed');assert.equal(o.delivered,0);assert.ok(v.journey.path.some(p=>p.road!=null));assert.ok(v.journey.path.some(p=>p.road!=null&&Math.abs(p.y-70)===2.5));
 const actor=freightActors(s).find(a=>a.id===v.id);assert.equal(actor.cargo.quantity,v.quantity);assert.equal(actor.cargo.capacity,24);assert.ok(actor.artId.startsWith('pv-'));
 run(s,30);const done=s.logistics.orders.find(p=>p.id===o.id);assert.equal(done.state,'completed');assert.equal(done.delivered,done.quantity);const event=s.events.find(e=>e.order===o.id);assert.ok(event);assert.equal(logisticsEventValid(s,event),true);assert.equal(logisticsEventValid(s,{...event,sequence:s.nextEventId}),false);assert.equal(logisticsEventValid(s,{...event,amount:event.amount+1}),false);
 const total=s.logistics.totals.completed,clock=s.clock.seconds;updateLogistics(s,emit);assert.equal(s.logistics.totals.completed,total);assert.equal(s.clock.seconds,clock);assert.equal(s.events.filter(e=>e.order===o.id).length,1);conservation(s);
});

test('road loss stops trucks without disappearing cargo; rebuilding resumes from the same position',()=>{
 const s=town();run(s,100);const v=s.logistics.trucks[0];assert.ok(v);const target=v.journey.destination;
 const road=at(7,3);s.tiles[road].kind=null;s.network.connected.delete(road);s.graphVersion++;reconcileLogistics(s);run(s,2);
 const blocked=s.logistics.trucks.find(t=>t.id===v.id);assert.ok(blocked);assert.equal(blocked.speed,0);assert.equal(blocked.quantity,v.quantity);assert.notEqual(s.logistics.orders.find(o=>o.id===v.orderId).state,'completed');const p={...blocked.position};run(s,30);assert.deepEqual(blocked.position,p);conservation(s);assert.doesNotThrow(()=>validateLogistics(save(s),64));
 s.tiles[road].kind='road';s.network.connected.add(road);s.graphVersion++;run(s,200);assert.equal(s.logistics.orders.find(o=>o.id===v.orderId).state,'completed');assert.equal(s.events.find(e=>e.order===v.orderId).destination,target);conservation(s);
});

test('save mid-production and freight resumes exactly; invalid inventory and fabricated cargo reject',()=>{
 const s=town();run(s,101);const raw=save(s);assert.doesNotThrow(()=>validateLogistics(raw,64));const loaded=save(raw);run(s,500);run(loaded,500);assert.deepEqual(loaded.logistics,s.logistics);assert.deepEqual(loaded.ledger,s.ledger);assert.deepEqual(loaded.households,s.households);
 const bad=save(s);bad.logistics.facilities[0].stock.agricultural++;assert.throws(()=>validateLogistics(bad,64),/logistics/);
 const forged=save(raw);forged.logistics.trucks[0].quantity++;assert.throws(()=>validateLogistics(forged,64),/logistics/);conservation(s);
});

test('demolished destination cancels delivery and physically returns cargo; demolition stock loss conserved',()=>{
 const s=town();run(s,100);const v=s.logistics.trucks.find(t=>t.originAsset&&t.destinationAsset);assert.ok(v);const dest=s.logistics.facilities.find(f=>f.assetId===v.destinationAsset),source=s.logistics.facilities.find(f=>f.assetId===v.originAsset);s.tiles[dest.tile].kind=null;s.tiles[dest.tile].assetId=null;s.graphVersion++;reconcileLogistics(s);
 const returning=s.logistics.trucks.find(t=>t.id===v.id);assert.equal(returning.state,'returning');assert.equal(returning.destinationAsset,source.assetId);assert.equal(s.logistics.orders.find(o=>o.id===v.orderId).state,'cancelled');conservation(s);assert.doesNotThrow(()=>validateLogistics(save(s),64));run(s,100);assert.ok(!s.logistics.trucks.some(t=>t.id===v.id));assert.ok(!s.events.some(e=>e.order===v.orderId));conservation(s);assert.doesNotThrow(()=>validateLogistics(save(s),64));
});

test('external raw imports cost cash once, never generate a completed delivery at dispatch',()=>{
 const s=town(),farm=s.logistics.facilities.find(f=>f.kind==='farm');s.tiles[farm.tile].kind=null;s.tiles[farm.tile].assetId=null;reconcileLogistics(s);run(s,10);
 const imported=s.logistics.trucks.find(v=>!v.originAsset);assert.ok(imported);const o=s.logistics.orders.find(o=>o.id===imported.orderId);assert.equal(o.delivered,0);assert.ok(s.ledger.entries.some(e=>e.id===`${o.id}:purchase`));assert.ok(s.money<1000000);assert.equal(logisticsEventValid(s,{type:'freight-delivered',entity:o.id,order:o.id,sequence:s.nextEventId,goods:o.goods,amount:o.quantity,applied:true}),false);
 const purchases=s.ledger.entries.filter(e=>e.id===`${o.id}:purchase`).length;updateLogistics(s,emit);assert.equal(s.ledger.entries.filter(e=>e.id===`${o.id}:purchase`).length,purchases);conservation(s);assert.doesNotThrow(()=>validateLogistics(save(s),64));
});

test('warehouse and shop capacity constraints prevent overflowing and retain blocked orders',()=>{
 const s=town();run(s,1200);for(const f of s.logistics.facilities)assert.ok(Object.values(f.stock).reduce((a,b)=>a+b,0)<=LOGISTICS_PROFILES[f.kind].capacity);assert.ok(s.logistics.trucks.length<=12);assert.ok(s.logistics.orders.length<=700);conservation(s);
});

test('staff/utility loss at arrival waits safely, preserves cargo and resumes after save',()=>{
 const s=town();run(s,100);const v=s.logistics.trucks[0],dest=s.logistics.facilities.find(f=>f.assetId===v.destinationAsset);s.tiles[dest.tile].active=false;run(s,30);
 const waiting=s.logistics.trucks.find(t=>t.id===v.id);assert.ok(waiting.arrived);assert.equal(waiting.speed,0);assert.equal(s.logistics.orders.find(o=>o.id===v.orderId).delivered,0);assert.doesNotThrow(()=>validateLogistics(save(s),64));const loaded=save(s);run(s,5);run(loaded,5);assert.deepEqual(s.logistics,loaded.logistics);const p={...waiting.position};
 s.tiles[dest.tile].active=true;run(s,1);assert.ok(!s.logistics.trucks.some(t=>t.id===v.id));assert.equal(s.logistics.orders.find(o=>o.id===v.orderId).state,'completed');assert.deepEqual(s.events.find(e=>e.order===v.orderId)?.destination,dest.tile);assert.ok(p.x>0);conservation(s);
});

test('demolishing both endpoints records cargo loss immediately and save remains valid',()=>{
 const s=town();run(s,100);const v=s.logistics.trucks[0],source=s.logistics.facilities.find(f=>f.assetId===v.originAsset),dest=s.logistics.facilities.find(f=>f.assetId===v.destinationAsset);for(const f of [source,dest]){s.tiles[f.tile].kind=null;s.tiles[f.tile].assetId=null;}s.graphVersion++;reconcileLogistics(s);assert.ok(!s.logistics.trucks.some(t=>t.id===v.id));assert.equal(s.logistics.orders.find(o=>o.id===v.orderId).state,'cancelled');assert.ok(s.logistics.totals.lost.agricultural>=v.quantity);conservation(s);assert.doesNotThrow(()=>validateLogistics(save(s),64));
});
