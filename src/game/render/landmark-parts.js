import {LANDMARKS} from '../../config/landmarks.js';
export function landmarkDesign(t){const d=LANDMARKS[t.kind];return d?{...d,id:t.kind,name:d.name,width:18,depth:18,footprint:[20,20],entrance:[0,0,8.5],procedural:true}:null;}
export function landmarkParts(t,cx,cz,base,overlay=null,tile=null){
 const d=LANDMARKS[t.kind];if(!d)return[];const parts=[];
 const add=(shape,x,y,z,w,h,depth,color,detail=false,rotation=null,material='concrete')=>parts.push({shape,position:[cx+x,base+y,cz+z],scale:[w,h,depth],color:overlay||color,detail,rotation,material,role:'landmark-'+t.kind,tile});
 const box=(x,y,z,w,h,depth,color='#d7d6c1',detail=false)=>add('box',x,y,z,w,h,depth,color,detail);
 const cylinder=(x,y,z,w,h,color='#9daf9f',detail=false)=>add('cylinder',x,y,z,w,h,w,color,detail);
 const tree=(x,z)=>{cylinder(x,1.3,z,.3,2.4,'#806d52',true);add('ico',x,3.2,z,2.7,3.6,2.7,'#58865e',true,null,'leaf');};
 const bench=(x,z)=>{box(x,.65,z,2.4,.18,.75,'#ac8c61',true);box(x,1,z+.28,2.4,.65,.12,'#ac8c61',true);for(const dx of [-.9,.9])box(x+dx,.3,z,.13,.6,.55,'#5f736d',true);};
 box(0,.12,0,18,.24,18,'#cbd0c1');box(0,.3,8,3.6,.14,2,'#e1ddcd');
 switch(t.kind){
 case 'clockTower':{
  box(0,.7,0,9,1.2,9);box(0,10.4,0,4.5,18.2,4.5,'#d2bf99');box(0,19.8,0,7,1.6,7);box(0,21.2,0,5.7,1.2,5.7,'#e3d9c3');add('gable',0,23,0,7.5,2,7.5,'#ab6246',false,null,'tile');
  for(const side of [-1,1]){add('cylinder',0,18,side*2.31,2.6,.14,2.6,'#f2ead3',true,{pitch:Math.PI/2});box(0,18,side*2.42,.11,1.8,.08,'#465e59',true);box(.43,18,side*2.43,.9,.1,.08,'#465e59',true);}tree(-6,-5);tree(6,-5);break;
 }
 case 'observationTower':{
  cylinder(0,1,0,10,1.8);cylinder(0,12.5,0,3.5,23,'#b9c7bf');cylinder(0,24,0,11,1.3);cylinder(0,26,0,8.5,2.6,'#87afb2');cylinder(0,27.6,0,10,.6);add('cone',0,29,0,10,2,10,'#577e74');for(const x of [-5,5])bench(x,5);break;
 }
 case 'cityTower':{
  box(0,1,0,11,1.8,11);for(const [x,z] of [[-3,-3],[3,-3],[-3,3],[3,3]]){box(x,15.5,z,1.2,29,1.2,'#729b91');box(x,9,z,1.8,.5,1.8,'#d9cfae',true);}
  for(const y of [12,24,29])cylinder(0,y,0,9,.7,'#a8beb1');add('ico',0,32,0,6,6,6,'#bb9c5d');box(0,35.5,0,.2,1,.2,'#65776a');break;
 }
 case 'flagpole':{
  for(const [w,y,h] of [[8,.5,.6],[6,1,.4],[3,1.6,.8]])box(0,y,0,w,h,w);cylinder(0,9,0,.25,14,'#8c9c91');add('sphere',0,15.9,0,.2,.2,.2,'#d5b66d',true);box(2.1,14,0,4.2,2.2,.09,'#c64e45');add('ico',2.1,14,.07,.6,.6,.08,'#edc760',true);break;
 }
 case 'monument':{
  box(0,.7,0,10,1.2,10);box(0,2,0,5.2,1.4,5.2,'#919f91');box(0,3.7,0,3.5,2,3.5,'#aab7a9');add('ico',0,6.7,0,3.8,4.6,3.2,'#846e4c');for(const x of [-6,6])tree(x,-5);break;
 }
 case 'welcomeGate':{
  for(const x of [-6.5,6.5]){box(x,4,0,2,7.6,2,'#cbbd99');add('gable',x,8.2,0,3,1.2,3,'#9f6149');}box(0,7.6,0,13,1.7,1.8,'#427d73');add('gable',0,9,0,16,2,3.6,'#ab6246');box(0,7.6,1,7,.5,.12,'#dacc9e',true);break;
 }
 case 'fountain':{
  cylinder(0,.65,0,12,1);cylinder(0,1.21,0,10.7,.1,'#569dba');cylinder(0,1.8,0,3,1.4);cylinder(0,2.5,0,6,.3);cylinder(0,2.72,0,5.4,.1,'#569dba');cylinder(0,3.1,0,.4,.8,'#96c6ce');for(const x of [-6,6])bench(x,5);break;
 }
 case 'flowerBed':{
  for(const x of [-4,4])for(const z of [-4,4]){box(x,.4,z,5,.4,5,'#b2b79c');box(x,.65,z,4.3,.15,4.3,'#678d63');for(const [dx,dz,color] of [[-1,-1,'#e6ba73'],[1,1,'#cf887f'],[-1,1,'#af9fc4']])add('ico',x+dx,1,z+dz,1.5,.6,1.5,color,true);}break;
 }
 case 'benches':{for(const x of [-4,4])for(const z of [-3,3])bench(x,z);box(0,.38,0,2,.4,12,'#e0d8bf');break;}
 case 'streetLamp':{for(const x of [-5,5]){cylinder(x,3,0,.2,5.8,'#6c8179');box(x,5.9,0,2,.16,.2,'#6c8179');for(const side of [-1,1])add('box',x+side*.8,5.8,0,.6,.2,.6,'#f1e4b6',true,null,'glow');}break;}
 }
 return parts;
}
