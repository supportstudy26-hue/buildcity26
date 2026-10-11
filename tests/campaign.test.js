import test from 'node:test';import assert from 'node:assert/strict';
import {MISSIONS,LEVELS,CAP_XP,levelFromXp,xpForLevel} from '../src/config/progression.js';
import {LEGACY_MISSIONS,legacyXpForLevel,legacyLevelFromXp} from '../src/config/legacy-progression.js';
import {createCity,createEmptyCity,serialize,validateSave,stepSimulation,executeCommand,index} from '../src/game/core.js';
import {campaign,progressionXp,cityLevel,migratedLegacyXp,evaluateCondition,updateCampaign,missionViews,applyVerifiedClaim,recordMissionEvent} from '../src/game/systems/campaign.js';
import {metricKey,leaves} from '../src/game/systems/mission-metrics.js';
import {verifyMissionCheckpoint} from '../server/missions.js';
import {encodeCity,decodeCity,cityBytes} from '../src/services/city-codec.js';
import {benchmarkCity} from '../src/benchmark/scenario.js';
import {cashBalance} from '../src/game/systems/economy.js';
import {MissionQueue} from '../src/services/missions.js';
const cmd=(s,type,payload)=>executeCommand(s,{id:'test-'+(s.commandSequence+1),sequence:s.commandSequence+1,type,payload});
const refresh=s=>{campaign(s).lastTick=null;updateCampaign(s,true);};
const proof=s=>({state:encodeCity(serialize(s),{always:true}),wallMs:0});
test('exact 300 IDs, dependencies and supplied EXP reach 100, including lifetime epilogue',()=>{
 assert.equal(MISSIONS.length,300);assert.equal(new Set(MISSIONS.map(m=>m.id)).size,300);assert.equal(LEVELS.length,100);
 let xp=0;for(let stage=1;stage<=100;stage++){const ms=MISSIONS.slice((stage-1)*3,stage*3);assert.deepEqual(ms.map(m=>m.id),['a','b','c'].map(v=>`bc26-main-${String(stage).padStart(3,'0')}-${v}`));assert.equal(levelFromXp(xp),stage);assert.deepEqual(ms[2].prerequisiteClaims.slice(-2),ms.slice(0,2).map(m=>m.id));xp+=ms.reduce((n,m)=>n+m.rewards.xp,0);if(stage===99)assert.equal(xp,CAP_XP);}
 assert.equal(xp,4356200);assert.equal(levelFromXp(xp),100);assert.equal(xpForLevel(100),4230468);
});
test('legacy 14 receipts and rewards remain intact; every old level/fraction converts without demotion or cash',()=>{
 const s=createCity(),p=s.progression;let total=0;
 for(const m of LEGACY_MISSIONS){p.receipts.push({id:m.id,xp:m.xp,at:0});total+=m.xp;}
 p.xp=total;p.tracking={};p.levelGrants=Array.from({length:legacyLevelFromXp(total)-1},(_,i)=>i+2);
 const before=s.money,oldReceipts=structuredClone(p.receipts),restored=validateSave(serialize(s));assert.deepEqual(restored.progression.receipts,oldReceipts);assert.equal(restored.money,before);assert.ok(cityLevel(restored)>=legacyLevelFromXp(total));assert.equal(restored.progression.campaign.claims.length,0);
 for(let level=1;level<100;level++){assert.equal(levelFromXp(migratedLegacyXp(legacyXpForLevel(level))),level);assert.ok(levelFromXp(migratedLegacyXp(legacyXpForLevel(level+1)-1))>=level);}
});
test('missing, NaN, stale windows and empty groups never satisfy <=; ANY needs only one valid path',()=>{
 const debt={metric:'debt',scope:'snapshot',operator:'lte',target:0};
 for(const reading of [undefined,{valid:false,value:0},{valid:true,value:NaN}])assert.equal(evaluateCondition(debt,()=>reading).ok,false);
 assert.equal(evaluateCondition({any:[]},()=>({valid:true,value:0})).ok,false);
 assert.equal(evaluateCondition({any:[{metric:'retention_capacity',scope:'snapshot',operator:'gte',target:1},debt]},n=>n.metric==='debt'?{valid:true,value:0}:undefined).ok,true);
 assert.equal(evaluateCondition({...debt,scope:'window',minSamples:5},()=>({valid:true,value:0,samples:4})).ok,false);
 const s=createEmptyCity();assert.equal(missionViews(s).find(m=>m.id==='bc26-main-002-a').condition.ok,false);assert.equal(missionViews(s).find(m=>m.id==='bc26-main-095-c').available,false);
});
test('first road mission is real connected geometry; claims are explicit and level money cannot double-pay',()=>{
 const s=createEmptyCity();for(let x=0;x<4;x++)assert.ok(cmd(s,'place',{x,y:18,kind:'road'}).ok);refresh(s);
 const m=missionViews(s).find(m=>m.id==='bc26-main-001-b');assert.equal(m.ready,true);assert.equal(m.condition.children[0].value,80);assert.equal(m.conditions[0].value,80);assert.ok(m.conditions.every(n=>n.type==='metric'));const cash=s.money;
 assert.equal(applyVerifiedClaim(s,m.id,1),true);assert.equal(s.money-cash,7650);assert.equal(applyVerifiedClaim(s,m.id,1),false);assert.equal(cashBalance(s),s.money);assert.equal(progressionXp(s),60);assert.equal(missionViews(s).find(m=>m.id==='bc26-main-001-c').locked,true);
 assert.deepEqual(serialize(validateSave(serialize(s))),serialize(s));
 assert.throws(()=>applyVerifiedClaim(s,'bc26-main-002-a',1),/bằng chứng/);
});
test('nested ALL/ANY objectives retain individual readings and missing-provider explanations',()=>{
 const tree={all:[{metric:'population',scope:'snapshot',operator:'gte',target:100},{any:[{metric:'school_access_pct',scope:'snapshot',operator:'gte',target:50},{metric:'debt',scope:'snapshot',operator:'lte',target:0}]}]};
 const evaluated=evaluateCondition(tree,n=>n.metric==='school_access_pct'?{valid:false,reason:'Chưa có chỗ học'}:{valid:true,value:n.metric==='population'?25:0});
 const readings=leaves(evaluated);assert.equal(readings.length,3);assert.equal(readings[0].value,25);assert.equal(readings[1].reason,'Chưa có chỗ học');assert.equal(readings[2].value,0);assert.equal(evaluated.ok,false);assert.equal(leaves(tree).length,3);assert.deepEqual(leaves(null),[]);
});
test('shared baseline survives load; real trip events count once and exclude events before opening',()=>{
 const s=createCity(),c=campaign(s),person=s.citizens[0],n={metric:'passenger_trips',filters:{mode:'walk'}};const key=metricKey(n);
 const event={sequence:s.nextEventId++,type:'trip-arrived',entity:person.id,origin:index(0,18),destination:person.goal,mode:'walk',purpose:'move-in',duration:20};recordMissionEvent(s,event);recordMissionEvent(s,event);assert.equal(c.counters[key],1);
 c.baselines['bc26-stage-003']={at:0,counters:{...c.counters}};
 const restored=validateSave(serialize(s));recordMissionEvent(restored,event);assert.equal(campaign(restored).counters[key],1);
 recordMissionEvent(restored,{...event,sequence:restored.nextEventId++});assert.equal(campaign(restored).counters[key]-campaign(restored).baselines['bc26-stage-003'].counters[key],1);
});
test('server discards fabricated earned/counters; clock replay supplies holds, pause does not advance and break resets',()=>{
 const s=createCity(),client=campaign(s);client.earned['bc26-main-001-a']={at:0,stage:1,sourceStep:0,graphVersion:0};client.counters[metricKey({metric:'passenger_trips',filters:{mode:'walk'}})]=999;
 const first=verifyMissionCheckpoint(serialize(s),null,0,1);assert.equal(campaign(first.city).earned['bc26-main-001-a'],undefined);assert.equal(Object.keys(campaign(first.city).counters).length,1);
 // Explicit test-only prerequisite fixture; production receipt table verifies it.
 const cp=campaign(s);cp.claims=MISSIONS.slice(0,5).map(m=>({id:m.id,at:0,revision:1}));cp.earned={};cp.counters={};cp.lastTick=null;updateCampaign(s,true);
 const m='bc26-main-002-c';assert.equal(cp.holds[m].held,0);const checkpoint=proof(s);
 const raw=serialize(s);raw.progression.campaign.holds[m].held=30;raw.progression.campaign.earned[m]={at:0,stage:2,sourceStep:0,graphVersion:raw.graphVersion};
 const paused=verifyMissionCheckpoint(raw,checkpoint,6000,2);assert.equal(campaign(paused.city).earned[m],undefined);
 for(let i=0;i<30;i++)stepSimulation(s);
 const verified=verifyMissionCheckpoint(serialize(s),checkpoint,6000,2);assert.ok(campaign(verified.city).earned[m]);
 assert.throws(()=>verifyMissionCheckpoint(serialize(s),checkpoint,0,2),/Đồng hồ/);
 const interrupted=validateSave(checkpoint.state);interrupted.tiles[index(7,19)].kind=null; // break uses actual sewage? this objective needs power: remove source.
 assert.ok(cmd(interrupted,'place',{x:8,y:17,kind:'bulldoze'}).ok);refresh(interrupted);assert.equal(campaign(interrupted).holds[m],undefined);
});
test('dense 5000 population is losslessly compressed under the cloud limit, rejects corruption/bomb, imports raw saves',()=>{
 const raw=serialize(benchmarkCity(5000)),encoded=encodeCity(raw);assert.ok(cityBytes(raw)>2000000);assert.ok(cityBytes(encoded)<2000000);assert.deepEqual(decodeCity(encoded),raw);assert.equal(validateSave(encoded).citizens.length,5000);assert.deepEqual(encodeCity(raw),encoded);
 const corrupted=structuredClone(encoded);corrupted.cityPayload.checksum='ffffffff';assert.throws(()=>decodeCity(corrupted),/hỏng/);
 const bomb=structuredClone(encoded);bomb.cityPayload.bytes=100000000;assert.throws(()=>decodeCity(bomb),/không hợp lệ/);assert.equal(decodeCity(raw),raw);
 console.log('5000 citizens save:',cityBytes(raw),'raw →',cityBytes(encoded),'cloud bytes');
});
test('durable claim retries after transport failure keep identical mission/revision and block a different request',async()=>{
 const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},calls=[];let fail=true;
 const q=new MissionQueue({storage,send:async r=>{calls.push(r);if(fail)throw new Error('network');return {city:{id:'city',revision:2},applied:true};}}),request={cityId:'city',revision:1,action:'claim',missionId:'bc26-main-001-b'};
 await assert.rejects(q.transact('owner',request,()=>{}),/network/);assert.ok(q.pending('owner','city'));
 await assert.rejects(q.transact('owner',{...request,missionId:'bc26-main-001-a'},()=>{}),/đang chờ/);fail=false;await q.transact('owner',request,()=>{});assert.deepEqual(calls[0],calls[1]);assert.equal(q.pending('owner','city'),null);
});
test('already claimed canonical receipt accepts unchanged revision, but false response without receipt does not',async()=>{
 const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const request={cityId:'city',revision:4,action:'claim',missionId:'bc26-main-001-a'};
 let claimed=true,applied=0;
 const q=new MissionQueue({storage,send:async()=>({applied:false,city:{id:'city',revision:4,state:{progression:{campaign:{claims:claimed?[{id:request.missionId}]:[]}}}}})});
 await q.transact('owner',request,()=>applied++);assert.equal(applied,1);assert.equal(q.pending('owner','city'),null);
 claimed=false;await assert.rejects(q.transact('owner',request,()=>applied++),/không hợp lệ/);assert.equal(applied,1);assert.ok(q.pending('owner','city'));
});
