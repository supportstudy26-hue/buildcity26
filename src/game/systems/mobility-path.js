import {roadProfile} from '../../config/road-profiles.js';
import {position} from './world.js';
// Right-hand traffic. Offsets are measured from road centre, in metres.
// Junction bends use an offset bisector; existing saved paths are never rewritten.
export function mobilityPath(s,origin,destination,roads,size,mode,initialPosition=null){
 const centres=roads.map(i=>({...position(i,size,s),road:i}));
 const points=centres.map((p,i)=>{
  const before=centres[Math.max(0,i-1)],after=centres[Math.min(centres.length-1,i+1)];
  let dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy);
  if(!length){const target=position(destination,size,s);dx=target.x-p.x;dy=target.y-p.y;length=Math.hypot(dx,dy);}
  const profile=roadProfile(s.tiles[p.road]);const offset=mode==='walk'?(profile.lanes?profile.width/2+Math.min(1,profile.sidewalk*.8):1.2):mode==='bus'&&profile.busLane?5.4:profile.oneWay?1.8:2.5;
  return{...p,x:p.x-(length?dy/length:0)*offset,y:p.y+(length?dx/length:0)*offset};
 });
 return[initialPosition?{...initialPosition}:position(origin,size,s),...points,position(destination,size,s)];
}
