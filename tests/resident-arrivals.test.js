import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCity,place,index,stepSimulation,serialize,validateSave} from '../src/game/core.js';
import {populationStatus,arrivalReady,arrivalPace} from '../src/game/systems/resident-arrivals.js';
function homes(){const s=createEmptyCity();for(let x=0;x<7;x++)assert.ok(place(s,x,18,'road').ok);assert.ok(place(s,5,19,'residential').ok);return s;}
function utilities(s){for(const [x,k] of [[0,'smallPower'],[1,'smallWater'],[2,'smallSewage']])assert.ok(place(s,x,17,k).ok);}
const run=(s,n)=>{for(let i=0;i<n;i++)stepSimulation(s);};
test('new homes need a gate connection and clean water, not every service',()=>{
 const s=createEmptyCity();assert.ok(place(s,5,19,'residential').ok);assert.match(populationStatus(s).label,/cổng/);run(s,120);assert.equal(s.citizens.length,0);
 for(let x=0;x<7;x++)assert.ok(place(s,x,18,'road').ok);assert.match(populationStatus(s).label,/nước sạch/);run(s,120);assert.equal(s.citizens.length,0);
 assert.ok(place(s,1,17,'smallWater').ok);const t=s.tiles[index(5,19)];assert.equal(t.power,false);assert.equal(t.sewage,false);assert.equal(arrivalReady(t),true);
 assert.equal(populationStatus(s).ready,1);run(s,120);assert.ok(s.citizens.length>0);assert.equal(s.metrics.power,0);assert.equal(t.power,false);assert.equal(t.sewage,false);
});
test('a new resident at midnight has a real move-in route; saving and reloading preserve it',()=>{
 const s=homes();utilities(s);run(s,30);assert.equal(s.citizens.length,1);const c=s.citizens[0];assert.equal(c.journey.purpose,'move-in');assert.equal(c.journey.origin,index(0,18));assert.equal(c.journey.destination,c.home);assert.ok(c.journey.path.some(p=>p.road!=null));assert.ok(['walking','in-vehicle'].includes(c.state));
 const saved=serialize(s),loaded=validateSave(saved);assert.deepEqual(loaded.citizens[0],c);assert.equal(loaded.money,s.money);run(loaded,180);assert.equal(loaded.citizens[0].journey,null);assert.equal(loaded.citizens[0].goal,c.home);assert.ok(['home','sleeping'].includes(loaded.citizens[0].state));assert.ok(loaded.citizens.length>=1);
});
test('missing power, sewage, jobs and low happiness slow real growth without blocking; fire and dry houses still block',()=>{
 const s=homes();assert.ok(place(s,1,17,'smallWater').ok);const t=s.tiles[index(5,19)];const slow=arrivalPace(s,t).rate;
 assert.ok(place(s,0,17,'smallPower').ok);assert.ok(arrivalPace(s,t).rate>slow);const withoutSewage=arrivalPace(s,t).rate;
 assert.ok(place(s,2,17,'smallSewage').ok);assert.ok(arrivalPace(s,t).rate>withoutSewage);
 t.happiness=39;assert.equal(arrivalReady(t),true);assert.ok(arrivalPace(s,t).rate>0);t.happiness=0;assert.equal(arrivalReady(t),true);assert.ok(arrivalPace(s,t).rate>0);
 t.fire=65;assert.equal(arrivalReady(t),false);t.fire=0;t.water=false;assert.equal(arrivalReady(t),false);t.water=true;t.connected=false;assert.equal(arrivalReady(t),false);
});
test('paused and full homes report their actual state without mutating city data',()=>{
 const s=homes();utilities(s);s.playback.paused=true;const before=serialize(s);assert.match(populationStatus(s).label,/tạm dừng/);assert.deepEqual(serialize(s),before);
 s.tiles[index(5,19)].residents=24;assert.match(populationStatus(s).label,/đầy/);assert.equal(arrivalReady(s.tiles[index(5,19)]),false);
});

test('first 100 residents use the faster base rate; larger cities still grow with unemployment',()=>{
 const s=homes();utilities(s);const t=s.tiles[index(5,19)];t.happiness=65;
 s.metrics.population=99;s.metrics.workforce=54;s.metrics.jobs=0;assert.equal(arrivalPace(s,t).interval,30);
 s.metrics.population=100;const noJobs=arrivalPace(s,t);assert.equal(noJobs.interval,120);assert.ok(noJobs.rate>0);
 s.metrics.jobs=54;assert.equal(arrivalPace(s,t).interval,60);assert.equal(arrivalPace(s,t).needsJobs,false);
 s.playback.multiplier=8;assert.equal(arrivalPace(s,t).realSeconds,2);s.playback.observe=true;assert.equal(arrivalPace(s,t).realSeconds,60);
});

test('save between arrivals preserves fractional progress, identities, receipts and cash; pause does not catch up',()=>{
 const s=homes();assert.ok(place(s,1,17,'smallWater').ok);run(s,17);const t=s.tiles[index(5,19)];assert.ok(t.development.arrivals>0&&t.development.arrivals<60);
 const saved=serialize(s),copy=validateSave(JSON.parse(JSON.stringify(saved)));assert.equal(copy.tiles[index(5,19)].development.arrivals,t.development.arrivals);assert.deepEqual(serialize(copy),saved);
 const next=populationStatus(s).pace.remaining;run(s,next);run(copy,next);assert.equal(copy.citizens.length,1);assert.deepEqual(serialize(copy),serialize(s));assert.equal(copy.money,saved.money);assert.deepEqual(copy.commandReceipts,saved.commandReceipts);assert.deepEqual(copy.campaign?.claimed,saved.campaign?.claimed);
 const before=serialize(copy);copy.playback.paused=true;assert.match(populationStatus(copy).label,/tạm dừng/);assert.equal(copy.clock.seconds,before.clock.seconds);assert.deepEqual(copy.citizens,before.citizens);
 const c=copy.citizens[0];assert.equal(c.journey.origin,index(0,18));assert.equal(c.journey.destination,c.home);assert.equal(c.journey.purpose,'move-in');
});
