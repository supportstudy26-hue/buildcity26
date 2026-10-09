export const PROFILES={low:{dpr:1,fps:30,shadow:0,details:85},medium:{dpr:1,fps:60,shadow:0,details:180},high:{dpr:1.5,fps:60,shadow:1024,details:280}};
export class AutoQuality{
  constructor(mobile=false){this.mobile=mobile;this.reset(0);}
  reset(now){this.level=this.mobile?'low':'medium';this.frames=[];this.started=now;this.changedAt=now;return this.level;}
  sample(ms,now){if(ms>0&&this.frames.length<600)this.frames.push(ms);if(now-this.started<8000||this.frames.length<90)return null;const sorted=[...this.frames].sort((a,b)=>a-b),p95=sorted[Math.floor(sorted.length*.95)];this.frames=[];this.started=now;if(now-this.changedAt<16000)return null;if(this.level==='medium'&&p95>45){this.level='low';this.changedAt=now;return this.level;}if(!this.mobile&&this.level==='low'&&p95<37&&now-this.changedAt>=32000){this.level='medium';this.changedAt=now;return this.level;}return null;}
}
export function detailVisible(wasVisible,distance,limit,selected=false){return selected||distance<limit+(wasVisible?35:-35);}

// rAF timestamps fluctuate around 16.67/33.33ms. Half-ms tolerance avoids dropping
// every second frame solely due to fractional timing while preserving the cap.
export function frameDue(now,previous,fps){return previous==null||now-previous+.5>=1000/fps;}
