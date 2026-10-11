// Live QA uses public credentials only. Test account secrets exist only in memory.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {benchmarkCity} from '../src/benchmark/scenario.js';
import {serialize} from '../src/game/core.js';
import {encodeCity,decodeCity,cityBytes} from '../src/services/city-codec.js';
const base=process.env.QA_BASE_URL,url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY;
if(!base||!url||!key||process.env.QA_ALLOW_CREATE!=='1')throw new Error('Cần QA_BASE_URL, QA_ALLOW_CREATE=1 và Supabase public URL/key.');
const tag=randomBytes(5).toString('hex'),password=randomBytes(24).toString('base64url');
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(65000)})}});
const a=client(),b=client();let stage='register';
async function api(path,body,token){const r=await fetch(new URL(path,base),{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(65000)});const data=await r.json();return {status:r.status,data};}
async function register(suffix){const r=await api('/api/account',{action:'register',username:'qa_mission_'+suffix+'_'+tag,password,cityName:'QA nhiệm vụ '+suffix,requestId:randomUUID(),regionId:'31-start'});assert.equal(r.status,201);return r.data;}
try{
 const ra=await register('a');stage='authenticate A';const sa=await a.auth.setSession(ra.session);if(sa.error)throw Object.assign(new Error('Auth QA failed'),{code:sa.error.code||sa.error.status});
 stage='register B';const rb=await register('b');stage='authenticate B';const sb=await b.auth.setSession(rb.session);if(sb.error)throw Object.assign(new Error('Auth QA failed'),{code:sb.error.code||sb.error.status});
 // /api/account intentionally returns only access/refresh tokens. Resolve the
 // identity through Auth instead of assuming its response exposes session.user.
 assert.ok(sa.data.user?.id&&sb.data.user?.id&&sa.data.user.id!==sb.data.user.id);
 const token=sa.data.session.access_token,otherToken=sb.data.session.access_token;
 stage='initial city';const initial=await a.from('cities').select('*').eq('id',ra.firstCity).single();assert.ifError(initial.error);
 const request={action:'claim',cityId:ra.firstCity,revision:Number(initial.data.revision),missionId:'bc26-main-001-a'};
 stage='claim';const first=await api('/api/missions',request,token);assert.equal(first.status,200);assert.equal(first.data.applied,true);assert.equal(first.data.city.state.money,initial.data.state.money+7650);assert.equal(first.data.city.state.progression.campaign.claims.length,1);
 stage='duplicate claim';const duplicate=await api('/api/missions',request,token);assert.equal(duplicate.status,200);assert.equal(duplicate.data.applied,false);assert.equal(duplicate.data.city.state.money,first.data.city.state.money);assert.equal(duplicate.data.city.revision,first.data.city.revision);
 stage='RLS and authentication';assert.equal((await api('/api/missions',request,otherToken)).status,403);assert.equal((await api('/api/missions',request)).status,401);
 const privateRead=await a.rpc('bc26_mission_read',{p_city_id:ra.firstCity,p_owner:sa.data.user.id});assert.ok(privateRead.error);
 stage='stale revision';assert.equal((await api('/api/missions',{...request,action:'observe'},token)).status,409);
 stage='forged reward';const forged=structuredClone(first.data.city.state);forged.progression.campaign.claims.push({id:'bc26-main-001-b',at:0,revision:2});
 const spoof=await a.rpc('save_city_v2',{p_city_id:ra.firstCity,p_name:'QA giả biên nhận',p_state:forged,p_expected_revision:first.data.city.revision,p_request_id:randomUUID()});assert.ok(spoof.error);
 stage='replace with owned backup';const copyId=randomUUID(),copy=await a.rpc('replace_city_v1',{p_city_id:copyId,p_name:'QA bản sao giữ thưởng',p_state:first.data.city.state,p_old_cities:[{id:ra.firstCity,revision:Number(first.data.city.revision)}],p_request_id:randomUUID()});assert.ifError(copy.error);
 assert.ok(Array.isArray(copy.data)&&copy.data.length===1&&copy.data[0].id===copyId);
 const copyRevision=Number(copy.data[0].revision),copiedClaim=await api('/api/missions',{...request,cityId:copyId,revision:copyRevision},token);assert.equal(copiedClaim.status,200);assert.equal(copiedClaim.data.applied,false);assert.equal(copiedClaim.data.city.state.money,first.data.city.state.money);assert.equal(Number(copiedClaim.data.city.revision),copyRevision);assert.deepEqual(copiedClaim.data.city.state.progression.campaign.claims,first.data.city.state.progression.campaign.claims);
 stage='cross-owner copy spoof';const otherCity=await b.from('cities').select('id,revision').eq('id',rb.firstCity).single();assert.ifError(otherCity.error);const foreignCopyId=randomUUID(),foreignCopy=await b.rpc('replace_city_v1',{p_city_id:foreignCopyId,p_name:'QA bản sao không thuộc sở hữu',p_state:first.data.city.state,p_old_cities:[{id:rb.firstCity,revision:Number(otherCity.data.revision)}],p_request_id:randomUUID()});assert.ok(foreignCopy.error);
 const otherPreserved=await b.from('cities').select('id').eq('id',rb.firstCity);assert.ifError(otherPreserved.error);assert.equal(otherPreserved.data.length,1);
 const foreignRead=await b.from('cities').select('id').eq('id',foreignCopyId);assert.ifError(foreignRead.error);assert.equal(foreignRead.data.length,0);
 stage='5000-resident cloud save';const raw=serialize(benchmarkCity(5000)),packed=encodeCity(raw),denseId=randomUUID();assert.ok(cityBytes(packed)<2000000);
 const saved=await a.rpc('replace_city_v1',{p_city_id:denseId,p_name:'QA 5000 cư dân',p_state:packed,p_old_cities:[{id:copyId,revision:copyRevision}],p_request_id:randomUUID()});assert.ifError(saved.error);
 const loaded=await a.from('cities').select('state').eq('id',denseId).single();assert.ifError(loaded.error);assert.deepEqual(decodeCity(loaded.data.state),raw);
 console.log(JSON.stringify({result:'PASS',claimOnce:true,copiedSaveCannotReclaim:true,crossOwnerCopyRejected:true,rlsTwoAccounts:true,forgedClaimRejected:true,cloudSavePopulation:5000,rawBytes:cityBytes(raw),cloudBytes:cityBytes(packed),testUsers:['qa_mission_a_'+tag,'qa_mission_b_'+tag]},null,2));
}catch(error){
 // Never serialize SDK errors, responses or assertion object payloads: future
 // QA assertions could otherwise print tokens or an entire multi-MB city.
 const scalar=value=>typeof value==='number'||typeof value==='boolean'?value:undefined;
 console.error(JSON.stringify({result:'FAIL',stage,code:error.code||error.name,operator:error.operator,actual:scalar(error.actual),expected:scalar(error.expected)}));process.exitCode=1;
}
finally{await Promise.allSettled([a.auth.signOut({scope:'local'}),b.auth.signOut({scope:'local'})]);}
