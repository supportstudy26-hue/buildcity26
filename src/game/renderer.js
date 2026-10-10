import {actorArt,citizenMotion,worldMobilityParts} from './render/mobility-models.js';
import {vehicleArtId} from '../config/mobility-art.js';
import {buildingParts,buildingDesign} from './render/building-designs.js';
import {geographyBuildRule} from './geography/city.js';
import {serviceKind} from '../config/catalog.js';
import { formatMoney } from '../config/money.js';
import { SIZE, CATALOG, index, inside, isRoad, route, neighbors } from './core.js';
const noise=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const colors={residential:['#f3e2c5','#b9d4c9','#edd3b3','#b8cdd4'],commercial:['#8abbd2','#a5d4dc','#d4e2d7'],industrial:['#d4c4a4','#c9c4af','#b6bba7'],school:['#ecc598'],clinic:['#f5e6dd'],fire:['#dca291'],police:['#a7c1d8'],power:['#c9c8ae'],water:['#a8c6d2'],sewage:['#94b9b4'],waste:['#b8bbaa'],bus:['#e0c099']};
function shade(hex,factor){const rgb=hex.replace('#','').match(/.{2}/g).map(v=>Math.round(Math.min(255,parseInt(v,16)*factor)));return '#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');}
export class CityRenderer {
  constructor(canvas,mini,getCity){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.mini=mini;this.mc=mini.getContext('2d');this.getCity=getCity;this.zoom=1;this.pan={x:0,y:0};this.hover=null;this.selected=null;this.tool='inspect';this.layer='normal';this.night=false;this.cars=[];this.lastPaths=-1;this.time=0;this.width=0;this.height=0;this.sorted=Array.from({length:SIZE*SIZE},(_,i)=>i).sort((a,b)=>(a%SIZE+Math.floor(a/SIZE))-(b%SIZE+Math.floor(b/SIZE)));this.resize();this.center();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
  }
  panBy(dx,dy){this.follow=null;this.pan.x+=dx;this.pan.y+=dy;}
  focusTile(x,y){this.follow=null;this.pan.x=-(x-y)*22*this.zoom;this.pan.y=-(x+y)*11*this.zoom;}
  topView(){}
  dispose(){cancelAnimationFrame(this.raf);this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
  resize(){const dpr=Math.min(window.devicePixelRatio||1,2);this.width=this.canvas.clientWidth;this.height=this.canvas.clientHeight;this.canvas.width=this.width*dpr;this.canvas.height=this.height*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);}
  center(){this.zoom=this.width<600?.85:1.06;const tx=15,ty=18;this.pan.x=(ty-tx)*22*this.zoom;this.pan.y=-(tx+ty)*11*this.zoom+25;}
  project(x,y,z=0){return {x:this.width/2+(x-y)*22*this.zoom+this.pan.x,y:this.height/2+(x+y)*11*this.zoom+this.pan.y-z*this.zoom};}
  tileAt(px,py){const a=(px-this.width/2-this.pan.x)/(22*this.zoom),b=(py-this.height/2-this.pan.y)/(11*this.zoom);const x=Math.round((a+b)/2),y=Math.round((b-a)/2);return inside(x,y)?{x,y,i:index(x,y)}:null;}
  zoomAt(factor,px=this.width/2,py=this.height/2){const old=this.zoom;this.zoom=Math.max(.35,Math.min(2.4,this.zoom*factor));const ratio=this.zoom/old;this.pan.x=px-this.width/2-(px-this.width/2-this.pan.x)*ratio;this.pan.y=py-this.height/2-(py-this.height/2-this.pan.y)*ratio;}
  polygon(points,color,stroke){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.5;c.stroke();}}
  diamond(x,y,size,color,stroke,z=0){this.polygon([[x-size,y-size],[x+size,y-size],[x+size,y+size],[x-size,y+size]].map(([a,b])=>this.project(a,b,z)),color,stroke);}
  box(x,y,w,d,h,color,z=0){
    const pts=[[x-w/2,y-d/2],[x+w/2,y-d/2],[x+w/2,y+d/2],[x-w/2,y+d/2]];
    const bottom=pts.map(([a,b])=>this.project(a,b,z));const top=pts.map(([a,b])=>this.project(a,b,z+h));
    this.polygon([bottom[1],bottom[2],top[2],top[1]],shade(color,.72));this.polygon([bottom[2],bottom[3],top[3],top[2]],shade(color,.85));this.polygon(top,shade(color,1.07));return {bottom,top};
  }
  line(x1,y1,x2,y2,color,width,z=0){const a=this.project(x1,y1,z),b=this.project(x2,y2,z),c=this.ctx;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle=color;c.lineWidth=width*this.zoom;c.lineCap='round';c.stroke();}
  tree(x,y,size=1){
    const c=this.ctx,p=this.project(x,y),z=this.zoom*size;
    this.polygon([{x:p.x-4*z,y:p.y},{x:p.x+7*z,y:p.y-1*z},{x:p.x+17*z,y:p.y+5*z},{x:p.x+3*z,y:p.y+7*z}],'#2d524426');
    const trunk=this.project(x,y,7*size);c.strokeStyle='#677562';c.lineWidth=2.4*this.zoom;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(trunk.x,trunk.y);c.stroke();
    const q=this.project(x,y,14*size),pine=noise(x+.2,y)>.68;
    if(pine){for(let k=0;k<3;k++){const yy=q.y+5*z-k*5*z,w=(8-k*1.4)*z;this.polygon([{x:q.x,y:yy-13*z},{x:q.x+w,y:yy},{x:q.x,y:yy+3*z},{x:q.x-w,y:yy}],[ '#547d67','#668e70','#7ea47b'][k]);}}
    else{c.fillStyle='#527b61';c.beginPath();c.ellipse(q.x,q.y,8*z,10*z,0,0,Math.PI*2);c.fill();c.fillStyle='#709b71';c.beginPath();c.ellipse(q.x-2*z,q.y-2*z,6*z,8*z,-.3,0,Math.PI*2);c.fill();c.fillStyle='#99b57b';c.beginPath();c.ellipse(q.x-3*z,q.y-5*z,3.6*z,4*z,-.4,0,Math.PI*2);c.fill();}
  }
  designedBuilding(t,x,y,ghost=false){
    const design=buildingDesign(t,x,y),parts=buildingParts(t,x,y,0,0,0).sort((a,b)=>(a.position[0]+a.position[2])-(b.position[0]+b.position[2]));
    this.diamond(x,y,.44,'#cbd0bb','#e8e2c055');
    for(const p of parts){
      if(p.detail&&this.zoom<.65)continue;
      const [dx,z,dy]=p.position,[w,h,d]=p.scale,a=x+dx/20,b=y+dy/20,bottom=(z-h/2)*2.6;
      if(p.shape==='gable'){
        const corners=[[a-w/40,b-d/40],[a+w/40,b-d/40],[a+w/40,b+d/40],[a-w/40,b+d/40]].map(([u,v])=>this.project(u,v,bottom));
        const r1=this.project(a,b-d/40,bottom+h*2.6),r2=this.project(a,b+d/40,bottom+h*2.6);
        this.polygon([corners[0],r1,r2,corners[3]],p.color);this.polygon([r1,corners[1],corners[2],r2],shade(p.color,.78));this.polygon([corners[3],corners[2],r2],shade(p.color,.9));
      }else if(p.shape==='ico'){const q=this.project(a,b,z*2.6);this.ctx.fillStyle=p.color;this.ctx.beginPath();this.ctx.ellipse(q.x,q.y,w*.8*this.zoom,h*1.25*this.zoom,0,0,Math.PI*2);this.ctx.fill();}else if(p.shape==='cylinder'||p.shape==='cone'){
        this.box(a,b,w/20,d/20,h*2.6,p.color,bottom);const q=this.project(a,b,(z+h/2)*2.6);this.ctx.fillStyle=shade(p.color,1.12);this.ctx.beginPath();this.ctx.ellipse(q.x,q.y,w*.75*this.zoom,d*.36*this.zoom,0,0,Math.PI*2);this.ctx.fill();
      }else this.box(a,b,w/20,d/20,h*2.6,p.shape==='window'&&this.night?'#f0d499':p.color,bottom);
    }
    if(!ghost&&((!t.active)||(t.kind==='residential'&&((t.garbage||0)>40||!t.sewage)))){const q=this.project(x,y,design.height*2.6+22),c=this.ctx;c.fillStyle='#f5c182';c.beginPath();c.arc(q.x,q.y,5*this.zoom,0,Math.PI*2);c.fill();c.fillStyle='#294044';c.font=`bold ${8*this.zoom}px sans-serif`;c.textAlign='center';c.fillText('!',q.x,q.y+3*this.zoom);}
  }
  building(t,x,y){
    const k=serviceKind(t.kind),c=this.ctx,n=noise(x,y);if(!k)return;
    if(buildingDesign(t,x,y)){this.designedBuilding(t,x,y);return;}
    if(k==='park'&&t.kind==='plaza'){this.diamond(x,y,.46,'#d4d7bf');this.diamond(x,y,.24,'#82bdc9');this.box(x,y,.04,.04,15,'#c4e3e5');return;}
    if(k==='park'&&t.kind==='sportsPark'){this.diamond(x,y,.46,'#8cb68a');this.diamond(x,y,.32,'#699b90');this.line(x-.3,y,x+.3,y,'#e4e6c9',1);this.tree(x-.35,y-.35,.6);return;}
    if(k==='park'){this.diamond(x,y,.46,'#739f77','#a4c493');this.line(x-.3,y,x+.3,y,'#e6d7b4',4);this.line(x,y-.3,x,y+.3,'#e6d7b4',4);this.tree(x-.24,y-.21,.95);this.tree(x+.23,y+.21,.8);this.box(x+.2,y-.22,.15,.2,4,'#dfb787');return;}
    if(k==='busStop'){this.diamond(x,y,.4,'#d4d8c3');this.box(x,y,.54,.22,3,'#d1b58f');this.line(x-.25,y+.15,x-.25,y+.15,'#537b81',2,17);this.box(x-.25,y+.15,.17,.12,20,'#e5bb7d');return;}
    if(buildingDesign(t,x,y)){this.designedBuilding(t,x,y);return;}
    let h=k==='residential'?t.level===1?15+n*11:33+t.level*13: k==='commercial'?24+n*12:k==='industrial'?14:t.kind==='hospital'?38:t.kind==='university'?32:20;
    const color=colors[k]?.[Math.floor(n*(colors[k]?.length||1))]||'#d5d8c4';
    this.polygon([[x-.33,y-.33],[x+.33,y-.33],[x+.33+h*.018,y+.33+h*.012],[x-.33+h*.018,y+.33+h*.012]].map(([a,b])=>this.project(a,b)),'#253e3b26');
    this.diamond(x,y,.44,'#cbd0bb','#e8e2c055');
    this.box(x,y,.66,k==='industrial'?.82:.66,h,color);
    this.line(x-.33,y+.33,x+.33,y+.33,shade(color,.73),2,2);
    if(k==='residential'&&t.level===1){const roof=['#869995','#a69882','#788c90'][Math.floor(n*3)];const a=this.project(x-.36,y-.36,h),b=this.project(x+.36,y-.36,h),d=this.project(x+.36,y+.36,h),e=this.project(x-.36,y+.36,h),r1=this.project(x,y-.36,h+9),r2=this.project(x,y+.36,h+9);this.polygon([a,r1,r2,e],roof);this.polygon([r1,b,d,r2],shade(roof,.8));}
    else{this.box(x-.1,y-.05,.3,.3,4,shade(color,.85));this.line(x-.33,y+.33,x+.33,y+.33,'#eef0d7',1.4,h);this.line(x+.33,y-.33,x+.33,y+.33,'#d9e1d1',1.2,h);const top=this.project(x-.1,y-.05,h+2);c.fillStyle=shade(color,.8);c.fillRect(top.x-4*this.zoom,top.y-3*this.zoom,8*this.zoom,3*this.zoom);if(k==='commercial'){this.diamond(x,y,.25,'#60878d',null,h+1);this.box(x+.16,y-.15,.14,.14,h+4,'#cad6cf');}}
    // Windows follow the two visible facades and are part of the game meshes.
    const floors=Math.max(1,Math.floor(h/9));for(let f=0;f<floors;f++)for(let w=0;w<2;w++){
      const z=5+f*8;const windowColor=this.night?'#f0d499':'#607f86';
      this.line(x+.331,y-.15+w*.3,x+.331,y-.04+w*.3,windowColor,2.7,z);
      this.line(x-.15+w*.3,y+.331,x-.04+w*.3,y+.331,windowColor,2.7,z);
    }
    if(k==='industrial'||k==='power'){this.box(x+.24,y-.24,.12,.12,h+12,'#b7bbad');const p=this.project(x+.24,y-.24,h+17);c.fillStyle='#f4f0d53b';for(let j=0;j<3;j++){c.beginPath();c.ellipse(p.x+(Math.sin(this.time*.2+j)+j)*4*this.zoom,p.y-j*7*this.zoom-((this.time*3)%5)*this.zoom,(4+j*2)*this.zoom,(3+j*2)*this.zoom,0,0,Math.PI*2);c.fill();}}
    if(k==='water'||k==='sewage'){this.diamond(x,y,.3,'#528f9f','#d1e4d9',h+1);this.box(x-.23,y-.18,.16,.16,h+8,'#b3d1d6');}
    if(k==='clinic'){const p=this.project(x,y,h+9);c.fillStyle='#d78983';c.fillRect(p.x-4*this.zoom,p.y-1.5*this.zoom,8*this.zoom,3*this.zoom);c.fillRect(p.x-1.5*this.zoom,p.y-4*this.zoom,3*this.zoom,8*this.zoom);}
    if(t.fire>0){const p=this.project(x,y,h+8);c.fillStyle='#e87745';this.polygon([{x:p.x-5*this.zoom,y:p.y+4*this.zoom},{x:p.x-3*this.zoom,y:p.y-8*this.zoom},{x:p.x,y:p.y-3*this.zoom},{x:p.x+3*this.zoom,y:p.y-13*this.zoom},{x:p.x+6*this.zoom,y:p.y+3*this.zoom}],'#ef8d4f');}
    if((!t.active&&!['power','water'].includes(k))||(k==='residential'&&((t.garbage||0)>40||!t.sewage))){const p=this.project(x,y,h+22);c.fillStyle='#f5c182';c.beginPath();c.arc(p.x,p.y,5*this.zoom,0,Math.PI*2);c.fill();c.fillStyle='#294044';c.font=`bold ${8*this.zoom}px sans-serif`;c.textAlign='center';c.fillText('!',p.x,p.y+3*this.zoom);}
  }
  refreshCars(s){this.cars=[];for(const [j,trip] of (s.network.trips||[]).slice(0,64).entries()){if(trip.path.length>1&&trip.vehicles>0)this.cars.push({from:trip.from,to:trip.to,path:trip.path,offset:j*1.78,color:['#f6e9cb','#e3a274','#a8d0df','#ecd080'][j%4],bus:false});}for(const line of (s.network.busLines||[]).filter(l=>l.ok))for(let j=0;j<line.vehicles;j++)if(line.path.length>1)this.cars.push({path:line.path,offset:j*line.path.length/line.vehicles,color:'#f0be80',bus:true});}
  drawCars(s){
    const c=this.ctx;this.actorPoints=[];
    const actors=[...s.citizens.filter(a=>a.journey||a.state==='waiting-bus'),...s.vehicles.filter(v=>v.kind==='bus'&&v.busPhase&&v.busPhase!=='depot')];
    for(const actor of actors){
      const at=this.project(actor.position.x/20-.5,actor.position.y/20-.5,actor.position.z*2.6);
      if(at.x<0||at.x>this.width||at.y<0||at.y>this.height||this.actorPoints.length>=100)continue;
      this.actorPoints.push({id:actor.id,x:at.x,y:at.y});
      const j=actor.journey||actor.trip,target=j?.path[j.segment+1],yaw=target?Math.atan2(target.x-actor.position.x,target.y-actor.position.y):(actor.visualYaw||0),bus=actor.kind==='bus';
      const motion=bus?{distance:actor.travelled||0,speed:actor.speed,doors:actor.doors}:citizenMotion(s,actor,0);
      const parts=worldMobilityParts(bus?vehicleArtId(actor):actorArt(s,actor),motion,this.zoom>1.7?1:2,actor.position,yaw,actor.id).sort((a,b)=>(a.position[0]+a.position[2])-(b.position[0]+b.position[2]));
      for(const p of parts){const [x,z,y]=p.position,[w,h,d]=p.scale,bottom=(z-h/2)*2.6;
       if(['sphere','ico'].includes(p.shape)){const q=this.project(x/20-.5,y/20-.5,z*2.6);c.fillStyle=p.color;c.beginPath();c.ellipse(q.x,q.y,Math.max(.8,w*this.zoom*1.5),Math.max(.8,h*this.zoom*1.3),0,0,Math.PI*2);c.fill();}
       else this.box(x/20-.5,y/20-.5,w/20,d/20,h*2.6,p.color,bottom);
      }
    }
  }
  actorAt(x,y){return (this.actorPoints||[]).find(p=>Math.hypot(p.x-x,p.y-y)<12)?.id;}
  overlay(t){if(this.layer==='pollution')return `rgba(218,120,80,${t.pollution/100*.65})`;if(this.layer==='power')return t.kind||t.zone?t.power?'#edce7970':'#dc786785':null;if(this.layer==='water')return t.kind||t.zone?t.water?'#82c5e370':'#dc786785':null;if(this.layer==='sewage')return t.zone?t.sewage?'#82c5e370':'#dc786785':null;if(this.layer==='garbage')return t.kind==='residential'?`rgba(229,134,65,${.15+(t.garbage||0)/100*.7})`:null;if(this.layer==='traffic'){if(!isRoad(t))return null;if(!t.connected)return '#df826780';const ratio=t.trafficLoad/t.trafficCapacity;return ratio>1?'#ef8465a0':ratio>.65?'#edc37890':'#8ddd9075';}if(this.layer==='services')return t.kind==='residential'?t.services.length>=3?'#8ddd9070':'#eabe7970':null;return null;}
  draw(){const c=this.ctx,s=this.getCity();if(!s)return;c.clearRect(0,0,this.width,this.height);c.fillStyle='#a9bcab';c.fillRect(0,0,this.width,this.height);
    for(const i of this.sorted){const x=i%SIZE,y=Math.floor(i/SIZE),t=s.tiles[i],p=this.project(x,y);if(p.x<-60||p.x>this.width+60||p.y<-50||p.y>this.height+150)continue;
      const n=noise(x,y);let color=t.terrain==='water'?['#5f9da8','#65a4ad','#6baab1'][Math.floor(n*3)]:t.terrain==='sand'?'#d5cda9':['#aec294','#b0c396','#b1c497','#afc295'][Math.floor(noise(Math.floor(x/4),Math.floor(y/4))*4)];
      this.diamond(x,y,.51,color);
      if(t.terrain==='water'&&n>.6){const wave=Math.sin(this.time*.7+x*.5+y)*.06;this.line(x-.3+wave,y,x+.22+wave,y,'#d5ede750',.8);if(n>.85)this.line(x-.1,y+.22,x+.18,y+.22,'#d5ede730',.7);}
      if(t.terrain==='sand'&&this.zoom>.7){this.line(x-.4,y-.25,x+.4,y-.25,'#f0e4bd55',1);}
      if(t.zone&&!t.kind)this.diamond(x,y,.43,CATALOG[t.zone].color+'55',CATALOG[t.zone].color+'aa');
      if(isRoad(t)){
        this.diamond(x,y,.49,t.terrain==='water'?'#b8bbaa':'#d4d5c4');
        this.diamond(x,y,.34,'#627677');
        for(const ni of neighbors(i)){if(!isRoad(s.tiles[ni]))continue;const nx=ni%SIZE,ny=Math.floor(ni/SIZE);this.line(x,y,x+(nx-x)*.52,y+(ny-y)*.52,'#627677',t.kind==='avenue'?15:11);this.line(x+(nx-x)*.17,y+(ny-y)*.17,x+(nx-x)*.39,y+(ny-y)*.39,'#e1dcbe90',.8);}
        if(t.terrain==='water'){this.line(x-.42,y-.42,x+.42,y-.42,'#eef0d8',2,5);this.line(x-.42,y+.42,x+.42,y+.42,'#eef0d8',2,5);this.box(x-.36,y+.36,.09,.09,8,'#879c97');}
      }
      const over=this.overlay(t);if(over)this.diamond(x,y,.47,over);
    }
    for(const i of this.sorted){const x=i%SIZE,y=Math.floor(i/SIZE),t=s.tiles[i],p=this.project(x,y);if(p.x<-60||p.x>this.width+60||p.y<-20||p.y>this.height+150)continue;if(t.kind&&!isRoad(t))this.building(t,x,y);else if(!t.kind&&!t.zone&&t.terrain==='grass'&&noise(x,y)>.88)this.tree(x,y,.7+noise(y,x)*.6);else if(isRoad(t)&&noise(x,y)>.87){const base=this.project(x-.37,y+.37),lamp=this.project(x-.37,y+.37,13);c.strokeStyle='#7a8f83';c.lineWidth=1.3*this.zoom;c.beginPath();c.moveTo(base.x,base.y);c.lineTo(lamp.x,lamp.y);c.stroke();c.fillStyle=this.night?'#ffe6a7':'#e8dcc0';c.fillRect(lamp.x-2*this.zoom,lamp.y-2*this.zoom,4*this.zoom,2*this.zoom);}}
    for(const contract of s.contracts||[])if(contract.status==='building'){const x=contract.tile%SIZE,y=Math.floor(contract.tile/SIZE);this.diamond(x,y,.45,'#e9c99488','#c29057');this.box(x,y,.18,.18,3+contract.progress*8,'#d8b17b');const p=this.project(x,y,20);c.fillStyle='#253c40';c.font='10px system-ui';c.textAlign='center';c.fillText(Math.round(contract.progress*100)+'%',p.x,p.y);}
    this.drawCars(s);
    if(this.selected){const {x,y}=this.selected;this.diamond(x,y,.51,'#ffffff25','#fff');const k=s.tiles[index(x,y)].kind;if(CATALOG[k]?.range){const a=this.project(x,y),r=CATALOG[k].range;c.beginPath();c.ellipse(a.x,a.y,r*31*this.zoom,r*15.5*this.zoom,0,0,Math.PI*2);c.strokeStyle='#fff9';c.lineWidth=1;c.setLineDash([4,4]);c.stroke();c.setLineDash([]);}}
    if(this.hover){const {x,y,i}=this.hover,t=s.tiles[i],valid=this.tool==='inspect'||this.tool==='bulldoze'||(!t.kind&&!t.zone&&(t.terrain!=='water'||['road','avenue'].includes(this.tool)))||t.kind==='road'&&this.tool==='avenue';if(!['inspect','bulldoze','road','avenue','residential','commercial','industrial'].includes(this.tool)&&valid){c.save();c.globalAlpha=.38;this.designedBuilding({kind:this.tool,level:1,active:true},x,y,true);c.restore();}this.diamond(x,y,.51,valid?'#ffffff38':'#f0909040',valid?'#faf1d0':'#ff9292');if(this.tool!=='inspect'){const p=this.project(x,y,27);c.fillStyle='#163138ed';c.font='11px system-ui';c.textAlign='center';const geocheck=geographyBuildRule(s,i,this.tool);const cost=Math.ceil((t.kind==='road'&&this.tool==='avenue'?8000:CATALOG[this.tool]?.cost||0)*(t.terrain==='water'?4:1)*(geocheck.factor||1));const text=this.tool==='bulldoze'?'Phá dỡ':geocheck.ok?formatMoney(cost):'Không thể xây';const w=c.measureText(text).width+18;c.fillRect(p.x-w/2,p.y-12,w,23);c.fillStyle='#f4c49a';c.fillText(text,p.x,p.y+3);}}
    if(this.night){c.fillStyle='#16364c50';c.fillRect(0,0,this.width,this.height);}
  }
  minimap(){const s=this.getCity(),c=this.mc,w=this.mini.width,h=this.mini.height;c.fillStyle='#9eb18d';c.fillRect(0,0,w,h);const sx=w/SIZE,sy=h/SIZE;s.tiles.forEach((t,i)=>{c.fillStyle=t.terrain==='water'?'#6d9ea1':isRoad(t)?'#496469':CATALOG[t.kind||t.zone]?.color||'#9eb18d';c.fillRect(i%SIZE*sx,Math.floor(i/SIZE)*sy,sx+.3,sy+.3);});const mid=this.tileAt(this.width/2,this.height/2);if(mid){c.strokeStyle='#fff';c.lineWidth=1;c.strokeRect(mid.x*sx-12,mid.y*sy-8,24,16);}}
  frame(ms){const dt=this.lastFrame===undefined?0:Math.min(1,(ms-this.lastFrame)/1000);this.lastFrame=ms;const s=this.getCity();this.time=(s?.clock?.seconds||0)/20;if(this.follow){const actor=s?.citizens.find(c=>c.id===this.follow)||s?.vehicles.find(v=>v.id===this.follow);if(actor){const x=actor.position.x/20-.5,y=actor.position.y/20-.5;this.pan.x=-(x-y)*22*this.zoom;this.pan.y=-(x+y)*11*this.zoom;}}if(s&&this.lastPaths!==s.day){this.lastPaths=s.day;this.refreshCars(s);this.minimap();}if(!document.hidden&&document.body?.dataset.screen!=='home'&&(this.width>=600||ms-(this.lastDraw||0)>=33)){this.draw();this.lastDraw=ms;}this.raf=requestAnimationFrame(this.frame);}
  reset(){this.lastPaths=-1;this.selected=null;this.center();}
  destroy(){cancelAnimationFrame(this.raf);}
}
