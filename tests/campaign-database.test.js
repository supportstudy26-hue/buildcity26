import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
import {createEmptyCity,serialize,executeCommand} from '../src/game/core.js';import {applyVerifiedClaim,updateCampaign,campaign} from '../src/game/systems/campaign.js';import {encodeCity} from '../src/services/city-codec.js';
test('campaign database: service-only claims, CAS races, unique receipt, ownership and durable reload',async()=>{
 const db=new PGlite(),a='40260000-0000-4000-8000-000000000010',b='40260000-0000-4000-8000-000000000020',id='50260000-0000-4000-8000-000000000010';
 const owner=async who=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[who]);await db.exec('set role authenticated');};
 const service=async()=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub','',false)");await db.exec('set role service_role');};
 const commit=async(revision,mission,state)=>{const packed=encodeCity(state,{always:true});return (await db.query('select public.bc26_mission_commit($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7) as result',[id,a,revision,mission,JSON.stringify(packed),JSON.stringify({state:packed,wallMs:0}),'a'.repeat(64)])).rows[0].result;};
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,aud text,role text,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
  await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
  const migration=await readFile(new URL('../supabase/migrations/202610100003_mission_campaign.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);
  await db.query('insert into auth.users(id) values($1),($2)',[a,b]);await owner(a);
  const s=createEmptyCity();for(let x=0;x<4;x++)executeCommand(s,{id:'cmd-'+x,sequence:x+1,type:'place',payload:{x,y:18,kind:'road'}});
  await db.query('select public.save_city_v2($1,$2,$3::jsonb,0,$4)',[id,s.name,JSON.stringify(encodeCity(serialize(s),{always:true})),'60260000-0000-4000-8000-000000000010']);
  await assert.rejects(db.query('select public.bc26_mission_read($1,$2)',[id,a]),/permission/);await assert.rejects(db.query('select * from private.bc26_mission_claims'),/permission/);
  await owner(b);assert.equal((await db.query('select id from public.cities where id=$1',[id])).rows.length,0);
  await service();await assert.rejects(db.query('select public.bc26_mission_read($1,$2)',[id,b]),/OWNER/);
  const before=s.money;applyVerifiedClaim(s,'bc26-main-001-b',1);const raw=serialize(s);
  const [first,second]=await Promise.all([commit(1,'bc26-main-001-b',raw),commit(1,'bc26-main-001-b',raw)]);assert.equal(first.city.revision,2);assert.equal(second.city.revision,2);assert.equal(first.city.state.money,before+7650);assert.equal(second.applied,false);
  await assert.rejects(commit(1,null,raw),/CONFLICT/);
  await owner(a);const tampered=structuredClone(first.city.state);tampered.progression.campaign.claims=[];await assert.rejects(db.query('select public.save_city_v2($1,$2,$3::jsonb,2,$4)',[id,s.name,JSON.stringify(tampered),'60260000-0000-4000-8000-000000000011']),/CONFLICT/);
  const load=(await db.query('select state from public.cities where id=$1',[id])).rows[0].state;assert.equal(load.progression.campaign.claims.length,1);assert.equal(load.money,before+7650);
  await db.exec('reset role');assert.equal((await db.query('select count(*)::integer n from private.bc26_mission_claims')).rows[0].n,1);
 }finally{await db.close();}
});

test('copying an owned canonical campaign inherits paid receipts, rejects foreign copies and survives deleting its source',async()=>{
 const db=new PGlite(),a='40260000-0000-4000-8000-000000000110',b='40260000-0000-4000-8000-000000000120',source='50260000-0000-4000-8000-000000000110',copy='50260000-0000-4000-8000-000000000111',foreign='50260000-0000-4000-8000-000000000112',forged='50260000-0000-4000-8000-000000000113',mission='bc26-main-001-b';
 const owner=async who=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[who]);await db.exec('set role authenticated');};
 const service=async()=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub','',false)");await db.exec('set role service_role');};
 const save=async(id,state,request)=>await db.query('select * from public.save_city_v2($1,$2,$3::jsonb,0,$4)',[id,'QA sao chép thành phố',JSON.stringify(state),request]);
 const commit=async(id,revision,state)=>{
  const packed=encodeCity(state,{always:true});return (await db.query('select public.bc26_mission_commit($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7) as result',[id,a,revision,mission,JSON.stringify(packed),JSON.stringify({state:packed,wallMs:0}),'b'.repeat(64)])).rows[0].result;
 };
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,aud text,role text,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
  await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610100003_mission_campaign.sql',import.meta.url),'utf8'));
  await db.query('insert into auth.users(id) values($1),($2)',[a,b]);
  const s=createEmptyCity();campaign(s).originCity=source;
  for(let x=0;x<4;x++)assert.ok(executeCommand(s,{id:'copy-road-'+x,sequence:x+1,type:'place',payload:{x,y:18,kind:'road'}}).ok);
  await owner(a);assert.equal((await save(source,encodeCity(serialize(s),{always:true}),'60260000-0000-4000-8000-000000000110')).rows[0].revision,1);
  const before=s.money;assert.equal(applyVerifiedClaim(s,mission,1),true);
  await service();const paid=await commit(source,1,serialize(s));assert.equal(paid.applied,true);assert.equal(paid.city.state.money,before+7650);
  // A public INSERT is the actual save-copy path. Its BEFORE/AFTER triggers
  // must copy only canonical evidence owned by the authenticated user.
  await owner(b);await assert.rejects(save(foreign,paid.city.state,'60260000-0000-4000-8000-000000000111'),/CONFLICT/);
  assert.equal((await db.query('select id from public.cities where id=$1',[foreign])).rows.length,0);
  await owner(a);const tampered=structuredClone(paid.city.state);tampered.progression.campaign.claims.push({id:'bc26-main-001-a',at:0,revision:1});
  await assert.rejects(save(forged,tampered,'60260000-0000-4000-8000-000000000112'),/CONFLICT/);
  assert.equal((await db.query('select id from public.cities where id=$1',[forged])).rows.length,0);
  const copied=(await save(copy,paid.city.state,'60260000-0000-4000-8000-000000000113')).rows[0];assert.equal(copied.revision,1);assert.equal(copied.state.money,paid.city.state.money);assert.deepEqual(copied.state.progression.campaign.claims,paid.city.state.progression.campaign.claims);
  await service();const canonical=(await db.query('select public.bc26_mission_read($1,$2) as result',[copy,a])).rows[0].result;
  assert.equal(canonical.checkpoint.state.progression.campaign.originCity,copy);assert.equal(canonical.checkpoint.state.progression.campaign.lastSaveRevision,0);
  const duplicate=await commit(copy,1,copied.state);assert.equal(duplicate.applied,false);assert.equal(duplicate.city.revision,1);assert.equal(duplicate.city.state.money,paid.city.state.money);
  const staleRetry=await commit(copy,0,copied.state);assert.equal(staleRetry.applied,false);assert.equal(staleRetry.city.revision,1);
  await owner(a);await db.query('select public.delete_city_v2($1,$2)',[source,paid.city.revision]);
  await service();const afterSourceDeletion=await commit(copy,1,copied.state);assert.equal(afterSourceDeletion.applied,false);assert.equal(afterSourceDeletion.city.state.money,paid.city.state.money);
  await db.exec('reset role');assert.equal((await db.query('select count(*)::integer n from private.bc26_mission_claims where city_id=$1',[copy])).rows[0].n,1);assert.equal((await db.query('select count(*)::integer n from private.bc26_mission_claims where city_id=$1',[source])).rows[0].n,0);
 }finally{await db.close();}
});
