import {icon} from '../icons.js';
import {CATALOG} from '../config/catalog.js';
import {PRIVATE_DESIGNS} from '../config/building-economy.js';
import {formatMoney} from '../config/money.js';
import {MobilityArtRegistry} from '../config/mobility-art.js';
import {SCHOOL_PROFILES,PUPILS_PER_TEACHER} from '../config/education.js';
import {HEALTHCARE_PROFILES} from '../config/healthcare.js';
import {MUNICIPAL_PROFILES} from '../config/municipal-jobs.js';
import {GOODS,logisticsKind,FREIGHT_CAPACITY} from '../config/logistics.js';
import {LEISURE_PROFILES} from '../config/leisure.js';
import {educationSnapshot,reconcileEducation,schoolSnapshot} from '../game/systems/education.js';
import {healthcareSnapshot,healthcareFacilitySnapshot} from '../game/systems/healthcare.js';
import {municipalSnapshot,municipalFacilitySnapshot,municipalActors} from '../game/systems/municipal-jobs.js';
import {logisticsSnapshot,logisticsFacilitySnapshot,freightActors} from '../game/systems/logistics.js';
import {leisureSnapshot,leisureFacilitySnapshot} from '../game/systems/leisure.js';

const LIMIT=30;
const MODES=Object.freeze({education:'Giáo dục',health:'Y tế',municipal:'Công vụ',logistics:'Hàng hóa',leisure:'Công viên'});
const SERVICES=Object.freeze({firefighting:'Dập cháy',fire_inspection:'Kiểm tra phòng cháy',security_patrol:'Tuần tra',waste_collection:'Thu gom rác'});
const STATES=Object.freeze({idle:'Sẵn sàng tại trạm',queued:'Chờ điều phối',outbound:'Đang đến nơi',travelling:'Đang di chuyển',servicing:'Đang làm nhiệm vụ',returning:'Đang trở về',blocked:'Chờ đường / nơi nhận',refilling:'Đang bổ sung vật tư',completed:'Đã hoàn thành',cancelled:'Đã hủy',requesting:'Chờ được tiếp nhận',waiting:'Chờ giường',treatment:'Đang điều trị',visiting:'Đang sử dụng công viên','at-work':'Đang làm việc','at-school':'Đang học','at-clinic':'Đang tại cơ sở y tế','at-park':'Đang tại công viên',home:'Ở nhà',sleeping:'Đang ngủ','in-vehicle':'Đang trên xe'});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number.isFinite(v)?v.toLocaleString('vi-VN',{maximumFractionDigits:1}):'—';
const pct=v=>Number.isFinite(v)?n(v)+'%':'Chưa có mẫu';
const state=v=>STATES[v]||'Đang xử lý';
const sum=(rows,key)=>rows.reduce((a,r)=>a+(Number.isFinite(r[key])?r[key]:0),0);
const detail=(label,value)=>`<div><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
const details=rows=>`<div class="detail-list">${rows.map(([label,value])=>detail(label,value)).join('')}</div>`;
const btn=(attr,id,label,primary=false)=>`<button type="button" class="action${primary?' primary':''}" data-operations-${attr}="${esc(id)}">${esc(label)}</button>`;
const empty=text=>`<p class="credit">${esc(text)}</p>`;
const status=reason=>`<p class="badge${reason?' warn':''}">${esc(reason||'Đang hoạt động')}</p>`;
const limited=(rows,label,render)=>`${rows.length?rows.slice(0,LIMIT).map(render).join(''):empty('Chưa có '+label+'.')}${rows.length>LIMIT?empty(`Hiển thị ${LIMIT}/${n(rows.length)} ${label}. Số tổng bên trên bao gồm toàn bộ.`):''}`;
const tileLabel=(s,tile)=>Number.isInteger(tile)&&s.tiles[tile]?`${tile%s.mapSize+1}, ${Math.floor(tile/s.mapSize)+1}`:'Ngoài vùng';
const tileName=(s,tile)=>{const t=s.tiles[tile];return t?(PRIVATE_DESIGNS[t.development?.designId]?.name||CATALOG[t.kind]?.name||'Ô đất'):'Cổng ngoài vùng';};
const tileButton=(s,tile,label=null)=>Number.isInteger(tile)&&s.tiles[tile]?btn('tile',tile,label||`${tileName(s,tile)} · ô ${tileLabel(s,tile)}`):esc('Cổng ngoài vùng');
const buildChoices=kinds=>`<div class="hub-grid">${kinds.map(kind=>CATALOG[kind]?btn('build',kind,`${CATALOG[kind].name} · ${formatMoney(CATALOG[kind].cost)}`):'').join('')}</div>`;
function peopleList(s,people,title){
 return `<details class="hub-advanced"><summary>${esc(title)} · ${n(people.length)}</summary><div class="resident-list">${limited(people,'cư dân',c=>btn('person',c.id,`${c.nameVi||c.name||c.id} · ${state(c.state)}`))}</div></details>`;
}
function peopleAt(s,ids){const set=new Set(ids);return s.citizens.filter(c=>set.has(c.id));}
function facilityCard(s,row,body,glyph,compact=false){
 const reason=row.reason||(SCHOOL_PROFILES[row.kind]&&!row.present?'Giáo viên chưa có mặt':row.capacity===0?'Chưa có năng lực phục vụ':row.active===false?'Công trình chưa hoạt động':'');
 return `<article class="hub-section"><h3>${compact?'Vận hành':icon(glyph,20)+' '+esc(tileName(s,row.tile))}</h3>${status(reason)}${body}<div class="modal-actions">${compact?'':btn('tile',row.tile,'Đến công trình')}${compact?btn('mode',modeFor(s.tiles[row.tile]),'Xem hệ thống'):''}</div></article>`;
}
function modeFor(t){return SCHOOL_PROFILES[t?.kind]?'education':HEALTHCARE_PROFILES[t?.kind]?'health':MUNICIPAL_PROFILES[t?.kind]?'municipal':logisticsKind(t)?'logistics':LEISURE_PROFILES[t?.kind]?'leisure':'education';}
function schoolDetails(r){return details([['Giáo viên có mặt / đã tuyển',`${n(r.present)} / ${n(r.staff.length)}`],['Vị trí giáo viên',n(r.posts)],['Chỗ học thiết kế',n(r.designSeats)],['Chỗ có giáo viên hiện diện',n(Math.min(r.capacity,r.present*PUPILS_PER_TEACHER))],['Đã ghi danh / đang học',`${n(r.pupils.length)} / ${n(r.inClass)}`],['Hoàn thành buổi học hôm nay',n(r.today)]]);}
function healthDetails(r){return details([['Nhân viên có mặt / đã tuyển',`${n(r.present)} / ${n(r.staff.length)}`],['Vị trí nhân viên',n(r.posts)],['Giường thiết kế / có ngân sách',`${n(r.beds)} / ${n(r.fundedBeds)}`],['Giường hoạt động / đang sử dụng',`${n(r.capacity)} / ${n(r.occupied)}`],['Giường trống / chờ giường',`${n(r.freeBeds)} / ${n(r.waiting)}`],['Đang tới / sức chứa hàng chờ',`${n(r.travelling)} / ${n(r.queueCapacity)}`]]);}
function municipalDetails(r){return details([['Nhân viên có mặt / đã tuyển',`${n(r.present)} / ${n(r.staff.length)}`],['Vị trí / đội tối thiểu mỗi xe',`${n(r.posts)} / ${n(r.crew)}`],['Xe đang làm việc / tổng xe',`${n(r.activeVehicles)} / ${n(r.vehicles)}`],['Yêu cầu chờ / đã hoàn thành',`${n(r.queue)} / ${n(r.completed)}`],['Năng lực đội xe',`${n(r.capacity)} ${r.service==='waste_collection'?'đơn vị rác':r.service==='firefighting'?'đơn vị nước':'xe tuần tra'}`],...(r.inspection?[['Kiểm tra phòng cháy',`${n(r.inspection.duration)} giây game · ${formatMoney(r.inspection.cost)} / lần`],['Kiểm tra đã hoàn thành',n(r.inspection.completed)]]:[])]);}
function stockDetails(stock){return details(Object.entries(GOODS).map(([id,g])=>[g.name,`${n(stock[id])} thùng`]));}
function recipeDetails(r){if(!r.recipe)return '';const goods=parts=>Object.entries(parts).map(([id,qty])=>`${n(qty)} ${GOODS[id].name.toLowerCase()}`).join(' + ');return `<p>${esc(`${goods(r.recipe.input)||'Thu hoạch tại nông trại'} → ${goods(r.recipe.output)}. ${r.recipe.seconds} giây game / mẻ; vật tư ${formatMoney(r.recipe.cost)}.`)}</p>${details([['Tiến độ mẻ',`${n(r.progress)} / ${n(r.recipe.seconds)} giây game`],['Mẻ đã hoàn thành',n(r.cycles)]])}`;}
function logisticsDetails(r){return details([['Nhân viên hiện diện',n(r.staffPresent)],['Kho đang dùng / sức chứa',`${n(r.used)} / ${n(r.capacity)} thùng`],['Đơn đang nhập / xuất',`${n(r.incoming.length)} / ${n(r.outgoing.length)}`],['Doanh số chủ cửa hàng',formatMoney(r.sales)]])+stockDetails(r.stock)+recipeDetails(r);}
function leisureDetails(r){return details([['Khách có mặt / sức chứa',`${n(r.present)} / ${n(r.capacity)}`],['Đang tới / đặt chỗ',`${n(r.travelling)} / ${n(r.reserved)}`],['Lượt sử dụng đã hoàn thành',n(r.completed)],['Cây khỏe / cây trồng',`${n(r.healthyTrees)} / ${n(r.trees.length)}`]]);}

function facilityList(s,rows,render,glyph){return `<h3>Cơ sở và năng lực thực tế</h3><div class="hub-grid">${limited(rows,'cơ sở',r=>facilityCard(s,r,render(r),glyph))}</div>`;}
function educationMarkup(s){
 const x=educationSnapshot(s),ctx=reconcileEducation(s),rows=ctx.rows.map(r=>schoolSnapshot(s,r.tile));
 return details([['Trẻ trong độ tuổi / đã ghi danh',`${n(x.eligible)} / ${n(x.assigned)}`],['Tiếp cận chỗ học',pct(x.accessPct)],['Trường / giáo viên hiện diện',`${n(x.schools)} / ${n(sum(rows,'present'))}`],['Đang học / hoàn thành hôm nay',`${n(sum(rows,'inClass'))} / ${n(sum(rows,'today'))}`]])+
 `<p>Học ngày thường 08:00–14:00. Cần chỗ học, đường đi và giáo viên có mặt; mỗi lượt ghi nhận sau 60 giây game học thật.</p>`+buildChoices(['school','secondarySchool'])+facilityList(s,rows,schoolDetails,'education')+
 peopleList(s,ctx.pupils.filter(c=>c.study?.tile==null),'Trẻ chưa được phân chỗ học');
}
function healthMarkup(s){
 const x=healthcareSnapshot(s);return details([['Cơ sở / nhân viên hiện diện',`${n(x.facilities)} / ${n(x.present)}`],['Tiếp cận y tế',pct(x.accessPct)],['Giường hoạt động / đang điều trị',`${n(x.capacity)} / ${n(x.occupied)}`],['Chờ giường / đang tới',`${n(x.waiting)} / ${n(x.travelling)}`],['Chờ được tiếp nhận',n(x.requesting)],['Lượt khám hoàn thành',n(x.completed)]])+buildChoices(['clinic','hospital'])+facilityList(s,x.rows,healthDetails,'health')+
 peopleList(s,s.citizens.filter(c=>['requesting','waiting','treatment'].includes(c.care?.phase)),'Người đang cần chăm sóc');
}
function vehicleMarkup(s,v){
 const a=MobilityArtRegistry[v.artId],freight=v.kind==='freight',quantity=freight?(v.cargo?.quantity??v.quantity):v.cargo;
 const payload=freight?`${n(quantity)} / ${FREIGHT_CAPACITY} thùng ${GOODS[v.cargo?.goods??v.goods]?.name||''}`:v.artId==='pv-garbage-truck'?`${n(quantity)} đơn vị rác`:v.artId==='pv-fire-engine'?`${n(v.water)} đơn vị nước`:`${n(v.crew?.length||0)} nhân viên`;
 return `<article class="hub-section"><h3>${esc(a?.nameVi||'Phương tiện công vụ')}</h3>${details([['Trạng thái',state(v.state)],['Tải / vật tư',payload],['Vận tốc',`${n((v.speed||0)*3.6)} km/h`],['Đích',tileLabel(s,v.goal??v.journey?.destination)]])}${v.waitReason||v.reason?status(v.waitReason||v.reason):''}<div class="modal-actions">${freight||v.jobId?btn('track',v.id,'Theo dõi xe')+tileButton(s,v.goal??v.journey?.destination,'Đến nơi nhận'):tileButton(s,v.depotTile,'Đến trạm')}</div></article>`;
}
/** Runtime positions and paths come from the service simulation, never from a
 * decorative catalogue model. Shared IDs keep selection/renderer tracking stable. */
export function serviceActors(s){return [...municipalActors(s),...freightActors(s)];}
function fleetMarkup(s,at=null){
 const municipal=(s.municipal?.depots||[]).filter(d=>at==null||d.tile===at).flatMap(d=>d.fleet.map(v=>({...v,depotTile:d.tile}))),freight=freightActors(s).filter(v=>at==null||v.journey?.destination===at||s.logistics?.orders.find(o=>o.id===v.orderId)?.origin===at),rows=[...municipal,...freight];
 return `<details class="hub-advanced"><summary>Đội xe công vụ & hàng hóa · ${n(rows.length)} xe</summary><div class="hub-grid">${limited(rows,'xe',v=>vehicleMarkup(s,v))}</div></details>`;
}
function municipalMarkup(s){
 const x=municipalSnapshot(s);return details([['Trạm / nhân viên hiện diện',`${n(x.facilities.length)} / ${n(sum(x.facilities,'present'))}`],['Chờ / đang làm nhiệm vụ',`${n(x.queue)} / ${n(x.active)}`],['Nhiệm vụ đã hoàn thành',n(x.completed)],['Rác thu gom / phát sinh',`${n(x.waste.collected)} / ${n(x.waste.generated)} đơn vị`],['Tỷ lệ thu gom thực',pct(x.waste.collectedPct)]])+
 `<div class="detail-list">${Object.entries(x.services).map(([key,v])=>detail(SERVICES[key]||key,`${n(v.queued)} chờ · ${n(v.active)} đang làm · ${n(v.completed)} hoàn thành`)).join('')}</div>`+buildChoices(['fire','police','waste'])+facilityList(s,x.facilities,municipalDetails,'services')+
 `<h3>Yêu cầu đang xử lý</h3><div class="resident-list">${limited(s.municipal.jobs,'yêu cầu',j=>`<article>${tileButton(s,j.target,`${SERVICES[j.service]||'Công vụ'} · ${state(j.status)}`)}${empty(j.reason||'Đợi đội và tuyến đường phù hợp.')}</article>`)}</div>`+fleetMarkup(s);
}
function orderMarkup(s,o){return `<article class="hub-section"><h3>${esc(GOODS[o.goods]?.name||'Hàng hóa')} · ${n(o.quantity)} thùng</h3>${details([['Trạng thái',state(o.state)],['Đã giao',`${n(o.delivered)} thùng`],['Hạn giao',`Còn ${n(Math.max(0,o.dueAt-s.clock.seconds))} giây game`]])}${o.reason?status(o.reason):''}<div class="modal-actions">${tileButton(s,o.origin,'Nguồn hàng')}${tileButton(s,o.destination,'Nơi nhận')}</div></article>`;}
function logisticsMarkup(s){
 const x=logisticsSnapshot(s),rows=s.logistics.facilities.map(f=>logisticsFacilitySnapshot(s,f.tile)),entries=(s.ledger?.entries||[]).filter(e=>e.seconds>s.clock.seconds-600&&e.category.startsWith('logistics-')),income=entries.filter(e=>e.amount>0).reduce((v,e)=>v+e.amount,0),cost=-entries.filter(e=>e.amount<0).reduce((v,e)=>v+e.amount,0);
 const active=s.logistics.orders.filter(o=>['queued','travelling','blocked'].includes(o.state));
 return details([['Cơ sở / nhân viên hiện diện',`${n(x.facilities)} / ${n(sum(rows,'staffPresent'))}`],['Xe tải / đơn chờ',`${n(x.trucks)} / ${n(x.queued)}`],['Đơn bị chặn',n(x.blocked)],['Đã giao đúng hạn / đơn đến hạn',`${n(x.fulfilled)} / ${n(x.due)} trong 10 phút game`],['Tỷ lệ giao đúng hạn',pct(x.supplyFulfillmentPct)],['Đơn hoàn thành từ đầu',n(x.totals.completed)]])+
 `<h3>Kho hàng & hàng đang trên xe</h3>${details(Object.entries(GOODS).map(([id,g])=>[g.name,`${n(x.stock[id])} trong kho · ${n(x.cargo[id])} trên xe · ${n(x.totals.delivered[id])} đã giao`]))}`+
 `<h3>Sổ thu chi hàng hóa · 10 phút game</h3>${details([['Thuế bán hàng vào ngân quỹ',formatMoney(income)],['Nhập hàng, chế biến & vận chuyển',formatMoney(cost)],['Chênh lệch đã ghi sổ',formatMoney(income-cost)]])}<p>Doanh số cửa hàng thuộc chủ cửa hàng. Ngân quỹ chỉ nhận phần thuế khi hộ gia đình mua hàng thật; hàng chỉ được tính đã giao sau khi tới nơi và được nhận.</p>`+
 buildChoices(['farm','freightWarehouse','foodFactory'])+facilityList(s,rows,logisticsDetails,'industrial')+`<h3>Đơn hàng chưa hoàn thành · ${n(active.length)}</h3><div class="hub-grid">${limited(active,'đơn hàng',o=>orderMarkup(s,o))}</div>`+fleetMarkup(s);
}
function leisureMarkup(s){const x=leisureSnapshot(s);return details([['Công viên / sức chứa',`${n(x.parks)} / ${n(x.capacity)}`],['Khách đang có mặt / đang tới',`${n(x.present)} / ${n(x.travelling)}`],['Lượt sử dụng hoàn thành',n(x.completed)],['Cây trồng khỏe',n(x.healthyTrees)],['Dân có tiện ích trong 400 m đi bộ',pct(x.walkableHousingPct)]])+buildChoices(['park','plaza','sportsPark'])+facilityList(s,x.rows,leisureDetails,'park')+peopleList(s,s.citizens.filter(c=>['travelling','visiting'].includes(c.leisure?.phase)),'Người đang tới / sử dụng công viên');}
export function operationsMarkup(s,mode='education'){
 if(!Object.hasOwn(MODES,mode))mode='education';
 const render={education:educationMarkup,health:healthMarkup,municipal:municipalMarkup,logistics:logisticsMarkup,leisure:leisureMarkup};
 return `<span class="news-kicker">VẬN HÀNH THÀNH PHỐ</span><h2>Dịch vụ & chuỗi cung ứng</h2><nav class="hub-tabs" aria-label="Hệ thống vận hành">${Object.entries(MODES).map(([key,name])=>`<button type="button" class="${key===mode?'active':''}" aria-pressed="${key===mode}" data-operations-mode="${key}">${name}</button>`).join('')}</nav><section class="hub-section" data-operations-panel="${mode}"><h3>${MODES[mode]}</h3>${render[mode](s)}</section>`;
}
export function facilityOperationsMarkup(s,tile){
 const t=s.tiles[tile];if(!t?.kind)return '';
 const summary=(row,body,glyph)=>facilityCard(s,row,body,glyph,true);
 if(SCHOOL_PROFILES[t.kind]){const r=schoolSnapshot(s,tile);return r?summary(r,schoolDetails(r)+peopleList(s,peopleAt(s,r.pupils),'Học sinh đã ghi danh'),'education'):'';}
 if(HEALTHCARE_PROFILES[t.kind]){const r=healthcareFacilitySnapshot(s,tile);return r?summary(r,healthDetails(r)+peopleList(s,peopleAt(s,r.patients),'Người bệnh đã tiếp nhận'),'health'):'';}
 if(MUNICIPAL_PROFILES[t.kind]){const r=municipalFacilitySnapshot(s,tile);return r?summary(r,municipalDetails(r)+fleetMarkup(s,tile),'services'):'';}
 if(logisticsKind(t)){const r=logisticsFacilitySnapshot(s,tile),f=s.firms.find(f=>f.home===tile);return r?summary(r,logisticsDetails(r)+peopleList(s,peopleAt(s,f?.employees||[]),'Nhân viên đã tuyển')+fleetMarkup(s,tile),'industrial'):'';}
 if(LEISURE_PROFILES[t.kind]){const r=leisureFacilitySnapshot(s,tile);return r?summary(r,leisureDetails(r)+peopleList(s,s.citizens.filter(c=>c.leisure?.tile===tile&&['travelling','visiting'].includes(c.leisure?.phase)),'Khách đã đặt chỗ'),'park'):'';}
 return '';
}
