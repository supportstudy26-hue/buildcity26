#!/usr/bin/env node
// Read-only audit of the actual catalogue and providers. Fixtures report observed
// readings; they never pay rewards, inject high metrics or change mission goals.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {MISSIONS,LEVELS,CAP_XP,MAX_CITY_LEVEL,levelFromXp,xpForLevel} from '../src/config/progression.js';
import contract from '../src/config/missions/metric-contract.json' with {type:'json'};
import unlocks from '../src/config/missions/unlocks.json' with {type:'json'};
import {KIND_TOOLS,metricKey,metricSupport,leaves} from '../src/game/systems/mission-metrics.js';
import {evaluateCondition,missionViews} from '../src/game/systems/campaign.js';
import {createCity,createEmptyCity} from '../src/game/core.js';
import {CATALOG} from '../src/config/catalog.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const texts=new Map();
const read=path=>{if(!texts.has(path))texts.set(path,readFileSync(resolve(root,path),'utf8'));return texts.get(path);};
function ref(file,symbol){
 if(!existsSync(resolve(root,file)))return {file,symbol,exists:false};
 const lines=read(file).split('\n'),line=lines.findIndex(s=>s.includes(symbol));
 return {file,symbol,exists:line>=0,...(line>=0?{line:line+1}:{})};
}
const refs=(...pairs)=>pairs.map(([file,symbol])=>ref(file,symbol));
const commonRefs=()=>refs(['src/game/systems/mission-metrics.js','export function metricSupport'],['src/game/systems/campaign.js','export function readMetric'],['src/game/systems/campaign.js','export function evaluateCondition']);
const providers={
 school_access_pct:[['src/game/systems/education.js','export function educationSnapshot'],['src/game/systems/education.js','export function reconcileEducation']],
 map_selected:[['src/game/systems/mission-metrics.js',"case 'map_selected'"],['src/game/geography/city.js','createVietnamCity']],
 road_length_m:[['src/game/systems/mission-metrics.js',"case 'road_length_m'"],['src/game/systems/utilities.js','export function analyzeUtilities']],
 completed_buildings:[['src/game/systems/mission-metrics.js','export function kindMatches'],['src/game/systems/development.js','export function materializeBuilding']],
 active_buildings:[['src/game/systems/mission-metrics.js','export function operating'],['src/game/systems/utilities.js','export function analyzeUtilities']],
 population:[['src/game/systems/mission-metrics.js',"case 'population'"],['src/game/systems/households.js','export function reconcileHouseholds'],['src/game/systems/development.js','export function updateDevelopment']],
 connected_buildings_pct:[['src/game/systems/mission-metrics.js',"case 'connected_buildings_pct'"],['src/game/systems/utilities.js','export function analyzeUtilities']],
 power_coverage_pct:[['src/game/systems/mission-metrics.js',"case 'power_coverage_pct'"],['src/game/systems/utilities.js','export function analyzeUtilities']],
 water_coverage_pct:[['src/game/systems/mission-metrics.js',"case 'water_coverage_pct'"],['src/game/systems/utilities.js','export function analyzeUtilities']],
 sewage_treated_pct:[['src/game/systems/mission-metrics.js',"case 'sewage_treated_pct'"],['src/game/systems/utilities.js','export function analyzeUtilities']],
 waste_collected_pct:[['src/game/systems/services.js','export function updateLegacyServices'],['src/game/systems/campaign.js',"if(n.metric==='waste_collected_pct')"]],
 happiness_pct:[['src/game/systems/mission-metrics.js',"case 'happiness_pct'"],['src/game/core.js','export function analyze']],
 employment_pct:[['src/game/systems/mission-metrics.js',"case 'employment_pct'"],['src/game/systems/firms.js','export function reconcileFirms']],
 traffic_flow_pct:[['src/game/systems/mission-metrics.js',"case 'traffic_flow_pct'"],['src/game/systems/roads.js','export function analyzeTraffic']],
 treasury:[['src/game/systems/mission-metrics.js',"case 'treasury'"],['src/game/systems/economy.js','export function recordCash']],
 debt:[['src/game/systems/mission-metrics.js',"case 'debt'"],['src/game/core.js','export function borrow'],['src/game/core.js','export function repay']],
 power_reserve_pct:[['src/game/systems/mission-metrics.js',"case 'power_reserve_pct'"],['src/game/systems/utilities.js','export function analyzeUtilities']],
 water_reserve_pct:[['src/game/systems/mission-metrics.js',"case 'water_reserve_pct'"],['src/game/systems/utilities.js','export function analyzeUtilities']],
 active_routes:[['src/game/systems/mission-metrics.js',"if(n.metric==='active_routes')"],['src/game/systems/roads.js','export function busRoute'],['src/game/systems/bus-operations.js','export function updateBuses']],
 passenger_trips:[['src/game/systems/citizens.js','export function updateCitizens'],['src/game/systems/bus-operations.js','export function updateBuses'],['src/game/systems/campaign.js','export function recordMissionEvent']],
 upgrades_completed:[['src/game/systems/upgrades.js','export function startUpgrade'],['src/game/systems/upgrades.js','export function updateUpgrades'],['src/game/systems/campaign.js','export function recordMissionEvent']],
 completed_jobs:[['src/game/systems/services.js','export function updateLegacyServices'],['src/game/systems/education.js','export function updateEducation'],['src/game/systems/campaign.js','export function recordMissionEvent']],
 verified_save_count:[['server/missions.js','export function verifyMissionCheckpoint'],['supabase/migrations/202610100003_mission_campaign.sql','bc26_mission_commit']],
 commute_minutes:[['src/game/systems/campaign.js','function sampleWindows'],['src/game/systems/campaign.js',"if(e.type==='trip-arrived')"]],
 public_transit_share_pct:[['src/game/systems/campaign.js','function sampleWindows'],['src/game/systems/campaign.js',"if(e.type==='trip-arrived')"]],
 operating_profit_per_game_minute:[['src/game/systems/campaign.js','function sampleWindows'],['src/game/systems/economy.js','export function dailyFinance']]
};
const systems={
 foundation:{name:'Nhu cầu, đường tiếp cận, điện/nước, ngân sách và nhân lực dịch vụ',dependsOn:[],order:1},
 education:{name:'Chỗ học, đến trường, đào tạo, tốt nghiệp',dependsOn:['foundation'],order:2},
 health:{name:'Y tế, giường bệnh và xe cấp cứu',dependsOn:['foundation'],order:3},
 emergency:{name:'Cứu hỏa, kiểm tra rủi ro và an ninh',dependsOn:['foundation'],order:4},
 amenities:{name:'Cây, đi bộ, công viên, văn hóa, thể thao và lượt sử dụng',dependsOn:['foundation'],order:5},
 economy_logistics:{name:'Nông nghiệp, sản xuất, kho, đơn hàng, giao nhận',dependsOn:['foundation'],order:6},
 road_transit:{name:'Đỗ xe, độ trễ chuyến đi và chuyển tuyến',dependsOn:['foundation'],order:7},
 districts:{name:'Quận có tên, ranh giới và dân cư',dependsOn:['foundation'],order:8},
 utilities_environment:{name:'Biến áp, xử lý nước, tái chế, nguồn tái tạo, không khí, tiếng ồn',dependsOn:['foundation','economy_logistics'],order:9},
 communications:{name:'Bưu chính, phân loại thư, viễn thông',dependsOn:['foundation','economy_logistics'],order:10},
 welfare:{name:'Khảo sát hộ, phúc lợi, cao tuổi và hậu sự',dependsOn:['foundation','health'],order:11},
 flood:{name:'Hồ điều hòa, thoát nước và nguy cơ ngập theo địa hình',dependsOn:['foundation','utilities_environment'],order:12},
 rail:{name:'Tram, tàu khách/hàng và metro nối cư dân/hàng với chiến dịch',dependsOn:['foundation','road_transit','economy_logistics'],order:13},
 tourism:{name:'Khách, du lịch, khách sạn và hành trình tới điểm đến',dependsOn:['amenities','road_transit'],order:14},
 upgrades:{name:'Tier 4–5, tiện ích tiên quyết và nghiệm thu nâng cấp',dependsOn:['communications','welfare','utilities_environment'],order:15},
 trade:{name:'Cảng, cảng cạn, vận tải vùng ngoài, shipping/ferry/bus liên tỉnh',dependsOn:['economy_logistics','rail'],order:16},
 research:{name:'Nghiên cứu có nhân lực, ngân sách và thời lượng',dependsOn:['education','economy_logistics'],order:17},
 aviation:{name:'Sân bay/hàng hóa/bãi đáp nối nhu cầu và metric chiến dịch',dependsOn:['foundation','tourism','trade'],order:18}
};
const kindSystems={
 farm:'economy_logistics',warehouse:'economy_logistics',food_factory:'economy_logistics',industrial_plant:'economy_logistics',
 primary_school:'education',secondary_school:'education',vocational_school:'education',university:'education',
 clinic:'health',hospital:'health',fire_station:'emergency',police_station:'emergency',
 park:'amenities',library:'amenities',cultural_center:'amenities',sports_center:'amenities',monument:'amenities',
 power_substation:'utilities_environment',water_treatment:'utilities_environment',recycling_center:'utilities_environment',clean_power:'utilities_environment',
 post_office:'communications',mail_sorting_center:'communications',telecom_hub:'communications',
 social_center:'welfare',elderly_care:'welfare',cemetery:'welfare',retention_basin:'flood',drainage_pump:'flood',
 tram_depot:'rail',tram_stop:'rail',passenger_station:'rail',freight_station:'rail',metro_station:'rail',metro_depot:'rail',intermodal_hub:'road_transit',
 parking:'road_transit',tourism_attraction:'tourism',hotel:'tourism',harbor:'trade',dry_port:'trade',airport:'aviation',cargo_terminal:'aviation',heliport:'aviation',research_center:'research'
};
const metricSystems={school_access_pct:'education',education_completion_pct:'education',health_access_pct:'health',fire_access_pct:'emergency',security_access_pct:'emergency',emergency_response_minutes:'emergency',healthy_trees:'amenities',walkable_housing_pct:'amenities',congestion_minutes:'road_transit',transit_transfer_trips:'road_transit',parking_capacity:'road_transit',district_count:'districts',supply_fulfillment_pct:'economy_logistics',delivered_units:'economy_logistics',recycling_pct:'utilities_environment',renewable_share_pct:'utilities_environment',max_air_pollution_pct:'utilities_environment',max_noise_pct:'utilities_environment',mail_access_pct:'communications',telecom_coverage_pct:'communications',social_access_pct:'welfare',eligible_social_households:'welfare',eldercare_access_pct:'welfare',retention_capacity:'flood',drainage_capacity:'flood',flood_risk_housing_pct:'flood',tourism_occupancy_pct:'tourism',research_completed:'research'};
const serviceSystems={school_attendance:'education',vocational_enrollment:'education',university_enrollment:'education',healthcare:'health',ambulance_transport:'health',fire_inspection:'emergency',security_patrol:'emergency',service_inspection:'emergency',mail_delivery:'communications',social_support:'welfare',social_assessment:'welfare',eldercare:'welfare'};
const modeSystems={tram:'rail',freight_rail:'rail',passenger_rail:'rail',metro:'rail',intercity_rail:'trade',intercity_freight_rail:'trade',shipping:'trade',ferry:'trade',intercity_bus:'trade',air:'aviation'};
function systemFor(n){
 const f=n.filters||{};
 if(f.minTier>3)return 'upgrades';
 if(f.kind)return kindSystems[f.kind]||'foundation';
 if(f.service)return serviceSystems[f.service]||'foundation';
 if(f.mode&&modeSystems[f.mode])return modeSystems[f.mode];
 if(f.purpose==='tourism'||f.place==='tourism')return 'tourism';
 if(f.purpose==='intercity_trade'||f.via==='trade_gateway')return 'trade';
 if(n.metric==='visitors_served')return 'amenities';
 return metricSystems[n.metric]||'foundation';
}
const missingRequirements={
 foundation:'Phải có nguồn nhu cầu thật, điều kiện vận hành, đường hợp lệ, công suất, chi phí và nhân lực; sau đó nối bộ đọc metric.',
 education:'Tiểu học/trung học đã có chỗ học, giáo viên, hành trình và lượt học. Còn thiếu ghi danh nghề/đại học và chu kỳ đào tạo/tốt nghiệp.',
 health:'Thiếu bệnh nhân/giường/công suất, đường tiếp cận, hoàn tất khám điều trị và vận chuyển cấp cứu áp dụng kết quả.',
 emergency:'Thiếu job kiểm tra/patrol có cooldown và kết quả thật, công suất tiếp cận và thời gian đáp ứng.',
 amenities:'Thiếu người sử dụng cơ sở thật/cooldown/công suất hoặc cây sống, vị trí hợp lệ và tuyến đi bộ tới tiện ích.',
 economy_logistics:'Thiếu loại công trình hoạt động đúng vai trò, đơn hàng, tồn kho, vận chuyển và xác nhận nhận hàng; hình mẫu kho/xưởng chưa đủ.',
 road_transit:'Thiếu bãi đỗ và chỗ đỗ đang phục vụ, độ trễ chuyến hoàn thành hoặc hành trình có chuyển ít nhất hai tuyến.',
 districts:'Thiếu vùng được đặt tên có ranh giới/diện tích và nhà có cư dân, cùng metric đếm quận.',
 utilities_environment:'Thiếu công trình đúng vai trò và mô phỏng phân phối/xử lý/tái chế; ô nhiễm tổng hiện tại không chứng minh không khí/tiếng ồn.',
 communications:'Thiếu viễn thông đáp ứng tải và bưu chính có tiếp cận, job phát thư/ phân loại thư thật.',
 welfare:'Thiếu khảo sát hộ đủ điều kiện, nhu cầu cao tuổi, chỗ chăm sóc/phúc lợi, ngân sách/cooldown và kết quả phục vụ.',
 flood:'Thiếu công suất hồ/thoát nước được nối hợp lệ và mô hình nguy cơ ngập trên địa hình dân cư thật.',
 rail:'Có rail.js và tests/rail.test.js cho module vận hành; chưa có provider chiến dịch cho mode/kind này trong mission-metrics/campaign.',
 tourism:'Thiếu du khách sử dụng điểm đến/phòng khách sạn thật, công suất, lưu trú và mục đích chuyến tourism.',
 upgrades:'upgradeQuote chặn tier 4/5 bằng điều kiện chưa triển khai; cần viễn thông, phúc lợi và nguồn dự phòng thật trước khi mở tier.',
 trade:'Thiếu gateway/cảng/cảng cạn hoạt động, đối tác và giao nhận ngoài vùng; không thể thay bằng chuyến tàu hàng nội vùng.',
 research:'Thiếu dự án nghiên cứu tiêu ngân sách, nhân lực, thời gian mô phỏng và event hoàn tất sau baseline.',
 aviation:'Có module aviation.js; metric chiến dịch chưa nhận passenger_trips air hoặc kind airport/cargo_terminal/heliport.'
};
function leafPaths(n,path='$'){
 if(n.all||n.any){const type=n.all?'all':'any';return n[type].flatMap((child,i)=>leafPaths(child,`${path}.${type}[${i}]`));}
 return [{node:n,path}];
}
function evaluatedLeaves(n){return n.children?n.children.flatMap(evaluatedLeaves):[n];}
export function providerConditionSupported(condition){return evaluateCondition(condition,()=>({valid:false})).supported;}

export function auditPrerequisites(missions=MISSIONS){
 const byId=new Map(missions.map(m=>[m.id,m])),visiting=new Set(),done=new Set(),cycles=[],missingIds=[],order=[];
 function visit(id,trail=[]){if(done.has(id))return;if(visiting.has(id)){cycles.push([...trail.slice(trail.indexOf(id)),id]);return;}const m=byId.get(id);if(!m)return;visiting.add(id);for(const p of m.prerequisiteClaims){if(!byId.has(p))missingIds.push({id,prerequisite:p});else visit(p,[...trail,id]);}visiting.delete(id);done.add(id);order.push(id);}
 for(const m of missions)visit(m.id);
 return {acyclic:cycles.length===0,cycles,missingIds,topologicalOrder:order};
}
export function auditProgression(missions=MISSIONS,levels=LEVELS){
 const stages=[],errors=[];let xp=0;
 for(let stage=1;stage<=100;stage++){
  const group=missions.filter(m=>m.campaignStage===stage),expected=['a','b','c'].map(x=>`bc26-main-${String(stage).padStart(3,'0')}-${x}`),ids=group.map(m=>m.id);
  const curve=levels[stage-1],expectedPrior=stage===1?[]:[`bc26-main-${String(stage-1).padStart(3,'0')}-c`];
  if(JSON.stringify(ids)!==JSON.stringify(expected))errors.push(`stage ${stage}: IDs/group size`);
  if(curve?.level!==stage||curve?.cumulativeXp!==xp)errors.push(`stage ${stage}: cumulative XP before stage`);
  for(const [i,m] of group.entries()){
   const prereqs=i<2?expectedPrior:[...expectedPrior,...expected.slice(0,2)];
   if(JSON.stringify(m.prerequisiteClaims)!==JSON.stringify(prereqs))errors.push(`${m.id}: A/B/C prerequisites`);
   if(m.minCityLevel!==stage||m.counterBaselineKey!==`bc26-stage-${String(stage).padStart(3,'0')}`)errors.push(`${m.id}: stage level/baseline`);
   if(!Number.isSafeInteger(m.rewards.xp)||m.rewards.xp<0)errors.push(`${m.id}: invalid XP`);
  }
  const gain=group.reduce((n,m)=>n+m.rewards.xp,0),next=stage<100?levels[stage].cumulativeXp:null;
  if(stage<100&&xp+gain!==next)errors.push(`stage ${stage}: rewards cannot reach next level exactly`);
  stages.push({stage,missionIds:ids,xpBefore:xp,rewardXp:gain,xpAfter:xp+gain,nextLevelXp:next,levelBefore:levelFromXp(xp),levelAfter:levelFromXp(xp+gain)});xp+=gain;
 }
 const first297Xp=missions.filter(m=>m.campaignStage<100).reduce((n,m)=>n+m.rewards.xp,0),epilogueXp=missions.filter(m=>m.campaignStage===100).reduce((n,m)=>n+m.rewards.xp,0);
 if(first297Xp!==CAP_XP||xpForLevel(100)!==CAP_XP||MAX_CITY_LEVEL!==100)errors.push('297 missions/cap XP/level 100 mismatch');
 if(missions.filter(m=>m.campaignStage===100).some(m=>m.rewardPolicyAtLevelCap!=='lifetime-xp-only'))errors.push('epilogue reward policy');
 return {passed:errors.length===0,errors,levelCount:levels.length,first297Xp,capXp:CAP_XP,levelAfter297:levelFromXp(first297Xp),epilogueXp,lifetimeXpAfter300:xp,levelAfter300:levelFromXp(xp),stages,limitation:'Chỉ chứng minh curve và prerequisite tĩnh. Không chứng minh chơi thật đủ tiền/công suất/thời gian/dân số để hoàn thành.'};
}
export function auditUnlocks(missions=MISSIONS){
 const requiredKinds=new Map(),requiredSystems=new Map();
 for(const m of missions)for(const n of leaves(m.condition)){
  const f=n.filters||{};
  if(f.kind){const rows=requiredKinds.get(f.kind)||[];rows.push({missionId:m.id,level:m.minCityLevel});requiredKinds.set(f.kind,rows);if(f.minTier>1)for(let t=2;t<=f.minTier;t++){const key=`${f.kind}:tier-${t}`,rows=requiredSystems.get(key)||[];rows.push({missionId:m.id,level:m.minCityLevel});requiredSystems.set(key,rows);}}
  if(f.mode&&f.mode!=='public_transit'&&n.metric==='active_routes'){const key=`route:${f.mode}`,rows=requiredSystems.get(key)||[];rows.push({missionId:m.id,level:m.minCityLevel});requiredSystems.set(key,rows);}
 }
 const kinds=[...requiredKinds].map(([kind,needs])=>{const mappings=(KIND_TOOLS[kind]||[]).filter(k=>CATALOG[k]),firstRequiredLevel=Math.min(...needs.map(n=>n.level)),declaredLatestUnlock=unlocks.buildingKindsLatestUnlock[kind];return {kind,name:contract.buildingKinds[kind],firstRequiredLevel,declaredLatestUnlock,deadlineValid:Number.isInteger(declaredLatestUnlock)&&declaredLatestUnlock<=firstRequiredLevel,mapped:mappings.length>0,catalogue:mappings.map(id=>({id,cost:CATALOG[id].cost,upkeep:CATALOG[id].upkeep??0,capacity:CATALOG[id].capacity??null,range:CATALOG[id].range??null})),missionIds:[...new Set(needs.map(n=>n.missionId))]};});
 const systemRows=[...requiredSystems].map(([key,needs])=>({key,firstRequiredLevel:Math.min(...needs.map(n=>n.level)),declaredLatestUnlock:unlocks.systemLatestUnlock[key]??null,declared:Number.isInteger(unlocks.systemLatestUnlock[key]),deadlineValid:unlocks.systemLatestUnlock[key]==null?null:unlocks.systemLatestUnlock[key]<=Math.min(...needs.map(n=>n.level)),missionIds:[...new Set(needs.map(n=>n.missionId))]}));
 return {passedDeclaredDeadlines:kinds.every(k=>k.deadlineValid)&&systemRows.every(k=>k.deadlineValid!==false),kinds,systems:systemRows,unmappedKinds:kinds.filter(k=>!k.mapped).map(k=>k.kind),undeclaredIntermediateTiers:systemRows.filter(k=>!k.declared&&k.key.includes(':tier-')).map(k=>k.key),notes:['unlocks.json mô tả cấp muộn nhất được mở, không chứng minh công trình thật tồn tại/vận hành.','placementQuote kiểm tra vị trí/địa hình/tiền; không đọc unlocks.json hoặc cityLevel. Catalogue hiện tại có thể xây sớm khi đủ tiền.','Tier trung gian thiếu khai báo được liệt kê để kiểm tra đường nâng cấp; không tự coi là vòng phụ thuộc.','Giá ở đây là giá catalogue; giá private blueprint/permit và chi phí thực tế cần playtest riêng.'],evidence:refs(['src/config/missions/unlocks.json','buildingKindsLatestUnlock'],['src/game/systems/placement.js','export function placementQuote'],['src/game/systems/upgrades.js','export function upgradeQuote'])};
}

function evidenceFor(n){
 const tests=new Set(['tests/campaign.test.js','tests/mission-audit.test.js']);
 if(['active_buildings','completed_buildings','upgrades_completed','population','power_coverage_pct','water_coverage_pct','power_reserve_pct','water_reserve_pct','sewage_treated_pct'].includes(n.metric))tests.add('tests/development-upgrades.test.js');
 if(['employment_pct','population','passenger_trips'].includes(n.metric))tests.add('tests/foundation.test.js');
 if(['active_routes','passenger_trips','public_transit_share_pct','commute_minutes'].includes(n.metric))tests.add('tests/bus-operations.test.js');
 if(['waste_collected_pct','completed_jobs','happiness_pct','operating_profit_per_game_minute','debt','treasury'].includes(n.metric))tests.add('tests/economy-services.test.js');
 if(n.metric==='school_access_pct'||n.filters?.service==='school_attendance'||['primary_school','secondary_school'].includes(n.filters?.kind))tests.add('tests/education.test.js');
 if(n.metric==='verified_save_count')tests.add('tests/campaign-database.test.js');
 return [...tests].filter(f=>existsSync(resolve(root,f)));
}
function relatedSource(n){
 const system=systemFor(n),pairs=[];
 if(system==='rail')pairs.push(['src/game/systems/rail.js','export function tickRail']);
 if(system==='aviation')pairs.push(['src/game/systems/aviation.js','export function tickAviation']);
 if(system==='education'||system==='health'||system==='emergency'||system==='welfare'||system==='amenities')pairs.push(['src/game/systems/services.js','export function updateLegacyServices'],['src/game/systems/utilities.js','export function analyzeUtilities']);
 if(system==='economy_logistics')pairs.push(['src/game/systems/firms.js','export function reconcileFirms'],['src/config/building-economy.js','export const PRIVATE_DESIGNS']);
 if(system==='upgrades')pairs.push(['src/game/systems/upgrades.js','export function upgradeQuote']);
 return pairs.length?refs(...pairs):[];
}
function notesFor(n){
 const notes=[];
 if(['active_buildings','power_coverage_pct','water_coverage_pct','sewage_treated_pct'].includes(n.metric))notes.push('Provider hiện có chỉ chứng minh trạng thái vận hành/cấp tiện ích theo code hiện tại; chưa chứng minh phân công nhân viên hoặc công suất dịch vụ theo từng người.');
 if(n.metric==='traffic_flow_pct')notes.push('Điểm traffic hiện tính từ tải chuyến đi dự báo trong analyzeTraffic, không phải độ trễ chuyến xe đã hoàn thành.');
 if(n.metric==='completed_jobs'&&n.filters?.service==='waste_collection')notes.push('Thu gom thật làm giảm garbage và phát event; hiện xử lý theo ô/chu kỳ dịch vụ, chưa chứng minh xe rác hoàn tất tuyến và công suất toàn depot.');
 if(n.metric==='waste_collected_pct')notes.push('Tỷ lệ chu kỳ thu gom có thể gồm backlog đã thu; tổng collected không chỉ theo cohort rác vừa phát sinh.');
 if(n.metric==='operating_profit_per_game_minute')notes.push('Cửa sổ lọc ledger categories legacy-tax-estimate, maintenance-and-interest, bus-fare; doanh thu vẫn có phần legacy ước tính theo mô phỏng.');
 if(n.metric==='employment_pct')notes.push('Mẫu số hiện lấy mọi cư dân 18–64; không có trạng thái muốn làm việc riêng.');
 if(n.metric==='school_access_pct'||n.filters?.service==='school_attendance'||['primary_school','secondary_school'].includes(n.filters?.kind))notes.push('Chỗ học giới hạn theo tuổi, đường, phạm vi, ngân sách và giáo viên tuyển thật. Lượt học cần học sinh và giáo viên tới trường, học 60 giây game; đây là lượt học/ngày, chưa phải tốt nghiệp.');
 if(n.filters?.kind==='university'||n.filters?.kind==='hospital')notes.push('Có công trình và tác động coverage; catalogue thừa nhận chưa có chỗ học/ghi danh/bằng cấp hoặc giường bệnh/hàng đợi riêng.');
 return notes;
}

export function buildMissionAudit({checks=[],generatedAt=new Date().toISOString()}={}){
 texts.clear();
 const empty=missionViews(createEmptyCity()),starter=missionViews(createCity()),emptyById=new Map(empty.map(v=>[v.id,v])),starterById=new Map(starter.map(v=>[v.id,v]));
 const rows=MISSIONS.map(m=>{
  const observations={empty:emptyById.get(m.id),starter:starterById.get(m.id)};
  const metrics=leafPaths(m.condition).map(({node:n,path})=>{
   const supported=metricSupport(n),system=systemFor(n),key=metricKey(n);
   const fixture={};for(const [label,view] of Object.entries(observations)){const value=evaluatedLeaves(view.condition).find(x=>x.type==='metric'&&metricKey(x)===key);if(!value)throw new Error(`Missing evaluated metric ${m.id} ${path}`);fixture[label]={valid:value.valid===true,value:Number.isFinite(value.value)?value.value:null,ok:value.ok===true,...(value.reason?{reason:value.reason}:{}),...(value.samples!=null?{samples:value.samples}:{})};}
   return {path,key,metric:n.metric,name:contract.metrics[n.metric]?.nameVi||n.metric,unit:contract.metrics[n.metric]?.unit||null,scope:n.scope,filters:n.filters||{},operator:n.operator,target:n.target,...(n.windowGameSeconds?{windowGameSeconds:n.windowGameSeconds,minSamples:n.minSamples}:{}),supported,system,provider:supported?refs(...(providers[n.metric]||[])):[],dispatchEvidence:commonRefs(),relatedCode:supported?[]:relatedSource(n),missing:supported?null:missingRequirements[system],limitations:supported?notesFor(n):[],testFiles:evidenceFor(n),fixture};
  });
  const supported=providerConditionSupported(m.condition),unavailable=metrics.filter(n=>!n.supported),e=observations.empty,s=observations.starter;
  return {id:m.id,name:m.title,level:m.minCityLevel,stage:m.campaignStage,stageTitle:m.stageTitle,description:m.description,condition:m.condition,holdGameSeconds:m.holdGameSeconds,prerequisiteClaims:m.prerequisiteClaims,counterBaselineKey:m.counterBaselineKey,rewards:m.rewards,providerSupported:supported,status:supported?'provider_present_gameplay_not_certified':'missing_provider',metrics,missingMetricKeys:[...new Set(unavailable.map(n=>n.key))],missingSystems:[...new Set(unavailable.map(n=>n.system))],fixtureEvidence:{empty:{locked:e.locked,available:e.available,conditionMet:e.condition.ok,ready:e.ready},starter:{locked:s.locked,available:s.available,conditionMet:s.condition.ok,ready:s.ready}},testResult:'Đã chạy đọc condition cho ID này trên empty/starter; không ép hoàn thành. Coverage/claim/hold được kiểm tra theo suite, không có playthrough riêng cho mọi ID.'};
 });
 const graph=auditPrerequisites(),byId=new Map(rows.map(m=>[m.id,m]));
 for(const id of graph.topologicalOrder){const m=byId.get(id);m.blockedPrerequisites=m.prerequisiteClaims.filter(p=>!byId.get(p)?.reachableWithCurrentProviders);m.reachableWithCurrentProviders=m.providerSupported&&m.blockedPrerequisites.length===0;}
 const unsupported=rows.filter(m=>!m.providerSupported),supported=rows.filter(m=>m.providerSupported),reachable=rows.filter(m=>m.reachableWithCurrentProviders),blockedByDependency=supported.filter(m=>!m.reachableWithCurrentProviders);
 const filterGroups=new Map(),systemGroups=new Map();
 for(const m of rows)for(const metric of m.metrics.filter(n=>!n.supported)){
  if(!filterGroups.has(metric.key))filterGroups.set(metric.key,{key:metric.key,metric:metric.metric,scope:metric.scope,filters:metric.filters,system:metric.system,reason:metric.missing,missionIds:[],blockedMissionIds:[],supportedAlternativeMissionIds:[]});const g=filterGroups.get(metric.key);if(!g.missionIds.includes(m.id))g.missionIds.push(m.id);const ids=m.providerSupported?g.supportedAlternativeMissionIds:g.blockedMissionIds;if(!ids.includes(m.id))ids.push(m.id);
  if(!systemGroups.has(metric.system))systemGroups.set(metric.system,{id:metric.system,...systems[metric.system],missionIds:[],metricKeys:[]});const sg=systemGroups.get(metric.system);if(!sg.missionIds.includes(m.id))sg.missionIds.push(m.id);if(!sg.metricKeys.includes(metric.key))sg.metricKeys.push(metric.key);
 }
 const repairs=[...systemGroups.values()].sort((a,b)=>a.order-b.order).map(g=>({...g,missionCount:g.missionIds.length,blockedMissionIds:g.missionIds.filter(id=>!byId.get(id).providerSupported),supportedAlternativeMissionIds:g.missionIds.filter(id=>byId.get(id).providerSupported),metricCount:g.metricKeys.length,firstStage:Math.min(...g.missionIds.map(id=>byId.get(id).stage)),requiredWork:missingRequirements[g.id]}));
 const probeErrors=rows.filter(m=>m.fixtureEvidence.empty.available!==m.providerSupported||m.fixtureEvidence.starter.available!==m.providerSupported).map(m=>m.id);
 const progression=auditProgression(),unlockAudit=auditUnlocks();
 const trackedFiles=new Set(['src/config/missions/missions-300.json','src/config/missions/metric-contract.json','src/config/missions/levels-1-100.json','src/config/missions/unlocks.json','src/config/catalog.js','src/config/building-economy.js','src/config/progression.js','src/game/core.js','src/game/systems/upgrades.js','scripts/audit-missions.mjs']);
 for(const m of rows)for(const n of m.metrics){for(const r of [...n.provider,...n.dispatchEvidence,...n.relatedCode])if(existsSync(resolve(root,r.file)))trackedFiles.add(r.file);for(const f of n.testFiles)trackedFiles.add(f);}
 return {schemaVersion:1,generatedAt,catalogueId:JSON.parse(read('src/config/missions/missions-300.json')).catalogueId,scope:'Static provider/condition/dependency/XP/unlock audit plus unmodified empty/starter read probes. Not a certification of all gameplay or live cloud deployment.',summary:{missionCount:rows.length,providerSupported:supported.length,missingProvider:unsupported.length,dependencyReachableWithProviders:reachable.length,providerSupportedButPrerequisiteBlocked:blockedByDependency.length,totalNotReachableWithProviders:rows.length-reachable.length,missingMetricFilterCount:filterGroups.size,firstMissingProvider:unsupported[0]?.id||null,firstCampaignBarrier:unsupported.filter(m=>m.stage===unsupported[0]?.stage).map(m=>m.id),earlierReport104196Matches:supported.length===104&&unsupported.length===196,fixtureAvailabilityAgreement:probeErrors.length===0,fixtureAvailabilityMismatches:probeErrors},blockedMissionIds:unsupported.map(m=>m.id),dependencyBlockedSupportedMissionIds:blockedByDependency.map(m=>m.id),checks,sourceManifest:[...trackedFiles].sort().map(file=>({file,sha256:createHash('sha256').update(read(file)).digest('hex')})),prerequisites:graph,progression,unlocks:unlockAudit,missingByMetricFilter:[...filterGroups.values()].map(g=>({...g,missionCount:g.missionIds.length})).sort((a,b)=>b.missionCount-a.missionCount||a.key.localeCompare(b.key)),repairOrder:repairs,limitations:['providerSupported nghĩa là evaluateCondition.supported và bộ lọc thực tế có dispatch; chưa có test chơi riêng đủ mục tiêu cho từng nhiệm vụ.','dependencyReachableWithProviders chỉ xét provider + dependency + curve; không chứng minh tiền, đất, dân, thời gian, nhân lực hoặc tier chơi được.','empty/starter là fixture do createCity tạo ra, chưa chọn địa lý Vietnam và chưa claim hết prerequisite. Các giá trị thiếu nhu cầu/baseline/window vẫn phải invalid.','Các metric có provider vẫn có hạn chế hợp đồng ghi ở từng leaf: nhân lực/công suất dịch vụ, thu gom không có chuyến xe và traffic từ tải dự báo.','Có module rail/aviation không có nghĩa mission kind/mode đã được nối. Audit lấy metricSupport/campaign làm nguồn tình trạng và ghi module liên quan.','Suite unit/database cục bộ không chứng minh tài khoản production, RLS trực tuyến, bản Vercel hoặc hiệu năng browser.'],missions:rows};
}

const esc=s=>String(s??'').replaceAll('|','\\|').replaceAll('\n',' ');
const filesText=rs=>rs.filter(r=>r.exists).map(r=>`\`${r.file}:${r.line}\` (${r.symbol})`).join('; ');
export function renderMarkdown(a){
 const s=a.summary,lines=['# Kiểm toán 300 nhiệm vụ Build City 26','',`Tạo lúc ${a.generatedAt}. Catalogue \`${a.catalogueId}\`.`, '',`Code khai báo **${s.providerSupported} nhiệm vụ có provider**, **${s.missingProvider} thiếu provider**. Kết quả 104/196 trước đây ${s.earlierReport104196Matches?'được xác nhận':'đã thay đổi'}. Đây không phải số nhiệm vụ đã playtest hoàn tất.`, '',`Theo prerequisite và provider, chỉ **${s.dependencyReachableWithProviders}** có đường mở tĩnh từ đầu; **${s.providerSupportedButPrerequisiteBlocked}** nhiệm vụ có provider bị chặn bởi prerequisite. Chặn đầu tiên: ${s.firstCampaignBarrier.map(x=>'`'+x+'`').join(', ')}.`, '', 'Chạy lại: `node scripts/audit-missions.mjs --verify`. JSON chứa condition đầy đủ, phép đọc từng metric ở hai fixture, file/hàm/dòng, danh sách ID bị chặn và SHA-256 nguồn.', '', '## Phạm vi chứng minh',''];
 lines.push(...a.limitations.map(x=>'- '+x),'','## Checks đã chạy','','| Check | Kết quả | Phạm vi |','| --- | --- | --- |');
 for(const c of a.checks)lines.push(`| ${esc(c.name)} | ${esc(c.passed?'PASS':c.timedOut?'TIMEOUT':'FAIL')} | ${esc(c.scope)}${c.failure?' · '+esc(c.failure):''} |`);
 if(!a.checks.length)lines.push('| Suite repo | Chưa chạy ở lần tạo này | Dùng --verify để có bằng chứng runtime |');
 lines.push(`| Đọc condition 300 ID | ${s.fixtureAvailabilityAgreement?'PASS':'FAIL'} | Empty/starter không sửa metric; so availability với evaluator |`,`| Prerequisite DAG | ${a.prerequisites.acyclic&&!a.prerequisites.missingIds.length?'PASS':'FAIL'} | Không vòng và không ID mồ côi |`,`| EXP 1–100 | ${a.progression.passed?'PASS':'FAIL'} | 297 nhiệm vụ: ${a.progression.first297Xp}; cấp ${a.progression.levelAfter297}; 3 cuối thêm ${a.progression.epilogueXp} lifetime XP; tối đa ${a.progression.levelAfter300} |`,`| Deadline unlock khai báo | ${a.unlocks.passedDeclaredDeadlines?'PASS':'FAIL'} | Deadline kind/route/tier; không chứng minh công trình thực |`,'','## Mở khóa, giá và giới hạn','',...a.unlocks.notes.map(n=>'- '+n),'',`Các kind chưa có mapping provider thật (${a.unlocks.unmappedKinds.length}): ${a.unlocks.unmappedKinds.map(k=>'`'+k+'`').join(', ')}.`, '',`Tier trung gian chưa khai báo riêng: ${a.unlocks.undeclaredIntermediateTiers.map(k=>'`'+k+'`').join(', ')||'không có'}.`,'','## Thứ tự sửa theo phụ thuộc','', '| Thứ tự | Hệ thống | Phụ thuộc | Mission liên quan | Bắt đầu cấp | Thiếu cụ thể |','| --- | --- | --- | --- | --- | --- |');
 for(const g of a.repairOrder)lines.push(`| ${g.order} | ${esc(g.name)} | ${g.dependsOn.join(', ')} | ${g.missionCount} | ${g.firstStage} | ${esc(g.requiredWork)} |`);
 lines.push('','Một mission có thể xuất hiện ở nhiều hệ thống; không cộng các cột này thành 196. Nhánh ANY chỉ cần một đường hợp lệ. Hệ thống foundation là tiên quyết chất lượng của mọi dịch vụ dù nhiều metric nền đang có provider.','','## Thiếu theo metric và bộ lọc','','| Metric/bộ lọc | ID đang chặn / nhánh ANY thay thế đã có provider | Hệ thống | ID liên quan |','| --- | --- | --- | --- |');
 for(const g of a.missingByMetricFilter)lines.push(`| \`${esc(g.metric)} ${esc(JSON.stringify(g.filters))}\` | ${g.blockedMissionIds.length} / ${g.supportedAlternativeMissionIds.length} | ${g.system} | ${g.missionIds.map(id=>'`'+id+'`').join(', ')} |`);
 lines.push('','## Đủ 300 mission ID','','| ID · tên | Cấp | Điều kiện / giữ | Provider / thiếu | Prerequisite | Kết quả kiểm tra |','| --- | --- | --- | --- | --- | --- |');
 for(const m of a.missions){const provider=m.metrics.map(n=>`${n.supported?'Có':'Thiếu'} \`${n.metric}\`${Object.keys(n.filters).length?' '+JSON.stringify(n.filters):''}: ${n.supported?filesText(n.provider):n.missing+' '+filesText(n.relatedCode)}`).join('<br>'),state=m.reachableWithCurrentProviders?'Có đường mở tĩnh':m.providerSupported?'Có provider; prerequisite chặn':'Thiếu provider';lines.push(`| \`${m.id}\` · ${esc(m.name)} | ${m.level} | ${esc(m.description)} | ${esc(provider)} | ${m.prerequisiteClaims.map(id=>'`'+id+'`').join(', ')||'Không'} | ${state}. Probe empty/starter: availability ${m.fixtureEvidence.empty.available}/${m.fixtureEvidence.starter.available}, condition ${m.fixtureEvidence.empty.conditionMet}/${m.fixtureEvidence.starter.conditionMet}; chưa playthrough ID này. |`);}
 lines.push('','Mọi mục tiêu/EXP/tiền/condition trong báo cáo được đọc nguyên từ catalogue. Audit không thay dữ liệu người chơi hoặc tự nhận thưởng.','');
 return lines.join('\n');
}

function runChecks(){
 const files=['tests/mission-audit.test.js','tests/education.test.js','tests/campaign.test.js','tests/campaign-database.test.js','tests/time-scale.test.js','tests/development-upgrades.test.js','tests/economy-services.test.js','tests/foundation.test.js','tests/bus-operations.test.js'];
 // One process per suite records attribution and failures without claiming that
 // a generic campaign assertion is a full per-mission gameplay test.
 return files.map(file=>{const timeoutMs=file==='tests/foundation.test.js'?300000:60000,r=spawnSync(process.execPath,['--test','--test-reporter=tap',file],{cwd:root,encoding:'utf8',timeout:timeoutMs,maxBuffer:2_000_000}),out=r.stdout||'',counts=Object.fromEntries([...out.matchAll(/# (tests|pass|fail|cancelled|skipped|todo) (\d+)/g)].map(x=>[x[1],Number(x[2])]));return {name:file,passed:r.status===0&&!r.error,exitCode:r.status,timedOut:r.error?.code==='ETIMEDOUT',timeoutMs,counts,scope:'Suite cục bộ, fixture/test logic; không chứng nhận playthrough 300 mục tiêu hoặc tài khoản live',...(r.status!==0?{failure:(r.error?.message||out+r.stderr).slice(-5000)}:{})};});
}
function main(){
 const verify=process.argv.includes('--verify'),checkOnly=process.argv.includes('--check'),checks=verify?runChecks():[],a=buildMissionAudit({checks});
 if(!checkOnly){writeFileSync(resolve(root,'docs/mission-audit-300.json'),JSON.stringify(a,null,2)+'\n');writeFileSync(resolve(root,'docs/mission-audit-300.md'),renderMarkdown(a));}
 console.log(JSON.stringify({summary:a.summary,progression:{passed:a.progression.passed,first297Xp:a.progression.first297Xp,levelAfter297:a.progression.levelAfter297,epilogueXp:a.progression.epilogueXp,levelAfter300:a.progression.levelAfter300},prerequisites:{acyclic:a.prerequisites.acyclic,missingIds:a.prerequisites.missingIds},declaredUnlockDeadlinesPassed:a.unlocks.passedDeclaredDeadlines,checks,output:checkOnly?null:['docs/mission-audit-300.json','docs/mission-audit-300.md']},null,2));
 if(checks.some(c=>!c.passed)||!a.progression.passed||!a.prerequisites.acyclic||a.prerequisites.missingIds.length||!a.summary.fixtureAvailabilityAgreement)process.exitCode=1;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)main();
