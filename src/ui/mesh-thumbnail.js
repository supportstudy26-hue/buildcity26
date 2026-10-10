import {landmarkParts} from '../game/render/landmark-parts.js';
// A lightweight SVG projection of the actual procedural mesh descriptors, only
// for UI thumbnails. The world uses volumetric geometry, never this image.
export function landmarkThumbnail(kind){
 const parts=landmarkParts({kind},0,0,0).filter(p=>!p.detail),project=([x,y,z])=>[52+(x-z)*1.45,76+(x+z)*.7-y*1.55];
 const face=(v,color,opacity)=>`<polygon points="${v.map(q=>project(q).map(n=>n.toFixed(1)).join(',')).join(' ')}" fill="${color}" opacity="${opacity}"/>`;
 const svg=parts.sort((a,b)=>(a.position[0]+a.position[2])-(b.position[0]+b.position[2])).map(p=>{const [x,y,z]=p.position,[w,h,d]=p.scale.map(v=>v/2),a=[x-w,y+h,z-d],b=[x+w,y+h,z-d],c=[x+w,y+h,z+d],f=[x-w,y+h,z+d];return face([a,b,c,f],p.color,1)+face([b,c,[x+w,y-h,z+d],[x+w,y-h,z-d]],p.color,.8)+face([c,f,[x-w,y-h,z+d],[x+w,y-h,z+d]],p.color,.95);}).join('');
 return `<svg class="building-preview" viewBox="0 0 104 84" aria-hidden="true">${svg}</svg>`;
}
