import {roadProfile,DIRECTION_VECTORS} from '../../config/road-profiles.js';
import {junctionParts} from './junction-parts.js';
import {orientBuildingToRoad,streetFurniture} from './street-environment.js';
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
  for(let y=y0;y<y0+REGION;y++)for(let x=x0;x<x0+REGION;x++){const t=s.tiles[y*SIZE+x];text+=`${t.kind}/${t.roadDirection}/${t.junctionControl}/${t.zone}/${t.level}/${!!t.active}/${t.development?Math.floor(t.development.work/t.development.required*4):0}/${t.upgrade?.status}/${t.fire>0}/${overlayColor(t,layer)};`;if(['waste','wasteCenter'].includes(t.kind))text+=Math.round(t.garbage||0);if(t.kind&&!isRoad(t))text+=neighbors(y*SIZE+x).map(i=>s.tiles[i].kind+'/'+s.tiles[i].connected).join(',');if(isRoad(t))text+=neighbors(y*SIZE+x).map(i=>s.tiles[i].kind).join(',');}
  return text;
}
// Roads and bridge ghosts use the same deck, joins, piers and railings.
export function roadParts(s,x,y,kind=s.tiles[y*SIZE+x].kind,layer='normal',overlay=null){
 const parts=[],i=y*SIZE+x,t=s.tiles[i],cx=(x+.5)*CELL_METERS,cz=(y+.5)*CELL_METERS,base=surfaceHeight(s,i,SIZE,kind);
 const box=(px,py,pz,w,h,d,color,detail=false,rotation=null,tile=null)=>parts.push({shape:'box',position:[px,py,pz],scale:[w,h,d],color:overlay||color,detail,rotation,tile});

      const profile=roadProfile(kind),width=profile.width,road=overlay||overlayColor({...t,kind},layer)||(kind==='pedestrian'?'#c7c6b2':kind==='bicycle'?'#507f74':'#435761');
      const sidewalk=profile.sidewalk,curb='#d6dcd2',paving='#c0cdc1';
      box(cx,base-.4,cz,width+.8,.5,width+.8,curb,false,null,i);
      box(cx,base-.1,cz,width,.2,width,road,false,null,i);
      const links=neighbors(i).filter(ni=>isRoad(s.tiles[ni]));
      // Sidewalks follow open road edges. They share the existing box batch;
      // the bridge deck keeps its own railings rather than adding land furniture.
      if(t.terrain!=='water'&&sidewalk>0)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dz,neighbor=nx>=0&&nx<SIZE&&ny>=0&&ny<SIZE?s.tiles[ny*SIZE+nx]:null;
        if(neighbor&&isRoad(neighbor))continue;
        box(cx+dx*(width/2+sidewalk/2),base+.08,cz+dz*(width/2+sidewalk/2),dx?sidewalk:width,.16,dz?sidewalk:width,paving,false,null,i);
        box(cx+dx*(width/2+.08),base+.16,cz+dz*(width/2+.08),dx?.16:width,.18,dz?.16:width,curb,true,null,i);
      }
      if(links.length===1||(links.length===2&&links[0]+links[1]===i*2)){
        const ni=links[0],dx=(ni%SIZE-x)*CELL_METERS,dz=(Math.floor(ni/SIZE)-y)*CELL_METERS;
        if(profile.lanes)box(cx,base+.035,cz,3.8,.07,.18,kind==='bicycle'?'#e8efe2':'#efe3be',true,{yaw:Math.atan2(-dz,dx)},i);
        if(profile.median){const ew=dx!==0;box(cx,base+.18,cz,ew?width:profile.median,.35,ew?profile.median:width,'#b9c9aa',false,null,i);}
        if(profile.busLane){const ew=dx!==0;for(const side of [-1,1])box(cx+(ew?0:side*5.4),base+.02,cz+(ew?side*5.4:0),ew?width:3.2,.025,ew?3.2:width,'#536f70',false,null,i);}
        if(profile.lanes>=4){const ew=dx!==0;for(const side of [-1,1])box(cx+(ew?0:side*3.6),base+.04,cz+(ew?side*3.6:0),ew?3.8:.12,.07,ew?.12:3.8,'#e4e7d6',true,null,i);}
        if(profile.oneWay){const [vx,vz]=DIRECTION_VECTORS[t.roadDirection||'east'],yaw=Math.atan2(-vz,vx);box(cx,base+.06,cz,3.6,.08,.2,'#edf0de',true,{yaw},i);for(const side of [-1,1])box(cx+vx*.9-vz*side*.35,base+.06,cz+vz*.9+vx*side*.35,1.1,.08,.18,'#edf0de',true,{yaw:yaw+side*.6},i);}
      }
      for(const ni of links)if(ni>i){
        const nx=(ni%SIZE+.5)*CELL_METERS,nz=(Math.floor(ni/SIZE)+.5)*CELL_METERS,nh=surfaceHeight(s,ni,SIZE),dx=nx-cx,dz=nz-cz,dy=nh-base,nextWidth=roadProfile(s.tiles[ni]).width;
        // Join node edges: coplanar centre-to-centre slabs cause flickering stripes.
        const start=width/(2*CELL_METERS),end=1-nextWidth/(2*CELL_METERS),mid=(start+end)/2,length=Math.hypot(dx,dz,dy)*(end-start),yaw=Math.atan2(-dz,dx),pitch=Math.atan2(dy,CELL_METERS);
        box(cx+dx*mid,base+dy*mid-.14,cz+dz*mid,length,.28,Math.min(width,nextWidth),road,false,{yaw,pitch},i);
        box(cx+dx*mid,base+dy*mid+.035,cz+dz*mid,Math.min(3.8,length-.2),.07,.18,'#efe3be',true,{yaw,pitch},i);
        if(sidewalk>0&&roadProfile(s.tiles[ni]).sidewalk>0&&t.terrain!=='water'&&s.tiles[ni].terrain!=='water')for(const side of [-1,1]){
          const offset=side*(Math.min(width,nextWidth)/2+sidewalk/2),px=-dz/CELL_METERS*offset,pz=dx/CELL_METERS*offset;
          box(cx+dx*mid+px,base+dy*mid+.08,cz+dz*mid+pz,length,.16,sidewalk,paving,false,{yaw,pitch},i);
          const edge=side*(Math.min(width,nextWidth)/2+.08);
          box(cx+dx*mid-dz/CELL_METERS*edge,base+dy*mid+.16,cz+dz*mid+dx/CELL_METERS*edge,length,.18,.16,curb,true,{yaw,pitch},i);
        }
      }
      // Markings are nearby detail, so a distant dense grid stays inexpensive.
      if(profile.modes.includes('car')&&links.length>=3&&t.terrain!=='water')for(const ni of links){
        const dx=ni%SIZE-x,dz=Math.floor(ni/SIZE)-y;
        for(let n=0;n<4;n++){
          const offset=width/2-2.15+n*.6;
          box(cx+dx*offset,base+.045,cz+dz*offset,dx?.28:width-2,.06,dz?.28:width-2,'#e9eddf',true,null,i);
        }
      }
      if(t.terrain==='water'){
        const bed=terrainHeight(s.world,cx,cz);
        for(const side of [-1,1])box(cx+side*width*.35,(base+bed)/2,cz,1,base-bed,1,'#9faeab',false,null,i);
        for(const side of [-1,1])box(cx,base+.6,cz+side*(width/2+.2),20,.12,.12,'#dadac2',true,null,i);
      }

 parts.push(...streetFurniture(s,i,base,width),...junctionParts(s,i,base,width));
 return parts;
}
// Descriptors are original procedural components in metres, independent of GPU.
export function chunkParts(s,x0,y0,layer='normal'){
  const parts=[];
  function part(shape,x,y,z,w,h,d,color,detail=false,rotation=null,tile=null){parts.push({shape,position:[x,y,z],scale:[w,h,d],color,detail,rotation,tile});}
  const box=(x,y,z,w,h,d,color,detail=false,rotation=null,tile=null)=>part('box',x,y,z,w,h,d,color,detail,rotation,tile);
  function tree(x,z,h,size,tile){const variant=tile%3;box(x,h+size*2,z,.6,size*4,.6,'#786448',false,null,tile);part(variant?'ico':'cone',x,h+size*5.5,z,size*(variant?6:5),size*(variant?6:8),size*(variant?5.5:5),['#39735a','#427b54','#4b7e5c'][variant],false,{yaw:noise(x,z)*Math.PI},tile);part(variant?'ico':'cone',x+size*.25,h+size*7.5,z,size*(variant?4.7:3.6),size*4.5,size*(variant?4.4:3.6),'#6c9c6e',false,null,tile);}
  for(let y=y0;y<y0+REGION;y++)for(let x=x0;x<x0+REGION;x++){
    const i=y*SIZE+x,t=s.tiles[i],cx=(x+.5)*CELL_METERS,cz=(y+.5)*CELL_METERS,base=surfaceHeight(s,i,SIZE),n=noise(x,y);
    if(isRoad(t)){parts.push(...roadParts(s,x,y,t.kind,layer));continue;}
    if(!t.kind){
      if(t.zone){const color=CATALOG[t.zone].color;box(cx,base+.025,cz,18,.05,18,'#b0b899',false,null,i);for(const dx of [-8.8,8.8])box(cx+dx,base+.1,cz,.2,.1,18,color,false,null,i);for(const dz of [-8.8,8.8])box(cx,base+.1,cz+dz,18,.1,.2,color,false,null,i);if(t.development){const height=.6+2.4*t.development.work/t.development.required;box(cx,base+.15,cz,12,.3,10,'#adab96',false,null,i);for(const dx of [-5.5,5.5])for(const dz of [-4.5,4.5])box(cx+dx,base+height/2,cz+dz,.3,height,.3,'#c4b497',false,null,i);}else{box(cx-6,base+1,cz+6,.12,2,.12,'#856d52',false,null,i);box(cx-6,base+1.6,cz+6,1.6,.7,.15,color,false,null,i);}}
      else if(t.terrain==='grass'&&n>.88){const h=terrainHeight(s.world,cx,cz);tree(cx,cz,h,.75+noise(y,x)*.45,i);}
      continue;
    }
    // A foundation pad encloses the sloping ground below the footprint.
    const low=Math.min(...cellHeights(s.world,i,SIZE));box(cx,(base+low)/2,cz,16,Math.max(.15,base-low),16,'#abbba5',false,null,i);
    parts.push(...orientBuildingToRoad(s,i,buildingParts(t,x,y,cx,cz,base,overlayColor(t,layer),i),base));
  }
  for(const c of s.contracts)if(c.status==='building'&&c.tile%SIZE>=x0&&c.tile%SIZE<x0+REGION&&Math.floor(c.tile/SIZE)>=y0&&Math.floor(c.tile/SIZE)<y0+REGION){const x=(c.tile%SIZE+.5)*20,z=(Math.floor(c.tile/SIZE)+.5)*20,h=surfaceHeight(s,c.tile,SIZE);box(x,h+.1,z,18,.2,18,'#d4b387',false,null,c.tile);box(x,h+2,z,4,4,4,'#bca27a',false,null,c.tile);}
  return parts;
}
export function terrainArrays(s,x0,y0){
  const positions=[],colors=[];
  for(let y=y0;y<y0+REGION;y++)for(let x=x0;x<x0+REGION;x++){
    const i=y*SIZE+x,t=s.tiles[i],h=cellHeights(s.world,i,SIZE),p=[[x*20,h[0],y*20],[(x+1)*20,h[1],y*20],[x*20,h[2],(y+1)*20],[(x+1)*20,h[3],(y+1)*20]];
    for(const k of [0,2,1,1,2,3]){
      const [px,py,pz]=p[k],v=noise(Math.floor(px/80),Math.floor(pz/80))*.012;
      const coast=h.some(height=>height<s.world.waterHeight+.6);
      const color=t.terrain==='water'?[.14,.27,.32]:t.terrain==='sand'?[.57+v,.52+v,.37+v]:coast?[.34+v,.46+v,.33+v]:[.24+v,.42+v,.34+v];
      positions.push(px,py,pz);colors.push(...color);
    }
  }
  return {positions,colors};
}
