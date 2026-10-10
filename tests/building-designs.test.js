import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildingDesign,buildingParts} from '../src/game/render/building-designs.js';
import {createGableGeometry} from '../src/game/render/gable-geometry.js';
import {createCity,serialize,validateSave,SIZE} from '../src/game/core.js';
import {chunkParts} from '../src/game/render/scene-data.js';
import {updateBounds} from '../src/game/render/three-renderer.js';
test('zoned architecture has distinct silhouettes, stable locations and real level-based apartment forms',()=>{
  for(const [kind,level,count] of [['residential',1,4],['residential',3,3],['commercial',1,3],['industrial',1,3]]){
    const designs=new Map();for(let y=0;y<16;y++)for(let x=0;x<16;x++){
      const t={kind,level},d=buildingDesign(t,x,y),parts=buildingParts(t,x,y,0,0,0,null,y*SIZE+x);
      assert.deepEqual(d,buildingDesign(t,x,y));assert.deepEqual(parts,buildingParts(t,x,y,0,0,0,null,y*SIZE+x));
      assert.ok(parts.length<=40,`${d.id} exceeds the component budget`);
      assert.ok(parts.every(p=>p.position.every(Number.isFinite)&&p.scale.every(v=>Number.isFinite(v)&&v>0)));
      assert.ok(parts.every(p=>Math.abs(p.position[0])+p.scale[0]/2<=10&&Math.abs(p.position[2])+p.scale[2]/2<=10),d.id);
      designs.set(d.id,JSON.stringify(parts.map(p=>[p.shape,p.position,p.scale])));
    }
    assert.equal(designs.size,count);assert.equal(new Set(designs.values()).size,count);
  }
  for(let x=0;x<8;x++){const low=buildingDesign({kind:'residential',level:1},x,5),high=buildingDesign({kind:'residential',level:4},x,5);assert.notEqual(low.id,high.id);assert.ok(high.height>low.height);}
});
test('architecture reads existing saves without altering money, inhabitants or persisted fields',()=>{
  const city=createCity(),before=serialize(city),parts=chunkParts(city,0,0);
  assert.deepEqual(serialize(city),before);const loaded=validateSave(before);assert.deepEqual(chunkParts(loaded,0,0),parts);
  assert.deepEqual(serialize(loaded),before);
  const roofed=parts.filter(p=>p.shape==='gable');assert.ok(roofed.length>0);
  const normal=parts.find(p=>p.shape==='box'&&city.tiles[p.tile].kind==='residential');
  const power=chunkParts(city,0,0,'power').find(p=>p.tile===normal.tile&&p.shape==='box'&&p.scale[1]>3);
  assert.equal(power.color,city.tiles[normal.tile].power?'#dccc75':'#c97961');
});
test('shared pitched roof has eight triangles, finite normals and picks its actual instanced tile',()=>{
  const geometry=createGableGeometry(T);assert.equal(geometry.attributes.position.count,24);assert.ok([...geometry.attributes.normal.array].every(Number.isFinite));
  const material=new T.MeshBasicMaterial(),mesh=new T.InstancedMesh(geometry,material,1);mesh.userData.tiles=[123];
  mesh.setMatrixAt(0,new T.Matrix4().compose(new T.Vector3(12,7,8),new T.Quaternion(),new T.Vector3(12,3,10)));updateBounds(mesh);mesh.updateMatrixWorld(true);
  const hit=new T.Raycaster(new T.Vector3(12,30,8),new T.Vector3(0,-1,0)).intersectObject(mesh,false)[0];assert.ok(hit);assert.equal(mesh.userData.tiles[hit.instanceId],123);
  mesh.dispose();geometry.dispose();material.dispose();
});

test('visual QA exercises all 13 real designs with households and jobs, without storage',async()=>{
  const {architectureCity}=await import('../src/benchmark/scenario.js'),city=architectureCity(),ids=new Set();
  city.tiles.forEach((t,i)=>{const d=buildingDesign(t,i%SIZE,Math.floor(i/SIZE));if(d&&['residential','commercial','industrial'].includes(t.kind))ids.add(d.id);});
  assert.equal(ids.size,13);assert.ok(city.citizens.length>1000);assert.ok(city.firms.length>10);assert.ok(city.citizens.some(c=>c.work));
});
