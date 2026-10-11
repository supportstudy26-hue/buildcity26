import {remainingRouteValid} from './road-network.js';
import {weatherState} from './weather.js';
import {chooseBusPlan,busDock} from './bus-planning.js';
import {roadControllers} from './road-controller.js';
import {mobilityPath} from './mobility-path.js';
import { DAY_SECONDS, STEP_SECONDS } from '../../config/simulation.js';
import { position, distanceMeters } from './world.js';
import { emit } from './events.js';
export function startJourney(s,c,goal,route,size,allowTransit=true) {
  const finalGoal=c.busPlan?.destination??goal;
  if(!c.missionTrip)c.missionTrip={id:`trip-${c.id}-${s.clock.step}`,origin:c.goal,destination:finalGoal,startedAt:s.clock.seconds,purpose:finalGoal===c.home?'home':'work',mode:c.vehicle?'car':'walk'};
  if(allowTransit&&!c.busPlan){const plan=chooseBusPlan(s,c,goal);if(plan){c.busPlan={...plan,tripId:`bus-${c.id}-${s.clock.step}`};goal=plan.board;}}
  let mode=c.busPlan?'walk':c.vehicle?'car':'walk';let roads=route(s,c.retryOrigin??c.goal,goal,mode);
  if(!roads.length&&mode==='car'){mode='walk';roads=route(s,c.retryOrigin??c.goal,goal,mode);}
  if(!roads.length) {c.state='blocked';c.waitReason='Chưa có đường nối nguồn và đích';c.retryGoal=goal;return;}
  c.journey={id:`trip-${c.id}-${s.clock.step}`,origin:c.goal,destination:goal,mode,speed:mode==='car'?50/3.6:c.walkSpeed,path:mobilityPath(s,c.goal,goal,roads,size,mode,c.position),laneVersion:1,segment:0,distance:0,departedAt:s.clock.seconds,graphVersion:s.graphVersion};
  if(c.busPlan?.stage==='walk-to-stop'){const line=s.busLines.find(l=>l.id===c.busPlan.line),dock=line&&busDock(s,line,line.stops.indexOf(goal));if(dock)c.journey.path[c.journey.path.length-1]={...dock.door};}
  if(c.missionTrip&&!c.busPlan)c.missionTrip.mode=mode;
  c.goal=goal;c.retryGoal=null;c.retryOrigin=null;c.state=mode==='car'?'in-vehicle':'walking';c.waitReason='';emit(s,'trip-started',c.id,{destination:goal,mode});
}
export function updateCitizens(s, calendar, route, size) {
  const time=s.clock.seconds%DAY_SECONDS,weekday=calendar.weekday!==0&&calendar.weekday!==6;
  const control=roadControllers(s),roadSpeedFactor=weatherState(s).roadSpeedFactor;
  const firms=new Map(s.firms.map(f=>[f.id,f]));
  for(const c of s.citizens) {
    const work=firms.get(c.work);
    if(c.state==='on-bus')continue;
    if(c.state==='waiting-bus'){if(!s.busLines.some(l=>l.id===c.busPlan?.line)){const goal=c.busPlan.destination;c.busPlan=null;c.state='home';startJourney(s,c,goal,route,size,false);}else continue;}
    if(c.state==='blocked'&&!c.journey&&c.retryGoal!=null&&c.retryVersion!==s.graphVersion){c.retryVersion=s.graphVersion;startJourney(s,c,c.retryGoal,route,size);}
    if(!c.journey&&c.state!=='blocked') {
      if(c.state==='home'||c.state==='sleeping') {c.state=time<6*3600||time>=22*3600?'sleeping':'home';if(weekday&&work?.active&&time>=c.schedule.depart&&time<c.schedule.return) startJourney(s,c,work.home,route,size);}
      else if(c.state==='at-work'&&time>=c.schedule.return) startJourney(s,c,c.home,route,size);
    }
    const j=c.journey;if(!j)continue;
    if(j.graphVersion!==s.graphVersion) {
      // Remain exactly where blocked. Resume the remaining path if it becomes valid.
      const valid=remainingRouteValid(s,j.path.slice(Math.max(0,j.segment-1)),j.mode);
      if(!valid){const target=c.goal;c.journey=null;c.retryGoal=target;c.retryOrigin=Math.min(s.tiles.length-1,Math.floor(c.position.y/20)*size+Math.floor(c.position.x/20));c.retryVersion=-1;c.state='blocked';c.waitReason='Hướng hoặc loại đường đã đổi; đang tìm hành trình hợp lệ';continue;}
      j.graphVersion=s.graphVersion;c.state=valid?(j.mode==='car'?'in-vehicle':'walking'):'blocked';c.waitReason=valid?'':'Đường trên hành trình đã bị phá hoặc ngắt kết nối';
    }
    if(c.state==='blocked')continue;
    const controlled=j.laneVersion===1?control(c):{speed:j.speed,reason:''};j.actualSpeed=controlled.speed*(j.mode==='car'?roadSpeedFactor:1);c.waitReason=controlled.reason;
    let remaining=j.actualSpeed*STEP_SECONDS;
    while(remaining>0&&j.segment<j.path.length-1) {
      const a=j.path[j.segment],b=j.path[j.segment+1],length=distanceMeters(a,b),needed=length-j.distance;
      const travelled=Math.min(remaining,Math.max(0,needed));j.distance+=travelled;remaining-=travelled;c.travelled=(c.travelled||0)+travelled;
      const t=length?Math.min(1,j.distance/length):1;
      c.position={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};
      if(j.distance>=length-1e-8){j.segment++;j.distance=0;}
    }
    if(j.segment===j.path.length-1) {
      const id=j.id;c.journey=null;
      if(c.busPlan?.stage==='walk-to-stop'){c.state='waiting-bus';c.busPlan.stage='waiting';c.waitingSince=s.clock.seconds;c.waitReason='Chờ xe buýt tại điểm dừng';emit(s,'bus-queue-entered',c.id,{line:c.busPlan.line,stop:c.goal});continue;}
      if(c.busPlan?.stage==='walk-from-stop')c.busPlan=null;
      c.state=c.goal===c.home?'home':'at-work';
      if(c.state==='at-work') c.attendance++;
      const trip=c.missionTrip;c.missionTrip=null;
      emit(s,'trip-arrived',c.id,{trip:trip?.id||id,origin:trip?.origin??j.origin,destination:c.goal,mode:trip?.mode||j.mode,purpose:trip?.purpose||(c.goal===c.home?'home':'work'),duration:s.clock.seconds-(trip?.startedAt??j.departedAt)});
    }
  }
}
