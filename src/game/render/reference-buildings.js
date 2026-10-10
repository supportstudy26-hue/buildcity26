// Original solid geometry reconstructed from the supplied front/side references.
// All parts are instanced shared primitives; no PNG planes and no extra WebGL loop.
export function referenceBuildingParts(design,t,cx,cz,base,overlay,tile){
 const parts=[],cream=overlay||'#eadcc0',teal=overlay||'#4a9494',roof='#ba6546',dark='#496d73';
 const add=(shape,x,y,z,w,h,d,color,detail=false,role=null)=>parts.push({shape,position:[cx+x,base+y,cz+z],scale:[w,h,d],color:overlay||color,detail,role,tile});
 const box=(x,y,z,w,h,d,color=cream,detail=false,role=null)=>add('box',x,y,z,w,h,d,color,detail,role);
 const window=(x,y,z,w,h,d)=>{box(x,y,z,w+.25,h+.25,d+.08,cream,true,'window-frame');add('window',x,y,z+.05,w,h,d,'#91c6c4',true,'window');};
 const planter=(x,z,w=1.5,y=.7)=>{box(x,y,z,w,.6,.65,'#b89067',true,'planter');add('ico',x,y+.6,z,w,.9,.9,'#77965b',true,'foliage');};
 const tank=(x,y,z)=>{add('cylinder',x,y,z,1.5,1.8,1.5,'#9daeb0',false,'roof-tank');add('cylinder',x,y+.97,z,1.5,.14,1.5,'#ced2c3',true);};
 const awning=(x,y,z,w,d,color=teal)=>{box(x,y,z,w,.22,d,color,false,'awning');for(let j=0;j<5;j++)box(x-w/2+(j+.5)*w/5,y+.14,z,w/10,.08,d,'#f4e3b8',true,'awning-stripe');box(x,y-.25,z+d/2,w,.55,.12,color,true);};
 box(0,.1,0,18,.2,18,'#c9c4b1',false,'plinth');
 if(design.id==='townhouse'){
  const floors=t.development?.version===1?3+(t.level-1):t.level===1?3:t.level===2?4:6,h=floors*3;
  for(let j=0;j<3;j++){
   const x=(j-1)*4.8,col=overlay||['#e9d19c','#b5d5d4','#e6d5bd'][j];
   box(x,h/2+.2,-.8,4.6,h,11.4,col,false,'row-house');
   box(x,h+.42,-.8,4.85,.4,11.7,col,false,'cornice');
   // Three separate tiled roof pitches and usable roof terraces are visible when orbiting.
   add('gable',x,h+1.15,1.3,4.4,1.7,6.3,roof,false,'tile-roof');
   box(x,h+.75,-4.3,4.6,1.1,.22,col,false,'parapet');tank(x+.6,h+1.3,-3.8);
   for(let f=1;f<floors;f++){
    const y=f*3+1.55;window(x,y,4.97,2.9,1.8,.16);
    box(x,f*3+.17,5.55,4.4,.22,1.3,col,false,'balcony-slab');
    box(x,f*3+.78,6.18,4.1,.18,.12,dark,true,'balcony-rail');
    for(const side of [-1,1])box(x+side*1.9,f*3+.65,5.75,.12,1,1.1,dark,true,'balcony-rail');
    planter(x-.9,6,1.2,f*3+.36);
   }
   window(x,1.65,4.98,3.15,2.65,.18);awning(x,3,5.7,4.45,1.5,j===2?'#b76b54':teal);
   planter(x+1.65,6.7,.7);box(x-1.95,h/2,5.04,.22,h,.24,col,true,'pilaster');
  }
  planter(-7.9,-5,1.8);planter(7.9,6,1.8);return parts;
 }
 if(design.id==='shop-house'){
  const h=4.5;box(-.5,h/2+.2,-.5,12,h,11,cream,false,'shop-shell');
  box(-.5,h+.42,-.5,12.6,.45,11.6,cream,false,'cornice');
  for(const [x,z,w,d] of [[-.5,5.05,12.5,.28],[-.5,-6.05,12.5,.28],[-6.6,-.5,.28,11.1],[5.6,-.5,.28,11.1]])box(x,h+1,z,w,.8,d,cream,false,'parapet');
  window(-.5,2.1,5.09,10.5,3.3,.2);window(5.57,2.1,-.5,.2,3.3,9.1);
  box(-3.6,2.1,5.28,.22,3.3,.1,teal,true);box(2.5,2.1,5.28,.22,3.3,.1,teal,true);
  awning(-.5,4.0,6.15,12.9,2.4);box(6.4,4.0,-.4,2.1,.24,10.8,teal,false,'side-awning');
  box(-4.6,1.05,6.8,2.2,1.6,.7,'#ae8560',false,'display');box(2.9,1.05,6.8,2.4,1.6,.7,'#ae8560',false,'display');
  // Merchandise belongs to the visual display only; no inventory is invented here.
  for(const x of [-4.7,-3.9,2.2,3.1,3.8])add('ico',x,2,6.8,.55,.55,.55,x<0?'#dda855':'#86a55c',true,'display-detail');
  tank(-2.6,5.7,-2.7);box(2.6,5.25,-2.6,2,1.2,1.5,'#a7b3aa',false,'roof-equipment');
  for(const [x,z] of [[-7,4],[7,4],[-5,-7],[4,-7]])planter(x,z,1.7);
  if(t.level>1){const top=(t.level-1)*3;box(-2,4.9+top/2,-2,8,top,7,cream,false,'retail-extension');window(-2,5.8+top/2,1.6,6,Math.max(1,top-1),.15);box(-2,5+top,-2,8.4,.35,7.4,teal,false,'extension-roof');}
  return parts;
 }
 if(design.id==='sawtooth'){
  const h=5.8+(t.level-1)*.7;box(0,h/2+.2,-1,14,h,13,cream,false,'factory-hall');
  for(const x of [-4.7,0,4.7]){add('gable',x,h+1,-1,4.7,2,13.5,'#518d91',false,'sawtooth-roof');add('window',x,h+1.01,5.79,3.8,.65,.15,'#a7d3cf',false,'rooflight');}
  box(0,2.1,5.58,5,3.8,.14,'#748c8e',false,'loading-door');
  window(-5,3,5.58,2.1,1.6,.14);window(5,3,5.58,2.1,1.6,.14);window(7.08,3,-1,.14,1.5,9);
  box(0,.4,7,6,.6,2.5,'#aaa998',false,'loading-dock');
  box(-5.9,h+1.4,-5,1.1,5.8,1.1,'#aabcba',false,'chimney');box(-5.9,h+4.5,-5,1.4,.3,1.4,'#596f70');
  box(7.8,2.1,-3,1.8,4.2,5,'#a4b4af',false,'equipment');
  for(const z of [-4,-2])box(7.8,4.5,z,1.6,.3,1.1,'#688987',true,'vent');
  for(const x of [-5,5])planter(x,7.7,1.6);return parts;
 }
 if(['tile-house','garden-villa','courtyard'].includes(design.id)){
  const villa=design.id==='garden-villa',court=design.id==='courtyard',h=4.7+(t.level-1)*2.5;
  if(court){
   box(-3,h/2+.2,-.6,6,h,12,cream,false,'courtyard-wing');box(3.8,h/2+.2,-4,7.3,h,5.2,cream,false,'rear-wing');
   add('gable',-3,h+1,-.6,6.5,2,12.5,roof,false,'tile-roof');add('gable',3.8,h+1,-4,7.8,2,5.6,roof);
   window(-3,2.4,5.48,3.8,2.6,.15);window(3.8,2.4,-1.32,4.5,2.6,.15);
   box(3.8,.25,3,7,.3,7,'#d4c5a8');planter(6.5,5.5,2);planter(1,5.5,1.7);box(4,1,0,1.8,1.5,.8,'#b88b61',true,'courtyard-bench');
  }else{
   box(villa?-1:0,h/2+.2,-.8,villa?10:12.5,h,10.4,cream,false,'house');
   add('gable',villa?-1:0,h+1.25,-.8,villa?10.8:13.3,2.5,11.2,roof,false,'tile-roof');
   window(villa?-1:0,2.4,4.48,7.4,2.7,.16);awning(villa?-1:0,3.7,5.65,10.6,2.1,'#8b9f82');
   for(const x of [-4.8,4.1])box(x,1.9,6.1,.3,3.8,.3,cream,false,'porch-column');
   if(villa){box(4,2.7,-2.6,6,5.4,6.8,'#e8c7a4',false,'villa-wing');add('gable',4,6.4,-2.6,6.6,2,7.4,roof);window(4,2.7,.88,4.5,2.6,.15);box(-5,.35,6.8,5,.4,2.2,'#839a71',false,'garden');}
   else{box(-5.1,h+1.6,-3.5,.6,3.6,.6,cream,false,'chimney');planter(-6.9,5.5,1.6);}
   planter(6.4,6.5,1.8);tank(-3,h+2,-3);
   for(let f=1;f<t.level;f++)window(villa?-1:0,f*2.5+3.1,4.5,7,1.4,.15);
  }
  return parts;
 }
 if(['terraced-apartment','twin-apartment','balcony-apartment'].includes(design.id)){
  const floors=Math.max(4,t.level+1),h=floors*3.1;
  box(0,1.6,0,14,3.2,13,cream,false,'apartment-podium');
  const wings=design.id==='twin-apartment'?[[-3.7,0,5.5,h,10],[3.7,0,5.5,h*.85,10]]:design.id==='terraced-apartment'?[[0,0,13,h*.65,12],[-1,-1,9,h,9]]:[[0,0,11.5,h,12.5]];
  for(const [x,z,w,wh,d] of wings){box(x,wh/2+3,z,w,wh,d,cream,false,'apartment-wing');box(x,wh+3.25,z,w+.5,.5,d+.5,'#82aaa2',false,'roof-terrace');tank(x-1.2,wh+4.5,z-2);
   for(let f=0;f<Math.floor(wh/3.1);f++){const y=4.7+f*3.1;window(x,y,z+d/2+.07,w*.72,1.7,.16);window(x+w/2+.07,y,z,.16,1.7,d*.7);
    box(x,y-.9,z+d/2+.7,w*.92,.24,1.4,cream,false,'balcony');box(x,y-.4,z+d/2+1.33,w*.9,.6,.12,'#649b99',true,'balcony-rail');planter(x-w*.3,z+d/2+1.1,1.1,y-.7);
   }
  }
  window(0,1.7,6.57,8,2.6,.16);awning(0,3,7.2,9,1.8);for(const x of [-7.8,7.8])planter(x,7,1.5);return parts;
 }
 if(design.id==='market-hall'){
  box(0,2.3,-.5,14,4.6,12,cream,false,'market-hall');for(const x of [-3.6,3.6])add('gable',x,5.7,-.5,7.5,2.2,12.8,roof,false,'market-roof');
  awning(0,3.2,6.35,15,1.5,teal);for(const x of [-5,-1.7,1.7,5]){window(x,1.7,5.59,2.8,2.7,.15);box(x,.85,6.8,2.6,1.1,.8,'#bb8e60',false,'market-stall');planter(x,7.7,1.7,1.3);}
  window(7.06,2,-.5,.16,2.7,8);box(0,4.2,5.8,6,.7,.3,teal,false,'market-sign');tank(-2,6.7,-3);return parts;
 }
 if(design.id==='glass-office'){
  const h=13+(t.level-1)*3;box(0,h/2+.2,-.5,11,h,11,'#d6d6bb',false,'office-core');
  window(0,h/2,5.09,9.8,h-1,.2);window(5.59,h/2,-.5,.2,h-1,9.8);
  for(let f=1;f<h/3;f++){box(0,f*3,5.25,11,.2,.25,cream,false,'floor-band');box(5.75,f*3,-.5,.25,.2,11,cream,false,'floor-band');}
  for(const x of [-5,-1.7,1.7,5])box(x,h/2,5.27,.19,h,.25,cream,true,'facade-mullion');
  box(0,h+.4,-.5,11.5,.5,11.5,cream);box(-1,h+1.4,-1,6,1.5,6,'#92a59e');awning(0,3.3,6.5,7,2.3,teal);for(const x of [-6.8,6.8])planter(x,6,2);return parts;
 }
 if(['warehouse','processing'].includes(design.id)){
  const food=design.id==='processing',h=6+(t.level-1)*1.2;box(food?-1:0,h/2+.2,-.8,food?10:14,h,12,cream,false,food?'processing-hall':'warehouse-hall');
  add('gable',food?-1:0,h+1.5,-.8,food?10.8:14.8,3,12.8,teal,false,'industrial-roof');
  for(const x of food?[-3,1]:[-4,4]){box(x,2.2,5.3,3.5,4,.2,'#728e8e',false,'loading-door');box(x,.5,6.5,4,.7,2,'#a9ada0',false,'loading-dock');box(x,.9,7.8,1.7,1.2,1.5,'#b89467',true,'cargo');}
  window(food?-1:0,h-.8,5.35,food?8:12,.9,.15);
  if(food){for(const z of [-3,2.5]){add('cylinder',6.7,3,z,3.5,6,3.5,'#a4bcbb',false,'processing-tank');add('cone',6.7,6.8,z,3.5,1.6,3.5,teal);box(4.7,4.5,z,1.8,.25,.25,'#a4bcbb',true,'pipe');}box(-4,h+2,-4,1,5,1,'#b7c0b1',false,'flue');}
  else{for(const z of [-4,0,4])window(7.06,3,z,.14,1.7,2);box(0,h+.5,-2,6,.4,3,'#a5c8c4',false,'skylight');}
  return parts;
 }
 return null;
}
