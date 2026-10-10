import {PRIVATE_PLANS,privatePlan,privateBuildPrice,residentCapacity} from '../../config/building-economy.js';
import {STEP_SECONDS} from '../../config/simulation.js';
import {entityId,emit} from './events.js';
export const DEVELOPMENT_RULE='private-casual-15min-v1';
export function developmentConditions(s,t){return [
 {name:'Đường nối cổng vùng',ok:!!t.connected,tool:'road'},
 {name:'Điện được cấp tới ô',ok:!!t.power,tool:'smallPower'},
 {name:'Nước sạch được cấp tới ô',ok:!!t.water,tool:'smallWater'},
 {name:'Xử lý nước thải',ok:!!t.sewage,tool:'smallSewage'},
 {name:'Nhu cầu phát triển',ok:(s.metrics?.demand[t.zone]||0)>0},
 {name:'Nguồn vốn chủ đầu tư',ok:!!t.development?.funded||(s.privateInvestment?.available??20000000)>=privateBuildPrice(t.zone,t.blueprint)}
 ];}
export function updateDevelopment(s){
 if(s._developmentGraph!==s.graphVersion){s._developmentQueue=s.tiles.flatMap((t,i)=>t.zone&&!t.kind?[i]:[]);s._developmentHomes=s.tiles.flatMap((t,i)=>t.kind==='residential'&&t.development?[i]:[]);s._developmentGraph=s.graphVersion;}
 let changed=false;
 for(const i of s._developmentQueue||[]){const t=s.tiles[i];if(t.kind||!t.zone)continue;
  if(!developmentConditions(s,t).every(c=>c.ok))continue;
  if(!t.development){const plan=privatePlan(t.zone,t.blueprint);s.privateInvestment??={rule:DEVELOPMENT_RULE,opening:20000000,available:20000000,projects:[]};
   const price=privateBuildPrice(t.zone,t.blueprint),id=entityId(s,'investor');s.privateInvestment.available-=price;
   t.development={version:1,rule:DEVELOPMENT_RULE,ownerId:id,designId:plan.designId,basePrice:price,funded:true,work:0,required:900,arrivals:0};
   s.privateInvestment.projects.push({id,tile:i,price,seconds:s.clock.seconds});emit(s,'private-investment',id,{tile:i,amount:price});
  }
  const d=t.development;d.work=Math.min(d.required,d.work+STEP_SECONDS);
  if(d.work===d.required){t.kind=t.zone;t.level=1;t.assetId=entityId(s,'asset');s.graphVersion++;emit(s,'private-building-completed',t.assetId,{tile:i,owner:d.ownerId,amount:d.basePrice});changed=true;}
 }
 // Early casual arrivals follow the same clock, not a day-long random tick.
 for(const i of s._developmentHomes||[]){const t=s.tiles[i];if(t.kind==='residential'&&t.development?.version===1&&t.active&&t.happiness>=48&&t.residents<residentCapacity(t)){
  t.development.arrivals+=STEP_SECONDS;if(t.development.arrivals>=60){t.development.arrivals-=60;t.residents++;changed=true;}
 }
 }
 return changed;
}
export function validateDevelopment(d,zone){if(d==null)return null;const plan=privatePlan(zone,d.designId);if(!plan||d.version!==1||d.rule!==DEVELOPMENT_RULE||d.designId!==plan.designId||typeof d.ownerId!=='string'||!d.ownerId||d.basePrice!==privateBuildPrice(zone,d.designId)||d.funded!==true||![d.work,d.required,d.arrivals].every(Number.isFinite)||d.required!==900||d.work<0||d.work>d.required||d.arrivals<0||d.arrivals>=60)throw new Error('Hợp đồng đầu tư nhà không hợp lệ.');return structuredClone(d);}
export function validatePrivateInvestment(p,tiles){if(p==null){if(tiles.some(t=>t.development))throw new Error('Thiếu sổ vốn chủ đầu tư.');return;}if(p.rule!==DEVELOPMENT_RULE||p.opening!==20000000||!Number.isFinite(p.available)||p.available<0||p.available>p.opening||!Array.isArray(p.projects)||p.projects.length>20000||new Set(p.projects.map(p=>p.id)).size!==p.projects.length||p.projects.some(e=>!e||typeof e.id!=='string'||!Number.isInteger(e.tile)||e.tile<0||e.tile>=tiles.length||!Number.isFinite(e.price)||e.price<=0||!Number.isFinite(e.seconds)||e.seconds<0)||Math.abs(p.opening-p.available-p.projects.reduce((n,p)=>n+p.price,0))>.01||tiles.some(t=>t.development&&!p.projects.some(p=>p.id===t.development.ownerId&&p.price===t.development.basePrice)))throw new Error('Sổ vốn chủ đầu tư không đối chiếu được.');}
