import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {overviewLandGeometry,geographicViewBox,projectOverview} from '../src/game/geography/overview.js';
import {searchProvinces} from '../src/game/geography/data.js';
const base=new URL('../public/geodata/vn-20261008/',import.meta.url);
const read=async f=>JSON.parse(await readFile(new URL(f,base)));
const data=await read('archipelagos.json'),catalog=await read('catalog.json'),boundaries=await read('boundaries.geojson');
test('archipelagos retain the 34 province catalog and are searchable under their verified parent',()=>{
  assert.equal(catalog.provinces.length,34);assert.equal(data.archipelagos.length,2);
  assert.equal(searchProvinces(catalog.provinces,'hoang sa')[0].id,'48');assert.equal(searchProvinces(catalog.provinces,'truong sa')[0].id,'56');
  for(const a of data.archipelagos)assert.equal(catalog.provinces.find(p=>p.id===a.provinceId).name,a.provinceName);
});
test('real reference positions fit their geographic windows, including both archipelagos in the country view',()=>{
  for(const a of data.archipelagos){const [x,y,w,h]=geographicViewBox(a.bbox);for(const p of a.points){const [px,py]=projectOverview(p.anchor);assert.ok(px>=x&&px<=x+w&&py>=y&&py<=y+h);assert.ok(px>=0&&px<750&&py>=0&&py<850);}}
  const hs=data.archipelagos[0];assert.equal(hs.coasts.length,0);assert.equal(hs.points.length,12);
  const hoang=hs.points.find(p=>p.name==='Đảo Hoàng Sa');assert.ok(Math.abs(hoang.anchor[0]-(111+36/60+7/3600))<1e-6);assert.ok(Math.abs(hoang.anchor[1]-(16+32/60))<1e-6);
  const ts=data.archipelagos[1].points.find(p=>p.name==='Đảo Trường Sa');assert.deepEqual(ts.anchor,[111.9196858,8.6446406]);
});
test('overview preserves all administrative maritime components without changing the source',()=>{
  const f=boundaries.features.find(f=>f.id==='56'),before=JSON.stringify(f);assert.equal(f.geometry.coordinates.length,8);
  const land=overviewLandGeometry(f);assert.equal(land.coordinates.length,f.geometry.coordinates.length);assert.equal(JSON.stringify(f),before);
  for(const other of boundaries.features.filter(f=>f.id!=='56'))assert.equal(overviewLandGeometry(other),other.geometry);
});
test('overview coast lines are bounded actual OSM ways and the added package has a verified checksum',async()=>{
  const a=data.archipelagos[1];assert.equal(a.coasts.length,46);assert.equal(a.points.length,9);assert.match(data.inputSHA256,/^[a-f0-9]{64}$/);
  for(const f of a.coasts){assert.match(f.id,/^w\d+$/);assert.equal(f.geometry.type,'LineString');assert.ok(f.geometry.coordinates.length>=2);for(const [lon,lat] of f.geometry.coordinates)assert.ok(lon>=111.5&&lon<=117&&lat>=7.5&&lat<=12);if(f.properties.closed)assert.deepEqual(f.geometry.coordinates[0],f.geometry.coordinates.at(-1));}
  const manifest=await read('manifest.json'),payload=await readFile(new URL('archipelagos.json',base));assert.equal(manifest.files['archipelagos.json'].bytes,payload.length);assert.equal(manifest.files['archipelagos.json'].sha256,createHash('sha256').update(payload).digest('hex'));
});
