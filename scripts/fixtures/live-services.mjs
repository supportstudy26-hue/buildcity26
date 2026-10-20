import {createCity,place,stepSimulation,index,analyze,serialize,validateSave} from '../../src/game/core.js';
// Disposable QA city using the production commands and simulation. Never linked
// to player storage, account credentials or leaderboard submissions.
export function liveServicesCity({seconds=900}={}){
 const s=createCity({name:'Khu kiểm tra vận hành'});
 for(const [x,y,kind] of [[7,17,'power'],[7,16,'road'],[6,17,'waterPump'],[10,15,'wasteCenter'],[5,17,'fire'],[5,19,'police'],[15,25,'farm'],[16,25,'freightWarehouse'],[17,25,'foodFactory']]){
  const r=place(s,x,y,kind);if(!r.ok)throw new Error(`${kind}: ${r.message}`);
 }
 s.clock.seconds=8*3600;s.clock.step=s.clock.seconds;
 for(const t of s.tiles)if(t.kind==='residential')t.garbage=6;
 s.tiles[index(12,17)].hazard=70;
 analyze(s);
 for(let n=0;n<seconds;n++)stepSimulation(s);
 validateSave(serialize(s));return s;
}
