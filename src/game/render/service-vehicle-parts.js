// Original metre-scale fleet meshes. PNGs are catalogue references only.
export const FLEET_DESIGNS=Object.freeze({
 'fire-engine':{width:2.45,height:3,length:7.2,color:'#b95543',body:'fire'},
 'police-car':{width:1.84,height:1.52,length:4.65,color:'#e3e8dc',body:'police'},
 'ambulance':{width:2.1,height:2.8,length:5.8,color:'#ede9d8',body:'ambulance'},
 'garbage-truck':{width:2.5,height:3.4,length:8,color:'#6b9680',body:'waste'},
 'light-box-truck':{width:2.05,height:2.8,length:5.9,color:'#dcc7a3',body:'cargo'},
 'medium-truck':{width:2.5,height:3.4,length:8,color:'#769caa',body:'cargo'},
 'refrigerated-truck':{width:2.4,height:3.3,length:7.8,color:'#ecebdc',body:'cold'}
});
export function fleetParts(key,motion={},lod=0){
 const v=FLEET_DESIGNS[key];if(!v)return[];
 const parts=[],{width:w,height:h,length:l,color,body}=v;
 const add=(shape,p,scale,c,rotation={},pivot=null)=>parts.push({shape,position:p,scale,color:c,rotation,pivot});
 const box=(x,y,z,a,b,c,col,detail=false)=>{add('box',[x,y,z],[a,b,c],col);parts.at(-1).detail=detail;};
 if(body==='police'){
  add('rounded',[0,.7,0],[w,.7,l],color,{},'body');add('rounded',[0,1.13,-.18],[w*.83,.6,2.3],'#536e76',{},'cabin');box(0,1.47,-.3,w*.8,.12,1.65,color);box(0,.77,0,w*1.005,.18,3.5,'#3f6975');
 }else{
  const cab=l*.31,front=l/2-cab/2;
  box(0,.55,0,w*.9,.35,l,'#53615e');parts.at(-1).pivot='body';add('rounded',[0,h*.45,front],[w,h*.64,cab],color,{},'cab');box(0,h*.62,front+cab/2+.015,w*.82,h*.3,.08,'#668d96');
  if(body==='waste'){
   add('rounded',[0,h*.53,-l*.14],[w*.97,h*.74,l*.65],color,{},'compactor');box(0,1.4,-l/2+.22,w*.87,2.1,.45,'#4a6d66');box(0,2.2,-l/2+.48,w*.72,.45,1,'#8fada1');box(0,2.35,-.4,w*1.005,.3,l*.48,'#d4dec6');
  }else if(body==='fire'){
   box(0,h*.44,-l*.16,w*.98,h*.58,l*.64,color);box(0,h*.72,-l*.16,w*.82,.28,l*.64,'#bdc9be');
   for(const side of [-1,1]){box(side*w*.495,h*.47,-l*.18,.06,h*.4,l*.49,'#ccd2c9');box(side*w*.505,h*.36,-l*.18,.05,.12,l*.5,'#a79979');}
   box(0,h*.81,-l*.1,.95,.2,l*.68,'#aebdb6');for(let n=0;n<9;n++)box(0,h*.94,-l*.38+n*.48,.9,.12,.1,'#cdd5cb',true);
  }else{
   box(0,h*.57,-l*.15,w*.98,h*.78,l*.62,color);box(0,h*.57,-l/2+.1,w*.91,h*.68,.06,'#a9b8b1');box(0,h*.57,-l/2+.04,.045,h*.68,.08,'#617c7b',true);
   if(body==='ambulance'){for(const side of [-1,1]){box(side*w*.499,h*.53,-l*.1,.06,.18,l*.49,'#428e83');box(side*w*.505,h*.62,-l*.16,.07,.5,.3,'#428e83');}box(0,h*.99,-.4,1.5,.15,1.9,'#ccd7cc');}
   if(body==='cold')box(0,h*.9,l*.14,1.3,.7,.6,'#a7b7b4');
  }
 }
 if(lod>1)return parts;
 const r=body==='police'?.32:.47,axles=body==='police'?[-1.45,1.45]:[-l*.3,l*.31];if(body==='waste'||key==='medium-truck')axles.splice(1,0,-l*.14);
 for(const z of axles)for(const side of [-1,1]){
  add('cylinder',[side*w*.48,r,z],[r*2,r*.48,r*2],'#303c3b',{roll:Math.PI/2},'wheel');add('cylinder',[side*w*.489,r,z],[r*1.12,r*.5,r*1.12],'#b4beb5',{roll:Math.PI/2},'hub');add('box',[side*(w*.48+r*.26),r,z],[.035,r,.06],'#657570',{pitch:(motion.distance||0)/r},'spoke');
 }
 for(const side of [-1,1]){box(side*w*.36,.8,l/2+.06,.25,.17,.08,motion.night?'#f8e3b4':'#ead7b1');box(side*w*.36,.8,-l/2-.04,.21,.16,.07,'#b55b43');}
 if(['police','fire','ambulance'].includes(body))for(const side of [-1,1])box(side*.3,h+.03,body==='police'?0:l*.29,.4,.14,.25,side<0?'#c5654e':'#6d9bb1');
 return parts;
}
