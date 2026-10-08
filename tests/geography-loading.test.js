import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fetchGeoJSON,loadRegion,geographyCacheStats} from '../src/game/geography/data.js';
const dir=new URL('../public/geodata/vn-20261008/',import.meta.url);
const catalog=JSON.parse(await readFile(new URL('catalog.json',dir)));
test('missing, corrupt and oversized geographical data cannot silently open a substitute map',async t=>{
  const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
  globalThis.fetch=async()=>new Response('missing',{status:503});
  await assert.rejects(fetchGeoJSON('22-start.json'),/503/);
  globalThis.fetch=async()=>new Response('{"other":"data"}');
  await assert.rejects(loadRegion(catalog.provinces[0].regions[0]),/Checksum/);
  globalThis.fetch=async()=>new Response('x'.repeat(101));
  await assert.rejects(fetchGeoJSON('22-start.json',{maxBytes:100}),/giới hạn/);
  assert.equal(geographyCacheStats().packages,0);
});
test('lazy loading pins checksums, reuses four bounded packages and aborts before returning cached data',async t=>{
  const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);let calls=0;
  globalThis.fetch=async url=>{calls++;return new Response(await readFile(new URL(url.split('/').at(-1),dir)));};
  const regions=catalog.provinces.slice(0,6).map(p=>p.regions[0]);
  const p=await loadRegion(regions[0]);p.playable.heights[0]=999;
  assert.notEqual((await loadRegion(regions[0])).playable.heights[0],999);assert.equal(calls,1);
  for(const r of regions.slice(1))await loadRegion(r);
  assert.equal(geographyCacheStats().packages,4);assert.ok(geographyCacheStats().sourceBytes<=8_000_000);
  await loadRegion(regions[0]);assert.equal(calls,7);
  const abort=new AbortController();abort.abort();await assert.rejects(loadRegion(regions[0],{signal:abort.signal}),{name:'AbortError'});assert.equal(calls,7);
});
