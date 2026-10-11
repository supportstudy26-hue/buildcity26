import {roadProfile} from '../../config/road-profiles.js';
import {position} from './world.js';
// Right-hand lanes and circular junction arcs in metres. No PNG/visual-only route.
export function mobilityPath(s,origin,destination,roads,size,mode,initialPosition=null){
 const centres=roads.map(i=>({...position(i,size,s),road:i})),points=[];
 for(let i=0;i<centres.length;i++){
  const p=centres[i],before=centres[Math.max(0,i-1)],after=centres[Math.min(centres.length-1,i+1)],profile=roadProfile(s.tiles[p.road]);
  if(profile.circle){
   const incoming=i?before:initialPosition||position(origin,size,s),outgoing=i<centres.length-1?after:position(destination,size,s);
   const radius=mode==='walk'?profile.circle.outer+.5:profile.circle.radius;
   const offset=mode==='walk'?0:Math.asin(Math.min(.8,2.5/radius));
   const entry=Math.atan2(incoming.y-p.y,incoming.x-p.x)-offset,exit=Math.atan2(outgoing.y-p.y,outgoing.x-p.x)+offset;
   let sweep=exit-entry;while(sweep>=0)sweep-=Math.PI*2;while(sweep< -Math.PI*2)sweep+=Math.PI*2;
   const steps=Math.max(4,Math.ceil(Math.abs(sweep)*radius/1.2));
   for(let n=0;n<=steps;n++){const a=entry+sweep*n/steps,u=n/steps,inner=profile.lanes===2&&mode!=='walk'&&Math.abs(sweep)>Math.PI,blend=inner?Math.min(1,u*5,(1-u)*5):0,r=radius-blend*2.3;points.push({...p,x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,roundaboutEntry:n===0,roundaboutExit:n===steps});}
   continue;
  }
  let dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy);
  if(!length){const target=position(destination,size,s);dx=target.x-p.x;dy=target.y-p.y;length=Math.hypot(dx,dy);}
  const offset=mode==='walk'?(profile.lanes?profile.width/2+Math.min(1,profile.sidewalk*.8):1.2):mode==='bus'&&profile.busLane?5.4:profile.oneWay?1.8:2.5;
  points.push({...p,x:p.x-(length?dy/length:0)*offset,y:p.y+(length?dx/length:0)*offset});
 }
 return[initialPosition?{...initialPosition}:position(origin,size,s),...points,position(destination,size,s)];
}
