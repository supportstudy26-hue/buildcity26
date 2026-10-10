import {LANDMARKS} from '../config/landmarks.js';
import {roadProfile} from '../config/road-profiles.js';
import {CATALOG,serviceKind} from '../config/catalog.js';
import {PRIVATE_DESIGNS,privateBuildPrice,capacityFactor,MAINTENANCE_FACTORS} from '../config/building-economy.js';
import {cityLevel,progressionXp} from '../game/systems/campaign.js';
import {xpForLevel} from '../config/progression.js';
import {missionViews} from '../game/systems/progression.js';
import {metricContext,snapshotMetric,operating} from '../game/systems/mission-metrics.js';
import {weatherState} from '../game/systems/weather.js';
import {calendar} from '../game/systems/clock.js';
import {DISPLAY_DONG_PER_BC} from '../config/money.js';

// Presentation conversion only: saves, formulas and transaction checks remain BC.
export const hudMoney=v=>Number.isFinite(v)?v*DISPLAY_DONG_PER_BC:undefined;
export const normalizeSearch=s=>String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/gi,'d').toLocaleLowerCase('vi');
const category=k=>({roads:'road',zones:k,utilities:'utilities',services:'health',parks:'park',transport:'transport'}[CATALOG[k].group]);
const glyph=k=>({power:'electricity',water:'water',sewage:'sewage',waste:'waste',school:'education',clinic:'health',fire:'fire',police:'police',park:'park',bus:'transport',busStop:'transport'}[serviceKind(k)]||k);
// Cached static catalogue; no thumbnails/icons/catalogue are added to city saves.
export const HUD_CATALOGUE=Object.freeze([
 ...Object.entries(CATALOG).filter(([k])=>!['residential','commercial','industrial','inspect','bulldoze'].includes(k)).map(([k,v])=>({id:k,category:category(k),name:v.name,description:v.description,icon:(roadProfile(k)?'road':v.decorative?'park':glyph(k)),cost:hudMoney(v.cost),maintenance:hudMoney(v.upkeep||0),unlockLevel:1,available:true,kind:k})),
 ...Object.values(PRIVATE_DESIGNS).map(d=>({id:d.kind+':'+d.designId,kind:d.kind,designId:d.designId,category:d.kind,name:d.name,description:`${d.kind==='residential'?d.capacity+' chỗ ở':d.capacity+' việc làm'}. Nhà hiện ngay khi đủ vốn chủ đầu tư; tiện ích quyết định hoạt động.`,icon:d.designId==='glass-office'?'office':d.kind,cost:hudMoney(CATALOG[d.kind].cost),maintenance:0,privatePrice:hudMoney(privateBuildPrice(d.kind,d.designId)),unlockLevel:1,available:true}))
]);
export function objectiveProgress(condition){
 if(!condition)return undefined;
 if(condition.children){const values=condition.children.map(objectiveProgress);if(condition.type==='all')return values.some(v=>v===undefined)?undefined:Math.min(...values);const defined=values.filter(v=>v!==undefined);return defined.length?Math.max(...defined):undefined;}
 if(!condition.valid)return undefined;
 return condition.ok?1:condition.operator==='lte'?0:condition.target>0?Math.max(0,Math.min(1,condition.value/condition.target)):0;
}
export function utilitySnapshot(s,kind,ctx=metricContext(s)){
 const consumers=ctx.buildings.filter(t=>(!LANDMARKS[t.kind]||LANDMARKS[t.kind][kind]>0)&&!['power','water','busStop'].includes(serviceKind(t.kind))&&(t.kind!=='residential'||t.residents>0));
 const served=consumers.filter(t=>t[kind]).length;
 return {coveragePct:consumers.length?served/consumers.length*100:undefined,served,denominator:consumers.length,definition:'Công trình có nhu cầu được cấp đủ tải trong phạm vi và nối đường. Không tính nguồn điện/nước, điểm dừng và nhà chưa có dân.',capacity:s.metrics[kind],demand:s.metrics[kind+'Need'],unit:kind==='power'?'kW':'m³/ngày',activeBuildings:ctx.buildings.filter(t=>serviceKind(t.kind)===kind&&operating(t)).length};
}
function cityAlerts(s){
 const alerts=[];
 const add=(id,title,message,icon,test)=>{const i=s.tiles.findIndex(test);if(i>=0)alerts.push({id,title,message,icon,location:{x:i%64,y:Math.floor(i/64)}});};
 add('disconnected','Công trình mất kết nối','Nối đường từ cổng vùng đến công trình.','road',t=>t.kind&&!!!roadProfile(t)&&!t.connected);
 add('power','Thiếu điện','Kiểm tra phạm vi, đường nối và công suất trạm điện.','electricity',t=>t.kind&&!roadProfile(t)&&!['power','smallPower'].includes(t.kind)&&!t.power);
 add('water','Thiếu nước sạch','Kiểm tra phạm vi và công suất trạm cấp nước.','water',t=>t.kind&&!roadProfile(t)&&!['water','smallWater','waterPump'].includes(t.kind)&&!t.water);
 add('sewage','Thiếu xử lý nước thải','Trạm xử lý cần điện, nước và đường.','sewage',t=>t.kind==='residential'&&!t.sewage);
 add('fire','Công trình đang cháy','Bố trí cứu hỏa có tiện ích và kết nối.','fire',t=>t.fire>0);
 add('congestion','Đường quá tải','Nâng đại lộ hoặc bổ sung tuyến xe buýt phù hợp.','transport',t=>!!roadProfile(t)&&t.trafficLoad>t.trafficCapacity);
 if(s.money<0)alerts.push({id:'deficit',title:'Ngân quỹ âm',message:'Mở ngân sách để kiểm tra thuế, bảo trì và khoản vay.',icon:'expense'});
 return alerts;
}
export function makeHudSnapshot(s,{saveLabel='Lưu trên thiết bị',accountLabel='Tài khoản',selectedBuilding=null,tool='inspect'}={}){
 const m=s.metrics,ctx=metricContext(s),level=cityLevel(s),xp=progressionXp(s),views=missionViews(s);
 const mission=views.find(m=>!m.completed&&!m.locked&&m.available)||views.find(m=>!m.completed&&!m.locked)||views.find(m=>!m.completed);
 const p=mission?objectiveProgress(mission.condition):undefined;
 const w=weatherState(s),employment=snapshotMetric(s,{metric:'employment_pct'},ctx),happiness=snapshotMetric(s,{metric:'happiness_pct'},ctx);
 const housed=s.citizens.filter(c=>s.tiles[c.home]?.kind==='residential').length;
 const date=calendar(s.clock.seconds).date.toLocaleString('vi-VN',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
 return {cityName:s.name,level,xpIntoLevel:xp-xpForLevel(level),xpToNext:level===100?0:xpForLevel(level+1)-xpForLevel(level),money:hudMoney(s.money),moneyUnit:'₫ game',income:hudMoney(m.taxIncome+m.transitIncome),expense:hudMoney(m.expenses),debt:hudMoney(s.loanBalance),budgetPeriodLabel:'tháng (dự tính)',budgetDefinition:'Thuế và vé xe buýt dự tính theo tháng, cùng kỳ với chi phí vận hành và lãi vay. Giao dịch thực tế nằm trong sổ tiền.',population:s.citizens.length,housingCapacity:m.homes,jobs:m.jobs,happinessPct:happiness.valid?happiness.value:undefined,employmentPct:employment.valid?employment.value:undefined,housedPct:s.citizens.length?housed/s.citizens.length*100:undefined,
 electricity:utilitySnapshot(s,'power',ctx),water:utilitySnapshot(s,'water',ctx),paused:s.playback.paused,multiplier:s.playback.multiplier,observe:s.playback.observe,weatherLabel:`${w.name} · ${w.temperature}°C · mô phỏng`,gameDateLabel:date,
 mission:mission?{id:mission.id,level:mission.level,title:mission.name,description:mission.description,current:p===undefined?undefined:p*100,target:100,progressLabel:p===undefined?'Chưa có dữ liệu đủ điều kiện':`Mục tiêu tổng hợp · duy trì ${mission.held}/${mission.holdSeconds} giây game`,rewardXp:mission.xp,rewardMoney:hudMoney(mission.money),claimable:mission.ready&&!mission.locked&&mission.available,claimed:mission.completed}:undefined,
 catalogue:HUD_CATALOGUE,selectedBuilding,alerts:cityAlerts(s),saveLabel,accountLabel,activeTool:tool,terrainAvailable:false,terrainReason:'San nền và đào đắp chưa được triển khai. Có thể xem cao độ/dốc khi chọn ô đất.'};
}
export function maintenanceOf(s,t){return hudMoney((CATALOG[t.kind]?.upkeep||0)*(t.upgrade?MAINTENANCE_FACTORS[t.level]:1)*(s.budgets?.[serviceKind(t.kind)]??100)/100);}
