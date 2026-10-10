import { clamp } from './world.js';
import { random } from './rng.js';
import { residentCapacity } from '../../config/building-economy.js';
export function updateLegacyServices(s){
  const m=s.metrics;
  s.tiles.forEach(t=>{
    const service=kind=>t.connected&&t.services.includes(kind);const strength=kind=>t.serviceStrengths?.[kind]||1;
    if(t.kind==='residential')t.garbage=clamp((t.garbage||0)+t.residents*.045-(t.connected&&t.services.includes('waste')?(t.wasteCollection||4):0),0,100);
    if(['residential','industrial'].includes(t.kind)){
      const risk=(t.kind==='industrial'&&t.pollution>35)||(t.garbage||0)>45;
      t.hazard=clamp((t.hazard||0)+(risk&&!service('fire')?2:-3),0,100);
      t.fire=clamp((t.fire||0)+(service('fire')?-12*strength('fire'):t.hazard>=90?4:-1),0,100);
    }
    if(t.kind==='residential'){
      t.crime=clamp((t.crime||0)+(service('police')?-2*strength('police'):m.unemployment>30||t.happiness<40?.8:-.3),0,100);
      const unhealthy=t.pollution>40||(t.garbage||0)>45||!t.sewage;
      t.health=clamp((t.health??100)+(service('clinic')?1.5*strength('clinic'):unhealthy?-1:.3),0,100);
      t.education=clamp((t.education||0)+(service('school')?.5*strength('school'):-.1),0,100);
      if(t.fire>50)t.residents=Math.max(0,t.residents-2);
    }
    if(!t.zone)return;t.age++;
    if(t.development)return; // Clock-based contracts/arrivals supersede daily random growth.
    // Pending zones are handled by updateDevelopment, including legacy saves.
    if(t.kind==='residential'){
      if(t.active&&t.happiness>=48&&t.residents<residentCapacity(t)&&random(s)<m.demand.residential/100){t.residents=Math.min(residentCapacity(t),t.residents+1+Math.floor(random(s)*3));}
      else if((!t.active||t.happiness<35)&&t.residents>0)t.residents=Math.max(0,t.residents-1);
      // Existing levels stay intact; every new level now needs a paid upgrade contract.
    }
  });
}
