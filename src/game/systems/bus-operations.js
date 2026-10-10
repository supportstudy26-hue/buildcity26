import {weatherState} from './weather.js';
import {calendar} from './clock.js';
import {route} from './roads.js';import {mobilityPath} from './mobility-path.js';import {busDock} from './bus-planning.js';
import {startJourney} from './citizens.js';import {distanceMeters} from './world.js';import {emit} from './events.js';import {recordCash} from './economy.js';import {roadControllers} from './road-controller.js';
export function releaseBusPassengers(s,v){
 for(const id of v.passengers){const c=s.citizens.find(c=>c.id===id);if(!c)continue;
  const goal=c.busPlan?.destination??c.home;c.position={...v.position};c.busPlan=null;c.journey=null;
  c.goal=Math.min(s.tiles.length-1,Math.max(0,Math.floor(v.position.y/20)*s.mapSize+Math.floor(v.position.x/20)));c.state='blocked';c.retryGoal=goal;c.retryVersion=-1;c.waitReason='Tuyến đã ngừng · tìm đường đi bộ';
 }v.passengers=[];
}
function tripTo(s,v,line,index){
 const stop=line.stops[index],origin=v.goal,roads=route(s,origin,stop);if(!roads.length)return false;
 const dock=busDock(s,line,index);if(!dock)return false;
 const path=mobilityPath(s,origin,stop,roads,s.mapSize,'car',v.position);path[path.length-1]={...dock.position};
 if(distanceMeters(path.at(-2),path.at(-1))<.001)path.pop();
 v.trip={id:`bus-trip-${v.id}-${s.clock.step}`,origin,destination:stop,path,mode:'car',segment:0,distance:0,speed:25/3.6,actualSpeed:0,graphVersion:s.graphVersion,laneVersion:1};
 v.goal=stop;v.targetStop=index;v.busPhase='driving';v.state='travelling';v.doors=false;return true;
}
export function updateBuses(s){
 const people=new Map(s.citizens.map(c=>[c.id,c])),control=roadControllers(s);
 for(const v of s.vehicles.filter(v=>v.kind==='bus')){
  const line=s.network.busLines.find(l=>l.id===v.operator);if(!line)continue;
  if(!v.busPhase){v.busPhase='depot';v.stopIndex=-1;v.nextDepart=s.clock.seconds+v.fleetIndex*60;v.trip=null;v.travelled=0;v.boardedTotal=0;v.boardedDay=s.day;v.boardedToday=0;}
  if(v.boardedDay!==s.day){v.boardedDay=s.day;v.boardedToday=0;}
  if(!line.ok){v.state='blocked';v.speed=0;v.doors=false;v.waitReason=line.message;continue;}
  if(v.state==='blocked'&&v.blockedGraph===s.graphVersion)continue;
  if(v.state==='blocked')v.state=v.trip?'travelling':'parked';
  if(v.busPhase==='depot'){
   if(s.clock.seconds>=v.nextDepart&&!tripTo(s,v,line,0)){v.state='blocked';v.waitReason='Bến xe không nối được tới tuyến';}continue;
  }
  if(v.busPhase==='stop'){
   v.state='parked';v.speed=0;v.doors=true;
   // One transfer per simulation second. Queue order is stable and capacity is
   // physical; a full bus leaves remaining people in the queue for the next bus.
   const alight=v.passengers.find(id=>people.get(id)?.busPlan?.alight===v.goal);
   if(alight){const c=people.get(alight),goal=c.busPlan.destination;v.passengers=v.passengers.filter(id=>id!==alight);c.busPlan.stage='walk-from-stop';c.busPlan.vehicleId=null;c.goal=v.goal;c.position={...busDock(s,line,v.stopIndex).door};c.state='home';startJourney(s,c,goal,route,s.mapSize,false);v.stopUntil=Math.max(v.stopUntil,s.clock.seconds+3);emit(s,'bus-alighted',c.id,{vehicle:v.id,stop:v.goal});}
   else if(v.passengers.length<60){
    const waiting=s.citizens.filter(c=>c.state==='waiting-bus'&&c.busPlan?.line===line.id&&c.busPlan.board===v.goal&&distanceMeters(c.position,v.position)<4).sort((a,b)=>(a.waitingSince||0)-(b.waitingSince||0)||a.id.localeCompare(b.id));
    const c=waiting[0];if(c){const h=s.households.find(h=>h.id===c.household),receipt=`fare-${c.busPlan.tripId}`;
     if(h.savings>=.7&&!s.ledger.receipts.includes(receipt)){h.savings-=.7;recordCash(s,receipt,'bus-fare',.7,v.id);}
     else if(h.savings<.7){c.busPlan=null;c.goal=v.goal;c.state='home';startJourney(s,c,c.home,route,s.mapSize,false);continue;}
     c.busPlan.stage='riding';c.busPlan.vehicleId=v.id;c.state='on-bus';c.waitReason='';c.journey=null;c.position={...v.position};v.passengers.push(c.id);v.boardedTotal++;v.boardedToday++;v.stopUntil=Math.max(v.stopUntil,s.clock.seconds+3);emit(s,'bus-boarded',c.id,{vehicle:v.id,stop:v.goal});
    }
   }
   for(const id of v.passengers){const c=people.get(id);if(c)c.position={...v.position};}
   if(s.clock.seconds>=v.stopUntil&&!v.passengers.some(id=>people.get(id)?.busPlan?.alight===v.goal))tripTo(s,v,line,(v.stopIndex+1)%line.stops.length);
   continue;
  }
  const j=v.trip;if(!j)continue;
  if(j.graphVersion!==s.graphVersion){j.graphVersion=s.graphVersion;if(j.path.slice(j.segment).some(p=>p.road!=null&&!s.network.connected.has(p.road))){v.state='blocked';v.speed=0;v.blockedGraph=s.graphVersion;v.waitReason='Đường của tuyến bị ngắt';continue;}}
  const controlled=control({id:v.id,kind:v.kind,position:v.position,journey:j});j.actualSpeed=controlled.speed*weatherState(s).roadSpeedFactor;v.speed=j.actualSpeed;v.waitReason=controlled.reason;
  let remaining=j.actualSpeed;
  while(remaining>0&&j.segment<j.path.length-1){const a=j.path[j.segment],b=j.path[j.segment+1],length=distanceMeters(a,b),travelled=Math.min(remaining,Math.max(0,length-j.distance));j.distance+=travelled;v.travelled+=travelled;remaining-=travelled;const t=length?Math.min(1,j.distance/length):1;v.position={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};if(j.distance>=length-1e-8){j.segment++;j.distance=0;}}
  for(const id of v.passengers){const c=people.get(id);if(c)c.position={...v.position};}
  if(j.segment===j.path.length-1){const last=j.path.at(-1),before=j.path.at(-2);v.visualYaw=Math.atan2(last.x-before.x,last.y-before.y);v.trip=null;v.stopIndex=v.targetStop;v.busPhase='stop';v.state='parked';v.speed=0;v.doors=true;v.waitReason='';v.stopUntil=s.clock.seconds+15;emit(s,'bus-stop-arrived',v.id,{stop:v.goal});}
 }
 if(s.metrics){const n=s.vehicles.filter(v=>v.kind==='bus'&&v.boardedDay===s.day).reduce((n,v)=>n+(v.boardedToday||0),0);s.metrics.busPassengers=n;s.metrics.transitIncome=n*.7*calendar(s.clock.seconds).daysInMonth;s.metrics.income=s.metrics.taxIncome+s.metrics.transitIncome;s.metrics.net=s.metrics.income-s.metrics.expenses;}
}
