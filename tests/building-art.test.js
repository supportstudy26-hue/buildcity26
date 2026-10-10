import {LANDMARKS} from '../src/config/landmarks.js';
import {ROAD_KINDS,roadProfile} from '../src/config/road-profiles.js';
import {orientBuildingToRoad} from '../src/game/render/street-environment.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BuildingArtRegistry,BUILDING_ART,artForBuilding} from '../src/config/building-art.js';
import {CATALOG,BUILDINGS} from '../src/config/catalog.js';
import {buildingParts,buildingDesign} from '../src/game/render/building-designs.js';
import {placementGhost} from '../src/game/render/build-ghost.js';
import {createCity,serialize,validateSave,index,SIZE,place} from '../src/game/core.js';
import {chunkParts,roadParts} from '../src/game/render/scene-data.js';
import {surfaceHeight} from '../src/game/systems/terrain.js';
test('every active buildable has an explicit reference and all 216 measured frames survive integration',()=>{
 assert.equal(Object.keys(BuildingArtRegistry).length,216);
 const original=JSON.parse(readFileSync(new URL('../art-source/Build_City_26_Building_Art/manifest.json',import.meta.url)));
 for(const a of original.assets){const mapped=BuildingArtRegistry[a.id];assert.deepEqual(mapped.frame,a.frame);assert.deepEqual(mapped.anchor,a.anchor);assert.ok(a.frame.x+a.frame.width<=1254&&a.frame.y+a.frame.height<=1254);}
 for(const kind of Object.keys(CATALOG).filter(k=>!['inspect','bulldoze'].includes(k)&&!ROAD_KINDS.includes(k)&&!LANDMARKS[k]))assert.ok(artForBuilding(kind),kind);
 for(const kind of ROAD_KINDS)assert.ok(roadProfile(kind)&&CATALOG[kind].cost>0,kind);
 assert.equal(Object.keys(BUILDING_ART).length,29);
});
test('facilities have distinct silhouettes within their core footprint and never invent residents/stock',()=>{
 const fingerprints=new Set();
 for(const kind of BUILDINGS){const t={kind,level:1,garbage:0},d=buildingDesign(t,4,18),parts=buildingParts(t,4,18,0,0,0);
  if(LANDMARKS[kind])assert.equal(d.procedural,true);else assert.equal(d.artId,BUILDING_ART[kind]);assert.ok(Math.max(...parts.map(p=>p.position[1]+p.scale[1]/2))<=d.height+.001,kind);assert.ok(parts.length>=5&&parts.length<=65,kind);
  for(const p of parts){assert.ok(p.scale.every(v=>Number.isFinite(v)&&v>0),kind);assert.ok(p.position.every(Number.isFinite),kind);assert.ok(Math.abs(p.position[0])+p.scale[0]/2<=10&&Math.abs(p.position[2])+p.scale[2]/2<=10,kind);assert.ok(p.position[1]-p.scale[1]/2>=-.01,kind);}
  fingerprints.add(JSON.stringify(parts.map(p=>[p.shape,p.position,p.scale])));
 }
 assert.equal(fingerprints.size,BUILDINGS.length);
});
test('preview and placement share template/footprint without touching saves, finances, owners or agent state',()=>{
 const city=createCity(),before=serialize(city),hover={x:5,y:18,i:index(5,18)};
 for(const kind of BUILDINGS){const ghost=placementGhost(city,hover,kind),base=surfaceHeight(city,hover.i,SIZE,kind);
  assert.deepEqual(ghost.parts,orientBuildingToRoad(city,hover.i,buildingParts({kind,level:1},5,18,110,370,base,ghost.valid?'#4de0b7':'#ef8c84',hover.i),base).filter(p=>!p.detail));
 }
 assert.deepEqual(serialize(city),before);const loaded=validateSave(before);
 assert.deepEqual(serialize(loaded),before);assert.deepEqual(chunkParts(city,0,16),chunkParts(loaded,0,16));
});

test('bridge and facility ghosts use the actual placed elevation and do not change build/upgrade/demolish state',()=>{
 const city=createCity(),x=5,y=17,i=index(x,y),ghost=placementGhost(city,{x,y,i},'smallWater');
 assert.equal(ghost.valid,true);assert.equal(place(city,x,y,'smallWater').ok,true);
 const placed=chunkParts(city,0,16).filter(p=>p.tile===i&&!p.detail).slice(1);
 assert.deepEqual(ghost.parts.map(p=>[p.shape,p.position,p.scale]),placed.map(p=>[p.shape,p.position,p.scale]));
 const save=serialize(city),loaded=validateSave(save);assert.deepEqual(serialize(loaded),save);
 assert.equal(place(loaded,x,y,'bulldoze').ok,true);assert.equal(loaded.tiles[i].kind,null);assert.equal(city.tiles[i].kind,'smallWater');
 for(const tool of ['road','avenue']){const point={x:5,y:18,i:index(5,18)},g=placementGhost(city,point,tool);assert.deepEqual(g.parts,roadParts(city,point.x,point.y,tool,'normal',g.valid?'#4de0b7':'#ef8c84').filter(p=>!p.detail));}
 const bridge=city.tiles.findIndex(t=>t.terrain==='water');if(bridge>=0){const point={x:bridge%SIZE,y:Math.floor(bridge/SIZE),i:bridge},g=placementGhost(city,point,'road');assert.ok(g.parts.some(p=>p.scale[1]>1));assert.deepEqual(serialize(city),save);}
});
