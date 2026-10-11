import {landmarkParts} from '../game/render/landmark-parts.js';
// A lightweight SVG projection of the actual procedural mesh descriptors, only
// for UI thumbnails. The world uses volumetric geometry, never this image.
export function landmarkThumbnail(kind){
 const parts=landmarkParts({kind},0,0,0).filter(p=>!p.detail),project=([x,y,z])=>[52+(x-z)*1.45,76+(x+z)*.7-y*1.55];
 const face=(v,color,opacity)=>`<polygon points="${v.map(q=>project(q).map(n=>n.toFixed(1)).join(',')).join(' ')}" fill="${color}" opacity="${opacity}"/>`;
 const svg=parts.sort((a,b)=>(a.position[0]+a.position[2])-(b.position[0]+b.position[2])).map(p=>{const [x,y,z]=p.position,[w,h,d]=p.scale.map(v=>v/2),a=[x-w,y+h,z-d],b=[x+w,y+h,z-d],c=[x+w,y+h,z+d],f=[x-w,y+h,z+d];return face([a,b,c,f],p.color,1)+face([b,c,[x+w,y-h,z+d],[x+w,y-h,z-d]],p.color,.8)+face([c,f,[x-w,y-h,z+d],[x+w,y-h,z+d]],p.color,.95);}).join('');
 return `<svg class="building-preview" viewBox="0 0 104 84" aria-hidden="true">${svg}</svg>`;
}

export function descriptorThumbnail(parts){
 const project=([x,y,z])=>[52+(x-z)*1.8,64+(x+z)*.85-y*2.3];
 const poly=(v,p,shade)=>`<polygon points="${v.map(q=>project(q).map(n=>n.toFixed(1)).join(',')).join(' ')}" fill="${p.color}" opacity="${shade}"/>`;
 const faces=[];
 for(const p of parts.filter(p=>!p.detail)){
  const [x,y,z]=p.position,[w,h,d]=p.scale.map(n=>n/2),yaw=p.rotation?.yaw||0;
  const vertex=(a,b,c)=>[x+a*Math.cos(yaw)+c*Math.sin(yaw),y+b,z-a*Math.sin(yaw)+c*Math.cos(yaw)];
  if(p.shape==='roadRing1'||p.shape==='roadRing2'){
   const ratio=p.shape==='roadRing1'?4.6/8.7:3.4/9.8;
   const ring=r=>Array.from({length:48},(_,n)=>project([x+w*r*Math.cos(n*Math.PI/24),y,z+d*r*Math.sin(n*Math.PI/24)]).map(v=>v.toFixed(1)).join(',')).join('L');
   faces.push({depth:x+z,svg:`<path d="M${ring(1)}Z M${ring(ratio)}Z" fill="${p.color}" fill-rule="evenodd"/>`});
  }else if(p.shape==='cylinder'){
   const top=Array.from({length:16},(_,n)=>[x+w*Math.cos(n*Math.PI/8),y+h,z+d*Math.sin(n*Math.PI/8)]);
   faces.push({depth:x+z,svg:poly(top,p,1)});
  }else{
   const a=vertex(-w,h,-d),b=vertex(w,h,-d),c=vertex(w,h,d),f=vertex(-w,h,d);
   faces.push({depth:x+z,svg:poly([b,c,vertex(w,-h,d),vertex(w,-h,-d)],p,.78)+poly([c,f,vertex(-w,-h,d),vertex(w,-h,d)],p,.9)+poly([a,b,c,f],p,1)});
  }
 }
 return `<svg class="building-preview" viewBox="0 0 104 84" aria-hidden="true">${faces.sort((a,b)=>a.depth-b.depth).map(f=>f.svg).join('')}</svg>`;
}
