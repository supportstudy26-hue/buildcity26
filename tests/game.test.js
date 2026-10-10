import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,serialize,validateSave,place,tick,stepSimulation,analyze,index,route,neighbors,SIZE} from '../src/game/core.js';

test('a disconnected road network disables downstream utilities and reconnecting restores them',()=>{
  const s=createCity();assert.ok(s.metrics.power>0);assert.equal(s.tiles[index(12,17)].active,true);
  const cut=place(s,1,18,'bulldoze');assert.ok(cut.ok);assert.equal(s.metrics.power,0);assert.equal(s.tiles[index(12,17)].active,false);
  assert.ok(place(s,1,18,'road').ok);assert.equal(s.tiles[index(12,17)].active,true);
});
test('insufficient funds leave money and map unchanged',()=>{
  const s=createCity();s.money=0;const before=serialize(s);assert.equal(place(s,6,10,'clinic').ok,false);assert.deepEqual(serialize(s),before);
});
test('houses appear immediately without water, then operate when supply is restored',()=>{
  const s=createCity();place(s,9,17,'bulldoze');place(s,8,19,'residential');for(let i=0;i<80;i++)tick(s);assert.equal(s.tiles[index(8,19)].kind,'residential');assert.equal(s.tiles[index(8,19)].active,false);assert.equal(s.tiles[index(8,19)].residents,0);
  assert.ok(place(s,9,17,'water').ok);for(let i=0;i<1140;i++)stepSimulation(s);assert.equal(s.tiles[index(8,19)].kind,'residential');assert.ok(s.tiles[index(8,19)].residents>0);
});
test('traffic routes use contiguous connected roads',()=>{
  const s=createCity(),path=route(s,index(12,17),index(20,23));assert.ok(path.length>1);
  for(let i=1;i<path.length;i++)assert.ok(neighbors(path[i-1]).includes(path[i]));
  place(s,1,18,'bulldoze');assert.deepEqual(route(s,index(12,17),index(20,23)),[]);
});
test('bridges include deck area and pier costs and land buildings cannot be placed in water',()=>{
  const s=createCity();const i=s.tiles.findIndex(t=>t.terrain==='water');const x=i%SIZE,y=Math.floor(i/SIZE),before=s.money;
  assert.equal(place(s,x,y,'residential').ok,false);assert.ok(place(s,x,y,'road').ok);assert.equal(before-s.money,134000);
});
test('demolition removes residents and a full simulation save round-trips',()=>{
  const s=createCity(),before=s.metrics.population;place(s,12,17,'bulldoze');assert.ok(s.metrics.population<before);for(let i=0;i<30;i++)tick(s);const raw=serialize(s);assert.deepEqual(serialize(validateSave(JSON.parse(JSON.stringify(raw)))),raw);
});
test('malformed and incompatible imports fail before replacing an active game',()=>{
  const s=serialize(createCity());assert.throws(()=>validateSave({...s,schemaVersion:99}));assert.throws(()=>validateSave({...s,tiles:[]}));assert.throws(()=>validateSave({...s,money:Infinity}));assert.throws(()=>validateSave({...s,taxes:{...s.taxes,residential:-1}}));
  const bad=structuredClone(s);bad.tiles[index(12,17)].residents=1000;assert.throws(()=>validateSave(bad));
});
test('a year of simulation remains finite and residents never exceed capacity',()=>{
  const s=createCity();for(let i=0;i<365;i++)tick(s);assert.equal(s.day,365);assert.ok(Number.isFinite(s.money));assert.ok(s.metrics.happiness>=0&&s.metrics.happiness<=100);
  for(const t of s.tiles)if(t.kind==='residential')assert.ok(t.residents>=0&&t.residents<=24*t.level);
});
test('raising residential tax lowers happiness and increases gross revenue',()=>{
  const s=createCity();const h=s.metrics.happiness,inc=s.metrics.income;s.taxes.residential=20;analyze(s);assert.ok(s.metrics.happiness<h);assert.ok(s.metrics.income>inc);
});
test('road upgrades charge the difference without severing the network',()=>{
  const s=createCity(),before=s.money;assert.ok(place(s,11,18,'avenue').ok);assert.equal(before-s.money,11400);assert.equal(s.tiles[index(11,18)].connected,true);
});
