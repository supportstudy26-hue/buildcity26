import { ROADS } from '../../config/catalog.js';
export const SIZE=64;
import { CELL_METERS } from '../../config/simulation.js';
import {createTerrain,surfaceHeight} from './terrain.js';
export function position(tile, size, s) { return { x: (tile % size + .5)*CELL_METERS, y: (Math.floor(tile/size)+.5)*CELL_METERS, z: s?surfaceHeight(s,tile,size):0 }; }
export function distanceMeters(a,b) { return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z); }
export function initializeWorld(s, size) {
  s.world ??= createTerrain(size,{flat:true});
  for (let i=0;i<s.tiles.length;i++) {
    const t=s.tiles[i]; t.id ??= `plot-${i}`;
    if(t.kind) t.assetId ??= `initial-asset-${i}`;
    t.footprint = {width:t.kind==='road'?12:t.kind==='avenue'?18:t.kind?14:20,depth:20};
  }
}
export const index = (x,y) => y*SIZE+x;
export const inside = (x,y) => Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<SIZE&&y<SIZE;
export const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export const neighbors = i => {const x=i%SIZE,y=Math.floor(i/SIZE);return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>inside(a,b)).map(([a,b])=>index(a,b));};
export const distance = (a,b) => Math.hypot(a%SIZE-b%SIZE,Math.floor(a/SIZE)-Math.floor(b/SIZE));
export const isRoad = tile => ROADS.includes(tile.kind);
export function terrainAt(x,y){const river=30+Math.sin(y*.23)*2;return Math.abs(x-river)<1.4?'water':Math.abs(x-river)<2.3?'sand':'grass';}
