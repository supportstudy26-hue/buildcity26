import {roadProfile} from '../../config/road-profiles.js';
import {roadNeighbors,roadForAccess} from './road-network.js';
import {jobsCapacity} from '../../config/building-economy.js';
import { SIZE, index, distance, neighbors } from './world.js';
export function analyzeTraffic(s){
  const homes=[],work=[];s.tiles.forEach((t,i)=>{t.trafficLoad=0;t.trafficCapacity=roadProfile(t)?.capacity||0;if(t.kind==='residential'&&t.active&&t.residents)homes.push(i);if(['commercial','industrial'].includes(t.kind)&&t.active)work.push({i,remaining:jobsCapacity(t)});});
  const trips=[];
  const lines=(s.network.busLines||[]).filter(l=>l.ok).map(l=>({...l,remaining:l.vehicles*30*(s.budgets?.bus??100)/100}));
  // One route tree per home; job destinations share the same connected graph.
  for(const from of homes){
    const home=s.tiles[from],start=roadForAccess(s,from,'car');if(start===undefined)continue;const q=[start],previous=new Map([[start,null]]);
    for(let p=0;p<q.length;p++)for(const n of roadNeighbors(s,q[p],'car'))if(!previous.has(n)){previous.set(n,q[p]);q.push(n);}
    let commuters=Math.floor(home.residents*.55);
    const destinations=work.filter(w=>w.remaining>0).sort((a,b)=>distance(from,a.i)-distance(from,b.i));
    for(const destination of destinations){
      if(!commuters)break;const end=roadForAccess(s,destination.i,'car');if(!previous.has(end))continue;
      const path=[];for(let i=end;i!==null;i=previous.get(i))path.push(i);path.reverse();
      const passengers=Math.min(commuters,destination.remaining);
      const line=lines.find(l=>l.remaining>0&&l.stops.some(stop=>distance(from,stop)<=5)&&l.stops.some(stop=>distance(destination.i,stop)<=5));
      const busPassengers=line?Math.min(passengers*.4,line.remaining):0;if(line)line.remaining-=busPassengers;
      const vehicles=passengers-busPassengers;
      destination.remaining-=passengers;commuters-=passengers;
      trips.push({from,to:destination.i,path,passengers,vehicles,busPassengers});for(const i of path)s.tiles[i].trafficLoad+=vehicles;
    }
  }
  s.network.trips=trips;
  for(const line of lines)for(const i of line.path)s.tiles[i].trafficLoad+=line.vehicles*.5;
  let weighted=0,total=0;for(const t of s.tiles)if(t.trafficLoad){const efficiency=Math.min(1,t.trafficCapacity/t.trafficLoad);weighted+=efficiency*t.trafficLoad;total+=t.trafficLoad;}
  return total?Math.round(weighted/total*100):100;
}
export function busRoute(s,stops){
  if(!Array.isArray(stops)||stops.length<2||stops.length>8||new Set(stops).size!==stops.length)return {ok:false,message:'Chọn 2–8 điểm dừng khác nhau.',path:[]};
  if(!s.network.services.bus.length)return {ok:false,message:'Cần bến xe buýt có đường, điện và nước.',path:[]};
  if(stops.some(i=>!Number.isInteger(i)||s.tiles[i]?.kind!=='busStop'||!s.tiles[i].connected))return {ok:false,message:'Điểm dừng bị mất hoặc chưa nối đường.',path:[]};
  const path=[];for(let i=0;i<stops.length;i++){const part=route(s,stops[i],stops[(i+1)%stops.length],'bus');if(!part.length)return {ok:false,message:'Các điểm dừng chưa có đường nối liền.',path:[]};path.push(...(i?part.slice(1):part));}
  if(path.length<3)return {ok:false,message:'Các điểm dừng cần nằm trên những đoạn đường khác nhau.',path:[]};
  return {ok:true,message:'Đang hoạt động',path};
}
export function route(s,from,to,mode='car'){
  if(!s.network)return []; // Rebuilt by core analyze before route requests.
  const start=roadForAccess(s,from,mode), end=roadForAccess(s,to,mode);
  if(start===undefined||end===undefined)return [];
  const q=[start], prev=new Map([[start,null]]);
  for(let p=0;p<q.length&&!prev.has(end);p++)for(const n of roadNeighbors(s,q[p],mode))if(!prev.has(n)){prev.set(n,q[p]);q.push(n);}
  if(!prev.has(end))return [];const path=[];for(let i=end;i!==null;i=prev.get(i))path.push(i);return path.reverse();
}
