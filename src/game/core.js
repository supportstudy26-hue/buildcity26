import {LANDMARKS} from '../config/landmarks.js';
import {ARRIVAL_BALANCE} from '../config/resident-arrivals.js';
import {ROAD_PROFILES,DIRECTION_VECTORS} from '../config/road-profiles.js';
import {isJunction} from './systems/junctions.js';
import {decodeCity} from '../services/city-codec.js';
import {placementQuote} from './systems/placement.js';
import {weatherState,setWeatherMode,WEATHER_MODES} from './systems/weather.js';
import {PRIVATE_DESIGNS,privateBuildPrice,residentCapacity,jobsCapacity,MAINTENANCE_FACTORS,capacityFactor} from '../config/building-economy.js';
import {materializeBuilding,materializePendingBuildings,updateDevelopment,validateDevelopment,validatePrivateInvestment} from './systems/development.js';
import {startUpgrade,updateUpgrades,validateUpgrade} from './systems/upgrades.js';
import {geographyBuildRule} from './geography/city.js';
import {updateProgression} from './systems/progression.js';
import { createTerrain } from './systems/terrain.js';
import { submitCommand } from './systems/commands.js';
import { analyzeUtilities } from './systems/utilities.js';
import { updateLegacyServices } from './systems/services.js';
import { analyzeTraffic, busRoute, route } from './systems/roads.js';
export { route, busRoute };
import { START_CASH_BC, NEW_CITY_CASH_BC, LEGACY_BC_FACTOR, ANNUAL_INTEREST, WATER_PER_PERSON, DAY_SECONDS } from '../config/simulation.js';
import { initializeFoundation, reconcileSociety } from './systems/foundation.js';
import { foundationSnapshot, loadFoundation } from './systems/save.js';
import { dailyFinance, recordCash } from './systems/economy.js';
import { calendar, clockStep, createClock, setPlayback } from './systems/clock.js';
import { updateCitizens } from './systems/citizens.js';
import { updateVehicles } from './systems/vehicles.js';
import {updateEducation,reconcileEducation} from './systems/education.js';
import { startConstruction, updateConstruction, cancelConstruction } from './systems/construction.js';
import { entityId, emit } from './systems/events.js';
// Pure game logic. No browser, auth or rendering dependencies.
export const SIZE = 64;
export const SAVE_VERSION = 6;
import { CATALOG, BUILDINGS, ZONES, ROADS } from '../config/catalog.js';
export { CATALOG };
import { initializeWorld, index, inside, clamp, neighbors, distance, isRoad, terrainAt } from './systems/world.js';
export { index, inside, clamp, neighbors, isRoad, terrainAt };
export function createCity({starter=true,world=null,name=null,startingCash=START_CASH_BC}={}){
  const s={schemaVersion:SAVE_VERSION,mapSize:SIZE,name:'Thành phố Bình Minh',money:startingCash,currency:'BC',currencyMigration:{from:5,factor:1},day:0,taxes:{residential:10,commercial:10,industrial:10},seed:26012026,milestones:[],busLines:[],loanBalance:0,budgets:{},tiles:Array.from({length:SIZE*SIZE},(_,i)=>({terrain:terrainAt(i%SIZE,Math.floor(i/SIZE)),kind:null,zone:null,level:0,residents:0,age:0,garbage:0,hazard:0,fire:0,crime:0,health:100,education:0}))};
  const set=(x,y,kind,residents=0)=>Object.assign(s.tiles[index(x,y)],{kind,zone:ZONES.includes(kind)?kind:null,level:1,residents,age:20});
  if(starter){
  for(let x=0;x<=23;x++)set(x,18,'road');
  for(let y=10;y<=25;y++){set(11,y,'road');set(18,y,'road');}
  for(let x=11;x<=23;x++){set(x,12,'road');set(x,24,'road');}
  for(let x=12;x<=17;x++){set(x,17,'residential',12);set(x,19,'residential',10);}
  for(let y=13;y<=16;y++)set(12,y,'residential',11);
  for(let x=19;x<=22;x++)set(x,17,'commercial');
  for(let x=19;x<=22;x++)set(x,23,'industrial');
  set(8,17,'power');set(9,17,'water');set(10,20,'clinic');set(10,14,'school');set(15,11,'park');set(14,23,'park');set(19,25,'waste');
  set(7,19,'sewage');
  }
  s.world=world?structuredClone(world):createTerrain(SIZE);
  if(name)s.name=name;
  if(world?.geography)world.geography.waterMask.forEach((v,i)=>s.tiles[i].terrain=v?'water':'grass');
  analyze(s);initializeFoundation(s,SIZE,random);return s;
}
export function createEmptyCity(options={}){const s=createCity({startingCash:NEW_CITY_CASH_BC,...options,starter:false});s.weatherMode='auto';return s;}
import { random } from './systems/rng.js';
export { random };
export function analyze(s){
  const {connected,services,roadAt,pop,jobs,homes,upkeep,powerNeed,waterNeed,power,water,sewage}=analyzeUtilities(s);
  let happySum=0,pollutionSum=0,occupied=0;
  const workforce=Math.floor(pop*.55);const employment=workforce?Math.min(1,jobs/workforce):1;
  // A tiny settlement should not lose the full satisfaction penalty as soon as
  // its second resident arrives. Job statistics remain unchanged.
  const employmentPenalty=(1-employment)*22*Math.min(1,pop/ARRIVAL_BALANCE.starterPopulation);
  const roadCount=s.tiles.filter(isRoad).length;
  const landscape=s.tiles.flatMap((a,n)=>LANDMARKS[a.kind]&&a.active?[{n,range:LANDMARKS[a.kind].range,amenity:LANDMARKS[a.kind].amenity}]:[]);
  s.network={connected,services,roadAt};
  s.network.busLines=(s.busLines||[]).map(line=>({...line,...busRoute(s,line.stops)}));
  const traffic=analyzeTraffic(s);
  s.tiles.forEach((t,i)=>{
    if(t.kind==='residential'){
      t.landscapeBonus=Math.min(6,Math.max(0,...landscape.filter(a=>distance(i,a.n)<=a.range).map(a=>a.amenity)));
      const h=clamp(72+t.landscapeBonus+Math.min(18,t.services.filter(k=>!['bus','waste','sewage'].includes(k)).length*5)+ (t.services.includes('waste')?4:-5)-t.pollution*.4-(t.garbage||0)*.1-(t.crime||0)*.15-(t.fire||0)*.3-(100-(t.health??100))*.12-employmentPenalty-(100-traffic)*.1-Math.max(0,s.taxes.residential-10)*2-(!t.connected?28:0)-(!t.power?25:0)-(!t.water?25:0),0,100);
      t.happiness=Math.round(h);happySum+=h*t.residents;pollutionSum+=t.pollution*t.residents;occupied+=t.residents;
    }
  });
  const happiness=Math.round(occupied?happySum/occupied:65);
  const commercialWorkers=s.network.trips.filter(t=>s.tiles[t.to].kind==='commercial').reduce((n,t)=>n+t.passengers,0);
  const industrialWorkers=s.network.trips.filter(t=>s.tiles[t.to].kind==='industrial').reduce((n,t)=>n+t.passengers,0);
  const busForecast=s.network.trips.reduce((n,t)=>n+(t.busPassengers||0),0);
  const busPassengers=(s.vehicles||[]).filter(v=>v.kind==='bus'&&v.boardedDay===s.day).reduce((n,v)=>n+(v.boardedToday||0),0);
  const taxIncome=(pop*8*s.taxes.residential/100+commercialWorkers*20*s.taxes.commercial/100+industrialWorkers*24*s.taxes.industrial/100)*LEGACY_BC_FACTOR;
  const transitCost=(s.busLines||[]).reduce((n,line)=>n+line.vehicles*60*LEGACY_BC_FACTOR*(s.budgets?.bus??100)/100,0);
  const expenses=Math.round((upkeep+pop*.04*LEGACY_BC_FACTOR+transitCost+(s.loanBalance||0)*ANNUAL_INTEREST*calendar(s.clock?.seconds??s.day*DAY_SECONDS).daysInMonth/calendar(s.clock?.seconds??s.day*DAY_SECONDS).daysInYear)*100)/100,income=Math.round((taxIncome+busPassengers*.7*calendar(s.clock?.seconds??s.day*DAY_SECONDS).daysInMonth)*100)/100;
  s.metrics={population:pop,jobs,workforce,homes,happiness,unemployment:Math.round((1-employment)*100),traffic,environment:Math.round(100-(occupied?pollutionSum/occupied:0)),power,powerNeed,water,waterNeed,sewage,sewageNeed:waterNeed,garbage:Math.round(s.tiles.reduce((n,t)=>n+(t.garbage||0),0)),busForecast,fires:s.tiles.filter(t=>t.kind&&(t.fire||0)>0).length,highCrime:s.tiles.filter(t=>t.kind==='residential'&&(t.crime||0)>40).length,busPassengers,transitCost,busLines:s.network.busLines.filter(l=>l.ok).length,congestedRoads:s.tiles.filter(t=>isRoad(t)&&t.trafficLoad>t.trafficCapacity).length,taxIncome,transitIncome:busPassengers*.7*calendar(s.clock?.seconds??s.day*DAY_SECONDS).daysInMonth,loanInterest:(s.loanBalance||0)*ANNUAL_INTEREST*calendar(s.clock?.seconds??s.day*DAY_SECONDS).daysInMonth/calendar(s.clock?.seconds??s.day*DAY_SECONDS).daysInYear,income,expenses,net:income-expenses,roadCount,demand:{residential:clamp(Math.round(20+jobs-workforce+(happiness-65)*2-(homes-pop)*.25),5,100),commercial:clamp(Math.round(35+pop*.25-jobs*.15-(s.taxes.commercial-10)*3),5,100),industrial:clamp(Math.round(30+workforce-jobs-(s.taxes.industrial-10)*3),5,100)}};
  return s.metrics;
}
export function addBusLine(s,name,stops,vehicles=2){
  if(!Number.isInteger(vehicles)||vehicles<1||vehicles>6)return {ok:false,message:'Mỗi tuyến dùng 1–6 xe.'};
  if(typeof name!=='string'||!name.trim()||name.length>36)return {ok:false,message:'Tên tuyến cần 1–36 ký tự.'};
  if((s.busLines||[]).length>=12)return {ok:false,message:'Thành phố có tối đa 12 tuyến.'};
  const valid=busRoute(s,stops);if(!valid.ok)return valid;
  const cost=(200+vehicles*1200)*LEGACY_BC_FACTOR;if(s.money<cost)return {ok:false,message:'Không đủ ngân sách để mua xe và mở tuyến.'};
  recordCash(s,`line-${s.commandSequence}-${s.nextEntityId++}`,'transit-purchase',-cost);s.busLines??=[];s.busLines.push({id:s.busLines.reduce((n,l)=>Math.max(n,l.id),0)+1,name:name.trim(),stops:[...stops],vehicles});analyze(s);reconcileSociety(s,SIZE,random);return {ok:true,cost};
}
export function borrow(s,amount){if(![500000,1000000,2000000].includes(amount)||(s.loanBalance||0)+amount>5000000)return {ok:false,message:'Hạn mức vay tối đa 5 tỷ ₫.'};s.loanBalance=(s.loanBalance||0)+amount;recordCash(s,`loan-${s.nextEntityId++}`,'loan-principal',amount);analyze(s);return {ok:true};}
export function repay(s,amount){if(!Number.isFinite(amount)||amount<=0||amount>(s.loanBalance||0)||amount>s.money)return {ok:false,message:'Không đủ tiền hoặc số tiền trả nợ chưa hợp lệ.'};s.loanBalance-=amount;recordCash(s,`repay-${s.nextEntityId++}`,'loan-repayment',-amount);analyze(s);return {ok:true};}
export function place(s,x,y,kind,designId=null){
  if(!inside(x,y)||!CATALOG[kind]||kind==='inspect')return {ok:false,message:'Chọn một ô trong bản đồ.'};
  if(designId!=null&&PRIVATE_DESIGNS[designId]?.kind!==kind)return {ok:false,message:'Mẫu thiết kế không thuộc phân khu đã chọn.'};
  const t=s.tiles[index(x,y)],quote=placementQuote(s,index(x,y),kind);if(!quote.ok)return quote;
  if(kind==='bulldoze'){
    const u=t.upgrade;if(u?.status==='building'){const released=Math.floor(u.price*(1-u.work/u.required))+u.reserve;if(u.payer==='city')recordCash(s,u.id+'-cancel','upgrade-cancel-refund',released,t.assetId);else{s.privateInvestment.available+=released;s.privateInvestment.projects.find(p=>p.id===u.id).price-=released;}}
    const refund=Math.floor((t.historicalCost||0)*.25);recordCash(s,`demolish-${s.nextEntityId++}`,'salvage',refund,t.assetId);Object.assign(t,{kind:null,zone:null,level:0,residents:0,age:0,garbage:0,hazard:0,fire:0,crime:0,health:100,education:0,assetId:null,historicalCost:0,development:null,upgrade:null,blueprint:null,roadDirection:null,junctionControl:null});s.graphVersion++;analyze(s);reconcileSociety(s,SIZE,random);return {ok:true,cost:-refund};
  }
  if(t.kind||t.zone){
    if(ROADS.includes(t.kind)&&ROADS.includes(kind)&&t.kind!==kind){
      const cost=quote.cost;
      recordCash(s,`upgrade-${s.nextEntityId++}`,'road-upgrade',-cost,t.assetId);t.historicalCost=(t.historicalCost||0)+cost;t.kind=kind;t.footprint={width:ROAD_PROFILES[kind].width,depth:20};if(ROAD_PROFILES[kind].oneWay)t.roadDirection??='east';else delete t.roadDirection;s.graphVersion++;analyze(s);return {ok:true,cost};
    }
    return {ok:false,message:'Ô này đã có công trình. Dùng phá dỡ để thay đổi.'};
  }
  if(ZONES.includes(kind)&&(s.privateInvestment?.available??20000000)<privateBuildPrice(kind,designId))return {ok:false,message:'Chủ đầu tư không đủ vốn cho mẫu nhà này.'};
  const cost=quote.cost;
  recordCash(s,`place-${s.nextEntityId++}`,'construction-instant',-cost);t.historicalCost=cost;
  if(ZONES.includes(kind)){t.zone=kind;t.age=0;if(designId)t.blueprint=designId;materializeBuilding(s,index(x,y));}else{t.kind=kind;t.level=1;t.assetId=entityId(s,'asset');t.footprint={width:ROAD_PROFILES[kind]?.width||14,depth:20};if(ROAD_PROFILES[kind]?.oneWay)t.roadDirection='east';}
  s.graphVersion++;analyze(s);reconcileSociety(s,SIZE,random);return {ok:true,cost};
}
export function tick(s){
  s.clock=createClock(s.day+1);return dailyUpdate(s);
}
function dailyUpdate(s){
  analyze(s);s.day=Math.floor(s.clock.seconds/DAY_SECONDS);dailyFinance(s);
  const m=s.metrics;
  updateLegacyServices(s);
  analyze(s);
  reconcileSociety(s,SIZE,random,{arriving:true});
  updateProgression(s,true);
  return s.metrics;
}
export function serialize(s){return {...foundationSnapshot(s),schemaVersion:SAVE_VERSION,mapSize:SIZE,name:s.name,money:s.money,day:s.day,taxes:{...s.taxes},seed:s.seed,milestones:[...s.milestones],loanBalance:s.loanBalance||0,budgets:{...s.budgets},busLines:(s.busLines||[]).map(l=>({id:l.id,name:l.name,stops:[...l.stops],vehicles:l.vehicles})),tiles:s.tiles.map(t=>({terrain:t.terrain,kind:t.kind,zone:t.zone,level:t.level,residents:t.residents,age:t.age,garbage:t.garbage||0,hazard:t.hazard||0,fire:t.fire||0,crime:t.crime||0,health:t.health??100,education:t.education||0,id:t.id,assetId:t.assetId??null,historicalCost:t.historicalCost||0,...(t.roadDirection?{roadDirection:t.roadDirection}:{}),...(t.junctionControl?{junctionControl:t.junctionControl}:{}),...(t.blueprint?{blueprint:t.blueprint}:{}),...(t.development?{development:structuredClone(t.development)}:{}),...(t.upgrade?{upgrade:structuredClone(t.upgrade)}:{}),footprint:{...t.footprint}}))};}
export function validateSave(raw){
  raw=decodeCity(raw);
  if(!raw||typeof raw!=='object'||![1,2,3,4,5,SAVE_VERSION].includes(raw.schemaVersion))throw new Error('Bản lưu không tương thích với Build City 26.');
  const sourceSize=raw.schemaVersion===1?38:raw.mapSize;
  if(![38,48,SIZE].includes(sourceSize)||!Array.isArray(raw.tiles)||raw.tiles.length!==sourceSize*sourceSize)throw new Error('Bản đồ trong bản lưu không hợp lệ.');
  if(typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>36)throw new Error('Tên thành phố không hợp lệ.');
  for(const k of ['money','day','seed'])if(!Number.isFinite(raw[k]))throw new Error('Thông số bản lưu không hợp lệ.');
  if(raw.day<0||!Number.isInteger(raw.day)||raw.day>1000000||Math.abs(raw.money)>1e12||raw.seed<0||raw.seed>4294967295)throw new Error('Thông số bản lưu vượt giới hạn.');
  if(!raw.taxes||ZONES.some(k=>!Number.isInteger(raw.taxes[k])||raw.taxes[k]<0||raw.taxes[k]>20))throw new Error('Mức thuế không hợp lệ.');
  if(!Array.isArray(raw.milestones)||raw.milestones.some(n=>![300,800,2000].includes(n)))throw new Error('Cột mốc không hợp lệ.');
  const sourceTiles=raw.tiles.map(t=>{
    if(!t||!['grass','water','sand'].includes(t.terrain)||!(t.kind===null||[...BUILDINGS,...ZONES,...ROADS].includes(t.kind))||!(t.zone===null||ZONES.includes(t.zone)))throw new Error('Có ô bản đồ không hợp lệ.');
    if(![t.level,t.residents,t.age].every(Number.isInteger)||t.level<0||t.level>5||t.age<0||t.age>1000001||t.residents<0||t.residents>360)throw new Error('Dữ liệu công trình không hợp lệ.');
    if(t.kind==='residential'&&(t.residents>residentCapacity(t)||t.zone!=='residential'))throw new Error('Dữ liệu dân cư không hợp lệ.');
    if(t.kind&&ZONES.includes(t.kind)&&t.zone!==t.kind)throw new Error('Phân khu không khớp công trình.');
    if(t.kind&&!ZONES.includes(t.kind)&&t.zone)throw new Error('Công trình không khớp phân khu.');
    if(t.kind&&t.level<1||t.kind!=='residential'&&t.residents!==0)throw new Error('Dữ liệu công trình không khớp.');
    if(t.terrain==='water'&&(t.zone||t.kind&&!ROADS.includes(t.kind)))throw new Error('Công trình trên sông không hợp lệ.');
    const garbage=t.garbage??0;if(!Number.isFinite(garbage)||garbage<0||garbage>100)throw new Error('Dữ liệu rác không hợp lệ.');
    const condition={hazard:t.hazard??0,fire:t.fire??0,crime:t.crime??0,health:t.health??100,education:t.education??0};
    if(Object.values(condition).some(n=>!Number.isFinite(n)||n<0||n>100))throw new Error('Tình trạng dịch vụ hoặc sự cố không hợp lệ.');
    if(t.historicalCost!=null&&(!Number.isFinite(t.historicalCost)||t.historicalCost<0))throw new Error('Nguyên giá tài sản không hợp lệ.');
    if(t.blueprint!=null&&PRIVATE_DESIGNS[t.blueprint]?.kind!==t.zone)throw new Error('Mẫu thiết kế ô đất không hợp lệ.');
    if(t.roadDirection!=null&&(!ROAD_PROFILES[t.kind]?.oneWay||!DIRECTION_VECTORS[t.roadDirection]))throw new Error('Hướng đường một chiều không hợp lệ.');
    if(t.junctionControl!=null&&(!ROADS.includes(t.kind)||!['signal','yield','off'].includes(t.junctionControl)))throw new Error('Điều khiển giao lộ không hợp lệ.');
    const development=validateDevelopment(t.development,t.zone),upgrade=validateUpgrade(t.upgrade,t.level);
    return {...(development?{development}:{}),...(upgrade?{upgrade}:{}),terrain:t.terrain,kind:t.kind,zone:t.zone,level:t.level,residents:t.residents,age:t.age,garbage,...condition,id:t.id,assetId:t.assetId??null,historicalCost:t.historicalCost||0,...(t.roadDirection?{roadDirection:t.roadDirection}:{}),...(t.junctionControl?{junctionControl:t.junctionControl}:{}),...(t.blueprint?{blueprint:t.blueprint}:{}),...(t.development?{development:structuredClone(t.development)}:{}),...(t.upgrade?{upgrade:structuredClone(t.upgrade)}:{}),footprint:t.footprint||{width:20,depth:20}};
  });
  validatePrivateInvestment(raw.privateInvestment,sourceTiles);if(raw.weatherMode!=null&&!WEATHER_MODES.includes(raw.weatherMode))throw new Error('Chế độ thời tiết không hợp lệ.');
  const loanBalance=raw.loanBalance??0,budgets=raw.budgets??{};
  if(!Number.isFinite(loanBalance)||loanBalance<0||loanBalance>(raw.schemaVersion<3?50000:5000000)||!budgets||typeof budgets!=='object'||Array.isArray(budgets)||Object.entries(budgets).some(([kind,value])=>!BUILDINGS.includes(kind)||!Number.isInteger(value)||value<50||value>150))throw new Error('Ngân sách dịch vụ hoặc khoản vay không hợp lệ.');
  const busLines=raw.busLines??[];
  if(!Array.isArray(busLines)||busLines.length>12||new Set(busLines.map(l=>l?.id)).size!==busLines.length||busLines.some(l=>!l||!Number.isSafeInteger(l.id)||l.id<1||typeof l.name!=='string'||!l.name.trim()||l.name.length>36||!Number.isInteger(l.vehicles)||l.vehicles<1||l.vehicles>6||!Array.isArray(l.stops)||l.stops.length<2||l.stops.length>8||new Set(l.stops).size!==l.stops.length||l.stops.some(i=>!Number.isInteger(i)||i<0||i>=sourceSize*sourceSize)))throw new Error('Tuyến xe buýt không hợp lệ.');
  const migratedLines=busLines.map(l=>({...l,stops:l.stops.map(i=>index(i%sourceSize,Math.floor(i/sourceSize)))}));
  const tiles=Array.from({length:SIZE*SIZE},(_,i)=>{const x=i%SIZE,y=Math.floor(i/SIZE);return x<sourceSize&&y<sourceSize?sourceTiles[y*sourceSize+x]:{terrain:terrainAt(x,y),kind:null,zone:null,level:0,residents:0,age:0,garbage:0,hazard:0,fire:0,crime:0,health:100,education:0};});
  const s={schemaVersion:SAVE_VERSION,mapSize:SIZE,name:raw.name.trim(),money:raw.money,day:raw.day,seed:raw.seed>>>0,taxes:{...raw.taxes},milestones:[...new Set(raw.milestones)],busLines:migratedLines,loanBalance,budgets:{...budgets},tiles};
  if(raw.schemaVersion<3){s.money*=LEGACY_BC_FACTOR;s.loanBalance*=LEGACY_BC_FACTOR;s.world=createTerrain(SIZE,{flat:true});s.currency='BC';s.currencyMigration={from:raw.schemaVersion,factor:LEGACY_BC_FACTOR};analyze(s);initializeFoundation(s,SIZE,random);}
  else {loadFoundation(s,raw,SIZE);if(s.world.geography&&s.tiles.some((t,i)=>(t.terrain==='water')!==!!s.world.geography.waterMask[i]))throw new Error('Mặt nước không khớp nguồn địa lý của bản lưu.');initializeWorldCompatibility(s);analyze(s);}
  const instantHomes=materializePendingBuildings(s),instantParks=updateConstruction(s,true);
  if(instantHomes||instantParks){if(instantParks)s.graphVersion++;analyze(s);reconcileSociety(s,SIZE,random);}
  return s;
}

// Stable simulation step. Renderer never mutates the world.
export function prepareEducation(s){
  if(s.educationVersion===1)return false;
  reconcileSociety(s,SIZE,random);return true;
}
export function stepSimulation(s){
  prepareEducation(s);
  const previous=s.day,weatherWindow=weatherState(s).window,c=clockStep(s);if(weatherState(s).window!==weatherWindow)analyze(s);
  if(c.day!==previous)dailyUpdate(s);
  if(updateConstruction(s)){s.graphVersion++;analyze(s);reconcileSociety(s,SIZE,random);updateProgression(s,true);}
  if([updateDevelopment(s),updateUpgrades(s)].some(Boolean)){s.graphVersion++;analyze(s);reconcileSociety(s,SIZE,random,{arriving:true});updateProgression(s,true);}
  reconcileEducation(s);updateCitizens(s,c,route,SIZE);updateVehicles(s);updateEducation(s,emit);updateProgression(s);
  return s.clock.seconds;
}
function initializeWorldCompatibility(s){initializeWorld(s,SIZE);}
// Validated, sequenced command boundary shared by UI and future server replay.
export function executeCommand(s,command){
  return submitCommand(s,command,command=>{
  const p=command.payload;let result;
  switch(command.type){
    case 'playback':result=setPlayback(s,p);break;
    case 'place':result=place(s,p.x,p.y,p.kind,p.designId);break;
    case 'road-direction':{const t=s.tiles[p.tile];result=Number.isInteger(p.tile)&&ROAD_PROFILES[t?.kind]?.oneWay&&DIRECTION_VECTORS[p.direction]?(t.roadDirection=p.direction,s.graphVersion++,analyze(s),{ok:true}):{ok:false,message:'Chọn đoạn đường một chiều và hướng hợp lệ.'};break;}
    case 'junction-control':result=Number.isInteger(p.tile)&&isJunction(s,p.tile)&&['signal','yield','off'].includes(p.mode)?(s.tiles[p.tile].junctionControl=p.mode,s.graphVersion++,analyze(s),{ok:true}):{ok:false,message:'Chọn giao lộ đường bộ có ít nhất ba nhánh.'};break;
    case 'weather':result=setWeatherMode(s,p.mode);if(result.ok)analyze(s);break;
    case 'upgrade-building':result=Number.isInteger(p.tile)&&p.tile>=0&&p.tile<s.tiles.length?startUpgrade(s,p.tile,p.payer):{ok:false,message:'Ô đất không hợp lệ.'};break;
    case 'construct':{const check=inside(p.x,p.y)?geographyBuildRule(s,index(p.x,p.y),p.kind):{ok:false,message:'Ô đất nằm ngoài bản đồ.'};if(!check.ok){result=check;break;}result=CATALOG[p.kind]?.group==='parks'&&inside(p.x,p.y)&&!s.tiles[index(p.x,p.y)].kind&&!s.tiles[index(p.x,p.y)].zone&&s.tiles[index(p.x,p.y)].terrain!=='water'?startConstruction(s,index(p.x,p.y),p.kind,Math.ceil(CATALOG[p.kind].cost*check.factor),900/DAY_SECONDS,true):{ok:false,message:'Chọn công viên trên ô đất trống.'};if(result.ok){s.graphVersion++;analyze(s);reconcileSociety(s,SIZE,random);updateProgression(s,true);}break;}
    case 'cancel-construction':result=cancelConstruction(s,p.id);break;
    case 'rename':result=typeof p.name==='string'&&p.name.trim().length>=1&&p.name.trim().length<=36?(s.name=p.name.trim(),{ok:true}):{ok:false,message:'Tên thành phố cần 1–36 ký tự.'};break;
    case 'tax':result=ZONES.includes(p.kind)&&Number.isInteger(p.value)&&p.value>=0&&p.value<=20?(s.taxes[p.kind]=p.value,analyze(s),{ok:true}):{ok:false,message:'Thuế không hợp lệ.'};break;
    case 'fund':result=BUILDINGS.includes(p.kind)&&Number.isInteger(p.value)&&p.value>=50&&p.value<=150?(s.budgets[p.kind]=p.value,analyze(s),reconcileSociety(s,SIZE,random),{ok:true}):{ok:false,message:'Ngân sách không hợp lệ.'};break;
    case 'borrow':result=borrow(s,p.amount);break;
    case 'repay':result=repay(s,p.amount);break;
    case 'bus-line':result=addBusLine(s,p.name,p.stops,p.vehicles);break;
    case 'remove-bus-line':result=s.busLines.some(l=>l.id===p.id)?(s.busLines=s.busLines.filter(l=>l.id!==p.id),analyze(s),reconcileSociety(s,SIZE,random),{ok:true}):{ok:false,message:'Tuyến không tồn tại.'};break;
    default:return {ok:false,message:'Loại command chưa được hỗ trợ.'};
  }
  if(result.ok){initializeWorldCompatibility(s);updateProgression(s,true);}
  return result;
  });
}
