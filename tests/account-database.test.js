import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('PostgreSQL username reservation, orphan retry, one first city, private mapping, code race and session revocation',async()=>{
  const db=new PGlite();const a='aa260000-0000-4000-8000-000000000001',b='bb260000-0000-4000-8000-000000000001',city='cc260000-0000-4000-8000-000000000001',claim='dd260000-0000-4000-8000-000000000001';
  const hash='a'.repeat(64),code='b'.repeat(64);
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
      create table auth.users(id uuid primary key,email text);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
      grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid(),auth.jwt() to anon,authenticated;`);
    await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
    // A retry cannot change the initial geography, nor can client roles invoke the reservation.
    const geoCity='ee260000-0000-4000-8000-000000000001';
    const geoReserve=region=>db.query("select public.bc26_account_reserve_region('geo_mayor',$1,'Thành phố Việt Nam','ff260000-0000-4000-8000-000000000001@accounts.buildcity26.invalid',$2,$3) as a",['9'.repeat(64),geoCity,region]);
    assert.equal((await geoReserve('48-start')).rows[0].a.start_region_id,'48-start');
    assert.equal((await geoReserve('56-start')).rows[0].a.start_region_id,'48-start');
    const geoUser='ff260000-0000-4000-8000-000000000001';await db.query('insert into auth.users values($1,$2)',[geoUser,'ff260000-0000-4000-8000-000000000001@accounts.buildcity26.invalid']);
    const geoFinish=region=>db.query("select public.bc26_account_finish('geo_mayor',$1,$2,$3,$4)",['9'.repeat(64),geoUser,JSON.stringify({schemaVersion:6,name:'Thành phố Việt Nam',world:{geography:{regionId:region}}}),code]);
    await assert.rejects(geoFinish('56-start'),/Invalid starting geography/);await geoFinish('48-start');await geoFinish('48-start');
    assert.equal((await db.query('select count(*)::int as n from public.cities where id=$1',[geoCity])).rows[0].n,1);
    await db.exec('set role authenticated');await assert.rejects(geoReserve('48-start'),/permission denied/);await db.exec('reset role');
    const reserve=()=>db.query(`select public.bc26_account_reserve('mayor',$1,'Đà Nẵng','aa260000-0000-4000-8000-000000000001@accounts.buildcity26.invalid',$2) as a`,[hash,city]);
    await reserve();await reserve();assert.equal((await db.query('select count(*)::int as n from private.bc26_accounts')).rows[0].n,2);
    await assert.rejects(db.query(`select public.bc26_account_reserve('mayor',$1,'Other','bb260000-0000-4000-8000-000000000001@accounts.buildcity26.invalid',$2)`,['c'.repeat(64),city]),/BC26_TAKEN/);
    await db.query('insert into auth.users(id,email) values($1,$2),($3,$4)',[a,'aa260000-0000-4000-8000-000000000001@accounts.buildcity26.invalid',b,'legacy@example.test']);
    const orphan=await db.query("select public.bc26_account_orphan('mayor',$1) as id",[hash]);assert.equal(orphan.rows[0].id,a);
    const finish=()=>db.query(`select public.bc26_account_finish('mayor',$1,$2,'{"schemaVersion":6,"name":"Đà Nẵng"}',$3)`,[hash,a,code]);await finish();await finish();assert.equal((await db.query('select count(*)::int as n from public.cities')).rows[0].n,2);
    await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${b}',false);`);
    assert.equal((await db.query('select * from public.cities')).rows.length,0);assert.equal((await db.query('select * from public.profiles')).rows.length,0);
    await assert.rejects(db.query("select public.bc26_account_lookup('mayor')"),/permission denied/);await assert.rejects(db.query('select * from private.bc26_accounts'),/permission denied/);
    await db.exec(`select set_config('request.jwt.claim.sub','${a}',false);select set_config('request.jwt.claims','{"iat":1}',false);`);assert.equal((await db.query('select * from public.cities')).rows.length,1);
    await db.exec('reset role');const begin=await db.query("select public.bc26_recovery_begin('mayor',$1,$2) as ok",[code,claim]);assert.equal(begin.rows[0].ok,true);
    assert.equal((await db.query("select public.bc26_recovery_begin('mayor',$1,gen_random_uuid()) as ok",[code])).rows[0].ok,false);
    await db.exec('set role authenticated');assert.equal((await db.query('select * from public.cities')).rows.length,0);await db.exec('reset role');
    await db.query("select public.bc26_recovery_finish('mayor',$1,$2)",[claim,'c'.repeat(64)]);
    assert.equal((await db.query("select public.bc26_recovery_begin('mayor',$1,gen_random_uuid()) as ok",[code])).rows[0].ok,false);
    await db.exec('set role authenticated');assert.equal((await db.query('select * from public.cities')).rows.length,0);
    await db.exec(`select set_config('request.jwt.claims','{"iat":9999999999}',false)`);assert.equal((await db.query('select * from public.cities')).rows.length,1);await db.exec('reset role');
    // Rotate a lost code through the restricted server RPC; an old code never works again.
    await db.query('select public.bc26_account_codes($1,$2)',[a,'e'.repeat(64)]);
    assert.equal((await db.query("select public.bc26_recovery_begin('mayor',$1,gen_random_uuid()) as ok",['c'.repeat(64)])).rows[0].ok,false);
    await db.exec('set role authenticated');await assert.rejects(db.query('select public.bc26_account_codes($1,$2)',[a,'f'.repeat(64)]),/permission denied/);await db.exec('reset role');
    // Existing email owner can claim a username without replacing any old city.
    await db.query("select public.bc26_account_claim('legacy',$1,$2)",[b,'d'.repeat(64)]);assert.equal((await db.query('select count(*)::int as n from public.cities')).rows[0].n,2);
    for(let i=0;i<8;i++)assert.equal((await db.query("select public.bc26_account_rate('recover',$1,$2) as ok",[hash,code])).rows[0].ok,true);
    assert.equal((await db.query("select public.bc26_account_rate('recover',$1,$2) as ok",[hash,code])).rows[0].ok,false);
  }finally{await db.close();}
});
