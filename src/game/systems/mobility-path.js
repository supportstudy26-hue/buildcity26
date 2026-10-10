import {position} from './world.js';
// Right-hand traffic. Offsets are measured from road centre, in metres.
// Junction bends use an offset bisector; existing saved paths are never rewritten.
export function mobilityPath(s,origin,destination,roads,size,mode,initialPosition=null){
 const centres=roads.map(i=>({...position(i,size,s),road:i})),offset=mode==='car'?2.5:7.0;
 const points=centres.map((p,i)=>{
  const before=centres[Math.max(0,i-1)],after=centres[Math.min(centres.length-1,i+1)];
  let dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy);
  if(!length){const target=position(destination,size,s);dx=target.x-p.x;dy=target.y-p.y;length=Math.hypot(dx,dy);}
  return{...p,x:p.x-(length?dy/length:0)*offset,y:p.y+(length?dx/length:0)*offset};
 });
 return[initialPosition?{...initialPosition}:position(origin,size,s),...points,position(destination,size,s)];
}
