import ids from '../../config/vietnam-province-ids.json' with {type:'json'};
import {normalizeSearch} from './data.js';
export const MAP_VERSION='vn-map-20250701-v1',MAP_SNAPSHOT='2025-07-01';
export const MAP_BASE='/geodata/'+MAP_VERSION+'/';
export const PROVINCE_CODES=Object.freeze(ids);
export const gameProvinceId=code=>Object.keys(ids).find(id=>ids[id]===code);
export function mergeNationalCatalog(provinces,legacy,aliases,islands){
  return provinces.map(p=>({...p,legacyCode:ids[p.id],regions:legacy.find(r=>r.id===ids[p.id])?.regions||[],aliases:aliases.filter(a=>a.provinceId===p.id).map(a=>a.name).concat(islands.filter(a=>a.provinceId===p.id).map(a=>a.name))}));
}
export function parseFormerNames(csv){return csv.replace(/^\uFEFF/,'').trim().split(/\r?\n/).slice(1).map(line=>{const [name,provinceId]=line.split(',');return {name,provinceId};});}
export function searchNational(provinces,query){const q=normalizeSearch(query).replace(/[–—-]/g,' ').replace(/\s+/g,' ');return provinces.filter(p=>normalizeSearch([p.name,...p.aliases,...p.regions.map(r=>r.name)].join(' ')).replace(/[–—-]/g,' ').replace(/\s+/g,' ').includes(q));}
export async function fetchNational(file,{signal,entry,json=true}={}){
  if(!/^[a-zA-Z0-9.-]+$/.test(file))throw new Error('Tên dữ liệu bản đồ không hợp lệ.');
  const limit=entry?.bytes??100_000;if(limit>16_000_000)throw new Error('Dữ liệu bản đồ vượt giới hạn.');
  const response=await fetch(MAP_BASE+file,{signal});if(!response.ok)throw new Error('Không tải được bản đồ ('+response.status+').');
  if(Number(response.headers.get('content-length'))>limit)throw new Error('Dữ liệu bản đồ vượt giới hạn.');
  const reader=response.body.getReader(),chunks=[];let bytes=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>limit){await reader.cancel();throw new Error('Dữ liệu bản đồ vượt giới hạn.');}chunks.push(value);}}finally{reader.releaseLock();}
  const data=new Uint8Array(bytes);let pos=0;for(const chunk of chunks){data.set(chunk,pos);pos+=chunk.length;}
  if(entry){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),n=>n.toString(16).padStart(2,'0')).join('');if(hash!==entry.sha256||bytes!==entry.bytes)throw new Error('Checksum bản đồ không khớp.');}
  const text=new TextDecoder().decode(data);return json?JSON.parse(text):text;
}
export function polygonParts(geometry){return geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];}
export function isOffshorePart(poly){return poly[0].every(p=>p[0]>110);}
export function referenceBuildRule(){return {ok:false,message:'Chưa có đất nổi và DEM được kiểm chứng cho vị trí này. Lớp hành chính chỉ là tham chiếu.'};}
export function validateNationalCatalog(provinces,geometry,aliases){
  if(provinces.length!==34||new Set(provinces.map(p=>p.id)).size!==34||new Set(provinces.map(p=>p.name)).size!==34||provinces.filter(p=>p.kind2025==='city').length!==6||geometry.features.length!==34||new Set(geometry.features.map(f=>f.id)).size!==34||aliases.length!==63||new Set(aliases.map(a=>a.name)).size!==63||aliases.some(a=>!ids[a.provinceId])||provinces.some(p=>!ids[p.id]||p.snapshot!==MAP_SNAPSHOT||!geometry.features.some(f=>f.id===p.id)))throw new Error('Danh mục bản đồ không khớp 34 vùng / 63 tên cũ.');
}
