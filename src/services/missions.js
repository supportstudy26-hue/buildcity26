import {decodeCity} from './city-codec.js';
export class MissionQueue{
 constructor({storage,send}){Object.assign(this,{storage,send});this.busy=false;}
 key(owner,city){return `bc26-mission-request-v1:${owner}:${city}`;}
 pending(owner,city){const raw=this.storage.getItem(this.key(owner,city));return raw?JSON.parse(raw):null;}
 async transact(owner,request,apply){if(this.busy)throw new Error('Đang đối soát nhiệm vụ.');const key=this.key(owner,request.cityId);let pending=this.pending(owner,request.cityId);if(pending&&(pending.action!==request.action||pending.missionId!==request.missionId))throw new Error('Hãy thử lại nhiệm vụ đang chờ máy chủ.');if(!pending){pending=request;this.storage.setItem(key,JSON.stringify(pending));}this.busy=true;
 try{const result=await this.send(pending),revision=Number(result.city?.revision);
 const duplicate=result.applied===false&&pending.action==='claim'&&decodeCity(result.city?.state)?.progression?.campaign?.claims?.some(r=>r.id===pending.missionId);
 const expected=duplicate&&revision===pending.revision?pending.revision:pending.revision+1;
 if(result.city?.id!==pending.cityId||!Number.isSafeInteger(revision)||revision<expected||result.applied===false&&!duplicate)throw new Error('Phản hồi nhiệm vụ không hợp lệ.');
 if(revision!==expected){this.storage.removeItem(key);throw Object.assign(new Error('BC26_CONFLICT: bản lưu mới hơn phản hồi nhiệm vụ. Hãy mở bản đám mây.'),{status:409});}await apply(result.city,result);this.storage.removeItem(key);return result;}
 catch(error){if(error.status>=400&&error.status<500)this.storage.removeItem(key);throw error;}finally{this.busy=false;}
 }
}
export async function missionRequest(supabase,request){const {data}=await supabase.auth.getSession();if(!data.session?.access_token)throw Object.assign(new Error('Cần đăng nhập để nhận thưởng.'),{status:401});const response=await fetch('/api/missions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify(request),signal:AbortSignal.timeout(25000)});let result;try{result=await response.json();}catch{throw new Error('Máy chủ chưa phản hồi. Thử lại cùng nhiệm vụ.');}if(!response.ok)throw Object.assign(new Error(result.error||'Chưa nhận được thưởng.'),{status:response.status});return result;}
