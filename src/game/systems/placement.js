import {CATALOG,ROADS} from '../../config/catalog.js';
import {placementPrice} from '../../config/building-economy.js';
import {roadProfile} from '../../config/road-profiles.js';
import {geographyBuildRule} from '../geography/city.js';

// Read-only quote shared by the command, UI, Canvas and 3D ghost.
export function placementQuote(s,i,kind){
  if(!Number.isInteger(i)||i<0||i>=s.tiles.length||!CATALOG[kind]||kind==='inspect')return {ok:false,message:'Chọn một ô trong bản đồ.'};
  const t=s.tiles[i],rule=geographyBuildRule(s,i,kind);
  if(!rule.ok)return rule;
  if(kind==='bulldoze'){
    if(!t.kind&&!t.zone)return {ok:false,message:'Ô này chưa có công trình.'};
    const salvage=Math.floor((t.historicalCost||0)*.25),u=t.upgrade;
    const cancellation=u?.status==='building'&&u.payer==='city'?Math.floor(u.price*(1-u.work/u.required))+u.reserve:0;
    return {ok:true,cost:-salvage,refund:salvage+cancellation,cancellation,factor:rule.factor};
  }
  if(t.terrain==='water'&&!ROADS.includes(kind)&&kind!=='bridgePier')return {ok:false,message:'Chỉ có thể xây cầu đường trên sông.'};
  if(t.terrain==='water'&&(roadProfile(kind)?.circle||roadProfile(kind)?.ramp))return {ok:false,message:'Vòng xuyến và nhánh lên/xuống cần nền đất. Dùng cầu cạn để vượt nước.'};
  const pierCompletion=t.kind==='bridgePier'&&kind==='highwayViaduct';
  const upgrading=ROADS.includes(t.kind)&&ROADS.includes(kind)&&t.kind!==kind||pierCompletion;
  if(t.kind===kind)return {ok:false,message:'Ô này đã có cùng loại đường/công trình.'};
  if((t.kind||t.zone)&&!upgrading)return {ok:false,message:'Ô này đã có công trình. Dùng phá dỡ để thay đổi.'};
  const cost=Math.max(0,placementPrice(kind,t,rule.factor,CATALOG)-(pierCompletion?t.historicalCost||0:0));
  if(s.money<cost)return {ok:false,cost,shortfall:cost-s.money,upgrading,message:upgrading?'Không đủ ngân sách để nâng cấp.':'Không đủ ngân sách. Kiểm tra thuế và chi phí vận hành.'};
  return {ok:true,cost,upgrading,factor:rule.factor};
}
