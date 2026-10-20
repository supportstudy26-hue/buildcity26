import {LOGISTICS_BUILDINGS,logisticsBuildingParts} from '../game/render/logistics-parts.js';
import {LANDMARKS} from '../config/landmarks.js';
import {pierParts,roundaboutParts} from '../game/render/infrastructure-parts.js';
import {descriptorThumbnail,landmarkThumbnail} from './mesh-thumbnail.js';
import {ROAD_KINDS,roadProfile} from '../config/road-profiles.js';
import {buildingThumbnail} from './building-thumbnails.js';
import {CATALOG,serviceKind} from '../config/catalog.js';
// Supplied measured-frame thumbnails; original land-road SVGs remain code-native.
export function buildingPreview(kind){
 if(LOGISTICS_BUILDINGS[kind])return descriptorThumbnail(logisticsBuildingParts({kind}));
 if(kind==='bridgePier')return descriptorThumbnail(pierParts(0,0,0));
 const profile=roadProfile(kind);
 if(profile?.circle)return descriptorThumbnail(roundaboutParts(0,0,0,profile));
 if(profile?.structure||profile?.motorway||profile?.ramp){const height=profile.elevation||0,width=profile.width;return descriptorThumbnail([...(height?pierParts(0,0,0,height):[]),{shape:'box',position:[0,height+.1,0],scale:[20,.5,width],color:'#435761'},...(profile.median?[{shape:'box',position:[0,height+.4,0],scale:[20,.35,profile.median],color:'#b9c9aa'}]:[]),...[-1,1].map(side=>({shape:'box',position:[0,height+.7,side*(width/2-.2)],scale:[20,.2,.18],color:'#cbd4ce'}))]);}
 if(LANDMARKS[kind])return landmarkThumbnail(kind);
 if(![...ROAD_KINDS,'inspect','bulldoze'].includes(kind))return buildingThumbnail(kind);
 const v=CATALOG[kind],base=serviceKind(kind),color=v.color||'#a8c5b8';
 const pad='<path d="m8 47 44-22 44 22-44 23Z" fill="#294550"/><path d="m8 47 44 22 44-22v4L52 75 8 51Z" fill="#203842"/>';
 let art='';
 if(ROAD_KINDS.includes(base))art='<path d="m16 43 58-28 14 8-58 28Z" fill="#607b83"/><path d="m22 45 58-28" stroke="#f5d8a0" stroke-dasharray="5 5"/>';
 return `<svg class="building-preview" viewBox="0 0 104 80" aria-hidden="true">${pad}${art}</svg>`;
}
export function buildingSummary(kind){const v=CATALOG[kind],base=serviceKind(kind);if(kind==='bridgePier')return 'Trụ chữ T cao 6 m · chờ mặt cầu';if(roadProfile(kind))return roadProfile(kind).width+' m · '+roadProfile(kind).lanes+' làn · '+roadProfile(kind).speed+' km/h';if(v.capacity)return base==='power'?`${v.capacity.toLocaleString('vi-VN')} kW`: `${Math.round(v.capacity*.15).toLocaleString('vi-VN')} m³/ngày`;return v.range?`Phục vụ ${v.range} ô`:base==='avenue'?'Năng lực gấp 2':'Quy hoạch theo ô';}
