import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const a='40260000-0000-4000-8000-000000000210',b='40260000-0000-4000-8000-000000000220',c='50260000-0000-4000-8000-000000000210',d='50260000-0000-4000-8000-000000000220',n='50260000-0000-4000-8000-000000000230',req='60260000-0000-4000-8000-000000000230';
test('one active city: atomic confirmed replacement, RLS, stale rollback, retry, and legacy preservation',async()=>{
 const db=new PGlite();
 const owner=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated')};
 const replace=(refs,id=n,request=req,state={schemaVersion:6,name:'New'})=>db.query('select * from public.replace_city_v1($1::jsonb,$2,$3,$4::jsonb,$5)',[JSON.stringify(refs),id,'New',JSON.stringify(state),request]);
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;`);
 await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));await db.exec(await readFile(new URL('../supabase/migrations/202610100003_mission_campaign.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users(id) values($1),($2)',[a,b]);await db.query("insert into public.cities(id,owner_id,name,state) values($1,$2,'Old','{\"schemaVersion\":6}'),($3,$2,'Legacy second','{\"schemaVersion\":6}')",[c,a,d]);
 const sql=await readFile(new URL('../supabase/migrations/202610110001_one_active_city.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
 assert.equal((await db.query('select count(*)::int n from public.cities')).rows[0].n,2);
 await owner(a);await assert.rejects(db.query("insert into public.cities(id,owner_id,name,state) values($1,$2,'Spam','{\"schemaVersion\":6}')",[n,a]),/CITY_LIMIT/);
 await assert.rejects(replace([{id:c,revision:1}]),/CONFLICT/);assert.equal((await db.query('select count(*)::int n from public.cities')).rows[0].n,2);
 await owner(b);await assert.rejects(replace([{id:c,revision:1},{id:d,revision:1}]),/CONFLICT/);assert.equal((await db.query('select count(*)::int n from public.cities')).rows[0].n,0);await assert.rejects(db.query('select * from private.bc26_retired_campaigns'),/permission denied/);
 await owner(a);await assert.rejects(replace([{id:c,revision:2},{id:d,revision:1}]),/CONFLICT/);const refs=[{id:c,revision:1},{id:d,revision:1}];const first=await replace(refs);assert.equal(first.rows[0].id,n);assert.equal((await db.query('select count(*)::int n from public.cities')).rows[0].n,1);
 const retry=await replace(refs);assert.equal(retry.rows[0].id,n);assert.equal(retry.rows[0].revision,1);await assert.rejects(replace(refs,n,req,{schemaVersion:6,name:'changed'}),/request changed/);
 await assert.rejects(db.query("insert into public.cities(id,owner_id,name,state) values($1,$2,'Spam','{\"schemaVersion\":6}')",[c,a]),/CITY_LIMIT/);
 await assert.rejects(replace([{id:n,revision:1}],c,'60260000-0000-4000-8000-000000000231',{schemaVersion:6,progression:{campaign:{originCity:n,claims:[{id:'fake'}]}}}),/CONFLICT/);assert.equal((await db.query('select id from public.cities')).rows[0].id,n);
 // Retired canonical receipts remain owned and restore without re-paying rewards.
 await db.exec('reset role');const state={schemaVersion:6,progression:{campaign:{originCity:n,lastSaveRevision:1,claims:[{id:'bc26-main-001-a',revision:1,at:0}]}}};await db.query('insert into private.bc26_mission_checkpoints(city_id,checkpoint) values($1,$2::jsonb)',[n,JSON.stringify({state,wallMs:0})]);await db.query("insert into private.bc26_mission_claims(city_id,catalogue_id,mission_id,source_revision,signature) values($1,'bc26-main-300-v1','bc26-main-001-a',1,'verified')",[n]);
 await owner(a);const restored=await replace([{id:n,revision:1}],c,'60260000-0000-4000-8000-000000000232',state);assert.equal(restored.rows[0].id,c);await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from private.bc26_mission_claims where city_id=$1',[c])).rows[0].n,1);assert.equal((await db.query('select count(*)::int n from public.cities')).rows[0].n,1);
 }finally{await db.close()}
});
