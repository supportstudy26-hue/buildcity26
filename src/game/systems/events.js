export function entityId(s, kind) { return `${kind}-${s.nextEntityId++}`; }
export function emit(s, type, entity, detail = {}) {
  const event = { id: `event-${s.nextEventId++}`, seconds:s.clock.seconds, type, entity, ...detail };
  s.events.push(event); if(s.events.length>300) s.events.shift(); return event;
}
