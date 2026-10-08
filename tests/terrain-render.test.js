import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCity,serialize,validateSave,SIZE,stepSimulation} from '../src/game/core.js';
import {createTerrain,terrainHeight,surfaceHeight,cellHeights} from '../src/game/systems/terrain.js';
import {REGION,chunkParts,terrainArrays} from '../src/game/render/scene-data.js';
import {updateBounds} from '../src/game/render/three-renderer.js';
test('terrain metres and route elevations survive save/load and reject malformed heightfields',()=>{
  const s=createCity();assert.ok(Math.max(...s.world.heights)>6);assert.ok(Math.min(...s.world.heights)<0);
  for(const c of s.citizens)assert.ok(c.position.z>=terrainHeight(s.world,c.position.x,c.position.y));
  for(let i=0;i<8*3600;i++)stepSimulation(s);
  assert.ok(s.citizens.some(c=>c.journey));for(const c of s.citizens.filter(c=>c.journey))for(const p of c.journey.path.filter(p=>p.road!=null))assert.equal(p.z,surfaceHeight(s,p.road,SIZE));
  const restored=validateSave(serialize(s));assert.deepEqual(serialize(restored),serialize(s));
  const bad=serialize(s);bad.world.heights.pop();assert.throws(()=>validateSave(bad),/heightfield/);
});
test('schema 3 migration preserves every ID, money, seed and horizontal position without re-converting BC',()=>{
  const raw=serialize(createCity());raw.schemaVersion=3;raw.ruleVersion='foundation-3';raw.clock.step=raw.clock.seconds/10;delete raw.playback;delete raw.world;delete raw.progression;
  for(const c of raw.citizens)c.position.z=0;for(const v of raw.vehicles)v.position.z=0;
  const s=validateSave(raw);assert.equal(s.money,raw.money);assert.equal(s.seed,raw.seed);assert.deepEqual(s.citizens,raw.citizens);assert.deepEqual(s.vehicles,raw.vehicles);assert.equal(s.world.legacyFlat,true);assert.equal(s.progression.xp,0);assert.deepEqual(serialize(validateSave(serialize(s))),serialize(s));
});
test('early terrain checkpoint without missions upgrades without losing progress',()=>{const raw=serialize(createCity());raw.schemaVersion=4;raw.ruleVersion='terrain-4';raw.clock.step=raw.clock.seconds/10;delete raw.playback;raw.money+=5000;raw.ledger.openingCash+=5000;delete raw.progression;const s=validateSave(raw);assert.equal(s.money,raw.money);assert.deepEqual(s.citizens,raw.citizens);assert.equal(s.progression.xp,0);});

test('procedural scene descriptors use actual state, building pads enclose ground and do not mutate the simulation',()=>{
  const s=createCity(),before=serialize(s),parts=chunkParts(s,8,8),data=terrainArrays(s,8,8);
  assert.deepEqual(serialize(s),before);assert.equal(data.positions.length,REGION*REGION*6*3);assert.ok(parts.length>50);
  for(const p of parts){assert.ok(p.position.every(Number.isFinite));assert.ok(p.scale.every(n=>Number.isFinite(n)&&n>0));assert.ok(p.tile>=0&&p.tile<SIZE*SIZE);}
  const tile=12+13*SIZE,h=surfaceHeight(s,tile,SIZE),ground=cellHeights(s.world,tile,SIZE);assert.ok(h>=Math.max(...ground));
  const custom=createTerrain(SIZE);assert.equal(terrainHeight(custom,20,20),custom.heights[SIZE+2]);
});
test('instanced bounds and raycast reflect moved instances instead of stale cached positions',()=>{
  const geo=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial(),mesh=new T.InstancedMesh(geo,material,1),matrix=new T.Matrix4();
  mesh.setMatrixAt(0,matrix.makeTranslation(10,0,0));mesh.count=1;updateBounds(mesh);mesh.updateMatrixWorld(true);
  const cast=x=>new T.Raycaster(new T.Vector3(x,0,10),new T.Vector3(0,0,-1)).intersectObject(mesh,false);
  assert.equal(cast(10)[0].instanceId,0);mesh.setMatrixAt(0,matrix.makeTranslation(200,0,0));updateBounds(mesh);
  assert.equal(cast(10).length,0);assert.equal(cast(200)[0].instanceId,0);assert.ok(mesh.boundingBox.min.x>190);mesh.dispose();geo.dispose();material.dispose();
});
