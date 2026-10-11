import {ROAD_KINDS} from '../../config/road-profiles.js';
import {migrateGeographyMetadata} from './save-metadata.js';
import {createEmptyCity,SIZE,analyze,random} from '../core.js';
import {initializeFoundation} from '../systems/foundation.js';
import {cellHeights,slopeAt} from '../systems/terrain.js';
import {validateRegion} from './data.js';
// Each local tile remains 20 metres; the 12.8km overview is never compressed to this grid.
export function createVietnamCity(pkg,manifest){
  validateRegion(pkg);if(manifest?.version!==pkg.version)throw new Error('Manifest địa lý không khớp.');
  const s=createEmptyCity(),r=pkg.region,p=pkg.playable;
  for(const t of s.tiles)Object.assign(t,{terrain:'grass',kind:null,zone:null,level:0,residents:0,age:0,garbage:0,hazard:0,fire:0,crime:0,health:100,education:0,assetId:null,historicalCost:0});
  s.name='Thành phố '+r.provinceName;s.households=[];s.citizens=[];s.firms=[];s.vehicles=[];s.contracts=[];s.events=[];s.progression=undefined;
  s.world={version:1,cellMeters:20,widthMeters:SIZE*20,heightMeters:SIZE*20,waterHeight:0,legacyFlat:false,heights:[...p.heights],waterLevels:p.waterMask.map((v,i)=>v===1?0:cellAverage(p.heights,i)+.12),geography:{mode:'vietnam',version:pkg.version,regionId:r.id,provinceId:r.provinceId,provinceName:r.provinceName,anchor:[...r.anchor],crs:pkg.crs,utmOrigin:[pkg.utmCenter[0]-640,pkg.utmCenter[1]+640],entryTile:r.entryTile,waterMask:[...p.waterMask],insideProvince:[...p.insideProvince],osmDate:manifest.osmDate,demEdition:manifest.demEdition,sourceHashes:pkg.demTiles.map(t=>t.sha256)}};
  migrateGeographyMetadata(s.world.geography);
  p.waterMask.forEach((v,i)=>s.tiles[i].terrain=v?'water':'grass');
  const x=r.entryTile%SIZE,y=Math.floor(r.entryTile/SIZE);
  for(let dx=0;dx<4;dx++){const i=r.entryTile+dx;if(x+dx>=SIZE||p.waterMask[i]||!p.insideProvince[i]||slopeAt(s.world,i,SIZE)>20||Math.min(...cellHeights(s.world,i,SIZE))<0)throw new Error('Cổng khởi đầu không đủ điều kiện xây.');Object.assign(s.tiles[i],{kind:'road',level:1,assetId:'vietnam-game-connector-'+dx});}
  analyze(s);initializeFoundation(s,SIZE,random);return s;
}
function cellAverage(h,i){const x=i%64,y=Math.floor(i/64);return(h[y*65+x]+h[y*65+x+1]+h[(y+1)*65+x]+h[(y+1)*65+x+1])/4;}
export function geographyBuildRule(s,tile,kind){
  const g=s.world?.geography;if(!g||kind==='bulldoze')return {ok:true,factor:1};
  if(!g.insideProvince[tile])return {ok:false,message:'Ô đất nằm ngoài địa phương được chọn.'};
  const slope=slopeAt(s.world,tile,SIZE),road=ROAD_KINDS.includes(kind);
  if(s.tiles[tile].terrain==='water'&&!road)return {ok:false,message:'Không xây công trình trên biển, hồ hoặc sông. Chưa có công trình hỗ trợ mặt nước.'};
  if(!s.tiles[tile].terrain.startsWith('water')&&Math.min(...cellHeights(s.world,tile,SIZE))<0)return {ok:false,message:'Đất thấp hơn mực biển. Chưa có hệ thống đê/bảo vệ ngập.'};
  // Roads use supported terraces and ramps on hills. Keep the building limit:
  // allowing a mountain road must not unlock buildings on unsafe slopes.
  if(!road&&slope>15)return {ok:false,message:`Dốc ${slope.toFixed(1)}% vượt giới hạn 15% của công trình. Chọn đất ít dốc hơn.`};
  // Explicit starter rule; Appendix A full civil-engineering prices remain separate work.
  return {ok:true,factor:s.tiles[tile].terrain==='water'?1:1+slope/20,slope};
}
