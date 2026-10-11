import contract from '../../config/missions/metric-contract.json' with {type:'json'};
import {CATALOG,serviceKind} from '../../config/catalog.js';
import {isRoad} from './world.js';
import {capacityFactor} from '../../config/building-economy.js';
import {SCHOOL_PROFILES} from '../../config/education.js';
import {educationSnapshot,schoolSnapshot} from './education.js';
// Only map a kind when the corresponding game system actually operates.
export const KIND_TOOLS=Object.freeze({house:['residential'],shop:['commercial'],office:['commercial'],power_source:['smallPower','power'],pump:['smallWater','water','waterPump'],sewer_outlet:['smallSewage','sewage','treatmentPlant'],waste_depot:['waste','wasteCenter'],primary_school:['school'],secondary_school:['secondarySchool'],clinic:['clinic'],hospital:['hospital'],fire_station:['fire','fireCenter'],police_station:['police','policeCenter'],park:['park','plaza'],bus_depot:['bus'],bus_stop:['busStop'],university:['university']});
export const metricKey=n=>JSON.stringify([n.metric,Object.entries(n.filters||{}).sort(([a],[b])=>a.localeCompare(b))]);
// Catalogue groups use all/any; evaluated groups use children. Keep both so
// compound objectives expose their real readings in the HUD and mission panel.
export const leaves=n=>n?.all?n.all.flatMap(leaves):n?.any?n.any.flatMap(leaves):Array.isArray(n?.children)?n.children.flatMap(leaves):n?[n]:[];
const good=value=>Number.isFinite(value)?{valid:true,value}:{valid:false,reason:'Chưa có mẫu hợp lệ'};
const absent=reason=>({valid:false,reason});
export function kindMatches(t,kind){const kinds=KIND_TOOLS[kind];if(!kinds?.includes(t.kind))return false;if(kind==='office')return t.blueprint==='glass-office';if(kind==='shop')return t.blueprint!=='glass-office';return true;}
export function operating(t){if(!t.kind||!t.connected||(t.fire||0)>=60||t.development?.status==='building')return false;const source=['power','water'].includes(serviceKind(t.kind));return source?CATALOG[t.kind]?.capacity>0:!!t.active&&capacityFactor(t)>0;}
export function metricContext(s){const buildings=s.tiles.filter(t=>t.kind&&!isRoad(t)),occupied=s.tiles.filter(t=>t.kind==='residential'&&t.residents>0);return {buildings,occupied,workforce:s.citizens.filter(c=>c.age>=18&&c.age<65),activeFirms:new Set(s.firms.filter(f=>f.active&&s.tiles[f.home]?.active).map(f=>f.id))};}
export const metricNeedsContext=n=>['completed_buildings','active_buildings','connected_buildings_pct','power_coverage_pct','water_coverage_pct','sewage_treated_pct','happiness_pct','employment_pct'].includes(n.metric);
export function snapshotMetric(s,n,ctx){
 const f=n.filters||{},m=s.metrics||{},kind=f.kind;
 if(metricNeedsContext(n))ctx??=metricContext(s);
 if(['completed_buildings','active_buildings'].includes(n.metric)){
  if(!KIND_TOOLS[kind])return absent(`Chưa có hệ thống ${contract.buildingKinds?.[kind]||kind}`);
  if(Object.keys(f).some(k=>!['kind','minTier'].includes(k)))return absent('Bộ lọc chưa hỗ trợ');
  if(f.minTier>3)return absent('Nâng cấp bậc 4–5 chưa có đủ tiện ích');
  return good(ctx.buildings.filter(t=>kindMatches(t,kind)&&t.level>=(f.minTier||1)&&t.development?.status!=='building'&&(n.metric==='completed_buildings'||operating(t)&&(!SCHOOL_PROFILES[t.kind]||(schoolSnapshot(s,s.tiles.indexOf(t))?.capacity||0)>0))).length);
 }
 if(n.metric==='active_routes'){
  if(f.mode!=='bus'||Object.keys(f).length!==1)return absent('Phương thức vận tải này chưa vận hành');
  return good((s.network?.busLines||[]).filter(l=>l.ok&&s.vehicles.some(v=>v.kind==='bus'&&v.operator===l.id&&v.state!=='blocked')&&l.stops.every(i=>operating(s.tiles[i]))).length);
 }
 if(Object.keys(f).length)return absent('Bộ lọc chưa hỗ trợ');
 const ratio=(items,test)=>items.length?good(items.filter(test).length/items.length*100):absent('Chưa có nhu cầu để tính tỷ lệ');
 switch(n.metric){
  case 'school_access_pct':{const e=educationSnapshot(s);return e.eligible?good(e.accessPct):absent('Chưa có học sinh 6–17 tuổi để tính chỗ học');}
  case 'map_selected':{const g=s.world?.geography;return good(g?.mode==='vietnam'&&/^vn-/.test(g.provinceId||'')&&g.anchor?.length===2&&g.anchor.every(Number.isFinite)&&g.crs&&g.utmOrigin?.every(Number.isFinite)?1:0);}
  case 'road_length_m':return good(s.tiles.filter(t=>isRoad(t)&&t.connected).length*20);
  case 'population':return good(s.citizens.length);
  case 'connected_buildings_pct':return ratio(ctx.buildings,t=>t.connected);
  case 'power_coverage_pct':return ratio(ctx.buildings.filter(t=>!['power','water','busStop'].includes(serviceKind(t.kind))&&(t.kind!=='residential'||t.residents>0)),t=>t.power);
  case 'water_coverage_pct':return ratio(ctx.buildings.filter(t=>!['power','water','busStop'].includes(serviceKind(t.kind))&&(t.kind!=='residential'||t.residents>0)),t=>t.water);
  case 'sewage_treated_pct':{const need=ctx.buildings.reduce((sum,t)=>sum+(t.kind==='residential'?t.residents:['commercial','industrial'].includes(t.kind)?14:6)*capacityFactor(t),0);if(!need)return absent('Chưa phát sinh nước thải');const served=ctx.buildings.reduce((sum,t)=>sum+(t.sewage?(t.kind==='residential'?t.residents:['commercial','industrial'].includes(t.kind)?14:6)*capacityFactor(t):0),0);return good(Math.min(100,served/need*100));}
  case 'happiness_pct':return s.citizens.length?good(ctx.occupied.reduce((v,t)=>v+t.happiness*t.residents,0)/s.citizens.length):absent('Chưa có cư dân');
  case 'employment_pct':return ratio(ctx.workforce,c=>ctx.activeFirms.has(c.work));
  case 'traffic_flow_pct':return s.network?.trips?.length?good(m.traffic):absent('Chưa có nhu cầu giao thông');
  case 'treasury':return good(s.money);
  case 'debt':return s.loanBalance>=0?good(s.loanBalance):absent('Dư nợ không hợp lệ');
  case 'power_reserve_pct':return m.powerNeed>0?good(Math.max(0,(m.power-m.powerNeed)/m.powerNeed*100)):absent('Chưa có tải điện');
  case 'water_reserve_pct':return m.waterNeed>0?good(Math.max(0,(m.water-m.waterNeed)/m.waterNeed*100)):absent('Chưa có nhu cầu nước');
  // Current pollution field combines wastewater/garbage/industry. It is not
  // verified air pollution, noise, flood risk or capacity-aware service access.
  default:return absent(`Chưa có dữ liệu mô phỏng: ${contract.metrics[n.metric]?.nameVi||n.metric}`);
 }
}
export function metricSupport(n){
 if(['completed_buildings','active_buildings'].includes(n.metric))return !!KIND_TOOLS[n.filters?.kind]&&!(n.filters?.minTier>3);
 if(n.metric==='active_routes')return n.filters?.mode==='bus';
 if(n.metric==='passenger_trips')return (!n.filters?.mode||['walk','car','bus','public_transit'].includes(n.filters.mode))&&(!n.filters?.purpose||['work','home','move-in'].includes(n.filters.purpose));
 if(n.metric==='upgrades_completed')return !!KIND_TOOLS[n.filters?.kind]&&!(n.filters?.minTier>3);
 if(n.metric==='school_access_pct')return !Object.keys(n.filters||{}).length;
 if(n.metric==='verified_save_count'||n.metric==='waste_collected_pct'||n.metric==='completed_jobs'&&['waste_collection','school_attendance'].includes(n.filters?.service)&&Object.keys(n.filters).length===1)return true;
 return ['map_selected','road_length_m','population','connected_buildings_pct','power_coverage_pct','water_coverage_pct','sewage_treated_pct','happiness_pct','employment_pct','traffic_flow_pct','treasury','debt','power_reserve_pct','water_reserve_pct','commute_minutes','public_transit_share_pct','operating_profit_per_game_minute'].includes(n.metric);
}
export const metricLabel=n=>`${contract.metrics[n.metric]?.nameVi||n.metric}${n.filters?.kind?' · '+(contract.buildingKinds[n.filters.kind]||n.filters.kind):''}${n.filters?.minTier?' · bậc '+n.filters.minTier:''}${n.filters?.mode?' · '+({walk:'đi bộ',bus:'xe buýt',public_transit:'giao thông công cộng'}[n.filters.mode]||n.filters.mode):''}${n.filters?.purpose?' · '+({work:'đi làm',home:'về nhà','move-in':'chuyển đến'}[n.filters.purpose]||n.filters.purpose):''}`;
