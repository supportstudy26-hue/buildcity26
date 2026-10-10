import {BuildingArtRegistry,artForBuilding} from '../config/building-art.js';
const atlases=new Map(),thumbs=new Map();const MAX_ATLASES=4,MAX_THUMBS=80;
function remember(cache,key,value,max){cache.delete(key);cache.set(key,value);while(cache.size>max)cache.delete(cache.keys().next().value);return value;}
async function image(url){
 if(atlases.has(url))return remember(atlases,url,atlases.get(url),MAX_ATLASES);
 const pending=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Không tải được ảnh công trình'));im.src=url;});
 remember(atlases,url,pending,MAX_ATLASES);try{return await pending;}catch(e){if(atlases.get(url)===pending)atlases.delete(url);throw e;}
}
async function thumbnail(id){
 if(thumbs.has(id))return remember(thumbs,id,thumbs.get(id),MAX_THUMBS);
 const asset=BuildingArtRegistry[id];if(!asset)throw new Error('Mã mỹ thuật không hợp lệ');
 const im=await image(asset.atlas),f=asset.frame;
 if(f.x<0||f.y<0||f.width<=0||f.height<=0||f.x+f.width>im.naturalWidth||f.y+f.height>im.naturalHeight)throw new Error('Frame không hợp lệ');
 const c=document.createElement('canvas');c.width=144;c.height=128;const ctx=c.getContext('2d');const scale=Math.min(140/f.width,122/f.height),w=f.width*scale,h=f.height*scale;
 ctx.drawImage(im,f.x,f.y,f.width,f.height,(144-w)/2,128-h-3,w,h);
 return remember(thumbs,id,c.toDataURL('image/webp',.86),MAX_THUMBS);
}
export function buildingThumbnail(kind,designId=null){const a=artForBuilding(kind,designId);return a?`<img class="building-preview art-thumbnail" data-art-id="${a.id}" alt="${a.nameVi}" width="144" height="128">`:'';}
// Observe visible cards only, discard stale DOM work after group/filter/inspector changes.
const waiting=new Set();
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);waiting.delete(entry.target);const el=entry.target,id=el.dataset.artId;thumbnail(id).then(src=>{if(el.isConnected&&el.dataset.artId===id)el.src=src;}).catch(()=>{if(el.isConnected){el.dataset.artError='true';el.alt='Ảnh chưa tải · '+el.alt;}});}});
export function hydrateBuildingThumbnails(root){for(const el of waiting)if(!el.isConnected){observer.unobserve(el);waiting.delete(el);}
 root.querySelectorAll('img[data-art-id]:not([src])').forEach(el=>{waiting.add(el);observer.observe(el);});}
export function thumbnailCacheStats(){return{atlases:atlases.size,maxAtlases:MAX_ATLASES,thumbnails:thumbs.size,maxThumbnails:MAX_THUMBS,atlasDecodeUpperBytes:atlases.size*1254*1254*4};}
