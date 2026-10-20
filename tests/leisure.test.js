import test from 'node:test';
import assert from 'node:assert/strict';
import {LEISURE_PROFILES,LEISURE_VISIT_COOLDOWN} from '../src/config/leisure.js';
import {reconcileLeisure,updateLeisure,leisureSnapshot,leisureFacilitySnapshot,leisureJourneyReserved,leisureArrivalState,leisureEventValid,validateLeisure} from '../src/game/systems/leisure.js';
import {updateCitizens} from '../src/game/systems/citizens.js';
import {calendar} from '../src/game/systems/clock.js';
import {route} from '../src/game/systems/roads.js';
import {index,position} from '../src/game/systems/world.js';

function town(count=8,kind='park'){
 const tiles=Array.from({length:64*64},(_,i)=>({id:`plot-${i}`,kind:null,assetId:null,terrain:'grass',garbage:0,fire:0,crime:0,health:100,residents:0,hazard:0,level:1}));
 const roads=Array.from({length:20},(_,x)=>index(x,18));for(const i of roads)Object.assign(tiles[i],{kind:'road',assetId:`road-${i}`,connected:true});
 const park=index(8,17),home=index(5,19);
 Object.assign(tiles[park],{kind,assetId:`asset-${kind}`,active:true,connected:true,power:true,water:true,sewage:true,pollution:0});
 Object.assign(tiles[home],{kind:'residential',assetId:'home-target',active:true,connected:true,power:true,water:true,sewage:true,residents:count});
 const seconds=12*3600,s={mapSize:64,tiles,graphVersion:1,network:{connected:new Set(roads),services:{bus:[]}},clock:{seconds,step:seconds},citizens:[],firms:[],vehicles:[],busLines:[],nextEventId:1,events:[],budgets:{park:100},money:100000,ledger:{openingCash:100000,receipts:[],entries:[]},weatherMode:'clear'};
 for(let n=0;n<count;n++)s.citizens.push({id:`visitor-${n}`,home,work:null,age:30,health:100,state:'home',goal:home,position:position(home,64,s),journey:null,schedule:{depart:8*3600,return:17*3600},walkSpeed:1.5,vehicle:null,attendance:0});
 reconcileLeisure(s);for(const c of s.citizens)c.leisure.nextVisitAt=seconds;return {s,home,park};
}
function emit(s,type,entity,detail){const e={sequence:s.nextEventId++,seconds:s.clock.seconds,type,entity,...detail};assert.equal(leisureEventValid(s,e),true);s.events.push(e);}
function run(s,seconds){for(let n=0;n<seconds;n++){s.clock.seconds++;s.clock.step++;updateCitizens(s,calendar(s.clock.seconds),route,64);updateLeisure(s,emit);}}
function parkEvents(s){return s.events.filter(e=>e.type==='leisure-visit-completed');}

test('real resident walks to an accessible park and only completed on-site use receives a visitor receipt',()=>{
 const {s,park}=town(1);run(s,1);const c=s.citizens[0];assert.equal(c.leisure.phase,'travelling');assert.equal(c.journey.mode,'walk');assert.equal(c.journey.destination,park);assert.ok(c.journey.path.some(p=>p.road!=null));assert.equal(leisureArrivalState(c,park),'at-park');assert.equal(leisureJourneyReserved(c),true);assert.equal(parkEvents(s).length,0);
 for(let n=0;n<120&&c.leisure.phase!=='visiting';n++)run(s,1);assert.equal(c.leisure.phase,'visiting');assert.equal(c.state,'at-park');assert.equal(leisureFacilitySnapshot(s,park).present,1);assert.equal(parkEvents(s).length,0);
 run(s,30);assert.equal(parkEvents(s).length,1);assert.equal(c.leisure.completed,1);assert.equal(c.leisure.phase,'returning');assert.ok(c.journey);assert.equal(s.leisure.completed,1);assert.equal(s.leisure.parks[0].completed,1);assert.doesNotThrow(()=>validateLeisure(s,64));
 run(s,120);assert.equal(c.leisure.phase,'idle');assert.equal(c.goal,c.home);assert.equal(parkEvents(s).length,1);
});

test('park reservations are bounded by funded capacity, permit cooldown and preserve private car ownership',()=>{
 const {s,park}=town(40);s.budgets.park=50;s.citizens[0].vehicle='my-car';run(s,1);const r=leisureFacilitySnapshot(s,park);assert.equal(r.capacity,8);assert.equal(r.reserved,8);assert.equal(s.citizens[0].vehicle,'my-car');assert.equal(s.citizens[0].journey.mode,'walk');
 run(s,180);assert.ok(parkEvents(s).length>0);assert.ok(s.citizens.every(c=>c.leisure.completed<=1));assert.ok(leisureFacilitySnapshot(s,park).reserved<=8);assert.doesNotThrow(()=>validateLeisure(s,64));
 const served=s.citizens.find(c=>c.leisure.completed);assert.equal(served.leisure.nextVisitAt,served.leisure.lastCompletedAt+LEISURE_VISIT_COOLDOWN);
});

test('demolition or utility closure frees park reservations and returns residents through their actual position',()=>{
 const {s,park}=town(1);run(s,10);const c=s.citizens[0],p={...c.position};s.tiles[park].kind=null;s.tiles[park].assetId=null;s.graphVersion++;reconcileLeisure(s,{force:true});s.clock.seconds++;s.clock.step++;updateLeisure(s,emit);assert.deepEqual(c.position,p);assert.equal(c.leisure.phase,'returning');assert.ok(c.journey||c.state==='blocked');assert.equal(parkEvents(s).length,0);assert.doesNotThrow(()=>validateLeisure(s,64));run(s,120);assert.equal(c.leisure.phase,'idle');
 const closed=town(1);run(closed.s,60);closed.s.tiles[closed.park].water=false;run(closed.s,1);assert.equal(closed.s.citizens[0].leisure.phase,'returning');assert.ok(leisureFacilitySnapshot(closed.s,closed.park).reason.includes('nước'));assert.equal(parkEvents(closed.s).length,0);
});

test('saved mid-walk and mid-visit resume deterministically; result sequences cannot be fabricated',()=>{
 const {s}=town(4);run(s,10);assert.doesNotThrow(()=>validateLeisure(s,64));const restored=structuredClone(s);run(s,190);run(restored,190);assert.deepEqual(restored.leisure,s.leisure);assert.deepEqual(restored.citizens,s.citizens);assert.deepEqual(restored.events,s.events);
 const second=town(1).s;run(second,60);const seated=structuredClone(second);run(second,40);run(seated,40);assert.deepEqual(seated.citizens,second.citizens);assert.equal(parkEvents(seated).length,1);assert.doesNotThrow(()=>validateLeisure(seated,64));
 const bad=structuredClone(seated);bad.citizens[0].leisure.lastCompletedSequence=bad.nextEventId;assert.throws(()=>validateLeisure(bad,64),/công viên/);assert.equal(leisureEventValid(s,{...parkEvents(s)[0],sequence:s.nextEventId}),false);
});

test('healthcare and dispatched crews take priority without cancelling the patients real journey',()=>{
 const {s}=town(1);run(s,10);const c=s.citizens[0];c.care={phase:'travelling',tile:index(10,17)};const journey=c.journey,positionBefore={...c.position},goal=c.goal;s.clock.seconds++;s.clock.step++;updateLeisure(s,emit);assert.equal(c.leisure.phase,'idle');assert.equal(c.journey,journey);assert.deepEqual(c.position,positionBefore);assert.equal(c.goal,goal);assert.equal(parkEvents(s).length,0);assert.doesNotThrow(()=>validateLeisure(s,64));
 const duties=town(1).s;duties.citizens[0].municipalAssignment={vehicleId:'on-duty'};run(duties,100);assert.equal(duties.citizens[0].leisure.phase,'idle');assert.equal(parkEvents(duties).length,0);
});

test('healthy tree count corresponds to the 3 authored park trees and responds to actual water, fire and heat',()=>{
 const {s,park}=town(0);assert.equal(leisureSnapshot(s).healthyTrees,3);assert.equal(s.leisure.parks[0].trees.length,LEISURE_PROFILES.park.trees.length);s.tiles[park].water=false;s.tiles[park].fire=100;s.weatherMode='heat';run(s,900);assert.equal(leisureSnapshot(s).healthyTrees,0);assert.ok(s.leisure.parks[0].trees.every(t=>t.health<60));
 s.tiles[park].fire=0;s.tiles[park].water=true;s.weatherMode='clear';run(s,3000);assert.equal(leisureSnapshot(s).healthyTrees,3);assert.doesNotThrow(()=>validateLeisure(s,64));const bad=structuredClone(s);bad.leisure.parks[0].trees.push({id:'made-up',x:0,y:0,health:100});assert.throws(()=>validateLeisure(bad,64),/công viên/);
});

test('walkable housing uses occupied homes, real foot paths and park/shop/school destinations',()=>{
 const {s,home,park}=town(12);assert.equal(leisureSnapshot(s).walkableHousingPct,100);s.tiles[park].active=false;assert.equal(leisureSnapshot(s).walkableHousingPct,0);s.tiles[index(6,17)]={...s.tiles[index(6,17)],kind:'commercial',assetId:'shop',active:true,connected:true,power:true,water:true,sewage:true};assert.equal(leisureSnapshot(s).walkableHousingPct,100);
 const lost=index(5,18);s.tiles[lost].kind=null;s.network={...s.network,connected:new Set([...s.network.connected].filter(i=>i!==lost))};s.graphVersion++;assert.equal(route(s,home,index(6,17),'walk').length,0);assert.equal(leisureSnapshot(s).walkableHousingPct,0);
 const empty=town(0).s;assert.equal(leisureSnapshot(empty).walkableHousingPct,undefined);
});

test('multi-source walkability respects the 400 metre foot-network boundary',()=>{
 const {s,home,park}=town(12);s.tiles[home].residents=0;s.tiles[park].kind=null;s.tiles[park].assetId=null;const origin=index(0,19),far=index(19,17),near=index(18,17);
 s.tiles[origin]={...s.tiles[home],residents:12};s.tiles[far]={...s.tiles[park],kind:'park',assetId:'far-park',active:true,connected:true,power:true,water:true,sewage:true};s.graphVersion++;
 assert.equal(leisureSnapshot(s).walkableHousingPct,0);s.tiles[far].kind=null;s.tiles[near]={...s.tiles[far],kind:'park',assetId:'near-park'};s.graphVersion++;
 assert.equal(leisureSnapshot(s).walkableHousingPct,100);
});

test('night visits are staggered and only a small subset of sleepers can choose the lit park',()=>{
 const {s}=town(40);s.clock.seconds=s.clock.step=0;delete s.leisure;for(const c of s.citizens){delete c.leisure;c.state='sleeping';}reconcileLeisure(s);const initial=new Set(s.citizens.map(c=>c.leisure.nextVisitAt));assert.ok(initial.size>10);run(s,1);assert.equal(s.citizens.filter(c=>leisureJourneyReserved(c)).length,0);run(s,200);const visited=s.citizens.filter(c=>c.leisure.episode>0).length;assert.ok(visited>0&&visited<=12);assert.ok(s.citizens.filter(c=>c.state==='sleeping').length>=28);
});

test('a pupils school commute has priority from 07:00 through 14:00 on weekdays',()=>{
 const {s}=town(3);s.clock.seconds=s.clock.step=7*3600+29*60;
 for(const c of s.citizens){c.age=10;c.study={tile:index(12,17)};c.leisure.nextVisitAt=0;}
 s.clock.seconds++;s.clock.step++;updateLeisure(s,emit);assert.ok(s.citizens.every(c=>c.leisure.phase==='idle'&&!c.journey));
 s.clock.seconds=s.clock.step=14*3600;updateLeisure(s,emit);assert.equal(s.citizens.filter(c=>c.leisure.phase==='travelling').length,3);
 const weekend=town(1).s;weekend.clock.seconds=weekend.clock.step=2*86400+7*3600+29*60;weekend.citizens[0].age=10;weekend.citizens[0].study={tile:index(12,17)};weekend.citizens[0].leisure.nextVisitAt=0;updateLeisure(weekend,emit);assert.equal(weekend.citizens[0].leisure.phase,'travelling');
});

test('real core preserves old saves, posts actual visitor counters and resumes the complete simulation snapshot',async()=>{
 const {createCity,serialize,validateSave,stepSimulation}=await import('../src/game/core.js');
 const {campaign,updateCampaign}=await import('../src/game/systems/campaign.js');
 const {metricKey}=await import('../src/game/systems/mission-metrics.js');
 const {MISSIONS}=await import('../src/config/progression.js');
 const s=createCity(),before={money:s.money,people:s.citizens.map(c=>c.id),clock:structuredClone(s.clock)},old=serialize(s);
 delete old.leisure;delete old.leisureVersion;for(const c of old.citizens)delete c.leisure;
 const migrated=validateSave(old);leisureSnapshot(migrated);assert.equal(migrated.money,before.money);assert.deepEqual(migrated.citizens.map(c=>c.id),before.people);assert.deepEqual(migrated.clock,before.clock);assert.doesNotThrow(()=>validateSave(serialize(migrated)));
 // Isolate leisure appointments, without inventing visitors or relocating them.
 for(const c of s.citizens){c.care.nextCheckAt=21600;c.leisure.nextVisitAt=0;}
 const campaignState=campaign(s);campaignState.claims=MISSIONS.filter(m=>m.campaignStage<9).map(m=>({id:m.id,at:0,revision:1}));campaignState.lastTick=null;updateCampaign(s,true);
 for(let n=0;n<200;n++)stepSimulation(s);const raw=serialize(s),restored=validateSave(raw);assert.deepEqual(serialize(restored),raw);assert.ok(leisureSnapshot(s).travelling+leisureSnapshot(s).present>0);
 for(let n=0;n<500;n++){stepSimulation(s);stepSimulation(restored);}assert.deepEqual(serialize(restored),serialize(s));assert.ok(s.leisure.completed>=1);
 const key=metricKey({metric:'visitors_served',filters:{place:'park'}});assert.equal(campaign(s).counters[key],s.leisure.completed);assert.doesNotThrow(()=>validateSave(serialize(s)));
});
