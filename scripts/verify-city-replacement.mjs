// End-to-end QA on two generated accounts. Never reads an admin key or player city.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {createEmptyCity,serialize,executeCommand} from '../src/game/core.js';
const base=process.env.QA_BASE_URL,url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY;
if(!base||!url||!key||process.env.QA_ALLOW_CREATE!=='1')throw Error('Cần QA_BASE_URL, QA_ALLOW_CREATE=1 và URL/key công khai.');
const tag=randomBytes(5).toString('hex'),password=randomBytes(24).toString('base64url');
const clients=[];
async function account(label){
 const username='qa_city_'+label+'_'+tag,requestId=randomUUID();
 async function call(action){const r=await fetch(new URL('/api/account',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,username,password,cityName:'QA một thành phố '+label,requestId}),signal:AbortSignal.timeout(65000)});return {status:r.status,data:await r.json()};}
 let r=await call('register');if(r.status===503)r=await call('register');assert.equal(r.status,201);assert.ok(r.data.session?.access_token);
 const c=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(i,v)=>fetch(i,{...v,signal:AbortSignal.timeout(65000)})}});assert.ifError((await c.auth.setSession(r.data.session)).error);clients.push(c);
 const login=await call('login');assert.equal(login.status,200);
 return {c,username,password,firstCity:r.data.firstCity};
}
async function rows(c){const r=await c.from('cities').select('id,name,revision,state').order('id');assert.ifError(r.error);return r.data;}
try{
 const a=await account('a'),b=await account('b');let before=await rows(a.c);assert.equal(before.length,1);assert.equal(before[0].state.money,10000000);
 const foreign=await b.c.from('cities').select('id').eq('id',a.firstCity);assert.ifError(foreign.error);assert.deepEqual(foreign.data,[]);
 const state=serialize(createEmptyCity({name:'QA thay thành phố '+tag})),id=randomUUID(),requestId=randomUUID();
 const spam=await a.c.rpc('save_city_v2',{p_city_id:randomUUID(),p_name:state.name,p_state:state,p_expected_revision:0,p_request_id:randomUUID()});assert.equal(spam.error?.code,'PT409');assert.match(spam.error.message,/CITY_LIMIT/);
 const replace=(c,old=before,request=requestId,value=state)=>c.rpc('replace_city_v1',{p_old_cities:old.map(r=>({id:r.id,revision:Number(r.revision)})),p_city_id:id,p_name:value.name,p_state:value,p_request_id:request});
 const denied=await replace(b.c);assert.equal(denied.error?.code,'PT409');assert.equal((await rows(b.c)).length,1);
 const stale=await replace(a.c,before.map(r=>({...r,revision:Number(r.revision)+1})));assert.equal(stale.error?.code,'PT409');assert.equal((await rows(a.c))[0].id,a.firstCity);
 const result=await replace(a.c);assert.ifError(result.error);assert.equal(result.data[0].id,id);assert.equal((await rows(a.c)).length,1);
 const retry=await replace(a.c);assert.ifError(retry.error);assert.equal(retry.data[0].id,id);assert.equal(retry.data[0].revision,1);
 const changed=await replace(a.c,before,requestId,{...state,name:'Không được thay request'});assert.equal(changed.error?.code,'22023');
 const next=createEmptyCity({name:'QA bản cập nhật'});assert.equal(executeCommand(next,{id:'road',sequence:1,type:'place',payload:{kind:'road',x:4,y:18}}).ok,true);
 const saved=await a.c.rpc('save_city_v2',{p_city_id:id,p_name:next.name,p_state:serialize(next),p_expected_revision:1,p_request_id:randomUUID()});assert.ifError(saved.error);assert.equal(saved.data[0].revision,2);
 assert.equal((await rows(a.c)).length,1);assert.equal((await rows(a.c))[0].state.tiles.filter(t=>t.kind==='road').length,1);
 if(process.env.QA_CREDENTIAL_FILE)await writeFile(process.env.QA_CREDENTIAL_FILE,JSON.stringify({a:{username:a.username,password:a.password},b:{username:b.username,password:b.password}},null,2),{mode:0o600});
 console.log(JSON.stringify({result:'PASS',accounts:2,checks:['registration/login','10-billion start','one-city server limit','A/B RLS','stale replacement preserves old city','atomic replacement','exact retry','changed retry rejected','save/load after replacement'],activeCitiesEach:1,credentialsLogged:false}));
}finally{for(const c of clients)c.auth.stopAutoRefresh();}
