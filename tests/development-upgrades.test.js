import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCity,createCity,place,stepSimulation,serialize,validateSave,index,route,analyze,executeCommand,CATALOG} from '../src/game/core.js';
import {residentCapacity,jobsCapacity,roadPrice,PRIVATE_DESIGNS,privateBuildPrice} from '../src/config/building-economy.js';
import {developmentConditions} from '../src/game/systems/development.js';
import {upgradeQuote,startUpgrade,updateUpgrades} from '../src/game/systems/upgrades.js';
import {buildingDesign,buildingParts} from '../src/game/render/building-designs.js';
import {weatherState,setWeatherMode} from '../src/game/systems/weather.js';
import {startJourney} from '../src/game/systems/citizens.js';
import {cashBalance} from '../src/game/systems/economy.js';
function starter(){const s=createEmptyCity();for(let x=0;x<3;x++)assert.ok(place(s,x,18,'road').ok);for(const [x,y,k] of [[0,17,'smallPower'],[1,17,'smallWater'],[2,17,'smallSewage'],[0,19,'residential'],[1,19,'commercial'],[2,19,'industrial']])assert.ok(place(s,x,y,k).ok);return s;}
const steps=(s,n)=>{for(let i=0;i<n;i++)stepSimulation(s);};
test('placement creates all three building types immediately while paused and capital is charged once',()=>{
 const s=starter(),cash=s.money;assert.equal(cash,9916600);
 for(const kind of ['residential','commercial','industrial'])assert.ok(s.tiles.some(t=>t.kind===kind&&t.development.work===900));
 assert.equal(s.metrics.population,0);assert.equal(s.privateInvestment.available,20000000-432000-144000-356800);
 const raw=serialize(s),loaded=validateSave(raw);assert.deepEqual(serialize(loaded),raw);
 steps(loaded,120);assert.ok(loaded.metrics.population>0);assert.equal(loaded.privateInvestment.projects.length,3);assert.equal(loaded.money,cash);assert.equal(cashBalance(loaded),cash);
 assert.equal(buildingDesign(loaded.tiles[index(0,19)],0,19).artId,'row-houses');assert.equal(buildingDesign(loaded.tiles[index(1,19)],1,19).artId,'corner-shop');
});
test('a house appears without utilities; supplying it activates it without a second investment',()=>{
 const s=createEmptyCity();s.playback.paused=true;assert.ok(place(s,0,19,'residential','tile-house').ok);
 const i=index(0,19),t=s.tiles[i],capital=s.privateInvestment.available;assert.equal(t.kind,'residential');assert.equal(t.active,false);assert.equal(t.residents,0);assert.equal(residentCapacity(t),8);
 for(let x=0;x<3;x++)assert.ok(place(s,x,18,'road').ok);
 for(const [x,kind] of [[0,'smallPower'],[1,'smallWater'],[2,'smallSewage']])assert.ok(place(s,x,17,kind).ok);
 assert.equal(t.active,true);steps(s,60);assert.equal(t.development.work,900);assert.equal(s.privateInvestment.available,capital);
 const corrupt=serialize(s);corrupt.privateInvestment.available++;assert.throws(()=>validateSave(corrupt),/đối chiếu/);
});
test('old unfinished funded and unstarted plots load as completed once without resetting the save',()=>{
 const s=starter(),raw=serialize(s),i=index(0,19);raw.tiles[i].kind=null;raw.tiles[i].level=0;raw.tiles[i].assetId=null;raw.tiles[i].development.work=450;
 const loaded=validateSave(raw);assert.equal(loaded.tiles[i].kind,'residential');assert.equal(loaded.tiles[i].development.work,900);assert.equal(loaded.money,s.money);assert.equal(loaded.clock.seconds,s.clock.seconds);assert.equal(loaded.privateInvestment.available,s.privateInvestment.available);assert.equal(loaded.privateInvestment.projects.length,3);
 assert.deepEqual(serialize(validateSave(serialize(loaded))),serialize(loaded));
 const fresh=createEmptyCity(),legacy=serialize(fresh);Object.assign(legacy.tiles[i],{zone:'residential',blueprint:'tile-house'});
 const unstarted=validateSave(legacy);assert.equal(unstarted.tiles[i].kind,'residential');assert.equal(unstarted.money,fresh.money);assert.equal(unstarted.privateInvestment.projects.length,1);assert.deepEqual(serialize(validateSave(serialize(unstarted))),serialize(unstarted));
});
test('insufficient investor capital rejects instant placement atomically',()=>{
 const s=createEmptyCity();s.privateInvestment={rule:'private-casual-15min-v1',opening:20000000,available:0,projects:[]};const before=serialize(s);
 assert.equal(place(s,0,19,'residential','tile-house').ok,false);assert.deepEqual(serialize(s),before);
});
test('private upgrades preserve people/treasury, reserve once and grow actual capacity/mesh with sustained work',()=>{
 const s=createCity(),i=index(12,17),t=s.tiles[i];assert.ok(place(s,10,17,'waste').ok);assert.ok(place(s,10,19,'park').ok);analyze(s);const cash=s.money,people=s.citizens.map(c=>c.id),beforeParts=buildingParts(t,12,17,0,0,0);
 const q=upgradeQuote(s,i);assert.equal(q.price,108000);assert.equal(q.total,118800);assert.ok(startUpgrade(s,i,'owner').ok);assert.equal(startUpgrade(s,i,'owner').ok,false);assert.equal(s.money,cash);const budget=s.privateInvestment.available;
 for(let n=0;n<450;n++)updateUpgrades(s);let copy=validateSave(JSON.parse(JSON.stringify(serialize(s))));for(let n=0;n<450;n++)updateUpgrades(copy);
 assert.equal(copy.tiles[i].level,2);assert.equal(residentCapacity(copy.tiles[i]),28);assert.equal(copy.money,cash);assert.equal(copy.privateInvestment.available,budget+10800);assert.deepEqual(copy.citizens.map(c=>c.id),people);assert.notDeepEqual(buildingParts(copy.tiles[i],12,17,0,0,0),beforeParts);assert.equal(cashBalance(copy),cash);
});
test('public upgrades increase supply and upkeep, return unused reserve, and demolition refunds only unfinished work',()=>{
 const s=createCity(),i=index(8,17),t=s.tiles[i],before=s.metrics.power,cash=s.money;const q=upgradeQuote(s,i);assert.ok(startUpgrade(s,i,'city').ok);assert.equal(s.money,cash-q.total);for(let n=0;n<900;n++)updateUpgrades(s);analyze(s);assert.equal(s.metrics.power,before*1.25);assert.equal(s.money,cash-q.price);assert.equal(cashBalance(s),s.money);validateSave(JSON.parse(JSON.stringify(serialize(s))));
 const next=upgradeQuote(s,i);assert.ok(startUpgrade(s,i,'city').ok);const held=s.money;for(let n=0;n<90;n++)updateUpgrades(s);const u=t.upgrade;assert.ok(place(s,8,17,'bulldoze').ok);assert.equal(s.money-held,Math.floor(u.price*.9)+u.reserve+Math.floor(q.price*.25));assert.equal(s.tiles[i].upgrade,null);assert.equal(next.target,3);validateSave(JSON.parse(JSON.stringify(serialize(s))));
});
test('rain and heat use shared simulation seconds, alter real speed/demand and survive save/load',()=>{
 const s=createCity(),p=s.metrics.powerNeed,w=s.metrics.waterNeed;assert.ok(setWeatherMode(s,'heat').ok);analyze(s);assert.equal(s.metrics.powerNeed,p*1.15);assert.ok(Math.abs(s.metrics.waterNeed-w*1.1)<1e-8);assert.ok(setWeatherMode(s,'rain').ok);assert.equal(weatherState(s).roadSpeedFactor,.75);const restored=validateSave(JSON.parse(JSON.stringify(serialize(s))));assert.deepEqual(weatherState(restored),weatherState(s));
 assert.equal(executeCommand(s,{id:'bad-weather',sequence:1,type:'weather',payload:{mode:'infinite-money'}}).ok,false);
});
test('prices use m² and appendix values, separate permit from privately funded apartments',()=>{
 assert.equal(roadPrice('road'),12000+2000);assert.equal(roadPrice('road',true),84000+50000);assert.equal(CATALOG.residential.cost,800);assert.equal(CATALOG.school.cost,1500000);assert.equal(CATALOG.clinic.cost,1200000);assert.equal(CATALOG.busStop.cost,12000);
});

test('every one of the 13 selected blueprints becomes its actual 3D architecture at the recorded build price and capacity',()=>{
 for(const plan of Object.values(PRIVATE_DESIGNS)){
  const s=createEmptyCity(),i=index(0,19);for(const [x,y,k] of [[0,18,'road'],[1,18,'road'],[2,18,'road'],[0,17,'smallPower'],[1,17,'smallWater'],[2,17,'smallSewage']])assert.ok(place(s,x,y,k).ok);
  assert.ok(place(s,0,19,plan.kind,plan.designId).ok);assert.equal(s.tiles[i].blueprint,plan.designId);assert.equal(s.tiles[i].kind,plan.kind);const saved=validateSave(JSON.parse(JSON.stringify(serialize(s))));
  const t=saved.tiles[i],d=buildingDesign(t,0,19);assert.equal(d.id,plan.designId);assert.equal(t.development.basePrice,privateBuildPrice(plan.kind,plan.designId));assert.ok(Number.isFinite(d.height)&&d.height>4);assert.ok(buildingParts(t,0,19,0,0,0).some(p=>p.scale[1]>4),plan.designId);
  assert.equal(plan.kind==='residential'?residentCapacity(t):jobsCapacity(t),plan.capacity);assert.doesNotThrow(()=>validateSave(serialize(saved)));
 }
 const s=starter(),before=serialize(s);assert.equal(place(s,3,19,'residential','glass-office').ok,false);assert.deepEqual(serialize(s),before);
});
test('upgrades pause when service coverage is lost and resume from saved work; old houses no longer gain free levels',()=>{
 const s=createCity(),i=index(12,17);assert.ok(place(s,10,17,'waste').ok);assert.ok(place(s,10,19,'park').ok);assert.ok(startUpgrade(s,i).ok);steps(s,100);assert.equal(s.tiles[i].upgrade.work,100);
 assert.ok(place(s,10,19,'bulldoze').ok);steps(s,100);assert.equal(s.tiles[i].upgrade.work,100);let copy=validateSave(serialize(s));assert.ok(place(copy,10,19,'park').ok);steps(copy,800);assert.equal(copy.tiles[i].level,2);assert.equal(copy.tiles[i].upgrade.status,'completed');assert.doesNotThrow(()=>validateSave(serialize(copy)));
});

test('rain slows an actual car journey and survives saving mid-trip',()=>{
 const s=createCity(),c=s.citizens.find(c=>c.vehicle&&c.work);const goal=s.firms.find(f=>f.id===c.work).home;startJourney(s,c,goal,route,s.mapSize,false);const rain=validateSave(serialize(s));setWeatherMode(s,'clear');setWeatherMode(rain,'rain');
 stepSimulation(s);stepSimulation(rain);const wet=rain.citizens.find(p=>p.id===c.id);assert.ok(c.travelled>0);assert.ok(Math.abs(wet.travelled/c.travelled-.75)<1e-8);assert.ok(Math.abs(wet.journey.actualSpeed/c.journey.actualSpeed-.75)<1e-8);
 assert.doesNotThrow(()=>validateSave(serialize(rain)));
});
