import {roadParts} from './scene-data.js';
import {buildingParts} from './building-designs.js';
import {surfaceHeight} from '../systems/terrain.js';
import {geographyBuildRule} from '../geography/city.js';
import {SIZE} from '../core.js';
export function placementGhost(s,hover,tool){
 if(!hover||['inspect','bulldoze'].includes(tool))return null;
 const t=s.tiles[hover.i];if(!t)return null;
 const rule=geographyBuildRule(s,hover.i,tool),valid=rule.ok&&(!t.kind&&!t.zone||t.kind==='road'&&tool==='avenue');
 const color=valid?'#4de0b7':'#ef8c84',cx=(hover.x+.5)*20,cz=(hover.y+.5)*20,base=surfaceHeight(s,hover.i,SIZE,['residential','commercial','industrial'].includes(tool)?null:tool);
 // Zones are plans, not instant occupied buildings. Their footprint remains a flat lot.
 const planned=['residential','commercial','industrial'].includes(tool),road=['road','avenue'].includes(tool);
 const parts=road?roadParts(s,hover.x,hover.y,tool,'normal',color).filter(p=>!p.detail):planned?[{shape:'box',position:[cx,base+.1,cz],scale:[18,.2,18],color,detail:false,tile:hover.i}]:buildingParts({kind:tool,level:1},hover.x,hover.y,cx,cz,base,color,hover.i).filter(p=>!p.detail);
 return{valid,parts,key:`${s.initialSeed}/${hover.i}/${tool}/${base}/${valid}/${t.kind}/${s.graphVersion}`};
}
