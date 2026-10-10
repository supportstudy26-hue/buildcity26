import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseFormerNames,mergeNationalCatalog,searchNational,validateNationalCatalog,polygonParts,referenceBuildRule,fetchNational,PROVINCE_CODES} from '../src/game/geography/national.js';
import {overviewPath,projectOverview,unprojectOverview} from '../src/game/geography/overview.js';
import {localToWgs84,wgs84ToLocal,wgs84ToUtm} from '../src/game/geography/local-projection.js';
import {createVietnamCity} from '../src/game/geography/city.js';
import {serialize,validateSave} from '../src/game/core.js';
const root=new URL('../public/geodata/vn-map-20250701-v1/',import.meta.url),old=new URL('../public/geodata/vn-20261008/',import.meta.url);
const json=async (f,base=root)=>JSON.parse(await readFile(new URL(f,base),'utf8'));
const provinces=await json('provinces.json'),light=await json('vietnam-34-light.geojson'),full=await json('vietnam-34-full.geojson'),islands=await json('islands.json'),manifest=await json('manifest.json'),legacy=await json('catalog.json',old),aliases=parseFormerNames(await readFile(new URL('old-63-to-new-34.csv',root),'utf8')),catalog=mergeNationalCatalog(provinces,legacy.provinces,aliases,islands);
test('supplied 34-region snapshot, 63 former names, exact files, multipart and hole paths remain intact',async()=>{
 validateNationalCatalog(provinces,light,aliases);assert.equal(provinces.filter(p=>p.kind2025==='city').length,6);
 for(const [file,entry] of Object.entries(manifest.files)){const bytes=await readFile(new URL(file,root));assert.equal(bytes.length,entry.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);}
 for(const p of provinces){assert.ok(catalog.find(c=>c.id===p.id).regions.length);const l=light.features.find(f=>f.id===p.id),f=full.features.find(f=>f.id===p.id);assert.equal(polygonParts(l.geometry).length,polygonParts(f.geometry).length);const rings=polygonParts(l.geometry).reduce((n,p)=>n+p.length,0);assert.equal((overviewPath(l.geometry).match(/Z/g)||[]).length,rings);}
 for(const a of aliases)assert.ok(searchNational(catalog,a.name).some(p=>p.id===a.provinceId));
 assert.equal(searchNational(catalog,'bac giang')[0].id,'vn-bac-ninh');assert.equal(searchNational(catalog,'ba ria - vung tau')[0].id,'vn-ho-chi-minh');assert.equal(searchNational(catalog,'ba ria vung tau')[0].id,'vn-ho-chi-minh');assert.equal(searchNational(catalog,'phu quoc')[0].id,'vn-an-giang');assert.equal(searchNational(catalog,'con dao')[0].id,'vn-ho-chi-minh');
 assert.ok(provinces.find(p=>p.id==='vn-dong-thap').labelAnchorWgs84[1]<11);assert.ok(provinces.find(p=>p.id==='vn-lang-son').labelAnchorWgs84[1]>21);
 const hole={type:'Polygon',coordinates:[[[0,0],[2,0],[2,2],[0,0]],[[.5,.5],[1,.5],[.5,1],[.5,.5]]]};assert.equal((overviewPath(hole).match(/Z/g)||[]).length,2);
});
test('four islands use original WGS84; Con Dao is present once; offshore references cannot create terrain',async()=>{
 const parents={'phu-quoc':'vn-an-giang','hoang-sa':'vn-da-nang','truong-sa':'vn-khanh-hoa','con-dao':'vn-ho-chi-minh'};for(const a of islands){assert.equal(a.provinceId,parents[a.id]);const roundtrip=unprojectOverview(projectOverview(a.referencePointWgs84));assert.ok(roundtrip.every((v,i)=>Math.abs(v-a.referencePointWgs84[i])<1e-12));assert.equal(referenceBuildRule(a).ok,false);}
 const hcm=full.features.find(f=>f.id==='vn-ho-chi-minh');const con=polygonParts(hcm.geometry).filter(poly=>poly[0].every(([x,y])=>x>106.48&&x<106.8&&y>8.6&&y<8.9));assert.equal(con.length,11);assert.equal(new Set(con.map(p=>JSON.stringify(p))).size,11);
 const offshore=await json('offshore-island-reef-reference.geojson');assert.ok(offshore.features.length);assert.ok(offshore.features.every(f=>f.properties.buildable===false));
 for(const id of ['vn-da-nang','vn-khanh-hoa'])assert.ok(polygonParts(full.features.find(f=>f.id===id).geometry).some(poly=>poly[0].some(p=>p[0]>111)));
});
test('local metres, per-location UTM, vn IDs and legacy geographic save migration preserve playable state',async()=>{
 const m=await json('manifest.json',old);let worst=0,sourceError=0;const crs=new Set();
 for(const r of legacy.provinces.flatMap(p=>p.regions)){
  const pkg=await json(r.id+'.json',old),city=createVietnamCity(pkg,m),g=city.world.geography;crs.add(g.crs);assert.equal(PROVINCE_CODES[g.provinceId],pkg.region.provinceId);assert.equal(g.mapSnapshot,'2025-07-01');assert.equal(g.terrainSourceVersion,pkg.version);
  const centre=wgs84ToUtm(pkg.region.anchor,pkg.crs);sourceError=Math.max(sourceError,Math.hypot(centre[0]-pkg.utmCenter[0],centre[1]-pkg.utmCenter[1]));
  for(const p of [[0,0],[640,640],[1280,1280]]){const back=wgs84ToLocal(localToWgs84(p,g),g);worst=Math.max(worst,Math.hypot(back[0]-p[0],back[1]-p[1]));}
  const raw=serialize(city);assert.deepEqual(serialize(validateSave(raw)),raw);
  const legacyRaw=structuredClone(raw);legacyRaw.world.geography.provinceId=pkg.region.provinceId;for(const k of ['provinceCode','mapSnapshot','mapVersion','worldOriginWgs84','localProjection','terrainSourceVersion'])delete legacyRaw.world.geography[k];
  const restored=serialize(validateSave(legacyRaw));assert.deepEqual(restored,raw);
 }
 assert.equal(crs.size,2);assert.ok(worst<.02,`roundtrip ${worst} m`);assert.ok(sourceError<.02,`source UTM ${sourceError} m`);console.log('UTM maximum roundtrip metres',worst,'source comparison metres',sourceError);
 const bad=serialize(createVietnamCity(await json('48-start.json',old),m));bad.world.geography.worldOriginWgs84[0]+=1;assert.throws(()=>validateSave(bad),/địa lý/);
});
test('light and full load only on explicit request; bad checksums, network errors and oversized files fail',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);const calls=[];
 globalThis.fetch=async url=>{const file=url.split('/').at(-1);calls.push(file);return new Response(await readFile(new URL(file,root)));};
 await fetchNational('vietnam-34-light.geojson',{entry:manifest.files['vietnam-34-light.geojson']});assert.deepEqual(calls,['vietnam-34-light.geojson']);
 await fetchNational('vietnam-34-full.geojson',{entry:manifest.files['vietnam-34-full.geojson']});assert.equal(calls.length,2);
 globalThis.fetch=async()=>new Response('wrong');await assert.rejects(fetchNational('vietnam-34-light.geojson',{entry:manifest.files['vietnam-34-light.geojson']}),/Checksum/);
 globalThis.fetch=async()=>new Response('offline',{status:503});await assert.rejects(fetchNational('provinces.json'),/503/);
 globalThis.fetch=async()=>new Response('x'.repeat(101));await assert.rejects(fetchNational('test.json',{entry:{bytes:100,sha256:'a'.repeat(64)}}),/giới hạn/);
});
