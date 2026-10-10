import {neighbors} from './world.js';
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
  // Fixed alternating signal only at three/four-way connected junctions. It is a
  // simulation signal; no signal is claimed on disconnected/decorative roads.
  if(road!=null&&neighbors(road).filter(i=>s.network.connected.has(i)).length>=3){
   const vertical=Math.abs(dy)>Math.abs(dx),northGreen=Math.floor(s.clock.seconds/24)%2===0;
   const remaining=Math.hypot(next.x-c.position.x,next.y-c.position.y);
   if(vertical!==northGreen&&remaining>0&&remaining<=5+j.speed){speed=Math.min(speed,Math.max(0,remaining-5));reason='Chờ đèn tại giao lộ';}
  }
  if(j.mode==='car'){
   const x=Math.floor(c.position.x/20),y=Math.floor(c.position.y/20);
   for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)for(const other of buckets.get(`${x+ox},${y+oy}`)||[]){
    if(other.id===c.id||other.heading[0]*dx+other.heading[1]*dy<.80)continue;
    const rx=other.x-c.position.x,ry=other.y-c.position.y,ahead=rx*dx+ry*dy,side=Math.abs(-rx*dy+ry*dx);
    const gap=(c.kind==='bus'?6:2)+(other.length?other.length/2:2)+3;
    if(ahead>0&&side<1.9&&ahead<gap+j.speed){const safe=Math.max(0,ahead-gap);if(safe<speed){speed=safe;reason='Giữ khoảng cách với xe phía trước';}}
   }
  }
  return{speed,reason};
 };
}
