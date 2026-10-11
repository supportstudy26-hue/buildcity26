import {roadProfile,DIRECTION_VECTORS} from '../../config/road-profiles.js';
import {neighbors,SIZE} from './world.js';
import {surfaceHeight} from './terrain.js';
// A motorway has no street crossing; changes of deck height require a ramp.
export function roadConnectionAllowed(s,from,to,fromKind=s.tiles[from]?.kind,toKind=s.tiles[to]?.kind){
 const a=roadProfile(fromKind),b=roadProfile(toKind);
 if(!a||!b||!neighbors(from).includes(to))return false;
 if(a.motorway&&!b.motorway&&!b.ramp||b.motorway&&!a.motorway&&!a.ramp)return false;
 if((a.elevation||b.elevation)&&Math.abs(surfaceHeight(s,from,SIZE,fromKind)-surfaceHeight(s,to,SIZE,toKind))>3.3)return false;
 return true;
}
export const roadHasFrontage=t=>!!roadProfile(t)&&roadProfile(t).frontage!==false;
export function roadEdgeAllowed(s,from,to,mode='car'){
 const a=roadProfile(s.tiles[from]),b=roadProfile(s.tiles[to]);
 if(!a?.modes.includes(mode)||!b?.modes.includes(mode)||!roadConnectionAllowed(s,from,to))return false;
 if(mode==='walk')return true;
 const dx=to%SIZE-from%SIZE,dy=Math.floor(to/SIZE)-Math.floor(from/SIZE);
 // Both departure and arrival must agree with the directed lane.
 for(const [p,i] of [[a,from],[b,to]])if(p.oneWay){const [vx,vy]=DIRECTION_VECTORS[s.tiles[i].roadDirection||'east'];if(dx*vx+dy*vy<0)return false;}
 return true;
}
export function roadNeighbors(s,i,mode='car'){return neighbors(i).filter(n=>s.network.connected.has(n)&&roadEdgeAllowed(s,i,n,mode));}
export function roadForAccess(s,i,mode){
 if(s.network.connected.has(i)&&roadProfile(s.tiles[i])?.modes.includes(mode))return i;
 return neighbors(i).find(n=>roadHasFrontage(s.tiles[n])&&s.network.connected.has(n)&&roadProfile(s.tiles[n])?.modes.includes(mode));
}
export function remainingRouteValid(s,path,mode){
 for(const p of path){if(p.road==null)continue;const profile=roadProfile(s.tiles[p.road]);if(profile?.elevation&&Math.abs(p.z-surfaceHeight(s,p.road,SIZE))>.5)return false;if(profile?.circle){const cx=(p.road%SIZE+.5)*20,cy=(Math.floor(p.road/SIZE)+.5)*20;if(Math.hypot(p.x-cx,p.y-cy)<profile.circle.island+.3)return false;}}
 const roads=path.filter(p=>p.road!=null).map(p=>p.road);
 return roads.every(i=>s.network.connected.has(i)&&roadProfile(s.tiles[i])?.modes.includes(mode))&&roads.every((i,n)=>!n||i===roads[n-1]||roadEdgeAllowed(s,roads[n-1],i,mode));
}
