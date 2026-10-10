// One durable request per city; never retry a purchase with a new receipt ID.
export class FinanceQueue {
 constructor({storage,send,uuid=()=>crypto.randomUUID()}){Object.assign(this,{storage,send,uuid});this.busy=false;}
 key(owner,city){return `bc26-finance-v1:${owner}:${city}`;}
 pending(owner,city){const raw=this.storage.getItem(this.key(owner,city));return raw?JSON.parse(raw):null;}
 async transact({owner,city,revision,order,round,apply}){
  if(this.busy)throw new Error('Giao dịch đang được xử lý.');
  const key=this.key(owner,city);let request=this.pending(owner,city);
  if(!request){request={city,revision,requestId:this.uuid(),order,round};this.storage.setItem(key,JSON.stringify(request));}
  this.busy=true;
  try{
   const response=await this.send(request);
   if(response.city?.id!==city||Number(response.city.revision)<request.revision+1||!Number.isFinite(response.result?.delta))throw new Error('Phản hồi giao dịch không hợp lệ; hãy thử lại cùng biên nhận.');
   // Only the exact resulting revision can replace the paused local state.
   if(Number(response.city.revision)!==request.revision+1){this.storage.removeItem(key);const error=new Error('BC26_CONFLICT');error.code='40001';throw error;}
   await apply(response.city,request,response.result);
   this.storage.removeItem(key);
   return response.result;
  }catch(error){
   // Database rejections rolled back; transport errors retain the durable request.
   if(['22023','PT409','40001','42501','28000','54000','PGRST202'].includes(error.code))this.storage.removeItem(key);
   throw error;
  }finally{this.busy=false;}
 }
}
export function financeError(error){
 const msg=error?.message||String(error);
 if(/PGRST202|schema cache/.test(msg)||error?.code==='PGRST202')return 'Chưa cài migration tài chính trên Supabase. Bản lưu của bạn được giữ nguyên.';
 const names={BC26_QUOTE_EXPIRED:'Kỳ giao dịch đã đổi. Tải lại giá rồi đặt lệnh mới.',BC26_FINANCE_FUNDS:'Ngân sách không đủ hoặc số cổ phiếu vượt giới hạn.',BC26_FINANCE_HOLDING:'Bạn không sở hữu đủ cổ phiếu để bán.',BC26_FINANCE_RATE:'Quá nhiều giao dịch. Chờ một phút rồi thử lại.',BC26_LOTTERY_LIMIT:'Cần đối soát vé cũ trước khi mua thêm.',BC26_CONFLICT:'Thành phố đã đổi trên thiết bị khác. Mở bản đám mây trong Tài khoản để tiếp tục.',BC26_FINANCE_OWNER:'Bạn không có quyền giao dịch cho thành phố này.'};
 for(const [key,value] of Object.entries(names))if(msg.includes(key))return value;
 if(/fetch|network|abort|timeout/i.test(msg))return 'Mất kết nối. Giao dịch đang được giữ để thử lại cùng biên nhận; thành phố tạm dừng để bảo vệ tiền.';
 return 'Chưa hoàn tất giao dịch. '+msg;
}
