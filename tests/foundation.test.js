import {startConstruction} from '../src/game/systems/construction.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCity, validateSave, serialize, stepSimulation, executeCommand, index, SIZE } from '../src/game/core.js';
import { calendar, consumeSteps } from '../src/game/systems/clock.js';
import { cashBalance } from '../src/game/systems/economy.js';
import { formatMoney } from '../src/config/money.js';
const legacy=JSON.parse(readFileSync(new URL('./fixtures/legacy-v1.json',import.meta.url)));
const command=(s,type,payload,id=`command-${s.commandSequence+1}`)=>executeCommand(s,{id,sequence:s.commandSequence+1,type,payload});
function until(s,seconds){while(s.clock.seconds<seconds)stepSimulation(s);}
test('legacy migration preserves population and seed and converts money exactly once',()=>{
  const s=validateSave(legacy),snapshot=serialize(s);assert.equal(s.money,legacy.money*100);assert.equal(s.seed,legacy.seed);assert.equal(s.citizens.length,176);
  assert.equal(s.households.reduce((n,h)=>n+h.members.length,0),176);assert.ok(s.households.every(h=>h.members.length<=4));
  assert.equal(s.world.cellMeters,20);assert.equal(s.world.widthMeters,1280);
  assert.deepEqual(serialize(validateSave(snapshot)),snapshot);assert.deepEqual(serialize(validateSave(serialize(validateSave(snapshot)))),snapshot);
  const all=[...s.citizens,...s.households,...s.firms,...s.vehicles];assert.equal(new Set(all.map(e=>e.id)).size,all.length);
});
test('one seeded day replay and load during a commute preserve IDs, motion and attendance',()=>{
  const a=createCity(),b=createCity();until(a,8*3600);until(b,8*3600);
  assert.deepEqual(serialize(a),serialize(b));const traveller=a.citizens.find(c=>c.journey);assert.ok(traveller);const id=traveller.id;
  const restored=validateSave(serialize(a));assert.deepEqual(restored.citizens.find(c=>c.id===id),traveller);
  until(a,86400);until(restored,86400);assert.deepEqual(serialize(a),serialize(restored));assert.ok(a.citizens.some(c=>c.attendance>0));
  assert.equal(a.citizens.length,a.metrics.population);assert.ok(a.citizens.every(c=>c.state!=='in-vehicle'||c.journey?.mode==='car'));
});
test('time batching and pause preserve logical results at different playback speeds',()=>{
  const a=createCity(),b=createCity(),before=serialize(a);
  const paused=consumeSteps(0,()=>stepSimulation(a));assert.equal(paused.count,0);assert.deepEqual(serialize(a),before);
  let qa=0,qb=0;for(let i=0;i<120;i++){qa+=100;qa=consumeSteps(qa,()=>stepSimulation(a)).remaining;}
  for(let i=0;i<15;i++){qb+=800;qb=consumeSteps(qb,()=>stepSimulation(b)).remaining;}
  assert.deepEqual(serialize(a),serialize(b));assert.equal(a.clock.seconds,12000);
  const capped=consumeSteps(50000,()=>{},10);assert.equal(capped.count,10);assert.equal(capped.remaining,49990);
});
test('road deletion blocks a real journey without teleporting and restoration resumes it',()=>{
  const s=createCity();until(s,8*3600);const c=s.citizens.find(c=>c.journey&&c.journey.path.slice(c.journey.segment+1).some(p=>p.road!=null));assert.ok(c);
  const road=c.journey.path.slice(c.journey.segment+1).find(p=>p.road!=null).road;
  assert.ok(command(s,'place',{x:road%SIZE,y:Math.floor(road/SIZE),kind:'bulldoze'}).ok);const position={...c.position};stepSimulation(s);
  assert.equal(c.state,'blocked');assert.deepEqual(c.position,position);assert.equal(c.attendance,0);
  assert.ok(command(s,'place',{x:road%SIZE,y:Math.floor(road/SIZE),kind:'road'}).ok);stepSimulation(s);assert.notEqual(c.state,'blocked');assert.notDeepEqual(c.position,position);
});
test('command replay is idempotent, conflicting payload/sequence cannot spend or borrow',()=>{
  const s=createCity(),request={id:'loan-one',sequence:1,type:'borrow',payload:{amount:500000}},cash=s.money;
  assert.ok(executeCommand(s,request).ok);const saved=serialize(s);assert.ok(executeCommand(s,request).ok);assert.equal(s.money,cash+500000);assert.deepEqual(serialize(s),saved);
  assert.equal(executeCommand(s,{...request,payload:{amount:1000000}}).ok,false);
  assert.equal(executeCommand(s,{...request,id:'another',sequence:1}).ok,false);
  const restored=validateSave(saved);assert.ok(executeCommand(restored,request).ok);assert.deepEqual(serialize(restored),saved);
  assert.equal(restored.money-restored.loanBalance,cash);assert.ok(Math.abs(cashBalance(restored)-restored.money)<.001);
});
test('park commands complete immediately; old funded contracts load without a second payment',()=>{
 const s=createCity(),at=index(13,20),cash=s.money;
 assert.ok(command(s,'construct',{x:13,y:20,kind:'park'}).ok);assert.equal(s.tiles[at].kind,'park');
 const contract=s.contracts[0];assert.equal(contract.status,'completed');assert.equal(contract.progress,1);assert.equal(contract.escrow,0);assert.equal(cash-s.money,contract.paid);
 const loaded=validateSave(serialize(s));assert.deepEqual(serialize(loaded),serialize(s));const after=loaded.money;
 assert.equal(command(loaded,'cancel-construction',{id:contract.id}).ok,false);assert.equal(loaded.money,after);
 const old=createCity();assert.ok(startConstruction(old,at,'park',150000,1).ok);const reserved=old.money;until(old,450);
 const restored=validateSave(serialize(old));assert.equal(restored.tiles[at].kind,'park');assert.equal(restored.contracts[0].status,'completed');assert.equal(restored.money,reserved);assert.deepEqual(serialize(validateSave(serialize(restored))),serialize(restored));
});
test('calendar uses real months and Vietnamese đồng display uses one stable conversion',()=>{
  assert.equal(calendar(0).daysInMonth,31);assert.equal(calendar(31*86400).daysInMonth,28);assert.equal(calendar(59*86400).daysInMonth,31);
  assert.equal(formatMoney(12000000),'12 tỷ ₫');assert.equal(formatMoney(91850),'91,85 triệu ₫');assert.equal(formatMoney(-10),'-10.000 ₫');
});
test('corrupt relationships, duplicate IDs, invalid clock and ledger are rejected',()=>{
  const original=serialize(createCity());
  for(const mutate of [s=>s.citizens[1].id=s.citizens[0].id,s=>s.citizens[0].household='missing',s=>s.clock.seconds++,s=>s.money++,s=>s.vehicles[0].passengers=['missing']]){const bad=structuredClone(original);mutate(bad);assert.throws(()=>validateSave(bad));}
});
test('demolition returns historical salvage and cannot refund prebuilt assets or a new catalog price',()=>{
  const s=createCity(),cash=s.money;command(s,'place',{x:8,y:17,kind:'bulldoze'});assert.equal(s.money,cash);
  assert.ok(command(s,'place',{x:8,y:17,kind:'power'}).ok);const paid=s.tiles[index(8,17)].historicalCost,before=s.money;
  assert.ok(command(s,'place',{x:8,y:17,kind:'bulldoze'}).ok);assert.equal(s.money-before,Math.floor(paid*.25));assert.ok(s.money<cash);
});
