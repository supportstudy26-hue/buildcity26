// Disposable QA account only; public key + user JWT, no admin credential.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createCity,executeCommand,stepSimulation,serialize,validateSave} from '../src/game/core.js';
import {decodeCity,encodeCity} from '../src/services/city-codec.js';
import {educationSnapshot} from '../src/game/systems/education.js';
import {campaign} from '../src/game/systems/campaign.js';
import {metricKey} from '../src/game/systems/mission-metrics.js';
const base=process.env.QA_BASE_URL,url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY;
if(!base||!url||!key||process.env.QA_ALLOW_CREATE!=='1')throw new Error('Cần QA_BASE_URL, QA_ALLOW_CREATE=1 và Supabase public URL/key.');
const username='qa_education_'+randomBytes(5).toString('hex'),password=randomBytes(24).toString('base64url');
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(65000)})}});
const a=client(),b=client();let stage='register';
async function api(action,fields){const r=await fetch(new URL('/api/account',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...fields}),signal:AbortSignal.timeout(65000)});const data=await r.json();assert.equal(r.status,action==='register'?201:200);return data;}
async function load(c,id){const r=await c.from('cities').select('state,revision').eq('id',id).single();assert.ifError(r.error);return r.data;}
async function save(id,revision,state,requestId=randomUUID()){const r=await a.rpc('save_city_v2',{p_city_id:id,p_name:'QA giáo dục',p_state:encodeCity(state),p_expected_revision:revision,p_request_id:requestId});assert.ifError(r.error);return Number(r.data[0].revision);}
try{
 const registered=await api('register',{username,password,cityName:'QA giáo dục',requestId:randomUUID()});assert.ifError((await a.auth.setSession(registered.session)).error);
 const initial=await load(a,registered.firstCity),s=createCity();
 assert.ok(executeCommand(s,{id:'edu-secondary',sequence:s.commandSequence+1,type:'place',payload:{x:10,y:13,kind:'secondarySchool'}}).ok);
 s.clock.seconds=s.clock.step=7*3600+29*60;
 for(let n=0;n<90;n++)stepSimulation(s);
 assert.ok(s.citizens.some(c=>c.journey&&c.missionTrip?.purpose==='school'));
 stage='save during school trip';let revision=await save(registered.firstCity,Number(initial.revision),serialize(s));
 stage='login second device';const login=await api('login',{username,password});assert.ifError((await b.auth.setSession(login.session)).error);
 const walking=await load(b,registered.firstCity);assert.equal(Number(walking.revision),revision);assert.deepEqual(decodeCity(walking.state),serialize(s));
 const restored=validateSave(walking.state);for(let n=0;n<2000;n++){stepSimulation(s);stepSimulation(restored);}
 assert.deepEqual(serialize(restored),serialize(s));const counterKey=metricKey({metric:'completed_jobs',filters:{service:'school_attendance'}}),attendance=campaign(s).counters[counterKey];assert.ok(attendance>=10);assert.equal(educationSnapshot(s).accessPct,100);
 stage='save learning progress';const requestId=randomUUID(),state=serialize(s),oldRevision=revision;revision=await save(registered.firstCity,oldRevision,state,requestId);
 stage='retry same write';assert.equal(await save(registered.firstCity,oldRevision,state,requestId),revision);
 stage='load lessons second device';const lessons=await load(b,registered.firstCity);assert.deepEqual(decodeCity(lessons.state),state);const reopened=validateSave(lessons.state),before=campaign(reopened).counters[counterKey];for(let n=0;n<90;n++)stepSimulation(reopened);assert.equal(campaign(reopened).counters[counterKey],before);
 stage='stale save preserves progress';const stale=await b.rpc('save_city_v2',{p_city_id:registered.firstCity,p_name:'QA stale',p_state:walking.state,p_expected_revision:oldRevision,p_request_id:randomUUID()});assert.equal(stale.error?.code,'PT409');assert.equal(Number((await load(b,registered.firstCity)).revision),revision);
 console.log(JSON.stringify({result:'PASS',testUser:username,schoolTripCloudRoundTrip:true,secondDevice:true,attendance,learningProgressCloudRoundTrip:true,retryOnce:true,noDuplicateAttendance:true,staleRejected:true,cityCount:1},null,2));
}catch(error){console.error(JSON.stringify({result:'FAIL',stage,code:error.code||error.name,operator:error.operator}));process.exitCode=1;}
finally{await Promise.allSettled([a.auth.signOut({scope:'local'}),b.auth.signOut({scope:'local'})]);}
