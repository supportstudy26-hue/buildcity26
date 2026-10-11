import {MobilityArtRegistry} from '../../config/mobility-art.js';
import {createPlayback,validatePlayback} from './clock.js';
import {createProgression,validateProgression} from './progression.js';
import { STEP_SECONDS, DAY_SECONDS, RULE_VERSION, CELL_METERS } from '../../config/simulation.js';
import {createTerrain,validateTerrain} from './terrain.js';
import { cashBalance } from './economy.js';
import {SCHOOL_PROFILES} from '../../config/education.js';
import {validateStudy} from './education.js';
const fields=['weatherMode','privateInvestment','educationVersion','mobilityVersion','playback','progression','world','ruleVersion','currency','currencyMigration','initialSeed','societySeed','clock','nextEntityId','nextEventId','graphVersion','households','citizens','firms','vehicles','contracts','commandSequence','commandReceipts','events','ledger'];
export function foundationSnapshot(s) { return structuredClone(Object.fromEntries(fields.filter(k=>s[k]!==undefined).map(k=>[k,s[k]]))); }
export function loadFoundation(s,raw,size) {
  if(raw.schemaVersion===3&&raw.ruleVersion==='foundation-3')raw={...raw,world:createTerrain(size,{flat:true}),progression:createProgression()};
  // Compatibility for the first terrain-4 checkpoint before missions were added.
  if(raw.schemaVersion===4&&raw.progression==null)raw={...raw,progression:createProgression()};
  if([3,4].includes(raw.schemaVersion)){
    if(!raw.clock||!Number.isSafeInteger(raw.clock.step)||raw.clock.seconds!==raw.clock.step*10||!['foundation-3','terrain-4'].includes(raw.ruleVersion))throw new Error('Đồng hồ cũ không hợp lệ.');
    raw={...raw,ruleVersion:RULE_VERSION,clock:{step:raw.clock.seconds,seconds:raw.clock.seconds},playback:createPlayback()};
  }
  if(raw.mobilityVersion!=null&&raw.mobilityVersion!==1)throw new Error('Phiên bản cư dân/phương tiện chưa được hỗ trợ.');
  if(raw.educationVersion!=null&&raw.educationVersion!==1)throw new Error('Phiên bản giáo dục chưa được hỗ trợ.');
  raw={...raw,mobilityVersion:raw.mobilityVersion??1};
  validatePlayback(raw.playback);
  validateTerrain(raw.world,size);
  validateProgression(raw.progression,raw.clock?.seconds);
  if(raw.ruleVersion!==RULE_VERSION||raw.currency!=='BC') throw new Error('Phiên bản mô phỏng hoặc đơn vị tiền không tương thích.');
  if(!raw.clock||!Number.isSafeInteger(raw.clock.step)||raw.clock.step<0||raw.clock.seconds!==raw.clock.step*STEP_SECONDS||Math.floor(raw.clock.seconds/DAY_SECONDS)!==s.day)throw new Error('Đồng hồ bản lưu không hợp lệ.');
  for(const k of ['nextEntityId','nextEventId','graphVersion','commandSequence','initialSeed','societySeed'])if(!Number.isSafeInteger(raw[k])||raw[k]<0)throw new Error('ID hoặc seed không hợp lệ.');
  for(const k of ['households','citizens','firms','vehicles','contracts','commandReceipts','events'])if(!Array.isArray(raw[k])||raw[k].length>20000)throw new Error('Danh sách thực thể không hợp lệ.');
  const ids=new Set();for(const kind of ['households','citizens','firms','vehicles','contracts'])for(const e of raw[kind]){if(!e||typeof e.id!=='string'||!e.id||ids.has(e.id))throw new Error('ID thực thể bị trùng.');ids.add(e.id);}
  const inMap=i=>Number.isInteger(i)&&i>=0&&i<size*size;
  const pos=p=>p&&[p.x,p.y,p.z].every(Number.isFinite)&&p.x>=0&&p.y>=0&&p.x<=size*CELL_METERS&&p.y<=size*CELL_METERS&&Math.abs(p.z)<10000;
  const citizens=new Map(raw.citizens.map(c=>[c.id,c])),households=new Map(raw.households.map(h=>[h.id,h]));
  const occupancy=new Map();
  for(const h of raw.households)if(!inMap(h.home)||!Array.isArray(h.members)||h.members.length<1||h.members.length>4||new Set(h.members).size!==h.members.length||!Number.isFinite(h.savings)||h.savings<0||h.members.some(id=>citizens.get(id)?.household!==h.id))throw new Error('Quan hệ hộ gia đình không hợp lệ.');
  for(const c of raw.citizens) {
    if(!inMap(c.home)||s.tiles[c.home].kind!=='residential'||!households.get(c.household)?.members.includes(c.id)||households.get(c.household).home!==c.home||!pos(c.position)||!inMap(c.goal)||!['home','sleeping','walking','in-vehicle','at-work','at-school','blocked','waiting-bus','on-bus'].includes(c.state)||typeof c.name!=='string'||c.name.length>80||!Number.isFinite(c.walkSpeed)||c.walkSpeed<.8||c.walkSpeed>1.8||!Number.isInteger(c.attendance)||c.attendance<0||!c.schedule||![c.schedule.depart,c.schedule.return].every(v=>Number.isInteger(v)&&v>=0&&v<DAY_SECONDS))throw new Error('Dữ liệu cư dân không hợp lệ.');
    validateStudy(c.study,c,raw,size,s.tiles);
    if(c.artId!=null&&MobilityArtRegistry[c.artId]?.kind!=='person'||c.travelled!=null&&(!Number.isFinite(c.travelled)||c.travelled<0))throw new Error('Mỹ thuật / quãng đường cư dân không hợp lệ.');
    if(c.busPlan){const p=c.busPlan;if(!s.busLines.some(l=>l.id===p.line)||![p.board,p.alight,p.destination].every(inMap)||p.board===p.alight||!['walk-to-stop','waiting','riding','walk-from-stop'].includes(p.stage)||typeof p.tripId!=='string'||p.tripId.length>100)throw new Error('Kế hoạch xe buýt không hợp lệ.');}
    if(c.state==='waiting-bus'&&c.busPlan?.stage!=='waiting'||c.state==='on-bus'&&(c.busPlan?.stage!=='riding'||c.journey))throw new Error('Trạng thái hành khách không khớp.');
    occupancy.set(c.home,(occupancy.get(c.home)||0)+1);
    const mt=c.missionTrip;if(mt!=null&&(!mt||typeof mt.id!=='string'||mt.id.length>100||!inMap(mt.origin)||!inMap(mt.destination)||!Number.isInteger(mt.startedAt)||mt.startedAt<0||mt.startedAt>raw.clock.seconds||!['walk','car','bus'].includes(mt.mode)||!['home','work','move-in','school'].includes(mt.purpose)))throw new Error('Chuyến nhiệm vụ không hợp lệ.');
    const j=c.journey;
    if(j&&(!['walk','car'].includes(j.mode)||!Array.isArray(j.path)||j.path.length<2||j.path.length>size*size+2||j.path.some(p=>!pos(p)||p.road!=null&&!inMap(p.road))||!Number.isInteger(j.segment)||j.segment<0||j.segment>=j.path.length-1||!Number.isFinite(j.distance)||j.distance<0||!Number.isFinite(j.speed)||j.speed<=0||j.speed>40||j.actualSpeed!=null&&(!Number.isFinite(j.actualSpeed)||j.actualSpeed<0||j.actualSpeed>j.speed)||!inMap(j.origin)||!inMap(j.destination)))throw new Error('Hành trình cư dân không hợp lệ.');
    if((c.state==='walking'||c.state==='in-vehicle')&&!j)throw new Error('Cư dân di chuyển thiếu hành trình.');
  }
  for(let i=0;i<s.tiles.length;i++)if((occupancy.get(i)||0)!==s.tiles[i].residents)throw new Error('Dân số không khớp danh sách cư dân.');
  for(const f of raw.firms)if(!inMap(f.home)||!['commercial','industrial',...Object.keys(SCHOOL_PROFILES)].includes(s.tiles[f.home].kind)||!Number.isSafeInteger(f.capacity)||f.capacity<0||!Array.isArray(f.employees)||new Set(f.employees).size!==f.employees.length||f.employees.length>f.capacity||f.employees.some(id=>citizens.get(id)?.work!==f.id)||SCHOOL_PROFILES[s.tiles[f.home].kind]&&!f.school)throw new Error('Quan hệ công việc không hợp lệ.');
  const firms=new Set(raw.firms.map(f=>f.id)),vehicles=new Map(raw.vehicles.map(v=>[v.id,v]));
  for(const c of raw.citizens)if(c.work!=null&&!firms.has(c.work)||c.vehicle!=null&&vehicles.get(c.vehicle)?.owner!==c.id)throw new Error('Cư dân tham chiếu thực thể không tồn tại.');
  for(const v of raw.vehicles)if(!pos(v.position)||!['car','bus'].includes(v.kind)||(v.kind==='car'?!citizens.has(v.owner):!s.busLines.some(l=>l.id===v.operator))||!Array.isArray(v.passengers)||v.passengers.length>(v.kind==='bus'?60:4)||v.passengers.some(id=>!citizens.has(id))||!['parked','travelling','blocked'].includes(v.state))throw new Error('Dữ liệu xe không hợp lệ.');
  const aboard=new Set();
  for(const v of raw.vehicles){
   if(new Set(v.passengers).size!==v.passengers.length||v.passengers.some(id=>aboard.has(id)))throw new Error('Hành khách bị trùng xe.');for(const id of v.passengers)aboard.add(id);
   if(v.kind==='bus'){
    if(v.passengers.some(id=>citizens.get(id)?.state!=='on-bus'||citizens.get(id)?.busPlan?.vehicleId!==v.id))throw new Error('Danh sách khách trên xe không khớp.');
    const j=v.trip;if(j&&(!Array.isArray(j.path)||j.path.length<2||j.path.length>size*size+2||j.path.some(p=>!pos(p)||p.road!=null&&!inMap(p.road))||!Number.isInteger(j.segment)||j.segment<0||j.segment>=j.path.length-1||!Number.isFinite(j.distance)||j.distance<0||!Number.isFinite(j.speed)||j.speed<=0||j.speed>40||j.actualSpeed!=null&&(!Number.isFinite(j.actualSpeed)||j.actualSpeed<0||j.actualSpeed>j.speed)||!inMap(j.origin)||!inMap(j.destination)))throw new Error('Hành trình xe buýt không hợp lệ.');
    if(v.busPhase!=null&&(!['depot','stop','driving'].includes(v.busPhase)||!Number.isInteger(v.stopIndex)||v.stopIndex< -1||v.stopIndex>=s.busLines.find(l=>l.id===v.operator).stops.length||!Number.isFinite(v.travelled)||v.travelled<0||v.busPhase==='stop'&&!Number.isFinite(v.stopUntil)))throw new Error('Trạng thái vận hành xe buýt không hợp lệ.');
   }
  }
  for(const c of raw.citizens)if(c.state==='on-bus'&&!vehicles.get(c.busPlan.vehicleId)?.passengers.includes(c.id))throw new Error('Hành khách không có xe.');
  for(const v of raw.vehicles)if(v.artId!=null&&(!MobilityArtRegistry[v.artId]||MobilityArtRegistry[v.artId].kind==='person'))throw new Error('Mỹ thuật xe không hợp lệ.');
  for(const c of raw.contracts)if(!inMap(c.tile)||c.kind!=='park'||!['building','completed','cancelled','failed'].includes(c.status)||![c.committed,c.paid,c.escrow,c.startedAt,c.duration,c.progress].every(Number.isFinite)||c.committed<0||c.paid<0||c.escrow<0||c.paid+c.escrow>c.committed||c.startedAt<0||c.duration<=0||c.progress<0||c.progress>1)throw new Error('Hợp đồng không hợp lệ.');
  if(!raw.ledger||!Number.isFinite(raw.ledger.openingCash)||!Array.isArray(raw.ledger.entries)||!Array.isArray(raw.ledger.receipts)||new Set(raw.ledger.receipts).size!==raw.ledger.receipts.length||raw.ledger.entries.some(e=>!e||typeof e.id!=='string'||!Number.isFinite(e.amount)||!raw.ledger.receipts.includes(e.id))||Math.abs(cashBalance({...s,ledger:raw.ledger})-s.money)>.01)throw new Error('Sổ tiền không đối chiếu được.');
  if(new Set(raw.commandReceipts.map(r=>r.id)).size!==raw.commandReceipts.length||raw.commandReceipts.some(r=>!r||typeof r.id!=='string'||!Number.isSafeInteger(r.sequence)||r.sequence<1||r.sequence>raw.commandSequence||typeof r.signature!=='string'||!r.result))throw new Error('Receipt command không hợp lệ.');
  Object.assign(s,structuredClone(Object.fromEntries(fields.map(k=>[k,raw[k]]))));
}
