import { DAY_SECONDS, STEP_SECONDS, START_DATE } from '../../config/simulation.js';
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
