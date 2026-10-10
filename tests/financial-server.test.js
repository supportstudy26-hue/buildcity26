import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createEmptyCity,serialize,validateSave} from '../src/game/core.js';

test('Financial server: real UTC rounds, atomic cash, retries, owner isolation and one-time lottery payout',async()=>{
 const db=new PGlite(),a='40260000-0000-4000-8000-000000000010',b='40260000-0000-4000-8000-000000000020',city='50260000-0000-4000-8000-000000000010';
 let sequence=0;
 const uuid=()=>`60260000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`;
 const as=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
 const order=async(action,revision,round,id=uuid())=>(await db.query('select public.bc26_finance_order($1,$2,$3,$4::jsonb,$5) as result',[city,revision,id,JSON.stringify(action),round])).rows[0].result;
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
  create table auth.users(id uuid primary key,aud text,role text,email text);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
  grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
  const migration=await readFile(new URL('../supabase/migrations/202610100001_financial_game.sql',import.meta.url),'utf8');
  await db.exec(migration);const seed=(await db.query('select seed from private.bc26_market_seed')).rows[0].seed;
  await db.exec(migration);assert.equal((await db.query('select seed from private.bc26_market_seed')).rows[0].seed,seed);
  await db.query('insert into auth.users(id) values($1),($2)',[a,b]);await as(a);
  const state=serialize(createEmptyCity());
  await db.query('select * from public.save_city_v2($1,$2,$3::jsonb,0,$4)',[city,'Tài chính QA',JSON.stringify(state),uuid()]);
  const board=(await db.query('select public.bc26_market_board() as board')).rows[0].board,r=board.round,p=board.stocks.find(s=>s.symbol==='BCD').price;
  assert.equal(board.intervalSeconds,18000);assert.equal(board.nextAt,(r+1)*18000);assert.equal(Math.floor(board.serverSeconds/18000),r);
  assert.equal(board.stocks.length,6);assert.equal(board.stocks[0].series.length,12);assert.ok(board.draws.every(d=>d.round<r&&d.numbers.length===6&&new Set(d.numbers).size===6));
  const id=uuid(),buy=await order({action:'buy',symbol:'BCD',quantity:10},1,r,id);
  assert.equal(buy.city.revision,2);assert.equal(buy.city.state.money,state.money-10*p-Math.ceil(10*p*.001));validateSave(buy.city.state);
  assert.equal((await order({action:'buy',symbol:'BCD',quantity:10},1,r,id)).city.revision,2);
  await assert.rejects(order({action:'buy',symbol:'BCD',quantity:11},1,r,id),/RECEIPT/);
  await assert.rejects(order({action:'sell',symbol:'BCD',quantity:1},1,r),/CONFLICT/);
  await assert.rejects(order({action:'buy',symbol:'BCD',quantity:1},2,r-1),/QUOTE_EXPIRED/);
  await assert.rejects(order({action:'sell',symbol:'BCD',quantity:11},2,r),/HOLDING/);
  await assert.rejects(order({},2,r),/INPUT/);
  await assert.rejects(order({action:'ticket',numbers:[1,1,2,3,4,5]},2,r),/NUMBERS/);
  await assert.rejects(order({action:'ticket'},2,r),/NUMBERS/);
  const sell=await order({action:'sell',symbol:'BCD',quantity:5},2,r);assert.equal(sell.city.revision,3);validateSave(sell.city.state);
  const ticket=await order({action:'ticket',numbers:[45,3,20,8,10,1],quantity:2},3,r);assert.equal(ticket.result.delta,-20);assert.deepEqual(ticket.result.numbers,[1,3,8,10,20,45]);assert.equal(ticket.city.revision,4);
  const snap=(await db.query('select public.bc26_finance_snapshot($1) as data',[city])).rows[0].data;assert.equal(snap.positions[0].quantity,5);assert.equal(snap.tickets.length,1);
  await as(b);await assert.rejects(db.query('select public.bc26_finance_snapshot($1)',[city]),/OWNER/);await assert.rejects(order({action:'sell',symbol:'BCD',quantity:1},4,r),/OWNER/);
  await assert.rejects(db.query('select * from private.bc26_market_seed'),/permission/);await assert.rejects(db.query('select private.bc26_draw($1)',[r]),/permission/);
  // Test-only admin fixture: a fully matched past ticket; public clients cannot access the seed or insert it.
  await db.exec('reset role');await db.query('insert into private.bc26_lottery values($1,$2,$3,private.bc26_draw($3),1,false,null,null)',[uuid(),city,r-1]);await as(a);
  const claimId=uuid(),claim=await order({action:'settle'},4,r,claimId);assert.equal(claim.result.prize,10000000);validateSave(claim.city.state);
  assert.equal((await order({action:'settle'},4,r,claimId)).city.state.money,claim.city.state.money);
  const again=await order({action:'settle'},5,r);assert.equal(again.result.prize,0);assert.equal(again.city.state.money,claim.city.state.money);
  // Even 8× playback and arbitrary simulation timestamps leave the UTC round unchanged.
  await db.exec('reset role');await db.query("update public.cities set state=jsonb_set(state,'{clock,seconds}','18000000') where id=$1",[city]);await as(a);
  assert.equal((await db.query('select public.bc26_market_board() as board')).rows[0].board.round,r);
  await db.exec('reset role;set role anon');await assert.rejects(db.query('select public.bc26_finance_snapshot($1)',[city]),/permission/);
  assert.equal((await db.query('select public.bc26_market_board() as board')).rows[0].board.intervalSeconds,18000);
 }finally{await db.close();}
});
