import { entityId } from './events.js';
export function reconcileVehicles(s) {
  const ids=new Set(s.citizens.map(c=>c.id));
  s.vehicles=s.vehicles.filter(v=>v.kind==='bus'?(s.busLines||[]).some(l=>l.id===v.operator&&v.fleetIndex<l.vehicles):v.owner&&ids.has(v.owner));
  for(const c of s.citizens) {
    if(c.vehicle&&!s.vehicles.some(v=>v.id===c.vehicle)) c.vehicle=null;
    // A stable subset of employed adults receives legacy household cars.
    if(c.work&&!c.vehicle&&Number(c.id.split('-').at(-1))%3===0) {
      const v={id:entityId(s,'vehicle'),owner:c.id,kind:'car',state:'parked',position:{...c.position},passengers:[],goal:c.home,speed:0};
      c.vehicle=v.id; s.vehicles.push(v);
    }
  }
  for(const line of s.busLines||[]) for(let i=0;i<line.vehicles;i++) if(!s.vehicles.some(v=>v.operator===line.id&&v.fleetIndex===i)) {
    const stop=line.stops[0],x=(stop%s.mapSize+.5)*20,y=(Math.floor(stop/s.mapSize)+.5)*20;
    s.vehicles.push({id:entityId(s,'vehicle'),kind:'bus',owner:null,operator:line.id,fleetIndex:i,state:'parked',position:{x,y,z:0},passengers:[],goal:stop,speed:0,route:null});
  }
}
export function updateVehicles(s) {
  const citizens=new Map(s.citizens.map(c=>[c.id,c]));
  for(const v of s.vehicles) {
    if(v.kind==='bus')continue; // Bus schedules/boarding belong to stage 11.
    const c=citizens.get(v.owner); if(!c) continue;
    if(c.journey?.mode==='car') {v.position={...c.position};v.state=c.state==='blocked'?'blocked':'travelling';v.speed=c.state==='blocked'?0:c.journey.speed;v.goal=c.goal;v.passengers=[c.id];}
    else {v.state='parked';v.speed=0;v.passengers=[];v.position={...c.position};}
  }
}
