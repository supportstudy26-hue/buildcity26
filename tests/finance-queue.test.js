import test from 'node:test';import assert from 'node:assert/strict';
import {FinanceQueue} from '../src/services/finance-queue.js';
const storage=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
test('Lost financial response survives reload, replays exact receipt and never writes another city',async()=>{
 const mem=storage();let requests=[],applied=0;
 const context={owner:'A',city:'city-A',revision:7,order:{action:'buy',symbol:'BCD',quantity:5},round:99,apply:()=>applied++};
 const first=new FinanceQueue({storage:mem,uuid:()=> 'receipt-1',send:async r=>{requests.push(r);throw new Error('Network lost after commit');}});
 await assert.rejects(first.transact(context),/Network/);assert.equal(first.pending('A','city-A').requestId,'receipt-1');assert.equal(first.pending('B','city-A'),null);
 const next=new FinanceQueue({storage:mem,send:async r=>{requests.push(r);return{city:{id:'city-A',revision:8},result:{delta:-100},replayed:true};}});
 await next.transact({...context,revision:100,order:{action:'sell'},round:101});assert.deepEqual(requests[0],requests[1]);assert.equal(applied,1);assert.equal(next.pending('A','city-A'),null);
});
test('CAS rejection clears rolled-back request; advanced server revision preserves local progress',async()=>{
 const mem=storage(),ctx={owner:'A',city:'C',revision:7,order:{action:'ticket'},round:5,apply:()=>assert.fail('Do not replace newer progress')};
 const q=new FinanceQueue({storage:mem,uuid:()=> 'r',send:async()=>({city:{id:'C',revision:9},result:{delta:-10}})});
 await assert.rejects(q.transact(ctx),/CONFLICT/);assert.equal(q.pending('A','C'),null);
 q.send=async()=>{throw Object.assign(new Error('BC26_QUOTE_EXPIRED'),{code:'22023'});};await assert.rejects(q.transact(ctx));assert.equal(q.pending('A','C'),null);
});
test('Storage failure prevents sending a financial order',async()=>{
 const q=new FinanceQueue({storage:{getItem:()=>null,setItem:()=>{throw new Error('Disk full');}},send:()=>assert.fail('Request must be persisted first')});
 await assert.rejects(q.transact({owner:'A',city:'C',revision:1,order:{action:'buy'},round:4}),/Disk/);
});
