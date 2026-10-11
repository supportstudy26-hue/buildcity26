import {roadProfile} from '../../config/road-profiles.js';
import {position,SIZE} from './world.js';
import {isJunction,junctionAllows} from './junctions.js';
const direction=j=>{const a=j.path[j.segment],b=j.path[j.segment+1],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);return d?[dx/d,dy/d]:[0,0];};
export function roadControllers(s){
 // Spatial grid bounds neighbour work independently of population. Snapshot makes
 // decisions independent of entity update order; positions remain owned by core.
 const buckets=new Map();
 for(const c of s.citizens)if(c.journey?.mode==='car'&&c.state!=='blocked'){
  const x=Math.floor(c.position.x/20),y=Math.floor(c.position.y/20),key=`${x},${y}`;
  if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push({id:c.id,...c.position,heading:direction(c.journey)});
 }
 for(const v of s.vehicles)if(v.kind==='bus'&&v.busPhase&&v.busPhase!=='depot'){const key=`${Math.floor(v.position.x/20)},${Math.floor(v.position.y/20)}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push({id:v.id,...v.position,heading:v.trip?direction(v.trip):[Math.sin(v.visualYaw||0),Math.cos(v.visualYaw||0)],length:12});}
 return c=>{
  const j=c.journey,[dx,dy]=direction(j);let speed=j.speed,reason='';
  const next=j.path[j.segment+1],road=next.road;
  const current=j.path[j.segment].road,p=roadProfile(s.tiles[road??current]);
  if(p&&j.mode!=='walk')speed=Math.min(speed,p.speed/3.6);
  if(p?.circle&&next.roundaboutEntry&&j.mode!=='walk'&&current!==road){
   const centre=position(road,SIZE,s),bx=Math.floor(centre.x/20),by=Math.floor(centre.y/20);let occupied=false;
   for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)for(const o of buckets.get(`${bx+ox},${by+oy}`)||[])if(o.id!==c.id&&Math.abs((o.z||0)-centre.z)<2&&Math.hypot(o.x-centre.x,o.y-centre.y)<p.circle.outer-.25)occupied=true;
   const remaining=Math.hypot(next.x-c.position.x,next.y-c.position.y);
   if(occupied){speed=Math.min(speed,Math.max(0,remaining-.8));reason='Nhường xe trong vòng xuyến';}
  }
  if(road!=null&&isJunction(s,road)){
   const remaining=Math.hypot(next.x-c.position.x,next.y-c.position.y);
   const stop=(p?.width||12)/2+1,allowed=junctionAllows(s,road,dx,dy,j.mode);
   let yielding=false;
   if(allowed===null){
    const bx=Math.floor(next.x/20),by=Math.floor(next.y/20),near=[];for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)near.push(...(buckets.get(`${bx+ox},${by+oy}`)||[]));
    const crossing=near.filter(o=>o.id!==c.id&&Math.hypot(o.x-next.x,o.y-next.y)<stop+4);
    yielding=crossing.some(o=>Math.abs(o.heading[0]*dx+o.heading[1]*dy)<.8);
   }
   // Once past the stop line, clear the junction rather than stop inside it.
   if((allowed===false||yielding)&&remaining>=stop-.01&&remaining<=stop+j.speed){speed=Math.min(speed,Math.max(0,remaining-stop));reason=yielding?'Nhường xe trong giao lộ':'Chờ đèn tại giao lộ';}
  }
  if(j.mode==='car'){
   const x=Math.floor(c.position.x/20),y=Math.floor(c.position.y/20);
   for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)for(const other of buckets.get(`${x+ox},${y+oy}`)||[]){
    if(Math.abs((other.z||0)-(c.position.z||0))>2||other.id===c.id||other.heading[0]*dx+other.heading[1]*dy<.80)continue;
    const rx=other.x-c.position.x,ry=other.y-c.position.y,ahead=rx*dx+ry*dy,side=Math.abs(-rx*dy+ry*dx);
    const gap=(c.kind==='bus'?6:2)+(other.length?other.length/2:2)+3;
    if(ahead>0&&side<1.9&&ahead<gap+j.speed){const safe=Math.max(0,ahead-gap);if(safe<speed){speed=safe;reason='Giữ khoảng cách với xe phía trước';}}
   }
  }
  return{speed,reason};
 };
}
