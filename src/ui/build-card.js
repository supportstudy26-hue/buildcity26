import {buildingThumbnail} from './building-thumbnails.js';
import {CATALOG,serviceKind} from '../config/catalog.js';
// Supplied measured-frame thumbnails; original land-road SVGs remain code-native.
export function buildingPreview(kind){
 if(!['road','avenue','inspect','bulldoze'].includes(kind))return buildingThumbnail(kind);
 const v=CATALOG[kind],base=serviceKind(kind),color=v.color||'#a8c5b8';
 const pad='<path d="m8 47 44-22 44 22-44 23Z" fill="#294550"/><path d="m8 47 44 22 44-22v4L52 75 8 51Z" fill="#203842"/>';
 let art='';
 if(['road','avenue'].includes(base))art='<path d="m16 43 58-28 14 8-58 28Z" fill="#607b83"/><path d="m22 45 58-28" stroke="#f5d8a0" stroke-dasharray="5 5"/>';
 return `<svg class="building-preview" viewBox="0 0 104 80" aria-hidden="true">${pad}${art}</svg>`;
}
export function buildingSummary(kind){const v=CATALOG[kind],base=serviceKind(kind);if(v.capacity)return base==='power'?`${v.capacity.toLocaleString('vi-VN')} kW`: `${Math.round(v.capacity*.15).toLocaleString('vi-VN')} m³/ngày`;return v.range?`Phục vụ ${v.range} ô`:base==='avenue'?'Năng lực gấp 2':'Quy hoạch theo ô';}
