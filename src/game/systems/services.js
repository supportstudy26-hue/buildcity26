import { clamp } from './world.js';
import { random } from './rng.js';
import { entityId } from './events.js';
export function updateLegacyServices(s){
  const m=s.metrics;
  s.tiles.forEach(t=>{
    const service=kind=>t.connected&&t.services.includes(kind);
    if(t.kind==='residential')t.garbage=clamp((t.garbage||0)+t.residents*.045-(t.connected&&t.services.includes('waste')?4:0),0,100);
    if(['residential','industrial'].includes(t.kind)){
      const risk=(t.kind==='industrial'&&t.pollution>35)||(t.garbage||0)>45;
      t.hazard=clamp((t.hazard||0)+(risk&&!service('fire')?2:-3),0,100);
      t.fire=clamp((t.fire||0)+(service('fire')?-12:t.hazard>=90?4:-1),0,100);
    }
    if(t.kind==='residential'){
      t.crime=clamp((t.crime||0)+(service('police')?-2:m.unemployment>30||t.happiness<40?.8:-.3),0,100);
      const unhealthy=t.pollution>40||(t.garbage||0)>45||!t.sewage;
      t.health=clamp((t.health??100)+(service('clinic')?1.5:unhealthy?-1:.3),0,100);
      t.education=clamp((t.education||0)+(service('school')?.5:-.1),0,100);
      if(t.fire>50)t.residents=Math.max(0,t.residents-2);
    }
    if(!t.zone)return;t.age++;
    if(!t.kind&&t.active&&t.age>=2&&random(s)<m.demand[t.zone]/100*.5){t.kind=t.zone;t.level=1;t.assetId=entityId(s,'asset');}
    if(t.kind==='residential'){
      if(t.active&&t.happiness>=48&&t.residents<24*t.level&&random(s)<m.demand.residential/100){t.residents=Math.min(24*t.level,t.residents+1+Math.floor(random(s)*3));}
      else if((!t.active||t.happiness<35)&&t.residents>0)t.residents=Math.max(0,t.residents-1);
      if(t.active&&t.happiness>75&&t.health>=60&&t.education>=35&&t.residents>=24&&t.level<3&&m.population>=300&&t.age>30&&random(s)<.04)t.level++;
    }
  });
}
