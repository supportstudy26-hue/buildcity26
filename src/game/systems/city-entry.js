import {SIZE,index,neighbors,isRoad} from './world.js';
import {placementQuote} from './placement.js';

export const cityEntry=s=>s.world?.geography?.entryTile??index(0,18);

// A weighted route preview, not an implicit change to the player's city.
// Reuse paid roads; avoid buildings, boundary masks and protected terrain.
export function entryConnectionPlan(s,home){
  if(!Number.isInteger(home)||s.tiles[home]?.kind!=='residential')return {ok:false,message:'Chọn một nhà ở để nối đường.'};
  if(s.tiles[home].connected)return {ok:false,message:'Nhà đã nối đường tới cổng.'};
  const entry=cityEntry(s),targets=new Set(neighbors(home)),costs=new Map(),distance=new Float64Array(s.tiles.length).fill(Infinity),previous=new Int32Array(s.tiles.length).fill(-1),heap=[];
  const price=i=>{
    if(costs.has(i))return costs.get(i);
    const t=s.tiles[i],q=isRoad(t)?{ok:true,cost:0}:placementQuote(s,i,'road');
    const cost=q.ok||q.shortfall!=null?q.cost:Infinity;costs.set(i,cost);return cost;
  };
  if(!Number.isFinite(price(entry)))return {ok:false,message:'Ô cổng đang bị công trình chiếm hoặc không thể xây. Chọn ô cổng để kiểm tra.'};
  const push=(i,cost)=>{let n=heap.length;heap.push({i,cost});while(n){const p=(n-1)>>1;if(heap[p].cost<=cost)break;heap[n]=heap[p];n=p;}heap[n]={i,cost};};
  const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let n=0;while(n*2+1<heap.length){let c=n*2+1;if(c+1<heap.length&&heap[c+1].cost<heap[c].cost)c++;if(heap[c].cost>=last.cost)break;heap[n]=heap[c];n=c;}heap[n]=last;}return first;};
  distance[entry]=price(entry);push(entry,distance[entry]);let end=-1;
  while(heap.length){const {i,cost}=pop();if(cost!==distance[i])continue;if(targets.has(i)){end=i;break;}
    for(const n of neighbors(i)){const next=cost+price(n);if(next<distance[n]){distance[n]=next;previous[n]=i;push(n,next);}}
  }
  if(end<0)return {ok:false,message:'Chưa tìm được đường nối hợp lệ. Kiểm tra ô bị chiếm và ranh giới khu chơi.'};
  const path=[];for(let i=end;i!==-1;i=previous[i])path.push(i);path.reverse();
  const tiles=path.filter(i=>!isRoad(s.tiles[i])),cost=distance[end];
  return {ok:true,home,entry,path,tiles,cost,affordable:s.money>=cost,graphVersion:s.graphVersion,bridges:tiles.filter(i=>s.tiles[i].terrain==='water').length,meters:tiles.length*20};
}

export function entryPlanUnchanged(s,plan){
  if(!plan?.ok||s.graphVersion!==plan.graphVersion||s.money<plan.cost)return false;
  return plan.tiles.reduce((total,i)=>{const q=placementQuote(s,i,'road');return total+(q.ok?q.cost:Infinity);},0)===plan.cost;
}
