import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCity,serialize,validateSave,executeCommand,SIZE,CATALOG,stepSimulation} from '../src/game/core.js';
import {createVietnamCity,geographyBuildRule} from '../src/game/geography/city.js';
import {searchProvinces,PROVINCE_NAMES} from '../src/game/geography/data.js';
import {NEW_CITY_CASH_BC} from '../src/config/simulation.js';
import {slopeAt,cellHeights} from '../src/game/systems/terrain.js';
const dir=new URL('../public/geodata/vn-20261008/',import.meta.url);
const json=async file=>JSON.parse(await readFile(new URL(file,dir),'utf8'));
const catalog=await json('catalog.json'),manifest=await json('manifest.json'),bounds=await json('boundaries.geojson');
function ringContains(p,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function contains(p,g){return(g.type==='Polygon'?[g.coordinates]:g.coordinates).some(poly=>ringContains(p,poly[0])&&!poly.slice(1).some(r=>ringContains(p,r)));}
const cmd=(s,kind,i)=>executeCommand(s,{id:'geo-'+(s.commandSequence+1),sequence:s.commandSequence+1,type:'place',payload:{kind,x:i%SIZE,y:Math.floor(i/SIZE)}});
test('34 official administrative codes, 9 cities, aliases, interior labels and actual polygon packages are linked',async()=>{
  assert.equal(catalog.provinces.length,34);assert.equal(catalog.provinces.filter(p=>p.kind==='city').length,9);assert.deepEqual(Object.fromEntries(catalog.provinces.map(p=>[p.id,p.name])),PROVINCE_NAMES);
  for(const province of catalog.provinces){const f=bounds.features.find(f=>f.id===province.id);assert.ok(f);assert.ok(contains(f.properties.label,f.geometry));assert.ok(province.regions.length);for(const r of province.regions){const raw=await readFile(new URL(r.id+'.json',dir));assert.equal(createHash('sha256').update(raw).digest('hex'),r.sha256);const pkg=JSON.parse(raw);assert.equal(pkg.region.provinceId,province.id);assert.ok(pkg.region.startable);assert.ok(contains(pkg.region.anchor,f.geometry));const s=createVietnamCity(pkg,manifest);assert.equal(s.citizens.length,0);assert.equal(s.money,NEW_CITY_CASH_BC);assert.equal(s.network.connected.size,4);assert.deepEqual(s.world.heights,pkg.playable.heights);assert.deepEqual(serialize(validateSave(serialize(s))),serialize(s));}}
  assert.equal(searchProvinces(catalog.provinces,'bac giang')[0].id,'24');assert.equal(searchProvinces(catalog.provinces,'Đắk Nông')[0].id,'68');
  assert.equal(searchProvinces(catalog.provinces,'Phú Quốc')[0].id,'91');assert.equal(searchProvinces(catalog.provinces,'Cần Thạnh')[0].id,'79');
});
test('real mountain, plateau, delta, coast and island packages have contrasting elevations and water masks',async()=>{
  const mountain=await json('04-start.json'),plateau=await json('66-start.json'),delta=await json('92-start.json'),coast=await json('22-start.json'),island=await json('91-island.json'),estuary=await json('79-coast.json');
  assert.ok(mountain.stats.maxElevation-mountain.stats.minElevation>300);assert.ok(plateau.stats.maxElevation>300);assert.ok(delta.stats.meanSlopePercent<mountain.stats.meanSlopePercent);assert.ok(coast.stats.seaKm2>10);assert.ok(island.stats.seaKm2>5);assert.ok(coast.playable.waterMask.includes(1));assert.ok(estuary.stats.seaKm2>0);assert.ok(estuary.hydro.some(f=>['river','riverbank'].includes(f.properties.water)));assert.ok(estuary.stats.riverDistanceMeters<6000);
});
test('terrain build restrictions are enforced through commands; paid ground costs and bridges survive offline JSON save/load',async()=>{
  const s=createVietnamCity(await json('22-start.json'),manifest);
  const sea=s.world.geography.waterMask.findIndex((v,i)=>v===1&&s.world.geography.insideProvince[i]&&slopeAt(s.world,i,SIZE)<=20);
  assert.ok(sea>=0);const before=serialize(s),blocked=cmd(s,'residential',sea);assert.equal(blocked.ok,false);assert.equal(s.money,before.money);assert.equal(s.tiles[sea].zone,null);
  assert.equal(cmd(s,'road',sea).ok,false);const loan={id:'qa-bridge-loan',sequence:s.commandSequence+1,type:'borrow',payload:{amount:500000}};assert.equal(executeCommand(s,loan).ok,true);const bridge=cmd(s,'road',sea);assert.equal(bridge.ok,true);assert.equal(bridge.cost,134000);assert.equal(s.tiles[sea].kind,'road');
  const land=s.tiles.findIndex((t,i)=>!t.kind&&t.terrain!=='water'&&s.world.geography.insideProvince[i]&&slopeAt(s.world,i,SIZE)<=15&&Math.min(...cellHeights(s.world,i,SIZE))>=0);assert.ok(land>=0);
  const balance=s.money,rule=geographyBuildRule(s,land,'residential'),r=cmd(s,'residential',land);assert.ok(r.ok);assert.equal(balance-s.money,Math.ceil(CATALOG.residential.cost*rule.factor));
  const restored=validateSave(JSON.parse(JSON.stringify(serialize(s))));assert.deepEqual(restored.world,s.world);assert.equal(restored.tiles[sea].kind,'road');assert.equal(restored.tiles[land].zone,'residential');assert.equal(restored.money,s.money);
  for(let i=0;i<30;i++)stepSimulation(restored);assert.equal(restored.clock.seconds,30);
  const outside=s.world.geography.insideProvince.findIndex(x=>!x);if(outside>=0){const rule=geographyBuildRule(s,outside,'road');assert.equal(rule.ok,false);}
  const bad=serialize(s);bad.world.geography.version='other';assert.throws(()=>validateSave(bad),/địa lý/);
  const wrong=serialize(s);wrong.tiles[sea].terrain='grass';assert.throws(()=>validateSave(wrong),/Mặt nước/);
});
test('old procedural schema 5 preserves IDs, money, terrain, clock and does not get a random province',()=>{
  const raw=serialize(createCity());raw.schemaVersion=5;const loaded=validateSave(raw);assert.equal(loaded.world.geography,undefined);assert.equal(loaded.money,raw.money);assert.deepEqual(loaded.citizens,raw.citizens);assert.deepEqual(loaded.world,raw.world);assert.deepEqual(loaded.clock,raw.clock);assert.equal(loaded.schemaVersion,6);
});
