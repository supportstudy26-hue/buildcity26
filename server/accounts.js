import {createHash,createHmac,randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {accountFields} from '../src/services/account-validation.js';
import {createCity,serialize} from '../src/game/core.js';
const digest=value=>createHash('sha256').update(value).digest('hex');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const GENERIC='Tài khoản, mật khẩu hoặc mã dự phòng chưa đúng.';
function clients(env){
  const url=env.SUPABASE_URL||env.VITE_SUPABASE_URL,key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey=env.SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_ANON_KEY;
  if(!url||!key||!publicKey)throw fail(503,'Máy chủ tài khoản chưa được cấu hình. Thành phố trên thiết bị vẫn được giữ.');
  const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(18000)})}};
  return {admin:createClient(url,key,options),auth:createClient(url,publicKey,options),key};
}
async function rpc(admin,name,args){const {data,error}=await admin.rpc(name,args);if(error)throw fail(/BC26_TAKEN/.test(error.message)?409:503,/BC26_TAKEN/.test(error.message)?'Tài khoản này đã được sử dụng.':'Máy chủ tài khoản tạm thời chưa hoàn tất thao tác. Hãy thử lại.');return data;}
async function login(auth,email,password){const {data,error}=await auth.auth.signInWithPassword({email,password});if(error||!data.session)throw fail(401,GENERIC);return data.session;}
function tokens(session){return {access_token:session.access_token,refresh_token:session.refresh_token};}
// Dependencies are injected for deterministic failure/race tests; production
// always calls restricted DB RPCs and Supabase password Auth, never fake sessions.
export function accountHandler({env=process.env,makeClients=clients,now=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
  return async(req,res)=>{
    res.setHeader('Cache-Control','no-store, private');res.setHeader('Pragma','no-cache');res.setHeader('X-Content-Type-Options','nosniff');
    const reply=(status,data)=>res.status(status).json(data);
    try{
      if(req.method!=='POST')return reply(405,{error:'Chỉ hỗ trợ POST.'});
      const origin=req.headers.origin;
      const host=req.headers.host;
      const allowed=(env.ACCOUNT_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
      if(origin&&origin!==`https://${host}`&&!(env.NODE_ENV!=='production'&&origin===`http://${host}`)&&!allowed.includes(origin))throw fail(403,'Nguồn yêu cầu không được phép.');
      if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw fail(415,'Yêu cầu cần JSON.');
      if(Number(req.headers['content-length'])>8192)throw fail(413,'Yêu cầu quá lớn.');
      let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body);}catch{throw fail(400,'JSON không hợp lệ.');}}if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>8192)throw fail(400,'Yêu cầu không hợp lệ.');
      const mode=body.action;if(!['register','login','recover','claim','ack','codes'].includes(mode))throw fail(400,'Thao tác không hợp lệ.');
      const {admin,auth,key}=makeClients(env);
      // On Vercel x-vercel-forwarded-for is overwritten by the platform; do not
      // trust an arbitrary client-supplied x-forwarded-for as the only limit.
      const ip=req.headers['x-vercel-forwarded-for']?.split(',')[0].trim()||req.socket?.remoteAddress||'unavailable';
      let verifiedUser=null;
      if(['ack','codes','claim'].includes(mode)){
        const token=req.headers.authorization?.replace(/^Bearer /i,'');if(!token)throw fail(401,GENERIC);
        const {data,error}=await auth.auth.getUser(token);if(error||!data.user)throw fail(401,GENERIC);verifiedUser=data.user;
      }
      const username=typeof body.username==='string'?body.username.trim().toLowerCase().slice(0,24):'';
      const ipKey=digest('ip:'+ip),userKey=digest('user:'+(verifiedUser?.id||username));
      const allowedRate=await rpc(admin,'bc26_account_rate',{p_action:mode,p_ip_hash:ipKey,p_username_hash:userKey});
      if(!allowedRate){res.setHeader('Retry-After','900');throw fail(429,'Bạn thử quá nhiều lần. Hãy đợi 15 phút rồi thử lại.');}
      if(mode==='ack'){
        await rpc(admin,'bc26_account_ack',{p_user_id:verifiedUser.id});return reply(200,{ok:true});
      }
      const input=accountFields(mode,body);
      if(mode==='codes'){
        const account=await rpc(admin,'bc26_account_lookup',{p_username:input.username});
        if(!account?.user_id||account.user_id!==verifiedUser.id||account.status!=='ready')throw fail(401,GENERIC);
        await login(auth,account.identity_email,input.password);
        const code=createHmac('sha256',key).update('rotate:'+randomUUID()+':'+account.user_id).digest('hex').slice(0,48).toUpperCase();
        await rpc(admin,'bc26_account_codes',{p_user_id:account.user_id,p_code_hash:digest(account.user_id+':'+code)});
        return reply(200,{recoveryCode:code,username:input.username});
      }
      if(mode==='claim'){
        const token=req.headers.authorization?.replace(/^Bearer /i,'');if(!token)throw fail(401,GENERIC);
        const {data,error}=await auth.auth.getUser(token);if(error||!data.user||!data.user.email)throw fail(401,GENERIC);
        const code=createHmac('sha256',key).update('claim:'+randomUUID()+':'+data.user.id).digest('hex').slice(0,48).toUpperCase();
        await rpc(admin,'bc26_account_claim',{p_username:input.username,p_user_id:data.user.id,p_code_hash:digest(data.user.id+':'+code)});
        return reply(200,{username:input.username,recoveryCode:code,legacy:true});
      }
      if(mode==='login'){
        const account=await rpc(admin,'bc26_account_lookup',{p_username:input.username});
        if(!account?.user_id||account.status!=='ready')throw fail(401,GENERIC);
        if(account.revoked_after*1000>now())await sleep(Math.min(1500,account.revoked_after*1000-now()));
        const session=await login(auth,account.identity_email,input.password);
        return reply(200,{session:tokens(session),username:input.username});
      }
      if(mode==='register'){
        const requestHash=digest(input.requestId),id=randomUUID(),cityId=randomUUID();
        let account=await rpc(admin,'bc26_account_reserve',{p_username:input.username,p_request_hash:requestHash,p_city_name:input.cityName,p_identity_email:id+'@accounts.buildcity26.invalid',p_city_id:cityId});
        let userId=account.user_id;
        if(!userId){
          const {data,error}=await admin.auth.admin.createUser({email:account.identity_email,password:input.password,email_confirm:true});
          if(!error)userId=data.user.id;
          else{userId=await rpc(admin,'bc26_account_orphan',{p_username:input.username,p_request_hash:requestHash});if(!userId)throw fail(503,'Đăng ký đang chờ xử lý. Giữ trang này và thử lại.');}
        }
        // Authenticate before adopting a pending orphan; never overwrite its password.
        const session=await login(auth,account.identity_email,input.password);
        if(session.user.id!==userId)throw fail(401,GENERIC);
        if(account.status==='ready'&&(account.code_acknowledged||account.recovery_generation>0))return reply(200,{session:tokens(session),username:input.username,firstCity:account.first_city_id});
        const code=createHmac('sha256',key).update('register:'+input.requestId+':'+userId).digest('hex').slice(0,48).toUpperCase();
        const city=createCity();city.name=account.city_name;
        await rpc(admin,'bc26_account_finish',{p_username:input.username,p_request_hash:requestHash,p_user_id:userId,p_state:serialize(city),p_code_hash:digest(userId+':'+code)});
        return reply(201,{session:tokens(session),username:input.username,firstCity:account.first_city_id,recoveryCode:code});
      }
      // Claim recovery code atomically. Competing requests cannot reuse it.
      const account=await rpc(admin,'bc26_account_lookup',{p_username:input.username});if(!account?.user_id)throw fail(401,GENERIC);
      const claim=randomUUID(),codeHash=digest(account.user_id+':'+input.code);
      const accepted=await rpc(admin,'bc26_recovery_begin',{p_username:input.username,p_code_hash:codeHash,p_claim:claim});if(!accepted)throw fail(401,GENERIC);
      const {error}=await admin.auth.admin.updateUserById(account.user_id,{password:input.password});
      if(error){await rpc(admin,'bc26_recovery_release',{p_username:input.username,p_claim:claim});throw fail(503,'Chưa đổi được mật khẩu. Mã dự phòng vẫn được giữ; hãy thử lại.');}
      // Old access tokens are blocked by the RLS epoch immediately; Auth global
      // sign-out additionally revokes refresh tokens. A fresh login is required.
      const next=createHmac('sha256',key).update('recovery:'+claim+':'+account.user_id).digest('hex').slice(0,48).toUpperCase();
      await rpc(admin,'bc26_recovery_finish',{p_username:input.username,p_claim:claim,p_code_hash:digest(account.user_id+':'+next)});
      const session=await login(auth,account.identity_email,input.password);
      const signedOut=await admin.auth.admin.signOut(session.access_token,'global');if(signedOut.error)throw fail(503,'Đã đổi mật khẩu và khóa phiên cũ; cần thử đăng nhập lại.');
      return reply(200,{ok:true,recoveryCode:next,username:input.username});
    }catch(error){
      // No raw SDK errors, passwords, identities or tokens are returned/logged.
      const status=error.status||(/Tài khoản cần|Mật khẩu cần|Tên thành phố cần|Mã dự phòng|Yêu cầu đăng ký/.test(error.message)?400:503);
      return reply(status,{error:status===503&&!error.status?'Máy chủ tạm thời không đáp ứng. Hãy thử lại.':error.message});
    }
  };
}
