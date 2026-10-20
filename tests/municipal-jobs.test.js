import test from 'node:test';
import assert from 'node:assert/strict';
import {MUNICIPAL_PROFILES,MUNICIPAL_MAX_JOBS,FIRE_INSPECTION_INITIAL_SECONDS,FIRE_INSPECTION_COOLDOWN_SECONDS} from '../src/config/municipal-jobs.js';
import {municipalPosts,reconcileMunicipal,updateMunicipal,municipalSnapshot,municipalFacilitySnapshot,municipalActors,municipalEventValid,validateMunicipal} from '../src/game/systems/municipal-jobs.js';
import {position,index} from '../src/game/systems/world.js';
import {route} from '../src/game/systems/roads.js';
import {recordCash} from '../src/game/systems/economy.js';

function town(kind='fire'){
 const tiles=Array.from({length:64*64},(_,i)=>({id:`plot-${i}`,kind:null,assetId:null,terrain:'grass',garbage:0,fire:0,crime:0,health:100,residents:0,hazard:0,level:1}));
 const roads=Array.from({length:20},(_,x)=>index(x,18));for(const i of roads)Object.assign(tiles[i],{kind:'road',assetId:`road-${i}`,connected:true});
 const depot=index(5,17),home=index(12,19),workerHome=index(3,19);
 Object.assign(tiles[depot],{kind,assetId:`depot-${kind}`,active:true,connected:true,power:true,water:true,sewage:true});
 Object.assign(tiles[home],{kind:'residential',assetId:'home-target',active:true,connected:true,power:true,water:true,sewage:true,residents:12});
 Object.assign(tiles[workerHome],{kind:'residential',assetId:'home-workers',active:true,connected:true,power:true,water:true,sewage:true,residents:4});
 const s={mapSize:64,tiles,graphVersion:1,network:{connected:new Set(roads),services:{}},clock:{seconds:0,step:0},citizens:[],firms:[],vehicles:[],nextEventId:1,events:[],budgets:{fire:100,police:100,waste:100},money:100000,ledger:{openingCash:100000,receipts:[],entries:[]},weatherMode:'clear'};
 const p=MUNICIPAL_PROFILES[kind],employees=[];for(let n=0;n<p.posts;n++){const id=`staff-${n}`;employees.push(id);s.citizens.push({id,home:workerHome,work:`firm-${kind}`,age:30,health:100,state:'at-work',goal:depot,position:position(depot,64,s),journey:null});}
 s.firms.push({id:`firm-${kind}`,home:depot,capacity:p.posts,employees,active:true});return {s,home,depot};
}
function emit(s,type,entity,detail){const e={sequence:s.nextEventId++,seconds:s.clock.seconds,type,entity,...detail};assert.equal(municipalEventValid(s,e),true);s.events.push(e);}
function run(s,seconds){for(let n=0;n<seconds;n++){s.clock.seconds++;s.clock.step++;updateMunicipal(s,emit);}}
function cut(s,x){const i=index(x,18);s.tiles[i].kind=null;s.tiles[i].assetId=null;s.graphVersion++;s.network={...s.network,connected:new Set([...s.network.connected].filter(n=>n!==i))};}
function restore(s,x){const i=index(x,18);s.tiles[i].kind='road';s.tiles[i].assetId=`road-${i}`;s.graphVersion++;s.network={...s.network,connected:new Set([...s.network.connected,i])};}

test('actual staffed fire engine travels to a routed fire, consumes water and returns before resupply',()=>{
 const {s,home,depot}=town();s.tiles[home].fire=70;s.tiles[home].hazard=95;reconcileMunicipal(s);
 assert.equal(municipalPosts(s.tiles[depot]),6);run(s,1);const v=municipalActors(s)[0];assert.ok(v.journey);assert.equal(v.artId,'pv-fire-engine');assert.equal(v.crew.length,2);assert.equal(s.tiles[home].fire,70);assert.equal(s.events.length,0);
 assert.ok(v.journey.path.some(p=>p.road!=null));assert.ok(s.citizens.filter(c=>c.municipalAssignment).every(c=>c.state==='in-vehicle'&&c.journey));
 run(s,90);assert.ok(s.tiles[home].fire<=1);assert.equal(s.events.filter(e=>e.service==='firefighting').length,1);assert.ok(v.water<120);assert.ok(s.events[0].amount>0);
 run(s,90);assert.equal(v.state,'idle');assert.equal(v.water,120);assert.equal(v.crew.length,0);assert.ok(s.money<100000);assert.equal(s.ledger.receipts.length,1);assert.equal(municipalFacilitySnapshot(s,depot).completed,1);
 assert.doesNotThrow(()=>validateMunicipal(s,s,64));const count=s.events.length;run(s,30);assert.equal(s.events.length,count);
});

test('coverage without real on-site staff cannot remotely extinguish a fire',()=>{
 const {s,home,depot}=town();s.tiles[home].fire=40;for(const c of s.citizens){c.state='home';c.goal=c.home;c.position=position(c.home,64,s);}run(s,100);assert.equal(s.tiles[home].fire,40);assert.equal(s.events.length,0);assert.equal(municipalActors(s).length,0);assert.ok(municipalFacilitySnapshot(s,depot).reason.includes('Nhân viên'));
 for(const c of s.citizens){c.state='at-work';c.goal=depot;c.position=position(depot,64,s);}s.tiles[depot].water=false;s.tiles[depot].active=false;run(s,100);assert.equal(s.tiles[home].fire,40);assert.ok(municipalFacilitySnapshot(s,depot).reason.includes('nước'));
});

test('garbage is carried with bounded cargo and records completed collection only after depot delivery',()=>{
 const {s,home,depot}=town('waste');s.tiles[home].garbage=12;run(s,1);const v=municipalActors(s)[0];assert.ok(v);assert.equal(s.events.length,0);
 run(s,40);assert.ok(s.tiles[home].garbage<12);assert.ok(v.cargo>0);assert.ok(v.cargo<=8);assert.equal(s.events.length,0);
 run(s,30);assert.ok(s.events.some(e=>e.service==='waste_collection'&&e.amount===8));assert.equal(v.cargo,0);assert.equal(municipalSnapshot(s).waste.collected,8);assert.ok(municipalSnapshot(s).waste.generated>=12);assert.ok(municipalSnapshot(s).waste.collectedPct<=100);assert.doesNotThrow(()=>validateMunicipal(s,s,64));
});

test('patrol moves through the road network, dwells then applies crime reduction and cooldown',()=>{
 const {s,home}=town('police');s.tiles[home].crime=20;run(s,1);assert.equal(s.tiles[home].crime,20);const moving=municipalActors(s).find(v=>v.goal===home);assert.ok(moving.journey.path.filter(p=>p.road!=null).length>=8);
 run(s,100);assert.equal(s.tiles[home].crime,16);assert.equal(s.events.filter(e=>e.target===home).length,1);assert.ok(s.municipal.patrols['home-target']>0);assert.ok(s.municipal.history.some(j=>j.service==='security_patrol'&&j.status==='completed'));
 run(s,200);assert.equal(s.events.filter(e=>e.target===home).length,1);assert.equal(s.tiles[home].crime,16);
});

test('cut route freezes service without teleport; restoring route resumes and save clone is deterministic',()=>{
 const {s,home}=town();s.tiles[home].fire=40;run(s,2);const v=municipalActors(s)[0],p={...v.position};cut(s,9);run(s,20);assert.deepEqual(v.position,p);assert.equal(s.tiles[home].fire,40);assert.equal(v.state,'blocked');assert.doesNotThrow(()=>validateMunicipal(s,s,64));
 const resumed=structuredClone(s);restore(s,9);restore(resumed,9);run(s,120);run(resumed,120);assert.deepEqual(resumed.municipal,s.municipal);assert.deepEqual(resumed.events,s.events);assert.equal(resumed.money,s.money);assert.ok(s.tiles[home].fire<=1);
});

test('demolished depot releases crews through their current road position and never completes the lost job',()=>{
 const {s,home,depot}=town();s.tiles[home].fire=40;run(s,3);const crew=s.citizens.find(c=>c.municipalAssignment),p={...crew.position};s.tiles[depot].kind=null;s.tiles[depot].assetId=null;reconcileMunicipal(s);assert.equal(municipalActors(s).length,0);assert.equal(crew.municipalAssignment,undefined);assert.deepEqual(crew.position,p);assert.equal(crew.state,'blocked');assert.equal(crew.retryGoal,crew.home);assert.equal(s.events.length,0);assert.equal(s.municipal.history[0].status,'cancelled');assert.doesNotThrow(()=>validateMunicipal(s,s,64));
});

test('demolished target cancels work, crew returns through roads and no invalid receipt is posted',()=>{
 const {s,home}=town();s.tiles[home].fire=40;run(s,3);s.tiles[home].kind=null;s.tiles[home].assetId=null;s.graphVersion++;run(s,1);assert.equal(municipalActors(s)[0].state,'returning');assert.doesNotThrow(()=>validateMunicipal(s,s,64));run(s,60);assert.equal(s.events.length,0);assert.ok(s.municipal.history.some(j=>j.status==='cancelled'));assert.equal(s.citizens.some(c=>c.municipalAssignment),false);
});

test('outstanding queues and resources are bounded; money shortage blocks resupply and invalid saves reject',()=>{
 const {s,home}=town();s.tiles[home].fire=20;run(s,80);const v=s.municipal.depots[0].fleet[0];assert.equal(v.state,'refilling');s.money=0;run(s,100);assert.equal(v.state,'refilling');assert.ok(v.reason.includes('ngân quỹ'));assert.ok(v.water<120);
 s.money=100;run(s,1);assert.equal(v.state,'idle');assert.equal(v.water,120);const bad=structuredClone(s);bad.municipal.depots[0].fleet[0].water=121;assert.throws(()=>validateMunicipal(bad,bad,64),/dịch vụ/);
 const empty=town('police').s;for(let i=0;i<500;i++)Object.assign(empty.tiles[index(i%64,30+Math.floor(i/64))],{kind:'residential',assetId:`crowd-${i}`,residents:4,garbage:5});run(empty,1);assert.ok(empty.municipal.jobs.length<=MUNICIPAL_MAX_JOBS);assert.doesNotThrow(()=>validateMunicipal(empty,empty,64));
});

test('fire inspection drives to the building, dwells, pays materials and reduces hazard only once per cooldown',()=>{
 const {s,home,depot}=town();s.tiles[home].hazard=50;
 run(s,FIRE_INSPECTION_INITIAL_SECONDS);assert.equal(s.municipal.jobs.some(j=>j.service==='fire_inspection'),false);assert.equal(s.tiles[home].hazard,50);
 run(s,1);const v=municipalActors(s)[0];assert.ok(v?.journey);assert.equal(v.goal,home);assert.equal(v.crew.length,2);assert.equal(s.tiles[home].hazard,50);assert.equal(s.events.length,0);
 const j=s.municipal.jobs.find(j=>j.target===home&&j.service==='fire_inspection');
 // Arrival depends on the road distance, rather than a fixed 20-second shortcut.
 for(let n=0;n<60&&j.status==='outbound';n++)run(s,1);
 assert.equal(j.status,'servicing');assert.ok(j.work<45);assert.equal(s.tiles[home].hazard,50);assert.equal(s.ledger.receipts.filter(id=>id===`municipal-inspection-supply:${j.id}`).length,1);
 run(s,60);const e=s.events.find(e=>e.target===home&&e.service==='fire_inspection');assert.ok(e);assert.equal(e.amount,1);assert.equal(e.hazardBefore,50);assert.equal(e.hazardAfter,38);assert.equal(e.hazardReduction,12);assert.equal(s.tiles[home].hazard,38);assert.equal(e.inspectionSeconds,45);assert.equal(e.inspectionCostBC,15);
 assert.equal(s.municipal.inspections['home-target'].dueAt,e.seconds+FIRE_INSPECTION_COOLDOWN_SECONDS);assert.equal(municipalFacilitySnapshot(s,depot).inspection.maxHazardReduction,12);assert.doesNotThrow(()=>validateMunicipal(s,s,64));
 run(s,1000);assert.equal(s.events.filter(e=>e.target===home&&e.service==='fire_inspection').length,1);assert.equal(s.tiles[home].hazard,38);
});

test('inspection cannot complete without on-site crew, a routed engine and available materials',()=>{
 const {s,home,depot}=town();s.tiles[home].hazard=40;
 for(const c of s.citizens){c.state='home';c.goal=c.home;c.position=position(c.home,64,s);}run(s,400);assert.equal(s.tiles[home].hazard,40);assert.equal(s.events.length,0);assert.equal(municipalActors(s).length,0);
 for(const c of s.citizens){c.state='at-work';c.goal=depot;c.position=position(depot,64,s);}
 recordCash(s,'inspection-fixture-withdraw','fixture',-s.money);run(s,60);assert.equal(municipalActors(s).length,0);assert.equal(s.tiles[home].hazard,40);assert.ok(s.municipal.jobs.some(j=>j.reason?.includes('ngân quỹ')));
 recordCash(s,'inspection-fixture-fund','fixture',1000);run(s,100);assert.equal(s.tiles[home].hazard,28);assert.ok(s.events.some(e=>e.service==='fire_inspection'));assert.doesNotThrow(()=>validateMunicipal(s,s,64));
});

test('inspection progress survives save clone and utility interruption with a single materials receipt',()=>{
 const {s,home,depot}=town();s.tiles[home].hazard=30;run(s,325);const j=s.municipal.jobs.find(j=>j.service==='fire_inspection'&&j.target===home);assert.equal(j.status,'servicing');assert.ok(j.work>0&&j.work<45);
 const progress=j.work,money=s.money;s.tiles[depot].power=false;s.tiles[depot].active=false;run(s,60);assert.equal(j.work,progress);assert.equal(s.money,money);assert.equal(s.events.length,0);assert.doesNotThrow(()=>validateMunicipal(s,s,64));
 const restored=structuredClone(s);s.tiles[depot].power=true;s.tiles[depot].active=true;restored.tiles[depot].power=true;restored.tiles[depot].active=true;run(s,160);run(restored,160);
 assert.deepEqual(restored.municipal,s.municipal);assert.deepEqual(restored.events,s.events);assert.deepEqual(restored.ledger,s.ledger);assert.equal(s.ledger.receipts.filter(id=>id===`municipal-inspection-supply:${j.id}`).length,1);assert.equal(s.tiles[home].hazard,18);assert.doesNotThrow(()=>validateMunicipal(s,s,64));
 const tamper=structuredClone(s),history=tamper.municipal.history.find(j=>j.service==='fire_inspection'&&j.target===home);history.inspectionWork=1;assert.throws(()=>validateMunicipal(tamper,tamper,64),/dịch vụ/);
 const unpaid=structuredClone(s);unpaid.ledger.receipts=unpaid.ledger.receipts.filter(id=>id!==`municipal-inspection-supply:${j.id}`);assert.throws(()=>validateMunicipal(unpaid,unpaid,64),/dịch vụ/);
});

test('an actual fire takes priority; a zero-hazard inspection records one safety check and no invented risk reduction',()=>{
 const {s,home}=town();run(s,300);s.tiles[home].fire=30;s.tiles[home].hazard=20;run(s,1);assert.equal(s.municipal.jobs.find(j=>j.vehicleId)?.service,'firefighting');
 run(s,400);assert.ok(s.events.some(e=>e.service==='firefighting'));const safe=s.events.find(e=>e.service==='fire_inspection'&&e.targetAsset==='home-workers');assert.ok(safe);assert.equal(safe.amount,1);assert.equal(safe.hazardReduction,0);assert.equal(safe.hazardAfter,0);assert.doesNotThrow(()=>validateMunicipal(s,s,64));
 const fake={...safe,sequence:s.nextEventId++,hazardReduction:12};assert.equal(municipalEventValid(s,fake),false);
});

test('demolition during inspection cancels the unfinished check without recovering hazard or paying twice',()=>{
 const {s,home}=town();s.tiles[home].hazard=50;run(s,325);const v=municipalActors(s)[0],p={...v.position},j=s.municipal.jobs.find(j=>j.vehicleId===v.id);assert.equal(j.service,'fire_inspection');
 s.tiles[home].kind=null;s.tiles[home].assetId=null;s.graphVersion++;run(s,1);assert.equal(v.state,'returning');assert.deepEqual(v.position,p);assert.doesNotThrow(()=>validateMunicipal(s,s,64));run(s,100);
 assert.equal(s.events.filter(e=>e.job===j.id).length,0);assert.equal(s.ledger.receipts.filter(id=>id===`municipal-inspection-supply:${j.id}`).length,1);assert.ok(s.municipal.history.some(h=>h.id===j.id&&h.status==='cancelled'));assert.equal(Object.hasOwn(s.municipal.inspections,'home-target'),false);
});
