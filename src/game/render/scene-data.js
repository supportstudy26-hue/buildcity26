import {buildingParts} from './building-designs.js';
import {SIZE,isRoad,neighbors,CATALOG} from '../core.js';
import {serviceKind} from '../../config/catalog.js';
import {CELL_METERS} from '../../config/simulation.js';
import {surfaceHeight,terrainHeight,cellHeights} from '../systems/terrain.js';
export const REGION=16;
export const noise=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const palettes={residential:['#e9d3ac','#bad5c5','#e5bfa1','#c8d9df'],commercial:['#8cb8c4','#a8c8bc','#d9b087'],industrial:['#d3c29e','#b5bec1'],school:['#f1c893'],clinic:['#f0ded8'],fire:['#d3947a'],police:['#9bb9ce'],power:['#bcc7b3'],water:['#88b4bd'],sewage:['#8db7ae'],waste:['#b7bc9e'],bus:['#d8bb8d']};
export function overlayColor(t,layer){
  if(layer==='traffic'&&isRoad(t))return t.trafficLoad>t.trafficCapacity?'#d66852':t.trafficLoad>t.trafficCapacity*.6?'#d3aa60':'#6ea99a';
  if(layer==='power'&&t.kind&&!isRoad(t))return t.power||t.kind==='power'?'#dccc75':'#c97961';
  if(layer==='water'&&t.kind&&!isRoad(t))return t.water||t.kind==='water'?'#7dbcd7':'#c97961';
  if(layer==='sewage'&&t.kind==='residential')return t.sewage?'#69b4b3':'#c97961';
  if(layer==='garbage'&&t.kind==='residential')return t.garbage>30?'#ce9e65':'#82bba4';
  if(layer==='pollution')return t.pollution>30?'#cba074':null;
  if(layer==='services'&&t.kind==='residential')return t.services?.length>=3?'#8ac1b4':'#cc9e72';
  return null;
}
export function chunkSignature(s,x0,y0,layer){
  let text=layer;
  for(let y=y0;y<y0+REGION;y++)for(let x=x0;x<x0+REGION;x++){const t=s.tiles[y*SIZE+x];text+=`${t.kind}/${t.zone}/${t.level}/${!!t.active}/${t.fire>0}/${overlayColor(t,layer)};`;if(['waste','wasteCenter'].includes(t.kind))text+=Math.round(t.garbage||0);if(isRoad(t))text+=neighbors(y*SIZE+x).map(i=>s.tiles[i].kind).join(',');}
  return text;
}
// Roads and bridge ghosts use the same deck, joins, piers and railings.
export function roadParts(s,x,y,kind=s.tiles[y*SIZE+x].kind,layer='normal',overlay=null){
 const parts=[],i=y*SIZE+x,t=s.tiles[i],cx=(x+.5)*CELL_METERS,cz=(y+.5)*CELL_METERS,base=surfaceHeight(s,i,SIZE,kind);
 const box=(px,py,pz,w,h,d,color,detail=false,rotation=null,tile=null)=>parts.push({shape:'box',position:[px,py,pz],scale:[w,h,d],color:overlay||color,detail,rotation,tile});

      const width=kind==='avenue'?18:12,road=overlay||overlayColor({...t,kind},layer)||'#526b70';
      box(cx,base-.4,cz,width+.8,.5,width+.8,'#c7cabb',false,null,i);
      box(cx,base-.1,cz,width,.2,width,road,false,null,i);
      const links=neighbors(i).filter(ni=>isRoad(s.tiles[ni]));
      if(links.length===1||(links.length===2&&links[0]+links[1]===i*2)){
        const ni=links[0],dx=(ni%SIZE-x)*CELL_METERS,dz=(Math.floor(ni/SIZE)-y)*CELL_METERS;
        box(cx,base+.035,cz,3.8,.07,.18,'#e4d4a0',true,{yaw:Math.atan2(-dz,dx)},i);
      }
      for(const ni of links)if(ni>i){
        const nx=(ni%SIZE+.5)*CELL_METERS,nz=(Math.floor(ni/SIZE)+.5)*CELL_METERS,nh=surfaceHeight(s,ni,SIZE),dx=nx-cx,dz=nz-cz,dy=nh-base,nextWidth=s.tiles[ni].kind==='avenue'?18:12;
        // Join node edges: coplanar centre-to-centre slabs cause flickering stripes.
        const start=width/(2*CELL_METERS),end=1-nextWidth/(2*CELL_METERS),mid=(start+end)/2,length=Math.hypot(dx,dz,dy)*(end-start),yaw=Math.atan2(-dz,dx),pitch=Math.atan2(dy,CELL_METERS);
        box(cx+dx*mid,base+dy*mid-.14,cz+dz*mid,length,.28,Math.min(width,nextWidth),road,false,{yaw,pitch},i);
        box(cx+dx*mid,base+dy*mid+.035,cz+dz*mid,Math.min(3.8,length-.2),.07,.18,'#e4d4a0',true,{yaw,pitch},i);
      }
      if(t.terrain==='water'){
        const bed=terrainHeight(s.world,cx,cz);
        for(const side of [-1,1])box(cx+side*width*.35,(base+bed)/2,cz,1,base-bed,1,'#9faeab',false,null,i);
        for(const side of [-1,1])box(cx,base+.6,cz+side*(width/2+.2),20,.12,.12,'#dadac2',true,null,i);
      }

 return parts;
}
// Descriptors are original procedural components in metres, independent of GPU.
export function chunkParts(s,x0,y0,layer='normal'){
  const parts=[];
  function part(shape,x,y,z,w,h,d,color,detail=false,rotation=null,tile=null){parts.push({shape,position:[x,y,z],scale:[w,h,d],color,detail,rotation,tile});}
  const box=(x,y,z,w,h,d,color,detail=false,rotation=null,tile=null)=>part('box',x,y,z,w,h,d,color,detail,rotation,tile);
  function tree(x,z,h,size,tile){box(x,h+size*2,z,.6,size*4,.6,'#7f775b',false,null,tile);part('cone',x,h+size*6,z,size*5,size*8,size*5,'#618b69',false,null,tile);part('cone',x,h+size*8,z,size*3.6,size*5,size*3.6,'#85aa79',false,null,tile);}
  for(let y=y0;y<y0+REGION;y++)for(let x=x0;x<x0+REGION;x++){
    const i=y*SIZE+x,t=s.tiles[i],cx=(x+.5)*CELL_METERS,cz=(y+.5)*CELL_METERS,base=surfaceHeight(s,i,SIZE),n=noise(x,y);
    if(isRoad(t)){parts.push(...roadParts(s,x,y,t.kind,layer));continue;}
    if(!t.kind){
      if(t.zone)box(cx,base+.025,cz,18,.05,18,CATALOG[t.zone].color,false,null,i);
      else if(t.terrain==='grass'&&n>.88){const h=terrainHeight(s.world,cx,cz);tree(cx,cz,h,.75+noise(y,x)*.45,i);}
      continue;
    }
    // A foundation pad encloses the sloping ground below the footprint.
    const low=Math.min(...cellHeights(s.world,i,SIZE));box(cx,(base+low)/2,cz,16,Math.max(.15,base-low),16,'#c9c9b5',false,null,i);
    parts.push(...buildingParts(t,x,y,cx,cz,base,overlayColor(t,layer),i));
  }
  for(const c of s.contracts)if(c.status==='building'&&c.tile%SIZE>=x0&&c.tile%SIZE<x0+REGION&&Math.floor(c.tile/SIZE)>=y0&&Math.floor(c.tile/SIZE)<y0+REGION){const x=(c.tile%SIZE+.5)*20,z=(Math.floor(c.tile/SIZE)+.5)*20,h=surfaceHeight(s,c.tile,SIZE);box(x,h+.1,z,18,.2,18,'#d4b387',false,null,c.tile);box(x,h+2,z,4,4,4,'#bca27a',false,null,c.tile);}
  return parts;
}
export function terrainArrays(s,x0,y0){
  const positions=[],colors=[];
  for(let y=y0;y<y0+REGION;y++)for(let x=x0;x<x0+REGION;x++){
    const i=y*SIZE+x,t=s.tiles[i],h=cellHeights(s.world,i,SIZE),p=[[x*20,h[0],y*20],[(x+1)*20,h[1],y*20],[x*20,h[2],(y+1)*20],[(x+1)*20,h[3],(y+1)*20]];
    for(const k of [0,2,1,1,2,3]){
      const [px,py,pz]=p[k],v=noise(Math.floor(px/80),Math.floor(pz/80))*.025;
      const coast=h.some(height=>height<s.world.waterHeight+.6);
      const color=t.terrain==='water'?[.33,.44,.42]:t.terrain==='sand'?[.77+v,.74+v,.57+v]:coast?[.59+v,.65+v,.46+v]:[.51+v,.64+v,.44+v];
      positions.push(px,py,pz);colors.push(...color);
    }
  }
  return {positions,colors};
}
