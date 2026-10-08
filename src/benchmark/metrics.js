const quantile=(values,q)=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*q))];};
export class PerformanceSample{
  constructor(){this.frames=[];this.ticks=[];this.longTasks=[];this.started=0;this.running=false;try{this.observer=new PerformanceObserver(list=>{if(this.running)for(const e of list.getEntries())this.longTasks.push(e.duration);});this.observer.observe({type:'longtask',buffered:false});}catch{this.observer=null;}}
  start(now=performance.now()){this.frames=[];this.ticks=[];this.longTasks=[];this.started=now;this.previous=null;this.running=true;}
  frame(now){if(!this.running)return;if(this.previous!=null&&this.frames.length<10000)this.frames.push(now-this.previous);this.previous=now;}
  tick(ms){if(this.running&&this.ticks.length<10000)this.ticks.push(ms);}
  report(now=performance.now()){const median=quantile(this.frames,.5);return{elapsedSeconds:+((now-this.started)/1000).toFixed(2),frames:this.frames.length,medianFps:median?+(1000/median).toFixed(1):null,p95FrameMs:quantile(this.frames,.95),cpuTickMedianMs:quantile(this.ticks,.5),cpuTickP95Ms:quantile(this.ticks,.95),longTasks:this.observer?this.longTasks.length:null,longTaskMaxMs:this.longTasks.length?Math.max(...this.longTasks):0,workerTickMs:null};}
}
