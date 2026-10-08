import {accountFields} from './account-validation.js';
export async function accountRequest(action,fields={},token=null){
  if(['register','login','codes','recover','claim'].includes(action))accountFields(action,fields);
  let response;
  try{response=await fetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({action,...fields}),cache:'no-store',signal:AbortSignal.timeout(30000)});}catch{throw new Error('Chưa kết nối được máy chủ tài khoản. Giữ trang này để thử lại; bản lưu trên thiết bị vẫn còn.');}
  let data;try{data=await response.json();}catch{throw new Error('Máy chủ tài khoản chưa được bật. Cần chạy trên Vercel hoặc npm run dev với cấu hình server.');}
  if(!response.ok)throw new Error(data.error||'Không hoàn tất được thao tác tài khoản.');return data;
}
export function registrationRequest(username){
  // Only an idempotency nonce is persisted, never passwords or recovery codes.
  const key='bc26-register-request',normalized=username.trim().toLowerCase();
  let previous;try{previous=JSON.parse(sessionStorage.getItem(key));}catch{}
  if(previous?.username===normalized&&/^[a-f0-9-]{36}$/.test(previous.requestId))return previous.requestId;
  const requestId=crypto.randomUUID();try{sessionStorage.setItem(key,JSON.stringify({username:normalized,requestId}));}catch{throw new Error('Cần bật bộ nhớ phiên để đăng ký an toàn và thử lại khi mất mạng.');}return requestId;
}
export async function acceptAccountSession(client,data){
  if(!data.session?.access_token||!data.session?.refresh_token)throw new Error('Máy chủ chưa trả phiên đăng nhập hợp lệ.');
  const {data:result,error}=await client.auth.setSession(data.session);if(error)throw error;
  if(!result.session)throw new Error('Không mở được phiên tài khoản.');return result.session;
}
