import {facilityDesign,facilityParts} from './facility-designs.js';
import {artForBuilding} from '../../config/building-art.js';
// Original modular architecture. Coordinates select a stable design; no saved data is rewritten.
const homes=[
  {id:'townhouse',name:'Nhà phố ban công',width:8.2,depth:12,height:8.4,roof:'flat'},
  {id:'tile-house',name:'Nhà mái ngói',width:12.4,depth:10,height:5.2,roof:'gable'},
  {id:'garden-villa',name:'Biệt thự sân vườn',width:10,depth:10,height:6.4,roof:'gable'},
  {id:'courtyard',name:'Nhà sân trong',width:8,depth:12,height:5.8,roof:'flat'}
];
const shops=[
  {id:'shop-house',name:'Phố cửa hàng',width:10,depth:11,height:9,roof:'flat'},
  {id:'market-hall',name:'Nhà chợ mái đôi',width:14,depth:12,height:5.4,roof:'gable'},
  {id:'glass-office',name:'Văn phòng kính',width:10,depth:10,height:13,roof:'flat'}
];
const factories=[
  {id:'sawtooth',name:'Xưởng mái đôi',width:14,depth:13,height:6,roof:'gable'},
  {id:'warehouse',name:'Kho hàng',width:14,depth:13,height:7,roof:'gable'},
  {id:'processing',name:'Xưởng chế biến',width:9,depth:13,height:6,roof:'flat'}
];
const towers=[
  {id:'terraced-apartment',name:'Chung cư giật cấp',width:12,depth:12,roof:'flat'},
  {id:'twin-apartment',name:'Chung cư hai khối',width:13,depth:11,roof:'flat'},
  {id:'balcony-apartment',name:'Chung cư ban công',width:10,depth:13,roof:'flat'}
];
const walls=['#f0dfc1','#cee2d7','#e5c6ac','#d3e2e7','#e9e8dc','#dfd1b8'];
const roofs=['#b9694c','#78919a','#bd9970','#667e83'];
export const ARCHITECTURE_NAMES=Object.freeze([...homes,...shops,...factories,...towers].map(d=>d.name));
export function designHash(x,y){let n=(Math.imul(x+19,374761393)^Math.imul(y+37,668265263))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return(n^(n>>>16))>>>0;}
export function buildingDesign(t,x,y){
  const hash=designHash(x,y),level=Math.max(1,Number(t.level)||1);
  const list=t.kind==='residential'?(level>=3?towers:homes):t.kind==='commercial'?shops:t.kind==='industrial'?factories:null;
  if(!list)return facilityDesign(t);
  const item=list[hash%list.length],floors=t.kind==='residential'&&level>=3?Math.min(8,level+1):t.kind==='residential'&&level===2?3:null;
  return{...item,artId:artForBuilding(t.kind,item.id).id,footprint:[20,20],entrance:[0,0,8.5],height:floors?floors*3.1:item.height,floors,wall:walls[(hash>>>4)%walls.length],roofColor:roofs[(hash>>>9)%roofs.length],accent:['#529d98','#d89159','#7e9db4','#b56a53'][(hash>>>14)%4]};
}
export function buildingParts(t,x,y,cx,cz,base,overlay=null,tile=null){
  const design=buildingDesign(t,x,y);if(!design)return[];if(facilityDesign(t))return facilityParts(t,cx,cz,base,overlay,tile);
  const parts=[],{id,width:w,depth:d,height:h,roof,roofColor,accent}=design,color=overlay||design.wall;
  const add=(shape,dx,z,dz,width,height,depth,tint,detail=false,rotation=null)=>parts.push({shape,position:[cx+dx,base+z,cz+dz],scale:[width,height,depth],color:tint,detail,rotation,tile});
  const box=(dx,z,dz,width,height,depth,tint=color,detail=false)=>add('box',dx,z,dz,width,height,depth,tint,detail);
  const glass=(dx,z,dz,width,height,depth)=>add('window',dx,z,dz,width,height,depth,'#c1dce1',true);
  const cap=(dx,z,dz,width,depth,pitched=roof==='gable')=>add(pitched?'gable':'box',dx,z+(pitched?1.35:.2),dz,width,pitched?2.7:.4,depth,roofColor);
  const front=d/2+.07;
  const windows=(count=Math.min(7,Math.max(1,Math.floor(h/3))))=>{
    // Two continuous strips per floor replace dozens of small window meshes.
    for(let f=0;f<count;f++){glass(0,2+f*3.1,front,w*.65,1.15,.12);glass(w/2+.07,2+f*3.1,0,.12,1.15,d*.62);}
  };
  if(id==='courtyard'){
    box(-3.2,h/2,0,5.5,h,12);cap(-3.2,h,0,6.1,12.6,false);
    box(2.5,h*.38,-3,6.5,h*.76,6);cap(2.5,h*.76,-3,7.1,6.6,false);
    box(2.4,.12,3.2,6.7,.24,6.5,'#d8cfb7');box(2.4,.24,3.2,3.2,.18,2.4,'#8ead86');
    glass(-3.2,2,6.06,3.2,1.3,.12);glass(2.5,2,.06,4,1.3,.12);
    box(-3.2,h*.7,6.4,5.8,.2,1.1,accent);box(5.9,1,4.8,.7,2,.7,'#779973',true);
  }else if(id==='twin-apartment'){
    box(0,1.5,0,14,3,13,'#d0d7ce');box(-3.5,(h+3)/2,0,5,h-3,10);box(3.5,(h*.8+3)/2,0,5,h*.8-3,10);
    cap(-3.5,h,0,5.8,10.8,false);cap(3.5,h*.8,0,5.8,10.8,false);
    for(let f=0;f<Math.floor((h-3)/3.1);f++){glass(-3.5,4.5+f*3.1,5.06,3.5,1.2,.12);if(4.5+f*3.1<h*.8)glass(3.5,4.5+f*3.1,5.06,3.5,1.2,.12);glass(6.07,4.5+f*3.1,0,.12,1.2,7);}
    box(0,2,6.6,3,1.4,.3,accent);
  }else if(id==='terraced-apartment'){
    const lower=h*.65;box(0,lower/2,0,w,lower,d);cap(0,lower,0,w+.6,d+.6,false);
    box(-1,(h+lower)/2,-1,w-3,h-lower,d-3);cap(-1,h,-1,w-2.4,d-2.4,false);
    for(let f=0;f<Math.floor(lower/3.1);f++){glass(0,2+f*3.1,front,w*.7,1.2,.12);glass(w/2+.07,2+f*3.1,0,.12,1.2,d*.68);}
    glass(-1,lower+1.5,3.56,6,1.2,.12);glass(3.56,lower+1.5,-1,.12,1.2,6);
    box(0,lower+.55,5.5,11,.6,.3,'#c7d4ce',true);box(4.5,lower+.7,3.5,1.4,1.1,1.4,'#86a576',true);
  }else if(id==='sawtooth'){
    box(0,h/2,0,w,h,d);cap(-3.5,h,0,7.1,13.6,true);cap(3.5,h,0,7.1,13.6,true);
    for(const side of [-1,1]){box(side*3.6,2.1,front,4.6,4.2,.16,'#70888b');glass(side*3.6,4.8,front+.03,4.5,.7,.12);}
    box(6,h+1,-4,1.3,6,1.3,'#aab4b0');box(-5,.7,7.7,2.6,1.4,1.8,'#bc9870',true);
  }else if(id==='warehouse'){
    box(0,h/2,0,w,h,d);cap(0,h,0,w+.8,d+.8,true);
    box(0,2.2,front,6.4,4.4,.16,'#7e979d');box(0,.15,8,8,.3,2.8,'#aeb7ac');
    glass(0,5.7,front,w*.7,.65,.12);box(-5.5,2,front+.15,.65,4,.4,accent);box(5.5,2,front+.15,.65,4,.4,accent);
    for(const dx of [-4,4])box(dx,.65,7.8,1.5,1.3,1.5,'#bd996e',true);
  }else if(id==='processing'){
    box(-2,h/2,0,w,h,d);cap(-2,h,0,w+.7,d+.7,false);
    for(const z of [-3.3,3.3]){add('cylinder',5.4,3,z,3.6,6,3.6,'#b2c7c3');add('cone',5.4,6.8,z,3.6,1.6,3.6,'#739497');}
    glass(-2,3,front,6,1.2,.12);box(-4.4,h+2,-4,1,5,1,'#b7bcb4');box(0,1,7,4,2,1,'#9eaa9d',true);
  }else{
    box(0,h/2,0,w,h,d);cap(0,h,0,w+.8,d+.8);
    windows();box(-w*.26,1.2,front+.05,1.5,2.4,.16,'#56767c',true);
    if(id==='townhouse'||id==='balcony-apartment'){
      for(let f=0;f<Math.max(1,Math.min(4,Math.floor(h/6)));f++){const z=3.1+f*6.2;box(0,z,front+.75,w*.86,.25,1.7,'#e6ded0');box(0,z+.55,front+1.5,w*.86,.7,.16,accent,true);}
      box(-w/2+.35,h*.5,front+.12,.7,h,.3,accent);
      if(roof==='flat'){box(0,h+.7,front,w,.8,.25,'#dfe7dc',true);box(w/2,h+.7,0,.25,.8,d,'#dfe7dc',true);}
    }
    if(id==='tile-house'||id==='garden-villa'){
      box(0,2.8,front+1.3,w*.88,.25,2.8,accent);for(const side of [-1,1])box(side*w*.36,1.4,front+2.4,.25,2.8,.25,'#e3d4b7',true);
      if(id==='garden-villa'){box(4.2,2.1,-3.1,5.3,4.2,6.4);cap(4.2,4.2,-3.1,6,7,true);box(-5.8,.4,5.8,2.1,.8,2.1,'#92af7c',true);}
    }
    if(id==='shop-house'){
      box(0,2.9,front+1,w,.3,2.1,accent);for(let j=0;j<4;j++)box(-w/2+1.25+j*w/4,3.09,front+1,w/8,.1,2.1,'#efe2bd',true);
      glass(0,1.4,front+.03,w*.75,2,.14);box(0,4,front+.16,6,.9,.25,'#e5bd75');
    }
    if(id==='market-hall'){box(0,2.5,front+1.1,14,.25,2.2,accent);for(const side of [-1,1])glass(side*4,1.3,front,4,2.2,.14);box(0,1.5,front+.1,1,3,.3,'#eee0c5');}
    if(id==='glass-office'){glass(0,h/2,front,w*.8,h-1,.14);glass(w/2+.08,h/2,0,.14,h-1,d*.8);box(-w/2+.45,h/2,front+.16,.9,h,.35,accent);box(0,h+1.1,0,5,1.6,5,'#c6d5d4');}
  }
  if(t.fire>0)add('cone',0,h+2,0,2,5,2,'#e69355');
  return parts;
}
