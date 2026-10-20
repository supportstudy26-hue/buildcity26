import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,createEmptyCity,serialize,validateSave,index,SIZE} from '../src/game/core.js';
import {calendar,clockStep} from '../src/game/systems/clock.js';
import {updateCitizens} from '../src/game/systems/citizens.js';
import {route} from '../src/game/systems/roads.js';
import {emit} from '../src/game/systems/events.js';
import {recordCash,cashBalance} from '../src/game/systems/economy.js';
import {reconcileHealthcare,updateHealthcare,healthcareSnapshot,healthcareFacilitySnapshot,healthcarePosts,validateCare,validateHealthcare,healthcareJourneyReserved,healthcareEventValid} from '../src/game/systems/healthcare.js';
import {HEALTHCARE_PROFILES} from '../src/config/healthcare.js';

const CLINIC=index(10,20);
function town(){
  const s=createCity(),t=s.tiles[CLINIC];
  // Recruitment is normally owned by firms.js. This fixture uses existing
  // citizen IDs and existing road/utility graph; nobody is invented or moved.
  let f=s.firms.find(f=>f.home===CLINIC);
  if(!f){f={id:`firm-${t.assetId}`,home:CLINIC,capacity:healthcarePosts(t),employees:[],active:true,healthcare:true};s.firms.push(f);}
  f.healthcare=true;
  for(const c of s.citizens.filter(c=>c.age>=18&&c.age<65&&c.health>=40&&!s.firms.find(f=>f.id===c.work)?.school&&route(s,c.home,CLINIC,'walk').length)){
    if(f.employees.length>=f.capacity)break;
    const old=s.firms.find(o=>o.id===c.work);if(old)old.employees=old.employees.filter(id=>id!==c.id);
    c.work=f.id;f.employees.push(c.id);c.schedule.depart=7*3600;c.schedule.return=18*3600;
  }
  reconcileHealthcare(s,{force:true});s.clock.seconds=s.clock.step=7*3600+59*60;return s;
}
function run(s,seconds){for(let i=0;i<seconds;i++){const d=clockStep(s);updateCitizens(s,d,route,SIZE);updateHealthcare(s,emit);}}
function patient(s){const f=s.firms.find(f=>f.home===CLINIC);return s.citizens.find(c=>!f.employees.includes(c.id)&&route(s,c.home,CLINIC,'walk').length&&reconcileHealthcare(s).byHome.get(c.home)?.some(r=>r.tile===CLINIC));}
function rawState(s){return {...serialize(s),healthcareVersion:s.healthcareVersion,healthcare:structuredClone(s.healthcare)};}

test('health access requires a real staffed facility, route, supplies and physical staff arrival',()=>{
  const s=town(),before=healthcareSnapshot(s);assert.equal(before.accessPct,0);assert.equal(before.present,0);assert.equal(before.beds,8);
  assert.equal(healthcareSnapshot(createEmptyCity()).accessPct,undefined);run(s,360);
  const after=healthcareSnapshot(s);assert.ok(after.present>0);assert.ok(after.accessPct>=70);assert.ok(after.capacity<=after.present*2);assert.equal(healthcareFacilitySnapshot(s,CLINIC).staff.length,4);
  s.tiles[CLINIC].power=false;s.tiles[CLINIC].active=false;reconcileHealthcare(s,{force:true});assert.equal(healthcareSnapshot(s).accessPct,0);assert.match(healthcareFacilitySnapshot(s,CLINIC).reason,/điện/);
});

test('a citizen journeys to a bounded queue and recovers only after doctor treatment and supplies payment',()=>{
  const s=town(),c=patient(s);c.health=55;c.care.nextCheckAt=s.clock.seconds;
  updateHealthcare(s,emit);assert.equal(c.care.phase,'travelling');assert.ok(c.journey);assert.equal(c.journey.destination,CLINIC);assert.ok(c.journey.path.some(p=>p.road!=null));assert.equal(c.health,55);
  const before=s.money;run(s,900);assert.ok(c.care.completed>=1);assert.ok(c.health>55);assert.ok(s.money<before);assert.equal(cashBalance(s),s.money);
  const event=s.events.find(e=>e.type==='healthcare-treatment-completed'&&e.entity===c.id);assert.ok(event);assert.equal(event.result,'treated');assert.equal(event.applied,true);assert.ok(s.ledger.receipts.includes(`health-supply:${event.job}`));
  const supplied=s.ledger.entries.filter(e=>e.category==='healthcare-supplies'&&e.reference===event.job);assert.equal(supplied.length,1);assert.equal(supplied[0].amount,-HEALTHCARE_PROFILES.clinic.supplies);
  const r=healthcareFacilitySnapshot(s,CLINIC);assert.ok(r.occupied<=r.capacity);assert.ok(r.patients.length<=r.queueCapacity);
});

test('coverage and absent personnel cannot complete care; depleted supplies stop admission',()=>{
  const s=town(),c=patient(s);c.health=50;c.care.nextCheckAt=s.clock.seconds;
  const f=s.firms.find(f=>f.home===CLINIC);f.serviceShift=false;
  for(const id of f.employees)s.citizens.find(c=>c.id===id).schedule.depart=20*3600;
  run(s,600);assert.equal(c.care.completed,0);assert.equal(healthcareFacilitySnapshot(s,CLINIC).present,0);assert.ok(c.health<=50);assert.equal(s.ledger.entries.filter(e=>e.category==='healthcare-supplies').length,0);
  for(const id of f.employees)s.citizens.find(c=>c.id===id).schedule.depart=7*3600;
  recordCash(s,'fixture-no-supplies','fixture',-s.money);run(s,600);assert.equal(c.care.completed,0);assert.equal(healthcareSnapshot(s).accessPct,0);
  const facility=healthcareFacilitySnapshot(s,CLINIC);assert.ok(facility.present>0);assert.match(facility.reason,/kinh phí/i);assert.equal(s.ledger.entries.filter(e=>e.category==='healthcare-supplies').length,0);
});

test('treatment pauses on lost utilities and resumes without paying for the same admission twice',()=>{
  const s=town(),c=patient(s);c.health=45;c.care.nextCheckAt=s.clock.seconds;
  let guard=0;while(c.care.phase!=='treatment'&&guard++<900)run(s,1);assert.equal(c.care.phase,'treatment');
  const progress=c.care.progress,job=c.care.job,money=s.money;s.tiles[CLINIC].active=false;s.tiles[CLINIC].water=false;reconcileHealthcare(s,{force:true});run(s,120);
  assert.equal(c.care.progress,progress);assert.equal(c.care.completed,0);assert.equal(s.money,money);
  s.tiles[CLINIC].active=true;s.tiles[CLINIC].water=true;reconcileHealthcare(s,{force:true});run(s,90);assert.equal(c.care.completed,1);assert.equal(s.ledger.entries.filter(e=>e.id===`health-supply:${job}`).length,1);
});

test('save halfway through care resumes the same journey, queue and treatment without duplicate results',()=>{
  const s=town(),c=patient(s);c.health=40;c.care.nextCheckAt=s.clock.seconds;run(s,80);
  const raw=rawState(s);assert.doesNotThrow(()=>validateHealthcare(raw,SIZE));const restored=validateSave(raw);
  // Core adopts the persisted service fields; keeping this assertion prevents
  // a module-only integration from silently dropping service progress.
  assert.deepEqual(restored.healthcare,raw.healthcare);assert.deepEqual(restored.citizens.find(p=>p.id===c.id).care,c.care);
  run(s,900);run(restored,900);assert.deepEqual(rawState(restored),rawState(s));
  const completed=s.healthcare.completed,money=s.money;updateHealthcare(s,emit);updateHealthcare(s,emit);assert.equal(s.healthcare.completed,completed);assert.equal(s.money,money);
  assert.doesNotThrow(()=>validateSave(rawState(s)));
});

test('demolished clinic releases patients without teleporting and cannot award a treatment',()=>{
  const s=town(),c=patient(s);c.health=50;c.care.nextCheckAt=s.clock.seconds;let guard=0;while(!healthcareJourneyReserved(c)&&guard++<900)run(s,1);assert.ok(healthcareJourneyReserved(c));
  const p={...c.position},completed=c.care.completed;s.tiles[CLINIC].kind=null;s.tiles[CLINIC].assetId=null;s.firms=s.firms.filter(f=>f.home!==CLINIC);s.graphVersion++;reconcileHealthcare(s,{force:true});updateHealthcare(s,emit);
  // Last update at the same second is idempotent; advance one second to act.
  run(s,1);assert.equal(c.care.phase,'returning');assert.equal(c.care.tile,null);assert.equal(c.care.completed,completed);assert.ok(Math.hypot(c.position.x-p.x,c.position.y-p.y)<30);assert.doesNotThrow(()=>validateHealthcare(rawState(s),SIZE));
});

test('triage admits urgent cases first and validation rejects fabricated progress, asset and receipts',()=>{
  const s=town();run(s,360);const c=patient(s);c.health=20;c.care.phase='idle';c.care.job=null;c.care.tile=null;c.care.assetId=null;c.care.progress=0;c.care.required=0;c.care.paid=0;c.care.nextCheckAt=s.clock.seconds;run(s,600);
  assert.ok(c.care.completed>0);const raw=rawState(s);assert.doesNotThrow(()=>validateHealthcare(raw,SIZE));
  const invalid=structuredClone(raw),target=invalid.citizens.find(p=>p.id===c.id);target.care.lastCompletedSequence=invalid.nextEventId;assert.throws(()=>validateHealthcare(invalid,SIZE),/chữa bệnh/);
  const unpaid=structuredClone(raw);unpaid.ledger.receipts=unpaid.ledger.receipts.filter(id=>id!==`health-supply:${c.care.lastJob}`);assert.throws(()=>validateHealthcare(unpaid,SIZE),/chữa bệnh/);
  const tamper=structuredClone(c.care);tamper.phase='treatment';tamper.tile=CLINIC;tamper.assetId='fake';assert.throws(()=>validateCare(tamper,c,raw,SIZE),/chữa bệnh/);
});

test('health exposure and age use the simulation clock; safe coverage does not instantly heal citizens',()=>{
  const s=town(),c=patient(s);c.health=75;c.care.nextCheckAt=s.clock.seconds+3600;
  const t=s.tiles[c.home];t.pollution=90;t.garbage=80;t.water=false;t.sewage=false;
  const before=c.health;run(s,60);assert.ok(c.health<before);assert.equal(c.care.completed,0);
  const now=c.health;updateHealthcare(s,emit);assert.equal(c.health,now);
});

test('completion proof is valid only at an applied staffed treatment; forged events do not mutate state',()=>{
  const s=town(),c=patient(s);c.health=50;c.care.nextCheckAt=s.clock.seconds;let proofs=0;
  for(let i=0;i<900;i++){
    const d=clockStep(s);updateCitizens(s,d,route,SIZE);updateHealthcare(s,(state,type,id,detail)=>{
      const e=emit(state,type,id,detail);if(type!=='healthcare-treatment-completed')return;
      const before=JSON.stringify(rawState(state));assert.equal(healthcareEventValid(state,e),true);proofs++;assert.equal(healthcareEventValid(state,{...e,sequence:e.sequence+1}),false);assert.equal(healthcareEventValid(state,{...e,applied:false}),false);assert.equal(JSON.stringify(rawState(state)),before);
    });
  }
  assert.ok(proofs>0);const e=s.events.find(e=>e.type==='healthcare-treatment-completed');assert.equal(healthcareEventValid(s,e),false);
});
