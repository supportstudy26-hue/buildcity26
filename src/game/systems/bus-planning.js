import {route} from './roads.js';import {position,distanceMeters} from './world.js';import {mobilityPath} from './mobility-path.js';
const dockCache=new WeakMap(),routeCache=new WeakMap();
function cachedRoute(s,from,to){let cache=routeCache.get(s.network);if(!cache){cache=new Map();routeCache.set(s.network,cache);}const key=`${from}:${to}`;if(!cache.has(key)){if(cache.size>512)cache.clear();cache.set(key,route(s,from,to));}return cache.get(key);}
export function busDock(s,line,stopIndex){
 let cache=dockCache.get(s.network);if(!cache){cache=new Map();dockCache.set(s.network,cache);}const key=`${line.id}:${stopIndex}`;if(cache.has(key))return cache.get(key);
 const stop=line.stops[stopIndex],previous=line.stops[(stopIndex+line.stops.length-1)%line.stops.length],roads=cachedRoute(s,previous,stop);
 if(!roads.length)return null;
 const path=mobilityPath(s,previous,stop,roads,s.mapSize,'car'),p=path.at(-2),a=path.at(-3)||p,dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy)||1;
 const result={position:p,door:{...p,x:p.x-dy/d*1.40,y:p.y+dx/d*1.40}};cache.set(key,result);return result;
}
export function chooseBusPlan(s,c,destination){
 if(c.vehicle||!s.busLines.length||distanceMeters(c.position,position(destination,s.mapSize,s))<120)return null;
 const h=s.households.find(h=>h.id===c.household);if((h?.savings||0)<.7)return null;
 let best=null;
 for(const line of s.network.busLines||[])if(line.ok){
  for(let bi=0;bi<line.stops.length;bi++)for(let ai=0;ai<line.stops.length;ai++){
   if(bi===ai)continue;const dock=busDock(s,line,bi);if(!dock)continue;
   const walk=distanceMeters(c.position,dock.door)+distanceMeters(position(line.stops[ai],s.mapSize,s),position(destination,s.mapSize,s));
   const direct=distanceMeters(c.position,position(destination,s.mapSize,s));
   if(walk>260||walk>=direct*1.1||!cachedRoute(s,c.goal,line.stops[bi]).length||!cachedRoute(s,line.stops[ai],destination).length)continue;
   if(!best||walk<best.walk)best={line:line.id,board:line.stops[bi],alight:line.stops[ai],destination,stage:'walk-to-stop',vehicleId:null,walk};
  }
 }
 return best;
}
