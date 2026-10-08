import test from 'node:test';
import assert from 'node:assert/strict';
import {accountFields} from '../src/services/account-validation.js';
import {accountForm} from '../src/ui/account-form.js';
import {accountHandler} from '../server/accounts.js';
const requestId='bba60000-0000-4000-8000-000000000001';
test('registration is exactly three fields, login two, and normalization never changes passwords',()=>{
  assert.equal((accountForm('register').match(/<input /g)||[]).length,3);assert.equal((accountForm('login').match(/<input /g)||[]).length,2);
  const data=accountFields('register',{username:' Mayor_26 ',cityName:' Thành phố Đà Nẵng ',password:' Mixed Password ',requestId});
  assert.equal(data.username,'mayor_26');assert.equal(data.cityName,'Thành phố Đà Nẵng');assert.equal(data.password,' Mixed Password ');
  for(const username of ['ab','tài_khoản','a-b','a'.repeat(25)])assert.throws(()=>accountFields('login',{username,password:'abc'}));
  assert.throws(()=>accountFields('register',{...data,cityName:'a'.repeat(37)}));assert.throws(()=>accountFields('recover',{username:'mayor',password:'12345678',code:'invalid'}));
});
function harness({orphan=false,rate=true,updateError=false,finishError=false,wrongOwner=false,wrongPassword=false}={}){
  const calls=[],stored={username:'mayor',identity_email:'random@accounts.buildcity26.invalid',first_city_id:requestId,city_name:'Đà Nẵng',status:'pending',user_id:null,revoked_after:0};
  const session={access_token:'qa-access',refresh_token:'qa-refresh',user:{id:'qa-user'}};
  const admin={rpc:async(name,args)=>{
    calls.push({name,args});
    if(name==='bc26_account_rate')return {data:rate};
    if(name==='bc26_account_reserve')return {data:{...stored}};
    if(name==='bc26_account_orphan')return {data:orphan?'qa-user':null};
    if(name==='bc26_account_finish'){if(finishError)return {error:{message:'outage'}};stored.status='ready';stored.user_id='qa-user';return {data:null};}
    if(name==='bc26_account_lookup')return {data:{...stored,user_id:'qa-user',status:'ready'}};
    if(name==='bc26_recovery_begin')return {data:true};
    return {data:null};
  },auth:{admin:{createUser:async args=>{calls.push({name:'createUser',args});return orphan?{error:{message:'existing'}}:{data:{user:{id:'qa-user'}}};},updateUserById:async(id,args)=>{calls.push({name:'updateUserById',args});return {error:updateError?{message:'outage'}:null};},signOut:async()=>({error:null})}}};
  const auth={auth:{signInWithPassword:async args=>{calls.push({name:'signInWithPassword',args});return wrongPassword?{data:{},error:{message:'invalid'}}:{data:{session},error:null};},getUser:async()=>({data:{user:{id:wrongOwner?'other-user':'qa-user',email:'legacy@example.test'}}})}};
  const handler=accountHandler({env:{NODE_ENV:'production'},makeClients:()=>({admin,auth,key:'test-secret-never-browser'}),sleep:async()=>{}});
  async function invoke(body,extra={}){const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};await handler({method:'POST',headers:{host:'game.test',origin:'https://game.test','content-type':'application/json'},socket:{remoteAddress:'127.0.0.1'},body,...extra},res);return res;}
  return {invoke,calls,stored};
}
test('server commits first city once, authenticates adopted orphan, returns only player tokens and no identity',async()=>{
  const h=harness({orphan:true}),input={action:'register',username:'mayor',password:' Secret Spaces ',cityName:'Đà Nẵng',requestId};
  const r=await h.invoke(input);assert.equal(r.code,201);assert.equal(r.data.recoveryCode.length,48);assert.equal(r.data.firstCity,requestId);assert.equal(r.data.identity_email,undefined);assert.equal(r.headers['Cache-Control'],'no-store, private');
  const auth=h.calls.find(c=>c.name==='signInWithPassword');assert.equal(auth.args.password,' Secret Spaces ');
  const finish=h.calls.find(c=>c.name==='bc26_account_finish');assert.equal(finish.args.p_state.name,'Đà Nẵng');assert.equal(finish.args.p_code_hash.length,64);assert.notEqual(finish.args.p_code_hash,r.data.recoveryCode);
  const retry=await h.invoke(input);assert.equal(retry.data.recoveryCode,r.data.recoveryCode);assert.equal(h.stored.user_id,'qa-user');
});
test('origin, method, oversized input and shared rate limits reject requests before user creation',async()=>{
  const h=harness();assert.equal((await h.invoke({}, {method:'GET'})).code,405);
  assert.equal((await h.invoke({}, {headers:{origin:'https://attacker.test',host:'game.test'}})).code,403);
  assert.equal((await h.invoke({action:'login',username:'mayor',password:'x'.repeat(9000)})).code,400);
  const limited=harness({rate:false}),r=await limited.invoke({action:'register',username:'mayor',password:'12345678',cityName:'City',requestId});assert.equal(r.code,429);assert.ok(!limited.calls.some(c=>c.name==='createUser'));
});
test('failed first-city commit is retried without exposing server errors; failed recovery releases only its own claim',async()=>{
  const h=harness({finishError:true}),r=await h.invoke({action:'register',username:'mayor',password:'12345678',cityName:'Đà Nẵng',requestId});assert.equal(r.code,503);assert.ok(!JSON.stringify(r.data).includes('outage'));
  const recovery=harness({updateError:true}),rr=await recovery.invoke({action:'recover',username:'mayor',password:'12345678',code:'A'.repeat(48)});assert.equal(rr.code,503);assert.ok(recovery.calls.some(c=>c.name==='bc26_recovery_release'));assert.ok(!recovery.calls.some(c=>c.name==='bc26_recovery_finish'));
});

test('replacing a lost recovery code requires both a valid owner JWT and password, and a later registration cannot replay an old code',async()=>{
  const payload={action:'codes',username:'mayor',password:'12345678'};
  const h=harness();assert.equal((await h.invoke(payload)).code,401);
  const headers={host:'game.test',origin:'https://game.test','content-type':'application/json',authorization:'Bearer qa-access'};
  const r=await h.invoke(payload,{headers});assert.equal(r.code,200);assert.equal(r.data.recoveryCode.length,48);
  assert.ok(h.calls.some(c=>c.name==='signInWithPassword'));assert.ok(h.calls.some(c=>c.name==='bc26_account_codes'));
  const other=harness({wrongOwner:true});assert.equal((await other.invoke(payload,{headers})).code,401);assert.ok(!other.calls.some(c=>c.name==='bc26_account_codes'));
  const wrong=harness({wrongPassword:true});assert.equal((await wrong.invoke(payload,{headers})).code,401);assert.ok(!wrong.calls.some(c=>c.name==='bc26_account_codes'));
  h.stored.status='ready';h.stored.user_id='qa-user';h.stored.recovery_generation=1;
  const retry=await h.invoke({action:'register',username:'mayor',password:'12345678',cityName:'Đà Nẵng',requestId});assert.equal(retry.code,200);assert.equal(retry.data.recoveryCode,undefined);
  assert.equal((await h.invoke('{',{headers})).code,400);
});
