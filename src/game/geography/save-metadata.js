import ids from '../../config/vietnam-province-ids.json' with {type:'json'};
import {localToWgs84} from './local-projection.js';
export function migrateGeographyMetadata(g){
  if(!g)return;
  const code=g.provinceCode??(/^[0-9]{2}$/.test(g.provinceId)?g.provinceId:ids[g.provinceId]);
  if(/^[0-9]{2}$/.test(g.provinceId))g.provinceId=Object.keys(ids).find(id=>ids[id]===code)??g.provinceId;
  g.provinceCode??=code;g.mapSnapshot??='2025-07-01';g.mapVersion??='vn-map-20250701-v1';
  g.worldOriginWgs84??=localToWgs84([0,0],g);
  g.localProjection??={crs:g.crs,axis:'east-south',units:'metres',originUtm:[...g.utmOrigin]};
  g.terrainSourceVersion??=g.version;
  return g;
}
export function validMapMetadata(g){
  return ids[g.provinceId]===g.provinceCode&&g.mapSnapshot==='2025-07-01'&&g.mapVersion==='vn-map-20250701-v1'&&g.terrainSourceVersion===g.version&&g.localProjection?.crs===g.crs&&g.localProjection.axis==='east-south'&&g.localProjection.units==='metres'&&Array.isArray(g.localProjection.originUtm)&&g.localProjection.originUtm.length===2&&g.localProjection.originUtm.every((v,i)=>v===g.utmOrigin[i])&&Array.isArray(g.worldOriginWgs84)&&g.worldOriginWgs84.length===2&&g.worldOriginWgs84.every((v,i)=>Number.isFinite(v)&&Math.abs(v-localToWgs84([0,0],g)[i])<1e-8);
}
