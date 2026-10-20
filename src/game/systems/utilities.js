import {healthcarePosts} from './healthcare.js';
import {municipalPosts} from './municipal-jobs.js';
import {logisticsPosts} from './logistics.js';
import {LANDMARKS} from '../../config/landmarks.js';
import {weatherState} from './weather.js';
import {residentCapacity,jobsCapacity,capacityFactor,MAINTENANCE_FACTORS} from '../../config/building-economy.js';
import {roadConnectionAllowed,roadHasFrontage} from './road-network.js';
import { CATALOG, BUILDINGS, ZONES, serviceKind } from '../../config/catalog.js';
import { isRoad, index, neighbors, distance, clamp } from './world.js';
import { WATER_PER_PERSON } from '../../config/simulation.js';
import {schoolPosts} from './education.js';
export function analyzeUtilities(s){
  const weather=weatherState(s);
  const connected=new Set(), q=[];const entry=s.world?.geography?.entryTile??index(0,18);
  if(isRoad(s.tiles[entry])){connected.add(entry);q.push(entry);}
  for(let p=0;p<q.length;p++)for(const n of neighbors(q[p]))if(isRoad(s.tiles[n])&&!connected.has(n)&&roadConnectionAllowed(s,q[p],n)){connected.add(n);q.push(n);}
  const services={};for(const kind of BUILDINGS)services[kind]=[];
  const roadAt=new Map();const zones=[];let pop=0,jobs=0,homes=0,upkeep=0,powerNeed=0,waterNeed=0;
  s.tiles.forEach((t,i)=>{
    t.connected=isRoad(t)?connected.has(i):neighbors(i).some(n=>connected.has(n)&&roadHasFrontage(s.tiles[n]));
    if(t.connected)roadAt.set(i,isRoad(t)?i:neighbors(i).find(n=>connected.has(n)&&roadHasFrontage(s.tiles[n])));
    if(BUILDINGS.includes(t.kind)&&t.connected){services[t.kind].push(i);if(serviceKind(t.kind)!==t.kind)(services[serviceKind(t.kind)]??=[]).push(i);}
    if(t.kind)upkeep+=(CATALOG[t.kind]?.upkeep||0)*(t.upgrade?MAINTENANCE_FACTORS[t.level]:1)*(s.budgets?.[serviceKind(t.kind)]??100)/100;
    if(t.zone)zones.push(i);
    if(t.kind==='residential'){pop+=t.residents;homes+=residentCapacity(t);}
    if(t.kind&&!isRoad(t)&&!CATALOG[t.kind]?.infrastructure&&!['power','water','busStop'].includes(serviceKind(t.kind))){powerNeed+=(LANDMARKS[t.kind]?LANDMARKS[t.kind].power:t.kind==='residential'?t.residents:ZONES.includes(t.kind)?18:8)* (t.kind==='residential'?1:capacityFactor(t));waterNeed+=(LANDMARKS[t.kind]?LANDMARKS[t.kind].water/WATER_PER_PERSON:t.kind==='residential'?t.residents:ZONES.includes(t.kind)?14:6)*(t.kind==='residential'?1:capacityFactor(t));}
  });
  powerNeed*=weather.powerDemandFactor;waterNeed*=weather.waterDemandFactor;
  const power=Math.round(services.power.reduce((n,i)=>n+CATALOG[s.tiles[i].kind].capacity*capacityFactor(s.tiles[i]),0)*(s.budgets?.power??100)/100), water=Math.round(services.water.reduce((n,i)=>n+CATALOG[s.tiles[i].kind].capacity*capacityFactor(s.tiles[i]),0)*WATER_PER_PERSON*(s.budgets?.water??100)/100);
  const covered=(kind,i)=>(services[kind]||[]).some(n=>distance(i,n)<=CATALOG[s.tiles[n].kind].range*Math.sqrt(capacityFactor(s.tiles[n])*(s.budgets?.[kind]??100)/100));
  const industrial=s.tiles.flatMap((t,i)=>t.kind==='industrial'||serviceKind(t.kind)==='waste'?[i]:[]);
  // Allocate scarce supply to public facilities first, then businesses/homes.
  // A small shortage must not switch every building off simultaneously.
  let powerRemaining=power,waterRemaining=water/WATER_PER_PERSON;
  const supplyOrder=s.tiles.map((t,i)=>i).sort((a,b)=>{
    const priority=t=>BUILDINGS.includes(t.kind)?0:ZONES.includes(t.kind)?1:2;
    return priority(s.tiles[a])-priority(s.tiles[b]);
  });
  for(const i of supplyOrder){const t=s.tiles[i];
    const p=LANDMARKS[t.kind]?LANDMARKS[t.kind].power:isRoad(t)||CATALOG[t.kind]?.infrastructure?0:['power','water','busStop'].includes(serviceKind(t.kind))?0:t.kind==='residential'?t.residents:t.kind?ZONES.includes(t.kind)?18*capacityFactor(t):8*capacityFactor(t):0;
    const w=LANDMARKS[t.kind]?LANDMARKS[t.kind].water/WATER_PER_PERSON:isRoad(t)||CATALOG[t.kind]?.infrastructure?0:['power','water','busStop'].includes(serviceKind(t.kind))?0:t.kind==='residential'?t.residents:t.kind?ZONES.includes(t.kind)?14*capacityFactor(t):6*capacityFactor(t):0;
    const powerDemand=p*weather.powerDemandFactor,waterDemand=w*weather.waterDemandFactor;
    t.power=t.connected&&(isRoad(t)||LANDMARKS[t.kind]&&powerDemand===0||covered('power',i))&&powerRemaining>=powerDemand;t.water=t.connected&&(isRoad(t)||LANDMARKS[t.kind]&&waterDemand===0||covered('water',i))&&waterRemaining>=waterDemand;
    if(t.power)powerRemaining-=powerDemand;if(t.water)waterRemaining-=waterDemand;
    t.active=t.kind==='busStop'?t.connected:t.connected&&t.power&&t.water&&(t.fire||0)<60;
  }
  for(const kind of BUILDINGS)if(!['power','water'].includes(serviceKind(kind)))services[kind]=services[kind].filter(i=>s.tiles[i].active);
  waterNeed*=WATER_PER_PERSON;
  const sewage=Math.round(services.sewage.reduce((n,i)=>n+CATALOG[s.tiles[i].kind].capacity*capacityFactor(s.tiles[i]),0)*WATER_PER_PERSON*(s.budgets?.sewage??100)/100);
  s.tiles.forEach((t,i)=>{
    t.wasteCollection=t.connected?Math.max(0,...services.waste.filter(n=>distance(i,n)<=CATALOG[s.tiles[n].kind].range*Math.sqrt(capacityFactor(s.tiles[n])*(s.budgets?.waste??100)/100)).map(n=>(CATALOG[s.tiles[n].kind].collection||4)*capacityFactor(s.tiles[n]))):0;
    t.sewage=t.connected&&covered('sewage',i)&&sewage>=waterNeed;
    t.pollution=clamp(industrial.reduce((p,n)=>p+Math.max(0,7-distance(i,n))*5,0)+(t.kind==='residential'&&!t.sewage?12:0)+(t.garbage||0)*.18,0,100);
    t.services=t.connected?BUILDINGS.filter(k=>!CATALOG[k].decorative&&serviceKind(k)===k).filter(k=>!['power','water','bus','busStop'].includes(k)&&covered(k,i)):[];
    t.serviceStrengths=Object.fromEntries(t.services.map(kind=>[kind,Math.max(0,...services[kind].filter(n=>distance(i,n)<=CATALOG[s.tiles[n].kind].range*Math.sqrt(capacityFactor(s.tiles[n])*(s.budgets?.[kind]??100)/100)).map(n=>capacityFactor(s.tiles[n])))]));
    if(t.active&&t.kind==='commercial')jobs+=jobsCapacity(t);
    if(t.active&&t.kind==='industrial')jobs+=jobsCapacity(t);
    if(t.active)jobs+=schoolPosts(t)+healthcarePosts(t)+municipalPosts(t)+logisticsPosts(t);
  });
  return {connected,services,roadAt,pop,jobs,homes,upkeep,powerNeed,waterNeed,power,water,sewage};
}
