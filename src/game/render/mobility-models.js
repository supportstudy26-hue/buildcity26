import {FLEET_DESIGNS,fleetParts} from './service-vehicle-parts.js';
import {MobilityArtRegistry,artHash,citizenArtId,vehicleArtId} from '../../config/mobility-art.js';
const C={skin:'#e7bc97',hair:'#263a40',cream:'#eadfc9',teal:'#68bca8',navy:'#385469',coral:'#cd8167',glass:'#517982',rubber:'#2b3c43',metal:'#a6b5b5',gold:'#e6bb63'};
const people={
 'child-boy':[1.13,C.teal,C.cream,'backpack'],'child-girl':[1.10,C.coral,C.navy,'skirt'],
 'teen-boy':[1.61,C.navy,'#7192a6','hood'],'teen-girl':[1.57,C.cream,C.teal,'backpack'],
 'adult-man':[1.76,C.navy,C.cream],'adult-woman':[1.66,C.coral,C.cream],
 'elder-man':[1.66,'#879398','#766654','cane'],'elder-woman':[1.55,'#a695ad','#a695ad'],
 'wheelchair-user':[1.72,'#7395b6',C.navy,'wheelchair'],
 'office-worker':[1.76,C.cream,C.navy,'bag'],'teacher':[1.65,'#b3d2c2',C.cream,'book'],
 'retail-worker':[1.73,C.teal,C.navy,'apron'],'restaurant-worker':[1.66,C.cream,C.navy,'chef'],
 'factory-worker':[1.76,'#63899d','#63899d'],'farmer':[1.60,'#988b73',C.navy,'conical-hat'],
 'tourist':[1.73,C.cream,C.cream,'sunhat'],'jogger':[1.66,C.teal,C.navy],
 'delivery-rider-person':[1.74,C.coral,C.navy,'helmet'],
 'police-officer':[1.78,C.teal,C.navy,'cap'],'firefighter':[1.79,'#c4ad73','#c4ad73','helmet'],
 'paramedic':[1.67,C.teal,C.teal,'medical-bag'],'doctor':[1.68,C.cream,C.teal,'coat'],
 'sanitation-worker':[1.75,C.gold,C.navy,'broom'],'utility-technician':[1.67,C.teal,C.navy,'hardhat'],
 'construction-worker':[1.76,C.gold,C.navy,'hardhat'],'transit-driver':[1.66,'#9fbecb',C.navy],
 'harbor-worker':[1.78,C.coral,C.navy,'hardhat']
};
const cars={
 'compact-car':[1.72,1.48,3.75,C.teal],'sedan':[1.82,1.45,4.65,C.cream],
 'electric-car':[1.87,1.48,4.74,'#438f99'],'suv':[1.94,1.78,4.55,C.navy],
 'family-minivan':[1.92,1.91,4.9,C.cream],'pickup':[1.93,1.83,5.2,C.coral],
 'taxi':[1.82,1.48,4.65,C.teal],'accessible-taxi':[2.0,2.1,5.1,'#438f99'],
 'limousine':[1.90,1.49,5.65,C.navy]
};
const buses={
 'city-bus':[2.5,3.1,11.6,C.teal,60],'electric-bus':[2.5,3.2,12,C.cream,60],
 'articulated-bus':[2.5,3.2,18,C.teal,100],'minibus':[2.1,2.7,6.5,C.cream,16],
 'intercity-coach':[2.5,3.5,12.2,C.navy,44],'school-bus':[2.35,3,8.4,C.gold,32],
 'shuttle-cart':[1.8,2.2,5.3,C.cream,12]
};
export function mobilityDesign(id){
 const a=MobilityArtRegistry[id];if(!a)return null;const k=a.semanticKey;
 const fleet=FLEET_DESIGNS[k];const p=people[k],v=cars[k]||buses[k]||(fleet?[fleet.width,fleet.height,fleet.length]:null);if(!p&&!v)return null;
 return{id,name:a.nameVi,profile:a.animationProfile,dimensions:p?[.60,p[0],.46]:v.slice(0,3),capacity:buses[k]?.[4]??(k==='family-minivan'?7:4),anchor:p?'feet':'footprint',wheelRadius:p?.[3]==='wheelchair'?.3:v?.[2]>6?.48:.32};
}
function builder(){const parts=[];return{parts,add:(shape,position,scale,color,rotation={},pivot=null)=>parts.push({shape,position,scale,color,rotation,pivot})};}
function hinge(point,anchor,angle){const y=point[1]-anchor[1],z=point[2]-anchor[2];return[point[0],anchor[1]+y*Math.cos(angle)-z*Math.sin(angle),anchor[2]+y*Math.sin(angle)+z*Math.cos(angle)];}
function personParts(k,motion,lod){
 const {parts,add}=builder(),[height,shirt,pants,extra]=people[k],child=k.startsWith('child'),seated=extra==='wheelchair';
 const leg=height*(child?.39:.47),head=height*(child?.23:.16),torso=height-leg-head*.93;
 const torsoBase=seated?.78:leg,hip=torsoBase,shoulder=torsoBase+torso*.85;
 const hair=k.startsWith('elder')?'#b8b8b0':C.hair;
 add('rounded',[0,torsoBase+torso*.45,0],[height*.25,torso,height*.15],shirt,{},'spine');
 add('sphere',[0,torsoBase+torso+head*.48,.015],[head,head*1.1,head*.9],C.skin,{},'head');
 if(lod>1)return parts;
 add('sphere',[0,torsoBase+torso+head*.77,-head*.07],[head*1.03,head*.65,head*.96],hair,{},'hair');
 if(k.endsWith('girl')||k==='adult-woman'||k==='elder-woman')add('rounded',[0,torsoBase+torso+head*.31,-head*.35],[head*.95,head*.92,head*.42],hair);
 if(lod===0)for(const side of [-1,1])add('sphere',[side*head*.20,torsoBase+torso+head*.54,head*.435],[head*.08,head*.09,head*.04],C.navy);
 const stride=height*.75,phase=(motion.distance||0)/stride*Math.PI*2,swing=motion.speed>0&&!seated?Math.sin(phase)*.40:0;
 for(const side of [-1,1]){
  const hipPivot=[side*height*.075,hip,0],knee0=[hipPivot[0],hip-leg*.51,0],legAngle=seated?-Math.PI/2:side*swing;
  const knee=hinge(knee0,hipPivot,legAngle),bend=seated?Math.PI/2:Math.max(0,-side*Math.sin(phase))*.50*(motion.speed>0?1:0);
  add('rounded',hinge([hipPivot[0],hip-leg*.25,0],hipPivot,legAngle),[height*.087,leg*.50,height*.095],pants,{pitch:legAngle},`thigh.${side}`);
  const shinAngle=legAngle+bend,ankle=hinge([knee[0],knee[1]-leg*.45,knee[2]],knee,shinAngle);
  add('rounded',hinge([knee[0],knee[1]-leg*.22,knee[2]],knee,shinAngle),[height*.071,leg*.45,height*.076],pants,{pitch:shinAngle},`shin.${side}`);
  add('rounded',[ankle[0],ankle[1]+height*.012,ankle[2]+height*.028],[height*.092,height*.05,height*.15],C.navy,{pitch:seated?0:-side*swing*.2},`foot.${side}`);
  const armLength=height*.29,armPivot=[side*height*.157,shoulder,0],armAngle=seated?-.65:-side*swing*.80;
  const elbow=hinge([armPivot[0],shoulder-armLength*.5,0],armPivot,armAngle),foreAngle=armAngle-.13;
  add('rounded',hinge([armPivot[0],shoulder-armLength*.25,0],armPivot,armAngle),[height*.074,armLength*.50,height*.072],shirt,{pitch:armAngle},`upperArm.${side}`);
  add('rounded',hinge([elbow[0],elbow[1]-armLength*.20,elbow[2]],elbow,foreAngle),[height*.057,armLength*.40,height*.057],C.skin,{pitch:foreAngle},`forearm.${side}`);
  add('sphere',hinge([elbow[0],elbow[1]-armLength*.43,elbow[2]],elbow,foreAngle),[height*.07,height*.085,height*.063],C.skin,{},`hand.${side}`);
 }
 if(extra==='skirt')add('cone',[0,hip-.1,0],[height*.34,height*.20,height*.22],pants,{pitch:Math.PI});
 if(['backpack','hood','bag','medical-bag','book'].includes(extra))add('rounded',[extra==='bag'||extra==='book'?.26:0,hip+torso*.4,-height*.12],[height*.22,height*.28,height*.10],extra==='medical-bag'?C.teal:C.navy,{},'accessory');
 if(['apron','coat'].includes(extra))add('rounded',[0,hip+.07,.075],[height*.27,height*.4,.06],shirt);
 if(['helmet','hardhat','cap','chef','sunhat','conical-hat'].includes(extra)){
  add(extra==='conical-hat'?'cone':'sphere',[0,torsoBase+torso+head*.94,0],[head*1.28,head*.42,head*1.28],extra==='helmet'||extra==='hardhat'?C.gold:C.cream);
  add('cylinder',[0,torsoBase+torso+head*.85,.015],[head*1.45,.025,head*1.45],C.cream);
 }
 if(extra==='cane'||extra==='broom')add('cylinder',[height*.23,height*.29,.15],[.035,height*.58,.035],extra==='cane'?'#937658':C.cream);
 if(seated){
  add('box',[0,.67,-.08],[.59,.12,.65],C.navy);add('box',[0,1.02,-.35],[.56,.60,.09],C.navy);
  add('box',[0,.33,.48],[.51,.06,.24],C.metal);
  for(const side of [-1,1]){wheel(add,[side*.37,.3,-.12],.30,motion.distance||0);wheel(add,[side*.26,.09,.45],.09,motion.distance||0);add('cylinder',[side*.3,.84,-.1],[.025,.025,.54],C.metal,{pitch:Math.PI/2});}
 }
 return parts;
}
function wheel(add,p,r,distance,steer=0){
 add('cylinder',p,[r*2,r*.52,r*2],C.rubber,{yaw:steer,roll:Math.PI/2},'wheel');
 add('cylinder',[p[0]+Math.sign(p[0])*.008,p[1],p[2]],[r*1.15,r*.56,r*1.15],C.metal,{yaw:steer,roll:Math.PI/2},'wheel.rim');
 add('box',[p[0]+Math.sign(p[0])*r*.29,p[1],p[2]],[.035,r*1.07,.065],C.navy,{yaw:steer,pitch:distance/r},'wheel.spoke');
}
function carParts(k,motion,lod){
 const {parts,add}=builder(),[w,h,l,color]=cars[k],r=.32,van=['family-minivan','accessible-taxi'].includes(k),pickup=k==='pickup';
 add('rounded',[0,h*.44,0],[w,h*.52,l],color,{},'body');
 add('rounded',[0,h*.76,van?-.05:-.18],[w*.86,h*.47,l*(van?.68:.48)],C.glass,{},'cabin');
 add('rounded',[0,h-.07,van?-.05:-.21],[w*.86,.14,l*(van?.60:.36)],color);
 if(lod>1)return parts;
 add('rounded',[0,h*.56,l*.36],[w*.91,.16,l*.23],color);add('rounded',[0,h*.56,-l*.40],[w*.91,.16,l*.15],color);
 if(pickup){add('box',[0,h*.68,-l*.29],[w*.86,.07,l*.26],C.navy);for(const side of [-1,1])add('box',[side*w*.46,h*.74,-l*.29],[.09,h*.24,l*.31],color);}
 for(const side of [-1,1]){
  for(const along of [-1,1])wheel(add,[side*w*.49,r,along*l*.31],r,motion.distance||0,along>0?(motion.steering||0):0);
  add('rounded',[side*w*.52,h*.75,l*.1],[.15,.11,.25],color,{},'mirror');
  const angle=motion.doors?side*.85:0,pivot=[side*w*.455,h*.60,l*.13],position=[side*w*.465+(motion.doors?side*.20:0),h*.57,-l*.07];
  add('rounded',position,[.035,h*.32,l*.29],color,{yaw:angle},`door.${side}`);
  add('box',[side*w*.30,h*.46,l*.50],[w*.20,.12,.025],motion.night?'#f6e9b6':'#d8dcce',{},'headlight');
  add('box',[side*w*.32,h*.45,-l*.50],[w*.18,.10,.025],motion.braking?'#ff8268':'#ad6356',{},'brake-light');
 }
 if(k==='taxi')add('rounded',[0,h+.12,0],[.52,.20,.23],C.gold);
 if(k==='accessible-taxi')add('box',[0,.32,-l*.52],[1.0,.06,motion.doors?1.4:.2],C.metal,{pitch:motion.doors?-.18:Math.PI/2},'ramp');
 return parts;
}
function busParts(k,motion,lod){
 const {parts,add}=builder(),[w,h,l,color]=buses[k],r=.48;
 const segments=k==='articulated-bus'?[[0,10],[-9,7.5]]:[[0,l]];
 for(const [offset,length] of segments){
  const z=offset+(k==='articulated-bus'?4:0),turn=offset?(motion.articulation||0):0;
  const emit=(shape,p,sc,col,rot={},pivot=null)=>{const dx=p[0],dz=p[2]-z;add(shape,[dx*Math.cos(turn)+dz*Math.sin(turn),p[1],z-dx*Math.sin(turn)+dz*Math.cos(turn)],sc,col,{...rot,yaw:(rot.yaw||0)+turn},pivot);};
  emit('rounded',[0,h*.53,z],[w,h*.85,length],color,{},offset?'articulation':'body');
  emit('rounded',[0,h*.64,z],[w*1.007,h*.43,length*.91],C.glass);
  emit('rounded',[0,h-.1,z],[w,.17,length*.94],color);
  if(lod>1)continue;
  for(const along of [-1,1])for(const side of [-1,1])wheel(emit,[side*w*.49,r,z+along*length*.32],r,motion.distance||0,along>0?(motion.steering||0):0);
  for(let j=0;j<Math.floor(length/1.25);j++)emit('box',[0,h*.65,z-length*.39+j*1.25],[w*1.015,h*.46,.07],color);
  for(const dz of [length*.28,-length*.21])emit('box',[w*.51,h*.45,z+dz],[.035,h*.68,.94],C.glass,{yaw:motion.doors?.8:0},'doors');
  for(const side of [-1,1])emit('box',[side*w*.32,.75,z+length*.502],[.25,.17,.035],motion.night?'#f6e9b6':C.cream);
 }
 if(k==='electric-bus')add('rounded',[0,h+.12,0],[1.6,.35,3.1],C.teal);
 if(k==='articulated-bus')add('rounded',[0,h*.55,-1.2],[w*.92,h*.76,.8],C.rubber,{},'accordion');
 return parts;
}
export function mobilityParts(id,motion={},lod=0){const k=MobilityArtRegistry[id]?.semanticKey;if(people[k])return personParts(k,motion,lod);if(cars[k])return carParts(k,motion,lod);if(buses[k])return busParts(k,motion,lod);if(FLEET_DESIGNS[k])return fleetParts(k,motion,lod);return [];}
export function citizenMotion(s,c,renderAlpha){
 const j=c.journey,moving=j&&c.state!=='blocked'&&(j.actualSpeed??j.speed)>0;
 const speed=moving?(j.actualSpeed??j.speed):0;
 return{speed,distance:Math.max(0,(c.travelled||0)-(moving&&renderAlpha?(1-renderAlpha)*speed:0)),braking:!!j&&speed===0,night:s.clock.seconds%86400<6*3600||s.clock.seconds%86400>=19*3600};
}
export function actorArt(s,c){const v=c.journey?.mode==='car'?s.vehicles.find(v=>v.id===c.vehicle):null;return v?vehicleArtId(v):citizenArtId(c);}
// Same pure meshes feed instancing; renderer does not change IDs/population or clock.
export function worldMobilityParts(id,motion,lod,p,yaw,actorId){return mobilityParts(id,motion,lod).map(part=>{const [x,y,z]=part.position;return{...part,position:[p.x+x*Math.cos(yaw)+z*Math.sin(yaw),p.z+y,p.y-x*Math.sin(yaw)+z*Math.cos(yaw)],rotation:{...part.rotation,yaw:yaw+(part.rotation.yaw||0)},id:actorId};});}
