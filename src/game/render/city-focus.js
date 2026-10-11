import {roadProfile} from '../../config/road-profiles.js';
// View-only framing: never changes the city, simulation or saved camera controls.
export function cityFocus(s,width=1280){
  const size=s.mapSize||64,buildings=[],roads=[];
  s.tiles.forEach((t,i)=>{if(t.kind||t.zone)(roadProfile(t)?roads:buildings).push(i);});
  const points=buildings.length?buildings:roads;
  if(!points.length){const i=s.world?.geography?.entryTile??18*size;return {x:Math.min(size-1,i%size+2),y:Math.floor(i/size),distance:width<600?320:240};}
  let minX=size,maxX=0,minY=size,maxY=0;
  for(const i of points){const x=i%size,y=Math.floor(i/size);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  const span=(maxX-minX+maxY-minY+2)*20;
  return {x:(minX+maxX)/2,y:(minY+maxY)/2,distance:Math.min(950,Math.max(width<600?300:220,span*(width<600?1.4:1.05)))};
}
