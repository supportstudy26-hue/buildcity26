import { emit, entityId } from './events.js';
import { recordCash } from './economy.js';
import { DAY_SECONDS } from '../../config/simulation.js';
export function startConstruction(s, tile, kind, cost, days, instant=false) {
  if(s.money<cost)return {ok:false,message:'Không đủ ngân sách cho khoản cam kết.'};
  if(s.contracts.some(c=>c.tile===tile&&c.status==='building'))return {ok:false,message:'Ô này đang thi công.'};
  const id=entityId(s,'contract');
  recordCash(s,`${id}-reserve`,'construction-escrow',-cost,id);
  const c={id,tile,kind,committed:cost,paid:0,escrow:cost,startedAt:s.clock.seconds,duration:days*DAY_SECONDS,progress:0,status:'building'};
  s.contracts.push(c);emit(s,'construction-started',id,{tile});if(instant)updateConstruction(s,true);return {ok:true,cost};
}
export function updateConstruction(s,instant=false) {
  let changed=false;
  for(const c of s.contracts) if(c.status==='building') {
    c.progress=instant?1:Math.min(1,(s.clock.seconds-c.startedAt)/c.duration);
    if(c.progress===1) {
      const t=s.tiles[c.tile];
      if(t.kind||t.zone){c.status='failed';recordCash(s,`${c.id}-refund`,'construction-refund',c.escrow,c.id);c.escrow=0;emit(s,'construction-failed',c.id,{reason:'Ô đất đã thay đổi'});continue;}
      Object.assign(t,{kind:c.kind,level:1,assetId:entityId(s,'asset'),historicalCost:c.committed});c.status='completed';c.paid=c.committed;c.escrow=0;changed=true;emit(s,'construction-completed',c.id,{tile:c.tile});
    }
  }
  return changed;
}
export function cancelConstruction(s,id) {
  const c=s.contracts.find(c=>c.id===id);if(!c||c.status!=='building')return {ok:false,message:'Hợp đồng đã kết thúc.'};
  c.status='cancelled';recordCash(s,`${id}-refund`,'construction-refund',c.escrow,id);c.escrow=0;emit(s,'construction-cancelled',id);return {ok:true};
}
