import {ROAD_KINDS} from '../../config/road-profiles.js';
import {orientBuildingToRoad} from './street-environment.js';
import {roadParts} from './scene-data.js';
import {pierParts} from './infrastructure-parts.js';
import {terrainHeight} from '../systems/terrain.js';
import {buildingParts} from './building-designs.js';
import {surfaceHeight} from '../systems/terrain.js';
import {placementQuote} from '../systems/placement.js';
import {SIZE} from '../core.js';
export function placementGhost(s,hover,tool,designId=null){
 if(!hover||['inspect','bulldoze'].includes(tool))return null;
 const t=s.tiles[hover.i];if(!t)return null;
 const valid=placementQuote(s,hover.i,tool).ok;
 const color=valid?'#4de0b7':'#ef8c84',cx=(hover.x+.5)*20,cz=(hover.y+.5)*20,base=surfaceHeight(s,hover.i,SIZE,['residential','commercial','industrial'].includes(tool)?null:tool);
 // Placement preview uses the same solid architecture and road-facing entry as the real lot.
 const planned=['residential','commercial','industrial'].includes(tool),road=ROAD_KINDS.includes(tool);
 const parts=tool==='bridgePier'?pierParts(cx,cz,terrainHeight(s.world,cx,cz),6,hover.i,color):road?roadParts(s,hover.x,hover.y,tool,'normal',color).filter(p=>!p.detail):orientBuildingToRoad(s,hover.i,buildingParts({kind:tool,level:1,blueprint:designId},hover.x,hover.y,cx,cz,base,color,hover.i),base).filter(p=>!p.detail);
 return{valid,parts,key:`${s.initialSeed}/${hover.i}/${tool}/${designId}/${base}/${valid}/${t.kind}/${s.graphVersion}`};
}
