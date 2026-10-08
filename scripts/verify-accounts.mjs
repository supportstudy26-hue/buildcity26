// Real username API + Supabase JWT/RLS QA. Generated credentials stay in memory.
// Requires an explicitly chosen deployment; never uses an admin key.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createCity,serialize} from '../src/game/core.js';
const base=process.env.QA_BASE_URL,url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY;
if(!base||!url||!key||process.env.QA_ALLOW_CREATE!=='1'){console.error('Cần QA_BASE_URL, QA_ALLOW_CREATE=1 và URL/key công khai. Script tạo hai tài khoản QA riêng; không dùng admin key.');process.exit(1);}
const tag=randomBytes(5).toString('hex'),password=randomBytes(24).toString('base64url'),newPassword=randomBytes(24).toString('base64url');
const usernameA='qa_a_'+tag,usernameB='qa_b_'+tag,requestId=randomUUID();
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const a=client(),b=client(),other=client(),guest=client();
async function api(action,fields={},token){
 const res=await fetch(new URL('/api/account',base),{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({action,...fields}),signal:AbortSignal.timeout(65000)});
 const data=await res.json();return {status:res.status,data};
}
async function session(c,data){assert.ok(data.session?.access_token);const r=await c.auth.setSession(data.session);assert.ifError(r.error);return r.data.session;}
const payload=serialize(createCity());
async function save(c,id,rev,name,request=randomUUID()){const r=await c.rpc('save_city_v2',{p_city_id:id,p_name:name,p_state:payload,p_expected_revision:rev,p_request_id:request});assert.ifError(r.error);return r.data[0];}
try{
 const fieldsA={username:usernameA.toUpperCase(),password,cityName:'Thành phố kiểm tra A',requestId};
 const regA=await api('register',fieldsA);assert.equal(regA.status,201);assert.equal(regA.data.recoveryCode.length,48);assert.ok(!regA.data.identity_email);
 const sa=await session(a,regA.data),regB=await api('register',{username:usernameB,password,cityName:'Thành phố kiểm tra B',requestId:randomUUID()});assert.equal(regB.status,201);const sb=await session(b,regB.data);assert.notEqual(sa.user.id,sb.user.id);
 const retry=await api('register',fieldsA);assert.ok([200,201].includes(retry.status));assert.equal(retry.data.firstCity,regA.data.firstCity);assert.equal(retry.data.recoveryCode,regA.data.recoveryCode);
 const duplicate=await api('register',{...fieldsA,requestId:randomUUID()});assert.equal(duplicate.status,409);
 assert.equal((await api('login',{username:usernameA,password:'wrong password'})).status,401);
 const profile=await a.from('profiles').select('username');assert.ifError(profile.error);assert.deepEqual(profile.data.map(p=>p.username),[usernameA]);
 const hidden=await b.from('cities').select('id').eq('id',regA.data.firstCity);assert.ifError(hidden.error);assert.deepEqual(hidden.data,[]);
 const privateRpc=await a.rpc('bc26_account_lookup',{p_username:usernameB});assert.ok(privateRpc.error);
 const own=await a.from('cities').select('id').eq('id',regA.data.firstCity);assert.ifError(own.error);assert.equal(own.data.length,1);
 const id=randomUUID(),req=randomUUID();let row=await save(a,id,0,'BC26 QA A',req);assert.equal(row.revision,1);assert.equal((await save(a,id,0,'BC26 QA A',req)).revision,1);
 const upd=await b.from('cities').update({name:'Không được sửa'}).eq('id',id).select('id');assert.ifError(upd.error);assert.deepEqual(upd.data,[]);
 const spoof=await b.from('cities').insert({id:randomUUID(),owner_id:sa.user.id,name:'Owner giả',state:payload});assert.ok(spoof.error);
 const crossSave=await b.rpc('save_city_v2',{p_city_id:id,p_name:'Không được lưu',p_state:payload,p_expected_revision:1,p_request_id:randomUUID()});assert.ok(crossSave.error);
 const crossDelete=await b.rpc('delete_city_v2',{p_city_id:id,p_expected_revision:1});assert.ok(crossDelete.error);
 const anon=await guest.from('cities').select('id').eq('id',id);assert.ok(anon.error);
 const secondLogin=await api('login',{username:usernameA,password});assert.equal(secondLogin.status,200);await session(other,secondLogin.data);
 row=await save(a,id,1,'BC26 QA A cập nhật');assert.equal(row.revision,2);
 const load=await other.from('cities').select('revision,state').eq('id',id).single();assert.ifError(load.error);assert.equal(load.data.revision,2);assert.deepEqual(load.data.state,payload);
 const stale=await other.rpc('save_city_v2',{p_city_id:id,p_name:'Thiết bị cũ',p_state:payload,p_expected_revision:1,p_request_id:randomUUID()});assert.equal(stale.error?.code,'40001');
 assert.equal((await api('recover',{username:usernameA,password:newPassword,code:'F'.repeat(48)})).status,401);
 const recovered=await api('recover',{username:usernameA,password:newPassword,code:regA.data.recoveryCode});assert.equal(recovered.status,200);assert.equal(recovered.data.recoveryCode.length,48);assert.notEqual(recovered.data.recoveryCode,regA.data.recoveryCode);
 const revoked=await a.from('cities').select('id').eq('id',id);assert.ifError(revoked.error);assert.deepEqual(revoked.data,[]);
 const oldRefresh=await other.auth.refreshSession({refresh_token:secondLogin.data.session.refresh_token});assert.ok(oldRefresh.error);
 assert.equal((await api('login',{username:usernameA,password})).status,401);
 assert.equal((await api('recover',{username:usernameA,password:newPassword,code:regA.data.recoveryCode})).status,401);
 const fresh=await api('login',{username:usernameA,password:newPassword});assert.equal(fresh.status,200);await session(a,fresh.data);
 const rotated=await api('codes',{username:usernameA,password:newPassword},fresh.data.session.access_token);assert.equal(rotated.status,200);assert.notEqual(rotated.data.recoveryCode,recovered.data.recoveryCode);
 assert.equal((await api('ack',{},fresh.data.session.access_token)).status,200);
 const reopened=await a.from('cities').select('revision').eq('id',id).single();assert.ifError(reopened.error);assert.equal(reopened.data.revision,2);
 const deleted=await a.rpc('delete_city_v2',{p_city_id:id,p_expected_revision:2});assert.ifError(deleted.error);
 await a.auth.signOut({scope:'local'});await b.auth.signOut({scope:'local'});
 console.log('PASS: API username đăng ký/retry/login/recovery/rotate/logout; Supabase JWT A/B, profile/RLS, owner spoof, hai thiết bị, revision conflict và xóa bản QA.');
 console.log('Hai tài khoản QA riêng còn trong Auth:',usernameA,usernameB,'; không lưu/in mật khẩu, token hoặc mã dự phòng.');
}catch(error){console.error('FAIL QA:',error.code||error.name||'Error');process.exitCode=1;}
finally{await Promise.allSettled([a.auth.signOut({scope:'local'}),b.auth.signOut({scope:'local'}),other.auth.signOut({scope:'local'})]);}
