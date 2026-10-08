export const PROVINCE_NAMES={"01":"Hà Nội","04":"Cao Bằng","08":"Tuyên Quang","11":"Điện Biên","12":"Lai Châu","14":"Sơn La","15":"Lào Cai","19":"Thái Nguyên","20":"Lạng Sơn","22":"Quảng Ninh","24":"Bắc Ninh","25":"Phú Thọ","31":"Hải Phòng","33":"Hưng Yên","37":"Ninh Bình","38":"Thanh Hóa","40":"Nghệ An","42":"Hà Tĩnh","44":"Quảng Trị","46":"Huế","48":"Đà Nẵng","51":"Quảng Ngãi","52":"Gia Lai","56":"Khánh Hòa","66":"Đắk Lắk","68":"Lâm Đồng","75":"Đồng Nai","79":"Hồ Chí Minh","80":"Tây Ninh","82":"Đồng Tháp","86":"Vĩnh Long","91":"An Giang","92":"Cần Thơ","96":"Cà Mau"};
export const GEO_VERSION='vn-20261008';
export const GEO_BASE='/geodata/'+GEO_VERSION+'/';
const cache=new Map();const MAX_BYTES=8_000_000,MAX_PACKAGES=4;
let bytes=0;
export function geographyCacheStats(){return {packages:cache.size,sourceBytes:bytes,maxPackages:MAX_PACKAGES,maxSourceBytes:MAX_BYTES};}
export async function fetchGeoJSON(file,{signal,checksum,maxBytes=2_000_000}={}){
  if(!/^[a-zA-Z0-9.-]+$/.test(file))throw new Error('Tên gói dữ liệu không hợp lệ.');
  const response=await fetch(GEO_BASE+file,{signal});if(!response.ok)throw new Error('Không tải được dữ liệu địa lý ('+response.status+'). Hãy thử lại khi có mạng.');
  if(Number(response.headers.get('content-length'))>maxBytes)throw new Error('Gói địa lý vượt giới hạn tải.');
  const reader=response.body.getReader(),chunks=[];let length=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>maxBytes){await reader.cancel();throw new Error('Gói địa lý vượt giới hạn tải.');}chunks.push(value);}}finally{reader.releaseLock();}
  const blob=new Uint8Array(length);let offset=0;for(const chunk of chunks){blob.set(chunk,offset);offset+=chunk.byteLength;}
  if(checksum){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',blob)),n=>n.toString(16).padStart(2,'0')).join('');if(hash!==checksum)throw new Error('Checksum dữ liệu không khớp. Khu chơi chưa được mở.');}
  return JSON.parse(new TextDecoder().decode(blob));
}
export async function loadRegion(region,{signal}={}){
  if(!region||!/^\d{2}-(start|island|coast)$/.test(region.id)||!/^[a-f0-9]{64}$/.test(region.sha256)||!Number.isSafeInteger(region.bytes)||region.bytes<1||region.bytes>1_000_000)throw new Error('Danh mục khu chơi không hợp lệ.');
  if(signal?.aborted)throw new DOMException('Đã hủy tải','AbortError');
  const key=GEO_VERSION+'/'+region.id+'/'+region.sha256;if(cache.has(key)){const row=cache.get(key);cache.delete(key);cache.set(key,row);return structuredClone(row.data);}
  const data=await fetchGeoJSON(region.id+'.json',{signal,checksum:region.sha256,maxBytes:1_000_000});validateRegion(data);
  if(data.region.id!==region.id||data.version!==GEO_VERSION)throw new Error('Phiên bản khu chơi không khớp danh mục.');
  if(signal?.aborted)throw new DOMException('Đã hủy tải','AbortError');
  while(cache.size&&(cache.size>=MAX_PACKAGES||bytes+region.bytes>MAX_BYTES)){const key=cache.keys().next().value;bytes-=cache.get(key).bytes;cache.delete(key);}
  cache.set(key,{data,bytes:region.bytes});bytes+=region.bytes;return structuredClone(data);
}
export function normalizeSearch(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().trim();}
export function searchProvinces(provinces,query){const q=normalizeSearch(query);return provinces.filter(p=>normalizeSearch([p.name,...p.aliases,...(p.id==='48'?['Hoàng Sa']:p.id==='56'?['Trường Sa']:[]),...(p.regions||[]).map(r=>r.name)].join(' ')).includes(q));}
export function validateRegion(data){
  if(!data||data.version!==GEO_VERSION||!data.region||!/^\d{2}-(start|island|coast)$/.test(data.region.id)||!Array.isArray(data.region.anchor)||data.region.anchor.length!==2||!data.region.anchor.every(Number.isFinite)||!/^EPSG:326(48|49)$/.test(data.crs)||!Array.isArray(data.utmCenter)||!data.utmCenter.every(Number.isFinite)||data.widthMeters!==12800)throw new Error('Tọa độ hoặc phiên bản địa lý không hợp lệ.');
  const p=data.playable;
  if(!p||p.cells!==64||p.cellMeters!==20||!Array.isArray(p.heights)||p.heights.length!==65**2||p.heights.some(h=>!Number.isFinite(h)||h< -12000||h>9000)||!Array.isArray(p.waterMask)||p.waterMask.length!==64**2||p.waterMask.some(n=>![0,1,2,3].includes(n))||!Array.isArray(p.insideProvince)||p.insideProvince.length!==64**2||p.insideProvince.some(n=>![0,1].includes(n))||!Number.isInteger(data.region.entryTile)||data.region.entryTile<0||data.region.entryTile>=64**2)throw new Error('Raster khu xây không hợp lệ.');
  return data;
}
export function validateGeography(g,size){
  if(!g)return;
  if(g.mode!=='vietnam'||g.version!==GEO_VERSION||!/^\d{2}-(start|island|coast)$/.test(g.regionId)||PROVINCE_NAMES[g.provinceId]!==g.provinceName||g.regionId.slice(0,2)!==g.provinceId||typeof g.provinceName!=='string'||g.provinceName.length>40||!/^EPSG:326(48|49)$/.test(g.crs)||!Array.isArray(g.anchor)||g.anchor.length!==2||!g.anchor.every(Number.isFinite)||g.anchor[0]<102||g.anchor[0]>110||g.anchor[1]<8||g.anchor[1]>24||!Array.isArray(g.utmOrigin)||g.utmOrigin.length!==2||!g.utmOrigin.every(Number.isFinite)||!Number.isInteger(g.entryTile)||g.entryTile<0||g.entryTile>=size**2||!Array.isArray(g.waterMask)||g.waterMask.length!==size**2||g.waterMask.some(n=>![0,1,2,3].includes(n))||!Array.isArray(g.insideProvince)||g.insideProvince.length!==size**2||g.insideProvince.some(n=>![0,1].includes(n))||!/^\d{4}-\d{2}-\d{2}$/.test(g.osmDate)||typeof g.demEdition!=='string'||g.demEdition.length>200||!Array.isArray(g.sourceHashes)||g.sourceHashes.length>20||g.sourceHashes.some(x=>!/^[a-f0-9]{64}$/.test(x)))throw new Error('Metadata địa lý của bản lưu không hợp lệ.');
}
