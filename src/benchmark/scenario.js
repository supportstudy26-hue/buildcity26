import {createCity,analyze,SIZE,index,stepSimulation} from '../game/core.js';
import {initializeFoundation} from '../game/systems/foundation.js';
import {createClock} from '../game/systems/clock.js';
import {random} from '../game/systems/rng.js';
// Isolated fixtures: no storage, authentication, cloud writes or ranked scores.
export function benchmarkCity(population){
  if(![300,1000,5000,10000].includes(population))throw new Error('Quy mô benchmark không hợp lệ');
  const s=createCity();for(const t of s.tiles)Object.assign(t,{kind:null,zone:null,level:0,residents:0,age:20,assetId:null,historicalCost:0});
  const put=(x,y,kind,level=1,residents=0)=>Object.assign(s.tiles[index(x,y)],{kind,zone:['residential','commercial','industrial'].includes(kind)?kind:null,level,residents});
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(x%4===0||y%4===2)put(x,y,'road');
  const free=[];for(let y=2;y<62;y++)for(let x=1;x<62;x++)if(!s.tiles[index(x,y)].kind&&s.tiles[index(x,y)].terrain!=='water'&&[1,3].includes(x%4))free.push([x,y]);
  let cursor=0,remaining=population;while(remaining){const [x,y]=free[cursor++],n=Math.min(72,remaining);put(x,y,'residential',3,n);remaining-=n;}
  const business=Math.ceil(population*.7/84);for(let i=0;i<business;i++){const [x,y]=free[cursor++];put(x,y,i%3?'industrial':'commercial',3);}
  for(let y=3;y<62;y+=8)for(let x=1;x<62;x+=8){const t=s.tiles[index(x,y)];if(!t.kind&&t.terrain!=='water')put(x,y,'power');const w=s.tiles[index(x+2,y)];if(!w.kind&&w.terrain!=='water')put(x+2,y,'water');}
  for(const kind of ['school','clinic','sewage','waste','park','fire','police']){const [x,y]=free[cursor++];put(x,y,kind);}
  s.households=[];s.citizens=[];s.firms=[];s.vehicles=[];s.events=[];s.nextEntityId=1;s.societySeed=(s.initialSeed^0x26bc1234)>>>0;
  analyze(s);initializeFoundation(s,SIZE,random);
  s.clock=createClock(0);s.clock.step=8*3600;s.clock.seconds=s.clock.step;
  for(const c of s.citizens)c.schedule.depart=8*3600+Math.floor(c.walkSpeed*20);
  for(let i=0;i<36;i++)stepSimulation(s);
  s.name=`Đo ${population.toLocaleString('vi-VN')} cư dân`;
  return s;
}
