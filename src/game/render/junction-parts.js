import {isJunction,junctionState} from '../systems/junctions.js';
export const SIGNAL_DIRECTIONS=['north','east','south','west'];
export function signalLocation(i,direction,width,base){
 const cx=(i%64+.5)*20,cz=(Math.floor(i/64)+.5)*20;
 const side=width/2+.6,stop=width/2+1;
 return direction==='north'?[cx-side,base+4.2,cz-stop]:direction==='east'?[cx+stop,base+4.2,cz-side]:direction==='south'?[cx+side,base+4.2,cz+stop]:[cx-stop,base+4.2,cz+side];
}
export function junctionParts(s,i,base,width){
 if(!isJunction(s,i)||s.tiles[i].junctionControl==='off'||s.tiles[i].junctionControl==='yield')return[];
 const parts=[];
 for(const d of SIGNAL_DIRECTIONS){const [x,y,z]=signalLocation(i,d,width,base);
  const add=(shape,dx,dy,dz,w,h,depth,color,role)=>parts.push({shape,position:[x+dx,y+dy,z+dz],scale:[w,h,depth],color,role,material:'metal',detail:true,tile:i});
  add('cylinder',0,-1.85,0,.17,4.7,.17,'#64766f','signal-pole');
  add('box',.45,.5,0,1,.14,.14,'#64766f','signal-arm');
  add('box',.9,0,0,.55,1.35,.5,'#23342f','signal-housing');
  for(const [j,color] of [[0,'#5e2626'],[1,'#64582d'],[2,'#235a44']])add('sphere',.9,.4-j*.4,0,.24,.24,.54,color,'signal-lens');
  add('box',0,-1.4,0,.35,.7,.4,'#23342f','pedestrian-signal-housing');
 }
 return parts;
}
export function signalGlows(s,i,base,width){
 const p=junctionState(s,i);if(p.mode!=='signal')return[];
 return SIGNAL_DIRECTIONS.map(d=>{const [x,y,z]=signalLocation(i,d,width,base),light=p.approach===d?p.light:'red',row=light==='green'?2:light==='amber'?1:0;return{position:[x+.9,y+.4-row*.4,z],scale:[.26,.26,.56],light};}).concat(SIGNAL_DIRECTIONS.map(d=>{const [x,y,z]=signalLocation(i,d,width,base);return{position:[x,y-1.4,z],scale:[.2,.25,.44],light:p.pedestrian?'green':'red'};}));
}
