import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,createEmptyCity,executeCommand,index,serialize,validateSave,prepareEducation,stepSimulation,analyze,SIZE,random} from '../src/game/core.js';
import {createClock} from '../src/game/systems/clock.js';
import {reconcileSociety} from '../src/game/systems/foundation.js';
import {educationSnapshot,reconcileEducation,schoolSnapshot,updateEducation} from '../src/game/systems/education.js';
import {campaign,updateCampaign,recordMissionEvent,missionViews,applyVerifiedClaim} from '../src/game/systems/campaign.js';
import {metricKey,snapshotMetric} from '../src/game/systems/mission-metrics.js';
import {verifyMissionCheckpoint} from '../server/missions.js';
import {MISSIONS} from '../src/config/progression.js';
import {emit} from '../src/game/systems/events.js';
import {SCHOOL_PROFILES} from '../src/config/education.js';

const key=metricKey({metric:'completed_jobs',filters:{service:'school_attendance'}});
function command(s,x,y,kind){return executeCommand(s,{id:`edu-${s.commandSequence+1}`,sequence:s.commandSequence+1,type:'place',payload:{x,y,kind}});}
function town(){const s=createCity();assert.ok(command(s,10,13,'secondarySchool').ok);s.clock=createClock(0);s.clock.seconds=s.clock.step=7*3600+29*60;return s;}
function run(s,seconds){for(let i=0;i<seconds;i++)stepSimulation(s);}
function stage6(s){const c=campaign(s);c.claims=MISSIONS.filter(m=>m.campaignStage<6).map(m=>({id:m.id,at:0,revision:1}));c.lastTick=null;updateCampaign(s,true);}

test('school access allocates real capacity by age, teacher and route; no demand stays undefined',()=>{
 const s=town(),e=educationSnapshot(s);assert.ok(e.eligible>=10);assert.equal(e.assigned,e.eligible);assert.equal(e.accessPct,100);
 for(const r of reconcileEducation(s).rows){assert.ok(r.staff.length<=r.posts);assert.ok(r.pupils.length<=r.capacity);for(const id of r.pupils){const c=s.citizens.find(c=>c.id===id),p=SCHOOL_PROFILES[r.kind];assert.ok(c.age>=p.minAge&&c.age<=p.maxAge);assert.equal(c.study.assetId,s.tiles[r.tile].assetId);}}
 assert.equal(snapshotMetric(createEmptyCity(),{metric:'school_access_pct'}).valid,false);
 const ids=s.citizens.map(c=>c.id),money=s.money;
 for(const c of s.citizens)if(c.age>=18&&c.age<65)c.health=0;
 reconcileSociety(s,SIZE,random);assert.equal(educationSnapshot(s).assigned,0);assert.equal(snapshotMetric(s,{metric:'school_access_pct'}).value,0);assert.equal(s.money,money);assert.deepEqual(s.citizens.map(c=>c.id),ids);
});

test('children walk to assigned schools; only supervised study completes one job per child/day',()=>{
 const s=town();stage6(s);run(s,90);
 const moving=s.citizens.find(c=>c.missionTrip?.purpose==='school'&&c.journey);assert.ok(moving);assert.equal(moving.journey.destination,moving.study.tile);assert.ok(moving.journey.path.some(p=>p.road!=null));assert.equal(campaign(s).counters[key]||0,0);
 run(s,1900);assert.ok((campaign(s).counters[key]||0)>=10);assert.ok(s.citizens.some(c=>c.state==='at-school'));
 const event=s.events.find(e=>e.type==='school-attendance-completed');assert.ok(event);
 const before=campaign(s).counters[key];recordMissionEvent(s,event);recordMissionEvent(s,{...event,sequence:s.nextEventId++});assert.equal(campaign(s).counters[key],before);
 run(s,120);assert.equal(campaign(s).counters[key],before);
 const person=s.citizens.find(c=>c.study?.attendedDays);assert.equal(person.study.attendedDays,1);assert.ok(person.study.totalSeconds>=60);assert.ok(person.education>=1);
 assert.ok(missionViews(s).find(m=>m.id==='bc26-main-006-b').ready);
});

test('a teacher must physically arrive; weekends and absent staff cannot create attendance',()=>{
 const s=town();s.clock.seconds=s.clock.step=8*3600;assert.equal(schoolSnapshot(s,index(10,14)).present,0);
 updateEducation(s,emit);assert.equal(campaign(s).counters[key]||0,0);
 run(s,600);assert.ok((campaign(s).counters[key]||0)>0);assert.ok(schoolSnapshot(s,index(10,14)).present>0);
 const weekend=town();weekend.clock=createClock(2);weekend.day=2;weekend.clock.seconds+=8*3600;weekend.clock.step=weekend.clock.seconds;
 run(weekend,600);assert.equal(campaign(weekend).counters[key]||0,0);assert.ok(!weekend.citizens.some(c=>c.state==='at-school'));
});

test('save mid-journey and mid-lesson resumes deterministically; old saves keep money, IDs and rewards',()=>{
 const s=town();run(s,90);const raw=serialize(s),restored=validateSave(raw);assert.deepEqual(serialize(restored),raw);
 run(s,2000);run(restored,2000);assert.deepEqual(serialize(restored),serialize(s));
 const inClass=validateSave(serialize(s)),before=campaign(s).counters[key];run(s,90);run(inClass,90);assert.deepEqual(serialize(inClass),serialize(s));assert.equal(campaign(inClass).counters[key],before);
 const legacy=serialize(createCity());delete legacy.educationVersion;for(const c of legacy.citizens){delete c.study;if(legacy.firms.find(f=>f.school&&f.id===c.work))c.work=null;}legacy.firms=legacy.firms.filter(f=>!f.school);
 const old=validateSave(legacy),ids=old.citizens.map(c=>c.id),cash=old.money,receipts=structuredClone(old.progression.receipts);stepSimulation(old);
 assert.equal(old.money,cash);assert.deepEqual(old.citizens.map(c=>c.id),ids);assert.deepEqual(old.progression.receipts,receipts);assert.equal(old.educationVersion,1);
});

test('demolition drops slots, keeps learning records and returns pupils without teleporting or paying twice',()=>{
 const s=town();run(s,2090);const r=schoolSnapshot(s,index(10,14)),person=s.citizens.find(c=>r.pupils.includes(c.id)&&c.state==='at-school');assert.ok(person);
 const p={...person.position},days=person.study.attendedDays,before=campaign(s).counters[key];assert.ok(command(s,10,14,'bulldoze').ok);
 assert.deepEqual(person.position,p);assert.equal(person.study.tile,null);assert.equal(person.study.attendedDays,days);assert.ok(educationSnapshot(s).accessPct<100);
 stepSimulation(s);assert.ok(person.journey||person.state==='blocked');assert.equal(campaign(s).counters[key],before);assert.doesNotThrow(()=>validateSave(serialize(s)));
});

test('capacity and route failures block learning, server replay rejects fabricated school counters',()=>{
 const s=town();stage6(s);run(s,1810);
 const checkpoint={state:serialize(s),wallMs:1000};const baseline=campaign(s).counters[key]||0;run(s,110);
 const raw=serialize(s);raw.progression.campaign.counters[key]=99999;
 const verified=verifyMissionCheckpoint(raw,checkpoint,5000,2).city;
 assert.equal(campaign(verified).counters[key],campaign(s).counters[key]);assert.ok((campaign(verified).counters[key]||0)>=baseline);assert.notEqual(campaign(verified).counters[key],99999);
 const bad=serialize(s);bad.citizens.find(c=>c.study?.tile!=null).study.assetId='not-a-school';assert.throws(()=>validateSave(bad),/Chỗ học/);
 // School has a single road neighbor; cutting it removes actual access.
 assert.ok(command(s,11,13,'bulldoze').ok);assert.equal(schoolSnapshot(s,index(10,13)).capacity,0);
 const count=campaign(s).counters[key]||0;run(s,60);assert.equal(campaign(s).counters[key]||0,count);
});

test('all three stage 6 missions use actual school service, preserve holds and unlock stage 7 once',()=>{
 const s=town();stage6(s);run(s,2090);
 for(const id of ['bc26-main-006-a','bc26-main-006-b']){assert.ok(missionViews(s).find(m=>m.id===id).ready);assert.equal(applyVerifiedClaim(s,id,2),true);}
 run(s,70);const last='bc26-main-006-c';assert.ok(missionViews(s).find(m=>m.id===last).ready);
 const loaded=validateSave(serialize(s));assert.ok(missionViews(loaded).find(m=>m.id===last).ready);
 const money=loaded.money;assert.equal(applyVerifiedClaim(loaded,last,3),true);assert.ok(loaded.money>money);const paid=loaded.money;
 assert.equal(applyVerifiedClaim(loaded,last,3),false);assert.equal(loaded.money,paid);assert.equal(missionViews(loaded).find(m=>m.id==='bc26-main-007-a').locked,false);
});

test('utility loss stops attendance immediately and a school upgrade increases funded seats and posts',async()=>{
 const {startUpgrade}=await import('../src/game/systems/upgrades.js');
 const s=town(),i=index(10,14);assert.ok(command(s,10,15,'waste').ok);assert.ok(command(s,10,16,'park').ok);
 const cash=s.money;assert.ok(startUpgrade(s,i,'city').ok);run(s,900);
 const upgraded=schoolSnapshot(s,i);assert.equal(upgraded.designSeats,150);assert.equal(upgraded.posts,7);assert.equal(upgraded.capacity,140);assert.ok(s.money<cash);
 run(s,1400);assert.ok((campaign(s).counters[key]||0)>0);assert.ok(command(s,8,17,'bulldoze').ok);
 const count=campaign(s).counters[key]||0;run(s,90);assert.equal(schoolSnapshot(s,i).capacity,0);assert.equal(campaign(s).counters[key]||0,count);assert.ok(schoolSnapshot(s,i).reason.includes('điện'));
 assert.doesNotThrow(()=>validateSave(serialize(s)));
});

test('a paused legacy save exposes its existing schools immediately without advancing time or rewards',()=>{
 const raw=serialize(createCity());delete raw.educationVersion;for(const c of raw.citizens){delete c.study;if(raw.firms.find(f=>f.school&&f.id===c.work))c.work=null;}raw.firms=raw.firms.filter(f=>!f.school);raw.playback.paused=true;
 const s=validateSave(raw),clock=structuredClone(s.clock),money=s.money,ids=s.citizens.map(c=>c.id),receipts=structuredClone(s.progression.receipts);
 assert.equal(prepareEducation(s),true);assert.equal(schoolSnapshot(s,index(10,14)).staff.length,6);assert.ok(educationSnapshot(s).assigned>0);
 assert.deepEqual(s.clock,clock);assert.equal(s.money,money);assert.deepEqual(s.citizens.map(c=>c.id),ids);assert.deepEqual(s.progression.receipts,receipts);assert.equal(s.playback.paused,true);
 const prepared=serialize(s);assert.equal(prepareEducation(s),false);assert.deepEqual(serialize(s),prepared);assert.doesNotThrow(()=>validateSave(prepared));
});
