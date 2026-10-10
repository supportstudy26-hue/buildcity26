import {recordMissionEvent} from './campaign.js';
export function entityId(s, kind) { return `${kind}-${s.nextEntityId++}`; }
export function emit(s, type, entity, detail = {}) {
  const sequence=s.nextEventId++;
  const event = { id: `event-${sequence}`, sequence, seconds:s.clock.seconds, type, entity, ...detail };
  recordMissionEvent(s,event);s.events.push(event); if(s.events.length>300) s.events.shift(); return event;
}
