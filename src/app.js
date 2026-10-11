import {PerformanceSample} from './benchmark/metrics.js';
import {LANDMARKS} from './config/landmarks.js';
import {landmarkThumbnail} from './ui/mesh-thumbnail.js';
import {ROAD_PROFILES,ROAD_KINDS,DIRECTION_VECTORS,ROAD_MODE_LABELS,roadProfile} from './config/road-profiles.js';
import {isJunction,junctionState,junctionQueues} from './game/systems/junctions.js';
import './ui/refresh/bc26-ui.css';
import './ui/refresh/game-hud.css';
import {createCityHud} from './ui/refresh/bc26-hud.js';
import {makeHudSnapshot,HUD_CATALOGUE,hudMoney} from './ui/hud-snapshot.js';
import {MissionQueue,missionRequest} from './services/missions.js';
import {cityLevel,progressionXp,lifetimeXp} from './game/systems/campaign.js';
import {encodeCity} from './services/city-codec.js';
import {createInterfaceAudio} from './ui/interface-audio.js';
import {catalogFavorites,toggleCatalogFavorite} from './ui/catalog-preferences.js';
import {cityMenuMarkup} from './ui/city-menu.js';
import {populationStatus,arrivalConditions} from './game/systems/resident-arrivals.js';
import {placementQuote} from './game/systems/placement.js';
import {FinanceQueue,financeError} from './services/finance-queue.js';
import {weatherState} from './game/systems/weather.js';
import {privateBuildPrice,privatePlan,PRIVATE_DESIGNS,PRIVATE_PLANS,placementPrice,residentCapacity,jobsCapacity,capacityFactor,MAINTENANCE_FACTORS} from './config/building-economy.js';
import {developmentConditions} from './game/systems/development.js';
import {upgradeQuote} from './game/systems/upgrades.js';
import {MobilityArtRegistry,MOBILITY_GROUPS,citizenArtId,vehicleArtId,mobilityMeshStatus,mobilityRuntimeStatus} from './config/mobility-art.js';
import {mobilityThumbnail,hydrateMobilityThumbnails,mobilityThumbnailCacheStats} from './ui/mobility-thumbnails.js';
import {buildingThumbnail,hydrateBuildingThumbnails,thumbnailCacheStats} from './ui/building-thumbnails.js';
import {buildingDesign} from './game/render/building-designs.js';
import {createVietnamCity,geographyBuildRule} from './game/geography/city.js';
import {MISSIONS,MAX_CITY_LEVEL,levelFromXp,xpForLevel} from './config/progression.js';
import {missionViews} from './game/systems/progression.js';
import { formatMoney } from './config/money.js';
import { PLAY_SECONDS_PER_SECOND, STEP_SECONDS, WATER_PER_PERSON, LEGACY_BC_FACTOR, NEW_CITY_CASH_BC } from './config/simulation.js';
import { consumeSteps, calendar, simulationDelta } from './game/systems/clock.js';
import { createCity, createEmptyCity, analyze, stepSimulation, executeCommand, place, serialize, validateSave, CATALOG, SIZE, index, isRoad, addBusLine, borrow, repay } from './game/core.js';
import { createRenderer } from './game/render/renderer-host.js';
import {surfaceHeight,slopeAt} from './game/systems/terrain.js';
import { saveLocal, loadLocal, localEnvelope, localKey } from './services/local-storage.js';
import { supabase, configured, authMessage, listCities, loadCity, saveCity, deleteCity, replaceCloudCity } from './services/supabase.js';

import {CityReplacement} from './services/city-replacement.js';
import {BackupStore} from './services/backup-store.js';
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
const interfaceAudio=createInterfaceAudio();
document.addEventListener('click',e=>{if(e.target.closest('button'))void interfaceAudio.play();});
window.addEventListener('pagehide',()=>interfaceAudio.dispose());
const crosshair='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/></svg>';
let city=createEmptyCity(),user=null,changeId=0,cityEpoch=0,storageWarning=false,storageBlocked=false,recoveryMode=false,libraryBusy=false,localCollision=false,financeBusy=false,missionBusy=false;
const financeQueue=new FinanceQueue({storage:localStorage,send:async request=>{const {data,error}=await supabase.rpc('bc26_finance_order',{p_city_id:request.city,p_revision:request.revision,p_request_id:request.requestId,p_order:request.order,p_round:request.round});if(error)throw error;return data;}});
function financePending(){try{return user&&sync.cloud?financeQueue.pending(user.id,sync.cloud.id):null;}catch{return {corrupt:true};}}
const backupStore=new BackupStore();
let checkpointBusy=false,replacementReview=false;
const cityReplacement=new CityReplacement({send:replaceCloudCity});
const sync=new CloudSync({snapshot:()=>serialize(city),send:saveCity,persist:()=>persist(),notify:()=>renderSaveStatus(),online:()=>navigator.onLine});
const missionQueue=new MissionQueue({storage:localStorage,send:request=>missionRequest(supabase,request)});
function missionPending(){try{return user&&sync.cloud?missionQueue.pending(user.id,sync.cloud.id):null;}catch{return {corrupt:true};}}
let observe=false,tracked=null,watchDeparture=null,firstEntry=true;
function command(type,payload){if(checkpointBusy||replacementReview)return {ok:false,message:'Đang giữ tiến trình. Chờ một chút.'};if(missionBusy||missionPending())return {ok:false,message:'Nhiệm vụ đang chờ đối soát. Mở Nhiệm vụ để thử lại.'};if(financeBusy||financePending())return {ok:false,message:'Sổ tiền đang chờ đối soát. Mở Cổ phiếu & xổ số để thử lại.'};const seq=city.commandSequence+1;return executeCommand(city,{id:`command-${seq}`,sequence:seq,type,payload});}
let speed=1,lastMs=performance.now(),accumulator=0,tool='inspect',group='inspect',selected=null,blueprint=null;
let toastTimer,hud=null;
let storageError='';
try{const saved=loadLocal();if(saved){city=saved.city;if(saved.migrated){try{await backupStore.archiveLocal('guest');}catch(e){storageBlocked=true;storageWarning=true;storageError='Đã mở bản cũ nhưng bộ nhớ đầy, chưa tạo được dự phòng. Xuất JSON hoặc quản lý bản dự phòng trước khi lưu.';}}}}catch(e){try{await backupStore.archiveLocal('guest');}catch{storageBlocked=true;}storageWarning=true;storageError='Không mở được bản lưu: '+e.message;}
speed=city.playback.paused?0:city.playback.multiplier;observe=city.playback.observe;
const renderer=await createRenderer($('world'),$('mini'),()=>city);
function focusEmptyStart(){if(city.metrics.roadCount!==0)return;const entry=city.world.geography?.entryTile??index(0,18);renderer.focusTile(Math.min(SIZE-1,entry%SIZE+4),Math.floor(entry/SIZE));$('detailPanel').hidden=false;}
focusEmptyStart();
const modal=$('modal');
const legacyBridge=document.createElement('div');legacyBridge.id='legacyHudBridge';legacyBridge.hidden=true;legacyBridge.inert=true;document.querySelector('#game').append(legacyBridge);for(const selector of ['.topbar','.city-clock','.left-panel','.bottom-bar','.save-status','#restoreOverview','#toolTray','#toolInfo','#mapHint','#detailPanel']){const node=document.querySelector('#game '+selector);if(node)legacyBridge.append(node);}
hud=createCityHud($('game'),{},hudAction);window.addEventListener('pagehide',()=>hud.destroy());
const groups=[['inspect','⌖','Khám phá'],['roads','╋','Đường'],['zones','▥','Phân khu'],['utilities','ϟ','Điện nước'],['services','✚','Dịch vụ'],['parks','♧','Công viên'],['transport','▣','Vận tải'],['bulldoze','⌫','Phá dỡ']];
function toast(msg){if(hud){hud.notify(msg);return;}clearTimeout(toastTimer);$('toast').textContent=msg;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function changed(){changeId++;sync.changed();renderSaveStatus();update();}
function renderSaveStatus(){
  const labels={local:'Lưu trên thiết bị',pending:'Chờ đồng bộ',saving:'Đang đồng bộ…',synced:'Đã lưu đám mây',offline:'Mất mạng · lưu trên máy',error:'Lỗi đồng bộ · thử lại',conflict:'Xung đột · cần xử lý','storage-error':'Chưa lưu trên thiết bị'};
  const text=financeBusy?'Đang xác nhận giao dịch…':financePending()?'Giao dịch chờ đối soát':storageWarning?'Chưa lưu được · thử lại':localCollision?'Bản local đổi ở tab khác':user?labels[sync.status]:'Lưu trên thiết bị';
  $('saveText').textContent=text;$('saveText').dataset.state=storageWarning?'error':sync.status;
  $('saveText').title=storageError|| (sync.error?authMessage(sync.error):text);hud?.setSaveLabel(text);
}
function persist(){if(localCollision||storageBlocked)return false;try{saveLocal(city,user?.id||'guest',sync.cloud,sync.metadata);storageWarning=false;storageError='';renderSaveStatus();return true;}catch{storageWarning=true;renderSaveStatus();return false;}}
async function checkpoint(){
  if(checkpointBusy){toast('Đang giữ tiến trình. Chờ một chút.');return false;}
  if(localCollision){toast('Thành phố đã thay đổi ở tab khác. Đóng tab cũ rồi tải lại để tiếp tục.');return false;}
  const owner=user?.id||'guest',epoch=cityEpoch;checkpointBusy=true;
  try{
    // Move old backups only after committed, verified copies; never evict a city.
    if(!persist()){
      await backupStore.migrateLocal();
      if(owner!==(user?.id||'guest')||epoch!==cityEpoch)return false;
      if(storageBlocked){await backupStore.archiveLocal(owner);storageBlocked=false;}
      if(!persist())throw new Error('Thiết bị chưa cho phép lưu tiến trình. Bật bộ nhớ trình duyệt hoặc mở Bản dự phòng để quản lý dung lượng.');
    }
    await backupStore.archive(owner,JSON.stringify(localEnvelope(city,sync.cloud,sync.metadata)));
    return owner===(user?.id||'guest')&&epoch===cityEpoch&&!localCollision;
  }catch(error){storageWarning=true;storageError=error.message;renderSaveStatus();toast(error.message);return false;}
  finally{checkpointBusy=false;lastMs=performance.now();}
}
function showModal(html){hud?.close();modal.classList.remove('auth-layout','account-dialog');$('modalBody').innerHTML=html;if(!modal.open)modal.showModal();hydrateBuildingThumbnails($('modalBody'));hydrateMobilityThumbnails($('modalBody'));}
modal.addEventListener('close',()=>{lastMs=performance.now();update();});
function closeModal(){modal.close();}
function restorePlayback(){speed=city.playback.paused?0:city.playback.multiplier;observe=city.playback.observe;document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('active',Number(b.dataset.speed)===speed));$('observeBtn').classList.toggle('active',observe);$('timeScale').textContent=!speed?'Tạm dừng':observe?'Quan sát · 1 giây thực = 1 giây game':`1 giây thực = ${PLAY_SECONDS_PER_SECOND*speed} giây game${speed===1?'':' · casual nhanh'}`;}
function setSpeed(n){const result=command('playback',{paused:n===0,multiplier:n||city.playback.multiplier,observe});if(!result.ok){toast(result.message);return;}restorePlayback();changeId++;sync.changed();persist();updateHud();}
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.speed);setSpeed(n===0&&speed===0?city.playback.multiplier:n);});
restorePlayback();

function selectTool(k,{openPicker=false,designId=null}={}){if(!CATALOG[k])return;setLayersOpen(false);hud?.close();tracked=null;renderer.follow=null;tool=k;if(designId)blueprint=designId;else if(PRIVATE_DESIGNS[blueprint]?.kind!==k)blueprint=PRIVATE_PLANS[k]?.designId||null;group=CATALOG[k].group;renderer.tool=k;renderer.blueprint=blueprint;renderer.selected=null;selected=null;
  $('toolbar').innerHTML=groups.map(([g,glyph,label])=>`<button class="tool-btn ${g===group?'active':''}" data-group="${g}" title="${label}" aria-pressed="${g===group}"><span class="glyph">${icon(g,22)}</span><span>${label}</span></button>`).join('');
  $('toolbar').querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{
    const sameGroup=b.dataset.group===group;
    const next=sameGroup?tool:Object.keys(CATALOG).find(k=>CATALOG[k].group===b.dataset.group);
    selectTool(next,{openPicker:!sameGroup||$('toolTray').hidden});
  });
  const options=group==='zones'?Object.values(PRIVATE_DESIGNS).map(p=>[p.kind,{...CATALOG[p.kind],name:p.name,designId:p.designId,capacity:p.capacity}]):Object.entries(CATALOG).filter(([,v])=>v.group===group);
  const favorites=catalogFavorites();
  $('toolTray').hidden=!openPicker||['inspect','bulldoze'].includes(group);
  $('toolTray').innerHTML=`<div class="build-heading"><div><span>QUY HOẠCH & XÂY DỰNG</span><strong>${groups.find(([g])=>g===group)[2]} <small>${options.length} lựa chọn</small></strong></div><button class="icon-btn" id="closeBuild" aria-label="Đóng menu xây dựng">×</button></div><label class="build-search"><span>Tìm công trình</span><input id="buildSearch" type="search" placeholder="Tên công trình…" autocomplete="off"></label><button id="buildFavorites" class="catalog-filter" aria-pressed="false">${icon('star',16)} Yêu thích <span id="favoriteCount">${options.filter(([id,v])=>favorites.has(id+(v.designId?':'+v.designId:''))).length}</span></button><div class="build-grid">`+options.map(([id,v])=>`<div class="build-item" data-catalog-key="${id+(v.designId?':'+v.designId:'')}"><button class="build-option ${id===k&&(!v.designId||v.designId===blueprint)?'active':''}" data-tool="${id}" data-design="${v.designId||''}" title="${escape(v.description)}" aria-pressed="${id===k&&(!v.designId||v.designId===blueprint)}" style="--facility:${v.color}">${v.designId?buildingThumbnail(id,v.designId):buildingPreview(id)}<strong>${v.name}</strong><span class="facility-summary">${v.designId?(id==='residential'?v.capacity+' chỗ ở':v.capacity+' việc làm')+' · '+CATALOG[id].name:buildingSummary(id)}</span><b>${PRIVATE_PLANS[id]?'Phí quy hoạch: ':'Xây: '}${money(v.cost)}</b><small>${PRIVATE_PLANS[id]?'Nhà/công trình: '+money(privateBuildPrice(id,v.designId))+' · vốn tư nhân':v.upkeep?money(v.upkeep)+' / tháng':'Không có phí vận hành'}</small></button><button class="build-favorite" data-favorite="${id+(v.designId?':'+v.designId:'')}" aria-label="${escape(v.name)} - yêu thích" aria-pressed="${favorites.has(id+(v.designId?':'+v.designId:''))}" title="Thêm hoặc bỏ yêu thích">${icon('star',16)}</button></div>`).join('')+(group==='transport'?'<button class="build-option manage-transit" id="manageTransit">'+icon('chart',26)+'<strong>Quản lý tuyến</strong><small>Tạo tuyến · bố trí xe</small></button>':'')+'</div><p id="buildEmpty" class="catalog-empty" hidden>Không có công trình phù hợp. Thử từ khóa khác hoặc bỏ lọc yêu thích.</p>';
  $('closeBuild').onclick=()=>selectTool(k);
  const filterOptions=()=>{const q=$('buildSearch').value.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\u0111/gi,'d').toLowerCase().trim(),only=$('buildFavorites').getAttribute('aria-pressed')==='true',saved=catalogFavorites();
    $('toolTray').querySelectorAll('[data-catalog-key]').forEach(item=>{const text=item.querySelector('strong').textContent.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\u0111/gi,'d').toLowerCase();item.hidden=!text.includes(q)||only&&!saved.has(item.dataset.catalogKey);});
    $('buildEmpty').hidden=Array.from($('toolTray').querySelectorAll('[data-catalog-key]')).some(item=>!item.hidden);
    $('favoriteCount').textContent=options.filter(([id,v])=>saved.has(id+(v.designId?':'+v.designId:''))).length;
  };
  $('buildSearch').oninput=filterOptions;
  $('buildFavorites').onclick=()=>{const active=$('buildFavorites').getAttribute('aria-pressed')!=='true';$('buildFavorites').setAttribute('aria-pressed',String(active));filterOptions();};
  $('toolTray').querySelectorAll('[data-favorite]').forEach(b=>b.onclick=()=>{const result=toggleCatalogFavorite(b.dataset.favorite);b.setAttribute('aria-pressed',String(result.favorites.has(b.dataset.favorite)));filterOptions();if(!result.saved)toast('Chỉ giữ yêu thích trong phiên này vì chưa lưu được trên thiết bị.');});

  hydrateBuildingThumbnails($('toolTray'));
  document.querySelector('.left-panel').hidden=true;$('restoreOverview').hidden=false;
  if($('manageTransit'))$('manageTransit').onclick=()=>{selectTool('inspect');transit();};
  $('toolTray').querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>selectTool(b.dataset.tool,{designId:b.dataset.design||null}));
  $('toolInfo').hidden=k==='inspect'||!$('toolTray').hidden;
  $('toolInfo').innerHTML=`<strong>${PRIVATE_DESIGNS[blueprint]?.name||CATALOG[k].name}</strong>${k==='bulldoze'?' · Thu hồi 25% nguyên giá':` · ${PRIVATE_PLANS[k]?'Phí quy hoạch ':''}${money(CATALOG[k].cost)}`}<small>${PRIVATE_PLANS[k]?'Bấm để đặt nhà ngay · Tiện ích quyết định hoạt động':`Bấm hoặc kéo để ${k==='bulldoze'?'phá dỡ':'xây'} · Chọn nhóm để đổi · Esc để thoát`}</small>`;
  $('toolInfo').title=CATALOG[k].description;
  $('mapHint').hidden=k!=='inspect';
  $('mapHint').textContent=k==='inspect'?'Kéo để di chuyển · Cuộn để thu phóng · Bấm công trình để xem':'Kéo để xây · Chuột phải để di chuyển · Esc để thoát';
  $('world').style.cursor=k==='inspect'?'grab':'crosshair';
  if(!$('toolTray').hidden){$('detailPanel').hidden=true;}
  else if(k!=='inspect'){$('detailPanel').hidden=true;hideOverviewOnPhone();$('world').focus({preventScroll:true});}
  hud?.selectTool(HUD_CATALOGUE.find(v=>v.kind===k)?.category||k);if(openPicker)hud?.openCatalogue(HUD_CATALOGUE.find(v=>v.kind===k)?.category);updatePlacementPreview();
}
function developmentLabel(t){return 'Chờ vốn chủ đầu tư: '+money(privateBuildPrice(t.zone,t.blueprint));}
function updatePlacementPreview(){
  if(tool==='inspect')return;
  let el=$('placementPreview');if(!el){el=document.createElement('small');el.id='placementPreview';$('toolInfo').append(el);}
  const hit=renderer.hover,i=typeof hit==='number'?hit:hit?.i;if(i==null){el.textContent='';return;}
  const tile=city.tiles[i];
  if(tile?.zone&&!tile.kind&&PRIVATE_PLANS[tool]){el.classList.toggle('placement-error',developmentConditions(city,tile).some(c=>!c.ok));el.textContent=developmentLabel(tile);return;}
  const quote=placementQuote(city,i,tool);
  hud?.setHint(`${PRIVATE_DESIGNS[blueprint]?.name||CATALOG[tool].name} · ${quote.ok?tool==='bulldoze'?'Chọn để xem xác nhận tháo dỡ':'Bấm để xây · '+money(quote.cost):quote.message}`);
  el.classList.toggle('placement-error',!quote.ok);
  if(!quote.ok){el.textContent=quote.shortfall?`Cần ${money(quote.cost)} · Thiếu ${money(quote.shortfall)}`:quote.message;return;}
  el.textContent=tool==='bulldoze'?`Thu hồi ${money(quote.refund)}${quote.cancellation?' · gồm vốn nâng cấp chưa sử dụng':''}`:`${quote.upgrading?'Nâng cấp':'Giá tại ô này'}: ${money(quote.cost)}${city.world.geography?` · Dốc ${slopeAt(city.world,i,SIZE).toFixed(1)}%`:''}`;
}
selectTool('inspect');
document.querySelector('.left-panel').hidden=true;$('restoreOverview').hidden=false;

function date(){return calendar(city.clock.seconds).date.toLocaleString('vi-VN',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function level(){return `Cấp thành phố ${cityLevel(city)} · ${progressionXp(city)} XP`;}
const hudCatalogue=HUD_CATALOGUE.map(item=>({...item,thumbnailMarkup:LANDMARKS[item.kind]?landmarkThumbnail(item.kind):ROAD_KINDS.includes(item.kind)?buildingPreview(item.kind):PRIVATE_PLANS[item.kind]?buildingThumbnail(item.kind,item.designId):buildingThumbnail(item.kind)}));
function updateHud(){
 const snapshot=makeHudSnapshot(city,{saveLabel:$('saveText').textContent,accountLabel:recoveryMode?'Đặt mật khẩu':user?'Tài khoản':'Đăng nhập',tool,selectedBuilding:{id:selected?String(selected.i):tracked||'news',name:tracked?'Theo dõi hành trình':selected?PRIVATE_DESIGNS[city.tiles[selected.i].blueprint]?.name||CATALOG[city.tiles[selected.i].kind||city.tiles[selected.i].zone]?.name||'Thông tin ô đất':'Bản tin thành phố',detailsElement:$('detailBody')}});
 snapshot.catalogue=hudCatalogue;hud.update(snapshot);
}
function update(){
 if(!city.metrics)analyze(city);if(document.activeElement!==$('cityName'))$('cityName').value=city.name;
 $('mapSizeText').textContent=city.world?.geography?city.world.geography.provinceName+' · '+((city.world.widthMeters||SIZE*20)/1000).toLocaleString('vi-VN')+' KM':SIZE+' × '+SIZE+' · '+(SIZE*20/1000).toLocaleString('vi-VN')+' KM';updateMapSource();updateWeatherControl();
 if(!$('detailBody').contains(document.activeElement)){if(tracked)inspectCitizen(tracked);else if(selected)inspect(selected);else if(!modal.open)news();}
 updatePlacementPreview();restorePlayback();updateHud();
}
function hudAction(action){
 switch(action.type){
 case 'closePanel':selected=null;tracked=null;renderer.selected=null;renderer.follow=null;break;
 case 'catalogueMounted':hydrateBuildingThumbnails(hud.element);break;
 case 'home':document.dispatchEvent(new Event('bc26:home'));break;
 case 'account':$('accountBtn').click();break;
 case 'save':void manualSave();break;
 case 'settings':menu();break;
 case 'budget':budget();break;
 case 'map':void vietnamMap();break;
 case 'missions':missionCatalogue();break;
 case 'residents':$('popChange').click();break;
 case 'weather':$('weatherControl').click();break;
 case 'pause':setSpeed(action.paused?0:city.playback.multiplier);break;
 case 'speed':setSpeed(action.multiplier);break;
 case 'ranking':showModal('<h2>Bảng xếp hạng</h2><p>Bản hiện tại chưa có API xếp hạng được xác minh trên máy chủ. Tiền và cấp trong thành phố vẫn hoạt động; chưa công bố bảng từ dữ liệu cục bộ.</p><button class="action full" id="rankingDone">Đóng</button>');$('rankingDone').onclick=closeModal;break;
 case 'layers':{const open=$('layersPanel').hidden||!!action.layer;hud.close();if(action.layer)setLayer(action.layer==='electricity'?'power':action.layer);setLayersOpen(open);break;}
 case 'locate':renderer.focusTile(action.location.x,action.location.y);break;
 case 'build':{const item=HUD_CATALOGUE.find(x=>x.id===action.buildingId);if(item)selectTool(item.kind,{designId:item.designId});break;}
 case 'tool':if(action.tool==='terrain')return;selectTool(action.tool);break;
 case 'claimMission':void missionTransaction('claim',action.missionId);break;
 }
}

function conditionMarkup(n){
 if(n.type==='all'||n.type==='any')return `<div class="condition-group ${n.type}"><small>${n.type==='any'?'Chọn một phương án':'Đạt đủ các mục tiêu'}</small>${n.children.map(conditionMarkup).join('')}</div>`;
 const value=n.valid?Number(n.value).toLocaleString('vi-VN',{maximumFractionDigits:1}):'—',percent=n.valid?(n.operator==='lte'?(n.ok?100:0):Math.min(100,n.value/Math.max(1,n.target)*100)):0;
 return `<div class="mission-objective ${n.ok?'good':'warn'}"><span>${n.ok?'✓':'○'} ${escape(n.label)}</span><b>${value} / ${n.operator==='lte'?'≤ ':''}${n.target.toLocaleString('vi-VN')}</b><progress max="100" value="${percent}"></progress>${!n.valid?`<small>${escape(n.reason||'Chưa có dữ liệu hợp lệ')}</small>`:''}</div>`;
}
function missionCard(m){
 const state=m.completed?'Đã nhận thưởng':m.locked?`Khóa · cần cấp ${m.level}${m.blockedBy.length?' và '+m.blockedBy.length+' nhiệm vụ trước':''}`:!m.available?'Cần hệ thống chưa triển khai':m.ready?'Đủ điều kiện · chờ máy chủ xác minh':'Đang thực hiện';
 return `<article class="mission-card ${m.locked?'locked':''}"><div class="mission-card-heading"><strong>${escape(m.name)}</strong><span>+${m.xp.toLocaleString('vi-VN')} XP</span></div><small>Nhóm ${m.campaignStage} · ${escape(state)}</small><p>${escape(m.description)}</p>${conditionMarkup(m.condition)}<div class="mission-rewards">${money(m.money)}${m.rewards.badge?' · '+escape(m.rewards.badge):''}</div>${!m.completed&&m.holdSeconds?`<small>Duy trì ${m.held}/${m.holdSeconds} giây game · tạm dừng không cộng thời gian</small>`:''}${!m.completed?`<div class="mission-actions"><button class="action primary" data-mission-claim="${m.id}" ${m.locked||!m.ready||!m.available?'disabled':''}>Nhận thưởng</button>${m.tool?`<button class="action" data-mission-tool="${m.tool}" ${m.locked?'disabled':''}>${icon(m.tool==='vietnam'?'layers':m.tool,17)} ${m.tool==='vietnam'?'Chọn địa phương':CATALOG[m.tool]?.name||m.tool}</button>`:''}</div>`:''}</article>`;
}
function bindMissionTools(root){root.querySelectorAll('[data-mission-tool]').forEach(b=>b.onclick=()=>{if(modal.open)closeModal();if(b.dataset.missionTool==='vietnam'){void vietnamMap();return;}selectTool(b.dataset.missionTool);document.querySelector('.left-panel').hidden=true;$('restoreOverview').hidden=false;});root.querySelectorAll('[data-mission-claim]').forEach(b=>b.onclick=()=>missionTransaction('claim',b.dataset.missionClaim));}
async function missionTransaction(action,missionId){
 if(!user){authDialog('login','Đăng nhập để lưu thành phố và nhận thưởng nhiệm vụ từ máy chủ.');return;}
 if(missionBusy||financeBusy||financePending()||sync.busy||libraryBusy||sync.conflict||localCollision||storageBlocked){toast('Giải quyết thao tác hoặc xung đột trong Tài khoản trước.');return;}
 const epoch=cityEpoch,owner=user.id;
 try{
  const pending=missionPending();
  if(pending?.corrupt)throw new Error('Yêu cầu nhiệm vụ trên thiết bị bị hỏng. Xuất bản lưu và mở lại bản đám mây.');
  if(!pending){if(!await cloudSave())return;}
  const request=pending||{action,missionId,cityId:sync.cloud.id,revision:sync.cloud.revision};
  missionBusy=true;libraryBusy=true;
  const result=await missionQueue.transact(owner,request,async row=>{if(owner!==user?.id||epoch!==cityEpoch)throw new Error('Thành phố đã đổi; mở lại bản đám mây để đối soát.');city=validateSave(row.state);cityEpoch++;changeId++;accumulator=0;sync.use(owner,{cloud:{id:row.id,revision:Number(row.revision)},dirty:false});persist();update();});
  toast(result.notice||(request.action==='claim'?result.applied?'Đã nhận EXP và tiền. Phần thưởng được ghi một lần trên máy chủ.':'Phần thưởng này đã được nhận.':'Đã ghi mốc xác minh nhiệm vụ trên máy chủ.'));if(modal.open)missionCatalogue();
 }catch(error){if(error.status===409){sync.conflict=true;sync.status='conflict';persist();}toast(/fetch|network|abort|timeout/i.test(error.message)?'Mất kết nối. Mở Nhiệm vụ và thử lại để đối soát cùng biên nhận.':error.message);}
 finally{missionBusy=false;libraryBusy=false;lastMs=performance.now();renderSaveStatus();}
}

function missionCatalogue(){
 showModal(`<span class="news-kicker">PHÁT TRIỂN THÀNH PHỐ · 100 CẤP</span><h2>${MISSIONS.length} nhiệm vụ</h2><p>EXP lấy từ dân cư, hành trình, dịch vụ và sổ ngân sách thật. Nhận thưởng qua máy chủ sau khi đủ điều kiện. Mỗi lần lên cấp nhận 100 triệu ₫; giữ lịch sử 14 nhiệm vụ cũ. EXP trọn đời: ${lifetimeXp(city).toLocaleString('vi-VN')}.</p><p>Lịch sử cũ: ${city.progression.receipts.length}/14 đã nhận. ${missionViews(city).filter(m=>m.available).length}/300 nhiệm vụ có đủ loại dữ liệu; các nhóm chưa có dịch vụ vẫn khóa thưởng.</p><button id="missionVerify" class="action">${missionPending()?'Thử lại yêu cầu đang chờ':'Ghi mốc xác minh máy chủ'}</button><div class="mission-filters"><label class="field">Tìm nhiệm vụ<input id="missionSearch" type="search" placeholder="Tên hoặc mục tiêu…"></label><label class="field">Trạng thái<select id="missionFilter"><option value="available">Đang mở</option><option value="all">Tất cả</option><option value="completed">Đã hoàn tất</option><option value="locked">Chưa mở</option></select></label></div><div id="missionCatalogueRows"></div><div class="mission-pagination"><button id="missionPrevious" class="action">Trang trước</button><span id="missionPage" role="status"></span><button id="missionNext" class="action">Trang sau</button><button id="missionRefresh" class="action">Cập nhật tiến độ</button></div>`);
 let page=0;const normalize=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/gi,'d').toLowerCase();
 const render=()=>{const filter=$('missionFilter').value,q=normalize($('missionSearch').value.trim()),rows=missionViews(city).filter(m=>(filter==='all'||filter==='available'&&!m.completed&&!m.locked||filter==='completed'&&m.completed||filter==='locked'&&!m.completed&&m.locked)&&normalize(m.name+' '+m.description).includes(q)),pages=Math.max(1,Math.ceil(rows.length/12));page=Math.max(0,Math.min(page,pages-1));$('missionCatalogueRows').innerHTML=rows.length?rows.slice(page*12,page*12+12).map(missionCard).join(''):'<p class="catalog-empty">Chưa có nhiệm vụ trong nhóm này. Chọn Tất cả để xem điều kiện mở khóa.</p>';$('missionPage').textContent=`${rows.length} nhiệm vụ · Trang ${page+1}/${pages}`;$('missionPrevious').disabled=!page;$('missionNext').disabled=page>=pages-1;bindMissionTools($('missionCatalogueRows'));};
 $('missionVerify').onclick=()=>{const p=missionPending();return missionTransaction(p?.action||'observe',p?.missionId);};
 $('missionSearch').oninput=$('missionFilter').onchange=()=>{page=0;render();};$('missionPrevious').onclick=()=>{page--;render();};$('missionNext').onclick=()=>{page++;render();};$('missionRefresh').onclick=render;render();
}
$('population').onclick=()=>{$('popChange').click();};
$('popChange').onclick=()=>{
 const status=populationStatus(city),entry=city.world.geography?.entryTile??index(0,18),outside=city.citizens.filter(c=>c.journey||c.state==='waiting-bus'||c.state==='on-bus').length;
 const steps=status.conditions.slice(0,4),next=steps.findIndex(c=>!c.ok),titles=['Nối đường','Cấp điện','Cấp nước','Xử lý nước thải'];
 showModal(`<h2>Đón cư dân về thành phố</h2><p>${city.metrics.population} cư dân · ${city.metrics.homes-city.metrics.population} chỗ ở trống · ${outside} người đang đi lại/chờ xe.</p><p class="${status.ready?'good':'warn'}">${escape(status.label)}</p>${steps.length?`<p>Bắt đầu với 4 bước hạ tầng cho khu nhà đầu tiên. Mục an toàn và chất lượng sống cho biết điều kiện còn lại.</p><ol class="arrival-steps">${steps.map((c,i)=>`<li class="${c.ok?'good':i===next?'arrival-next':''}"><strong>${c.ok?'✓':i+1+'.'} ${titles[i]}</strong><small>${escape(c.name)}</small>${!c.ok?`<button class="action" data-arrival-tool="${c.tool}">${i===0?'Đến cổng & nối đường':'Chọn '+escape(CATALOG[c.tool].name)+' · '+money(CATALOG[c.tool].cost)}</button>`:'<small>Đã đáp ứng tại nhà đang kiểm tra</small>'}</li>`).join('')}</ol><details><summary>An toàn & chất lượng sống</summary><ul>${status.conditions.slice(4).map(c=>`<li class="${c.ok?'good':'warn'}">${c.ok?'✓':'○'} ${escape(c.name)}</li>`).join('')}</ul><p>Điện, nước và đường sẽ cải thiện chất lượng sống. Kiểm tra việc làm hoặc cảnh quan nếu vẫn dưới 48%; không cần xây mọi dịch vụ ngay.</p></details>`:'<p>Đặt một ngôi nhà để bắt đầu kiểm tra các bước.</p>'}<p>Cổng vùng: ô ${entry%SIZE+1}, ${Math.floor(entry/SIZE)+1}. Đường phải nối liên tục từ cổng đến cạnh nhà và trạm tiện ích.</p><p>Nhà đủ điều kiện đón một cư dân mỗi 60 giây game (12 giây thực ở 1×). Ban đêm người đã ở nhà ngủ; dân mới vẫn có hành trình từ cổng về nhà. Hiển thị tối đa 50 người/xe, chế độ nhẹ 30.</p><button id="arrivalEntry" class="action full">Đến cổng & nối đường</button><button id="arrivalResidents" class="action full">Xem danh sách cư dân</button>`);
 $('arrivalEntry').onclick=()=>{closeModal();renderer.focusTile(entry%SIZE,Math.floor(entry/SIZE));selectTool('road');};
 $('arrivalResidents').onclick=()=>{closeModal();$('residentsBtn').click();};
 modal.querySelectorAll('[data-arrival-tool]').forEach(b=>b.onclick=()=>{const k=b.dataset.arrivalTool;closeModal();selectTool(k);const tile=k==='road'?entry:status.tile??entry;renderer.focusTile(tile%SIZE,Math.floor(tile/SIZE));});
};
function renderServices(){
  const m=city.metrics,pop=m.population||1;
  const coverage=kind=>Math.round(city.tiles.filter(t=>t.kind==='residential'&&t.services.includes(kind)).reduce((n,t)=>n+t.residents,0)/pop*100);
  const data=[['power','Điện',m.powerNeed+' / '+m.power,m.power>=m.powerNeed,'Sử dụng / công suất; trạm cần nối đường.'],['water','Nước sạch',m.waterNeed+' / '+m.water,m.water>=m.waterNeed,'Thiếu nước: xây thêm trạm và kiểm tra phạm vi.'],['sewage','Nước thải',m.sewageNeed.toLocaleString('vi-VN',{maximumFractionDigits:1})+' / '+m.sewage+' m³/ngày',m.sewage>=m.sewageNeed,'Trạm xử lý cần đường, điện và nước.'],['waste','Thu gom rác',coverage('waste')+'% dân cư',coverage('waste')>=90,'Rác tăng mỗi ngày ở nhà chưa được thu gom.'],...['school','clinic','fire','police','park'].map(kind=>[kind,CATALOG[kind].name,coverage(kind)+'% dân cư',coverage(kind)>=80,'Phục vụ trong phạm vi, cần đường, điện và nước.']),['bus','Xe buýt',m.busLines+' tuyến',m.busLines>0,Math.round(m.busPassengers)+' người đi xe buýt / ngày mô phỏng.']];
  const html=data.map(([kind,name,value,ok,hint])=>`<div class="service-card"><i style="color:${CATALOG[kind]?.color}">${icon(kind,21)}</i><div><strong>${name}</strong><small>${hint}</small></div><b class="${ok?'good':'warn'}">${value}</b></div>`).join('');
  if(html!==renderServices.markup){renderServices.markup=html;$('serviceReport').innerHTML=html;}
}
function news(){if($('detailPanel').hidden)return;$('detailPanel').classList.remove('inspect');$('detailTitle').textContent='BẢN TIN THÀNH PHỐ';const m=city.metrics;
  const notes=[];
  if(m.roadCount===0){const entry=city.world.geography?.entryTile??index(0,18);$('detailBody').innerHTML=`<span class="news-kicker">KHỞI ĐẦU TỪ ĐẤT TRỐNG</span><h2 class="news-title">Thành phố do bạn tạo nên.</h2><p class="news-text">${money(city.money)} để bắt đầu. Không có nhà, công trình hay dân cư được xây sẵn.</p><div class="news-card"><strong>01 · Nối đường vào thành phố</strong><p>Bắt đầu tại ô ${entry%SIZE+1}, ${Math.floor(entry/SIZE)+1}; kéo đường vào đất liền.</p><button class="news-action" id="startRoad">${icon('road',18)} Đến cổng & xây đường</button></div><div class="news-card"><strong>02 · Điện, nước & việc làm</strong><p>Xây trạm cạnh đường, rồi phân khu dân cư và thương mại. Nhà xuất hiện ngay; đủ tiện ích mới hoạt động.</p></div><div class="news-card"><strong>03 · Chăm sóc cư dân</strong><p>Bố trí xử lý nước thải, rác, trường học và y tế. Theo dõi phí vận hành trước khi mở rộng.</p></div>`;$('startRoad').onclick=()=>{renderer.focusTile(Math.min(SIZE-1,entry%SIZE+4),Math.floor(entry/SIZE));selectTool('road');};return;}
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
function inspect(tile){if(!tile)return;setLayersOpen(false);const opening=selected?.i!==tile.i||!hud.isOpen('building');hideOverviewOnPhone();tracked=null;renderer.follow=null;selected=tile;renderer.selected=tile;const t=city.tiles[tile.i];$('detailPanel').hidden=false;$('detailPanel').classList.add('inspect');$('detailTitle').textContent='THÔNG TIN Ô ĐẤT';const name=CATALOG[t.kind||t.zone]?.name||(t.terrain==='water'?(city.world.geography?['Đất trống','Biển · nước mặn','Sông / hồ · OSM','Vùng nước triều'][city.world.geography.waterMask[tile.i]]:'Sông Bình Minh'):'Đất trống');const rows=[['Cao độ / dốc',`${surfaceHeight(city,tile.i,SIZE).toFixed(1)} m / ${slopeAt(city.world,tile.i,SIZE).toFixed(1)}%`],['Vị trí',`${tile.x+1}, ${tile.y+1}`],['Kết nối đường',t.connected?'Đã kết nối':'Chưa kết nối']];const design=buildingDesign(t,tile.x,tile.y);if(design)rows.push(['Kiến trúc',design.name]);if(t.kind&&!isRoad(t)&&!['power','water'].includes(serviceKind(t.kind))){rows.push(['Điện năng',t.power?'Đủ cung cấp':'Chưa đủ'],['Nước sạch',t.water?'Đủ cung cấp':'Chưa đủ']);}if(['commercial','industrial'].includes(t.kind))rows.push(['Việc làm tối đa',jobsCapacity(t)],['Điện danh định',Math.round(18*capacityFactor(t))+' kW'],['Nước danh định',(14*WATER_PER_PERSON*capacityFactor(t)).toLocaleString('vi-VN')+' m³/ngày']);if(t.kind==='residential')rows.push(['Tác động cảnh quan',(t.landscapeBonus||0)+' / tối đa 6 điểm'],['Cư dân',t.residents+' / '+residentCapacity(t)],['Đón dân',arrivalConditions(t).filter(c=>!c.ok).map(c=>c.short).join(' · ')||'Đủ điều kiện'],['Hạnh phúc',t.happiness+'%'],['Cấp công trình',t.level],['Ô nhiễm',Math.round(t.pollution)+'%']);if(isRoad(t))rows.push(['Lưu lượng / năng lực',`${Math.round(t.trafficLoad)} / ${t.trafficCapacity} xe/ngày`],['Tình trạng',!t.connected?'Mất kết nối':t.trafficLoad>t.trafficCapacity?'Quá tải — nâng đại lộ':'Thông thoáng']);if(t.kind==='residential')rows.push(['Rác tích tụ',Math.round(t.garbage||0)+'%'],['Sức khỏe',Math.round(t.health??100)+'%'],['Giáo dục',Math.round(t.education||0)+'%'],['Mất an ninh',Math.round(t.crime||0)+'%'],['Nước thải',t.sewage?'Đã xử lý':'Thiếu xử lý']);if(['residential','industrial'].includes(t.kind))rows.push(['Nguy cơ cháy',Math.round(t.hazard||0)+'%'],['Cháy',t.fire>0?Math.round(t.fire)+'% · cần cứu hỏa':'Không']);if(CATALOG[t.kind]?.range)rows.push(['Phạm vi',(CATALOG[t.kind].range*Math.sqrt(capacityFactor(t)*(city.budgets?.[serviceKind(t.kind)]??100)/100)).toLocaleString('vi-VN',{maximumFractionDigits:1})+' ô'],['Thông số',buildingSummary(t.kind)]);if(CATALOG[t.kind]?.upkeep)rows.push(['Vận hành',money(CATALOG[t.kind].upkeep*(t.upgrade?MAINTENANCE_FACTORS[t.level]:1)*(city.budgets?.[serviceKind(t.kind)]??100)/100)+'/tháng']);if(t.zone&&!t.kind)rows.push(['Trạng thái',developmentLabel(t)]);if(t.development)rows.push(['Chủ sở hữu','Nhà đầu tư tư nhân'],['Nguyên giá công trình',money(t.development.basePrice)],['Phí quy hoạch đã trả',money(t.historicalCost||0)]);$('detailBody').innerHTML=`${LANDMARKS[t.kind]?landmarkThumbnail(t.kind):isRoad(t)&&t.terrain!=='water'?buildingPreview(t.kind):buildingThumbnail(t.kind||t.zone,design?.id||t.blueprint)}<div class="inspect-icon" style="color:${CATALOG[t.kind||t.zone]?.color||'#b7c8bb'}">${icon(serviceKind(t.kind)||t.zone||'city',30)}</div><h2 class="news-title">${name}</h2>${t.kind&&!isRoad(t)?`<span class="badge ${t.active||['power','water'].includes(serviceKind(t.kind))&&t.connected?'':'warn'}">${t.active||['power','water'].includes(serviceKind(t.kind))&&t.connected?'Đang hoạt động':'Cần kết nối / tiện ích'}</span>`:''}<div class="detail-list">${rows.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('')}</div><p class="news-text">${CATALOG[t.kind||t.zone]?.description||'Chọn công cụ xây đường hoặc phân khu để phát triển ô đất này.'}</p>${t.kind==='road'?`<button id="upgradeRoad" class="action primary full">Nâng đại lộ · ${money(placementPrice('avenue',t,geographyBuildRule(city,tile.i,'avenue').factor||1,CATALOG))}</button>`:''}`;
  if(isRoad(t))renderRoadControls(tile,t);
  renderDevelopmentDetails(tile,t);if(t.kind||t.zone){$('detailBody').insertAdjacentHTML('beforeend','<button class="action full" id="demolishSelected">'+icon('bulldoze',20)+' Tháo dỡ · xem hoàn tiền</button>');$('demolishSelected').onclick=()=>confirmDemolition(tile);}
  const people=city.citizens.filter(c=>c.home===tile.i);if(people.length){$('detailBody').insertAdjacentHTML('beforeend',`<h3>Cư dân ở đây</h3><div class="resident-list">${people.map(c=>`<button class="action" data-person="${c.id}">${escape(c.name)} · ${c.age} tuổi</button>`).join('')}</div>`);$('detailBody').querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>trackCitizen(b.dataset.person));}
  const contract=city.contracts.find(c=>c.tile===tile.i&&c.status==='building');if(contract){$('detailBody').insertAdjacentHTML('beforeend',`<p>Thi công công viên · ${Math.round(contract.progress*100)}% · giữ ${money(contract.escrow)} trong khoản cam kết</p><button class="action" id="cancelContract">Hủy · hoàn khoản chưa chi</button>`);$('cancelContract').onclick=()=>{command('cancel-construction',{id:contract.id});changed();persist();};}
  hydrateBuildingThumbnails($('detailBody'));
  if(opening){updateHud();hud.showBuilding();}
  if($('upgradeRoad'))$('upgradeRoad').onclick=()=>{const result=command('place',{x:tile.x,y:tile.y,kind:'avenue'});if(!result.ok){toast(result.message);return;}changed();persist();renderer.lastPaths=-1;};
}


function renderRoadControls(tile,t){
 const p=roadProfile(t);$('detailBody').insertAdjacentHTML('beforeend',`<section class="development-details"><h3>Hồ sơ đường</h3><p>${p.width} m · ${p.lanes} làn · giới hạn ${p.speed} km/h. ${p.modes.map(m=>ROAD_MODE_LABELS[m]).join(', ')}.</p><label class="field">Thay loại đường<select id="roadProfileSelect">${ROAD_KINDS.map(k=>`<option value="${k}" ${k===t.kind?'selected':''}>${CATALOG[k].name} · ${k===t.kind?'hiện tại':money(placementPrice(k,t,geographyBuildRule(city,tile.i,k).factor||1,CATALOG))}</option>`).join('')}</select></label><button class="action full" id="roadProfileApply">Áp dụng loại đường đã chọn</button>${p.oneWay?`<label class="field">Hướng lưu thông<select id="roadDirection">${Object.entries({north:'Bắc',east:'Đông',south:'Nam',west:'Tây'}).map(([k,n])=>`<option value="${k}" ${k===(t.roadDirection||'east')?'selected':''}>${n}</option>`).join('')}</select></label>`:''}${isJunction(city,tile.i)?`<h3>Điều khiển giao lộ</h3><label class="field">Chế độ<select id="junctionMode">${[['signal','Đèn · từng hướng và người đi bộ'],['yield','Nhường xe trong giao lộ'],['off','Không điều khiển']].map(([k,n])=>`<option value="${k}" ${k===(t.junctionControl||'signal')?'selected':''}>${n}</option>`).join('')}</select></label><p>Pha hiện tại: ${junctionState(city,tile.i).approach||'người đi bộ / giải phóng'} · ${junctionState(city,tile.i).light}. Hàng chờ N/Đ/Nam/T: ${Object.values(junctionQueues(city,tile.i)).join(' / ')} xe đang dừng.</p><small>Chu kỳ 66 giây game: mỗi hướng 10 giây xanh, 2 giây vàng, 2 giây giải phóng; 8 giây người đi bộ, 2 giây giải phóng cuối.</small>`:''}</section>`);
 const apply=(type,payload)=>{const r=command(type,payload);if(!r.ok){toast(r.message);return;}changed();persist();renderer.lastPaths=-1;inspect(tile);updateHud();};
 $('roadProfileApply').onclick=()=>apply('place',{x:tile.x,y:tile.y,kind:$('roadProfileSelect').value});
 if($('roadDirection'))$('roadDirection').onchange=()=>apply('road-direction',{tile:tile.i,direction:$('roadDirection').value});
 if($('junctionMode'))$('junctionMode').onchange=()=>apply('junction-control',{tile:tile.i,mode:$('junctionMode').value});
}

function updateWeatherControl(){let control=$('weatherControl');if(!control){control=document.createElement('button');control.id='weatherControl';control.className='weather-control';document.querySelector('.city-clock').append(control);control.onclick=()=>{const w=weatherState(city);showModal(`<h2>Thời tiết mô phỏng</h2><p>${w.name} · ${w.temperature}°C</p><label class="field">Chế độ casual<select id="weatherMode">${[['auto','Theo đồng hồ và seed'],['clear','Trời quang'],['rain','Mưa'],['heat','Nắng nóng']].map(([id,name])=>`<option value="${id}" ${id===(city.weatherMode||'clear')?'selected':''}>${name}</option>`).join('')}</select></label><p>Mưa giảm tốc độ xe 25%. Nắng nóng tăng nhu cầu điện 15%, nước 10%; thiếu công suất có thể dừng công trình.</p><p>Chưa có mô hình ngập, bão và sơ tán. Đây là thông số cân bằng game, không phải dự báo tại địa phương.</p><button id="weatherApply" class="action full">Áp dụng thời tiết</button>`);$('weatherApply').onclick=()=>{const r=command('weather',{mode:$('weatherMode').value});if(!r.ok){toast(r.message);return;}changed();persist();closeModal();};};}const w=weatherState(city);control.textContent=w.name+' · '+w.temperature+'°C';control.title='Thời tiết mô phỏng · bấm để xem tác động';}

function updateMapSource(){
 $('geoCredit')?.remove();const g=city.world?.geography;let button=$('mapSourceInfo');
 if(!g){button?.remove();return;}
 if(!button){button=document.createElement('button');button.id='mapSourceInfo';button.className='map-source-info';button.textContent='© OSM · ⓘ';button.setAttribute('aria-label','Thông tin bản đồ và nguồn dữ liệu');button.title='Thông tin bản đồ và nguồn dữ liệu';document.querySelector('.minimap').append(button);button.onclick=()=>{const geo=city.world.geography;showModal(`<h2>Thông tin bản đồ</h2><p>${escape(geo.provinceName)} · ${escape(geo.regionId)}</p><p>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> · ODbL. Dữ liệu OSM ${escape(geo.osmDate)}.</p><p>Cao độ: Mapzen / USGS SRTM, GMTED / NOAA. Dữ liệu khoảng 30–38 m, nội suy ô chơi 20 m; không phải khảo sát xây dựng.</p><p>Hình học quốc gia: Nguyễn Duy Liêm (2025), Free-GIS-Data. Nhãn hành chính theo snapshot 01/07/2025. Hoàng Sa, Trường Sa có tranh chấp quốc tế; lớp rạn chưa xác minh không dùng để xây.</p><button id="sourceDone" class="action full">Đóng thông tin</button>`);$('sourceDone').onclick=closeModal;};}
}
function renderDevelopmentDetails(tile,t){
 if(t.zone&&!t.kind){const conditions=developmentConditions(city,t).filter(c=>c.name==='Nguồn vốn chủ đầu tư');
  $('detailBody').querySelector('.news-title').insertAdjacentHTML('afterend',`<section class="development-details"><h3>${escape(developmentLabel(t))}</h3><ul>${conditions.map(c=>`<li class="${c.ok?'good':'warn'}">${c.ok?'✓':'○'} ${c.name}${!c.ok&&c.tool?` <button class="link-button" data-fix-tool="${c.tool}">Chọn công cụ</button>`:''}</li>`).join('')}</ul><p>Phí cấp phép: ${money(CATALOG[t.zone].cost)}/400 m². Giá xây ${money(privateBuildPrice(t.zone,t.development?.designId||t.blueprint))} do chủ đầu tư trả, không trừ vào ngân quỹ.</p><p>Nhà xuất hiện ngay khi đủ vốn chủ đầu tư; đường và tiện ích quyết định hoạt động.</p></section>`);
  $('detailBody').querySelectorAll('[data-fix-tool]').forEach(b=>b.onclick=()=>selectTool(b.dataset.fixTool));
 }
 const q=upgradeQuote(city,tile.i);if(!q)return;
 $('detailBody').insertAdjacentHTML('beforeend',`<section class="upgrade-details"><h3>Nâng cấp công trình · ${t.level}/5</h3>${t.upgrade?.status==='building'?`<p>Đang nâng lên cấp ${t.upgrade.target} · ${Math.floor(t.upgrade.work/900*100)}% · tạm dừng khi thiếu tiện ích.</p>`:`${q.total?`<p>Chi nâng ${money(q.price)} + dự phòng ${money(q.reserve)}. Công suất danh định cấp ${q.target}: ${Math.round(q.factor*100)}% cấp 1; điện/nước và bảo trì tăng theo tải.</p>`:''}<ul>${q.conditions.map(c=>`<li class="${c.ok?'good':'warn'}">${c.ok?'✓':'○'} ${c.name}</li>`).join('')}</ul>${q.total?`<button id="upgradeBuilding" class="action full" ${q.ready?'':'disabled'}>${q.private?'Chủ đầu tư trả':'Ngân sách trả'} ${money(q.total)}</button>${q.private?`<button id="subsidizeUpgrade" class="action full" ${q.ready?'':'disabled'}>Hỗ trợ 100% từ ngân sách · ${money(q.total)}</button>`:''}<small>15 phút game thi công; dự phòng chưa dùng được trả lại khi nghiệm thu.</small>`:''}`}</section>`);
 for(const [id,payer] of [['upgradeBuilding','owner'],['subsidizeUpgrade','city']])if($(id))$(id).onclick=()=>{const r=command('upgrade-building',{tile:tile.i,payer});if(!r.ok){toast(r.message);return;}changed();persist();renderer.lastPaths=-1;};
}

$('newsBtn').onclick=()=>{const opening=$('detailPanel').hidden||selected||tracked;tracked=null;selected=null;renderer.selected=null;renderer.follow=null;$('detailPanel').hidden=!opening;if(opening){hideOverviewOnPhone();news();}};
$('detailClose').onclick=()=>{tracked=null;renderer.follow=null;$('detailPanel').hidden=true;selected=null;renderer.selected=null;};
// Collapse overview without obstructing the map on smaller devices.
document.querySelectorAll('[data-overview]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-overview]').forEach(b=>b.classList.toggle('active',b===button));for(const view of ['general','services','goals'])$('overview-'+view).hidden=button.dataset.overview!==view;document.querySelector('.left-panel .panel-title span').textContent={general:'THÀNH PHỐ',services:'DỊCH VỤ CÔNG',goals:'NHIỆM VỤ'}[button.dataset.overview];});
$('transitReportBtn').onclick=transit;
$('overviewCollapse').onclick=()=>{document.querySelector('.left-panel').hidden=true;$('restoreOverview').hidden=false;};
$('missionBtn').onclick=missionCatalogue;
$('restoreOverview').onclick=()=>{selectTool('inspect');if(innerWidth<=600){$('detailPanel').hidden=true;selected=null;tracked=null;renderer.selected=null;renderer.follow=null;}document.querySelector('.left-panel').hidden=false;$('restoreOverview').hidden=true;};
$('cityName').onchange=()=>{command('rename',{name:$('cityName').value});changed();persist();};

const canvas=$('world'),pointers=new Map();let drag=null,lastPaint=null,pinch=null,spaceDown=false;
const point=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
function confirmDemolition(tile){
 const q=placementQuote(city,tile.i,'bulldoze');if(!q.ok){toast(q.message);return;}
 const t=city.tiles[tile.i],ref=t.assetId,kind=t.kind||t.zone,occupied=t.residents||0,jobs=['commercial','industrial'].includes(t.kind)?jobsCapacity(t):0;
 showModal(`<h2>Tháo dỡ ${escape(PRIVATE_DESIGNS[t.blueprint]?.name||CATALOG[kind]?.name||'ô đất')}</h2><p>Ô ${tile.x+1}, ${tile.y+1} · hoàn ${money(q.refund)}. Không có phí tháo dỡ riêng.</p><p>${occupied} cư dân cần chuyển đi; ${jobs} chỗ làm bị mất. Đường, tiện ích và tuyến buýt phụ thuộc ô này sẽ được tính lại. Vốn nhà tư nhân không được hoàn vào ngân quỹ.</p><div class="modal-actions"><button class="action" id="demolitionCancel">Giữ công trình</button><button class="action primary" id="demolitionConfirm">Xác nhận tháo dỡ</button></div>`);
 $('demolitionCancel').onclick=closeModal;
 $('demolitionConfirm').onclick=async()=>{const now=placementQuote(city,tile.i,'bulldoze');if(!now.ok||city.tiles[tile.i].assetId!==ref||now.refund!==q.refund){toast('Công trình hoặc giá đã đổi. Chọn lại để xác nhận.');return;}if(!await checkpoint())return;const result=command('place',{x:tile.x,y:tile.y,kind:'bulldoze'});if(!result.ok){toast(result.message);return;}selected=null;renderer.selected=null;closeModal();changed();persist();renderer.lastPaths=-1;toast('Đã tháo dỡ · hoàn '+money(now.refund)+'. Bản trước thao tác nằm trong Dự phòng.');};
}
function paint(p){const t=renderer.tileAt(p.x,p.y);if(!t)return;if(lastPaint?.i===t.i)return;if(tool==='bulldoze'){lastPaint=t;confirmDemolition(t);return;}
  const tiles=[];if(lastPaint){let x=lastPaint.x,y=lastPaint.y;while(x!==t.x||y!==t.y){if(x!==t.x)x+=Math.sign(t.x-x);else y+=Math.sign(t.y-y);tiles.push({x,y,i:index(x,y)});}}else tiles.push(t);
  let did=false,error=null;for(const at of tiles){const result=command(tool==='park'?'construct':'place',{x:at.x,y:at.y,kind:tool,...(PRIVATE_PLANS[tool]?{designId:blueprint}:{})});if(result.ok)did=true;else if(!/already|Ô này/.test(result.message))error=result.message;}
  const first=!lastPaint;lastPaint=t;if(did){void interfaceAudio.play('build');changed();renderer.lastPaths=-1;if(first&&PRIVATE_PLANS[tool])toast('Đã đặt '+(PRIVATE_DESIGNS[blueprint]?.name||CATALOG[tool].name)+'. Cấp đủ đường, điện, nước và nước thải để hoạt động.');}else if(error)toast(error);
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
window.addEventListener('resize',()=>{renderer.resize();hideOverviewOnPhone();});
window.addEventListener('keydown',e=>{if(document.body.dataset.screen==='home'||modal.open||hud.isOpen('catalogue')||hud.isOpen('building')||hud.isOpen('stat')||hud.isOpen('mission')||hud.isOpen('alerts')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.code==='Space'){e.preventDefault();spaceDown=true;if(!e.repeat)setSpeed(speed?0:1);}if(e.key==='Escape'){if(document.body.dataset.photo==='true')exitPhoto();else selectTool('inspect');}const shortcuts={1:'road',2:'residential',3:'commercial',4:'industrial',5:'park',6:'power',7:'water',8:'bulldoze'};if(document.body.dataset.photo!=='true'&&shortcuts[e.key])selectTool(shortcuts[e.key]);if(e.key==='+'||e.key==='=')renderer.zoomAt(1.15);if(e.key==='-')renderer.zoomAt(1/1.15);});
window.addEventListener('keyup',e=>{if(e.code==='Space')spaceDown=false;});window.addEventListener('blur',()=>{spaceDown=false;pointers.clear();drag=null;pinch=null;});
const layers=[['normal','Tự nhiên','#a6ba91'],['power','Điện năng','#eacc79'],['water','Nước sạch','#83c8ed'],['traffic','Lưu lượng giao thông','#8ce0ac'],['sewage','Nước thải','#77b8c9'],['garbage','Thu gom rác','#f1bc81'],['pollution','Ô nhiễm','#e7a479'],['services','Dịch vụ dân cư','#bba6ce']];
function setLayer(n){renderer.layer=n;$('layerOptions').innerHTML=layers.map(([id,text,color])=>`<button class="layer-option ${n===id?'active':''}" data-layer="${id}" aria-pressed="${n===id}"><i style="background:${color}"></i>${text}</button>`).join('')+`<details class="layer-legend"><summary>Chú giải màu</summary><p>${n==='normal'?'Màu phân khu: xanh lá · nhà ở; xanh dương · thương mại; vàng · công nghiệp.':n==='traffic'?'Xanh: còn năng lực. Cam / đỏ: lưu lượng cao. Chọn đoạn đường để xem số xe và nâng cấp.':n==='sewage'?'Xanh: được xử lý. Cam: thiếu trạm hoặc công suất.':n==='garbage'?'Cam đậm hơn: rác tích tụ nhiều hơn. Xây trạm thu gom có đường kết nối.':n==='pollution'?'Màu cam đậm hơn: ô nhiễm cao hơn.':n==='services'?'Xanh: có ít nhất 3 dịch vụ. Cam: ít dịch vụ.':'Màu sáng: đủ cung cấp. Cam đỏ: thiếu tiện ích.'}</p></details>`;$('layerOptions').querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{setLayer(b.dataset.layer);setLayersOpen(false);});}
function setLayersOpen(open){$('layersPanel').hidden=!open;hud.element.querySelector('[aria-label="Lớp dữ liệu"]').setAttribute('aria-pressed',String(open));}
setLayer('normal');$('layersBtn').onclick=()=>setLayersOpen($('layersPanel').hidden);
$('layersClose').onclick=()=>setLayersOpen(false);
$('layersReset').onclick=()=>{setLayer('normal');setLayersOpen(false);};
document.addEventListener('pointerdown',e=>{if(!$('layersPanel').hidden&&!e.target.closest('#layersPanel,[aria-label="Lớp dữ liệu"],#layersBtn'))setLayersOpen(false);});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('layersPanel').hidden){setLayersOpen(false);e.stopImmediatePropagation();}},true);

function refreshFinance(){const m=city.metrics;$('financeTaxIncome').textContent=money(m.taxIncome);$('financeBusIncome').textContent=money(m.transitIncome);$('financeExpenses').textContent=money(m.expenses);$('financeNet').textContent=(m.net>=0?'+':'')+money(m.net);$('financeNet').className=m.net>=0?'good':'warn';}
function budget(){
  const m=city.metrics;
  showModal(`<span class="news-kicker">TÀI CHÍNH THÀNH PHỐ</span><h2>Thuế & ngân sách</h2><div class="budget-table"><div><span>Thuế mỗi tháng</span><b id="financeTaxIncome">${money(m.taxIncome)}</b></div><div><span>Vé xe buýt mỗi tháng</span><b id="financeBusIncome">${money(m.transitIncome)}</b></div><div><span>Chi vận hành và lãi vay</span><b id="financeExpenses">${money(m.expenses)}</b></div><div><span>Dòng tiền mỗi tháng</span><b id="financeNet" class="${m.net>=0?'good':'warn'}">${m.net>=0?'+':''}${money(m.net)}</b></div></div><nav class="budget-tabs"><button data-finance="taxes" class="active">Thuế</button><button data-finance="services">Dịch vụ</button><button data-finance="loans">Khoản vay</button></nav><div id="finance-taxes">${[['residential','Thuế dân cư'],['commercial','Thuế thương mại'],['industrial','Thuế công nghiệp']].map(([key,text])=>`<div class="range-row"><label for="tax-${key}">${text}<b id="taxValue-${key}">${city.taxes[key]}%</b></label><input id="tax-${key}" type="range" min="0" max="20" step="1" value="${city.taxes[key]}" data-tax="${key}"></div>`).join('')}<p>Thuế dân cư trên 10% giảm hạnh phúc. Thuế doanh nghiệp cao làm giảm nhu cầu phân khu. Doanh nghiệp chỉ đóng thuế trên việc làm đã có người lao động.</p></div><div id="finance-services" hidden>${['power','water','sewage','waste','school','clinic','fire','police','bus'].map(kind=>`<div class="range-row"><label for="fund-${kind}">${CATALOG[kind].name}<b id="fundValue-${kind}">${city.budgets?.[kind]??100}%</b></label><input id="fund-${kind}" type="range" min="50" max="150" step="10" value="${city.budgets?.[kind]??100}" data-fund="${kind}"></div>`).join('')}<p>Ngân sách tăng công suất điện, nước, nước thải và phạm vi dịch vụ; đồng thời tăng chi phí vận hành. Hiệu lực ngay sau khi điều chỉnh.</p></div><div id="finance-loans" hidden><div class="budget-table"><div><span>Dư nợ</span><b>${money(city.loanBalance||0)}</b></div><div><span>Lãi suất</span><b>5% / năm</b></div><div><span>Lãi tháng này</span><b>${money(m.loanInterest)}</b></div></div><div class="modal-actions">${[500000,1000000,2000000].map(amount=>`<button class="action" data-borrow="${amount}">Vay ${money(amount)}</button>`).join('')}<button class="action" id="repayLoan" ${(city.loanBalance||0)<=0?'disabled':''}>Trả toàn bộ nợ</button></div><p>Hạn mức 5 tỷ ₫; lãi phân bổ theo số ngày lịch. Lãi tính vào chi phí; vay không tạo thu nhập thuế. Chỉ trả toàn bộ khi ngân sách đủ dư nợ.</p></div><button class="action full" id="budgetMarket">Cổ phiếu & xổ số · 5 giờ thực</button><button class="action primary full" id="budgetDone">Hoàn tất</button>`);
  $('modalBody').querySelectorAll('[data-tax]').forEach(input=>input.oninput=()=>{command('tax',{kind:input.dataset.tax,value:Number(input.value)});$('taxValue-'+input.dataset.tax).textContent=input.value+'%';analyze(city);changed();refreshFinance();});
  $('modalBody').querySelectorAll('[data-fund]').forEach(input=>input.oninput=()=>{city.budgets??={};command('fund',{kind:input.dataset.fund,value:Number(input.value)});$('fundValue-'+input.dataset.fund).textContent=input.value+'%';analyze(city);changed();refreshFinance();});
  $('modalBody').querySelectorAll('[data-finance]').forEach(button=>button.onclick=()=>{for(const panel of ['taxes','services','loans'])$('finance-'+panel).hidden=panel!==button.dataset.finance;$('modalBody').querySelectorAll('[data-finance]').forEach(b=>b.classList.toggle('active',b===button));});
  $('modalBody').querySelectorAll('[data-borrow]').forEach(button=>button.onclick=()=>{const result=command('borrow',{amount:Number(button.dataset.borrow)});if(!result.ok){toast(result.message);return;}changed();persist();budget();$('modalBody').querySelector('[data-finance="loans"]').click();});
  $('budgetMarket').onclick=financialMarket;
  $('repayLoan').onclick=()=>{const result=command('repay',{amount:city.loanBalance||0});if(!result.ok){toast(result.message);return;}changed();persist();budget();$('modalBody').querySelector('[data-finance="loans"]').click();};
  $('budgetDone').onclick=()=>{persist();closeModal();};
}
$('budgetBtn').onclick=budget;

function transit(){
  const stops=city.tiles.flatMap((t,i)=>t.kind==='busStop'?[{i,t}]:[]);
  const routes=city.network.busLines||[];
  showModal(`<span class="news-kicker">GIAO THÔNG CÔNG CỘNG</span><h2>Quản lý xe buýt</h2><p>Xây bến xe và ít nhất hai điểm dừng cạnh đường. Điểm dừng được chọn theo thứ tự bên dưới; xe chạy vòng qua chúng rồi trở về điểm đầu.</p><div class="transit-summary"><span>${routes.filter(l=>l.ok).length} tuyến hoạt động</span><span>${Math.round(city.metrics.busPassengers)} khách / ngày mô phỏng</span><span>${money(city.metrics.transitCost)} / tháng</span></div><div id="busLines">${routes.map(l=>`<div class="saved-city"><div><strong>${escape(l.name)}</strong><small>${l.stops.length} điểm dừng · ${l.vehicles} xe · ${escape(l.message)}</small></div><button class="action" data-line="${l.id}">Ngừng tuyến</button></div>`).join('')}</div><form id="transitForm"><label class="field">Tên tuyến<input name="name" required maxlength="36" value="Tuyến ${routes.length+1}"></label><label class="field">Số xe<select name="vehicles">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${n===2?'selected':''}>${n} xe · ${money(n*6000)}/tháng</option>`).join('')}</select></label><p>Thông số cân bằng game: 20 triệu ₫ mở tuyến + 120 triệu ₫/xe; vé 700 ₫ thu khi khách lên xe. Cửa mở tại điểm dừng, tối đa 60 khách/xe. Tuyến chưa nối đường vẫn trả chi phí xe cho đến khi ngừng tuyến.</p><div class="stop-list">${stops.length?stops.map(({i,t})=>`<label><input type="checkbox" name="stop" value="${i}"> Điểm ${i%SIZE+1}, ${Math.floor(i/SIZE)+1} <small>${t.connected?'Đã nối đường':'Chưa kết nối'}</small></label>`).join(''):'<p>Chưa có điểm dừng. Đóng bảng và xây điểm dừng trong nhóm Vận tải.</p>'}</div><p id="transitError" class="form-error" hidden role="alert"></p><button class="action primary full" type="submit">Mở tuyến · mua xe</button></form>`);
  $('transitForm').onsubmit=e=>{e.preventDefault();const fields=new FormData(e.currentTarget);const result=command('bus-line',{name:String(fields.get('name')),stops:fields.getAll('stop').map(Number),vehicles:Number(fields.get('vehicles'))});if(!result.ok){$('transitError').textContent=result.message;$('transitError').hidden=false;return;}changed();persist();renderer.lastPaths=-1;transit();toast('Đã mở tuyến xe buýt.');};
  $('busLines').querySelectorAll('[data-line]').forEach(b=>b.onclick=()=>{if(confirm('Ngừng tuyến này? Chi phí xe sẽ dừng, cư dân chuyển lại sang ô tô.')){command('remove-bus-line',{id:Number(b.dataset.line)});analyze(city);changed();persist();renderer.lastPaths=-1;transit();}});
}

function exportSave(){const blob=new Blob([JSON.stringify(encodeCity(serialize(city)))],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='build-city-26-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Đã xuất bản lưu thành phố.');}
function replaceCity(s,cloudRef=null){accumulator=0;tracked=null;watchDeparture=null;renderer.follow=null;city=s;restorePlayback();cityEpoch++;sync.use(user?.id||null,{cloud:cloudRef,dirty:!cloudRef});changeId++;localCollision=false;selected=null;renderer.reset();$('detailPanel').hidden=true;focusEmptyStart();persist();update();}
async function backups(){
  let rows;try{rows=await backupStore.list(user?.id||'guest');}catch(error){toast(error.message);return;}
  showModal(`<span class="news-kicker">BẢN DỰ PHÒNG TRÊN THIẾT BỊ</span><h2>Tiến trình trước đây</h2><p>Bản dự phòng được giữ trước khi mở hoặc tạo thành phố khác. Khôi phục cần xác nhận thay thành phố hiện tại; mỗi tài khoản chỉ có một thành phố.</p><div id="backupList">${rows.length?rows.map((r,i)=>`<div class="saved-city"><div><strong>${escape(r.name)}</strong><small>${new Date(r.modifiedAt).toLocaleString('vi-VN')}</small></div><button class="action" data-backup="${i}">Khôi phục</button><button class="action" data-export-backup="${i}">JSON</button><button class="delete-save" data-remove-backup="${i}" aria-label="Xóa bản dự phòng ${escape(r.name)}">×</button></div>`).join(''):'<p>Chưa có bản dự phòng.</p>'}</div>`);
  $('backupList').querySelectorAll('[data-backup]').forEach(b=>b.onclick=async()=>{try{const raw=await backupStore.read(rows[Number(b.dataset.backup)].key,user?.id||'guest');const restored=validateSave(JSON.parse(raw).city);if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}await requestNewCity(restored);}catch(error){toast(error.message);}});
  $('backupList').querySelectorAll('[data-remove-backup]').forEach(b=>b.onclick=async()=>{if(confirm('Xóa bản dự phòng trên thiết bị? Bản đám mây vẫn được giữ.')){try{await backupStore.remove(rows[Number(b.dataset.removeBackup)].key,user?.id||'guest');backups();}catch(error){toast(error.message);}}});
  $('backupList').querySelectorAll('[data-export-backup]').forEach(b=>b.onclick=async()=>{try{const raw=await backupStore.read(rows[Number(b.dataset.exportBackup)].key,user?.id||'guest');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.download='build-city-26-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}catch(error){toast(error.message);}});
}
let runtimeSample=null,runtimeReport=null;
async function measurePerformance(seconds=30){
 if(runtimeSample?.running)throw new Error('Đang đo hiệu năng.');
 const sample=new PerformanceSample();runtimeSample=sample;renderer.onRender=ms=>sample.frame(ms);sample.start();
 await new Promise(resolve=>setTimeout(resolve,seconds*1000));sample.running=false;sample.observer?.disconnect();
 runtimeReport={...sample.report(),...renderer.stats(),population:city.citizens.length,buildings:city.tiles.filter(t=>t.kind&&!isRoad(t)).length,roads:city.metrics.roadCount,simulationSeconds:city.clock.seconds,playback:{...city.playback},viewport:[innerWidth,innerHeight],browser:navigator.userAgent,platform:navigator.platform,logicalCores:navigator.hardwareConcurrency,deviceMemoryGB:navigator.deviceMemory??null,heapBytes:performance.memory?.usedJSHeapSize??null,scenario:'Game đang chơi + HUD thật',workerTickMs:null};return runtimeReport;
}
function graphics(){showModal(`<span class="news-kicker">ĐỒ HỌA RIÊNG BUILD CITY 26</span><h2>Chọn theo thiết bị</h2><p>Chỉ vẽ tối đa 50 đối tượng đang đi lại, tính cả người và xe, ở mọi quy mô dân số. Chất lượng Thấp và điện thoại tối đa 30. Vẫn giữ toàn bộ dân số, việc làm và hành trình trong bản lưu.</p><label class="field">Renderer<select id="renderMode" aria-label="Renderer"><option value="3d" ${renderer.mode==='3d'?'selected':''}>3D · nhà và cư dân bằng mesh</option><option value="2d" ${renderer.mode==='2d'?'selected':''}>Canvas nhẹ · 2.5D</option></select></label><label class="field">Chất lượng 3D<select id="renderQuality" aria-label="Chất lượng 3D">${[['auto','Auto · điều chỉnh theo hiệu năng'],['low','Thấp · mục tiêu 30 FPS, tắt bóng'],['medium','Vừa · mục tiêu 60 FPS, nền nhẹ'],['high','Cao · mục tiêu 60 FPS, có bóng']].map(([v,label])=>`<option value="${v}" ${renderer.qualityPreference===v?'selected':''}>${label}</option>`).join('')}</select></label><p>Chuột/chạm kéo để di chuyển, cuộn/hai ngón để zoom. Bấm Xoay rồi kéo để đổi góc 3D; nút Nhìn trên chuyển góc từ trên xuống. Máy yếu chọn Thấp hoặc Canvas. Đổi renderer giữ nguyên thành phố và bản lưu.</p><button class="action primary full" id="graphicsApply">Áp dụng</button><button class="action full" id="graphicsMeasure">Đo hiệu năng game thật · 30 giây</button>`);$('graphicsApply').onclick=async()=>{const mode=$('renderMode').value,quality=$('renderQuality').value;$('graphicsApply').disabled=true;await renderer.setMode(mode);renderer.setQuality(quality);$('cameraView').hidden=renderer.mode!=='3d';$('cameraRotate').hidden=renderer.mode!=='3d';persist();closeModal();toast(renderer.notice||'Đã áp dụng đồ họa.');};$('graphicsMeasure').onclick=async()=>{closeModal();toast('Đang đo game + HUD trong 30 giây.');try{const r=await measurePerformance();showModal('<h2>Hiệu năng đo thực tế</h2><pre id="runtimePerformance" style="white-space:pre-wrap;font-size:12px"></pre><button class="action full" id="performanceDone">Đóng</button>');$('runtimePerformance').textContent=JSON.stringify(r,null,2);$('performanceDone').onclick=closeModal;}catch(error){toast(error.message);}};}
async function requestNewCity(next){
  if(replacementReview||sync.busy||libraryBusy||checkpointBusy||financeBusy||missionBusy||financePending()||missionPending()){toast('Hoàn tất thao tác đang chờ trước khi thay thành phố.');return false;}
  replacementReview=true;
  const owner=user?.id||'guest',epoch=cityEpoch;
  let rows=[],pending;
  try{if(user){rows=await listCities();pending=cityReplacement.pending(owner);}}
  catch(error){replacementReview=false;toast(authMessage(error));return false;}
  if(owner!==(user?.id||'guest')||epoch!==cityEpoch){replacementReview=false;return false;}
  const names=rows.length?rows.map(row=>escape(row.name)).join(', '):escape(city.name);
  showModal(`<span class="news-kicker">MỘT THÀNH PHỐ MỖI TÀI KHOẢN</span><h2>${pending?'Tiếp tục yêu cầu tạo mới':'Xóa thành phố cũ để tạo mới?'}</h2><p>Thành phố sẽ thay thế: <strong>${names}</strong>.</p><p>${pending?'Có yêu cầu đang chờ đối soát. Thử lại dùng cùng biên nhận, không tạo thêm thành phố.':'Khi xác nhận, bản chơi và bản đám mây cũ sẽ được xóa, thay bằng một thành phố mới. Nếu hủy, mọi thứ được giữ nguyên.'}</p><p>Thành phố mới: <strong>${escape(pending?.name||next.name)}</strong>, ngân quỹ <strong>${money(pending?.state?.money??next.money)}</strong>. Một bản dự phòng phục hồi được giữ trên thiết bị; bản này không tạo thêm thành phố trên server.</p><div class="modal-actions"><button id="newCityCancel" class="action">Giữ thành phố cũ</button><button id="newCityConfirm" class="action danger">${pending?'Thử lại yêu cầu tạo mới':'Xóa cũ và tạo mới'}</button></div><p id="newCityError" class="form-error" role="alert" hidden></p>`);
  return new Promise(resolve=>{
    let settled=false;
    const finish=value=>{if(!settled){settled=true;replacementReview=false;modal.removeEventListener('close',cancel);resolve(value);}};
    const cancel=()=>finish(false);modal.addEventListener('close',cancel);
    $('newCityCancel').onclick=()=>{finish(false);closeModal();};
    $('newCityConfirm').onclick=async()=>{
      const button=$('newCityConfirm'),errorEl=$('newCityError');button.disabled=true;errorEl.hidden=true;
      try{
        if(owner!==(user?.id||'guest')||epoch!==cityEpoch)throw new Error('Thành phố hoặc tài khoản đã đổi. Mở lại yêu cầu tạo mới.');
        if(!await checkpoint())throw new Error(storageError||'Chưa giữ được bản dự phòng. Thử lại.');
        libraryBusy=true;
        if(user){
          if(!pending)for(const ref of rows){const row=await loadCity(ref.id);if(Number(row.revision)!==Number(ref.revision))throw new Error('Bản đám mây vừa thay đổi. Hủy và mở lại yêu cầu tạo mới.');await backupStore.archive(owner,JSON.stringify({city:row.state,modifiedAt:Date.parse(row.updated_at),cloud:{id:row.id,revision:Number(row.revision)}}));}
          await cityReplacement.replace(owner,{oldCities:rows,state:serialize(next)},async row=>{
            if(owner!==user?.id||epoch!==cityEpoch)throw new Error('Tài khoản đã đổi. Đăng nhập lại để mở thành phố mới.');
            replaceCity(validateSave(row.state),{id:row.id,revision:Number(row.revision)});
          });
        }else replaceCity(next);
        finish(true);selectTool('inspect');closeModal();document.dispatchEvent(new Event('bc26:play'));toast('Đã xóa thành phố cũ và tạo thành phố mới.');
      }catch(error){if(errorEl.isConnected){errorEl.hidden=false;errorEl.textContent=authMessage(error);}pending=cityReplacement.pending(owner);}
      finally{libraryBusy=false;if(button.isConnected)button.disabled=false;}
    };
  });
}
function emptyStartReview(){void requestNewCity(createEmptyCity({world:city.world,name:city.name}));}
async function financialMarket(){
 if(financeBusy||sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}
 showModal('<h2>Cổ phiếu & xổ số</h2><p>Đang đồng bộ sổ tiền…</p>');
 if(user&&!financePending()&&!sync.conflict){
  if(!sync.cloud||sync.dirty||sync.pending){if(!await cloudSave(false,true)){toast('Chưa đồng bộ được thành phố. Bạn vẫn có thể xem bảng giá.');}}
  if(sync.dirty&&!sync.conflict&&!sync.pending)await cloudSave(false,true);
 }
 let showFinancialMarket;try{({showFinancialMarket}=await import('./ui/financial-market.js'));}catch{showModal('<h2>Thị trường vừa được cập nhật</h2><p>Lưu tiến trình rồi tải lại game để mở phiên bản mới.</p><button id="reloadFinanceBuild" class="action primary">Lưu & tải lại</button>');$('reloadFinanceBuild').onclick=()=>{if(persist())location.reload();else toast('Chưa lưu được tiến trình. Hãy xuất JSON trước.');};return;}
 await showFinancialMarket({showModal,modal,context:()=>({owner:user?.id||null,city:sync.cloud?.id||null,money:city.money}),pending:financePending,login:()=>user?library():authDialog(),transact:async(order,round)=>{
  if(!user||!sync.cloud)throw new Error('Đăng nhập và lưu thành phố lên đám mây trước khi giao dịch.');
  if(sync.busy||libraryBusy||sync.conflict||localCollision||storageBlocked)throw new Error('Giải quyết thao tác lưu hoặc xung đột trong Tài khoản trước khi giao dịch.');
  const owner=user.id,ref=sync.cloud,epoch=cityEpoch;
  if(!financePending()&&(sync.dirty||sync.pending)){
   if(!await cloudSave(false,true)||sync.dirty||sync.pending)throw new Error('Chưa đồng bộ xong sổ tiền. Hãy thử lại.');
  }
  if(user?.id!==owner||cityEpoch!==epoch)throw new Error('Thành phố đã thay đổi.');
  financeBusy=true;libraryBusy=true;
  try{return await financeQueue.transact({owner,city:ref.id,revision:sync.cloud.revision,order,round,apply:row=>{
   if(user?.id!==owner||cityEpoch!==epoch)throw new Error('Chưa áp dụng biên nhận; mở lại thành phố và đối soát.');
   const restored=validateSave(row.state);city=restored;cityEpoch++;changeId++;accumulator=0;
   sync.use(owner,{cloud:{id:row.id,revision:Number(row.revision)},dirty:false});analyze(city);update();
   if(!persist())throw new Error('Đã xác nhận trên server nhưng chưa lưu được vào máy. Thử đối soát lại.');
  }});}catch(error){if(['40001','PT409'].includes(error.code)){sync.conflict=true;sync.status='conflict';persist();}throw error;}
  finally{financeBusy=false;libraryBusy=false;lastMs=performance.now();renderSaveStatus();}
 }});
}
function menu(){showModal(cityMenuMarkup({name:city.name,loggedIn:!!user,storageWarning,night:renderer.night,population:city.metrics.population,quality:renderer.qualityPreference}));document.querySelectorAll('[data-hub-tab]').forEach(tab=>tab.onclick=()=>{document.querySelectorAll('[data-hub-tab]').forEach(b=>{const active=b===tab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});document.querySelectorAll('[data-hub-panel]').forEach(panel=>panel.hidden=panel.dataset.hubPanel!==tab.dataset.hubTab);});$('graphicsBtn').onclick=graphics; $('menuCityName').onchange=e=>{const result=command('rename',{name:e.target.value});if(!result.ok){toast(result.message);e.target.value=city.name;return;}changed();persist();};$('menuSave').onclick=async()=>{closeModal();await manualSave();};$('menuLibrary').onclick=()=>user?library():authDialog();$('menuVietnam').onclick=vietnamMap;$('menuBudget').onclick=budget;$('menuTransit').onclick=transit;$('menuGoals').onclick=()=>{closeModal();$('missionBtn').click();};$('menuExport').onclick=exportSave;$('menuImport').onclick=()=>$('importFile').click();$('menuFinance').onclick=financialMarket;$('menuGuide').onclick=guide;$('menuResidents').onclick=()=>$('residentsBtn').click();$('menuMobility').onclick=mobilityCatalogue;$('menuPhoto').onclick=photoMode;$('menuAudio').onclick=audioSettings;$('menuTime').onclick=playbackSettings;$('menuWeather').onclick=()=>{$('weatherControl').click();};$('menuObserve').onclick=()=>{closeModal();$('observeBtn').click();};$('menuBackups').onclick=backups;$('menuNew').onclick=()=>{if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}emptyStartReview();};$('nightMode').onchange=e=>renderer.night=e.target.checked;}
function playbackSettings(){
 showModal(`<h2>Thời gian mô phỏng</h2><p>Ngày ${escape(calendar(city.clock.seconds).date.toLocaleDateString('vi-VN',{timeZone:'UTC'}))} · ${speed?'Đang chạy':'Tạm dừng'}. Mặc định 1 giây thực = 5 giây game.</p><div class="modal-actions"><button id="playbackPause" class="action">${speed?'Tạm dừng':'Tiếp tục'}</button>${[1,3,8].map(n=>`<button class="action ${speed===n?'primary':''}" data-playback-speed="${n}">${n}×</button>`).join('')}</div><p>Phím cách để tạm dừng hoặc tiếp tục khi đang chơi. Thay đổi tốc độ giữ nguyên tiến trình và bản lưu.</p><button id="playbackDone" class="action full">Đóng</button>`);
 $('playbackPause').onclick=()=>{setSpeed(speed?0:city.playback.multiplier);playbackSettings();};
 modal.querySelectorAll('[data-playback-speed]').forEach(b=>b.onclick=()=>{setSpeed(Number(b.dataset.playbackSpeed));playbackSettings();});
 $('playbackDone').onclick=closeModal;
}
function audioSettings(){
 const settings=interfaceAudio.preference;
 showModal(`<span class="news-kicker">TRẢI NGHIỆM</span><h2>Âm thanh giao diện</h2><p>Âm báo nhẹ khi chọn công cụ và đặt công trình. Âm thanh chỉ khởi động sau thao tác của bạn.</p><label class="toggle-row"><input id="audioEnabled" type="checkbox" ${settings.enabled?'checked':''}> Bật âm thanh</label><label class="field">Âm lượng <output id="audioVolumeLabel">${Math.round(settings.volume*100)}%</output><input id="audioVolume" type="range" min="0" max="100" value="${Math.round(settings.volume*100)}"></label><button id="audioPreview" class="action full">Nghe thử</button>`);
 $('audioEnabled').onchange=e=>interfaceAudio.setEnabled(e.target.checked);
 $('audioVolume').oninput=e=>{interfaceAudio.setVolume(Number(e.target.value)/100);$('audioVolumeLabel').textContent=e.target.value+'%';};
 $('audioPreview').onclick=()=>{if(!interfaceAudio.preference.enabled){interfaceAudio.setEnabled(true);$('audioEnabled').checked=true;}else void interfaceAudio.play('build');};
}
function exitPhoto(){document.body.removeAttribute('data-photo');$('photoControls')?.remove();}
function photoMode(){
 closeModal();selectTool('inspect');document.body.dataset.photo='true';
 const panel=document.createElement('div');panel.id='photoControls';panel.className='photo-controls';
 panel.innerHTML=`<span>${icon('camera',19)} Chụp ảnh thành phố</span><button id="photoDownload" class="action primary">Lưu PNG</button><button id="photoVideo" class="action">Quay cảnh game · 12 giây</button><button id="photoClose" class="action">Thoát · Esc</button>`;$('game').append(panel);
 $('photoClose').onclick=exitPhoto;
 $('photoVideo').onclick=async()=>{const b=$('photoVideo');b.disabled=true;let stream;try{const source=renderer.mode==='3d'?$('world3d'):$('world');if(!source.captureStream||typeof MediaRecorder==='undefined')throw new Error('Trình duyệt chưa hỗ trợ quay cảnh game.');stream=source.captureStream(24);const mime=['video/webm;codecs=vp8','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t)),recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:1800000}),chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.start();b.textContent='Đang quay 12 giây…';await new Promise(resolve=>setTimeout(resolve,12000));recorder.stop();await stopped;const blob=new Blob(chunks,{type:recorder.mimeType}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='build-city-26-'+city.clock.step+(recorder.mimeType.includes('mp4')?'.mp4':'.webm');link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(error){toast(error.message);}finally{stream?.getTracks().forEach(t=>t.stop());b.disabled=false;b.textContent='Quay cảnh game · 12 giây';}};
 $('photoDownload').onclick=async()=>{const button=$('photoDownload');button.disabled=true;try{const blob=renderer.capturePNG?await renderer.capturePNG():await new Promise((resolve,reject)=>$('world').toBlob(b=>b?resolve(b):reject(new Error('Không chụp được ảnh.')),'image/png'));const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='build-city-26-'+city.clock.step+'.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(error){toast(error.message);}finally{button.disabled=false;}};
}
async function vietnamMap(){if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}let showVietnamChooser;try{({showVietnamChooser}=await import('./game/geography/chooser.js'));}catch{showModal('<h2>Chưa tải được bản đồ</h2><p>Kết nối có thể bị gián đoạn hoặc game vừa có phiên bản mới. Tiến trình thành phố được giữ lại.</p><button class="action primary full" id="reloadMapBuild">Lưu tiến trình & tải lại game</button>');$('reloadMapBuild').onclick=()=>{if(persist())location.reload();else toast('Chưa lưu được tiến trình. Hãy xuất bản lưu trước khi tải lại.');};return;}showVietnamChooser({showModal,closeModal,onError:toast,onStart:async(pkg,manifest,name)=>{if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return false;}const next=createVietnamCity(pkg,manifest);next.name=name;return requestNewCity(next);}});}
$('menuBtn').onclick=menu;
$('importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>16_000_000)throw new Error('Bản nhập vượt giới hạn giải nén 16 MB.');const raw=JSON.parse(await f.text());const s=validateSave(raw.city||raw);if(sync.busy||libraryBusy)throw new Error('Hãy chờ thao tác đang chạy.');await requestNewCity(s);}catch(error){toast(error.message);}finally{e.target.value='';}};
function guide(){showModal(`<span class="news-kicker">CẨM NANG THỊ TRƯỞNG</span><h2>Bắt đầu xây thành phố</h2><div class="guide-art-row">${['residential','smallPower','smallWater','smallSewage'].map(k=>`<div>${buildingPreview(k)}<small>${CATALOG[k].name}</small></div>`).join('')}</div><ol class="guide-list"><li><b>Nối đường:</b> mở rộng từ mạng đường nối cổng phía tây. Kéo để xây từng đoạn. Cầu qua sông tính theo diện tích mặt cầu và trụ, có dự toán riêng.</li><li><b>Phân khu:</b> chọn nhà ở, thương mại hoặc công nghiệp rồi tô ô cạnh đường. Phí cấp phép đất tách khỏi giá xây. Nhà 3D xuất hiện ngay khi đặt. Cần đường, điện, nước và nước thải để hoạt động; cư dân đến theo mô phỏng.</li><li><b>Cấp điện và nước:</b> trạm phải cạnh đường kết nối. Trạm có giới hạn công suất và bán kính; xem bằng lớp bản đồ hoặc chọn công trình.</li><li><b>Chăm sóc dân cư:</b> xây công viên, trường học, y tế, rác thải và dịch vụ. Giữ nhà xưởng xa khu dân cư.</li><li><b>Cân đối ngân sách:</b> thuế tạo thu nhập, mỗi công trình có phí vận hành. Hạnh phúc và việc làm ảnh hưởng tăng dân số.</li><li><b>Lưu:</b> bản local tự lưu mỗi 15 giây. Với tài khoản đã mở một thành phố đám mây, game đồng bộ mỗi 60 giây. Nếu có xung đột, bản mới hơn được giữ.</li></ol><p>Chuột: kéo để di chuyển ở chế độ Khám phá, chuột phải để di chuyển khi xây, cuộn để phóng to. Điện thoại: một ngón kéo, hai ngón thu phóng. Phím 1–8 chọn công cụ, Space tạm dừng, Esc thoát xây dựng.</p><button id="guideDone" class="action primary full">Đóng cẩm nang</button>`);$('guideDone').onclick=closeModal;}

function authDialog(mode='login',notice='',draft=null){
  if(['reset','resend','recovery'].includes(mode))return legacyAuthDialog(mode,notice);
  if(!configured)return legacyAuthDialog(mode,notice);
  const titles={login:'Đăng nhập',register:'Tạo tài khoản',recover:'Khôi phục tài khoản',claim:'Đặt tên tài khoản',codes:'Tạo mã dự phòng mới'};
  const title=titles[mode];
  showModal(`<span class="news-kicker">TÀI KHOẢN BUILD CITY 26</span><h2>${title}</h2><p>${mode==='recover'?'Dùng mã dự phòng đã lưu khi đăng ký. Nếu mất cả mật khẩu và mã, bạn không thể tự khôi phục.':'Lưu thành phố và tiếp tục xây dựng trên thiết bị khác.'}</p>${notice?`<p class="form-notice" role="status">${escape(notice)}</p>`:''}${accountForm(mode,{startingPlaceName:draft?.placeName})}${mode==='login'?'<button class="link-button" id="accountRegister">Chưa có tài khoản? Đăng ký</button><button class="link-button" id="accountRecover">Quên mật khẩu</button><button class="link-button" id="accountLegacy">Tôi có tài khoản email từ bản cũ</button>':'<button class="link-button" id="accountLogin">Quay lại đăng nhập</button>'}<p class="credit">Tài khoản: 3–24 chữ a–z, số hoặc _. Mật khẩu ít nhất 8 ký tự; giữ nguyên chữ hoa và khoảng trắng.</p>`);
  if(['register','login'].includes(mode)){
    const body=$('modalBody'),card=body.innerHTML;
    body.innerHTML=`<div class="auth-intro"><div class="auth-brand">${icon('city',48)}<span>BUILD CITY <b>26</b></span></div><div class="auth-caption"><h2>${mode==='register'?'Thành phố mới bắt đầu từ bạn.':'Thành phố của bạn đang chờ.'}</h2><p>${mode==='register'?'Quy hoạch hôm nay. Phát triển ngày mai.':'Tiếp tục xây dựng những điều lớn lao.'}</p><span></span></div><small>Ảnh minh họa · Bắt đầu với ${money(NEW_CITY_CASH_BC)} trong game</small></div><div class="auth-side"><button type="button" class="auth-home" id="authBackHome">Về trang chủ <span>↗</span></button><section class="auth-card">${mode==='register'?'<div class="auth-emblem">'+icon('city',40)+'</div>':''}${card}<p class="auth-save-note">${icon('save',17)}Tiến trình được lưu theo tài khoản</p></section></div>`;
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
      let showVietnamChooser;try{({showVietnamChooser}=await import('./game/geography/chooser.js'));}catch{toast('Chưa tải được bản đồ. Thông tin đăng ký vẫn được giữ; kiểm tra kết nối hoặc mở lại game nếu vừa cập nhật.');return;}
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
      if(['register','login'].includes(mode)&&!await checkpoint())throw new Error(storageError||'Chưa giữ được tiến trình. Thử đăng nhập lại.');
      const username=String(fields.get('username')||''),payload={username};
      if(mode!=='claim')payload.password=String(fields.get('password')||'');
      if(mode==='register'){payload.cityName=String(fields.get('cityName')||'');payload.requestId=registrationRequest(username);payload.regionId=draft?.regionId||null;}
      if(mode==='recover')payload.code=String(fields.get('code')||'');
      let token=null;if(['claim','codes'].includes(mode)){const {data}=await supabase.auth.getSession();token=data.session?.access_token;}
      const data=await accountRequest(mode,payload,token);
      form.elements.password&&(form.elements.password.value='');
      if(mode==='recover'){await supabase.auth.signOut({scope:'local'});await handleSession(null,'SIGNED_OUT');showRecoveryCode(data.recoveryCode,()=>authDialog('login','Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.'));return;}
      if(['claim','codes'].includes(mode)){showRecoveryCode(data.recoveryCode,()=>library(),token);return;}
      const session=await acceptAccountSession(supabase,data);await handleSession(session,'SIGNED_IN');
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
      if(mode==='login'&&!await checkpoint())throw new Error(storageError||'Chưa giữ được tiến trình. Thử lại.');
      const data=await authenticate(supabase,mode,{email:String(fields.get('email')||'').trim(),password:String(fields.get('password')||''),confirmPassword:fields.get('confirmPassword'),displayName:String(fields.get('displayName')||'').trim()},location.origin+'/');
      if(!form.isConnected)return;
      if(mode==='signup'&&!data.session){legacyAuthDialog('login','Đã gửi email xác nhận. Mở email và bấm liên kết để hoàn tất đăng ký.');return;}
      if(emailOnly){legacyAuthDialog('login',mode==='reset'?'Nếu email có tài khoản, bạn sẽ nhận liên kết đặt lại mật khẩu.':'Nếu tài khoản cần xác nhận, bạn sẽ nhận được email mới.');return;}
      if(mode==='recovery'){recoveryMode=false;$('accountBtn').textContent='Tài khoản';closeModal();toast('Đã đổi mật khẩu.');return;}
      await handleSession(data.session,'SIGNED_IN');document.dispatchEvent(new Event('bc26:play'));closeModal();toast(mode==='signup'?'Đã tạo tài khoản.':'Đăng nhập thành công.');void library();
    }catch(error){if(errorEl.isConnected){errorEl.textContent=authMessage(error);errorEl.hidden=false;}}
    finally{if(submit.isConnected){submit.disabled=false;submit.textContent=title;}}
  };
}

async function cloudSave(forceNew=false,quiet=false){
  if(!user||!supabase||localCollision)return false;
  if(replacementReview||checkpointBusy){if(!quiet)toast('Đang giữ bản dự phòng hoặc xác nhận thay thành phố.');return false;}
  if(missionBusy||missionPending()){if(!quiet)toast('Mở Nhiệm vụ để đối soát yêu cầu đang chờ.');return false;}
  if(financeBusy||financePending()){if(!quiet)toast('Đối soát giao dịch trong Cổ phiếu & xổ số trước khi lưu.');return false;}
  if(forceNew){if(!quiet)toast('Mỗi tài khoản chỉ có một thành phố. Dùng Thành phố mới để xác nhận thay thế.');return false;}
  if(!sync.cloud&&!sync.pending){try{const rows=await listCities();if(rows.length){if(!quiet)toast('Tài khoản đã có thành phố. Mở bản đã lưu hoặc chọn Thành phố mới để thay thế.');return false;}}catch(error){if(!quiet)toast(authMessage(error));return false;}}
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
  showModal(`<span class="news-kicker">TÀI KHOẢN BUILD CITY 26</span><h2>Thành phố đã lưu</h2>${sync.conflict?'<div class="conflict-panel"><strong>Bản đám mây đã thay đổi</strong><p>Tiến trình trên máy được giữ lại. Chọn Mở để tạo bản dự phòng và tải bản mới từ máy chủ. Bạn cũng có thể xuất bản lưu để tự giữ riêng.</p><button id="conflictExport" class="action">Xuất JSON</button></div>':''}<p id="libraryStatus" role="status">Đang tải danh sách…</p><div id="cityList"></div><div class="modal-actions"><button id="librarySave" class="action primary">Lưu thành phố hiện tại</button><button id="libraryNew" class="action">Thành phố mới</button><button id="libraryBackups" class="action">Bản dự phòng trên máy</button><button id="libraryRefresh" class="action">Tải lại danh sách</button></div><button id="accountCodes" class="action" hidden>Tạo mã dự phòng mới</button><button id="claimUsername" class="link-button" hidden>Đặt tên tài khoản cho tài khoản email cũ</button><button id="signoutBtn" class="link-button">Đăng xuất trên thiết bị này</button>`);
  const status=$('libraryStatus'),list=$('cityList');
  const active=()=>user?.id===owner&&cityEpoch===epoch&&status.isConnected&&modal.open;
  if($('conflictExport'))$('conflictExport').onclick=exportSave;
  $('librarySave').disabled=sync.conflict;
  const save=async(forceNew,button)=>{button.disabled=true;if(await cloudSave(forceNew)){toast('Đã lưu thành phố.');if(active())void library();}else if(button.isConnected)button.disabled=sync.conflict&&!forceNew;};
  $('librarySave').onclick=e=>save(false,e.currentTarget);
  $('libraryBackups').onclick=backups;$('libraryRefresh').onclick=library;
  $('libraryNew').onclick=()=>requestNewCity(createEmptyCity());
  $('signoutBtn').onclick=async e=>{
    if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}if(!persist()){toast('Hãy xuất JSON để giữ tiến trình trước khi đăng xuất.');return;}
    const button=e.currentTarget;button.disabled=true;
    const {error}=await supabase.auth.signOut({scope:'local'});
    if(error){toast(authMessage(error));if(button.isConnected)button.disabled=false;return;}
    await handleSession(null,'SIGNED_OUT');closeModal();toast('Đã đăng xuất. Bản lưu đám mây vẫn được giữ.');
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
      if(!await checkpoint())return;
      libraryBusy=true;button.disabled=true;
      try{const row=await loadCity(button.dataset.load);if(!active())return;const restored=validateSave(row.state);replaceCity(restored,{id:row.id,revision:Number(row.revision)});closeModal();toast('Đã mở '+restored.name);}
      catch(error){if(active())toast(authMessage(error));}finally{libraryBusy=false;if(button.isConnected)button.disabled=false;}
    });
    list.querySelectorAll('[data-delete]').forEach(button=>button.onclick=async()=>{
      if(sync.busy||libraryBusy){toast('Hãy chờ thao tác đang chạy.');return;}
      if(!confirm('Xóa vĩnh viễn bản lưu đám mây này?'))return;
      const ref=rows.find(row=>row.id===button.dataset.delete);
      if(sync.cloud?.id===ref.id&&!await checkpoint())return;
      libraryBusy=true;button.disabled=true;
      try{await deleteCity(ref.id,Number(ref.revision));if(!active())return;if(sync.cloud?.id===ref.id){sync.use(owner);persist();}libraryBusy=false;void library();}
      catch(error){if(active()){toast(authMessage(error));if(button.isConnected)button.disabled=false;}}finally{libraryBusy=false;}
    });
  }catch(error){if(active())status.textContent=authMessage(error);}
}

let authOwner=null;
async function handleSession(session,event){
  const next=session?.user||null;
  if(event==='PASSWORD_RECOVERY')recoveryMode=true;
  if(!next)recoveryMode=false;
  if(authOwner!==(next?.id||null)){
    const guestCity=!user&&next?city:null;persist();authOwner=next?.id||null;user=next;
    let saved=null;storageBlocked=false;
    try{saved=loadLocal(next?.id||'guest');city=saved?.city||guestCity||createEmptyCity();if(saved?.migrated){try{await backupStore.archiveLocal(next?.id||'guest');}catch{storageBlocked=true;storageWarning=true;storageError='Đã mở bản cũ; bộ nhớ đầy, hãy xuất JSON và quản lý bản dự phòng trước khi lưu.';}}}catch{try{await backupStore.archiveLocal(next?.id||'guest');}catch{storageBlocked=true;}city=guestCity||createEmptyCity();storageWarning=true;}
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
  if(!document.hidden&&document.body.dataset.screen!=='home'&&!modal.open&&!financeBusy&&!financePending()&&!missionBusy&&!missionPending()&&!checkpointBusy&&!replacementReview&&speed){
    accumulator+=simulationDelta(dt,city.playback);
    const before=city.day,beforeLevel=cityLevel(city);
    let stop=false;const batch=consumeSteps(accumulator,()=>{const tickStarted=performance.now();stepSimulation(city);runtimeSample?.tick(performance.now()-tickStarted);if(watchDeparture&&city.citizens.find(c=>c.id===watchDeparture)?.journey){watchDeparture=null;observe=true;setSpeed(1);$('observeBtn').classList.add('active');stop=true;toast('Chuyến đi bắt đầu — đã chuyển sang Quan sát.');return false;}},120);accumulator=stop?0:batch.remaining;
    if(cityLevel(city)>beforeLevel)toast(`Lên cấp ${cityLevel(city)} · +${money((cityLevel(city)-beforeLevel)*100000)} thưởng!`);
    if(batch.count){changeId++;sync.changed();if(ms-(loop.lastUpdate||0)>250||city.day!==before){update();renderSaveStatus();loop.lastUpdate=ms;}}
  }
  renderer.renderAlpha=!document.hidden&&document.body.dataset.screen!=='home'&&!modal.open&&speed?Math.max(.00001,accumulator/STEP_SECONDS):0;
  requestAnimationFrame(loop);
}
lastMs=performance.now();requestAnimationFrame(loop);setInterval(persist,15000);setInterval(()=>{if(user&&(sync.cloud||sync.pending)&&sync.dirty&&!sync.busy&&!sync.conflict&&!libraryBusy&&!missionBusy&&!missionPending()&&!localCollision)void cloudSave(false,true);},60000);window.addEventListener('beforeunload',persist);
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();lastMs=performance.now();});
update();
$('cameraView').hidden=renderer.mode!=='3d';$('cameraRotate').hidden=renderer.mode!=='3d';
$('loading').hidden=true;const rendererNotice=renderer.notice;if(rendererNotice)toast(rendererNotice);
if(storageWarning)toast(storageError||'Chưa lưu được trên thiết bị. Hãy xuất JSON để giữ tiến trình.');

// Optional browser-native agent tools, using exactly the same game actions.
if(document.modelContext?.registerTool){
  const controller=new AbortController();
  const registrations=[{name:'measure_city_performance',description:'Measure ten seconds of the actual running game renderer, simulation and HUD without changing the city.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>measurePerformance(10)},{name:'read_renderer_status',description:'Read actual renderer mode, quality, GPU resource counts and visible rendering statistics for development QA.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({...renderer.stats(),thumbnailCache:thumbnailCacheStats()})},{
    name:'read_city_status',description:'Read the current Build City 26 simulation and selected city.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({name:city.name,day:city.day,seconds:city.clock.seconds,playback:{...city.playback},money:Math.round(city.money),...city.metrics,geography:city.world.geography?{mode:'vietnam',province:city.world.geography.provinceName,region:city.world.geography.regionId,version:city.world.geography.version,anchor:city.world.geography.anchor,entryTile:city.world.geography.entryTile,widthMeters:city.world.widthMeters,cellMeters:city.world.cellMeters,osmDate:city.world.geography.osmDate}:null})
  },{
    name:'build_city_tiles',description:'Build up to 100 city tiles using the same costs and validation as the visible game.',inputSchema:{type:'object',properties:{designId:{type:'string',enum:Object.keys(PRIVATE_DESIGNS)},kind:{type:'string',enum:Object.keys(CATALOG).filter(k=>k!=='inspect'&&k!=='bulldoze')},tiles:{type:'array',minItems:1,maxItems:100,items:{type:'object',properties:{x:{type:'integer',minimum:0,maximum:SIZE-1},y:{type:'integer',minimum:0,maximum:SIZE-1}},required:['x','y'],additionalProperties:false}}},required:['kind','tiles'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{
      if(!input||!CATALOG[input.kind]||['bulldoze','inspect'].includes(input.kind)||!Array.isArray(input.tiles)||input.tiles.length<1||input.tiles.length>100||input.tiles.some(t=>!t||!Number.isInteger(t.x)||!Number.isInteger(t.y)||t.x<0||t.y<0||t.x>=SIZE||t.y>=SIZE))throw new Error('Invalid tool input');
      const results=input.tiles.map(t=>({x:t.x,y:t.y,...command(input.kind==='park'?'construct':'place',{x:t.x,y:t.y,kind:input.kind,designId:input.designId})}));changed();renderer.lastPaths=-1;persist();return {results,money:Math.round(city.money)};
    }
  }];
  for(const registration of registrations){try{Promise.resolve(document.modelContext.registerTool(registration,{signal:controller.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>controller.abort(),{once:true});
}


function mobilityCatalogue(groupId=MOBILITY_GROUPS[0].id){
 if(typeof groupId!=='string')groupId=MOBILITY_GROUPS[0].id;
 const activeIds=new Set([...city.citizens.map(citizenArtId),...city.vehicles.map(vehicleArtId)]);
 const group=MOBILITY_GROUPS.find(g=>g.id===groupId)||MOBILITY_GROUPS[0];
 const assets=Object.values(MobilityArtRegistry).filter(a=>a.group===group.id);
 showModal(`<span class="news-kicker">THIẾT KẾ THÀNH PHỐ · 144 MẪU</span><h2>Cư dân & phương tiện</h2><label class="field">Nhóm mẫu<select id="mobilityGroup">${MOBILITY_GROUPS.map(g=>`<option value="${g.id}" ${g.id===group.id?'selected':''}>${g.label}</option>`).join('')}</select></label><p>Ảnh tham chiếu một góc nhìn. Nhãn bên dưới cho biết model và nghiệp vụ đã nối; mẫu chưa nối chưa xuất hiện trong mô phỏng.</p><div class="mobility-catalogue">${assets.map(a=>`<article class="mobility-card">${mobilityThumbnail(a.id)}<div><h3>${a.nameVi}</h3><small>${mobilityMeshStatus(a.id)==='mesh'?'Mesh 3D có bộ phận riêng':'Ảnh tham chiếu · chưa dựng mesh'}</small><small>${mobilityRuntimeStatus(a.id)}</small>${activeIds.has(a.id)?'<span class="badge">Có trong thành phố</span>':''}</div></article>`).join('')}</div><button id="mobilityResidents" class="action full">Xem cư dân thực trong thành phố</button>`);
 $('mobilityGroup').onchange=e=>mobilityCatalogue(e.target.value);$('mobilityResidents').onclick=()=>$('residentsBtn').click();
}

const stateLabel={home:'Ở nhà',sleeping:'Đang ngủ',walking:'Đi bộ', 'in-vehicle':'Trên xe', 'at-work':'Tại nơi làm việc',blocked:'Bị chặn','waiting-bus':'Chờ xe buýt','on-bus':'Trên xe buýt'};
function trackCitizen(id){hideOverviewOnPhone();tracked=id;selected=null;renderer.selected=null;renderer.follow=id;selectToolForTracking();inspectCitizen(id);}
function selectToolForTracking(){hud.close();tool='inspect';renderer.tool='inspect';$('toolTray').hidden=true;$('toolInfo').hidden=true;$('mapHint').hidden=false;}
function inspectCitizen(id){
  if(city.vehicles.some(v=>v.id===id)){inspectVehicle(id);return;}
  const c=city.citizens.find(c=>c.id===id);if(!c){tracked=null;renderer.follow=null;return;}
  const opening=!hud.isOpen('building');const j=c.journey,work=city.firms.find(f=>f.id===c.work),v=city.vehicles.find(v=>v.id===c.vehicle);
  $('detailPanel').hidden=false;$('detailTitle').textContent='THEO DÕI CƯ DÂN';$('detailPanel').classList.add('inspect');
  $('detailBody').innerHTML=`${mobilityThumbnail(citizenArtId(c))}<small class="art-caption">${MobilityArtRegistry[citizenArtId(c)].nameVi}</small><h2 class="news-title">${escape(c.name)}</h2><p class="badge">${(c.journey?.purpose==='move-in'?'Chuyển đến nhà mới':stateLabel[c.state])}</p><div class="detail-list"><div><span>ID · tuổi</span><b>${escape(c.id)} · ${c.age}</b></div><div><span>Hộ</span><b>${escape(c.household)}</b></div><div><span>Nhà</span><b>${c.home%SIZE+1}, ${Math.floor(c.home/SIZE)+1}</b></div><div><span>Nơi làm việc</span><b>${work?`${work.home%SIZE+1}, ${Math.floor(work.home/SIZE)+1}`:'Chưa có việc / không thuộc tuổi lao động'}</b></div><div><span>Mục tiêu</span><b>${(c.busPlan?.destination??c.goal)===c.home?'Về nhà':c.busPlan?'Đi làm qua tuyến buýt':'Đến nơi làm việc'}</b></div><div><span>Vị trí mét</span><b>${c.position.x.toFixed(1)} · ${c.position.y.toFixed(1)}</b></div><div><span>Hành trình</span><b>${j?`${j.mode==='car'?'Ô tô':'Đi bộ'} · đoạn ${j.segment+1}/${j.path.length-1}`:'Không đang di chuyển'}</b></div><div><span>Xe</span><b>${c.busPlan?.vehicleId?escape(c.busPlan.vehicleId):v?MobilityArtRegistry[vehicleArtId(v)].nameVi+' · '+escape(v.id):'Không có'}</b></div><div><span>Quãng đường đã đi</span><b>${Math.round(c.travelled||0)} m</b></div><div><span>Đã đến làm</span><b>${c.attendance} lần</b></div></div>${c.waitReason?`<p class="warn">${escape(c.waitReason)}</p>`:''}<p>Lịch ngày thường: rời nhà ${formatTime(c.schedule.depart)}, về ${formatTime(c.schedule.return)}. Đây là nền lịch/route; chưa có mua hàng, trường và crossing.</p><button class="action full" id="toggleTracking">${renderer.follow?'Dừng camera theo dõi':'Theo dõi bằng camera'}</button><button class="action full" id="watchDeparture" ${!c.work?'disabled':''}>Quan sát chuyến tiếp theo</button>`;
  hydrateMobilityThumbnails($('detailBody'));
  $('watchDeparture').onclick=()=>{watchDeparture=id;observe=false;accumulator=0;setSpeed(8);toast('Đang chờ chuyến tiếp theo; sẽ tự chuyển sang tốc độ tự nhiên khi rời đi.');};
  if(opening){updateHud();hud.showBuilding();}
  $('toggleTracking').onclick=()=>{renderer.follow=renderer.follow?null:id;inspectCitizen(id);};
}
function inspectVehicle(id){
 const v=city.vehicles.find(v=>v.id===id);if(!v)return;const opening=!hud.isOpen('building');
 const a=MobilityArtRegistry[vehicleArtId(v)],line=city.busLines.find(l=>l.id===v.operator),labels={depot:'Tại bến xe',driving:'Đang chạy tuyến',stop:'Đón / trả khách'};
 $('detailPanel').hidden=false;$('detailTitle').textContent='THEO DÕI PHƯƠNG TIỆN';$('detailPanel').classList.add('inspect');
 $('detailBody').innerHTML=`${mobilityThumbnail(a.id)}<h2 class="news-title">${a.nameVi}</h2><p class="badge">${v.state==='blocked'?'Bị chặn':labels[v.busPhase]||v.state}</p><div class="detail-list"><div><span>ID</span><b>${escape(v.id)}</b></div><div><span>Tuyến</span><b>${escape(line?.name||'Xe cá nhân')}</b></div><div><span>Điểm đến</span><b>${v.goal%SIZE+1}, ${Math.floor(v.goal/SIZE)+1}</b></div><div><span>Hành khách</span><b>${v.passengers.length} / ${v.kind==='bus'?60:4}</b></div><div><span>Tốc độ</span><b>${((v.speed||0)*3.6).toFixed(1)} km/h</b></div><div><span>Quãng đường</span><b>${Math.round(v.travelled||0)} m</b></div><div><span>Đã đón hôm nay</span><b>${v.boardedToday||0} người</b></div><div><span>Cửa</span><b>${v.doors?'Mở tại điểm dừng':'Đóng'}</b></div><div><span>Vận hành</span><b>${v.kind==='bus'?money(6000)+'/tháng':'Chưa tính riêng'}</b></div></div>${v.waitReason?`<p class="warn">${escape(v.waitReason)}</p>`:''}<button id="toggleVehicleTracking" class="action full">${renderer.follow?'Dừng camera theo dõi':'Theo dõi bằng camera'}</button>`;
 if(opening){updateHud();hud.showBuilding();}
 hydrateMobilityThumbnails($('detailBody'));$('toggleVehicleTracking').onclick=()=>{renderer.follow=renderer.follow?null:id;inspectVehicle(id);};
}
function formatTime(seconds){return String(Math.floor(seconds/3600)).padStart(2,'0')+':'+String(Math.floor(seconds%3600/60)).padStart(2,'0');}
$('observeBtn').onclick=()=>{watchDeparture=null;observe=!observe;accumulator=0;$('observeBtn').classList.toggle('active',observe);setSpeed(1);update();toast(observe?'Quan sát: thời gian mô phỏng chạy như đồng hồ thật.':'Chế độ chơi: 1 giây thực = 5 giây game; 1 ngày game = 4 giờ 48 phút thực.');};
$('residentsBtn').onclick=()=>{
  showModal(`<span class="news-kicker">THỰC THỂ TRONG THÀNH PHỐ</span><h2>${city.citizens.length} cư dân · ${city.households.length} hộ</h2><button id="openMobilityCatalogue" class="action full">Bộ mẫu cư dân & phương tiện</button><p>Chọn một người, camera theo đúng ID. Chuyển sang Quan sát để xem vận tốc tự nhiên. Không có người hoặc xe được sinh riêng cho renderer.</p><div class="resident-list">${city.vehicles.filter(v=>v.kind==='bus').map(v=>`<button class="action" data-person="${v.id}">Xe buýt · ${escape(v.id)} · ${v.passengers.length}/60</button>`).join('')}${city.citizens.slice(0,100).map(c=>`<button class="action" data-person="${c.id}">${escape(c.name)} · ${(c.journey?.purpose==='move-in'?'Chuyển đến nhà mới':stateLabel[c.state])}</button>`).join('')}</div>`);
  $('openMobilityCatalogue').onclick=mobilityCatalogue;
  $('modalBody').querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>{closeModal();trackCitizen(b.dataset.person);});
};

return {startBuilding(){if(user){document.dispatchEvent(new Event('bc26:play'));lastMs=performance.now();}else authDialog('register');},enterGame(){lastMs=performance.now();if(firstEntry&&city.metrics.roadCount<10){firstEntry=false;const entry=city.world.geography?.entryTile??index(0,18);renderer.focusTile(Math.min(SIZE-1,entry%SIZE+4),Math.floor(entry/SIZE));}},openAccount:authDialog,openGeography:vietnamMap,openGuide:guide,openMissions:()=>$('missionBtn').click(),openSaves:()=>user?library():authDialog()};
}
export const gameReady=startGame().catch(error=>{document.getElementById('loading').hidden=true;document.getElementById('toast').hidden=false;document.getElementById('toast').textContent='Không mở được game. Hãy tải lại trang; bản lưu trên máy vẫn được giữ.';console.error(error);throw error;});
