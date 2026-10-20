// Original architecture; independent volumes and loading courts, not billboards.
export const LOGISTICS_BUILDINGS=Object.freeze({farm:{name:'Nông trại',height:6.4},freightWarehouse:{name:'Kho hàng thành phố',height:8.8},foodFactory:{name:'Xưởng thực phẩm',height:10}});
export function logisticsBuildingParts(t,cx=0,cz=0,base=0,overlay=null,tile=null){
 if(!LOGISTICS_BUILDINGS[t.kind])return[];const parts=[];
 const add=(shape,x,y,z,w,h,d,color,detail=false)=>parts.push({shape,position:[cx+x,base+y,cz+z],scale:[w,h,d],color:overlay||color,detail,tile});
 const box=(x,y,z,w,h,d,c,detail=false)=>add('box',x,y,z,w,h,d,c,detail),cream='#e4deca',teal='#567f7c',roof='#a96b4e',glass='#83b2b0',steel='#a3b2ad';
 box(0,.12,0,18,.24,18,t.kind==='farm'?'#8fa77b':'#bdc7ba');box(0,.28,8,5,.12,3,'#dfd6c0');
 if(t.kind==='farm'){
  box(-4,1.8,-3,7,3.4,6,cream);add('gable',-4,4.5,-3,7.6,2,6.7,roof);box(-4,1.5,.08,2.1,2.7,.15,teal);add('window',-6,2,-6.1,1.9,1.5,.13,glass,true);
  for(const x of [1,5]){box(x,1.8,-4,3.3,3.1,6,glass);add('gable',x,3.8,-4,3.6,1,6.3,glass);for(const z of [-6,-3,-1])box(x,2,z,3.5,.1,.1,cream,true);}
  for(const z of [2,4,6]){box(-1,.43,z,12,.35,1.1,'#a58b65');for(const x of [-6,-3,0,3])add('ico',x,.86,z,1.8,1.2,.8,'#508061',true);}
  add('cylinder',-7,1.8,4,2.2,3,2.2,steel);box(7,.55,6,2,.8,2,cream,true);
 }else{
  const food=t.kind==='foodFactory',h=food?6:6.4;box(food?-2:0,h/2+.2,-2,food?10:14,h,12,cream);add('gable',food?-2:0,h+1.2,-2,food?10.7:14.7,2.4,12.7,teal);
  for(const x of food?[-4,0]:[-4,4]){box(x,2.2,4.08,3,3.9,.18,'#6d8584');box(x,.55,5.5,3.7,.8,2.6,'#a5ae9c');box(x,.9,7.2,1.7,1.5,1.4,'#b59267',true);}
  add('window',food?-2:0,h-1.1,4.13,food?8:12,1,.16,glass,true);
  if(food){for(const z of [-4,2]){add('cylinder',6,3.6,z,3.8,6.5,3.8,steel);add('cone',6,7.6,z,3.8,1.5,3.8,teal);box(3.5,4,z,2.5,.3,.3,steel,true);}box(-5,8,-5,.8,3.5,.8,steel);}
  else{box(0,h+1.5,-2,6,.25,3,glass);for(const z of [-5,-1])add('window',7.08,3,z,.15,2,2.8,glass,true);box(0,6.2,4.2,7,.7,.2,teal,true);}
 }
 return parts;
}
