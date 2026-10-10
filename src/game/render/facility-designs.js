import {BUILDING_ART,artForBuilding} from '../../config/building-art.js';
const heights={smallPower:8.6,power:8.6,smallWater:6.3,water:17,waterPump:8.3,smallSewage:5.8,sewage:7,treatmentPlant:8,waste:6.3,wasteCenter:9,school:8.1,secondarySchool:11,university:14.3,clinic:8,hospital:19,fire:10.3,fireCenter:14.3,police:11,policeCenter:18,bus:8,busStop:3.6,park:7,plaza:5.8,sportsPark:5.8};
export function facilityDesign(t){const art=artForBuilding(t.kind);return heights[t.kind]?{id:t.kind,artId:BUILDING_ART[t.kind],name:art.nameVi,height:heights[t.kind],width:18,depth:18,entrance:[0,0,8.5],footprint:[20,20]}:null;}
// Low-poly metre-scale reconstructions of the supplied PNG references. Shared primitives,
// no baked vehicles/occupancy, no change to service capacity or saved state.
export function facilityParts(t,cx,cz,base,overlay=null,tile=null){
 const design=facilityDesign(t);if(!design)return[];
 const parts=[],cream=overlay||'#e7dfc9',teal=overlay||'#377f85',roof='#ab6246',steel='#849599',glass='#76b0b4',green='#73966c',pave='#c7c5b4';
 const add=(shape,x,y,z,w,h,d,color,detail=false,rotation=null)=>parts.push({shape,position:[cx+x,base+y,cz+z],scale:[w,h,d],color:overlay||color,detail,rotation,tile});
 const box=(x,y,z,w,h,d,color=cream,detail=false)=>add('box',x,y,z,w,h,d,color,detail);
 const cyl=(x,y,z,w,h,color=steel,detail=false)=>add('cylinder',x,y,z,w,h,w,color,detail);
 const cap=(x,y,z,w,d,color=roof)=>add('gable',x,y+1,z,w,2,d,color);
 const hall=(x,z,w,d,h,pitched=true)=>{box(x,h/2+.3,z,w,h,d);if(pitched)cap(x,h+.3,z,w+.5,d+.5);else box(x,h+.5,z,w+.4,.4,d+.4,teal);for(let f=0;f<Math.floor(h/3);f++){add('window',x,2.2+f*3,z+d/2+.06,w*.7,1.3,.1,glass,true);add('window',x+w/2+.06,2.2+f*3,z,.1,1.3,d*.65,glass,true);}};
 const tree=(x,z)=>{box(x,1.6,z,.35,3,.35,'#827357',true);add('ico',x,3.8,z,3.2,4,3.2,green);};
 const entry=()=>{box(0,.3,7,3.6,.3,2.6,pave);box(0,.5,6.6,3,.25,1.8,'#e0d5bc',true);};
 const pipe=(x,y,z,w,h,d)=>box(x,y,z,w,h,d,teal);
 const tank=(x,z,size=5,y=.4,height=2)=>{cyl(x,y+height/2,z,size,height,steel);cyl(x,y+height+.07,z,size-.65,.12,'#578f97');box(x,y+height+.25,z,size,.2,.3,cream,true);};
 box(0,.1,0,18,.2,18,pave);
 switch(t.kind){
 case 'smallPower':case 'power':{
  hall(-5,-2,4,7,4);const large=t.kind==='power';
  for(const x of large?[0,5]:[2]){box(x,1.9,-1,3.2,3,4.4,steel);for(const z of [-2.5,0]){cyl(x,4,z,.7,1.1,'#945e47');cyl(x,4.75,z,.35,.5,cream,true);}for(const side of [-1,1])box(x+side*1.7,2,-1,.15,2.8,4,'#637c7c',true);}
  for(const x of [-1,7]){box(x,4.6,-5,.25,8,.25,steel);box(x,7.8,-2,.25,.25,6.6,steel);}box(3,7.8,-5,8,.25,.25,'#a9b5ac');
  for(const z of [-6,-4])box(2,.8,5+z*.08,3.3,1.5,1.4,teal,true);entry();break;
 }
 case 'smallWater':case 'waterPump':{
  hall(-2,-3,9,6,t.kind==='smallWater'?4:6);entry();const count=t.kind==='smallWater'?2:3;
  for(let j=0;j<count;j++){const x=-5+j*4;pipe(x,1.1,4,.8,1.8,.8);pipe(x,1.8,2,.8,.8,4);cyl(x,2.6,2,1.6,1.4,teal);cyl(x,3.45,2,1,.3,steel,true);}
  if(t.kind==='waterPump'){cyl(5,3,-3,3,5,steel);pipe(5,1,2,1,1,8);}break;
 }
 case 'water':{
  for(const x of [-3,3])for(const z of [-3,3]){box(x,6,z,.65,12,.65,cream);box(x,5.5,0,.3,.3,6,steel,true);}
  cyl(0,12.5,0,9,4,cream);cyl(0,12,0,9.08,1.3,teal);add('cone',0,15.1,0,9,1.4,9,cream);cyl(0,16,0,1.6,.5,teal,true);
  hall(5,5,4,4,3);pipe(3,5,3,.65,10,.65);entry();break;
 }
 case 'smallSewage':case 'sewage':case 'treatmentPlant':{
  const advanced=t.kind==='treatmentPlant';hall(0,-5,advanced?12:7,4,advanced?5:3.5);entry();
  if(advanced){for(const x of [-4.5,4.5]){box(x,1.1,1,7,1.5,6,steel);box(x,1.9,1,6.3,.12,5.3,'#719a89');for(const z of [-1,1,3])box(x,2,z,6,.15,.2,cream,true);}cyl(6,3,-5,2.3,4,steel);}
  else{tank(-4,1,t.kind==='smallSewage'?5:7);tank(4,2,t.kind==='smallSewage'?5:7);if(t.kind==='sewage')cyl(-6,4,-5,2,6,steel);}
  pipe(0,1,2,.6,1,8);break;
 }
 case 'waste':case 'wasteCenter':{
  const large=t.kind==='wasteCenter';hall(-1,-2,large?13:10,9,large?6:4);
  for(const x of [-4,1]){box(x,1.7,2.6,3,3,.15,'#425b60');box(x,.35,4.5,3,.5,3,pave);}
  box(6,2,3,2.6,3.7,6,steel);box(4,2.6,1,5,.4,1,'#597d78',false);if(large){cyl(5,5,-4,3,8,steel);box(-5,1,6,4,1.5,2,teal);}
  // Bin fill follows accumulated garbage; the empty model never invents waste piles.
  const fill=Math.min(1,Math.max(0,(t.garbage||0)/100));if(fill)box(-4,.7+fill*.5,6,3,fill,2,'#978671',true);entry();break;
 }
 case 'school':case 'secondarySchool':case 'university':{
  const university=t.kind==='university',h=university?10:t.kind==='secondarySchool'?8:5.8;
  hall(-5,-1,5,12,h);hall(4,-5,8,4,h);if(university){hall(5,2,4,9,7);hall(0,-3,5,5,12);for(const x of [-1.8,0,1.8])box(x,2,1,.35,4,.35,cream);}
  else{box(3,.3,3,8,.2,7,t.kind==='secondarySchool'?'#6d9a84':'#cba97a');for(const x of [-.5,6.5])box(x,.44,3,.12,.1,6,'#ebe3cb',true);}
  box(0,3,4,.15,6,.15,steel,true);box(.8,5.5,4,1.5,.8,.1,'#b96a4d',true);tree(-7,6);entry();break;
 }
 case 'clinic':case 'hospital':{
  const hospital=t.kind==='hospital',h=hospital?16:5.8;
  hall(-1,-2,9,8,h,false);hall(5,2,4,9,hospital?8:4,false);if(hospital){hall(-6,1,4,10,8,false);add('window',-1,h/2,2.1,2.5,h-.7,.12,glass);box(-1,h+.9,-1,4,1.2,3,steel,true);}
  box(0,3,5,7,.25,4,teal);for(const x of [-3,3])box(x,1.5,6.2,.3,3,.3,cream,true);
  // Original four-petal care emblem, not a copied protected medical mark.
  for(const [x,y] of [[-.45,0],[.45,0],[0,-.45],[0,.45]])add('ico',x,4.8+y,2.2,.65,.65,.22,teal);
  tree(-7,6);entry();break;
 }
 case 'fire':case 'fireCenter':{
  const large=t.kind==='fireCenter';hall(0,-2,14,9,5);hall(-5,-2,4,5,large?12:8);
  for(const x of large?[-3,1,5]:[0,5]){box(x,2.1,2.57,3.3,3.6,.15,'#b9523f');add('window',x,3,2.7,2.3,.45,.1,glass,true);box(x,.26,5,3,.12,4,'#e0c478',true);}
  if(large){for(let y=2;y<11;y+=2)box(-5,y,.57,1.7,1.1,.12,steel,true);box(4,6.6,-2,3,1,3,cream);}
  entry();break;
 }
 case 'police':case 'policeCenter':{
  const large=t.kind==='policeCenter';hall(-1,-2,8,9,large?14:7,false);hall(5,1,4,6,4,false);
  add('window',-1,large?7:4,2.57,2.1,large?11:5,.14,glass);box(0,2.8,4.5,6,.3,3,'#47728d');box(0,4.5,2.75,1.3,1.7,.15,'#e2bc6b',true);
  box(1,design.height-2,-2,.15,4,.15,steel);box(1,design.height-.1,-2,3,.18,.18,steel,true);entry();break;
 }
 case 'bus':{
  hall(-1,-2,13,10,5);hall(6,0,3,7,4,false);
  for(const x of [-5,-1,3]){box(x,2,3.07,3.1,3.7,.15,'#405e63');box(x,.23,6,2.7,.1,4,'#e0c478',true);}box(0,5.3,4,12,.3,2,teal);entry();break;
 }
 case 'busStop':{
  box(0,2.8,0,9,.25,4,teal);for(const x of [-4,4])box(x,1.4,0,.25,2.8,.25,steel);add('window',0,1.4,-1.7,8,2.7,.1,glass);box(0,.8,0,6,.2,1,'#a3865e');box(5.5,1.8,0,.3,3.6,.3,steel);box(5.5,3,0,1.5,1.1,.2,cream);break;
 }
 case 'park':case 'plaza':case 'sportsPark':{
  box(0,.25,0,17,.25,17,t.kind==='plaza'?pave:green);box(0,.42,0,2,.1,17,'#e2d0ae');box(0,.43,0,17,.1,2,'#e2d0ae');
  if(t.kind==='plaza'){cyl(0,.65,0,7,.45,cream);cyl(0,.92,0,6,.12,'#72b2ba');cyl(0,1.4,0,2,.9,cream);cyl(0,2,0,.25,.6,'#b5d7d4');}
  else if(t.kind==='sportsPark'){box(1,.6,-1,10,.1,7,'#578f91');for(const x of [-3.5,5.5]){box(x,1.3,-1,.15,1.5,3,cream,true);box(x,2,-1,.15,.15,3,cream,true);}box(1,.7,-1,.1,.1,6,cream,true);}
  else{cyl(0,.65,0,4,.5,cream);cyl(0,.95,0,3,.1,green);}
  for(const [x,z] of [[-6,-6],[6,6],[-6,6]])tree(x,z);
  for(const [x,z] of [[4,5],[-4,-5]]){box(x,.9,z,3,.25,.8,'#a78c63',true);box(x,1.2,z-.3,3,.6,.15,'#a78c63',true);}break;
 }
 }
 if(t.fire>0)add('cone',0,design.height+2,0,2,5,2,'#e69355');
 return parts;
}
