import {roadProfile} from '../../config/road-profiles.js';
import {SIZE,neighbors,isRoad} from '../systems/world.js';
import {surfaceHeight} from '../systems/terrain.js';
// Buildings retain their save IDs and footprint. Their local +Z doorway faces
// the adjacent connected road; decoration never changes navigation/collision.
export function orientBuildingToRoad(s,i,parts,base){
 const x=i%SIZE,y=Math.floor(i/SIZE),cx=(x+.5)*20,cz=(y+.5)*20;
 const candidates=neighbors(i).filter(n=>isRoad(s.tiles[n])).sort((a,b)=>Number(s.tiles[b].connected)-Number(s.tiles[a].connected)||a-b);
 if(!candidates.length)return parts;
 const road=candidates[0],dx=road%SIZE-x,dz=Math.floor(road/SIZE)-y,yaw=Math.atan2(dx,dz),cos=Math.cos(yaw),sin=Math.sin(yaw);
 const rotated=parts.map(p=>{const px=p.position[0]-cx,pz=p.position[2]-cz;return {...p,position:[cx+px*cos+pz*sin,p.position[1],cz-px*sin+pz*cos],rotation:{...p.rotation,yaw:(p.rotation?.yaw||0)+yaw}};});
 const width=roadProfile(s.tiles[road]).width,sidewalk=s.tiles[road].terrain==='water'?0:roadProfile(s.tiles[road]).sidewalk,end=20-width/2-sidewalk,start=8.8,length=end-start;
 if(length>.1){const roadBase=surfaceHeight(s,road,SIZE)+.16,dy=roadBase-base,mid=(start+end)/2;rotated.push({shape:'box',position:[cx+dx*mid,base+dy/2+.13,cz+dz*mid],scale:[Math.hypot(length,dy),.16,2.2],rotation:{yaw:Math.atan2(-dz,dx),pitch:Math.atan2(dy,length)},color:'#d6d3c1',detail:false,material:'concrete',role:'road-connected-entry',tile:i});}
 return rotated;
}
export function streetFurniture(s,i,base,width){
 const t=s.tiles[i];if(t.terrain==='water'||(roadProfile(t)?.trees?i%2!==0:i%4!==0))return[];
 const x=i%SIZE,y=Math.floor(i/SIZE),cx=(x+.5)*20,cz=(y+.5)*20,parts=[];
 const add=(shape,px,py,pz,w,h,d,color,role,material='concrete')=>parts.push({shape,position:[px,py,pz],scale:[w,h,d],color,role,material,detail:true,tile:i});
 // Sparse road-side detail is outside lane centres and away from junctions.
 const ns=neighbors(i).filter(n=>isRoad(s.tiles[n]));if(ns.length!==2||ns[0]+ns[1]!==i*2)return[];
 const eastWest=ns[0]%SIZE!==x,off=width/2+(t.kind==='avenue'?.5:2.2),a=cx+(eastWest?0:off),b=cz+(eastWest?off:0);
 add('cylinder',a,base+3,b,.15,6,.15,'#74847f','streetlamp-pole','metal');
 add('box',a+(eastWest?0:-.5),base+6,b+(eastWest?-.5:0),eastWest?.15:1.15,.15,eastWest?1.15:.15,'#74847f','streetlamp-arm','metal');
 add('box',a+(eastWest?0:-.9),base+5.88,b+(eastWest?-.9:0),.55,.12,.55,'#e9deb5','streetlamp-head','glow');
 if(t.kind==='road'||roadProfile(t)?.trees){
  const tx=cx+(eastWest?-3:off),tz=cz+(eastWest?off:-3);
  add('cylinder',tx,base+1.7,tz,.25,3.2,.25,'#806d53','street-tree-trunk');
  add('ico',tx,base+3.8,tz,2.4,3.1,2.4,'#518366','street-tree-crown','leaf');
  const bx=cx+(eastWest?3:off),bz=cz+(eastWest?off:3);
  add('box',bx,base+.68,bz,eastWest?1.8:.65,.16,eastWest?.65:1.8,'#ac906c','street-bench');
 }
 return parts;
}
