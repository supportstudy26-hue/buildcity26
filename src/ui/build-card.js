import {CATALOG,serviceKind} from '../config/catalog.js';
// Original vector miniatures; no textures, remote assets or icon dependency.
export function buildingPreview(kind){
 const v=CATALOG[kind],base=serviceKind(kind),color=v.color||'#a8c5b8';
 const pad='<path d="m8 47 44-22 44 22-44 23Z" fill="#294550"/><path d="m8 47 44 22 44-22v4L52 75 8 51Z" fill="#203842"/>';
 let art='';
 if(['road','avenue'].includes(base))art='<path d="m16 43 58-28 14 8-58 28Z" fill="#607b83"/><path d="m22 45 58-28" stroke="#f5d8a0" stroke-dasharray="5 5"/>';
 else if(base==='park')art=kind==='plaza'?'<path d="m22 47 30-15 30 15-30 15Z" fill="#cbd4be"/><ellipse cx="52" cy="46" rx="14" ry="7" fill="#72bbcf"/><path d="M52 46V28m-7 6 7-6 7 6" stroke="#b9e4ee" stroke-width="3"/>':'<path d="m20 47 32-16 32 16-32 16Z" fill="#76b48b"/><path d="m24 49 48-6M50 36v24" stroke="#e5d5af" stroke-width="3"/><path d="M34 40v15m36-21v16" stroke="#806f56" stroke-width="3"/><path d="m34 22-10 20h20Zm36-7-10 22h20Z" fill="#a6d6a1"/>';
 else art=`<path d="m27 33 25-13 26 13-26 13Z" fill="${color}"/><path d="M27 33v24l25 13V46Z" fill="${color}" opacity=".78"/><path d="M52 46v24l26-13V33Z" fill="${color}" opacity=".54"/><path d="m27 33 25-13 26 13-26 13Z" fill="#ecf5ea" opacity=".3"/><path d="m34 41 5 3v6l-5-3Zm10 5 4 2v6l-4-2Zm14 1 5-3v6l-5 3Zm10-5 5-3v6l-5 3Z" fill="#d1eff1"/>${base==='clinic'?'<path d="M51 26v13m-6-7h12" stroke="#d56e69" stroke-width="4"/>':base==='water'||base==='sewage'?'<ellipse cx="52" cy="29" rx="14" ry="7" fill="#7cbaca"/><path d="M38 29v7c0 9 28 9 28 0v-7" fill="#6595a6"/><ellipse cx="52" cy="29" rx="14" ry="7" fill="#a6d4de"/>':base==='school'?'<path d="M79 25v33m0-33 12 4-12 5" stroke="#e9be83" stroke-width="2"/>':''}`;
 return `<svg class="building-preview" viewBox="0 0 104 80" aria-hidden="true">${pad}${art}</svg>`;
}
export function buildingSummary(kind){const v=CATALOG[kind],base=serviceKind(kind);if(v.capacity)return base==='power'?`${v.capacity.toLocaleString('vi-VN')} kW`: `${Math.round(v.capacity*.15).toLocaleString('vi-VN')} m³/ngày`;return v.range?`Phục vụ ${v.range} ô`:base==='avenue'?'Năng lực gấp 2':'Quy hoạch theo ô';}
