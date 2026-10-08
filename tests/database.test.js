import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('SQL schema/migration execute in PostgreSQL and RLS isolates two authenticated identities',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key,aud text,role text,email text);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;`);
    const schema=await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8');
    await db.exec(schema);
    const migration=await readFile(new URL('../supabase/migrations/202610070001_reliable_saves.sql',import.meta.url),'utf8');
    await db.exec(migration); // re-running is safe
    await db.exec(await readFile(new URL('../supabase/migrations/202610080002_simulation_foundation.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610080003_terrain_saves.sql',import.meta.url),'utf8'));
    const results=await db.exec(await readFile(new URL('../supabase/tests/rls.sql',import.meta.url),'utf8'));
    assert.ok(results.some(result=>result.rows.some(row=>String(row.result).startsWith('PASS:'))));
    const {rows}=await db.query('select count(*)::integer as count from auth.users');assert.equal(rows[0].count,0);
    await db.exec("insert into auth.users(id) values('40260000-0000-4000-8000-000000000010');");
    await db.exec("set role authenticated; select set_config('request.jwt.claim.sub','40260000-0000-4000-8000-000000000010',false);");
    const modern=await db.query("select * from public.save_city_v2('50260000-0000-4000-8000-000000000012','Nền mô phỏng','{\"schemaVersion\":4}',0,'60260000-0000-4000-8000-000000000012')");assert.equal(modern.rows[0].revision,1);
    const retry=await db.query("select * from public.save_city_v2('50260000-0000-4000-8000-000000000012','Nền mô phỏng','{\"schemaVersion\":4}',0,'60260000-0000-4000-8000-000000000012')");assert.equal(retry.rows[0].revision,1);
    const old=await db.query("select * from public.save_city('50260000-0000-4000-8000-000000000011','Bản cũ','{\"schemaVersion\":1}',0)");assert.equal(old.rows[0].revision,1);
    await db.exec('reset role');await db.exec(migration);
    const preserved=await db.query("select name,revision from public.cities where id='50260000-0000-4000-8000-000000000011'");assert.equal(preserved.rows[0].name,'Bản cũ');assert.equal(preserved.rows[0].revision,1);
  }finally{await db.close();}
});
