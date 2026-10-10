import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
import {validateSave,serialize,stepSimulation} from '../src/game/core.js';
import {encodeCity} from '../src/services/city-codec.js';
import {createCampaign,updateCampaign,applyVerifiedClaim,campaign,missionViews} from '../src/game/systems/campaign.js';
import {metricKey} from '../src/game/systems/mission-metrics.js';
const fail=(status,message)=>Object.assign(new Error(message),{status});
function clients(env){const url=env.SUPABASE_URL||env.VITE_SUPABASE_URL,key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY,pk=env.SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_ANON_KEY;if(!url||!key||!pk)throw fail(503,'Máy chủ nhiệm vụ chưa cấu hình.');const opts={auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(18000)})}};return {admin:createClient(url,key,opts),auth:createClient(url,pk,opts)};}
// Server-owned checkpoint: client earned flags, counters, windows and holds are
// discarded. A bounded replay verifies completions across actual simulation
// steps. Cities are still client-authoritative casual worlds, not anti-cheat
// competitive cities: editing construction/accounting inputs needs a separate
// server command log and is deliberately not claimed as solved here.
export function verifyMissionCheckpoint(raw,checkpoint,now,revision){
 const current=validateSave(raw),incoming=current.progression.campaign;
 let verified=createCampaign(),reason=null;
 if(checkpoint){
  const previous=validateSave(checkpoint.state),delta=current.clock.seconds-previous.clock.seconds;
  if(delta<0)throw fail(409,'Đồng hồ lùi so với mốc máy chủ. Hãy mở bản đám mây.');
  const allowed=Math.max(0,(now-checkpoint.wallMs)/1000)*40+5;
  if(delta>allowed)throw fail(409,'Đồng hồ chưa khớp thời gian máy chủ. Giữ tiến trình và thử lại sau.');
  if(delta<=120){for(let i=0;i<delta;i++)stepSimulation(previous);verified=structuredClone(campaign(previous));}
  else {verified=structuredClone(campaign(previous));verified.holds={};verified.windows={};verified.tripBins=[];verified.lastTick=null;reason='Khoảng đối soát vượt 120 giây game; thời gian duy trì bắt đầu lại.';}
 }
 // Never accept a claimed ID fabricated by a frontend/local import.
 if((incoming?.claims||[]).some(r=>!verified.claims.some(v=>v.id===r.id)))throw fail(409,'Biên nhận chưa được máy chủ xác minh. Mở bản đám mây để đối soát.');
 current.progression.campaign=verified;
 const c=campaign(current),key=metricKey({metric:'verified_save_count',filters:{}});
 if(revision> (c.lastSaveRevision||0)){c.counters[key]=(c.counters[key]||0)+1;c.lastSaveRevision=revision;}
 // Replay-earned evidence is retained. New constructions enter the next
 // checkpoint; every hold also requires current conditions to remain valid.
 const ids=new Set(c.claims.map(r=>r.id));
 for(const m of missionViews(current))if(!ids.has(m.id)&&m.holdSeconds&&!c.earned[m.id]&&!m.condition.ok){delete c.holds[m.id];}
 c.lastTick=null;updateCampaign(current,true);
 return {city:current,reason};
}
export function missionHandler({env=process.env,makeClients=clients,now=()=>Date.now()}={}){return async(req,res)=>{
 res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');
 const reply=(status,data)=>res.status(status).json(data);
 try{
  if(req.method!=='POST')return reply(405,{error:'Chỉ hỗ trợ POST.'});
  const origin=req.headers.origin,host=req.headers.host;
  if(origin&&origin!==`https://${host}`&&!(env.NODE_ENV!=='production'&&origin===`http://${host}`))throw fail(403,'Nguồn yêu cầu không được phép.');
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw fail(415,'Yêu cầu cần JSON.');
  let body=req.body;if(typeof body==='string'){if(body.length>2048)throw fail(413,'Yêu cầu quá lớn.');body=JSON.parse(body);}
  if(!body||Array.isArray(body)||JSON.stringify(body).length>2048||!['observe','claim'].includes(body.action)||!/^[-\da-f]{36}$/i.test(body.cityId)||!Number.isSafeInteger(body.revision)||body.revision<1||body.action==='claim'&&!/^bc26-main-\d{3}-[abc]$/.test(body.missionId||''))throw fail(400,'Yêu cầu nhiệm vụ không hợp lệ.');
  const token=req.headers.authorization?.replace(/^Bearer /i,'');if(!token)throw fail(401,'Cần đăng nhập để nhận thưởng.');
  const {auth,admin}=makeClients(env),{data,error}=await auth.auth.getUser(token);if(error||!data.user)throw fail(401,'Phiên đăng nhập đã hết hạn.');
  const {data:snapshot,error:readError}=await admin.rpc('bc26_mission_read',{p_city_id:body.cityId,p_owner:data.user.id});
  if(readError)throw fail(/OWNER/.test(readError.message)?403:503,/OWNER/.test(readError.message)?'Thành phố không thuộc tài khoản này.':'Chưa cài migration nhiệm vụ hoặc máy chủ tạm thời lỗi.');
  if(body.action==='claim'&&snapshot.checkpoint?.state?.progression?.campaign?.claims?.some(r=>r.id===body.missionId))return reply(200,{city:snapshot.city,applied:false});
  if(Number(snapshot.city.revision)!==body.revision)throw fail(409,'BC26_CONFLICT: thành phố đã đổi trên thiết bị khác.');
  const verified=verifyMissionCheckpoint(snapshot.city.state,snapshot.checkpoint,now(),body.revision),s=verified.city;campaign(s).originCity=body.cityId;
  if(body.action==='claim')applyVerifiedClaim(s,body.missionId,body.revision);
  const packed=encodeCity(serialize(s),{always:true}),checkpoint={state:packed,wallMs:now()};
  const signature=createHash('sha256').update(JSON.stringify(packed)).digest('hex');
  const {data:result,error:commitError}=await admin.rpc('bc26_mission_commit',{p_city_id:body.cityId,p_owner:data.user.id,p_revision:body.revision,p_mission_id:body.action==='claim'?body.missionId:null,p_state:packed,p_checkpoint:checkpoint,p_signature:signature});
  if(commitError)throw fail(/CONFLICT/.test(commitError.message)?409:503,/CONFLICT/.test(commitError.message)?'BC26_CONFLICT: mở bản đám mây để tiếp tục.':'Chưa ghi được phần thưởng. Hãy thử lại cùng nhiệm vụ.');
  return reply(200,{...result,notice:verified.reason});
 }catch(error){return reply(error.status||422,{error:error.status||/nhiệm vụ|bằng chứng|Biên nhận|Đồng hồ/.test(error.message)?error.message:'Bản lưu hoặc dữ liệu nhiệm vụ không hợp lệ.'});}
};}
