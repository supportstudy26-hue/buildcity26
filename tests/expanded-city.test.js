import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,createEmptyCity,place,analyze,serialize,validateSave,index,tick,stepSimulation,CATALOG} from '../src/game/core.js';
import {BUILDINGS,serviceKind} from '../src/config/catalog.js';
import {chunkParts} from '../src/game/render/scene-data.js';

test('empty start has no prebuilt assets, agents, debt or XP and retains the old starting city',()=>{
 const old=createCity(),before=serialize(old),empty=createEmptyCity({world:old.world,name:old.name});
 assert.equal(empty.metrics.population,0);assert.equal(empty.metrics.roadCount,0);assert.equal(empty.metrics.homes,0);
 assert.ok(empty.tiles.every(t=>!t.kind&&!t.zone&&!t.historicalCost));
 for(const list of ['citizens','households','firms','vehicles','contracts'])assert.equal(empty[list].length,0);
 assert.equal(empty.money,100000);assert.equal(empty.progression.xp,0);assert.equal(empty.loanBalance,0);
 assert.deepEqual(empty.world,old.world);assert.notEqual(empty.world,old.world);
 assert.deepEqual(serialize(old),before);assert.equal(old.metrics.population,176);
 assert.deepEqual(serialize(validateSave(JSON.parse(JSON.stringify(serialize(empty))))),serialize(empty));
});
test('player can build a connected, supplied growing city from empty land',()=>{
 const s=createEmptyCity({startingCash:12000000});for(let x=0;x<8;x++)assert.ok(place(s,x,18,'road').ok);
 assert.ok(place(s,2,17,'power').ok);assert.ok(place(s,3,17,'waterPump').ok);
 assert.ok(place(s,4,17,'treatmentPlant').ok);assert.ok(place(s,5,17,'residential').ok);
 assert.ok(place(s,6,17,'commercial').ok);assert.equal(s.tiles[index(5,17)].active,true);
 for(let second=0;second<1140;second++)stepSimulation(s);
 assert.ok(s.metrics.population>0);assert.ok(s.tiles[index(5,17)].sewage);assert.ok(s.metrics.jobs>0);
});
test('larger water/sewage facilities supply actual capacity, charge once and stop on disconnection',()=>{
 const s=createCity(),before=s.money,water=s.metrics.water;
 assert.ok(place(s,6,17,'waterPump').ok);assert.equal(before-s.money,CATALOG.waterPump.cost);
 assert.equal(s.metrics.water,water+5000);
 assert.ok(place(s,6,19,'treatmentPlant').ok);assert.equal(s.metrics.sewage,5090);
 place(s,1,18,'bulldoze');assert.equal(s.metrics.water,0);assert.equal(s.metrics.sewage,0);
});
test('extended public-service ranges affect coverage without double-counting happiness',()=>{
 const s=createEmptyCity({startingCash:12000000});for(let x=0;x<24;x++)place(s,x,18,'road');
 place(s,10,17,'power');place(s,11,17,'waterPump');place(s,12,17,'treatmentPlant');
 place(s,1,17,'hospital');place(s,16,17,'residential');
 assert.ok(s.tiles[index(16,17)].services.includes('clinic'));
 assert.ok(!s.tiles[index(16,17)].services.includes('hospital'));
 assert.ok(s.metrics.expenses>CATALOG.hospital.upkeep);
 s.budgets.clinic=50;analyze(s);assert.ok(!s.tiles[index(16,17)].services.includes('clinic'));
 s.budgets.clinic=100;analyze(s);assert.ok(s.tiles[index(16,17)].services.includes('clinic'));
 place(s,0,18,'bulldoze');assert.ok(!s.tiles[index(16,17)].services.includes('clinic'));assert.equal(s.metrics.water,0);
});
test('larger waste collection decreases real accumulated garbage faster',()=>{
 const s=createCity();place(s,13,20,'wasteCenter'); // needs adjacent road; choose x10 beside vertical x11
 place(s,10,15,'wasteCenter');const t=s.tiles[index(12,17)];t.garbage=40;const old=t.garbage;
 tick(s);assert.ok(t.wasteCollection===8);assert.ok(t.garbage<old-4);
});
test('all 24 facilities survive saves and have light geometry; old saves remain readable',()=>{
 assert.equal(BUILDINGS.length,24);
 for(const kind of BUILDINGS){
  const s=createEmptyCity({startingCash:12000000});assert.ok(place(s,2,12,kind).ok);const raw=serialize(s),loaded=validateSave(JSON.parse(JSON.stringify(raw)));
  assert.deepEqual(serialize(loaded),raw);
  const parts=chunkParts(loaded,0,0).filter(p=>p.tile===index(2,12));assert.ok(parts.length>0);assert.ok(parts.length<45);
  assert.ok(CATALOG[kind].upkeep>0);assert.ok(CATALOG[serviceKind(kind)]);
 }
 assert.equal(validateSave(serialize(createCity())).metrics.population,176);
});

test('100-million start can afford utilities, homes and employment without changing legacy saves',()=>{
 const s=createEmptyCity();assert.equal(s.money,100000);
 for(let x=0;x<3;x++)assert.ok(place(s,x,18,'road').ok);
 for(const [x,y,kind] of [[0,17,'smallPower'],[1,17,'smallWater'],[2,17,'smallSewage'],[0,19,'residential'],[1,19,'commercial']])assert.ok(place(s,x,y,kind).ok);
 assert.equal(s.money,17400);assert.equal(s.metrics.power,100);assert.equal(s.metrics.water,15);assert.equal(s.metrics.sewage,15);
 for(let second=0;second<1140;second++)stepSimulation(s);
 assert.ok(s.metrics.population>0);assert.ok(s.metrics.jobs>0);assert.ok(s.money>0);
 const copy=validateSave(JSON.parse(JSON.stringify(serialize(s))));assert.equal(copy.money,s.money);
 assert.equal(validateSave(serialize(createCity())).money,12000000);
});

test('account server creates an empty 100 million city for default and selected geography',async()=>{
 const {createRegistrationCity}=await import('../server/start-city.js');
 for(const region of [null,'31-start']){const city=await createRegistrationCity(region);assert.equal(city.money,100000);assert.equal(city.ledger.openingCash,100000);assert.equal(city.citizens.length,0);const loaded=validateSave(serialize(city));assert.equal(loaded.money,100000);}
});
