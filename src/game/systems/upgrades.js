import {CATALOG,ZONES,BUILDINGS,serviceKind} from '../../config/catalog.js';
import {UPGRADE_COST_FACTORS,capacityFactor,privateBuildPrice} from '../../config/building-economy.js';
import {recordCash} from './economy.js';
import {entityId,emit} from './events.js';
export function upgradeQuote(s,i){
 const t=s.tiles[i];if(!t||![...BUILDINGS,...ZONES].includes(t.kind)||t.kind==='busStop'||CATALOG[t.kind]?.decorative)return null;
 const target=t.level+1;if(target>5)return {target,ready:false,conditions:[{name:'Đã đạt cấp tối đa 5',ok:false}]};
 const base=t.upgrade?.basePrice||t.development?.basePrice||(ZONES.includes(t.kind)?privateBuildPrice(t.kind):t.historicalCost||CATALOG[t.kind].cost);
 const price=Math.ceil(base*UPGRADE_COST_FACTORS[target]),reserve=Math.ceil(price*.1);
 const source=['power','water'].includes(serviceKind(t.kind));
 const conditions=[{name:'Đường nối vùng',ok:!!t.connected},{name:'Điện và nước đủ tải hiện tại',ok:source?!!t.connected:!!t.power&&!!t.water},{name:'Xử lý nước thải',ok:source||!!t.sewage},{name:'Hợp đồng trước đã nghiệm thu',ok:t.upgrade?.status!=='building'}];
 if(target>=2&&!source)conditions.push({name:'Thu gom rác và công viên',ok:t.services?.includes('waste')&&t.services?.includes('park')});
 if(target>=3&&!source)conditions.push({name:'Y tế, cứu hỏa và giáo dục',ok:['clinic','fire','school'].every(k=>t.services?.includes(k))},{name:'Tuyến xe buýt đang hoạt động',ok:s.metrics.busLines>0});
 if(target>=4)conditions.push({name:'Mạng viễn thông — hệ thống chưa được triển khai',ok:false});
 if(target>=5)conditions.push({name:'Tiện ích xã hội và nguồn dự phòng — chưa triển khai',ok:false});
 return {target,basePrice:base,price,reserve,total:price+reserve,private:ZONES.includes(t.kind),factor:capacityFactor({...t,level:target,upgrade:{version:1}}),conditions,ready:conditions.every(c=>c.ok)};
}
export function startUpgrade(s,i,payer='owner'){
 const q=upgradeQuote(s,i);if(!q||!q.ready)return {ok:false,message:q?.conditions.filter(c=>!c.ok).map(c=>c.name).join(' · ')||'Công trình không nâng cấp được.'};
 if(!['owner','city'].includes(payer))return {ok:false,message:'Bên thanh toán không hợp lệ.'};
 const publicFunds=!q.private||payer==='city';if(publicFunds&&s.money<q.total)return {ok:false,message:'Ngân sách không đủ khoản nâng cấp và dự phòng.'};
 if(!publicFunds&&(s.privateInvestment?.available??20000000)<q.total)return {ok:false,message:'Vốn chủ đầu tư không đủ nâng cấp.'};
 const id=entityId(s,'upgrade'),t=s.tiles[i];
 if(publicFunds)recordCash(s,id+'-escrow',q.private?'private-upgrade-subsidy':'upgrade-escrow',-q.total,t.assetId);
 else{s.privateInvestment??={rule:'private-casual-15min-v1',opening:20000000,available:20000000,projects:[]};s.privateInvestment.available-=q.total;s.privateInvestment.projects.push({id,tile:i,price:q.total,seconds:s.clock.seconds});}
 t.upgrade={version:1,id,basePrice:q.basePrice,price:q.price,reserve:q.reserve,payer:publicFunds?'city':'owner',target:q.target,work:0,required:900,status:'building',baseLevel:t.upgrade?.baseLevel||t.level,baseCapacity:t.upgrade?.baseCapacity||(t.kind==='residential'?24*t.level:(t.kind==='commercial'?16:28)*t.level)};
 emit(s,'upgrade-started',id,{tile:i,target:q.target,payer:t.upgrade.payer});s.graphVersion++;return {ok:true,cost:publicFunds?q.total:0};
}
export function updateUpgrades(s){let changed=false;for(const [i,t] of s.tiles.entries()){const u=t.upgrade;if(u?.status!=='building')continue;const quote=upgradeQuote(s,i);if(!quote?.conditions.filter(c=>c.name!=='Hợp đồng trước đã nghiệm thu').every(c=>c.ok))continue;u.work=Math.min(u.required,u.work+1);if(u.work===u.required){t.level=u.target;u.status='completed';if(!ZONES.includes(t.kind))t.historicalCost=(t.historicalCost||0)+u.price;if(u.payer==='city')recordCash(s,u.id+'-release','upgrade-reserve-release',u.reserve,t.assetId);else{s.privateInvestment.available+=u.reserve;const p=s.privateInvestment.projects.find(p=>p.id===u.id);p.price-=u.reserve;}emit(s,'upgrade-completed',u.id,{tile:i,asset:t.assetId,level:t.level});changed=true;}}return changed;}
export function validateUpgrade(u,level){if(u==null)return null;if(u.version!==1||typeof u.id!=='string'||!u.id||!['city','owner'].includes(u.payer)||!['building','completed'].includes(u.status)||![u.basePrice,u.price,u.reserve,u.work,u.required,u.baseCapacity].every(Number.isFinite)||u.basePrice<=0||u.price!==Math.ceil(u.basePrice*UPGRADE_COST_FACTORS[u.target])||u.reserve!==Math.ceil(u.price*.1)||u.required!==900||u.work<0||u.work>900||u.baseCapacity<0||!Number.isInteger(u.baseLevel)||u.baseLevel<1||u.baseLevel>4||!Number.isInteger(u.target)||u.target<2||u.target>5||u.status==='completed'&&u.target!==level||u.status==='building'&&u.target!==level+1)throw new Error('Hợp đồng nâng cấp không hợp lệ.');return structuredClone(u);}
