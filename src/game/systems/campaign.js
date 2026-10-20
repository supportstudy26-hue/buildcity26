import {healthcareEventValid} from './healthcare.js';
import {municipalEventValid} from './municipal-jobs.js';
import {logisticsEventValid,logisticsSnapshot} from './logistics.js';
import {leisureEventValid} from './leisure.js';
import {MISSIONS,MISSION_CATALOGUE_VERSION,CAP_XP,MAX_CITY_LEVEL,levelFromXp,xpForLevel,LEVEL_GRANT_BC} from '../../config/progression.js';
import {legacyLevelFromXp,legacyXpForLevel} from '../../config/legacy-progression.js';
import {metricKey,leaves,metricContext,metricNeedsContext,snapshotMetric,metricSupport,metricLabel,KIND_TOOLS,kindMatches} from './mission-metrics.js';
import {recordCash} from './economy.js';
import {ATTENDANCE_SECONDS} from '../../config/education.js';
export function migratedLegacyXp(xp){const l=Math.min(100,legacyLevelFromXp(xp));if(l===100)return CAP_XP;return xpForLevel(l)+Math.floor((xp-legacyXpForLevel(l))/(legacyXpForLevel(l+1)-legacyXpForLevel(l))*(xpForLevel(l+1)-xpForLevel(l)));}
export function createCampaign(){return {version:MISSION_CATALOGUE_VERSION,claims:[],levelGrants:[],baselines:{},holds:{},earned:{},counters:{},lastEvent:0,lastTick:null,windows:{},tripBins:[],waste:{at:0,generated:0,collected:0}};}
export function campaign(s){return s.progression.campaign??=createCampaign();}
export function progressionXp(s){return Math.min(CAP_XP,migratedLegacyXp(s.progression?.xp||0)+(s.progression?.campaign?.claims||[]).reduce((n,r)=>n+MISSIONS.find(m=>m.id===r.id).rewards.xp,0));}
export function lifetimeXp(s){return (s.progression?.xp||0)+(s.progression?.campaign?.claims||[]).reduce((n,r)=>n+MISSIONS.find(m=>m.id===r.id).rewards.xp,0);}
export function cityLevel(s){return levelFromXp(progressionXp(s));}
let counterCache,windowCache;
const counterNodes=()=>counterCache??=[...new Map(MISSIONS.flatMap(m=>leaves(m.condition)).filter(n=>n.scope==='counter_since_stage_activation'&&metricSupport(n)).map(n=>[metricKey(n),n])).values()];
const windowNodes=()=>windowCache??=new Map(MISSIONS.flatMap(m=>leaves(m.condition)).filter(n=>n.scope==='window'&&metricSupport(n)).map(n=>[metricKey(n),n]));
const stageMissions=new Map(MISSIONS.map(m=>[m.campaignStage,MISSIONS.filter(n=>n.campaignStage===m.campaignStage)]));
export function recordMissionEvent(s,e){
 if(!s.progression||!Number.isInteger(e.sequence)||e.sequence<=0)return;
 const c=campaign(s);if(e.sequence<=c.lastEvent)return;c.lastEvent=e.sequence;
 if(e.type==='healthcare-treatment-completed'&&healthcareEventValid(s,e)){const key=metricKey({metric:'completed_jobs',filters:{service:'healthcare'}});c.counters[key]=(c.counters[key]||0)+1;}
 if(e.type==='municipal-job-completed'&&municipalEventValid(s,e)){const key=metricKey({metric:'completed_jobs',filters:{service:e.service}});if(counterNodes().some(n=>metricKey(n)===key))c.counters[key]=(c.counters[key]||0)+1;}
 if(e.type==='freight-delivered'&&logisticsEventValid(s,e)){for(const n of counterNodes())if(n.metric==='delivered_units'&&(!n.filters.goods||n.filters.goods==='any'||n.filters.goods===e.goods)){const key=metricKey(n);c.counters[key]=(c.counters[key]||0)+e.amount;}}
 if(e.type==='leisure-visit-completed'&&leisureEventValid(s,e)){const key=metricKey({metric:'visitors_served',filters:{place:'park'}});c.counters[key]=(c.counters[key]||0)+1;}
 if(e.type==='trip-arrived'){
  const person=s.citizens.find(p=>p.id===e.entity);if(!person||!['walk','car','bus'].includes(e.mode)||!Number.isInteger(e.origin)||!Number.isInteger(e.destination)||e.origin===e.destination||e.destination!==person.goal||e.duration<0)return;
  for(const n of counterNodes())if(n.metric==='passenger_trips'&&(!n.filters.mode||n.filters.mode===e.mode||n.filters.mode==='public_transit'&&e.mode==='bus')&&(!n.filters.purpose||n.filters.purpose===e.purpose))c.counters[metricKey(n)]=(c.counters[metricKey(n)]||0)+1;
  const at=Math.floor(s.clock.seconds/10)*10;let bin=c.tripBins.at(-1);if(!bin||bin.at!==at){bin={at,count:0,transit:0,workCount:0,workSeconds:0};c.tripBins.push(bin);}bin.count++;if(e.mode==='bus')bin.transit++;if(e.purpose==='work'){bin.workCount++;bin.workSeconds+=e.duration;}c.tripBins=c.tripBins.filter(b=>b.at>s.clock.seconds-600);
 }
 if(e.type==='upgrade-completed'){
  const t=s.tiles[e.tile];if(!t||t.assetId!==e.asset||t.upgrade?.status!=='completed'||t.level!==e.level)return;
  for(const n of counterNodes())if(n.metric==='upgrades_completed'&&kindMatches(t,n.filters.kind)&&t.level>=n.filters.minTier)c.counters[metricKey(n)]=(c.counters[metricKey(n)]||0)+1;
 }
 if(e.type==='waste-collected'&&e.amount>0&&e.applied===true&&s.tiles[e.tile]?.connected){const key=metricKey({metric:'completed_jobs',filters:{service:'waste_collection'}});c.counters[key]=(c.counters[key]||0)+1;}
 if(e.type==='school-attendance-completed'){
  const person=s.citizens.find(p=>p.id===e.entity),u=person?.study,t=s.tiles[e.school];
  if(e.applied!==true||!u||person.state!=='at-school'||person.journey||person.goal!==e.school||u.tile!==e.school||u.assetId!==e.asset||t?.assetId!==e.asset||!t.active||!t.sewage||u.sessionSeconds<ATTENDANCE_SECONDS||u.lastAttendanceDay!==e.day||u.lastAttendanceSequence!==e.sequence||e.day!==Math.floor(s.clock.seconds/86400)||e.job!==`school-attendance-${person.id}-${e.day}`)return;
  const key=metricKey({metric:'completed_jobs',filters:{service:'school_attendance'}});c.counters[key]=(c.counters[key]||0)+1;
 }
}
export function readMetric(s,n,stage,ctx){
 const c=campaign(s),key=metricKey(n);
 if(!metricSupport(n)&&!(n.metric==='completed_jobs'&&n.filters?.service==='waste_collection')&&n.metric!=='waste_collected_pct')return {valid:false,reason:`Chưa triển khai: ${metricLabel(n)}`};
 if(n.scope==='counter_since_stage_activation'){
  const baseline=c.baselines[stage];if(!baseline)return {valid:false,reason:'Nhóm chưa mở để ghi mốc đếm'};
  const value=(c.counters[key]||0)-(baseline.counters[key]||0);return value>=0?{valid:true,value}:{valid:false,reason:'Bộ đếm giảm dưới mốc đã lưu'};
 }
 if(n.scope==='window'){
  const samples=(c.windows[key]||[]).filter(r=>r.at>s.clock.seconds-n.windowGameSeconds&&r.at<=s.clock.seconds);
  if(samples.length<n.minSamples||s.clock.seconds-(samples.at(-1)?.at??-Infinity)>20)return {valid:false,samples:samples.length,reason:`Cần ${n.minSamples} mẫu trong ${n.windowGameSeconds} giây game`};
  return {valid:true,value:samples.reduce((v,r)=>v+r.value,0)/samples.length,samples:samples.length};
 }
 if(n.metric==='waste_collected_pct'&&s.municipal?.version===1){const w=s.municipal.waste;return w.generated>0?{valid:true,value:Math.min(100,w.collected/w.generated*100)}:{valid:false,reason:'Chưa phát sinh rác'};}
 if(n.metric==='waste_collected_pct')return c.waste.generated>0?{valid:true,value:Math.min(100,c.waste.collected/c.waste.generated*100)}:{valid:false,reason:'Chưa phát sinh rác trong chu kỳ thu gom'};
 return snapshotMetric(s,n,ctx);
}
export function evaluateCondition(node,read){
 if(Array.isArray(node?.all)||Array.isArray(node?.any)){
  const children=(node.all||node.any).map(n=>evaluateCondition(n,read)),all=!!node.all;
  return {type:all?'all':'any',children,ok:children.length>0&&(all?children.every(c=>c.ok):children.some(c=>c.ok)),supported:children.length>0&&(all?children.every(c=>c.supported):children.some(c=>c.supported))};
 }
 const r=read(node)||{},valid=r.valid===true&&Number.isFinite(r.value)&&(node.scope!=='window'||r.samples>=node.minSamples),ok=valid&&(['gte','lte'].includes(node.operator))&&(node.operator==='gte'?r.value>=node.target:r.value<=node.target);
 return {type:'metric',...node,...r,valid,ok,supported:metricSupport(node)||node.metric==='waste_collected_pct'||node.metric==='completed_jobs'&&node.filters?.service==='waste_collection',label:metricLabel(node)};
}
export function missionViews(s){
 const c=campaign(s),claimed=new Set(c.claims.map(r=>r.id)),level=cityLevel(s),ctx=metricContext(s);
 return MISSIONS.map(m=>{const completed=claimed.has(m.id),blockedBy=m.prerequisiteClaims.filter(id=>!claimed.has(id)),locked=level<m.minCityLevel||!!blockedBy.length,condition=evaluateCondition(m.condition,n=>readMetric(s,n,m.counterBaselineKey,ctx)),held=c.holds[m.id]?.held||0,earned=c.earned[m.id];return {...m,name:m.title,xp:m.rewards.xp,money:m.rewards.money,level:m.minCityLevel,completed,locked,blockedBy,condition,conditions:leaves(condition).filter(n=>n.type==='metric'),held,holdSeconds:m.holdGameSeconds,eligible:!locked&&condition.ok,ready:!locked&&!!earned,available:condition.supported,tool:leaves(m.condition).map(n=>KIND_TOOLS[n.filters?.kind]?.[0]||({map_selected:'vietnam',road_length_m:'road',power_coverage_pct:'smallPower',water_coverage_pct:'smallWater',sewage_treated_pct:'smallSewage',waste_collected_pct:'waste'}[n.metric])).find(Boolean)};});
}
function sampleWindows(s,c){
 const at=s.clock.seconds;
 for(const [key,n] of windowNodes()){let value;
  const bins=c.tripBins.filter(b=>b.at>at-600&&b.at<=at),count=bins.reduce((n,b)=>n+b.count,0),work=bins.reduce((n,b)=>n+b.workCount,0);
  if(n.metric==='commute_minutes'&&work)value=bins.reduce((n,b)=>n+b.workSeconds,0)/work/60;
  if(n.metric==='public_transit_share_pct'&&count)value=bins.reduce((n,b)=>n+b.transit,0)/count*100;
  if(n.metric==='operating_profit_per_game_minute'){
   // Actual posted operations only. Grants, borrowing, stocks and salvage
   // cannot fill this window; no posting/demand leaves the metric unavailable.
   const entries=s.ledger.entries.filter(e=>e.seconds>at-600&&e.seconds<=at&&['legacy-tax-estimate','maintenance-and-interest','bus-fare','logistics-sales-tax','logistics-production','logistics-import','logistics-transport','healthcare-supplies','municipal-supplies','municipal-inspection-supplies'].includes(e.category));
   if(entries.length)value=entries.reduce((v,e)=>v+e.amount,0)/(Math.min(600,Math.max(60,at))/60);
  }
  if(n.metric==='supply_fulfillment_pct')value=logisticsSnapshot(s).supplyFulfillmentPct;
  const rows=(c.windows[key]||[]).filter(r=>r.at>at-600);
  if(Number.isFinite(value)&&rows.at(-1)?.at!==at)rows.push({at,value});c.windows[key]=rows.slice(-60);
 }
}
export function updateCampaign(s,force=false){
 const c=campaign(s),now=s.clock.seconds;if(c.lastTick===now&&!force)return;
 // Sampling follows ticks, never UI rendering. Hold checks run every simulation
 // second. Baselines are written once for the whole A/B/C group.
 if(now%10===0)sampleWindows(s,c);
 const ids=new Set(c.claims.map(r=>r.id)),lv=cityLevel(s),previous=c.lastTick;let ctx;c.lastTick=now;
 for(const m of MISSIONS){
  if(ids.has(m.id)||lv<m.minCityLevel)continue;
  const opening=stageMissions.get(m.campaignStage)[0].prerequisiteClaims.every(id=>ids.has(id));
  if(opening&&!c.baselines[m.counterBaselineKey])c.baselines[m.counterBaselineKey]={at:now,counters:{...c.counters}};
  if(!m.prerequisiteClaims.every(id=>ids.has(id))||c.earned[m.id])continue;
  const condition=evaluateCondition(m.condition,n=>readMetric(s,n,m.counterBaselineKey,metricNeedsContext(n)?ctx??=metricContext(s):undefined));
  if(!condition.ok){delete c.holds[m.id];continue;}
  const prior=c.holds[m.id],delta=prior&&previous===now-1?1:0;
  const held=Math.min(m.holdGameSeconds,(prior?.held||0)+delta);c.holds[m.id]={held,last:now};
  if(held>=m.holdGameSeconds)c.earned[m.id]={at:now,stage:m.campaignStage,sourceStep:s.clock.step,graphVersion:s.graphVersion};
 }
}
// Called only by the server verifier. Client previews never pay themselves.
export function applyVerifiedClaim(s,id,sourceRevision){
 const m=MISSIONS.find(m=>m.id===id);if(!m)throw new Error('Nhiệm vụ không tồn tại.');const c=campaign(s);
 if(c.claims.some(r=>r.id===id))return false;
 const view=missionViews(s).find(m=>m.id===id);if(!view.ready)throw new Error('Chưa có bằng chứng hoàn thành nhiệm vụ.');
 const oldLevel=cityLevel(s);c.claims.push({id,at:s.clock.seconds,revision:sourceRevision});
 recordCash(s,`mission:${c.version}:${id}`,'mission-reward',m.rewards.money,id);
 for(let level=oldLevel+1;level<=cityLevel(s);level++)if(!s.progression.levelGrants.includes(level)&&!c.levelGrants.includes(level)){recordCash(s,`campaign-level:${c.version}:${level}`,'level-grant',LEVEL_GRANT_BC);c.levelGrants.push(level);}
 delete c.holds[id];delete c.earned[id];c.lastTick=null;updateCampaign(s,true);return true;
}
export function validateCampaign(c,seconds){
 if(c==null)return;if(c.version!==MISSION_CATALOGUE_VERSION||!Array.isArray(c.claims)||c.claims.length>300||new Set(c.claims.map(r=>r?.id)).size!==c.claims.length||!Array.isArray(c.levelGrants)||new Set(c.levelGrants).size!==c.levelGrants.length||c.levelGrants.some(l=>!Number.isInteger(l)||l<2||l>MAX_CITY_LEVEL))throw new Error('Chiến dịch không hợp lệ.');
 const claimed=new Set();for(const r of c.claims){const m=MISSIONS.find(m=>m.id===r.id);if(!m||!Number.isInteger(r.at)||r.at<0||r.at>seconds||!Number.isSafeInteger(r.revision)||r.revision<1||m.prerequisiteClaims.some(id=>!claimed.has(id)))throw new Error('Biên nhận chiến dịch không hợp lệ.');claimed.add(r.id);}
 for(const key of ['baselines','holds','earned','counters','windows'])if(!c[key]||typeof c[key]!=='object'||Array.isArray(c[key]))throw new Error('Tiến trình chiến dịch không hợp lệ.');
 if(Object.keys(c.baselines).length>100||Object.keys(c.holds).length>300||Object.keys(c.earned).length>300||Object.keys(c.counters).length>200||Object.keys(c.windows).length>20||JSON.stringify(c).length>150000||!Number.isInteger(c.lastEvent)||c.lastEvent<0||c.lastTick!=null&&(!Number.isInteger(c.lastTick)||c.lastTick<0||c.lastTick>seconds))throw new Error('Tiến trình chiến dịch vượt giới hạn.');
 const keys=new Set(counterNodes().map(metricKey));keys.add(metricKey({metric:'completed_jobs',filters:{service:'waste_collection'}}));
 for(const [k,v] of Object.entries(c.counters))if(!keys.has(k)||!Number.isSafeInteger(v)||v<0)throw new Error('Bộ đếm nhiệm vụ không hợp lệ.');
 for(const [k,b] of Object.entries(c.baselines))if(!/^bc26-stage-\d{3}$/.test(k)||!MISSIONS.some(m=>m.counterBaselineKey===k)||!Number.isInteger(b.at)||b.at<0||b.at>seconds||!b.counters||Object.entries(b.counters).some(([k,v])=>!keys.has(k)||!Number.isSafeInteger(v)||v<0||v>(c.counters[k]||0)))throw new Error('Mốc đếm nhiệm vụ không hợp lệ.');
 for(const [id,h] of Object.entries(c.holds)){const m=MISSIONS.find(m=>m.id===id);if(!m||!Number.isInteger(h.held)||h.held<0||h.held>m.holdGameSeconds||!Number.isInteger(h.last)||h.last<0||h.last>seconds)throw new Error('Thời gian nhiệm vụ không hợp lệ.');}
 for(const [id,e] of Object.entries(c.earned)){const m=MISSIONS.find(m=>m.id===id);if(!m||e.stage!==m.campaignStage||!Number.isInteger(e.at)||e.at<0||e.at>seconds||e.sourceStep!==e.at||!Number.isInteger(e.graphVersion))throw new Error('Bằng chứng nhiệm vụ không hợp lệ.');}
 for(const rows of Object.values(c.windows))if(!Array.isArray(rows)||rows.length>60||rows.some(r=>!Number.isInteger(r.at)||r.at<0||r.at>seconds||!Number.isFinite(r.value)))throw new Error('Mẫu cửa sổ nhiệm vụ không hợp lệ.');
 if(!Array.isArray(c.tripBins)||c.tripBins.length>61||c.tripBins.some(b=>!Number.isInteger(b.at)||b.at<0||b.at>seconds||['count','transit','workCount','workSeconds'].some(k=>!Number.isFinite(b[k])||b[k]<0)||b.transit>b.count||b.workCount>b.count))throw new Error('Mẫu hành trình không hợp lệ.');
 if(!c.waste||!Number.isFinite(c.waste.generated)||c.waste.generated<0||!Number.isFinite(c.waste.collected)||c.waste.collected<0||!Number.isInteger(c.waste.at)||c.waste.at<0||c.waste.at>seconds)throw new Error('Chu kỳ thu gom không hợp lệ.');
}
