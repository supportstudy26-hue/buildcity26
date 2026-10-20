import {HEALTHCARE_PROFILES} from '../../config/healthcare.js';
import {healthcarePosts} from './healthcare.js';
import {MUNICIPAL_PROFILES} from '../../config/municipal-jobs.js';
import {municipalPosts} from './municipal-jobs.js';
import {LOGISTICS_KINDS} from '../../config/logistics.js';
import {logisticsPosts} from './logistics.js';
import {jobsCapacity} from '../../config/building-economy.js';
import { emit } from './events.js';
import {SCHOOL_PROFILES} from '../../config/education.js';
import {schoolPosts} from './education.js';
import {route} from './roads.js';
export function reconcileFirms(s) {
  const old=new Map(s.firms.map(f=>[f.home,f]));
  s.firms=s.tiles.flatMap((t,i)=>{
    const school=!!SCHOOL_PROFILES[t.kind],healthcare=!!HEALTHCARE_PROFILES[t.kind],municipal=!!MUNICIPAL_PROFILES[t.kind],logistics=LOGISTICS_KINDS.includes(t.kind);
    if(!['commercial','industrial'].includes(t.kind)&&!school&&!healthcare&&!municipal&&!logistics)return[];
    const capacity=school?schoolPosts(t):healthcare?healthcarePosts(t):municipal?municipalPosts(t):logistics?logisticsPosts(t):jobsCapacity(t);
    return [{...old.get(i),id:old.get(i)?.id||`firm-${t.assetId}`,home:i,capacity,employees:[],active:!!t.active,school,healthcare,municipal,logistics,serviceShift:healthcare||municipal}];
  });
  const firms=new Map(s.firms.map(f=>[f.id,f]));
  for(const c of s.citizens) {
    const f=firms.get(c.work);
    if(f?.active&&f.employees.length<f.capacity&&c.age>=18&&c.age<65&&(!(f.school||f.healthcare||f.municipal||f.logistics)||c.health>=40&&route(s,c.home,f.home,'walk').length)) f.employees.push(c.id);
    else if(c.work) {c.work=null;emit(s,'job-lost',c.id);}
  }
  // One actual worker per public facility before filling further vacancies.
  // Never invent staff; existing public assignments survive reconciliation.
  const publicFirm=f=>f.school||f.healthcare||f.municipal||f.logistics;
  const adults=s.citizens.filter(c=>c.age>=18&&c.age<65&&c.health>=40&&!c.municipalAssignment);
  const publicFirms=s.firms.filter(f=>publicFirm(f)&&f.active).sort((a,b)=>a.employees.length-b.employees.length||a.home-b.home);
  let added=true;
  while(added){added=false;for(const f of publicFirms){
    if(f.employees.length>=f.capacity)continue;
    const c=[...adults.filter(c=>!c.work),...adults.filter(c=>c.work&&!publicFirm(firms.get(c.work)||{}))].find(c=>route(s,c.home,f.home,'walk').length);
    if(!c)continue;
    const previous=firms.get(c.work);if(previous)previous.employees=previous.employees.filter(id=>id!==c.id);
    c.work=f.id;f.employees.push(c.id);added=true;emit(s,'job-assigned',c.id,{firm:f.id,role:f.school?'teacher':f.healthcare?'healthcare':'municipal'});
  }}
  for(const c of s.citizens) if(!c.work&&c.age>=18&&c.age<65) {
    const firm=s.firms.find(f=>!publicFirm(f)&&f.active&&f.employees.length<f.capacity);
    if(firm) {c.work=firm.id;firm.employees.push(c.id);emit(s,'job-assigned',c.id,{firm:firm.id});}
  }
}
