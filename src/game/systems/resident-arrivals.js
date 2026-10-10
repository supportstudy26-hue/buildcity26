import {residentCapacity} from '../../config/building-economy.js';
export function arrivalConditions(t){return [
 {name:'Nối đường từ nhà về cổng vùng',short:'nối đường về cổng',ok:!!t.connected,tool:'road'},
 {name:'Điện đủ công suất và trong phạm vi',short:'thiếu điện',ok:!!t.power,tool:'smallPower'},
 {name:'Nước sạch đủ công suất và trong phạm vi',short:'thiếu nước sạch',ok:!!t.water,tool:'smallWater'},
 {name:'Xử lý nước thải tới nhà',short:'thiếu xử lý nước thải',ok:!!t.sewage,tool:'smallSewage'},
 {name:'Nhà an toàn, không bị cháy lớn',short:'nhà không an toàn',ok:(t.fire||0)<60,tool:'fire'},
 {name:'Chất lượng sống từ 48%',short:'chất lượng sống thấp',ok:(t.happiness??0)>=48,tool:'commercial'}
];}
export function arrivalReady(t){return t.kind==='residential'&&t.residents<residentCapacity(t)&&arrivalConditions(t).every(c=>c.ok);}
export function populationStatus(s){
 const homes=s.tiles.filter(t=>t.kind==='residential'),open=homes.filter(t=>t.residents<residentCapacity(t)),ready=open.filter(arrivalReady);
 if(!homes.length)return {label:'Đặt nhà để đón cư dân',conditions:[],ready:0};
 if(ready.length){const remaining=Math.min(...ready.map(t=>Math.max(1,60-(t.development?.arrivals||0))));return {label:s.playback?.paused?'Đủ điều kiện · đang tạm dừng':'Đón dân · '+remaining+' giây game',conditions:arrivalConditions(ready[0]),ready:ready.length};}
 if(!open.length)return {label:'Nhà đã đầy · xây thêm nhà',conditions:[],ready:0};
 const best=open.reduce((a,b)=>arrivalConditions(a).filter(c=>!c.ok).length<=arrivalConditions(b).filter(c=>!c.ok).length?a:b);
 const conditions=arrivalConditions(best),missing=conditions.find(c=>!c.ok);
 return {label:'Chờ dân: '+missing.short,conditions,ready:0};
}
