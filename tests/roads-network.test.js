import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCity,place,analyze,index,serialize,validateSave,executeCommand,route} from '../src/game/core.js';
import {createTerrain} from '../src/game/systems/terrain.js';
import {ROAD_KINDS,roadProfile,profilePrice} from '../src/config/road-profiles.js';
import {roadEdgeAllowed} from '../src/game/systems/road-network.js';
import {junctionState,junctionAllows,isJunction} from '../src/game/systems/junctions.js';
import {roadControllers} from '../src/game/systems/road-controller.js';
import {mobilityPath} from '../src/game/systems/mobility-path.js';
import {placementQuote} from '../src/game/systems/placement.js';
import {roadParts,chunkParts} from '../src/game/render/scene-data.js';
import {LANDMARKS} from '../src/config/landmarks.js';
import {landmarkParts} from '../src/game/render/landmark-parts.js';
import {landmarkThumbnail} from '../src/ui/mesh-thumbnail.js';
const city=()=>createEmptyCity({world:createTerrain(64,{flat:true}),startingCash:10000000});
const command=(s,type,payload)=>executeCommand(s,{id:`qa-${s.commandSequence+1}`,sequence:s.commandSequence+1,type,payload});
test('profiles quote the same metre-based cost charged by placement; upgrades retain asset identity and rebuild navigation',()=>{
 const s=city();for(let x=0;x<12;x++)assert.ok(place(s,x,18,'road').ok);
 for(const [n,k] of ROAD_KINDS.entries()){const x=n+1,i=index(x,18),before=s.money,q=placementQuote(s,i,k),id=s.tiles[i].assetId;if(k==='road')continue;assert.ok(q.ok);assert.ok(place(s,x,18,k).ok);assert.equal(before-s.money,q.cost);assert.equal(s.tiles[i].assetId,id);assert.equal(s.tiles[i].footprint.width,roadProfile(k).width);
  assert.ok(roadParts(s,x,18).every(p=>p.scale.every(v=>v>0)&&p.position.every(Number.isFinite)));
 }
 assert.ok(profilePrice('road',true)>profilePrice('road'));assert.equal(roadProfile('busRoad').busLane,true);
 assert.ok(command(s,'road-direction',{tile:index(2,18),direction:'west'}).ok);assert.equal(s.tiles[index(2,18)].footprint.width,10);
 const loaded=validateSave(serialize(s));assert.equal(loaded.tiles[index(2,18)].roadDirection,'west');assert.deepEqual(serialize(loaded),serialize(s));
});
test('one-way edges reject reverse cars but allow pedestrians; pedestrian roads never route cars or buses',()=>{
 const s=city();for(let x=0;x<8;x++)place(s,x,18,x===0?'road':'roadOneWay');
 assert.deepEqual(route(s,index(0,18),index(7,18)),Array.from({length:8},(_,x)=>index(x,18)));
 assert.deepEqual(route(s,index(7,18),index(0,18)),[]);assert.equal(route(s,index(7,18),index(0,18),'walk').length,8);
 place(s,4,18,'pedestrian');assert.equal(route(s,index(0,18),index(7,18),'car').length,0);assert.equal(route(s,index(0,18),index(7,18),'bus').length,0);assert.equal(route(s,index(0,18),index(7,18),'walk').length,8);
 assert.equal(roadEdgeAllowed(s,index(1,18),index(2,18),'car'),true);assert.equal(roadEdgeAllowed(s,index(2,18),index(1,18),'car'),false);
});
test('dedicated bus lane has a separate physical offset and remains on the legal directed graph',()=>{
 const s=city();for(let x=0;x<5;x++)place(s,x,18,'busRoad');const roads=route(s,index(0,18),index(4,18),'bus');
 const car=mobilityPath(s,index(0,18),index(4,18),roads,64,'car'),bus=mobilityPath(s,index(0,18),index(4,18),roads,64,'bus');
 assert.ok(Math.abs(car[2].y-bus[2].y)>2);assert.equal(bus[2].road,car[2].road);
});
test('signal clock has protected non-conflicting phases, clearance and a pedestrian phase; real cars stop before the intersection',()=>{
 const s=city();for(let x=0;x<=6;x++)place(s,x,18,'road');place(s,5,17,'road');place(s,5,19,'road');const i=index(5,18);assert.ok(isJunction(s,i));
 let ped=0,clear=0;for(let t=0;t<66;t++){const p=junctionState(s,i,t);if(p.pedestrian)ped++;if(p.clearance)clear++;if(p.pedestrian)assert.equal(p.light,'red');if(p.light==='green')assert.ok(p.approach);}
 assert.equal(ped,8);assert.equal(clear,10);
 const c={id:'car-qa',position:{x:97,y:372.5,z:0},state:'in-vehicle',journey:{mode:'car',speed:8,path:[{x:90,y:372.5,z:0,road:index(4,18)},{x:110,y:372.5,z:0,road:i}],segment:0}};s.citizens.push(c);
 s.clock.seconds=0;while(junctionAllows(s,i,1,0,'car'))s.clock.seconds++;const halted=roadControllers(s)(c);assert.ok(halted.speed<8);assert.match(halted.reason,/đèn/);
 while(!junctionAllows(s,i,1,0,'car'))s.clock.seconds++;assert.equal(roadControllers(s)(c).reason,'');
 assert.ok(command(s,'junction-control',{tile:i,mode:'yield'}).ok);assert.equal(junctionState(s,i).mode,'yield');
});
test('landmarks are distinct volumetric meshes, consume their own utilities and never become utility sources; demolition/save preserve the world',()=>{
 const s=city();for(let x=0;x<16;x++)place(s,x,18,'road');const prints=new Set();
 for(const [n,k] of Object.keys(LANDMARKS).entries()){assert.ok(place(s,n+1,17,k).ok);const parts=landmarkParts({kind:k},0,0,0);prints.add(JSON.stringify(parts.map(p=>[p.shape,p.position,p.scale])));assert.ok(parts.length>5&&parts.length<=65,k);assert.ok(landmarkThumbnail(k).includes('<polygon'));}
 assert.equal(prints.size,Object.keys(LANDMARKS).length);assert.equal(s.metrics.power,0);assert.equal(s.metrics.water,0);assert.ok(s.metrics.powerNeed>0);
 const save=serialize(s),loaded=validateSave(save);assert.deepEqual(serialize(loaded),save);assert.deepEqual(chunkParts(s,0,16),chunkParts(loaded,0,16));assert.ok(place(loaded,1,17,'bulldoze').ok);assert.equal(s.tiles[index(1,17)].kind,'clockTower');
});
