import {jobsCapacity} from '../../config/building-economy.js';
import { emit } from './events.js';
export function reconcileFirms(s) {
  const old=new Map(s.firms.map(f=>[f.home,f]));
  s.firms=s.tiles.flatMap((t,i)=>['commercial','industrial'].includes(t.kind)?[{...old.get(i),id:old.get(i)?.id||`firm-${t.assetId}`,home:i,capacity:jobsCapacity(t),employees:[],active:t.active}]:[]);
  const firms=new Map(s.firms.map(f=>[f.id,f]));
  for(const c of s.citizens) {
    const f=firms.get(c.work);
    if(f?.active&&f.employees.length<f.capacity&&c.age>=18&&c.age<65) f.employees.push(c.id);
    else if(c.work) {c.work=null;emit(s,'job-lost',c.id);}
  }
  for(const c of s.citizens) if(!c.work&&c.age>=18&&c.age<65) {
    const firm=s.firms.find(f=>f.active&&f.employees.length<f.capacity);
    if(firm) {c.work=firm.id;firm.employees.push(c.id);emit(s,'job-assigned',c.id,{firm:firm.id});}
  }
}
