// Real Data API checks with two confirmed QA accounts. No admin key required.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createCity,serialize} from '../src/game/core.js';
import {publicKey,projectURL} from '../src/services/auth.js';
const url=projectURL(process.env.VITE_SUPABASE_URL),key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY;
if(!url||!publicKey(key)||!['QA_A_EMAIL','QA_A_PASSWORD','QA_B_EMAIL','QA_B_PASSWORD'].every(k=>process.env[k])){
  console.error('Cần .env.local (URL/key công khai) và .env.test.local (QA_A_EMAIL, QA_A_PASSWORD, QA_B_EMAIL, QA_B_PASSWORD). Hai tài khoản phải xác nhận email.');process.exit(1);
}
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(20000)})}});
const a=client(),b=client(),anon=client(),created=[];
const payload=serialize(createCity());
const save=async(c,id,revision,name,requestId=randomUUID())=>{const result=await c.rpc('save_city_v2',{p_city_id:id,p_name:name,p_state:payload,p_expected_revision:revision,p_request_id:requestId});if(result.error)throw result.error;return result.data[0];};
try{
  const loginA=await a.auth.signInWithPassword({email:process.env.QA_A_EMAIL,password:process.env.QA_A_PASSWORD});if(loginA.error)throw loginA.error;
  const loginB=await b.auth.signInWithPassword({email:process.env.QA_B_EMAIL,password:process.env.QA_B_PASSWORD});if(loginB.error)throw loginB.error;
  assert.notEqual(loginA.data.user.id,loginB.data.user.id,'Hai tài khoản QA phải khác nhau.');
  const id=randomUUID(),requestId=randomUUID();let row=await save(a,id,0,'BC26 QA A',requestId);created.push({client:a,id});
  assert.equal(row.owner_id,loginA.data.user.id);assert.equal((await save(a,id,0,'BC26 QA A',requestId)).revision,1);
  const hidden=await b.from('cities').select('*').eq('id',id);assert.ifError(hidden.error);assert.deepEqual(hidden.data,[]);
  const update=await b.from('cities').update({name:'B sửa A'}).eq('id',id).select('id');assert.ifError(update.error);assert.deepEqual(update.data,[]);
  const spoof=await b.from('cities').insert({id:randomUUID(),owner_id:loginA.data.user.id,name:'Owner giả',state:payload});assert.ok(spoof.error,'RLS phải chặn giả owner_id');
  await assert.rejects(save(b,id,1,'B RPC A'),e=>['PT409','42501'].includes(e.code));
  const forbiddenDelete=await b.rpc('delete_city_v2',{p_city_id:id,p_expected_revision:1});assert.equal(forbiddenDelete.error?.code,'PT409');
  const guest=await anon.from('cities').select('id').eq('id',id);assert.ok(guest.error,'Khách phải bị từ chối truy cập bảng');
  const nextRequest=randomUUID();row=await save(a,id,1,'BC26 QA A updated',nextRequest);assert.equal(row.revision,2);assert.equal((await save(a,id,1,'BC26 QA A updated',nextRequest)).revision,2);
  await assert.rejects(save(a,id,1,'Thiết bị cũ'),e=>e.code==='PT409');
  const staleDelete=await a.rpc('delete_city_v2',{p_city_id:id,p_expected_revision:1});assert.equal(staleDelete.error?.code,'PT409');
  const secondDevice=client();const login=await secondDevice.auth.signInWithPassword({email:process.env.QA_A_EMAIL,password:process.env.QA_A_PASSWORD});if(login.error)throw login.error;
  const opened=await secondDevice.from('cities').select('*').eq('id',id).single();assert.ifError(opened.error);assert.equal(opened.data.revision,2);assert.deepEqual(opened.data.state,payload);await secondDevice.auth.signOut({scope:'local'});
  const bId=randomUUID();await save(b,bId,0,'BC26 QA B');created.push({client:b,id:bId});const isolated=await a.from('cities').select('id').eq('id',bId);assert.ifError(isolated.error);assert.deepEqual(isolated.data,[]);
  console.log('PASS: Supabase thật — A/B, guest, owner spoof, RPC, retry, hai thiết bị và revision conflict.');
}catch(error){console.error('FAIL:',error.code||error.name||'Error',error.message);process.exitCode=1;}
finally{
  for(const item of created){const current=await item.client.from('cities').select('revision').eq('id',item.id).single();if(current.data){const deleted=await item.client.rpc('delete_city_v2',{p_city_id:item.id,p_expected_revision:current.data.revision});if(deleted.error){console.error('Chưa xóa được bản QA:',item.id);process.exitCode=1;}}}
  await Promise.allSettled([a.auth.signOut({scope:'local'}),b.auth.signOut({scope:'local'})]);
}
