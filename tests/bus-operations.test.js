import test from 'node:test';import assert from 'node:assert/strict';
import {createCity,place,addBusLine,index,stepSimulation,serialize,validateSave,executeCommand} from '../src/game/core.js';
import {busDock,chooseBusPlan} from '../src/game/systems/bus-planning.js';
import {startJourney} from '../src/game/systems/citizens.js';import {route} from '../src/game/systems/roads.js';
function setup(){const s=createCity();for(const [x,y,k] of [[17,13,'bus'],[13,11,'busStop'],[19,13,'busStop']])assert.ok(place(s,x,y,k).ok);assert.ok(addBusLine(s,'Tuyến thực',[index(13,11),index(19,13)],1).ok);return s;}
test('bus follows the road loop, opens doors only at stops and an actual commuter reaches work',()=>{
 const s=setup(),c=s.citizens.find(c=>c.work&&chooseBusPlan(s,c,s.firms.find(f=>f.id===c.work).home));assert.ok(c);
 const goal=s.firms.find(f=>f.id===c.work).home;startJourney(s,c,goal,route,s.mapSize);assert.ok(c.busPlan);const id=c.id;
 let boarded=false,alighted=false,loaded=false;
 for(let i=0;i<2200;i++){
  stepSimulation(s);const current=s.citizens.find(c=>c.id===id),bus=s.vehicles.find(v=>v.kind==='bus');
  if(bus.busPhase==='driving')assert.equal(bus.doors,false);
  if(current.state==='on-bus'){
   boarded=true;assert.ok(bus.passengers.includes(id));assert.equal(current.journey,null);assert.deepEqual(current.position,bus.position);
   if(!loaded){const copy=validateSave(serialize(s));assert.deepEqual(serialize(copy),serialize(s));loaded=true;}
  }
  if(boarded&&current.busPlan?.stage==='walk-from-stop')alighted=true;
  if(boarded&&current.state==='at-work'){assert.equal(current.goal,goal);break;}
 }
 assert.ok(boarded&&alighted&&loaded);assert.equal(s.citizens.find(c=>c.id===id).state,'at-work');
 assert.ok(s.ledger.entries.some(e=>e.category==='bus-fare'));assert.ok(s.metrics.busPassengers>0);
});
test('capacity, FIFO, transfer IDs and fares survive save/reload without counting a passenger twice',()=>{
 const s=setup(),line=s.busLines[0],bus=s.vehicles.find(v=>v.kind==='bus'),dock=busDock(s,line,0);
 Object.assign(bus,{position:{...dock.position},goal:line.stops[0],busPhase:'stop',state:'parked',stopIndex:0,targetStop:0,stopUntil:200,trip:null,doors:true,travelled:0,boardedTotal:0,boardedDay:0,boardedToday:0});
 const queue=s.citizens.slice(0,65);for(const [i,c] of queue.entries())Object.assign(c,{position:{...dock.door},state:'waiting-bus',goal:line.stops[0],journey:null,waitingSince:i,busPlan:{line:line.id,board:line.stops[0],alight:line.stops[1],destination:c.home,stage:'waiting',vehicleId:null,tripId:`test-queue-${c.id}`}});
 for(let i=0;i<35;i++)stepSimulation(s);assert.equal(bus.passengers.length,35);
 const copy=validateSave(serialize(s));for(let i=0;i<40;i++){stepSimulation(s);stepSimulation(copy);}
 assert.deepEqual(serialize(copy),serialize(s));assert.equal(bus.passengers.length,60);assert.equal(new Set(bus.passengers).size,60);assert.equal(s.citizens.filter(c=>c.state==='waiting-bus').length,5);assert.deepEqual(bus.passengers,queue.slice(0,60).map(c=>c.id));
 assert.equal(s.ledger.entries.filter(e=>e.category==='bus-fare').length,60);assert.equal(bus.boardedToday,60);
 const raw=serialize(s);raw.vehicles.find(v=>v.id===bus.id).passengers.push(bus.passengers[0]);assert.throws(()=>validateSave(raw));
 const before={...queue[0].position};assert.ok(executeCommand(s,{id:'remove-test',sequence:s.commandSequence+1,type:'remove-bus-line',payload:{id:line.id}}).ok);
 assert.deepEqual(queue[0].position,before);assert.equal(queue[0].state,'blocked');assert.equal(queue[0].busPlan,null);assert.ok(!s.vehicles.some(v=>v.kind==='bus'));assert.doesNotThrow(()=>validateSave(serialize(s)));
});
