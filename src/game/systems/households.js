import {assignMobilityArt} from '../../config/mobility-art.js';
import { entityId, emit } from './events.js';
import { position } from './world.js';
const first=['An','Bình','Chi','Duy','Hà','Hải','Lan','Linh','Minh','Nam','Ngọc','Phúc','Quân','Thảo','Trang','Vy'];
const family=['Nguyễn','Trần','Lê','Phạm','Hoàng','Đặng','Bùi','Vũ'];
// Foundation allocator: preserve every legacy resident, group in homes of <=4.
// Lifecycle, affordability and arrival contracts are implemented in stage 5.
export function reconcileHouseholds(s, size, rng) {
  const added=[];
  const alive=new Set(s.citizens.map(c=>c.id));
  // Index once per reconciliation instead of scanning every citizen for every
  // map cell. Preserve insertion order, household choice and seeded RNG calls.
  const residentsByHome=new Map(),householdsByHome=new Map();
  for(const c of s.citizens){if(!residentsByHome.has(c.home))residentsByHome.set(c.home,[]);residentsByHome.get(c.home).push(c);}
  for(const h of s.households){if(!householdsByHome.has(h.home))householdsByHome.set(h.home,[]);householdsByHome.get(h.home).push(h);}
  for(let i=0;i<s.tiles.length;i++) {
    const t=s.tiles[i], target=t.kind==='residential'?t.residents:0;
    const residents=residentsByHome.get(i)||[];
    while(residents.length>target) {
      const c=residents.pop(); alive.delete(c.id); emit(s,'resident-departed',c.id,{home:i,reason:t.kind==='residential'?'Điều kiện nhà ở suy giảm':'Nhà đã bị phá'});
    }
    while(residents.length<target) {
      const households=householdsByHome.get(i)||[];
      let h=households.find(h=>h.members.filter(id=>alive.has(id)).length<4);
      if(!h) { h={id:entityId(s,'household'),home:i,members:[],savings:6400}; s.households.push(h);households.push(h);householdsByHome.set(i,households); }
      const member=h.members.filter(id=>alive.has(id)).length;
      const c={id:entityId(s,'citizen'),household:h.id,home:i,name:`${family[Math.floor(rng(s)*family.length)]} ${first[Math.floor(rng(s)*first.length)]}`,age:member<2?25+Math.floor(rng(s)*35):member===2?8+Math.floor(rng(s)*9):65+Math.floor(rng(s)*15),health:t.health??100,education:t.education||0,work:null,state:'home',goal:i,position:position(i,size,s),journey:null,schedule:{depart:7*3600+30*60+Math.floor(rng(s)*3600),return:17*3600+Math.floor(rng(s)*3600)},walkSpeed:.8+rng(s),vehicle:null,attendance:0};
      s.citizens.push(c); added.push(c); residents.push(c); h.members.push(c.id); alive.add(c.id); emit(s,'resident-added',c.id,{home:i});
    }
  }
  assignMobilityArt(s);
  s.citizens=s.citizens.filter(c=>alive.has(c.id));
  for(const h of s.households) h.members=h.members.filter(id=>alive.has(id));
  s.households=s.households.filter(h=>h.members.length);
  for(const v of s.vehicles) if(v.owner&&!alive.has(v.owner)) {v.owner=null;v.state='parked';v.passengers=[];}
  return added;
}
