import test from 'node:test';import assert from 'node:assert/strict';
import {actorBudget,nearestActors} from '../src/game/render/actor-budget.js';
test('Every population shares one combined cap: 50 people/vehicles, low/mobile 30; high cannot bypass it',()=>{
 for(const population of [0,57,1000,5000,100000])for(const quality of ['medium','high']){
  assert.equal(actorBudget(population,quality),50);assert.equal(actorBudget(population,quality,true),30);assert.equal(actorBudget(population,'low'),30);
 }
});
test('Bounded selection keeps closest actors and tracking without modifying simulation objects',()=>{
 const actors=Array.from({length:5000},(_,i)=>({c:{id:'person-'+i,journey:{distance:i}},d:5000-i})),before=JSON.stringify(actors);
 const selected=nearestActors(actors,50,'person-0');assert.equal(selected.length,50);assert.equal(selected[0].c.id,'person-0');assert.equal(selected[1].c.id,'person-4999');assert.equal(selected.at(-1).d,49);
 assert.equal(JSON.stringify(actors),before);assert.deepEqual(nearestActors([],50),[]);
});
