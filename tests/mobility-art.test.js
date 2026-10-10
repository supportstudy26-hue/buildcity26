import test from 'node:test';import assert from 'node:assert/strict';
import {MobilityArtRegistry,MOBILITY_GROUPS,citizenArtId,vehicleArtId,mobilityMeshStatus} from '../src/config/mobility-art.js';
import {mobilityDesign,mobilityParts,citizenMotion,worldMobilityParts} from '../src/game/render/mobility-models.js';
import {createCity,serialize,validateSave,stepSimulation} from '../src/game/core.js';
import {roadControllers} from '../src/game/systems/road-controller.js';
import {mobilityPath} from '../src/game/systems/mobility-path.js';
import {createHash} from 'node:crypto';import {readFileSync,existsSync} from 'node:fs';
test('144 stable exact frames, 16 groups and original files match all 25 SHA hashes',()=>{
 const assets=Object.values(MobilityArtRegistry);assert.equal(assets.length,144);assert.equal(MOBILITY_GROUPS.length,16);
 for(const g of MOBILITY_GROUPS)assert.equal(assets.filter(a=>a.group===g.id).length,9);
 for(const a of assets){const f=a.frame;assert.ok(f.width>0&&f.height>0&&f.x>=0&&f.y>=0&&f.x+f.width<=a.atlasWidth&&f.y+f.height<=a.atlasHeight);assert.ok(a.nameVi);assert.ok(existsSync('public'+a.atlas));}
 const base='art-source/Build_City_26_People_Vehicles/',hashes=JSON.parse(readFileSync(base+'SHA256.json'));
 for(const [path,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(readFileSync(base+path)).digest('hex'),hash,path);
 // Frames are silhouette crops, not equal thirds of the atlas.
 assert.notEqual(assets[0].frame.width,assets[0].atlasWidth/3);
});
test('43 original articulated designs have finite parts and separately identified pivots; unsupported models stay explicit',()=>{
 let count=0;
 for(const a of Object.values(MobilityArtRegistry)){
  const d=mobilityDesign(a.id),parts=mobilityParts(a.id,{speed:1.3,distance:2});
  if(mobilityMeshStatus(a.id)==='reference'){assert.equal(d,null);assert.equal(parts.length,0);continue;}
  count++;assert.ok(d);assert.ok(parts.length>=3&&parts.length<100);
  for(const p of parts){assert.ok(p.position.every(Number.isFinite));assert.ok(p.scale.every(x=>Number.isFinite(x)&&x>0));}
  assert.ok(parts.some(p=>p.pivot==='body'||p.pivot==='spine'));
  assert.ok(parts.some(p=>p.pivot?.includes('wheel')||p.pivot?.includes('thigh')));
 }assert.equal(count,43);
});
test('children have different head/leg proportions; stopped limbs and wheels do not use wall clock',()=>{
 const child=mobilityParts('pv-child-boy'),adult=mobilityParts('pv-adult-man');
 const head=ps=>ps.find(p=>p.pivot==='head').scale[1],leg=ps=>ps.find(p=>p.pivot==='thigh.-1').scale[1];
 assert.ok(head(child)/leg(child)>head(adult)/leg(adult));
 const a=mobilityParts('pv-adult-man',{speed:1.3,distance:.17}),b=mobilityParts('pv-adult-man',{speed:1.3,distance:.40});assert.notDeepEqual(a,b);
 assert.deepEqual(mobilityParts('pv-adult-man',{speed:0,distance:.17}),mobilityParts('pv-adult-man',{speed:0,distance:.40}));
 const cars=['pv-compact-car','pv-sedan','pv-suv','pv-pickup'];assert.equal(new Set(cars.map(id=>JSON.stringify(mobilityDesign(id).dimensions))).size,4);
 const c0=mobilityParts('pv-sedan',{distance:0}),c1=mobilityParts('pv-sedan',{distance:1});assert.notDeepEqual(c0.find(p=>p.pivot==='wheel.spoke'),c1.find(p=>p.pivot==='wheel.spoke'));
 const all=worldMobilityParts('pv-child-boy',{},0,{x:10,y:20,z:5},Math.PI/2,'citizen-test');assert.ok(all.every(p=>p.id==='citizen-test'&&p.position.every(Number.isFinite)));
});
test('right-hand lanes are opposite for opposite directions and share real terrain elevations',()=>{
 const s=createCity(),r=[18*64+12,18*64+13,18*64+14];
 const east=mobilityPath(s,r[0],r[2],r,64,'car'),west=mobilityPath(s,r[2],r[0],[...r].reverse(),64,'car');
 assert.equal(east[2].y-west[2].y,5);assert.equal(east[2].z,west[2].z);
 const sidewalk=mobilityPath(s,r[0],r[2],r,64,'walk');assert.equal(sidewalk[2].y-east[2].y,4.5);
});
test('controller waits at red and preserves following distance independently of update order',()=>{
 const s=createCity();const j={mode:'car',speed:8,laneVersion:1,segment:0,path:[{x:10,y:20,z:0},{x:50,y:20,z:0}]};
 const a={id:'a',state:'in-vehicle',position:{x:20,y:20,z:0},journey:j},b={id:'b',state:'in-vehicle',position:{x:25,y:20,z:0},journey:structuredClone(j)};
 s.citizens=[a,b];assert.equal(roadControllers(s)(a).speed,0);s.citizens.reverse();assert.equal(roadControllers(s)(a).speed,0);
 const parked={id:'bus',kind:'bus',busPhase:'stop',state:'parked',position:{x:30,y:20,z:0},visualYaw:Math.PI/2};s.vehicles=[parked];s.citizens=[a];assert.equal(roadControllers(s)(a).speed,0);s.vehicles=[];
 const intersection=18*64+11;a.position={x:224,y:360,z:0};a.journey={...j,path:[{x:224,y:345,z:0},{x:224,y:370,z:0,road:intersection}]};s.clock.seconds=30;s.citizens=[a];assert.ok(roadControllers(s)(a).reason.includes('đèn'));assert.equal(roadControllers(s)(a).speed,5);
});
test('new appearance IDs persist through save; unknown IDs cannot replace a city',()=>{
 const s=createCity();assert.ok(s.citizens.every(c=>c.artId===citizenArtId(c)));assert.ok(s.vehicles.every(v=>v.artId===vehicleArtId(v)));
 const raw=serialize(s),loaded=validateSave(raw);assert.deepEqual(serialize(loaded),raw);
 const bad=structuredClone(raw);bad.citizens[0].artId='pv-made-up';assert.throws(()=>validateSave(bad));
 const legacy=structuredClone(raw);for(const c of legacy.citizens)delete c.artId;for(const v of legacy.vehicles)delete v.artId;assert.doesNotThrow(()=>validateSave(legacy));
 s.clock.seconds=s.clock.step=8*3600;const c=s.citizens.find(c=>c.work&&!c.vehicle);c.schedule.depart=8*3600;
 for(let i=0;i<10;i++)stepSimulation(s);assert.ok(c.travelled>0);const resumed=validateSave(serialize(s));assert.deepEqual(serialize(resumed),serialize(s));
 assert.deepEqual(citizenMotion(s,c,0),citizenMotion(resumed,resumed.citizens.find(p=>p.id===c.id),0));
});
