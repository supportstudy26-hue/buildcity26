import { CATALOG, BUILDINGS, ZONES } from '../../config/catalog.js';
import { isRoad, index, neighbors, distance, clamp } from './world.js';
import { WATER_PER_PERSON } from '../../config/simulation.js';
export function analyzeUtilities(s){
  const connected=new Set(), q=[];const entry=s.world?.geography?.entryTile??index(0,18);
  if(isRoad(s.tiles[entry])){connected.add(entry);q.push(entry);}
  for(let p=0;p<q.length;p++)for(const n of neighbors(q[p]))if(isRoad(s.tiles[n])&&!connected.has(n)){connected.add(n);q.push(n);}
  const services={};for(const kind of BUILDINGS)services[kind]=[];
  const roadAt=new Map();const zones=[];let pop=0,jobs=0,homes=0,upkeep=0,powerNeed=0,waterNeed=0;
  s.tiles.forEach((t,i)=>{
    t.connected=isRoad(t)?connected.has(i):neighbors(i).some(n=>connected.has(n));
    if(t.connected)roadAt.set(i,isRoad(t)?i:neighbors(i).find(n=>connected.has(n)));
    if(BUILDINGS.includes(t.kind)&&t.connected)services[t.kind].push(i);
    if(t.kind)upkeep+=(CATALOG[t.kind]?.upkeep||0)*(s.budgets?.[t.kind]??100)/100;
    if(t.zone)zones.push(i);
    if(t.kind==='residential'){pop+=t.residents;homes+=24*t.level;}
    if(t.kind&&!isRoad(t)&&!['power','water','busStop'].includes(t.kind)){powerNeed+=t.kind==='residential'?t.residents:ZONES.includes(t.kind)?18:8;waterNeed+=t.kind==='residential'?t.residents:ZONES.includes(t.kind)?14:6;}
  });
  const power=Math.round(services.power.length*500*(s.budgets?.power??100)/100), water=Math.round(services.water.length*500*WATER_PER_PERSON*(s.budgets?.water??100)/100);
  const covered=(kind,i)=>services[kind].some(n=>distance(i,n)<=CATALOG[kind].range*Math.sqrt((s.budgets?.[kind]??100)/100));
  const industrial=s.tiles.flatMap((t,i)=>t.kind==='industrial'||t.kind==='waste'?[i]:[]);
  // Allocate scarce supply to public facilities first, then businesses/homes.
  // A small shortage must not switch every building off simultaneously.
  let powerRemaining=power,waterRemaining=water/WATER_PER_PERSON;
  const supplyOrder=s.tiles.map((t,i)=>i).sort((a,b)=>{
    const priority=t=>BUILDINGS.includes(t.kind)?0:ZONES.includes(t.kind)?1:2;
    return priority(s.tiles[a])-priority(s.tiles[b]);
  });
  for(const i of supplyOrder){const t=s.tiles[i];
    const p=['power','water','busStop'].includes(t.kind)?0:t.kind==='residential'?t.residents:t.kind?ZONES.includes(t.kind)?18:8:0;
    const w=['power','water','busStop'].includes(t.kind)?0:t.kind==='residential'?t.residents:t.kind?ZONES.includes(t.kind)?14:6:0;
    t.power=t.connected&&covered('power',i)&&powerRemaining>=p;t.water=t.connected&&covered('water',i)&&waterRemaining>=w;
    if(t.power)powerRemaining-=p;if(t.water)waterRemaining-=w;
    t.active=t.kind==='busStop'?t.connected:t.connected&&t.power&&t.water&&(t.fire||0)<60;
  }
  for(const kind of BUILDINGS)if(!['power','water'].includes(kind))services[kind]=services[kind].filter(i=>s.tiles[i].active);
  waterNeed*=WATER_PER_PERSON;
  const sewage=Math.round(services.sewage.length*600*WATER_PER_PERSON*(s.budgets?.sewage??100)/100);
  s.tiles.forEach((t,i)=>{
    t.sewage=t.connected&&covered('sewage',i)&&sewage>=waterNeed;
    t.pollution=clamp(industrial.reduce((p,n)=>p+Math.max(0,7-distance(i,n))*5,0)+(t.kind==='residential'&&!t.sewage?12:0)+(t.garbage||0)*.18,0,100);
    t.services=t.connected?BUILDINGS.filter(k=>!['power','water','bus','busStop'].includes(k)&&covered(k,i)):[];
    if(t.active&&t.kind==='commercial')jobs+=16*t.level;
    if(t.active&&t.kind==='industrial')jobs+=28*t.level;
  });
  return {connected,services,roadAt,pop,jobs,homes,upkeep,powerNeed,waterNeed,power,water,sewage};
}
