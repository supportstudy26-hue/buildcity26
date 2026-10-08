import { DAY_SECONDS, STEP_SECONDS } from '../../config/simulation.js';
import { position, distanceMeters } from './world.js';
import { emit } from './events.js';
function begin(s,c,goal,route,size) {
  const roads=route(s,c.goal,goal);
  if(!roads.length) {c.state='blocked';c.waitReason='Chưa có đường nối nguồn và đích';c.retryGoal=goal;return;}
  const mode=c.vehicle?'car':'walk';
  c.journey={id:`trip-${c.id}-${s.clock.step}`,origin:c.goal,destination:goal,mode,speed:mode==='car'?30/3.6:c.walkSpeed,path:[{...c.position},...roads.map(i=>({...position(i,size,s),road:i})),{...position(goal,size,s)}],segment:0,distance:0,departedAt:s.clock.seconds,graphVersion:s.graphVersion};
  c.goal=goal;c.retryGoal=null;c.state=mode==='car'?'in-vehicle':'walking';c.waitReason='';emit(s,'trip-started',c.id,{destination:goal,mode});
}
export function updateCitizens(s, calendar, route, size) {
  const time=s.clock.seconds%DAY_SECONDS,weekday=calendar.weekday!==0&&calendar.weekday!==6;
  const firms=new Map(s.firms.map(f=>[f.id,f]));
  for(const c of s.citizens) {
    const work=firms.get(c.work);
    if(c.state==='blocked'&&!c.journey&&c.retryGoal!=null&&c.retryVersion!==s.graphVersion){c.retryVersion=s.graphVersion;begin(s,c,c.retryGoal,route,size);}
    if(!c.journey&&c.state!=='blocked') {
      if(c.state==='home'||c.state==='sleeping') {c.state=time<6*3600||time>=22*3600?'sleeping':'home';if(weekday&&work?.active&&time>=c.schedule.depart&&time<c.schedule.return) begin(s,c,work.home,route,size);}
      else if(c.state==='at-work'&&time>=c.schedule.return) begin(s,c,c.home,route,size);
    }
    const j=c.journey;if(!j)continue;
    if(j.graphVersion!==s.graphVersion) {
      // Remain exactly where blocked. Resume the remaining path if it becomes valid.
      const valid=j.path.slice(j.segment).filter(p=>p.road!=null).every(p=>s.network.connected.has(p.road));
      j.graphVersion=s.graphVersion;c.state=valid?(j.mode==='car'?'in-vehicle':'walking'):'blocked';c.waitReason=valid?'':'Đường trên hành trình đã bị phá hoặc ngắt kết nối';
    }
    if(c.state==='blocked')continue;
    let remaining=j.speed*STEP_SECONDS;
    while(remaining>0&&j.segment<j.path.length-1) {
      const a=j.path[j.segment],b=j.path[j.segment+1],length=distanceMeters(a,b),needed=length-j.distance;
      const travelled=Math.min(remaining,Math.max(0,needed));j.distance+=travelled;remaining-=travelled;
      const t=length?Math.min(1,j.distance/length):1;
      c.position={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};
      if(j.distance>=length-1e-8){j.segment++;j.distance=0;}
    }
    if(j.segment===j.path.length-1) {
      const id=j.id;c.journey=null;c.state=c.goal===c.home?'home':'at-work';
      if(c.state==='at-work') c.attendance++;
      emit(s,'trip-arrived',c.id,{trip:id,destination:c.goal});
    }
  }
}
