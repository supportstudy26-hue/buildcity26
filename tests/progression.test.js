import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity,executeCommand,serialize,validateSave,index,stepSimulation} from '../src/game/core.js';
import {updateProgression,missionViews} from '../src/game/systems/progression.js';
import {levelFromXp,xpForLevel,LEVEL_GRANT_BC} from '../src/config/progression.js';
import {cashBalance} from '../src/game/systems/economy.js';
const command=(s,type,payload)=>executeCommand(s,{id:`command-${s.commandSequence+1}`,sequence:s.commandSequence+1,type,payload});
function time(s,seconds){s.clock={step:seconds,seconds};s.day=Math.floor(seconds/86400);}
test('level thresholds follow the specification and each level grant displays 100 million đồng',()=>{
  assert.equal(LEVEL_GRANT_BC*1000,100000000);for(let level=1;level<30;level++){assert.equal(levelFromXp(xpForLevel(level)),level);if(level>1)assert.equal(levelFromXp(xpForLevel(level)-1),level-1);}assert.throws(()=>levelFromXp(Infinity));
});
test('a mission resets its one-day stability when utilities break and cannot be rewarded on repeated load',()=>{
  const s=createCity();time(s,23*3600);updateProgression(s,true);assert.equal(s.progression.xp,0);
  assert.ok(command(s,'place',{x:7,y:19,kind:'bulldoze'}).ok);assert.equal(s.progression.tracking['population-100'],undefined);
  assert.ok(command(s,'place',{x:7,y:19,kind:'sewage'}).ok);time(s,24*3600);updateProgression(s,true);assert.equal(s.progression.xp,0);
  time(s,47*3600);updateProgression(s,true);assert.equal(s.progression.xp,200);const snapshot=serialize(s),restored=validateSave(snapshot);
  updateProgression(restored,true);assert.equal(restored.progression.xp,200);assert.equal(restored.money,s.money);assert.deepEqual(serialize(validateSave(serialize(restored))),serialize(restored));
});
test('completing player tasks raises a level, pays exactly once, and keeps cash ledger consistent',()=>{
  const s=createCity();for(let x=24;x<=28;x++)assert.ok(command(s,'place',{x,y:18,kind:'road'}).ok);
  // Attendance fixture; actual arrival behavior is exercised in foundation replay tests.
  for(const c of s.citizens.slice(0,20))c.attendance=1;updateProgression(s,true);
  assert.ok(command(s,'construct',{x:22,y:19,kind:'park'}).ok);
  assert.equal(s.contracts[0].status,'completed');assert.equal(missionViews(s).find(m=>m.id==='park-built').value,1);time(s,12*3600);s.tiles[index(22,19)].active=false;updateProgression(s,true);assert.equal(s.progression.tracking['park-built'],undefined);s.tiles[index(22,19)].active=true;updateProgression(s,true);
  time(s,86400+10);updateProgression(s,true);assert.equal(s.progression.xp,400);
  time(s,36*3600+10);const before=s.money;updateProgression(s,true);assert.equal(s.progression.xp,550);assert.equal(levelFromXp(s.progression.xp),2);assert.equal(s.money-before,100000);assert.deepEqual(s.progression.levelGrants,[2]);assert.equal(cashBalance(s),s.money);
  const restored=validateSave(serialize(s));updateProgression(restored,true);updateProgression(restored,true);assert.equal(restored.money,s.money);assert.equal(restored.progression.receipts.length,s.progression.receipts.length);assert.ok(missionViews(restored).some(m=>m.level===2&&!m.locked));
  const bad=serialize(restored);bad.progression.xp+=100;assert.throws(()=>validateSave(bad),/XP/);
});
