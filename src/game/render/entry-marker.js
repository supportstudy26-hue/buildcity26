import {cityEntry} from '../systems/city-entry.js';
import {surfaceHeight} from '../systems/terrain.js';
import {SIZE} from '../systems/world.js';
import {roadProfile} from '../../config/road-profiles.js';

export function entryParts(s){
  const i=cityEntry(s),x=(i%SIZE+.5)*20,z=(Math.floor(i/SIZE)+.5)*20,h=surfaceHeight(s,i,SIZE),offset=(roadProfile(s.tiles[i])?.width||12)/2+1.8;
  const color=s.network?.connected.has(i)?'#72d8b0':'#ffbe63';
  // Roadside posts and a small sign; the travel corridor stays completely open.
  return [
    {shape:'box',position:[x-offset,h+.12,z],scale:[1.6,.24,2.4],color:'#e4e1ce',tile:i},
    {shape:'cylinder',position:[x-offset,h+3.6,z],scale:[.3,7.2,.3],color:'#506878',material:'metal',tile:i},
    {shape:'box',position:[x-offset+1.4,h+6.7,z],scale:[3.1,1.8,.18],color,tile:i},
    {shape:'box',position:[x-offset+1.4,h+6.7,z+.11],scale:[1.5,.24,.05],color:'#173447',tile:i}
  ];
}

export function drawEntryMini(c,s,w,h){
  const i=cityEntry(s),x=(i%SIZE+.5)*w/SIZE,y=(Math.floor(i/SIZE)+.5)*h/SIZE;
  c.fillStyle='#ffca77';c.strokeStyle='#173447';c.lineWidth=1.5;c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill();c.stroke();
}
