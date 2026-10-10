import test from 'node:test';
import assert from 'node:assert/strict';
import {cityFocus} from '../src/game/render/city-focus.js';
import {createEmptyCity,createCity,index,serialize} from '../src/game/core.js';
import {chunkParts} from '../src/game/render/scene-data.js';

test('camera centers actual buildings rather than a distant starter position, without editing the save',()=>{
 const s=createEmptyCity();s.tiles[index(1,18)].kind='residential';s.tiles[index(3,20)].kind='commercial';s.tiles[index(63,0)].kind='road';
 const before=serialize(s),f=cityFocus(s,1280);assert.deepEqual(f,{x:2,y:19,distance:220});assert.deepEqual(serialize(s),before);
 assert.ok(cityFocus(s,390).distance>=300);assert.ok(cityFocus(createCity()).distance<=950);
});
test('empty and road-only cities frame the real entry point or roads',()=>{
 const s=createEmptyCity();assert.equal(cityFocus(s).x,2);assert.equal(cityFocus(s).y,18);
 s.world.geography={entryTile:index(40,30)};assert.deepEqual(cityFocus(s),{x:42,y:30,distance:240});
 s.tiles[index(40,30)].kind='road';s.tiles[index(43,30)].kind='road';assert.equal(cityFocus(s).x,41.5);assert.equal(cityFocus(s).y,30);
});
test('terrain trees have multiple lightweight shared silhouettes, stable across redraws',()=>{
 const s=createEmptyCity(),a=chunkParts(s,0,16),b=chunkParts(s,0,16);assert.deepEqual(a,b);
 const canopy=a.filter(p=>['cone','ico'].includes(p.shape));assert.ok(canopy.some(p=>p.shape==='ico'));assert.ok(canopy.some(p=>p.shape==='cone'));
 for(const p of canopy){assert.ok(p.scale.every(v=>Number.isFinite(v)&&v>0));assert.equal(p.detail,false);}
});
