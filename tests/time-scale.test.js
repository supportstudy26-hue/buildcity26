import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,serialize,validateSave,stepSimulation,executeCommand} from '../src/game/core.js';
import {createPlayback,simulationDelta,consumeSteps} from '../src/game/systems/clock.js';
import {updateCitizens} from '../src/game/systems/citizens.js';
import {calendar} from '../src/game/systems/clock.js';
function runFrames(seconds,fps,playback=createPlayback()){
 const s=createCity();let accumulator=0;
 for(let frame=0;frame<seconds*fps;frame++){accumulator+=simulationDelta(1/fps,playback);accumulator=consumeSteps(accumulator,()=>stepSimulation(s),120).remaining;}
 return s;
}
test('injected real time at 30/60/120 FPS yields exactly 1:5 and identical state',()=>{
 for(const seconds of [10,60]){const results=[30,60,120].map(fps=>runFrames(seconds,fps));for(const s of results)assert.equal(s.clock.seconds,seconds*5);assert.deepEqual(serialize(results[0]),serialize(results[1]));assert.deepEqual(serialize(results[1]),serialize(results[2]));}
 assert.equal(simulationDelta(60,{...createPlayback(),paused:true}),0);assert.equal(simulationDelta(60,createPlayback(),true),0);assert.equal(simulationDelta(10,{...createPlayback(),observe:true}),10);
 const queued=consumeSteps(500,()=>{},120);assert.equal(queued.remaining,380);
});
test('schema 4 clock migration preserves timestamp, IDs, EXP and money; paused chosen speed survives reload',()=>{
 const raw=serialize(runFrames(10,60));raw.schemaVersion=4;raw.ruleVersion='terrain-4';raw.clock.step=raw.clock.seconds/10;delete raw.playback;
 const s=validateSave(raw);assert.equal(s.clock.seconds,50);assert.equal(s.clock.step,50);assert.equal(s.money,raw.money);assert.deepEqual(s.progression,raw.progression);assert.deepEqual(s.citizens,raw.citizens);
 const command=payload=>executeCommand(s,{id:`command-${s.commandSequence+1}`,sequence:s.commandSequence+1,type:'playback',payload});
 assert.ok(command({multiplier:8}).ok);assert.ok(command({paused:true}).ok);const restored=validateSave(serialize(s));assert.equal(restored.playback.multiplier,8);assert.equal(restored.playback.paused,true);assert.equal(simulationDelta(100,restored.playback),0);
 assert.ok(command({paused:false}).ok);assert.equal(simulationDelta(10,s.playback),400);assert.equal(command({multiplier:2880}).ok,false);
 const bad=structuredClone(raw);bad.clock.step++;assert.throws(()=>validateSave(bad),/Đồng hồ/);
});
test('a walker travels 65 metres in 50 game seconds at 1.3 m/s and records arrival only at the destination',()=>{
 const s=createCity(),c=s.citizens[0];c.walkSpeed=1.3;c.work=null;c.vehicle=null;c.state='walking';c.goal=c.home;
 const a={...c.position},b={...a,x:a.x+65};c.journey={id:'clock-test-trip',mode:'walk',speed:1.3,origin:c.home,destination:c.home,path:[a,b],segment:0,distance:0,graphVersion:s.graphVersion};
 for(let second=1;second<=50;second++){s.clock={step:second,seconds:second};updateCitizens(s,calendar(second),()=>[],s.mapSize);if(second<50)assert.ok(c.journey);}
 assert.equal(c.journey,null);assert.ok(Math.abs(c.position.x-b.x)<1e-8);assert.equal(s.events.filter(e=>e.type==='trip-arrived'&&e.trip==='clock-test-trip').length,1);assert.equal(50/5,10);
});
