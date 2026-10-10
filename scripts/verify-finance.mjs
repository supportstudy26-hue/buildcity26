// Dedicated disposable QA identities; passwords/tokens stay only in process memory.
import assert from 'node:assert/strict';import {randomUUID,randomBytes} from 'node:crypto';import {createClient} from '@supabase/supabase-js';
import {validateSave} from '../src/game/core.js';
const base=process.env.QA_BASE_URL,url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY;
if(!base||!url||!key||process.env.QA_ALLOW_CREATE!=='1')throw new Error('Set QA_BASE_URL, QA_ALLOW_CREATE=1, public Supabase URL/key.');
const clients=Array.from({length:4},()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(i,o)=>fetch(i,{...o,signal:AbortSignal.timeout(65000)})}}));
const [a,b,second,guest]=clients,password=randomBytes(24).toString('base64url'),tag=randomBytes(5).toString('hex');let stage='register';
async function account(action,fields){const res=await fetch(new URL('/api/account',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...fields}),signal:AbortSignal.timeout(65000)});const result=await res.json();assert.ok([200,201].includes(res.status),'account HTTP '+res.status);return result;}
try{
 const ra=await account('register',{username:'qa_fin_a_'+tag,password,cityName:'Tài chính QA A',requestId:randomUUID()}),rb=await account('register',{username:'qa_fin_b_'+tag,password,cityName:'Tài chính QA B',requestId:randomUUID()});
 assert.ifError((await a.auth.setSession(ra.session)).error);assert.ifError((await b.auth.setSession(rb.session)).error);
 const city=ra.firstCity;let row=(await a.from('cities').select('*').eq('id',city).single()).data;assert.ok(row);validateSave(row.state);
 stage='board UTC';const board=await guest.rpc('bc26_market_board');assert.ifError(board.error);const r=board.data.round,p=board.data.stocks.find(s=>s.symbol==='BCD').price;assert.equal(board.data.intervalSeconds,18000);assert.equal(board.data.nextAt,(r+1)*18000);assert.ok(board.data.draws.every(d=>d.round<r));
 const call=(client,order,rev,id=randomUUID(),round=r)=>client.rpc('bc26_finance_order',{p_city_id:city,p_revision:rev,p_request_id:id,p_order:order,p_round:round});
 stage='buy retry';const receipt=randomUUID(),buy=await call(a,{action:'buy',symbol:'BCD',quantity:3},Number(row.revision),receipt);assert.ifError(buy.error);assert.equal(buy.data.city.state.money,row.state.money-3*p-Math.ceil(3*p*.001));validateSave(buy.data.city.state);
 const retry=await call(a,{action:'buy',symbol:'BCD',quantity:3},Number(row.revision),receipt);assert.ifError(retry.error);assert.equal(retry.data.city.revision,buy.data.city.revision);row=buy.data.city;
 stage='RLS A/B';assert.equal((await b.rpc('bc26_finance_snapshot',{p_city_id:city})).error?.code,'42501');assert.equal((await call(b,{action:'sell',symbol:'BCD',quantity:1},Number(row.revision))).error?.code,'42501');assert.ok((await guest.rpc('bc26_finance_snapshot',{p_city_id:city})).error);
 stage='other device';const login=await account('login',{username:'qa_fin_a_'+tag,password});assert.ifError((await second.auth.setSession(login.session)).error);
 const read=await second.rpc('bc26_finance_snapshot',{p_city_id:city});assert.ifError(read.error);assert.equal(read.data.positions.find(p=>p.symbol==='BCD').quantity,3);
 const stale=await call(second,{action:'sell',symbol:'BCD',quantity:1},Number(row.revision)-1);console.log('Stale-order response:',stale.status,stale.error?.code,stale.error?.message?.slice(0,200));assert.equal(stale.error?.code,'PT409');
 stage='sell ticket';const sell=await call(a,{action:'sell',symbol:'BCD',quantity:1},Number(row.revision));assert.ifError(sell.error);row=sell.data.city;
 const ticketId=randomUUID(),ticket=await call(a,{action:'ticket',numbers:[1,8,16,24,32,45],quantity:2},Number(row.revision),ticketId);assert.ifError(ticket.error);assert.equal(ticket.data.result.delta,-20);row=ticket.data.city;validateSave(row.state);
 const snap=await second.rpc('bc26_finance_snapshot',{p_city_id:city});assert.ifError(snap.error);assert.equal(snap.data.tickets[0].quantity,2);assert.deepEqual(snap.data.tickets[0].numbers,[1,8,16,24,32,45]);assert.equal(snap.data.positions.find(p=>p.symbol==='BCD').quantity,2);
 stage='no early reward';const settle=await call(a,{action:'settle'},Number(row.revision));assert.ifError(settle.error);assert.equal(settle.data.result.prize,0);validateSave(settle.data.city.state);
 const mismatch=await call(a,{action:'ticket',numbers:[1,2,3,4,5,6],quantity:2},Number(row.revision)-1,ticketId);assert.equal(mismatch.error?.code,'22023');
 console.log('PASS live: server 18000s UTC cadence, buy/sell fees and journal, same receipt retry, A/B and anon isolation, second-device holdings/tickets, CAS conflict, ticket purchase and no early award.');
 console.log('QA accounts retained:', 'qa_fin_a_'+tag,'qa_fin_b_'+tag,'; no credentials logged. No production player cash changed.');
}catch(error){console.error('FAIL live stage:',stage,'code:',error.code||error.name,'assert:',error.message?.slice(0,160));process.exitCode=1;}
finally{await Promise.allSettled(clients.map(c=>c.auth.signOut({scope:'local'})));}
