import {jobsCapacity} from '../../config/building-economy.js';
import { emit } from './events.js';
import {SCHOOL_PROFILES} from '../../config/education.js';
import {schoolPosts} from './education.js';
import {route} from './roads.js';
export function reconcileFirms(s) {
  const old=new Map(s.firms.map(f=>[f.home,f]));
  s.firms=s.tiles.flatMap((t,i)=>['commercial','industrial'].includes(t.kind)||SCHOOL_PROFILES[t.kind]?[{...old.get(i),id:old.get(i)?.id||`firm-${t.assetId}`,home:i,capacity:SCHOOL_PROFILES[t.kind]?schoolPosts(t):jobsCapacity(t),employees:[],active:!!t.active,...(SCHOOL_PROFILES[t.kind]?{school:true}:{})}]:[]);
  const firms=new Map(s.firms.map(f=>[f.id,f]));
  for(const c of s.citizens) {
    const f=firms.get(c.work);
    if(f?.active&&f.employees.length<f.capacity&&c.age>=18&&c.age<65&&(!f.school||c.health>=40&&route(s,c.home,f.home,'walk').length)) f.employees.push(c.id);
    else if(c.work) {c.work=null;emit(s,'job-lost',c.id);}
  }
  // Recruit teachers before private vacancies; every teacher is a real adult.
  const adults=s.citizens.filter(c=>c.age>=18&&c.age<65&&c.health>=40);
  for(const f of s.firms.filter(f=>f.school&&f.active)){
    for(const c of [...adults.filter(c=>!c.work),...adults.filter(c=>c.work&&!firms.get(c.work)?.school)]){
      if(f.employees.length>=f.capacity)break;
      if(!route(s,c.home,f.home,'walk').length)continue;
      const previous=firms.get(c.work);if(previous)previous.employees=previous.employees.filter(id=>id!==c.id);
      c.work=f.id;f.employees.push(c.id);emit(s,'job-assigned',c.id,{firm:f.id,role:'teacher'});
    }
  }
  for(const c of s.citizens) if(!c.work&&c.age>=18&&c.age<65) {
    const firm=s.firms.find(f=>!f.school&&f.active&&f.employees.length<f.capacity);
    if(firm) {c.work=firm.id;firm.employees.push(c.id);emit(s,'job-assigned',c.id,{firm:firm.id});}
  }
}
