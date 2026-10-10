import {roadProfile,DIRECTION_VECTORS} from '../../config/road-profiles.js';
import {neighbors,SIZE} from './world.js';
export function roadEdgeAllowed(s,from,to,mode='car'){
 const a=roadProfile(s.tiles[from]),b=roadProfile(s.tiles[to]);
 if(!a?.modes.includes(mode)||!b?.modes.includes(mode)||!neighbors(from).includes(to))return false;
 if(mode==='walk')return true;
 const dx=to%SIZE-from%SIZE,dy=Math.floor(to/SIZE)-Math.floor(from/SIZE);
 // Both departure and arrival must agree with the directed lane.
 for(const [p,i] of [[a,from],[b,to]])if(p.oneWay){const [vx,vy]=DIRECTION_VECTORS[s.tiles[i].roadDirection||'east'];if(dx*vx+dy*vy<0)return false;}
 return true;
}
export function roadNeighbors(s,i,mode='car'){return neighbors(i).filter(n=>s.network.connected.has(n)&&roadEdgeAllowed(s,i,n,mode));}
export function roadForAccess(s,i,mode){
 if(s.network.connected.has(i)&&roadProfile(s.tiles[i])?.modes.includes(mode))return i;
 return neighbors(i).find(n=>s.network.connected.has(n)&&roadProfile(s.tiles[n])?.modes.includes(mode));
}
export function remainingRouteValid(s,path,mode){
 const roads=path.filter(p=>p.road!=null).map(p=>p.road);
 return roads.every(i=>s.network.connected.has(i)&&roadProfile(s.tiles[i])?.modes.includes(mode))&&roads.every((i,n)=>!n||i===roads[n-1]||roadEdgeAllowed(s,roads[n-1],i,mode));
}
