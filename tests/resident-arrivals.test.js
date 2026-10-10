import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCity,place,index,stepSimulation,serialize,validateSave} from '../src/game/core.js';
import {populationStatus,arrivalReady} from '../src/game/systems/resident-arrivals.js';
function homes(){const s=createEmptyCity();for(let x=0;x<7;x++)assert.ok(place(s,x,18,'road').ok);assert.ok(place(s,5,19,'residential').ok);return s;}
function utilities(s){for(const [x,k] of [[0,'smallPower'],[1,'smallWater'],[2,'smallSewage']])assert.ok(place(s,x,17,k).ok);}
const run=(s,n)=>{for(let i=0;i<n;i++)stepSimulation(s);};
test('zero population identifies disconnected homes, then each missing utility',()=>{
 const s=createEmptyCity();assert.ok(place(s,5,19,'residential').ok);assert.match(populationStatus(s).label,/cổng/);run(s,120);assert.equal(s.citizens.length,0);
 for(let x=0;x<7;x++)assert.ok(place(s,x,18,'road').ok);assert.match(populationStatus(s).label,/điện/);
 assert.ok(place(s,0,17,'smallPower').ok);assert.match(populationStatus(s).label,/nước sạch/);
 assert.ok(place(s,1,17,'smallWater').ok);assert.match(populationStatus(s).label,/nước thải/);
 assert.ok(place(s,2,17,'smallSewage').ok);assert.equal(arrivalReady(s.tiles[index(5,19)]),true);
});
test('a new resident at midnight has a real move-in route; saving and reloading preserve it',()=>{
 const s=homes();utilities(s);run(s,60);assert.equal(s.citizens.length,1);const c=s.citizens[0];assert.equal(c.journey.purpose,'move-in');assert.equal(c.journey.origin,index(0,18));assert.equal(c.journey.destination,c.home);assert.ok(c.journey.path.some(p=>p.road!=null));assert.ok(['walking','in-vehicle'].includes(c.state));
 const saved=serialize(s),loaded=validateSave(saved);assert.deepEqual(loaded.citizens[0],c);assert.equal(loaded.money,s.money);run(loaded,180);assert.equal(loaded.citizens[0].journey,null);assert.equal(loaded.citizens[0].goal,c.home);assert.ok(['home','sleeping'].includes(loaded.citizens[0].state));assert.ok(loaded.citizens.length>=1);
});
test('utility coverage, sewage and safety affect arrivals rather than just capacity',()=>{
 const s=homes();assert.ok(place(s,0,17,'smallPower').ok);assert.ok(place(s,1,17,'smallWater').ok);run(s,120);assert.equal(s.citizens.length,0);assert.match(populationStatus(s).label,/nước thải/);assert.ok(place(s,2,17,'smallSewage').ok);run(s,60);assert.equal(s.citizens.length,1);
 const t=s.tiles[index(5,19)];t.fire=65;assert.equal(arrivalReady(t),false);t.fire=0;t.happiness=47;assert.equal(arrivalReady(t),false);
});
test('paused and full homes report their actual state without mutating city data',()=>{
 const s=homes();utilities(s);s.playback.paused=true;const before=serialize(s);assert.match(populationStatus(s).label,/tạm dừng/);assert.deepEqual(serialize(s),before);
 s.tiles[index(5,19)].residents=24;assert.match(populationStatus(s).label,/đầy/);assert.equal(arrivalReady(s.tiles[index(5,19)]),false);
});
