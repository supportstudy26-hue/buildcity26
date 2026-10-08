import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createCity,serialize} from '../src/game/core.js';
import {saveLocal,loadLocal,archiveLocal,listLocalBackups,readLocalBackup,removeLocalBackup,localKey} from '../src/services/local-storage.js';
function storage(){const map=new Map();return {get length(){return map.size;},key:i=>[...map.keys()][i],getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};}
const id='11111111-1111-4111-8111-111111111111',requestId='22222222-2222-4222-8222-222222222222';
test('guest and account drafts are separate and original envelopes still load',()=>{const s=storage(),a=createCity(),b=createCity();b.name='B';saveLocal(a,'guest',null,{},s);saveLocal(b,'A',{id,revision:1},{},s);assert.equal(loadLocal('guest',s).city.name,a.name);assert.equal(loadLocal('A',s).city.name,'B');assert.equal(loadLocal('B',s),null);});
test('pending requests and conflict survive reload',()=>{const s=storage(),city=createCity();const pending={id,requestId,revision:1,name:city.name,state:serialize(city)};saveLocal(city,'A',{id,revision:1},{pending,conflict:true,dirty:true},s);const data=loadLocal('A',s);assert.deepEqual(data.pending,pending);assert.equal(data.conflict,true);});
test('archive preserves raw damaged saves without attempting to decode them',()=>{const s=storage();s.setItem(localKey('A'),'broken JSON');assert.throws(()=>loadLocal('A',s));archiveLocal('A',s,()=>id);assert.equal(readLocalBackup(listLocalBackups('A',s)[0].key,'A',s),'broken JSON');assert.equal(s.getItem(localKey('A')),'broken JSON');});
test('opening another draft does not remove the archived city',()=>{const s=storage(),a=createCity(),b=createCity();b.name='Second';saveLocal(a,'A',null,{},s);archiveLocal('A',s,()=>id);saveLocal(b,'A',null,{},s);const row=listLocalBackups('A',s)[0];assert.equal(JSON.parse(readLocalBackup(row.key,'A',s)).city.name,a.name);assert.throws(()=>readLocalBackup(row.key,'B',s));});
test('a quota failure is propagated so the game can stop replacing the draft',()=>{const s=storage();s.setItem=()=>{throw new Error('QuotaExceededError');};assert.throws(()=>saveLocal(createCity(),'A',null,{},s));});

test('backup deletion checks the owner and preserves active drafts',()=>{const s=storage();saveLocal(createCity(),'A',null,{},s);archiveLocal('A',s,()=>id);const row=listLocalBackups('A',s)[0];assert.throws(()=>removeLocalBackup(row.key,'B',s));removeLocalBackup(row.key,'A',s);assert.equal(listLocalBackups('A',s).length,0);assert.ok(loadLocal('A',s));});

// An uncertain old-schema request must retain its bytes/ID until acknowledged.
test('migration preserves an uncertain cloud request and schedules the migrated snapshot after acknowledgement',async()=>{
  const {CloudSync}=await import('../src/services/cloud-sync.js');
  const s=storage(),legacy=JSON.parse(readFileSync(new URL('./fixtures/legacy-v1.json',import.meta.url)));
  legacy.money=120000;legacy.loanBalance=10000;
  const pending={id,requestId,revision:1,name:legacy.name,state:legacy};
  s.setItem(localKey('A'),JSON.stringify({city:legacy,cloud:{id,revision:1},pending,dirty:true}));
  const loaded=loadLocal('A',s);assert.deepEqual(loaded.pending,pending);assert.equal(loaded.city.money,12000000);
  const sync=new CloudSync({snapshot:()=>serialize(loaded.city),persist:()=>true,send:async request=>{assert.deepEqual(request,pending);return{id,revision:2};}});
  sync.use('A',loaded);assert.equal(await sync.save(),true);assert.equal(sync.dirty,true);assert.equal(sync.status,'pending');assert.equal(sync.pending,null);
});

test('identical raw backup is reused without multiplying quota consumption',()=>{const s=storage();saveLocal(createCity(),'A',null,{},s);archiveLocal('A',s,()=>id);archiveLocal('A',s,()=>requestId);assert.equal(listLocalBackups('A',s).length,1);});
