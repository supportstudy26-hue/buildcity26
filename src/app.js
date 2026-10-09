import {createVietnamCity,geographyBuildRule} from './game/geography/city.js';
import {MISSIONS,levelFromXp,xpForLevel} from './config/progression.js';
import {missionViews} from './game/systems/progression.js';
import { formatMoney } from './config/money.js';
import { PLAY_SECONDS_PER_SECOND, STEP_SECONDS, LEGACY_BC_FACTOR, NEW_CITY_CASH_BC } from './config/simulation.js';
import { consumeSteps, calendar, simulationDelta } from './game/systems/clock.js';
import { createCity, createEmptyCity, analyze, stepSimulation, executeCommand, place, serialize, validateSave, CATALOG, SIZE, index, isRoad, addBusLine, borrow, repay } from './game/core.js';
import { createRenderer } from './game/render/renderer-host.js';
import {surfaceHeight,slopeAt} from './game/systems/terrain.js';
import { saveLocal, loadLocal, archiveLocal, listLocalBackups, readLocalBackup, removeLocalBackup, localKey } from './services/local-storage.js';
import { supabase, configured, authMessage, listCities, loadCity, saveCity, deleteCity } from './services/supabase.js';

import {buildingPreview,buildingSummary} from './ui/build-card.js';
import {serviceKind} from './config/catalog.js';
import { icon, applyIcons } from './icons.js';
import { CloudSync } from './services/cloud-sync.js';
import { authenticate, observeSession } from './services/auth.js';
import {accountRequest,registrationRequest,acceptAccountSession} from './services/accounts.js';
import {accountForm} from './ui/account-form.js';

async function startGame(){
if(import.meta.env.PROD&&'serviceWorker' in navigator)navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
const $=id=>document.getElementById(id);
const money=formatMoney;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
applyIcons();
const crosshair='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/></svg>';
let city=createEmptyCity(),user=null,changeId=0,cityEpoch=0,storageWarning=false,storageBlocked=false,recoveryMode=false,libraryBusy=false,localCollision=false;
const sync=new CloudSync({snapshot:()=>serialize(city),send:saveCity,persist:()=>persist(),notify:()=>renderSaveStatus(),online:()=>navigator.onLine});
let observe=false,tracked=null,watchDeparture=null,firstEntry=true;
function command(type,payload){const seq=city.commandSequence+1;return executeCommand(city,{id:`command-${seq}`,sequence:seq,type,payload});}
let speed=1,lastMs=performance.now(),accumulator=0,tool='inspect',group='inspect',selected=null;
let toastTimer;
let storageError='';
try{const saved=loadLocal();if(saved){city=saved.city;if(saved.migrated){try{archiveLocal();}catch(e){storageBlocked=true;storageWarning=true;storageError='Đã mở bản cũ nhưng bộ nhớ đầy, chưa tạo được dự phòng. Xuất JSON hoặc quản lý bản dự phòng trước khi lưu.';}}}}catch(e){try{archiveLocal();}catch{storageBlocked=true;}storageWarning=true;storageError='Không mở được bản lưu: '+e.message;}
speed=city.playback.paused?0:city.playback.multiplier;observe=city.playback.observe;
const renderer=await createRenderer($('world'),$('mini'),()=>city);
function focusEmptyStart(){if(city.metrics.roadCount!==0)return;const entry=city.world.geography?.entryTile??index(0,18);renderer.focusTile(Math.min(SIZE-1,entry%SIZE+4),Math.floor(entry/SIZE));$('detailPanel').hidden=false;}
focusEmptyStart();
const modal=$('modal');
const groups=[['inspect','⌖','Khám phá'],['roads','╋','Đường'],['zones','▥','Phân khu'],['utilities','ϟ','Điện nước'],['services','✚','Dịch vụ'],['parks','♧','Công viên'],['transport','▣','Vận tải'],['bulldoze','⌫','Phá dỡ']];
function toast(msg){clearTimeout(toastTimer);$('toast').textContent=msg;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function changed(){changeId++;sync.changed();renderSaveStatus();update();updatePlacementPreview();}
function renderSaveStatus(){
  const labels={local:'Lưu trên thiết bị',pending:'Chờ đồng bộ',saving:'Đang đồng bộ…',synced:'Đã lưu đám mây',offline:'Mất mạng · lưu trên máy',error:'Lỗi đồng bộ · thử lại',conflict:'Xung đột · cần xử lý','storage-error':'Chưa lưu trên thiết bị'};
  const text=storageWarning?'Chưa lưu được · xuất JSON':localCollision?'Bản local đổi ở tab khác':user?labels[sync.status]:'Lưu trên thiết bị';
  $('saveText').textContent=text;$('saveText').dataset.state=storageWarning?'error':sync.status;
  $('saveText').title=storageError|| (sync.error?authMessage(sync.error):text);
}
function persist(){if(localCollision||storageBlocked)return false;try{saveLocal(city,user?.id||'guest',sync.cloud,sync.metadata);storageWarning=false;renderSaveStatus();return true;}catch{storageWarning=true;renderSaveStatus();return false;}}
function checkpoint(){
  if(localCollision){toast('Tab khác đã thay đổi bản local. Hãy xuất JSON trước khi tiếp tục.');return false;}
  if(!persist())return false;
  try{archiveLocal(user?.id||'guest');return true;}catch{storageWarning=true;renderSaveStatus();toast('Không tạo được bản dự phòng. Hãy xuất JSON trước khi mở thành phố khác.');return false;}
}
function showModal(html){modal.classList.remove('auth-layout','account-dialog');$('modalBody').innerHTML=html;if(!modal.open)modal.showModal();}
modal.addEventListener('close',()=>{lastMs=performance.now();update();});
function closeModal(){modal.close();}
function restorePlayback(){speed=city.playback.paused?0:city.playback.multiplier;observe=city.playback.observe;document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('active',Number(b.dataset.speed)===speed));$('observeBtn').classList.toggle('active',observe);$('timeScale').textContent=!speed?'Tạm dừng':observe?'Quan sát · 1 giây thực = 1 giây game':`1 giây thực = ${PLAY_SECONDS_PER_SECOND*speed} giây game${speed===1?'':' · casual nhanh'}`;}
function setSpeed(n){const result=command('playback',{paused:n===0,multiplier:n||city.playback.multiplier,observe});if(!result.ok){toast(result.message);return;}restorePlayback();changeId++;sync.changed();persist();}
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.speed);setSpeed(n===0&&speed===0?city.playback.multiplier:n);});
restorePlayback();

function selectTool(k){if(!CATALOG[k])return;tracked=null;renderer.follow=null;tool=k;group=CATALOG[k].group;renderer.tool=k;renderer.selected=null;selected=null;
  $('toolbar').innerHTML=groups.map(([g,glyph,label])=>`<button class="tool-btn ${g===group?'active':''}" data-group="${g}" title="${label}" aria-pressed="${g===group}"><span class="glyph">${icon(g,22)}</span><span>${label}</span></button>`).join('');
  $('toolbar').querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>selectTool(Object.keys(CATALOG).find(k=>CATALOG[k].group===b.dataset.group)));
  const options=Object.entries(CATALOG).filter(([,v])=>v.group===group);
  $('toolTray').hidden=['inspect','bulldoze'].includes(group);
  $('toolTray').innerHTML=`<div class="build-heading"><div><span>QUY HOẠCH & XÂY DỰNG</span><strong>${groups.find(([g])=>g===group)[2]} <small>${options.length} lựa chọn</small></strong></div><button class="icon-btn" id="closeBuild" aria-label="Đóng menu xây dựng">×</button></div><div class="build-grid">`+options.map(([id,v])=>`<button class="build-option ${id===k?'active':''}" data-tool="${id}" aria-pressed="${id===k}" style="--facility:${v.color}">${buildingPreview(id)}<strong>${v.name}</strong><span class="facility-summary">${buildingSummary(id)}</span><b>${money(v.cost)}</b><small>${v.upkeep?money(v.upkeep)+' / tháng':'Không có phí vận hành'}</small></button>`).join('')+(group==='transport'?'<button class="build-option manage-transit" id="manageTransit">'+icon('chart',26)+'<strong>Quản lý tuyến</strong><small>Tạo tuyến · bố trí xe</small></button>':'')+'</div>';
  $('closeBuild').onclick=()=>selectTool('inspect');
  if($('manageTransit'))$('manageTransit').onclick=transit;
  $('toolTray').querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>selectTool(b.dataset.tool));
  $('toolInfo').hidden=k==='inspect';$('toolInfo').innerHTML=`<strong>${CATALOG[k].name}</strong> · ${CATALOG[k].description}<small>${k==='bulldoze'?'Thu hồi 25% nguyên giá đã trả; tài sản có sẵn không hoàn tiền':k==='park'?'Thi công 10 ngày; không phục vụ khi chưa hoàn tất':'Bấm hoặc kéo trên bản đồ để xây'} · Esc để thoát</small>`;
  $('mapHint').textContent=k==='inspect'?'Kéo để di chuyển · Cuộn để thu phóng · Bấm công trình để xem':'Kéo để xây · Chuột phải để di chuyển · Esc để thoát';
  $('world').style.cursor=k==='inspect'?'grab':'crosshair';
  positionToolInfo();updatePlacementPreview();
}
function updatePlacementPreview(){
  if(tool==='inspect')return;
  let el=$('placementPreview');if(!el){el=document.createElement('small');el.id='placementPreview';$('toolInfo').append(el);}
  const hit=renderer.hover,i=typeof hit==='number'?hit:hit?.i;if(i==null){el.textContent='';return;}
  const rule=geographyBuildRule(city,i,tool),t=city.tiles[i];
  if(!rule.ok){el.textContent=rule.message;return;}
  const upgrading=t.kind==='road'&&tool==='avenue';
  if(t.kind||t.zone){el.textContent=tool==='bulldoze'?`Thu hồi ${money(Math.floor((t.historicalCost||0)*.25))}`:upgrading?`Nâng cấp: ${money(Math.ceil(80*LEGACY_BC_FACTOR*(t.terrain==='water'?4:1)*rule.factor))}`:'Ô này đã có công trình.';return;}
  el.textContent=tool==='bulldoze'?'Ô đất trống.':`Giá tại ô này: ${money(Math.ceil(CATALOG[tool].cost*(t.terrain==='water'?4:1)*rule.factor))}${city.world.geography?` · Dốc ${slopeAt(city.world,i,SIZE).toFixed(1)}%`:''}`;
}
function positionToolInfo(){if(!$('toolTray').hidden)$('toolInfo').style.bottom=($('game').clientHeight-$('toolTray').offsetTop+10)+'px';}
selectTool('inspect');
if(innerWidth<600){document.querySelector('.left-panel').hidden=true;$('restoreOverview').hidden=false;}

function date(){return calendar(city.clock.seconds).date.toLocaleString('vi-VN',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function level(){return `Cấp thành phố ${levelFromXp(city.progression.xp)} · ${city.progression.xp} XP`;}
function update(){const m=city.metrics||analyze(city);$('money').textContent=money(city.money);$('net').textContent=(m.net>=0?'+':'')+money(m.net)+' / tháng';$('net').style.color=m.net>=0?'var(--mint)':'#f2a595';$('population').textContent=m.population.toLocaleString('vi-VN');$('popChange').textContent=m.homes-m.population+' chỗ ở còn trống';$('happiness').textContent=m.population?m.happiness+'%':'—';$('happyLabel').textContent=!m.population?'Chưa có cư dân':m.happiness>=75?'Cuộc sống tốt':m.happiness>=50?'Cần cải thiện':'Cư dân lo lắng';$('happyLabel').style.color=m.happiness>=65?'var(--mint)':'var(--orange)';$('level').textContent=level();$('cityName').value=city.name;$('date').textContent=date();
  for(const [id,n] of [['demandR','residential'],['demandC','commercial'],['demandI','industrial']])$(id).style.height=m.demand[n]*.45+'px';
  for(const [p,label] of [['power','power'],['water','water']]){$(p+'Text').textContent=m[p+'Need'].toLocaleString('vi-VN',{maximumFractionDigits:1})+' / '+m[p]+(p==='power'?' kW':' m³/ngày');$(p+'Bar').style.width=Math.min(100,m[p]?m[p+'Need']/m[p]*100:m[p+'Need']?100:0)+'%';$(p+'Bar').style.background=m[p+'Need']>m[p]?'#f09781':p==='power'?'var(--yellow)':'var(--blue)';}
  $('sewageText').textContent=m.sewageNeed.toLocaleString('vi-VN',{maximumFractionDigits:1})+' / '+m.sewage+' m³/ngày';$('garbageText').textContent=m.garbage+' đơn vị';$('mapSizeText').textContent=city.world?.geography?city.world.geography.provinceName+' · 1,28 KM':SIZE+' × '+SIZE+' · BÌNH MINH';const g=city.world?.geography;let credit=$('geoCredit');if(g){if(!credit){credit=document.createElement('div');credit.id='geoCredit';credit.className='geo-credit';$('game').append(credit);}credit.textContent='© OpenStreetMap contributors · Mapzen / USGS / NOAA · '+g.provinceName+' · dữ liệu OSM '+g.osmDate;}else credit?.remove();
  renderServices();$('jobs').textContent=m.jobs;$('unemployment').textContent=m.unemployment+'%';$('traffic').textContent=m.traffic+'%';$('environment').textContent=m.environment+'%';
  const unserved=city.tiles.filter(t=>t.kind==='residential'&&(!t.active)).length;
  $('cityStatus').textContent=unserved?'Có công trình thiếu kết nối':city.money<0?'Ngân sách đang bị âm':m.happiness<50?'Cư dân cần được chăm sóc':m.roadCount===0?'Sẵn sàng xây thành phố của bạn':'Thành phố đang phát triển';
  const all=missionViews(city),done=all.filter(m=>m.completed).length,lv=levelFromXp(city.progression.xp),needed=xpForLevel(lv+1)-xpForLevel(lv);
  $('questTitle').textContent=`Cấp ${lv} · ${city.progression.xp} XP`;$('missionBtn').textContent=`Cấp ${lv} · ${city.progression.xp-xpForLevel(lv)}/${needed} XP`;$('questCount').textContent=done+'/'+all.length;$('quests').innerHTML=all.filter(m=>!m.completed).slice(0,7).map(m=>`<div class="mission-card ${m.locked?'locked':''}"><strong>${escape(m.name)} <small>+${m.xp} XP</small></strong><p>${escape(m.description)}</p><small>${m.locked?'Mở ở cấp '+m.level:`${Math.min(m.value,m.target)} / ${m.target} · giữ ${Math.floor(m.held/3600)} / 24 giờ`}</small>${m.tool&&!m.locked?`<button class="news-action" data-mission-tool="${m.tool}">${icon(m.tool,16)} ${CATALOG[m.tool].name}</button>`:''}</div>`).join('')+(done?`<details><summary>${done} nhiệm vụ đã hoàn tất</summary>${all.filter(m=>m.completed).map(m=>`<p class="good">✓ ${escape(m.name)} · ${m.xp} XP</p>`).join('')}</details>`:'');
  $('quests').querySelectorAll('[data-mission-tool]').forEach(b=>b.onclick=()=>{selectTool(b.dataset.missionTool);hideOverviewOnPhone();});
  $('questProgress').style.width=(city.progression.xp-xpForLevel(lv))/needed*100+'%';$('questHint').textContent=`${city.progression.xp-xpForLevel(lv)} / ${needed} XP đến cấp ${lv+1} · Thưởng mỗi lần lên cấp: 100 triệu ₫. Cấp thành phố chơi thường; chưa phải cấp tài khoản/BXH.`;
  if(tracked)inspectCitizen(tracked);else if(selected)inspect(selected);else if(!modal.open)news();
  restorePlayback();if(accumulator>=STEP_SECONDS*120)$('timeScale').textContent+=' · Đang xử lý thời gian còn lại';
}
function renderServices(){
  const m=city.metrics,pop=m.population||1;
  const coverage=kind=>Math.round(city.tiles.filter(t=>t.kind==='residential'&&t.services.includes(kind)).reduce((n,t)=>n+t.residents,0)/pop*100);
  const data=[['power','Điện',m.powerNeed+' / '+m.power,m.power>=m.powerNeed,'Sử dụng / công suất; trạm cần nối đường.'],['water','Nước sạch',m.waterNeed+' / '+m.water,m.water>=m.waterNeed,'Thiếu nước: xây thêm trạm và kiểm tra phạm vi.'],['sewage','Nước thải',m.sewageNeed.toLocaleString('vi-VN',{maximumFractionDigits:1})+' / '+m.sewage+' m³/ngày',m.sewage>=m.sewageNeed,'Trạm xử lý cần đường, điện và nước.'],['waste','Thu gom rác',coverage('waste')+'% dân cư',coverage('waste')>=90,'Rác tăng mỗi ngày ở nhà chưa được thu gom.'],...['school','clinic','fire','police','park'].map(kind=>[kind,CATALOG[kind].name,coverage(kind)+'% dân cư',coverage(kind)>=80,'Phục vụ trong phạm vi, cần đường, điện và nước.']),['bus','Xe buýt',m.busLines+' tuyến',m.busLines>0,Math.round(m.busPassengers)+' người đi xe buýt / ngày mô phỏng.']];
  $('serviceReport').innerHTML=data.map(([kind,name,value,ok,hint])=>`<div class="service-card"><i style="color:${CATALOG[kind]?.color}">${icon(kind,21)}</i><div><strong>${name}</strong><small>${hint}</small></div><b class="${ok?'good':'warn'}">${value}</b></div>`).join('');
}
function news(){if($('detailPanel').hidden)return;$('detailPanel').classList.remove('inspect');$('detailTitle').textContent='BẢN TIN THÀNH PHỐ';const m=city.metrics;
  const notes=[];
  if(m.roadCount===0){const entry=city.world.geography?.entryTile??index(0,18);$('detailBody').innerHTML=`<span class="news-kicker">KHỞI ĐẦU TỪ ĐẤT TRỐNG</span><h2 class="news-title">Thành phố do bạn tạo nên.</h2><p class="news-text">${money(city.money)} để bắt đầu. Không có nhà, công trình hay dân cư được xây sẵn.</p><div class="news-card"><strong>01 · Nối đường vào thành phố</strong><p>Bắt đầu tại ô ${entry%SIZE+1}, ${Math.floor(entry/SIZE)+1}; kéo đường vào đất liền.</p><button class="news-action" id="startRoad">${icon('road',18)} Đến cổng & xây đường</button></div><div class="news-card"><strong>02 · Điện, nước & việc làm</strong><p>Xây trạm cạnh đường, rồi phân khu dân cư và thương mại. Nhà phát triển khi đủ tiện ích.</p></div><div class="news-card"><strong>03 · Chăm sóc cư dân</strong><p>Bố trí xử lý nước thải, rác, trường học và y tế. Theo dõi phí vận hành trước khi mở rộng.</p></div>`;$('startRoad').onclick=()=>{renderer.focusTile(Math.min(SIZE-1,entry%SIZE+4),Math.floor(entry/SIZE));selectTool('road');};return;}
  if(m.fires)notes.push([m.fires+' công trình đang cháy','Xây trạm cứu hỏa có điện, nước và đường nối trong phạm vi; thu gom rác và giảm ô nhiễm để ngăn tái phát.']);
  if(m.highCrime)notes.push(['An ninh khu dân cư đang giảm','Tạo thêm việc làm và bố trí cảnh sát có đường, điện và nước để giảm mất an ninh.']);
  if(m.powerNeed>m.power)notes.push(['Điện năng chưa đủ','Xây thêm trạm điện và kết nối với đường thành phố.']);
  if(m.waterNeed>m.water)notes.push(['Cần thêm nước sạch','Xây trạm cấp nước để phục vụ cư dân và doanh nghiệp.']);
  if(city.tiles.some(t=>t.kind&&!isRoad(t)&&!t.connected))notes.push(['Đường bị ngắt kết nối','Nối đường đến cổng phía tây để các công trình hoạt động.']);
  if(m.sewageNeed>m.sewage)notes.push(['Nước thải chưa được xử lý','Xây trạm xử lý nước thải cạnh đường; kiểm tra công suất và lớp Nước thải.']);
  if(m.garbage>100)notes.push(['Rác đang tích tụ','Xây trạm thu gom trong bán kính 12 ô và nối đường để đưa rác đi.']);
  if(m.congestedRoads)notes.push([m.congestedRoads+' đoạn đường quá tải','Mở lớp Giao thông, nâng các đoạn đỏ lên đại lộ hoặc bổ sung bến xe buýt gần nhà ở.']);
  if(m.environment<80)notes.push(['Giữ khoảng cách với nhà xưởng','Đặt khu công nghiệp xa nhà ở và tạo thêm không gian xanh.']);
  if(m.unemployment>15)notes.push(['Cư dân đang tìm việc','Phân thêm khu thương mại hoặc công nghiệp gần đường có điện nước.']);
  if(!notes.length)notes.push(['Có thể mở rộng khu dân cư','Đặt phân khu dọc các con đường. Nhà sẽ phát triển khi đủ điện, nước và việc làm.']);
  $('detailBody').innerHTML=`<span class="news-kicker">${date()}</span><h2 class="news-title">${m.population} cư dân.<br>Một thành phố đang lớn lên.</h2><p class="news-text">${m.happiness>=70?'Cư dân đang hài lòng với cuộc sống ở đây. Hãy cân bằng nhà ở, việc làm và dịch vụ khi mở rộng.':'Chú ý các biểu tượng cảnh báo trên công trình để cải thiện cuộc sống của cư dân.'}</p>`+notes.slice(0,3).map(([title,text])=>{const action=/cháy/.test(title)?'fire':/An ninh/.test(title)?'police':/Điện/.test(title)?'power':/nước sạch/.test(title)?'water':/Nước thải/.test(title)?'sewage':/Rác/.test(title)?'waste':/quá tải/.test(title)?'avenue':/Đường/.test(title)?'road':/tìm việc/.test(title)?'commercial':null;return `<div class="news-card"><strong>${title}</strong><p>${text}</p>${action?`<button class="news-action" data-action="${action}">${icon(action,16)} ${CATALOG[action].name}</button>`:''}</div>`;}).join('');
  $('detailBody').querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>selectTool(button.dataset.action));
}
function hideOverviewOnPhone(){if(innerWidth<=600){document.querySelector('.left-panel').hidden=true;$('restoreOverview').hidden=false;}}
function inspect(tile){if(!tile)return;hideOverviewOnPhone();tracked=null;renderer.follow=null;selected=tile;renderer.selected=tile;const t=city.tiles[tile.i];$('detailPanel').hidden=false;$('detailPanel').classList.add('inspect');$('detailTitle').textContent='THÔNG TIN Ô ĐẤT';const name=CATALOG[t.kind||t.zone]?.name||(t.terrain==='water'?(city.world.geography?['Đất trống','Biển · nước mặn','Sông / hồ · OSM','Vùng nước triều'][city.world.geography.waterMask[tile.i]]:'Sông Bình Minh'):'Đất trống');const rows=[['Cao độ / dốc',`${surfaceHeight(city,tile.i,SIZE).toFixed(1)} m / ${slopeAt(city.world,tile.i,SIZE).toFixed(1)}%`],['Vị trí',`${tile.x+1}, ${tile.y+1}`],['Kết nối đường',t.connected?'Đã kết nối':'Chưa kết nối']];if(t.kind&&!isRoad(t)&&!['power','water'].includes(serviceKind(t.kind))){rows.push(['Điện năng',t.power?'Đủ cung cấp':'Chưa đủ'],['Nước sạch',t.water?'Đủ cung cấp':'Chưa đủ']);}if(t.kind==='residential')rows.push(['Cư dân',t.residents+' / '+24*t.level],['Hạnh phúc',t.happiness+'%'],['Cấp công trình',t.level],['Ô nhiễm',Math.round(t.pollution)+'%']);if(isRoad(t))rows.push(['Lưu lượng / năng lực',`${Math.round(t.trafficLoad)} / ${t.trafficCapacity} xe/ngày`],['Tình trạng',!t.connected?'Mất kết nối':t.trafficLoad>t.trafficCapacity?'Quá tải — nâng đại lộ':'Thông thoáng']);if(t.kind==='residential')rows.push(['Rác tích tụ',Math.round(t.garbage||0)+'%'],['Sức khỏe',Math.round(t.health??100)+'%'],['Giáo dục',Math.round(t.education||0)+'%'],['Mất an ninh',Math.round(t.crime||0)+'%'],['Nước thải',t.sewage?'Đã xử lý':'Thiếu xử lý']);if(['residential','industrial'].includes(t.kind))rows.push(['Nguy cơ cháy',Math.round(t.hazard||0)+'%'],['Cháy',t.fire>0?Math.round(t.fire)+'% · cần cứu hỏa':'Không']);if(CATALOG[t.kind]?.range)rows.push(['Phạm vi',CATALOG[t.kind].range+' ô'],['Thông số',buildingSummary(t.kind)]);if(CATALOG[t.kind]?.upkeep)rows.push(['Vận hành',money(CATALOG[t.kind].upkeep*(city.budgets?.[serviceKind(t.kind)]??100)/100)+'/tháng']);if(t.zone&&!t.kind)rows.push(['Trạng thái',t.active?'Chờ xây dựng':'Cần đường, điện, nước']);$('detailBody').innerHTML=`<div class="inspect-icon" style="color:${CATALOG[t.kind||t.zone]?.color||'#b7c8bb'}">${icon(serviceKind(t.kind)||t.zone||'city',30)}</div><h2 class="news-title">${name}</h2>${t.kind&&!isRoad(t)?`<span class="badge ${t.active||['power','water'].includes(serviceKind(t.kind))&&t.connected?'':'warn'}">${t.active||['power','water'].includes(serviceKind(t.kind))&&t.connected?'Đang hoạt động':'Cần kết nối / tiện ích'}</span>`:''}<div class="detail-list">${rows.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('')}</div><p class="news-text">${CATALOG[t.kind||t.zone]?.description||'Chọn công cụ xây đường hoặc phân khu để phát triển ô đất này.'}</p>${t.kind==='road'?`<button id="upgradeRoad" class="action primary full">Nâng đại lộ · ${money(Math.ceil(80*LEGACY_BC_FACTOR*(t.terrain==='water'?4:1)*(geographyBuildRule(city,tile.i,'avenue').factor||1)))}</button>`:''}`;
  const people=city.citizens.filter(c=>c.home===tile.i);if(people.length){$('detailBody').insertAdjacentHTML('beforeend',`<h3>Cư dân ở đây</h3><div class="resident-list">${people.map(c=>`<button class="action" data-person="${c.id}">${escape(c.name)} · ${c.age} tuổi</button>`).join('')}</div>`);$('detailBody').querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>trackCitizen(b.dataset.person));}
  const contract=city.contracts.find(c=>c.tile===tile.i&&c.status==='building');if(contract){$('detailBody').insertAdjacentHTML('beforeend',`<p>Thi công công viên · ${Math.round(contract.progress*100)}% · giữ ${money(contract.escrow)} trong escrow</p><button class="action" id="cancelContract">Hủy · hoàn khoản chưa chi</button>`);$('cancelContract').onclick=()=>{command('cancel-construction',{id:contract.id});changed();persist();};}
  if($('upgradeRoad'))$('upgradeRoad').onclick=()=>{const result=command('place',{x:tile.x,y:tile.y,kind:'avenue'});if(!result.ok){toast(result.message);return;}changed();persist();renderer.lastPaths=-1;};
}
$('newsBtn').onclick=()=>{const opening=$('detailPanel').hidden||selected||tracked;tracked=null;selected=null;renderer.selected=null;renderer.follow=null;$('detailPanel').hidden=!opening;if(opening){hideOverviewOnPhone();news();}};
$('detailClose').onclick=()=>{tracked=null;renderer.follow=null;$('detailPanel').hidden=true;selected=null;renderer.selected=null;};
// Collapse overview without obstructing the map on smaller devices.
document.querySelectorAll('[data-overview]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-overview]').forEach(b=>b.classList.toggle('active',b===button));for(const view of ['general','services','goals'])$('overview-'+view).hidden=button.dataset.overview!==view;document.querySelector('.left-panel .panel-title span').textContent={general:'THÀNH PHỐ',services:'DỊCH VỤ CÔNG',goals:'NHIỆM VỤ'}[button.dataset.overview];});
$('transitReportBtn').onclick=transit;
$('overviewCollapse').onclick=()=>{document.querySelector('.left-panel').hidden=true;$('restoreOverview').hidden=false;};
$('missionBtn').onclick=()=>{$('restoreOverview').click();document.querySelector('[data-overview=goals]').click();};
$('restoreOverview').onclick=()=>{if(innerWidth<=600){$('detailPanel').hidden=true;selected=null;tracked=null;renderer.selected=null;renderer.follow=null;}document.querySelector('.left-panel').hidden=false;$('restoreOverview').hidden=true;};
$('cityName').onchange=()=>{command('rename',{name:$('cityName').value});changed();persist();};

const canvas=$('world'),pointers=new Map();let drag=null,lastPaint=null,pinch=null,spaceDown=false;
const point=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
function paint(p){const t=renderer.tileAt(p.x,p.y);if(!t)return;if(lastPaint?.i===t.i)return;
  const tiles=[];if(lastPaint){let x=lastPaint.x,y=lastPaint.y;while(x!==t.x||y!==t.y){if(x!==t.x)x+=Math.sign(t.x-x);else y+=Math.sign(t.y-y);tiles.push({x,y,i:index(x,y)});}}else tiles.push(t);
  let did=false,error=null;for(const at of tiles){const result=command(tool==='park'?'construct':'place',{x:at.x,y:at.y,kind:tool});if(result.ok)did=true;else if(!/already|Ô này/.test(result.message))error=result.message;}
  lastPaint=t;if(did){changed();renderer.lastPaths=-1;}else if(error)toast(error);
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(modal.open)return;canvas.setPointerCapture(e.pointerId);const p=point(e);pointers.set(e.pointerId,p);
  if(pointers.size===2){const pts=[...pointers.values()];pinch={distance:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),mid:{x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2}};drag=null;lastPaint=null;return;}
  drag={start:p,last:p,moved:false,pan:e.button!==0||spaceDown||tool==='inspect',touch:e.pointerType==='touch'};lastPaint=null;
  if(!drag.pan&&!drag.touch)paint(p);
});
canvas.addEventListener('pointermove',e=>{const p=point(e);renderer.hover=renderer.tileAt(p.x,p.y);updatePlacementPreview();if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,p);
  if(pointers.size>=2&&pinch){const pts=[...pointers.values()],d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};if(pinch.distance>0)renderer.zoomAt(d/pinch.distance,mid.x,mid.y);renderer.panBy(mid.x-pinch.mid.x,mid.y-pinch.mid.y);pinch={distance:d,mid};return;}
  if(!drag)return;const dx=p.x-drag.last.x,dy=p.y-drag.last.y;if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>5)drag.moved=true;if(drag.pan){renderer.panBy(dx,dy);}else if(!drag.touch||drag.moved)paint(p);drag.last=p;
});
function endPointer(e){const p=point(e);if(drag&&!drag.moved&&e.type!=='pointercancel'){if(tool==='inspect'&&e.button===0){const actor=renderer.actorAt(p.x,p.y);if(actor)trackCitizen(actor);else inspect(renderer.tileAt(p.x,p.y));}else if(drag.touch&&!drag.pan)paint(p);}pointers.delete(e.pointerId);if(pointers.size<2)pinch=null;drag=null;lastPaint=null;persist();}
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('pointerleave',()=>{if(!drag)renderer.hover=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();const p=point(e);renderer.zoomAt(Math.exp(-e.deltaY*.0015),p.x,p.y);},{passive:false});
$('zoomIn').onclick=()=>renderer.zoomAt(1.2);$('zoomOut').onclick=()=>renderer.zoomAt(1/1.2);$('centerBtn').innerHTML=crosshair;$('centerBtn').onclick=()=>renderer.center();
$('cameraView').onclick=()=>{renderer.topView();};
$('cameraRotate').onclick=()=>{renderer.dragMode=renderer.dragMode==='orbit'?'pan':'orbit';$('cameraRotate').classList.toggle('active',renderer.dragMode==='orbit');toast(renderer.dragMode==='orbit'?'Kéo bản đồ để xoay góc nhìn. Bấm Xoay lần nữa để kéo di chuyển.':'Kéo bản đồ để di chuyển camera.');};
$('mini').onclick=e=>{const rect=$('mini').getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*SIZE,y=(e.clientY-rect.top)/rect.height*SIZE;renderer.focusTile(x,y);};
window.addEventListener('resize',()=>{renderer.resize();hideOverviewOnPhone();positionToolInfo();});
window.addEventListener('keydown',e=>{if(document.body.dataset.screen==='home'||modal.open||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.code==='Space'){e.preventDefault();spaceDown=true;if(!e.repeat)setSpeed(speed?0:1);}if(e.key==='Escape')selectTool('inspect');const shortcuts={1:'road',2:'residential',3:'commercial',4:'industrial',5:'park',6:'power',7:'water',8:'bulldoze'};if(shortcuts[e.key])selectTool(shortcuts[e.key]);if(e.key==='+'||e.key==='=')renderer.zoomAt(1.15);if(e.key==='-')renderer.zoomAt(1/1.15);});
window.addEventListener('keyup',e=>{if(e.code==='Space')spaceDown=false;});window.addEventListener('blur',()=>{spaceDown=false;pointers.clear();drag=null;pinch=null;});
const layers=[['normal','Tự nhiên','#a6ba91'],['power','Điện năng','#eacc79'],['water','Nước sạch','#83c8ed'],['traffic','Lưu lượng giao thông','#8ce0ac'],['sewage','Nước thải','#77b8c9'],['garbage','Thu gom rác','#f1bc81'],['pollution','Ô nhiễm','#e7a479'],['services','Dịch vụ dân cư','#bba6ce']];
function setLayer(n){renderer.layer=n;$('layerOptions').innerHTML=layers.map(([id,text,color])=>`<button class="layer-option ${n===id?'active':''}" data-layer="${id}" aria-pressed="${n===id}"><i style="background:${color}"></i>${text}</button>`).join('')+`<div class="layer-legend">${n==='normal'?'Màu phân khu: xanh lá · nhà ở; xanh dương · thương mại; vàng · công nghiệp.':n==='traffic'?'Xanh: còn năng lực. Cam / đỏ: lưu lượng cao. Chọn đoạn đường để xem số xe và nâng cấp.':n==='sewage'?'Xanh: được xử lý. Cam: thiếu trạm hoặc công suất.':n==='garbage'?'Cam đậm hơn: rác tích tụ nhiều hơn. Xây trạm thu gom có đường kết nối.':n==='pollution'?'Màu cam đậm hơn: ô nhiễm cao hơn.':n==='services'?'Xanh: có ít nhất 3 dịch vụ. Cam: ít dịch vụ.':'Màu sáng: đủ cung cấp. Cam đỏ: thiếu tiện ích.'}</div>`;$('layerOptions').querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>setLayer(b.dataset.layer));}
setLayer('normal');$('layersBtn').onclick=()=>{$('layersPanel').hidden=!$('layersPanel').hidden;};

function refreshFinance(){const m=city.metrics;$('financeTaxIncome').textContent=money(m.taxIncome);$('financeBusIncome').textContent=money(m.transitIncome);$('financeExpenses').textContent=money(m.expenses);$('financeNet').textContent=(m.net>=0?'+':'')+money(m.net);$('financeNet').className=m.net>=0?'good':'warn';}
function budget(){
  const m=city.metrics;
  showModal(`<span class="news-kicker">TÀI CHÍNH THÀNH PHỐ</span><h2>Thuế & ngân sách</h2><div class="budget-table"><div><span>Thuế mỗi tháng</span><b id="financeTaxIncome">${money(m.taxIncome)}</b></div><div><span>Vé xe buýt mỗi tháng</span><b id="financeBusIncome">${money(m.transitIncome)}</b></div><div><span>Chi vận hành và lãi vay</span><b id="financeExpenses">${money(m.expenses)}</b></div><div><span>Dòng tiền mỗi tháng</span><b id="financeNet" class="${m.net>=0?'good':'warn'}">${m.net>=0?'+':''}${money(m.net)}</b></div></div><nav class="budget-tabs"><button data-finance="taxes" class="active">Thuế</button><button data-finance="services">Dịch vụ</button><button data-finance="loans">Khoản vay</button></nav><div id="finance-taxes">${[['residential','Thuế dân cư'],['commercial','Thuế thương mại'],['industrial','Thuế công nghiệp']].map(([key,text])=>`<div class="range-row"><label for="tax-${key}">${text}<b id="taxValue-${key}">${city.taxes[key]}%</b></label><input id="tax-${key}" type="range" min="0" max="20" step="1" value="${city.taxes[key]}" data-tax="${key}"></div>`).join('')}<p>Thuế dân cư trên 10% giảm hạnh phúc. Thuế doanh nghiệp cao làm giảm nhu cầu phân khu. Doanh nghiệp chỉ đóng thuế trên việc làm đã có người lao động.</p></div><div id="finance-services" hidden>${['power','water','sewage','waste','school','clinic','fire','police','bus'].map(kind=>`<div class="range-row"><label for="fund-${kind}">${CATALOG[kind].name}<b id="fundValue-${kind}">${city.budgets?.[kind]??100}%</b></label><input id="fund-${kind}" type="range" min="50" max="150" step="10" value="${city.budgets?.[kind]??100}" data-fund="${kind}"></div>`).join('')}<p>Ngân sách tăng công suất điện, nước, nước thải và phạm vi dịch vụ; đồng thời tăng chi phí vận hành. Hiệu lực ngay sau khi điều chỉnh.</p></div><div id="finance-loans" hidden><div class="budget-table"><div><span>Dư nợ</span><b>${money(city.loanBalance||0)}</b></div><div><span>Lãi suất</span><b>5% / năm</b></div><div><span>Lãi tháng này</span><b>${money(m.loanInterest)}</b></div></div><div class="modal-actions">${[500000,1000000,2000000].map(amount=>`<button class="action" data-borrow="${amount}">Vay ${money(amount)}</button>`).join('')}<button class="action" id="repayLoan" ${(city.loanBalance||0)<=0?'disabled':''}>Trả toàn bộ nợ</button></div><p>Hạn mức 5 tỷ ₫; lãi phân bổ theo số ngày lịch. Lãi tính vào chi phí; vay không tạo thu nhập thuế. Chỉ trả toàn bộ khi ngân sách đủ dư nợ.</p></div><button class="action primary full" id="budgetDone">Hoàn tất</button>`);
  $('modalBody').querySelectorAll('[data-tax]').forEach(input=>input.oninput=()=>{command('tax',{kind:input.dataset.tax,value:Number(input.value)});$('taxValue-'+input.dataset.tax).textContent=input.value+'%';analyze(city);changed();refreshFinance();});
  $('modalBody').querySelectorAll('[data-fund]').forEach(input=>input.oninput=()=>{city.budgets??={};command('fund',{kind:input.dataset.fund,value:Number(input.value)});$('fundValue-'+input.dataset.fund).textContent=input.value+'%';analyze(city);changed();refreshFinance();});
  $('modalBody').querySelectorAll('[data-finance]').forEach(button=>button.onclick=()=>{for(const panel of ['taxes','services','loans'])$('finance-'+panel).hidden=panel!==button.dataset.finance;$('modalBody').querySelectorAll('[data-finance]').forEach(b=>b.classList.toggle('active',b===button));});
  $('modalBody').querySelectorAll('[data-borrow]').forEach(button=>button.onclick=()=>{const result=command('borrow',{amount:Number(button.dataset.borrow)});if(!result.ok){toast(result.message);return;}changed();persist();budget();$('modalBody').querySelector('[data-finance="loans"]').click();});
  $('repayLoan').onclick=()=>{const result=command('repay',{amount:city.loanBalance||0});if(!result.ok){toast(result.message);return;}changed();persist();budget();$('modalBody').querySelector('[data-finance="loans"]').click();};
  $('budgetDone').onclick=()=>{persist();closeModal();};
}
$('budgetBtn').onclick=budget;

function transit(){
  const stops=city.tiles.flatMap((t,i)=>t.kind==='busStop'?[{i,t}]:[]);
  const routes=city.network.busLines||[];
  showModal(`<span class="news-kicker">GIAO THÔNG CÔNG CỘNG</span><h2>Quản lý xe buýt</h2><p>Xây bến xe và ít nhất hai điểm dừng cạnh đường. Điểm dừng được chọn theo thứ tự bên dưới; xe chạy vòng qua chúng rồi trở về điểm đầu.</p><div class="transit-summary"><span>${routes.filter(l=>l.ok).length} tuyến hoạt động</span><span>${Math.round(city.metrics.busPassengers)} khách / ngày mô phỏng</span><span>${money(city.metrics.transitCost)} / tháng</span></div><div id="busLines">${routes.map(l=>`<div class="saved-city"><div><strong>${escape(l.name)}</strong><small>${l.stops.length} điểm dừng · ${l.vehicles} xe · ${escape(l.message)}</small></div><button class="action" data-line="${l.id}">Ngừng tuyến</button></div>`).join('')}</div><form id="transitForm"><label class="field">Tên tuyến<input name="name" required maxlength="36" value="Tuyến ${routes.length+1}"></label><label class="field">Số xe<select name="vehicles">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${n===2?'selected':''}>${n} xe · ${money(n*6000)}/tháng</option>`).join('')}</select></label><p>Giá tuyến tạm thời từ bản nền: 20 triệu ₫ + 120 triệu ₫/xe; vé 700 ₫. Bảng Phụ lục A sẽ thay thế ở Lệnh 4. Tuyến chưa nối đường vẫn trả chi phí xe cho đến khi ngừng tuyến.</p><div class="stop-list">${stops.length?stops.map(({i,t})=>`<label><input type="checkbox" name="stop" value="${i}"> Điểm ${i%SIZE+1}, ${Math.floor(i/SIZE)+1} <small>${t.connected?'Đã nối đường':'Chưa kết nối'}</small></label>`).join(''):'<p>Chưa có điểm dừng. Đóng bảng và xây điểm dừng trong nhóm Vận tải.</p>'}</div><p id="transitError" class="form-error" hidden role="alert"></p><button class="action primary full" type="submit">Mở tuyến · mua xe</button></form>`);
  $('transitForm').onsubmit=e=>{e.preventDefault();const fields=new FormData(e.currentTarget);const result=command('bus-line',{name:String(fields.get('name')),stops:fields.getAll('stop').map(Number),vehicles:Number(fields.get('vehicles'))});if(!result.ok){$('transitError').textContent=result.message;$('transitError').hidden=false;return;}changed();persist();renderer.lastPaths=-1;transit();toast('Đã mở tuyến xe buýt.');};
  $('busLines').querySelectorAll('[data-line]').forEach(b=>b.onclick=()=>{if(confirm('Ngừng tuyến này? Chi phí xe sẽ dừng, cư dân chuyển lại sang ô tô.')){command('remove-bus-line',{id:Number(b.dataset.line)});analyze(city);changed();persist();renderer.lastPaths=-1;transit();}});
}

function exportSave(){const blob=new Blob([JSON.stringify(serialize(city),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='build-city-26-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Đã xuất bản lưu thành phố.');}
function replaceCity(s,cloudRef=null){accumulator=0;tracked=null;watchDeparture=null;renderer.follow=null;city=s;restorePlayback();cityEpoch++;sync.use(user?.id||null,{cloud:cloudRef,dirty:!cloudRef});changeId++;localCollision=false;selected=null;renderer.reset();$('detailPanel').hidden=true;focusEmptyStart();persist();update();}
function backups(){
  let rows;try{rows=listLocalBackups(user?.id||'guest');}catch(error){toast(error.message);return;}
  showModal(`<span class="news-kicker">BẢN DỰ PHÒNG TRÊN THIẾT BỊ</span><h2>Tiến trình trước đây</h2><p>Bản dự phòng được giữ trước khi mở hoặc tạo thành phố khác. Khôi phục tạo một thành phố mới, không ghi đè bản đám mây.</p><div id="backupList">${rows.length?rows.map((r,i)=>`<div class="saved-city"><div><strong>${escape(r.name)}</strong><small>${new Date(r.modifiedAt).toLocaleString('vi-VN')}</small></div><button class="action" data-backup="${i}">Khôi phục</button><button class="action" data-export-backup="${i}">JSON</button><button class="delete-save" data-remove-backup="${i}" aria-label="Xóa bản dự phòng ${escape(r.name)}">×</button></div>`).join(''):'<p>Chưa có bản dự phòng.</p>'}</div>`);
  $('backupList').querySelectorAll('[data-backup]').forEach(b=>b.onclick=()=>{try{const raw=readLocalBackup(rows[Number(b.dataset.backup)].key,user?.id||'guest');const restored=validateSave(JSON.parse(raw).city);if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}if(confirm('Khôi phục bản này thành thành phố mới?')&&checkpoint()){replaceCity(restored);closeModal();toast('Đã khôi phục bản dự phòng.');}}catch(error){toast(error.message);}});
  $('backupList').querySelectorAll('[data-remove-backup]').forEach(b=>b.onclick=()=>{if(confirm('Xóa bản dự phòng trên thiết bị? Bản đám mây vẫn được giữ.')){try{removeLocalBackup(rows[Number(b.dataset.removeBackup)].key,user?.id||'guest');backups();}catch(error){toast(error.message);}}});
  $('backupList').querySelectorAll('[data-export-backup]').forEach(b=>b.onclick=()=>{try{const raw=readLocalBackup(rows[Number(b.dataset.exportBackup)].key,user?.id||'guest');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.download='build-city-26-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}catch(error){toast(error.message);}});
}
function graphics(){showModal(`<span class="news-kicker">ĐỒ HỌA RIÊNG BUILD CITY 26</span><h2>Chọn theo thiết bị</h2><label class="field">Renderer<select id="renderMode" aria-label="Renderer"><option value="3d" ${renderer.mode==='3d'?'selected':''}>3D · nhà và cư dân bằng mesh</option><option value="2d" ${renderer.mode==='2d'?'selected':''}>Canvas nhẹ · 2.5D</option></select></label><label class="field">Chất lượng 3D<select id="renderQuality" aria-label="Chất lượng 3D">${[['auto','Auto · điều chỉnh theo hiệu năng'],['low','Thấp · mục tiêu 30 FPS, tắt bóng'],['medium','Vừa · mục tiêu 60 FPS, nền nhẹ'],['high','Cao · mục tiêu 60 FPS, có bóng']].map(([v,label])=>`<option value="${v}" ${renderer.qualityPreference===v?'selected':''}>${label}</option>`).join('')}</select></label><p>Chuột/chạm kéo để di chuyển, cuộn/hai ngón để zoom. Bấm Xoay rồi kéo để đổi góc 3D; nút Nhìn trên chuyển góc từ trên xuống. Máy yếu chọn Thấp hoặc Canvas. Đổi renderer giữ nguyên thành phố và bản lưu.</p><button class="action primary full" id="graphicsApply">Áp dụng</button>`);$('graphicsApply').onclick=async()=>{const mode=$('renderMode').value,quality=$('renderQuality').value;$('graphicsApply').disabled=true;await renderer.setMode(mode);renderer.setQuality(quality);$('cameraView').hidden=renderer.mode!=='3d';$('cameraRotate').hidden=renderer.mode!=='3d';persist();closeModal();toast(renderer.notice||'Đã áp dụng đồ họa.');};}
function emptyStartReview(){
  showModal(`<span class="news-kicker">KHỞI ĐẦU MỚI</span><h2>Xây từ một bãi đất trống</h2><p>Giữ tên ${escape(city.name)} và địa hình hiện tại. Vốn khởi đầu <strong>${money(NEW_CITY_CASH_BC)}</strong>, chưa có nhà hoặc cư dân.</p><p>Thành phố hiện tại được giữ trong <strong>Bản dự phòng trên máy</strong> trước khi bắt đầu. Bạn có thể khôi phục từ menu. Bản lưu đám mây cũ vẫn được giữ.</p><div class="modal-actions"><button id="emptyStartCancel" class="action">Quay lại</button><button id="emptyStartConfirm" class="action primary">Bắt đầu với 100 triệu</button></div><p id="emptyStartError" class="form-error" role="alert"></p>`);
  $('emptyStartCancel').onclick=menu;
  $('emptyStartConfirm').onclick=()=>{if(sync.busy||libraryBusy){$('emptyStartError').textContent='Hãy chờ thao tác đang chạy.';return;}if(!checkpoint()){$('emptyStartError').textContent='Chưa tạo được bản dự phòng. Xuất JSON trước khi bắt đầu lại.';return;}replaceCity(createEmptyCity({world:city.world,name:city.name}));selectTool('inspect');closeModal();toast('Đã bắt đầu với 100 triệu. Thành phố cũ nằm trong Bản dự phòng trên máy.');};
}
function menu(){showModal(`<span class="news-kicker">BUILD CITY 26 · PHIÊN BẢN 0.4</span><h2>Thành phố của bạn</h2><label class="field">Tên thành phố<input id="menuCityName" maxlength="36" value="${escape(city.name)}"></label><p>Bản đồ 64 × 64 ô · 4.096 ô đất. Bản lưu tự động nằm trên thiết bị này. Đăng nhập để lưu và mở thành phố trên thiết bị khác.</p>${storageWarning?'<p class="storage-warning">Trình duyệt chưa lưu được dữ liệu. Hãy xuất bản lưu JSON để giữ tiến trình.</p>':''}<div class="modal-actions"><button id="menuSave" class="action primary">Lưu thành phố</button><button id="menuLibrary" class="action">${user?'Thành phố đã lưu':'Đăng nhập / Đăng ký'}</button><button id="menuExport" class="action">Xuất bản lưu JSON</button><button id="menuImport" class="action">Nhập bản lưu JSON</button><button id="menuBackups" class="action">Bản dự phòng trên máy</button><button id="menuGuide" class="action">Cách chơi</button><button id="menuVietnam" class="action">Bản đồ Việt Nam · 34 tỉnh/thành</button><button id="menuNew" class="action danger">Bắt đầu lại · đất trống</button></div><button class="action full" id="graphicsBtn">Đồ họa và camera</button><label class="toggle-row"><input type="checkbox" id="nightMode" ${renderer.night?'checked':''}> Ánh sáng ban đêm</label><p class="credit">Đồ họa, tên gọi và mã nguồn riêng của Build City 26. Không dùng tài nguyên hay dữ liệu từ game khác.</p>`);$('graphicsBtn').onclick=graphics; $('menuCityName').onchange=e=>{command('rename',{name:e.target.value});changed();persist();};$('menuSave').onclick=async()=>{closeModal();await manualSave();};$('menuLibrary').onclick=()=>user?library():authDialog();$('menuVietnam').onclick=vietnamMap;$('menuExport').onclick=exportSave;$('menuImport').onclick=()=>$('importFile').click();$('menuGuide').onclick=guide;$('menuBackups').onclick=backups;$('menuNew').onclick=()=>{if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}emptyStartReview();};$('nightMode').onchange=e=>renderer.night=e.target.checked;}
async function vietnamMap(){if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}const {showVietnamChooser}=await import('./game/geography/chooser.js');showVietnamChooser({showModal,closeModal,onError:toast,onStart:(pkg,manifest,name)=>{if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return false;}const next=createVietnamCity(pkg,manifest);next.name=name;if(!checkpoint()){toast('Chưa tạo được bản dự phòng. Hãy xuất JSON trước khi đổi thành phố.');return false;}replaceCity(next);document.dispatchEvent(new Event('bc26:play'));toast('Đã tạo thành phố trên địa hình '+pkg.region.provinceName+'.');return true;}});}
$('menuBtn').onclick=menu;
$('importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>2_000_000)throw new Error('Bản lưu quá lớn. Giới hạn 2 MB.');const raw=JSON.parse(await f.text());const s=validateSave(raw.city||raw);if(sync.busy||libraryBusy)throw new Error('Hãy chờ thao tác đang chạy.');if(confirm('Mở bản lưu này? Thành phố hiện tại sẽ được thay bằng bản nhập.')){if(!checkpoint())return;replaceCity(s);closeModal();toast('Đã nhập thành phố. Bản nhập được lưu như một thành phố mới.');}}catch(error){toast(error.message);}finally{e.target.value='';}};
function guide(){showModal(`<span class="news-kicker">CẨM NANG THỊ TRƯỞNG</span><h2>Bắt đầu xây thành phố</h2><ol class="guide-list"><li><b>Nối đường:</b> mở rộng từ mạng đường nối cổng phía tây. Kéo để xây từng đoạn. Đi qua sông sẽ tạo cầu với chi phí gấp 4.</li><li><b>Phân khu:</b> chọn nhà ở, thương mại hoặc công nghiệp rồi tô ô cạnh đường. Công trình tự mọc khi đủ điện, nước và nhu cầu.</li><li><b>Cấp điện và nước:</b> trạm phải cạnh đường kết nối. Trạm có giới hạn công suất và bán kính; xem bằng lớp bản đồ hoặc chọn công trình.</li><li><b>Chăm sóc dân cư:</b> xây công viên, trường học, y tế, rác thải và dịch vụ. Giữ nhà xưởng xa khu dân cư.</li><li><b>Cân đối ngân sách:</b> thuế tạo thu nhập, mỗi công trình có phí vận hành. Hạnh phúc và việc làm ảnh hưởng tăng dân số.</li><li><b>Lưu:</b> bản local tự lưu mỗi 15 giây. Với tài khoản đã mở một thành phố đám mây, game đồng bộ mỗi 60 giây. Nếu có xung đột, bản mới hơn được giữ.</li></ol><p>Chuột: kéo để di chuyển ở chế độ Khám phá, chuột phải để di chuyển khi xây, cuộn để phóng to. Điện thoại: một ngón kéo, hai ngón thu phóng. Phím 1–8 chọn công cụ, Space tạm dừng, Esc thoát xây dựng.</p><button id="guideDone" class="action primary full">Bắt đầu chơi</button>`);$('guideDone').onclick=closeModal;}

function authDialog(mode='login',notice='',draft=null){
  if(['reset','resend','recovery'].includes(mode))return legacyAuthDialog(mode,notice);
  if(!configured)return legacyAuthDialog(mode,notice);
  const titles={login:'Đăng nhập',register:'Tạo tài khoản',recover:'Khôi phục tài khoản',claim:'Đặt tên tài khoản',codes:'Tạo mã dự phòng mới'};
  const title=titles[mode];
  showModal(`<span class="news-kicker">TÀI KHOẢN BUILD CITY 26</span><h2>${title}</h2><p>${mode==='recover'?'Dùng mã dự phòng đã lưu khi đăng ký. Nếu mất cả mật khẩu và mã, bạn không thể tự khôi phục.':'Lưu thành phố và tiếp tục xây dựng trên thiết bị khác.'}</p>${notice?`<p class="form-notice" role="status">${escape(notice)}</p>`:''}${accountForm(mode,{startingPlaceName:draft?.placeName})}${mode==='login'?'<button class="link-button" id="accountRegister">Chưa có tài khoản? Đăng ký</button><button class="link-button" id="accountRecover">Quên mật khẩu</button><button class="link-button" id="accountLegacy">Tôi có tài khoản email từ bản cũ</button>':'<button class="link-button" id="accountLogin">Quay lại đăng nhập</button>'}<p class="credit">Tài khoản: 3–24 chữ a–z, số hoặc _. Mật khẩu ít nhất 8 ký tự; giữ nguyên chữ hoa và khoảng trắng.</p>`);
  if(['register','login'].includes(mode)){
    const body=$('modalBody'),card=body.innerHTML;
    body.innerHTML=`<div class="auth-intro"><div class="auth-brand">${icon('city',48)}<span>BUILD CITY <b>26</b></span></div><div class="auth-caption"><h2>${mode==='register'?'Thành phố mới bắt đầu từ bạn.':'Thành phố của bạn đang chờ.'}</h2><p>${mode==='register'?'Quy hoạch hôm nay. Phát triển ngày mai.':'Tiếp tục xây dựng những điều lớn lao.'}</p><span></span></div><small>Ảnh minh họa · Bắt đầu với 100 triệu đồng game</small></div><div class="auth-side"><button type="button" class="auth-home" id="authBackHome">Về trang chủ <span>↗</span></button><section class="auth-card">${mode==='register'?'<div class="auth-emblem">'+icon('city',40)+'</div>':''}${card}<p class="auth-save-note">${icon('save',17)}Tiến trình được lưu theo tài khoản</p></section></div>`;
    body.querySelector('h2:not(.auth-caption h2)').textContent=mode==='register'?'Tạo thành phố của bạn':'Chào mừng trở lại';
    modal.classList.add('auth-layout','account-dialog');
    $('authBackHome').onclick=()=>{closeModal();document.dispatchEvent(new Event('bc26:home'));};
    modal.addEventListener('close',()=>modal.classList.remove('auth-layout','account-dialog'),{once:true});
  }
  if(mode==='register'){
    if(draft)for(const key of ['cityName','username'])$('accountForm').elements[key].value=draft[key]||'';
    $('accountPlace').onclick=async()=>{
      const fields=new FormData($('accountForm'));
      // Keep names and locality in memory; a password is cleared when switching screens.
      const next={...draft,cityName:String(fields.get('cityName')||''),username:String(fields.get('username')||'')};
      const {showVietnamChooser}=await import('./game/geography/chooser.js');
      const restore=choice=>setTimeout(()=>authDialog('register','Đã trở lại đăng ký. Nhập mật khẩu để tiếp tục.',choice),0);
      showVietnamChooser({showModal,closeModal,onError:toast,selectionOnly:true,onCancel:()=>restore(next),onStart:pkg=>{restore({...next,regionId:pkg.region.id,placeName:pkg.region.name+' · '+pkg.region.provinceName});return true;}});
    };
  }
  if($('accountRegister'))$('accountRegister').onclick=()=>authDialog('register');
  if($('accountRecover'))$('accountRecover').onclick=()=>authDialog('recover');
  if($('accountLegacy'))$('accountLegacy').onclick=()=>legacyAuthDialog();
  if($('accountLogin'))$('accountLogin').onclick=()=>user?library():authDialog();
  if($('accountShowPassword'))$('accountShowPassword').onclick=e=>{const input=$('accountForm').elements.password,on=input.type==='password';input.type=on?'text':'password';e.currentTarget.setAttribute('aria-label',on?'Ẩn mật khẩu':'Hiện mật khẩu');e.currentTarget.setAttribute('aria-pressed',String(on));};
  $('accountForm').onsubmit=async e=>{
    e.preventDefault();const form=e.currentTarget,fields=new FormData(form),button=$('accountSubmit'),errorEl=$('accountError');button.disabled=true;button.textContent='Đang xử lý…';errorEl.hidden=true;
    try{
      if(sync.busy||libraryBusy)throw new Error('Hãy chờ thao tác lưu đang chạy.');
      if(['register','login'].includes(mode)&&!checkpoint())throw new Error('Hãy xuất bản lưu JSON để giữ tiến trình trước khi đổi tài khoản.');
      const username=String(fields.get('username')||''),payload={username};
      if(mode!=='claim')payload.password=String(fields.get('password')||'');
      if(mode==='register'){payload.cityName=String(fields.get('cityName')||'');payload.requestId=registrationRequest(username);payload.regionId=draft?.regionId||null;}
      if(mode==='recover')payload.code=String(fields.get('code')||'');
      let token=null;if(['claim','codes'].includes(mode)){const {data}=await supabase.auth.getSession();token=data.session?.access_token;}
      const data=await accountRequest(mode,payload,token);
      form.elements.password&&(form.elements.password.value='');
      if(mode==='recover'){await supabase.auth.signOut({scope:'local'});handleSession(null,'SIGNED_OUT');showRecoveryCode(data.recoveryCode,()=>authDialog('login','Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.'));return;}
      if(['claim','codes'].includes(mode)){showRecoveryCode(data.recoveryCode,()=>library(),token);return;}
      const session=await acceptAccountSession(supabase,data);handleSession(session,'SIGNED_IN');
      if(mode==='register'){
        try{const row=await loadCity(data.firstCity);replaceCity(validateSave(row.state),{id:row.id,revision:Number(row.revision)});}catch{toast('Tài khoản đã tạo. Thành phố đầu tiên đã lưu; hãy mở trong thư viện.');}
        if(!data.recoveryCode){try{sessionStorage.removeItem('bc26-register-request');}catch{}}
        if(data.recoveryCode){showRecoveryCode(data.recoveryCode,()=>{document.dispatchEvent(new Event('bc26:play'));closeModal();toast('Đã tạo tài khoản và thành phố đầu tiên.');},session.access_token);return;}
      }
      document.dispatchEvent(new Event('bc26:play'));closeModal();toast('Đăng nhập thành công.');void library();
    }catch(error){if(errorEl.isConnected){errorEl.textContent=authMessage(error);errorEl.hidden=false;}}
    finally{if(button.isConnected){button.disabled=false;button.textContent=title;}}
  };
}
function showRecoveryCode(code,done,token=null){
  showModal(`<span class="news-kicker">GIỮ MÃ NÀY Ở NƠI AN TOÀN</span><h2>Mã dự phòng của bạn</h2><p>Mã dùng để đặt lại mật khẩu, mỗi mã chỉ dùng một lần. Không gửi cho người khác. Game không lưu mã này trong bản lưu hoặc bộ nhớ trình duyệt.</p><label class="field">Mã dự phòng<textarea id="recoveryCode" readonly rows="3">${escape(code)}</textarea></label><button class="action" id="recoveryCopy">Sao chép mã</button><label class="toggle-row"><input id="recoveryKept" type="checkbox"> Tôi đã lưu mã ở nơi an toàn</label><p id="recoveryNotice" role="status"></p><button class="action primary full" id="recoveryContinue" disabled>Tiếp tục</button>`);
  $('recoveryCopy').onclick=async()=>{try{await navigator.clipboard.writeText(code);$('recoveryNotice').textContent='Đã sao chép. Hãy lưu mã trước khi tiếp tục.';}catch{$('recoveryNotice').textContent='Hãy chọn và sao chép mã trong ô phía trên.';}};
  $('recoveryKept').onchange=e=>$('recoveryContinue').disabled=!e.target.checked;
  $('recoveryContinue').onclick=async()=>{const b=$('recoveryContinue');b.disabled=true;if(token){try{await accountRequest('ack',{},token);}catch{$('recoveryNotice').textContent='Chưa xác nhận được với máy chủ. Mã vẫn dùng được; hãy giữ mã và thử lại.';b.disabled=false;return;}}try{sessionStorage.removeItem('bc26-register-request');}catch{}$('recoveryCode').value='';done();};
}
function legacyAuthDialog(mode='login',notice=''){
  if(mode==='signup')return authDialog('register',notice);
  if(!configured){showModal(`<span class="news-kicker">TÀI KHOẢN BUILD CITY 26</span><h2>Chưa kết nối Supabase</h2><p>Bạn vẫn có thể chơi và lưu trên thiết bị. Cấu hình Supabase theo README để bật tài khoản.</p><button class="action primary full" id="authLocal">Tiếp tục chơi</button>`);$('authLocal').onclick=closeModal;return;}
  const titles={login:'Đăng nhập',signup:'Tạo tài khoản',reset:'Quên mật khẩu',resend:'Gửi lại email xác nhận',recovery:'Đặt mật khẩu mới'};
  const title=titles[mode],emailOnly=['reset','resend'].includes(mode);
  showModal(`<span class="news-kicker">TÀI KHOẢN BUILD CITY 26</span><h2>${title}</h2><p>${mode==='recovery'?'Nhập mật khẩu mới để tiếp tục chơi.':'Lưu thành phố và tiếp tục xây dựng trên thiết bị khác.'}</p>${notice?`<p class="form-notice" role="status">${escape(notice)}</p>`:''}<form id="authForm">${mode==='signup'?'<label class="field">Tên hiển thị<input name="displayName" maxlength="40" autocomplete="nickname" required placeholder="Tên của bạn"></label>':''}${mode!=='recovery'?'<label class="field">Email<input name="email" type="email" autocomplete="email" required placeholder="ban@email.com"></label>':''}${!emailOnly?`<label class="field">Mật khẩu<input name="password" type="password" autocomplete="${mode==='login'?'current-password':'new-password'}" minlength="${mode==='login'?1:8}" required placeholder="${mode==='login'?'Mật khẩu của bạn':'Ít nhất 8 ký tự'}"></label>`:''}${['signup','recovery'].includes(mode)?'<label class="field">Nhập lại mật khẩu<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required></label>':''}<p id="authError" class="form-error" role="alert" hidden></p><button class="action primary full" id="authSubmit" type="submit">${title}</button></form>${mode==='login'?'<button id="authNew" class="link-button">Tạo tài khoản mới bằng tên đăng nhập</button><button id="authReset" class="link-button">Quên mật khẩu</button><button id="authResend" class="link-button">Gửi lại email xác nhận</button>':mode!=='recovery'?'<button id="authSwitch" class="link-button">Quay lại đăng nhập</button>':''}<p class="credit">Email xác nhận / đặt lại mật khẩu: mở liên kết trong cùng trình duyệt đã gửi yêu cầu.</p>`);
  if($('authSwitch'))$('authSwitch').onclick=()=>legacyAuthDialog('login');
  if($('authNew'))$('authNew').onclick=()=>authDialog('register');
  if($('authReset'))$('authReset').onclick=()=>legacyAuthDialog('reset');
  if($('authResend'))$('authResend').onclick=()=>legacyAuthDialog('resend');
  $('authForm').onsubmit=async e=>{
    e.preventDefault();const form=e.currentTarget,fields=new FormData(form),submit=$('authSubmit'),errorEl=$('authError');
    submit.disabled=true;submit.textContent='Đang xử lý…';errorEl.hidden=true;
    try{
      const data=await authenticate(supabase,mode,{email:String(fields.get('email')||'').trim(),password:String(fields.get('password')||''),confirmPassword:fields.get('confirmPassword'),displayName:String(fields.get('displayName')||'').trim()},location.origin+'/');
      if(!form.isConnected)return;
      if(mode==='signup'&&!data.session){legacyAuthDialog('login','Đã gửi email xác nhận. Mở email và bấm liên kết để hoàn tất đăng ký.');return;}
      if(emailOnly){legacyAuthDialog('login',mode==='reset'?'Nếu email có tài khoản, bạn sẽ nhận liên kết đặt lại mật khẩu.':'Nếu tài khoản cần xác nhận, bạn sẽ nhận được email mới.');return;}
      if(mode==='recovery'){recoveryMode=false;$('accountBtn').textContent='Tài khoản';closeModal();toast('Đã đổi mật khẩu.');return;}
      handleSession(data.session,'SIGNED_IN');document.dispatchEvent(new Event('bc26:play'));closeModal();toast(mode==='signup'?'Đã tạo tài khoản.':'Đăng nhập thành công.');void library();
    }catch(error){if(errorEl.isConnected){errorEl.textContent=authMessage(error);errorEl.hidden=false;}}
    finally{if(submit.isConnected){submit.disabled=false;submit.textContent=title;}}
  };
}

async function cloudSave(forceNew=false,quiet=false){
  if(!user||!supabase||localCollision)return false;
  if(forceNew&&!checkpoint())return false;
  if(sync.busy||libraryBusy){if(!quiet)toast('Đang xử lý thành phố. Hãy chờ một chút.');return false;}
  const result=await sync.save({forceNew});
  if(!result&&!quiet)toast(sync.conflict?'Bản lưu đã thay đổi trên thiết bị khác. Mở Tài khoản để xử lý.':sync.error?authMessage(sync.error):navigator.onLine?'Chưa đồng bộ. Tiến trình được giữ trên máy.':'Đang mất mạng. Bản lưu sẽ gửi lại khi có mạng.');
  return result;
}
async function manualSave(){if(!persist()){toast('Không lưu được trên thiết bị. Bạn có thể xuất bản lưu JSON.');return;}if(user){if(await cloudSave())toast('Đã lưu thành phố vào Supabase.');}else toast('Đã lưu trên thiết bị. Đăng nhập để lưu đám mây.');}
$('saveBtn').onclick=manualSave;
$('accountBtn').onclick=()=>recoveryMode?authDialog('recovery'):user?library():authDialog();
async function library(){
  if(!user){authDialog();return;}
  const owner=user.id,epoch=cityEpoch;
  showModal(`<span class="news-kicker">TÀI KHOẢN BUILD CITY 26</span><h2>Thành phố đã lưu</h2>${sync.conflict?'<div class="conflict-panel"><strong>Bản đám mây đã thay đổi</strong><p>Giữ tiến trình này bằng JSON hoặc lưu thành bản mới. Chọn Mở để tải bản mới từ máy chủ.</p><button id="conflictExport" class="action">Xuất JSON</button></div>':''}<p id="libraryStatus" role="status">Đang tải danh sách…</p><div id="cityList"></div><div class="modal-actions"><button id="librarySave" class="action primary">Lưu thành phố hiện tại</button><button id="libraryCopy" class="action">Lưu thành bản mới</button><button id="libraryNew" class="action">Thành phố mới</button><button id="libraryBackups" class="action">Bản dự phòng trên máy</button><button id="libraryRefresh" class="action">Tải lại danh sách</button></div><button id="accountCodes" class="action" hidden>Tạo mã dự phòng mới</button><button id="claimUsername" class="link-button" hidden>Đặt tên tài khoản cho tài khoản email cũ</button><button id="signoutBtn" class="link-button">Đăng xuất trên thiết bị này</button>`);
  const status=$('libraryStatus'),list=$('cityList');
  const active=()=>user?.id===owner&&cityEpoch===epoch&&status.isConnected&&modal.open;
  if($('conflictExport'))$('conflictExport').onclick=exportSave;
  $('librarySave').disabled=sync.conflict;
  const save=async(forceNew,button)=>{button.disabled=true;if(await cloudSave(forceNew)){toast('Đã lưu thành phố.');if(active())void library();}else if(button.isConnected)button.disabled=sync.conflict&&!forceNew;};
  $('librarySave').onclick=e=>save(false,e.currentTarget);$('libraryCopy').onclick=e=>save(true,e.currentTarget);
  $('libraryBackups').onclick=backups;$('libraryRefresh').onclick=library;
  $('libraryNew').onclick=()=>{if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}if(confirm('Tạo thành phố mới? Tiến trình hiện tại sẽ được giữ trong bản dự phòng.')&&checkpoint()){replaceCity(createEmptyCity());closeModal();}};
  $('signoutBtn').onclick=async e=>{
    if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}if(!persist()){toast('Hãy xuất JSON để giữ tiến trình trước khi đăng xuất.');return;}
    const button=e.currentTarget;button.disabled=true;
    const {error}=await supabase.auth.signOut({scope:'local'});
    if(error){toast(authMessage(error));if(button.isConnected)button.disabled=false;return;}
    handleSession(null,'SIGNED_OUT');closeModal();toast('Đã đăng xuất. Bản lưu đám mây vẫn được giữ.');
  };
  try{
    const rows=await listCities();if(!active())return;
    const profile=await supabase.from('profiles').select('username').eq('user_id',owner).maybeSingle();if(!active())return;
    if(profile.data?.username){document.querySelector('#modal .news-kicker').textContent=profile.data.username;$('accountCodes').hidden=false;$('accountCodes').onclick=()=>authDialog('codes','Mã cũ sẽ hết hiệu lực. Nhập tài khoản và mật khẩu để tạo mã mới, kể cả khi đã mất mã cũ.');}else if(user.email&&!user.email.endsWith('@accounts.buildcity26.invalid')){$('claimUsername').hidden=false;$('claimUsername').onclick=()=>authDialog('claim');}
    status.textContent=rows.length?`${rows.length} thành phố · chọn Mở để tiếp tục`:'Bạn chưa có thành phố trên đám mây. Lưu thành phố hiện tại để tạo bản đầu tiên.';
    list.innerHTML=rows.map(r=>`<div class="saved-city"><div><strong>${escape(r.name)}</strong><small>${new Date(r.updated_at).toLocaleString('vi-VN')} · Bản ${r.revision}</small></div><button class="action" data-load="${escape(r.id)}">Mở</button><button class="delete-save" data-delete="${escape(r.id)}" title="Xóa bản lưu" aria-label="Xóa bản lưu ${escape(r.name)}">×</button></div>`).join('');
    list.querySelectorAll('[data-load]').forEach(button=>button.onclick=async()=>{
      if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}
      if(sync.dirty&&!confirm('Mở bản đám mây? Tiến trình hiện tại sẽ được giữ trong bản dự phòng.'))return;
      if(!checkpoint())return;
      libraryBusy=true;button.disabled=true;
      try{const row=await loadCity(button.dataset.load);if(!active())return;const restored=validateSave(row.state);replaceCity(restored,{id:row.id,revision:Number(row.revision)});closeModal();toast('Đã mở '+restored.name);}
      catch(error){if(active())toast(authMessage(error));}finally{libraryBusy=false;if(button.isConnected)button.disabled=false;}
    });
    list.querySelectorAll('[data-delete]').forEach(button=>button.onclick=async()=>{
      if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}
      if(!confirm('Xóa vĩnh viễn bản lưu đám mây này?'))return;
      const ref=rows.find(row=>row.id===button.dataset.delete);
      if(sync.cloud?.id===ref.id&&!checkpoint())return;
      libraryBusy=true;button.disabled=true;
      try{await deleteCity(ref.id,Number(ref.revision));if(!active())return;if(sync.cloud?.id===ref.id){sync.use(owner);persist();}libraryBusy=false;void library();}
      catch(error){if(active()){toast(authMessage(error));if(button.isConnected)button.disabled=false;}}finally{libraryBusy=false;}
    });
  }catch(error){if(active())status.textContent=authMessage(error);}
}

let authOwner=null;
function handleSession(session,event){
  const next=session?.user||null;
  if(event==='PASSWORD_RECOVERY')recoveryMode=true;
  if(!next)recoveryMode=false;
  if(authOwner!==(next?.id||null)){
    const guestCity=!user&&next?city:null;persist();authOwner=next?.id||null;user=next;
    let saved=null;storageBlocked=false;
    try{saved=loadLocal(next?.id||'guest');city=saved?.city||guestCity||createEmptyCity();if(saved?.migrated){try{archiveLocal(next?.id||'guest');}catch{storageBlocked=true;storageWarning=true;storageError='Đã mở bản cũ; bộ nhớ đầy, hãy xuất JSON và quản lý bản dự phòng trước khi lưu.';}}}catch{try{archiveLocal(next?.id||'guest');}catch{storageBlocked=true;}city=guestCity||createEmptyCity();storageWarning=true;}
    restorePlayback();sync.use(next?.id||null,saved||{});accumulator=0;tracked=null;renderer.follow=null;localCollision=false;cityEpoch++;changeId++;selected=null;renderer.reset();update();
    // Close an old account's library immediately on a cross-tab auth change.
    if(modal.open&&$('libraryStatus')&&!recoveryMode)closeModal();
  }else user=next;
  $('accountBtn').textContent=recoveryMode?'Đặt mật khẩu':user?'Tài khoản':'Đăng nhập';$('accountBtn').title=user?'Mở thành phố của tài khoản':'Đăng nhập để lưu đám mây';renderSaveStatus();
  if(event==='PASSWORD_RECOVERY')authDialog('recovery');
}
if(supabase){observeSession(supabase,handleSession,error=>toast(authMessage(error)));}
const callbackError=new URLSearchParams(location.hash.slice(1)).get('error_description')||new URLSearchParams(location.search).get('error_description');
if(callbackError){authDialog('login',authMessage({message:callbackError}));history.replaceState(null,'',location.pathname);}
window.addEventListener('offline',()=>{if(user){sync.status='offline';renderSaveStatus();}persist();});
window.addEventListener('online',()=>{if(user&&(sync.cloud||sync.pending)&&sync.dirty&&!sync.conflict&&!localCollision)void cloudSave(false,true);else renderSaveStatus();});
window.addEventListener('storage',event=>{if(event.key===localKey(user?.id||'guest')&&event.newValue){localCollision=true;renderSaveStatus();toast('Tiến trình local đã thay đổi ở tab khác. Xuất JSON để giữ bản đang chơi rồi tải lại trang.');}});

function loop(ms){
  const dt=Math.max(0,(ms-lastMs)/1000);lastMs=ms;
  if(!document.hidden&&document.body.dataset.screen!=='home'&&!modal.open&&speed){
    accumulator+=simulationDelta(dt,city.playback);
    const before=city.day,beforeLevel=levelFromXp(city.progression.xp);
    let stop=false;const batch=consumeSteps(accumulator,()=>{stepSimulation(city);if(watchDeparture&&city.citizens.find(c=>c.id===watchDeparture)?.journey){watchDeparture=null;observe=true;setSpeed(1);$('observeBtn').classList.add('active');stop=true;toast('Chuyến đi bắt đầu — đã chuyển sang Quan sát.');return false;}},120);accumulator=stop?0:batch.remaining;
    if(levelFromXp(city.progression.xp)>beforeLevel)toast(`Lên cấp ${levelFromXp(city.progression.xp)} · +${money((levelFromXp(city.progression.xp)-beforeLevel)*100000)} thưởng!`);
    if(batch.count){changeId++;sync.changed();if(ms-(loop.lastUpdate||0)>250||city.day!==before){update();renderSaveStatus();loop.lastUpdate=ms;}}
  }
  renderer.renderAlpha=!document.hidden&&document.body.dataset.screen!=='home'&&!modal.open&&speed?Math.max(.00001,accumulator/STEP_SECONDS):0;
  requestAnimationFrame(loop);
}
lastMs=performance.now();requestAnimationFrame(loop);setInterval(persist,15000);setInterval(()=>{if(user&&(sync.cloud||sync.pending)&&sync.dirty&&!sync.busy&&!sync.conflict&&!libraryBusy&&!localCollision)void cloudSave(false,true);},60000);window.addEventListener('beforeunload',persist);
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();lastMs=performance.now();});
update();
$('cameraView').hidden=renderer.mode!=='3d';$('cameraRotate').hidden=renderer.mode!=='3d';
$('loading').hidden=true;const rendererNotice=renderer.notice;if(rendererNotice)toast(rendererNotice);
if(storageWarning)toast(storageError||'Chưa lưu được trên thiết bị. Hãy xuất JSON để giữ tiến trình.');

// Optional browser-native agent tools, using exactly the same game actions.
if(document.modelContext?.registerTool){
  const controller=new AbortController();
  const registrations=[{name:'read_renderer_status',description:'Read actual renderer mode, quality, GPU resource counts and visible rendering statistics for development QA.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>renderer.stats()},{
    name:'read_city_status',description:'Read the current Build City 26 simulation and selected city.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({name:city.name,day:city.day,seconds:city.clock.seconds,playback:{...city.playback},money:Math.round(city.money),...city.metrics,geography:city.world.geography?{mode:'vietnam',province:city.world.geography.provinceName,region:city.world.geography.regionId,version:city.world.geography.version,anchor:city.world.geography.anchor,entryTile:city.world.geography.entryTile,widthMeters:city.world.widthMeters,cellMeters:city.world.cellMeters,osmDate:city.world.geography.osmDate}:null})
  },{
    name:'build_city_tiles',description:'Build up to 100 city tiles using the same costs and validation as the visible game.',inputSchema:{type:'object',properties:{kind:{type:'string',enum:Object.keys(CATALOG).filter(k=>k!=='inspect'&&k!=='bulldoze')},tiles:{type:'array',minItems:1,maxItems:100,items:{type:'object',properties:{x:{type:'integer',minimum:0,maximum:SIZE-1},y:{type:'integer',minimum:0,maximum:SIZE-1}},required:['x','y'],additionalProperties:false}}},required:['kind','tiles'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{
      if(!input||!CATALOG[input.kind]||['bulldoze','inspect'].includes(input.kind)||!Array.isArray(input.tiles)||input.tiles.length<1||input.tiles.length>100||input.tiles.some(t=>!t||!Number.isInteger(t.x)||!Number.isInteger(t.y)||t.x<0||t.y<0||t.x>=SIZE||t.y>=SIZE))throw new Error('Invalid tool input');
      const results=input.tiles.map(t=>({x:t.x,y:t.y,...command(input.kind==='park'?'construct':'place',{x:t.x,y:t.y,kind:input.kind})}));changed();renderer.lastPaths=-1;persist();return {results,money:Math.round(city.money)};
    }
  }];
  for(const registration of registrations){try{Promise.resolve(document.modelContext.registerTool(registration,{signal:controller.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>controller.abort(),{once:true});
}

const stateLabel={home:'Ở nhà',sleeping:'Đang ngủ',walking:'Đi bộ', 'in-vehicle':'Trên xe', 'at-work':'Tại nơi làm việc',blocked:'Bị chặn'};
function trackCitizen(id){hideOverviewOnPhone();tracked=id;selected=null;renderer.selected=null;renderer.follow=id;selectToolForTracking();inspectCitizen(id);}
function selectToolForTracking(){tool='inspect';renderer.tool='inspect';$('toolTray').hidden=true;$('toolInfo').hidden=true;}
function inspectCitizen(id){
  const c=city.citizens.find(c=>c.id===id);if(!c){tracked=null;renderer.follow=null;return;}
  const j=c.journey,work=city.firms.find(f=>f.id===c.work),v=city.vehicles.find(v=>v.id===c.vehicle);
  $('detailPanel').hidden=false;$('detailTitle').textContent='THEO DÕI CƯ DÂN';$('detailPanel').classList.add('inspect');
  $('detailBody').innerHTML=`<h2 class="news-title">${escape(c.name)}</h2><p class="badge">${stateLabel[c.state]}</p><div class="detail-list"><div><span>ID · tuổi</span><b>${escape(c.id)} · ${c.age}</b></div><div><span>Hộ</span><b>${escape(c.household)}</b></div><div><span>Nhà</span><b>${c.home%SIZE+1}, ${Math.floor(c.home/SIZE)+1}</b></div><div><span>Nơi làm việc</span><b>${work?`${work.home%SIZE+1}, ${Math.floor(work.home/SIZE)+1}`:'Chưa có việc / không thuộc tuổi lao động'}</b></div><div><span>Mục tiêu</span><b>${c.goal===c.home?'Về nhà':'Đến nơi làm việc'}</b></div><div><span>Vị trí mét</span><b>${c.position.x.toFixed(1)} · ${c.position.y.toFixed(1)}</b></div><div><span>Hành trình</span><b>${j?`${j.mode==='car'?'Ô tô':'Đi bộ'} · đoạn ${j.segment+1}/${j.path.length-1}`:'Không đang di chuyển'}</b></div><div><span>Xe</span><b>${v?escape(v.id)+' · '+escape(v.state):'Không có'}</b></div><div><span>Đã đến làm</span><b>${c.attendance} lần</b></div></div>${c.waitReason?`<p class="warn">${escape(c.waitReason)}</p>`:''}<p>Lịch ngày thường: rời nhà ${formatTime(c.schedule.depart)}, về ${formatTime(c.schedule.return)}. Đây là nền lịch/route; chưa có mua hàng, trường và crossing.</p><button class="action full" id="toggleTracking">${renderer.follow?'Dừng camera theo dõi':'Theo dõi bằng camera'}</button><button class="action full" id="watchDeparture" ${!c.work?'disabled':''}>Quan sát chuyến tiếp theo</button>`;
  $('watchDeparture').onclick=()=>{watchDeparture=id;observe=false;accumulator=0;setSpeed(8);toast('Đang chờ chuyến tiếp theo; sẽ tự chuyển sang tốc độ tự nhiên khi rời đi.');};
  $('toggleTracking').onclick=()=>{renderer.follow=renderer.follow?null:id;inspectCitizen(id);};
}
function formatTime(seconds){return String(Math.floor(seconds/3600)).padStart(2,'0')+':'+String(Math.floor(seconds%3600/60)).padStart(2,'0');}
$('observeBtn').onclick=()=>{watchDeparture=null;observe=!observe;accumulator=0;$('observeBtn').classList.toggle('active',observe);setSpeed(1);update();toast(observe?'Quan sát: thời gian mô phỏng chạy như đồng hồ thật.':'Chế độ chơi: 1 giây thực = 5 giây game; 1 ngày game = 4 giờ 48 phút thực.');};
$('residentsBtn').onclick=()=>{
  showModal(`<span class="news-kicker">THỰC THỂ TRONG THÀNH PHỐ</span><h2>${city.citizens.length} cư dân · ${city.households.length} hộ</h2><p>Chọn một người, camera theo đúng ID. Chuyển sang Quan sát để xem vận tốc tự nhiên. Không có người hoặc xe được sinh riêng cho renderer.</p><div class="resident-list">${city.citizens.slice(0,100).map(c=>`<button class="action" data-person="${c.id}">${escape(c.name)} · ${stateLabel[c.state]}</button>`).join('')}</div>`);
  $('modalBody').querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>{closeModal();trackCitizen(b.dataset.person);});
};

return {startBuilding(){if(user){document.dispatchEvent(new Event('bc26:play'));lastMs=performance.now();}else authDialog('register');},enterGame(){lastMs=performance.now();if(firstEntry&&city.metrics.roadCount<10){firstEntry=false;const entry=city.world.geography?.entryTile??index(0,18);renderer.focusTile(Math.min(SIZE-1,entry%SIZE+4),Math.floor(entry/SIZE));}},openAccount:authDialog,openGeography:vietnamMap,openGuide:guide,openMissions:()=>$('missionBtn').click(),openSaves:()=>user?library():authDialog()};
}
export const gameReady=startGame().catch(error=>{document.getElementById('loading').hidden=true;document.getElementById('toast').hidden=false;document.getElementById('toast').textContent='Không mở được game. Hãy tải lại trang; bản lưu trên máy vẫn được giữ.';console.error(error);throw error;});
