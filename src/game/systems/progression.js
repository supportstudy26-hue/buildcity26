import {MISSIONS,XP_VERSION,LEVEL_GRANT_BC,levelFromXp} from '../../config/progression.js';
import {recordCash} from './economy.js';
import {emit} from './events.js';
import {isRoad} from './world.js';
const DAY=86400;
export function createProgression(){return {version:XP_VERSION,xp:0,receipts:[],tracking:{},levelGrants:[]};}
function facts(s){
  const pop=s.citizens.length,homes=s.tiles.filter(t=>t.kind==='residential'&&t.residents),supplied=homes.reduce((n,t)=>n+(t.connected&&t.power&&t.water&&t.sewage?t.residents:0),0),capacity=homes.reduce((n,t)=>n+24*t.level,0),coverage={};
  for(const kind of ['school','clinic','waste','fire','police'])coverage[kind]=pop?Math.round(homes.reduce((n,t)=>n+(t.services.includes(kind)?t.residents:0),0)/pop*100):0;
  return {population:supplied===pop&&capacity>=pop?pop:0,utilities:supplied===pop?pop:0,roads:s.tiles.filter(t=>isRoad(t)&&t.connected&&t.historicalCost>0).length,attendance:s.citizens.filter(c=>c.attendance>0).length,park:new Set(s.contracts.filter(c=>c.status==='completed'&&s.tiles[c.tile].assetId&&s.tiles[c.tile].kind==='park'&&s.tiles[c.tile].active).map(c=>c.tile)).size,...coverage};
}
export function missionViews(s){const f=facts(s),p=s.progression,level=levelFromXp(p.xp);return MISSIONS.map(m=>{const receipt=p.receipts.find(r=>r.id===m.id),since=p.tracking[m.id];return {...m,value:f[m.kind]??0,completed:!!receipt,completedAt:receipt?.at,locked:level<m.level,held:receipt?DAY:since==null?0:Math.min(DAY,Math.max(0,s.clock.seconds-since))};});}
export function updateProgression(s,force=false){
  s.progression??=createProgression();if(!force&&s.clock.seconds%3600!==0)return;
  const p=s.progression,prior=levelFromXp(p.xp),now=s.clock.seconds;
  for(const m of missionViews(s)){
    if(m.completed)continue;
    if(m.locked||m.value<m.target){delete p.tracking[m.id];continue;}
    if(p.tracking[m.id]==null)p.tracking[m.id]=now;
    if(now-p.tracking[m.id]<DAY)continue;
    p.receipts.push({id:m.id,xp:m.xp,at:now});p.xp+=m.xp;delete p.tracking[m.id];emit(s,'mission-completed',m.id,{xp:m.xp});
  }
  const level=levelFromXp(p.xp);
  for(let l=prior+1;l<=level;l++)if(!p.levelGrants.includes(l)){recordCash(s,`city-level-${XP_VERSION}-${l}`,'level-grant',LEVEL_GRANT_BC);p.levelGrants.push(l);emit(s,'city-level-up',String(l),{grant:LEVEL_GRANT_BC});}
}
export function validateProgression(p,seconds){
  if(!p||p.version!==XP_VERSION||!Number.isSafeInteger(p.xp)||p.xp<0||!Array.isArray(p.receipts)||new Set(p.receipts.map(r=>r?.id)).size!==p.receipts.length||!p.tracking||typeof p.tracking!=='object'||Array.isArray(p.tracking)||!Array.isArray(p.levelGrants))throw new Error('Dữ liệu nhiệm vụ không hợp lệ.');
  let total=0;for(const r of p.receipts){const m=MISSIONS.find(m=>m.id===r.id);if(!m||r.xp!==m.xp||!Number.isFinite(r.at)||r.at<0||r.at>seconds)throw new Error('Receipt nhiệm vụ không hợp lệ.');total+=r.xp;}
  const level=levelFromXp(total);if(total!==p.xp||p.levelGrants.length!==level-1||new Set(p.levelGrants).size!==p.levelGrants.length||p.levelGrants.some(l=>!Number.isInteger(l)||l<2||l>level))throw new Error('XP hoặc thưởng cấp không đối chiếu được.');
  for(const [id,at] of Object.entries(p.tracking))if(!MISSIONS.some(m=>m.id===id)||!Number.isFinite(at)||at<0||at>seconds||p.receipts.some(r=>r.id===id))throw new Error('Thời gian nhiệm vụ không hợp lệ.');
}
