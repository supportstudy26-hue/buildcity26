// Original solid mesh descriptors, shared by map, preview and catalogue.
export function pierParts(cx,cz,ground,height=6,tile=null,overlay=null){
 const parts=[];const box=(x,y,z,w,h,d,color,role)=>parts.push({shape:'box',position:[x,y,z],scale:[w,h,d],color:overlay||color,material:'concrete',role,detail:false,tile});
 box(cx,ground+.35,cz,5,.7,5,'#829698','pier-footing');
 box(cx,ground+(height-.9)/2,cz,1.8,height-.9,2.6,'#b4c2c1','pier-column');
 box(cx,ground+height-1.05,cz,10,.8,2.8,'#c7ceca','pier-cap');
 for(const side of [-1,1])box(cx+side*3.2,ground+height-.55,cz,1.3,.25,2,'#52666a','pier-bearing');
 return parts;
}
export function roundaboutParts(cx,cz,base,profile,tile=null,overlay=null){
 const parts=[],{island,outer}=profile.circle,count=32,r=(outer+island)/2,band=outer-island;
 const add=(shape,x,y,z,w,h,d,color,role,detail=false,rotation=null)=>parts.push({shape,position:[x,y,z],scale:[w,h,d],color:overlay||color,role,detail,rotation,tile});
 add(profile.lanes===2?'roadRing2':'roadRing1',cx,base+.077,cz,outer*2,1,outer*2,'#435761','circle-carriageway');
 for(let n=0;n<count;n++){
  const angle=n*Math.PI*2/count,yaw=Math.PI/2-angle;
  const edge=island-.1;add('box',cx+Math.cos(angle)*edge,base+.12,cz+Math.sin(angle)*edge,2*edge*Math.tan(Math.PI/count),.24,.2,'#d9ded4','circle-curb',false,{yaw});
  if(profile.lanes===2&&n%2===0)add('box',cx+Math.cos(angle)*r,base+.11,cz+Math.sin(angle)*r,.6,.035,.12,'#f1e8ca','circle-lane-mark',true,{yaw});
 }
 add('cylinder',cx,base,cz,island*2,.16,island*2,'#799b6b','circle-island');
 add('cylinder',cx,base+.9,cz,.3,1.8,.3,'#7e684f','circle-tree-trunk');
 add('ico',cx,base+2.5,cz,2.4,2.8,2.4,'#508966','circle-tree-crown');
 for(let n=0;n<5;n++){const a=n*Math.PI*2/5;add('ico',cx+Math.cos(a)*(island-1.2),base+.35,cz+Math.sin(a)*(island-1.2),.9,.7,.9,n%2?'#dfbd83':'#669876','circle-flower',true);}
 return parts;
}
