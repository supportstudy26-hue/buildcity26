import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const template=await readFile(new URL('../scripts/offline-worker.template.js',import.meta.url),'utf8');
function harness(){
  const listeners={},stores=new Map();let offline=false;
  const url=r=>new URL(typeof r==='string'?r:r.url,'https://game.test').href;
  const caches={keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async name=>{
    if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);
    return {keys:async()=>[...data.keys()].map(u=>new Request(u)),delete:async r=>data.delete(url(r)),match:async r=>data.get(url(r))?.clone(),put:async(r,response)=>data.set(url(r),response.clone()),addAll:async paths=>{for(const p of paths)data.set(url(p),new Response(p.endsWith('.html')?'GAME_SHELL':'GAME_CODE'));}};
  }};
  vm.runInNewContext(template.replace('__BUILD_ID__','"test-build"').replace('__ASSET_PATHS__','["/index.html","/benchmark.html","/assets/game-123.js"]'),{
    self:{location:{origin:'https://game.test'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>listeners[name]=fn},caches,URL,Response,
    fetch:async r=>{if(offline)throw new TypeError('network lost');return new Response('PUBLIC_DATA:'+url(r));}
  });
  async function lifecycle(name){const waits=[];listeners[name]({waitUntil:p=>waits.push(p)});await Promise.all(waits);}
  async function request(path,options={}){const waits=[];let response;const req=new Request(new URL(path,'https://game.test'),options);listeners.fetch({request:req,respondWith:p=>response=p,waitUntil:p=>waits.push(p)});if(!response)return null;const result=await response;await Promise.all(waits);return result;}
  return {request,lifecycle,stores,setOffline:value=>offline=value};
}
test('public cache opens downloaded geography offline and refuses uncached regions, API and auth requests',async()=>{
  const h=harness();await h.lifecycle('install');await h.lifecycle('activate');
  const path='/geodata/vn-20261008/22-start.json';assert.equal((await h.request(path)).status,200);
  h.setOffline(true);assert.match(await(await h.request(path)).text(),/PUBLIC_DATA/);
  assert.equal((await h.request('/geodata/vn-20261008/04-start.json')).status,503);
  assert.equal(await h.request('https://adnmfknbskbagiahstim.supabase.co/rest/v1/cities'),null);
  assert.equal(await h.request('/api/login'),null);
  assert.equal(await h.request(path,{headers:{authorization:'Bearer private'}}),null);
  assert.equal(await h.request('/assets/game-123.js?token=private'),null);
  assert.equal(await h.request(path,{method:'POST',body:'private'}),null);
  assert.equal(await(await h.request('/assets/game-123.js')).text(),'GAME_CODE');
});
test('disk geography cache retains metadata and evicts older downloaded regions after four packages',async()=>{
  const h=harness();await h.lifecycle('install');
  for(const file of ['catalog.json','manifest.json','boundaries.geojson','archipelagos.json','01-start.json','04-start.json','08-start.json','11-start.json','12-start.json','14-start.json'])await h.request('/geodata/vn-20261008/'+file);
  const data=h.stores.get('bc26-public-geodata-v1');assert.equal(data.size,8);
  h.setOffline(true);assert.equal((await h.request('/geodata/vn-20261008/01-start.json')).status,503);
  assert.equal((await h.request('/geodata/vn-20261008/14-start.json')).status,200);
  assert.equal((await h.request('/geodata/vn-20261008/catalog.json')).status,200);
  assert.equal((await h.request('/geodata/vn-20261008/archipelagos.json')).status,200);
});
