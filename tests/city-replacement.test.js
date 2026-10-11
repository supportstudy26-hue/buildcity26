import test from 'node:test';
import assert from 'node:assert/strict';
import {CityReplacement} from '../src/services/city-replacement.js';
const storage=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
test('lost replacement response retries exact ID, state and request after reload; no duplicate starting grant',async()=>{
 const s=storage(),calls=[];let seq=0;const first=new CityReplacement({storage:s,uuid:()=>`id-${++seq}`,send:async r=>{calls.push(r);throw new Error('Network')}});
 const input={oldCities:[{id:'old',revision:3}],state:{name:'New',money:10000000}};
 await assert.rejects(first.replace('A',input,()=>assert.fail()));assert.ok(first.pending('A'));assert.equal(first.pending('B'),null);
 const next=new CityReplacement({storage:s,send:async r=>{calls.push(r);return{id:r.id,revision:1,state:r.state}}});let applied=0;
 await next.replace('A',{oldCities:[],state:{name:'Different'}},row=>{applied++;assert.equal(row.state.money,10000000)});
 assert.deepEqual(calls[0],calls[1]);assert.equal(applied,1);assert.equal(next.pending('A'),null);
});
test('no request is sent before durable persistence; double clicks make one replacement',async()=>{
 let sent=0;const q=new CityReplacement({storage:{getItem:()=>null,setItem:()=>{throw new Error('Disk full')}},send:()=>sent++});await assert.rejects(q.replace('A',{oldCities:[],state:{name:'X'}},()=>{}));assert.equal(sent,0);
 let resolve;const r=new CityReplacement({storage:storage(),send:request=>{sent++;return new Promise(done=>{resolve=()=>done({id:request.id,revision:1})})}});const p=r.replace('A',{oldCities:[],state:{name:'X'}},()=>{});await assert.rejects(r.replace('A',{oldCities:[],state:{name:'X'}},()=>{}),/Đang thay/);resolve();await p;assert.equal(sent,1);
});
test('definite stale-city rejection releases the request for a new player confirmation',async()=>{
 const s=storage(),calls=[];let sequence=0;
 const q=new CityReplacement({storage:s,uuid:()=>`request-${++sequence}`,send:async request=>{calls.push(request);if(calls.length===1)throw {code:'PT409',message:'BC26_CONFLICT: old city list changed'};return {id:request.id,revision:1,state:request.state};}});
 await assert.rejects(q.replace('A',{oldCities:[{id:'old',revision:2}],state:{name:'New'}},()=>{}));assert.equal(q.pending('A'),null);
 await q.replace('A',{oldCities:[{id:'old',revision:3}],state:{name:'Reviewed new city'}},()=>{});
 assert.notEqual(calls[0].requestId,calls[1].requestId);assert.equal(calls[1].oldCities[0].revision,3);assert.equal(calls[1].name,'Reviewed new city');
});
