import test from 'node:test';
import assert from 'node:assert/strict';
import {BackupStore} from '../src/services/backup-store.js';
import {saveLocal,loadLocal,localKey,compactLocal} from '../src/services/local-storage.js';
import {createEmptyCity,serialize} from '../src/game/core.js';
const storage=()=>{const m=new Map();return{get length(){return m.size;},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
const memory=()=>{const m=new Map();return{put:async r=>m.set(r.key,structuredClone(r)),get:async k=>m.get(k),list:async()=>[...m.values()],remove:async k=>m.delete(k)}};
test('backups no longer use the full localStorage quota and remain readable after restart',async()=>{
 const s=storage(),store=memory(),city=createEmptyCity();saveLocal(city,'A',null,{},s);const raw=s.getItem(localKey('A'));
 s.setItem=()=>{throw new DOMException('Full','QuotaExceededError')};
 const repo=new BackupStore({store,storage:s}),key=await repo.archiveLocal('A');
 assert.equal(await repo.read(key,'A'),raw);await repo.archiveLocal('A');assert.equal((await repo.list('A')).length,1);assert.equal((await repo.list('B')).length,0);await assert.rejects(repo.read(key,'B'),/không thuộc/);
 const restarted=new BackupStore({store,storage:s});assert.equal(await restarted.read(key,'A'),raw);assert.equal(loadLocal('A',s).city.money,city.money);
 await restarted.remove(key,'A');assert.equal((await repo.list('A')).length,0);assert.ok(loadLocal('A',s));
});
test('migration retains damaged legacy backups and removes local bytes only after verified durable commit',async()=>{
 const s=storage(),store=memory(),repo=new BackupStore({store,storage:s});const key='bc26:v1:backup:A:old';s.setItem(key,'broken JSON');s.setItem(localKey('A'),'active');s.setItem(localKey('B'),'other');
 await repo.migrateLocal();assert.equal(s.getItem(key),null);assert.equal(await repo.read(key,'A'),'broken JSON');assert.equal(s.getItem(localKey('A')),'active');assert.equal(s.getItem(localKey('B')),'other');
 const denied={...memory(),put:async()=>{throw new Error('Disk full')}};s.setItem(key,'keep');const write=s.setItem;s.setItem=()=>{throw new Error('Disk full')};await assert.rejects(new BackupStore({store:denied,storage:s}).migrateLocal());assert.equal(s.getItem(key),'keep');s.setItem=write;
});
test('concurrent changes and unverifiable storage never delete an old local backup',async()=>{
 const s=storage(),key='bc26:v1:backup:A:old';s.setItem(key,'first');const store=memory(),put=store.put;store.put=async row=>{await put(row);s.setItem(key,'second')};await new BackupStore({store,storage:s}).migrateLocal();assert.equal(s.getItem(key),'second');assert.equal((await store.get(key)).raw.includes('bc26-local-archive'),true);
 const faulty={...memory(),get:async()=>null};await new BackupStore({store:faulty,storage:s}).migrateLocal();assert.ok(s.getItem(key));
});
test('private browser fallback still supports local backups',async()=>{
 const s=storage(),store={put:async()=>{throw new Error('Denied')},get:async()=>{throw new Error('Denied')},list:async()=>{throw new Error('Denied')},remove:async()=>{throw new Error('Denied')}};
 const repo=new BackupStore({store,storage:s}),key=await repo.archive('A','broken JSON');assert.equal(await repo.read(key,'A'),'broken JSON');assert.equal((await repo.list('A')).length,1);await repo.remove(key,'A');assert.equal((await repo.list('A')).length,0);
});
test('lossless quota compaction preserves owner drafts and uncertain cloud payloads',()=>{
 const s=storage(),city=createEmptyCity(),pending={id:'11111111-1111-4111-8111-111111111111',requestId:'22222222-2222-4222-8222-222222222222',revision:4,state:serialize(city),name:city.name};saveLocal(city,'A',null,{pending},s);saveLocal(city,'B',null,{},s);s.setItem('unrelated','keep');s.setItem('bc26:v1:backup:A:bad','broken JSON');compactLocal(s);assert.deepEqual(loadLocal('A',s).pending,pending);assert.deepEqual(serialize(loadLocal('B',s).city),serialize(city));assert.equal(s.getItem('unrelated'),'keep');assert.equal(s.getItem('bc26:v1:backup:A:bad'),'broken JSON');
});
