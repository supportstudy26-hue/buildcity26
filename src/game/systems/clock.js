import { DAY_SECONDS, STEP_SECONDS, START_DATE, PLAY_SECONDS_PER_SECOND } from '../../config/simulation.js';
export const PLAYBACK_RULE='casual-time5-v1';
export const ALLOWED_SPEEDS=[1,3,8];
export function createPlayback(){return {rule:PLAYBACK_RULE,multiplier:1,paused:false,observe:false};}
export function validatePlayback(p){if(!p||p.rule!==PLAYBACK_RULE||!ALLOWED_SPEEDS.includes(p.multiplier)||typeof p.paused!=='boolean'||typeof p.observe!=='boolean')throw new Error('Tốc độ bản lưu không hợp lệ.');return p;}
export function setPlayback(s,p){try{validatePlayback({...s.playback,...p});}catch{return {ok:false,message:'Tốc độ không thuộc quy tắc casual hiện tại.'};}s.playback={...s.playback,...p};return {ok:true};}
export function simulationDelta(realSeconds,playback,suspended=false){validatePlayback(playback);if(!Number.isFinite(realSeconds)||realSeconds<0)throw new Error('Elapsed time không hợp lệ.');return suspended||playback.paused?0:realSeconds*(playback.observe?1:PLAY_SECONDS_PER_SECOND*playback.multiplier);}
export function createClock(day = 0) { return { step: Math.floor(day * DAY_SECONDS / STEP_SECONDS), seconds: day * DAY_SECONDS }; }
export function calendar(seconds) {
  const d = new Date(START_DATE + seconds * 1000);
  return { date: d, day: Math.floor(seconds / DAY_SECONDS), hour: d.getUTCHours(), minute: d.getUTCMinutes(), weekday: d.getUTCDay(), daysInMonth: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 0)).getUTCDate(), daysInYear: new Date(Date.UTC(d.getUTCFullYear(), 1, 29)).getUTCMonth() === 1 ? 366 : 365 };
}
export function clockStep(s) { s.clock.step++; s.clock.seconds = s.clock.step * STEP_SECONDS; return calendar(s.clock.seconds); }
// Catch up in bounded batches. Unprocessed time remains queued; no dropped ticks.
export function consumeSteps(seconds, callback, limit = 1200) {
  const count = Math.min(limit, Math.floor((seconds + 1e-8) / STEP_SECONDS));
  let processed=0;
  for (let i=0;i<count;i++) {processed++;if(callback()===false)break;}
  return { count:processed, remaining: Math.max(0, seconds-processed*STEP_SECONDS) };
}
