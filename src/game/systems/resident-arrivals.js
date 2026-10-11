import {residentCapacity} from '../../config/building-economy.js';
import {ARRIVAL_BALANCE as BALANCE} from '../../config/resident-arrivals.js';
import {PLAY_SECONDS_PER_SECOND} from '../../config/simulation.js';
export function arrivalConditions(t){return [
 {name:'Nối đường từ nhà về cổng vùng',title:'Nối đường',short:'nối đường về cổng',ok:!!t.connected,tool:'road',required:true},
 {name:'Nước sạch được cấp tới nhà',title:'Cấp nước sạch',short:'thiếu nước sạch',ok:!!t.water,tool:'smallWater',required:true},
 {name:'Nhà không bị cháy lớn',title:'Nhà an toàn',short:'nhà đang cháy lớn',ok:(t.fire||0)<60,tool:'fire',required:true},
 {name:'Điện giúp dân chuyển đến nhanh hơn',title:'Cấp điện',short:'thiếu điện',ok:!!t.power,tool:'smallPower',required:false},
 {name:'Nước thải giúp môi trường và tốc độ đón dân tốt hơn',title:'Xử lý nước thải',short:'chưa xử lý nước thải',ok:!!t.sewage,tool:'smallSewage',required:false},
 {name:'Hài lòng từ 55% giúp đón dân nhanh hơn',title:'Chất lượng sống',short:'hài lòng thấp',ok:(t.happiness??0)>=55,tool:'park',required:false}
];}
export function arrivalReady(t){return t.kind==='residential'&&t.residents<residentCapacity(t)&&arrivalConditions(t).every(c=>!c.required||c.ok);}
export function arrivalPace(s,t){
 const population=s.metrics?.population??0,workforce=s.metrics?.workforce??0,jobs=s.metrics?.jobs??0;
 const starter=population<BALANCE.starterPopulation;
 const happiness=Math.max(0,Math.min(100,t.happiness??0));
 const happinessFactor=BALANCE.minimumHappinessFactor+(1-BALANCE.minimumHappinessFactor)*Math.min(1,happiness/55);
 const employment=workforce?Math.min(1,jobs/workforce):1;
 // Early households can settle before shops exist. Later unemployment slows growth.
 const employmentFactor=starter?1:BALANCE.minimumEmploymentFactor+(1-BALANCE.minimumEmploymentFactor)*employment;
 const factor=(t.power?1:BALANCE.noPowerFactor)*(t.sewage?1:BALANCE.noSewageFactor)*happinessFactor*employmentFactor;
 const interval=(starter?BALANCE.starterSeconds:BALANCE.settledSeconds)/factor;
 const rate=BALANCE.progressPerResident/interval;
 const remaining=Math.max(1,Math.ceil((BALANCE.progressPerResident-(t.development?.arrivals||0))/rate));
 const realRate=s.playback?.observe?1:PLAY_SECONDS_PER_SECOND*(s.playback?.multiplier??1);
 return {starter,rate,interval:Math.ceil(interval),remaining,realSeconds:Math.ceil(remaining/realRate),needsJobs:workforce>0&&jobs<workforce};
}
export function populationStatus(s){
 const homes=s.tiles.filter(t=>t.kind==='residential'),open=homes.filter(t=>t.residents<residentCapacity(t)),ready=open.filter(arrivalReady);
 if(!homes.length)return {label:'Đặt nhà để đón cư dân',conditions:[],ready:0};
 if(ready.length){
  const best=ready.reduce((a,b)=>arrivalPace(s,a).remaining<=arrivalPace(s,b).remaining?a:b),pace=arrivalPace(s,best);
  const clockBased=best.development?.version===1;
  return {label:s.playback?.paused?'Sẵn sàng đón dân · đang tạm dừng':clockBased?`Đang đón dân · khoảng ${pace.realSeconds} giây thực nữa`:'Đang đón dân · theo ngày game (nhà bản cũ)',tile:s.tiles.indexOf(best),conditions:arrivalConditions(best),ready:ready.length,waiting:open.length-ready.length,pace,...(pace.needsJobs?{needsJobs:true,detail:`${s.metrics.workforce} người cần việc · ${s.metrics.jobs} chỗ làm. Dân vẫn chuyển đến; thêm cửa hàng để tăng việc làm và hài lòng.`}:{})};
 }
 if(!open.length)return {label:'Nhà đã đầy · xây thêm nhà',conditions:[],ready:0};
 const missingCount=t=>arrivalConditions(t).filter(c=>c.required&&!c.ok).length;
 const best=open.reduce((a,b)=>missingCount(a)<=missingCount(b)?a:b);
 const conditions=arrivalConditions(best),missing=conditions.find(c=>c.required&&!c.ok);
 return {label:'Chờ dân: '+missing.short,tile:s.tiles.indexOf(best),conditions,ready:0,waiting:open.length};
}
