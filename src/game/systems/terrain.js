import {ROAD_KINDS,roadProfile} from '../../config/road-profiles.js';
import {validateGeography} from '../geography/data.js';
import {CELL_METERS} from '../../config/simulation.js';
// Heightfield vertices are metres; old maps stay flat instead of lifting saved trips.
export function createTerrain(size,{flat=false}={}){
  const heights=[];
  for(let y=0;y<=size;y++)for(let x=0;x<=size;x++){
    const hills=Math.max(0,x-35)*.16+Math.max(0,y-30)*.045;
    const river=30+Math.sin(y*.23)*2,bank=Math.min(1,Math.max(0,(Math.abs(x-river)-1)/3));
    const land=1.8+hills*(1.1+.35*Math.sin(x*.19)*Math.cos(y*.17));
    heights.push(flat?(Math.abs(x-river)<1.5?-2:0):Math.round((bank?land*bank:-1.8)*1000)/1000);
  }
  return {version:1,cellMeters:CELL_METERS,widthMeters:size*CELL_METERS,heightMeters:size*CELL_METERS,waterHeight:flat?-1:0,legacyFlat:flat,heights};
}
export function validateTerrain(world,size){
  if(!world||world.version!==1||world.cellMeters!==CELL_METERS||world.widthMeters!==size*CELL_METERS||world.heightMeters!==size*CELL_METERS||!Number.isFinite(world.waterHeight)||!Array.isArray(world.heights)||world.heights.length!==(size+1)**2||world.heights.some(h=>!Number.isFinite(h)||h< -12000||h>9000))throw new Error('Địa hình heightfield không hợp lệ.');
  validateGeography(world.geography,size);
  if(world.geography&&world.legacyFlat)throw new Error('Địa hình Việt Nam không được thay bằng bản đồ phẳng.');
  if(world.waterLevels!=null&&(!Array.isArray(world.waterLevels)||world.waterLevels.length!==size**2||world.waterLevels.some(h=>!Number.isFinite(h)||h< -12000||h>9000)))throw new Error('Cao trình mặt nước không hợp lệ.');
  return structuredClone(world);
}
export function terrainHeight(world,x,y){
  if(!world?.heights)return 0;
  const size=Math.round(world.widthMeters/CELL_METERS),gx=Math.max(0,Math.min(size-1e-8,x/CELL_METERS)),gy=Math.max(0,Math.min(size-1e-8,y/CELL_METERS)),ix=Math.floor(gx),iy=Math.floor(gy),u=gx-ix,v=gy-iy,at=(a,b)=>world.heights[b*(size+1)+a];
  // Match the two rendered triangles, not a different bilinear surface.
  return u+v<=1?at(ix,iy)+(at(ix+1,iy)-at(ix,iy))*u+(at(ix,iy+1)-at(ix,iy))*v:at(ix+1,iy+1)+(at(ix,iy+1)-at(ix+1,iy+1))*(1-u)+(at(ix+1,iy)-at(ix+1,iy+1))*(1-v);
}
export function cellHeights(world,tile,size){const x=tile%size,y=Math.floor(tile/size),at=(a,b)=>world?.heights?.[b*(size+1)+a]??0;return [at(x,y),at(x+1,y),at(x,y+1),at(x+1,y+1)];}
export function surfaceHeight(s,tile,size,kind=s.tiles[tile].kind){
  const t=s.tiles[tile],elevation=roadProfile(kind)?.elevation||0;
  if(elevation){const ground=s.world?.legacyFlat?0:Math.max(...cellHeights(s.world,tile,size))+.14;return (t.terrain==='water'?Math.max(ground,waterHeightAt(s.world,tile)):ground)+elevation;}
  if(!s.world||s.world.legacyFlat)return 0;
  if(ROAD_KINDS.includes(kind)&&t.terrain==='water')return waterHeightAt(s.world,tile)+6;
  const h=cellHeights(s.world,tile,size);
  return kind?Math.max(...h)+(ROAD_KINDS.includes(kind)?.14:.1):terrainHeight(s.world,(tile%size+.5)*CELL_METERS,(Math.floor(tile/size)+.5)*CELL_METERS);
}
export function slopeAt(world,tile,size){const h=cellHeights(world,tile,size);return Math.max(Math.abs(h[1]-h[0]),Math.abs(h[2]-h[0]),Math.abs(h[3]-h[1]),Math.abs(h[3]-h[2]))/CELL_METERS*100;}

export function waterHeightAt(world,tile){return world?.waterLevels?.[tile]??world?.waterHeight??0;}
