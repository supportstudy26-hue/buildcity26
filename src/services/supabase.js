import {encodeCity,decodeCity} from './city-codec.js';
import { createClient } from '@supabase/supabase-js';
import { publicKey, projectURL } from './auth.js';
const url=projectURL(import.meta.env.VITE_SUPABASE_URL?.trim());
const key=(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim();
export const configured=!!url&&publicKey(key);
export const supabase=configured?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'},global:{fetch:async(input,init)=>fetch(input,{...init,signal:init?.signal||AbortSignal.timeout(20000)})}}):null;
export function authMessage(error){
  const m=error?.message||String(error);
  if(/BC26_CITY_LIMIT/i.test(m))return 'Mỗi tài khoản chỉ có một thành phố. Chọn Thành phố mới và xác nhận xóa thành phố cũ trước.';
  if(/replace_city_v1|BC26_CONFLICT/i.test(m)&&/schema cache|not find|not exist/i.test(m))return 'Máy chủ chưa cập nhật chức năng thay thành phố. Thành phố cũ được giữ nguyên.';
  if(/Invalid login credentials/i.test(m))return 'Email hoặc mật khẩu chưa đúng.';
  if(/Email not confirmed/i.test(m))return 'Bạn cần xác nhận email trước khi đăng nhập.';
  if(/expired|invalid.*token|code verifier|PKCE/i.test(m))return 'Liên kết đã hết hạn hoặc mở sai trình duyệt. Hãy gửi lại email và mở liên kết trên trình duyệt đã yêu cầu.';
  if(/already registered/i.test(m))return 'Email này đã được đăng ký.';
  if(/rate limit|too many requests|after \d+ seconds/i.test(m))return 'Bạn thao tác quá nhanh. Hãy chờ một chút rồi thử lại.';
  if(/Password should|password.*least|weak password/i.test(m))return 'Mật khẩu chưa đạt yêu cầu của hệ thống. Dùng tối thiểu 8 ký tự.';
  if(/fetch|network|timeout|abort/i.test(m))return 'Không kết nối được máy chủ. Tiến trình vẫn được giữ trên thiết bị; hãy thử đồng bộ lại.';
  if(/BC26_CONFLICT: old city list changed/.test(m))return 'Bản thành phố cũ vừa thay đổi. Hủy, mở lại Thành phố mới để xem phiên bản hiện tại rồi xác nhận lại.';
  if(/BC26_CONFLICT/i.test(m)||error?.code==='40001')return 'Bản lưu đã thay đổi trên thiết bị khác. Mở bản đám mây để tiếp tục; tiến trình trên máy vẫn được giữ trong bản dự phòng.';
  if(/cities|save_city|delete_city|schema cache|relation.*exist/i.test(m))return 'Chưa cấu hình dữ liệu. Chạy supabase/schema.sql và migration trong Supabase SQL Editor.';
  return 'Không hoàn tất được thao tác. '+m;
}
export async function listCities(){const {data,error}=await supabase.from('cities').select('id,name,revision,updated_at').order('updated_at',{ascending:false});if(error)throw error;return data;}
export async function loadCity(id){const {data,error}=await supabase.from('cities').select('*').eq('id',id).single();if(error)throw error;return {...data,state:decodeCity(data.state)};}
export async function saveCity({id,name,state,revision=0,requestId}){
  const {data,error}=await supabase.rpc('save_city_v2',{p_city_id:id,p_name:name,p_state:encodeCity(state),p_expected_revision:revision,p_request_id:requestId});if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(!row)throw new Error('Không nhận được bản lưu từ máy chủ.');return row;
}
export async function deleteCity(id,revision){const {error}=await supabase.rpc('delete_city_v2',{p_city_id:id,p_expected_revision:revision});if(error)throw error;}
export async function replaceCloudCity({oldCities,id,name,state,requestId}){
  const {data,error}=await supabase.rpc('replace_city_v1',{p_old_cities:oldCities,p_city_id:id,p_name:name,p_state:encodeCity(state),p_request_id:requestId});
  if(error)throw error;const row=Array.isArray(data)?data[0]:data;
  if(!row)throw new Error('Chưa nhận được thành phố mới. Thử lại để đối soát.');
  return {...row,state:decodeCity(row.state)};
}
