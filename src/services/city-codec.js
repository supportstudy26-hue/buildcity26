import {gzipSync,gunzipSync,strToU8,strFromU8} from 'three/examples/jsm/libs/fflate.module.js';
const FORMAT='bc26-city-payload-gzip-v1',MAX_RAW=16_000_000,MAX_CLOUD=2_000_000;
const FIELDS=['tiles','world','households','citizens','firms','vehicles','contracts','commandReceipts','events','privateInvestment'];
const byteLength=value=>strToU8(JSON.stringify(value)).length;
function hash(bytes){let h=2166136261;for(const b of bytes)h=Math.imul(h^b,16777619)>>>0;return h.toString(16).padStart(8,'0');}
function base64(bytes){let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary);}
export function encodeCity(raw,{always=false}={}){
 if(raw?.cityPayload)raw=decodeCity(raw);
 if(!always&&byteLength(raw)<1_400_000)return raw;
 const payload=Object.fromEntries(FIELDS.filter(k=>Object.hasOwn(raw,k)).map(k=>[k,raw[k]])),bytes=strToU8(JSON.stringify(payload));
 if(bytes.length>MAX_RAW)throw new Error('Bản lưu vượt 16 MB giải nén. Tiến trình vẫn được giữ; hãy xuất JSON.');
 const metadata=Object.fromEntries(Object.entries(raw).filter(([k])=>!FIELDS.includes(k)));
 const encoded={...metadata,cityPayload:{format:FORMAT,bytes:bytes.length,checksum:hash(bytes),data:base64(gzipSync(bytes,{level:6,mtime:0}))}};
 if(byteLength(encoded)>MAX_CLOUD)throw new Error('Bản lưu sau nén vẫn vượt giới hạn Supabase 2 MB. Hãy xuất JSON để giữ tiến trình.');
 return encoded;
}
export function decodeCity(raw){
 const e=raw?.cityPayload;if(e==null)return raw;
 if(e.format!==FORMAT||!Number.isInteger(e.bytes)||e.bytes<1||e.bytes>MAX_RAW||typeof e.data!=='string'||e.data.length>MAX_CLOUD||typeof e.checksum!=='string')throw new Error('Bản lưu nén không hợp lệ.');
 const compressed=Uint8Array.from(atob(e.data),c=>c.charCodeAt(0));
 if(compressed.length<18||new DataView(compressed.buffer).getUint32(compressed.length-4,true)!==e.bytes)throw new Error('Kích thước bản lưu nén không khớp.');
 const bytes=gunzipSync(compressed);if(bytes.length!==e.bytes||hash(bytes)!==e.checksum)throw new Error('Bản lưu nén bị hỏng.');
 const fields=JSON.parse(strFromU8(bytes));if(!fields||Array.isArray(fields)||Object.keys(fields).some(k=>!FIELDS.includes(k))||Object.keys(fields).some(k=>Object.hasOwn(raw,k)))throw new Error('Nội dung bản lưu nén không hợp lệ.');
 const {cityPayload,...metadata}=raw;return {...metadata,...fields};
}
export const cityBytes=byteLength;
