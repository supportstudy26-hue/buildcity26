import {roadProfile} from '../../config/road-profiles.js';
import {neighbors,SIZE} from './world.js';
import {roadConnectionAllowed} from './road-network.js';
export function junctionApproaches(s,i){return neighbors(i).filter(n=>roadConnectionAllowed(s,i,n)&&s.network?.connected.has(n)&&roadProfile(s.tiles[n])?.modes.includes('car'));}
export function isJunction(s,i){return !roadProfile(s.tiles[i])?.circle&&!roadProfile(s.tiles[i])?.motorway&&s.network?.connected.has(i)&&roadProfile(s.tiles[i])?.modes.includes('car')&&junctionApproaches(s,i).length>=3;}
// One protected approach at a time also protects left turns. 2 s amber + 2 s
// clearance separate vehicle phases; all vehicle approaches stop for pedestrians.
// A shared simulation clock drives meshes and vehicles, including save/load.
export function junctionState(s,i,seconds=s.clock.seconds){
 const mode=s.tiles[i]?.junctionControl||'signal';
 const t=((Math.floor(seconds)+i%7)%66+66)%66;
 const group=Math.floor(t/14),within=t%14;
 return {mode,cycle:t,approach:group<4?['north','east','south','west'][group]:null,
  light:t<56?(within<10?'green':within<12?'amber':'red'):'red',
  pedestrian:mode==='signal'&&t>=56&&t<64,clearance:mode==='signal'&&(t>=64||t<56&&within>=12)};
}
export function approachDirection(dx,dy){return Math.abs(dx)>Math.abs(dy)?dx>0?'west':'east':dy>0?'north':'south';}
export function junctionAllows(s,i,dx,dy,mode){const p=junctionState(s,i);if(p.mode==='off')return true;if(p.mode==='yield')return null;return mode==='walk'?p.pedestrian:p.light==='green'&&p.approach===approachDirection(dx,dy);}
export function junctionQueues(s,i){
 const rows={north:0,east:0,south:0,west:0};
 for(const c of [...s.citizens,...s.vehicles]){const j=c.journey||c.trip;if(!j||j.actualSpeed>.2||!(c.waitReason||'').includes('giao lộ'))continue;const p=j.path[j.segment+1];if(p?.road!==i)continue;rows[approachDirection(p.x-c.position.x,p.y-c.position.y)]++;}
 return rows;
}
