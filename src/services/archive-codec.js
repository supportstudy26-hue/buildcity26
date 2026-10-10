// Existing Three.js dependency bundles the MIT-licensed fflate implementation.
// Used only when an uncompressed local backup exceeds the browser quota.
import {gzipSync,gunzipSync,strToU8,strFromU8} from 'three/examples/jsm/libs/fflate.module.js';
const FORMAT='bc26-local-archive-gzip-v1',MAX_BYTES=16_000_000;
export function packArchive(raw){
 const bytes=strToU8(raw);if(bytes.length>MAX_BYTES)throw new Error('Bản dự phòng quá lớn. Hãy xuất JSON.');
 const compressed=gzipSync(bytes,{level:6});let binary='';
 for(let i=0;i<compressed.length;i+=32768)binary+=String.fromCharCode(...compressed.subarray(i,i+32768));
 return JSON.stringify({format:FORMAT,data:btoa(binary)});
}
export function unpackArchive(raw){
 let envelope;try{envelope=JSON.parse(raw);}catch{return raw;}
 if(envelope?.format!==FORMAT)return raw;
 if(typeof envelope.data!=='string'||envelope.data.length>MAX_BYTES*1.4)throw new Error('Bản dự phòng nén không hợp lệ.');
 const compressed=Uint8Array.from(atob(envelope.data),c=>c.charCodeAt(0));
 if(compressed.length<18)throw new Error('Bản dự phòng nén bị thiếu dữ liệu.');
 const size=new DataView(compressed.buffer).getUint32(compressed.length-4,true);
 if(size>MAX_BYTES)throw new Error('Bản dự phòng quá lớn.');
 const bytes=gunzipSync(compressed);if(bytes.length!==size)throw new Error('Bản dự phòng nén bị hỏng.');
 return strFromU8(bytes);
}
