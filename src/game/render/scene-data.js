import {SIZE,isRoad,neighbors,CATALOG} from '../core.js';
import {CELL_METERS} from '../../config/simulation.js';
import {surfaceHeight,terrainHeight,cellHeights} from '../systems/terrain.js';
export const REGION=8;
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
  for(let y=y0;y<y0+REGION;y++)for(let x=x0;x<x0+REGION;x++){const t=s.tiles[y*SIZE+x];text+=`${t.kind}/${t.zone}/${t.level}/${!!t.active}/${t.fire>0}/${overlayColor(t,layer)};`;if(isRoad(t))text+=neighbors(y*SIZE+x).map(i=>s.tiles[i].kind).join(',');}
  return text;
}
// Descriptors are original procedural components in metres, independent of GPU.
export function chunkParts(s,x0,y0,layer='normal'){
  const parts=[];
  function part(shape,x,y,z,w,h,d,color,detail=false,rotation=null,tile=null){parts.push({shape,position:[x,y,z],scale:[w,h,d],color,detail,rotation,tile});}
  const box=(x,y,z,w,h,d,color,detail=false,rotation=null,tile=null)=>part('box',x,y,z,w,h,d,color,detail,rotation,tile);
  function tree(x,z,h,size,tile){box(x,h+size*2,z,.6,size*4,.6,'#7f775b',false,null,tile);part('cone',x,h+size*6,z,size*5,size*8,size*5,'#618b69',false,null,tile);part('cone',x,h+size*8,z,size*3.6,size*5,size*3.6,'#85aa79',false,null,tile);}
  for(let y=y0;y<y0+REGION;y++)for(let x=x0;x<x0+REGION;x++){
    const i=y*SIZE+x,t=s.tiles[i],cx=(x+.5)*CELL_METERS,cz=(y+.5)*CELL_METERS,base=surfaceHeight(s,i,SIZE),n=noise(x,y);
    if(isRoad(t)){
      const width=t.kind==='avenue'?18:12,road=overlayColor(t,layer)||'#526b70';
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
      continue;
    }
    if(!t.kind){
      if(t.zone)box(cx,base+.025,cz,18,.05,18,CATALOG[t.zone].color,false,null,i);
      else if(t.terrain==='grass'&&n>.88){const h=terrainHeight(s.world,cx,cz);tree(cx,cz,h,.75+noise(y,x)*.45,i);}
      continue;
    }
    // A foundation pad encloses the sloping ground below the footprint.
    const low=Math.min(...cellHeights(s.world,i,SIZE));box(cx,(base+low)/2,cz,16,Math.max(.15,base-low),16,'#c9c9b5',false,null,i);
    if(t.kind==='park'){
      box(cx,base+.08,cz,16,.15,16,'#81a77a',false,null,i);box(cx,base+.18,cz,2,.1,16,'#e5d0a3',false,null,i);box(cx,base+.18,cz,16,.1,2,'#e5d0a3',false,null,i);
      tree(cx-4,cz-4,base,.8,i);tree(cx+4,cz+4,base,.9,i);box(cx+5,base+.8,cz-3,3,.3,1,'#bf9769',true,null,i);continue;
    }
    if(t.kind==='busStop'){
      box(cx,base+2.7,cz,6,.3,3,'#e2ba7b',false,null,i);box(cx-2.7,base+1.35,cz, .25,2.7,.25,'#526f75',false,null,i);box(cx+2.7,base+1.35,cz,.25,2.7,.25,'#526f75',false,null,i);box(cx,base+.7,cz,4,.25,1,'#a78e6c',true,null,i);continue;
    }
    const color=overlayColor(t,layer)||palettes[t.kind]?.[Math.floor(n*palettes[t.kind].length)]||'#cdd6bf';
    const h=t.kind==='residential'?(t.level===1?5.8+n*1.3:8+t.level*5):t.kind==='commercial'?8+n*3:t.kind==='industrial'?7:6.5;
    box(cx,base+h/2,cz,11,h,t.kind==='industrial'?14:11,color,false,null,i);
    box(cx,base+h+.3,cz,12,.6,t.kind==='industrial'?15:12,'#657d7d',false,null,i);
    box(cx,base+1.2,cz+5.55,1.4,2.4,.13,'#506e72',true,null,i);
    for(let floor=0;floor<Math.max(1,Math.floor(h/3));floor++)for(let w=0;w<3;w++){
      part('window',cx-3.5+w*3.5,base+2+floor*3,cz+5.55,1.8,1.2,.1,'#a4cbd2',true,null,i);
      part('window',cx+5.55,base+2+floor*3,cz-3.5+w*3.5,.1,1.2,1.8,'#a4cbd2',true,null,i);
    }
    if(t.kind==='residential'&&t.level===1){box(cx,base+2.8,cz+6,5,.2,1.8,'#e5bb8f',true,null,i);box(cx-4.5,base+.8,cz+6.4,1,1.5,1,'#7f9e72',true,null,i);}
    if(t.kind==='commercial'){box(cx,base+3.6,cz+6,10,.2,1.5,'#daa06c',false,null,i);box(cx,base+5,cz+5.7,5,1,.2,'#e4cf9c',true,null,i);}
    if(t.kind==='industrial'||t.kind==='power'){box(cx+4,base+h+3,cz-4,1.4,7,1.4,'#acb6b0',false,null,i);box(cx-3,base+h+1,cz,3,1.4,3,'#a2aaa4',true,null,i);}
    if(t.kind==='water'||t.kind==='sewage')part('cylinder',cx,base+h+1.3,cz,5,2.5,5,'#69a1af',false,null,i);
    if(t.kind==='clinic'){box(cx,base+h+1.4,cz,3,.6,.6,'#d57664',false,null,i);box(cx,base+h+1.4,cz,.6,3,.6,'#d57664',false,null,i);}
    if(t.kind==='school'){box(cx+5.8,base+5,cz+4,.12,10,.12,'#7e9291',true,null,i);box(cx+6.5,base+9,cz+4,1.4,.7,.05,'#daa268',true,null,i);}
    if(t.kind==='fire'||t.kind==='bus')for(let w=0;w<2;w++)box(cx-3+w*6,base+1.7,cz+5.6,3.7,3.2,.1,'#6a7e7e',false,null,i);
    if(t.fire>0)part('cone',cx,base+h+2,cz,2,5,2,'#e69355',false,null,i);
  }
  for(const c of s.contracts)if(c.status==='building'&&c.tile%SIZE>=x0&&c.tile%SIZE<x0+REGION&&Math.floor(c.tile/SIZE)>=y0&&Math.floor(c.tile/SIZE)<y0+REGION){const x=(c.tile%SIZE+.5)*20,z=(Math.floor(c.tile/SIZE)+.5)*20,h=surfaceHeight(s,c.tile,SIZE);box(x,h+.1,z,18,.2,18,'#d4b387',false,null,c.tile);box(x,h+2,z,4,4,4,'#bca27a',false,null,c.tile);}
  return parts;
}
export function terrainArrays(s,x0,y0){
  const positions=[],colors=[];
  for(let y=y0;y<y0+REGION;y++)for(let x=x0;x<x0+REGION;x++){
    const i=y*SIZE+x,t=s.tiles[i],h=cellHeights(s.world,i,SIZE),p=[[x*20,h[0],y*20],[(x+1)*20,h[1],y*20],[x*20,h[2],(y+1)*20],[(x+1)*20,h[3],(y+1)*20]];
    const color=t.terrain==='water'?[.33,.44,.42]:t.terrain==='sand'?[.77,.74,.57]:noise(x,y)>.5?[.49,.63,.43]:[.53,.66,.46];
    for(const k of [0,2,1,1,2,3]){positions.push(...p[k]);colors.push(...color);}
  }
  return {positions,colors};
}
