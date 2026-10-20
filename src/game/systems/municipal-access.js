import {municipalSnapshot} from './municipal-jobs.js';
import {MUNICIPAL_PROFILES} from '../../config/municipal-jobs.js';
import {route} from './roads.js';
import {distance} from './world.js';
// Staff, a usable fleet and a real lane path are required. Range alone gives
// no service. The population budget is shared across overlapping depots.
export function municipalAccess(s,service){
 const homes=s.tiles.flatMap((t,i)=>t.kind==='residential'&&t.residents>0?[{tile:i,residents:t.residents}]:[]),rows=municipalSnapshot(s).facilities.filter(r=>r.service===service&&!r.reason&&r.vehicles>0&&r.present>=r.crew).map(r=>({...r,remaining:r.present*200}));
 let accessible=0,total=0;for(const h of homes){total+=h.residents;let left=h.residents;for(const r of rows){if(!left)break;const p=MUNICIPAL_PROFILES[r.kind];if(r.remaining<=0||distance(h.tile,r.tile)>p.range||!route(s,r.tile,h.tile,'car').length)continue;const n=Math.min(left,r.remaining);accessible+=n;left-=n;r.remaining-=n;}}
 return {population:total,accessible,pct:total?accessible/total*100:undefined};
}
