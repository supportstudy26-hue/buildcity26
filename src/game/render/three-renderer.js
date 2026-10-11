import {roadProfile} from '../../config/road-profiles.js';
import {isJunction} from '../systems/junctions.js';
import {signalGlows} from './junction-parts.js';
import {cityFocus} from './city-focus.js';
import {cityEntry} from '../systems/city-entry.js';
import {drawEntryMini} from './entry-marker.js';
import {actorBudget,nearestActors} from './actor-budget.js';
import {vehicleArtId} from '../../config/mobility-art.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {actorArt,citizenMotion,worldMobilityParts} from './mobility-models.js';
import {placementGhost} from './build-ghost.js';
import {createGableGeometry} from './gable-geometry.js';
import {roadRingGeometry} from './road-ring.js';
import * as T from 'three';
import {STEP_SECONDS} from '../../config/simulation.js';
import {SIZE,isRoad,CATALOG} from '../core.js';
import {surfaceHeight,terrainHeight,waterHeightAt} from '../systems/terrain.js';
import {REGION,chunkParts,chunkSignature,terrainArrays,roadParts} from './scene-data.js';
import {PROFILES,AutoQuality,detailVisible,frameDue} from './quality.js';
const vec=(x,y,z)=>new T.Vector3(x,y,z);
export function updateBounds(mesh){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();}
export class ThreeCityRenderer{
  constructor(input,mini,getCity,view){
    this.canvas=input;this.view=view;this.mini=mini;this.mc=mini.getContext('2d');this.getCity=getCity;
    this.mode='3d';this.tool='inspect';this.layer='normal';this.night=false;this.follow=null;this.selected=null;this.hover=null;this.lastPaths=-1;this.renderAlpha=0;this.dragMode='pan';this.dead=false;
    this.gpu=new T.WebGLRenderer({canvas:view,antialias:true,powerPreference:'low-power'});this.gpu.outputColorSpace=T.SRGBColorSpace;
    this.scene=new T.Scene();this.scene.background=new T.Color('#e3edf2');this.scene.fog=new T.Fog('#e3edf2',1100,2400);
    this.camera=new T.PerspectiveCamera(43,1,.3,4000);this.target=vec(310,2,370);this.distance=410;this.yaw=Math.PI/4;this.polar=.86;
    this.sun=new T.DirectionalLight('#fff4df',2.1);this.sun.position.set(-300,900,180);this.sun.castShadow=true;this.sun.shadow.camera.left=-700;this.sun.shadow.camera.right=700;this.sun.shadow.camera.top=700;this.sun.shadow.camera.bottom=-700;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=1800;this.sun.shadow.bias=-.0004;this.scene.add(this.sun);
    this.ambient=new T.HemisphereLight('#eaf4ff','#547361',1.15);this.scene.add(this.ambient);this.scene.add(this.sun.target);
    this.geometries={rounded:new RoundedBoxGeometry(1,1,1,1,.10),sphere:new T.SphereGeometry(.5,8,6),gable:createGableGeometry(T),box:new T.BoxGeometry(1,1,1),window:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(.5,1,7),cylinder:new T.CylinderGeometry(.5,.5,1,10),ico:new T.IcosahedronGeometry(.5,0)};
    for(const [shape,kind] of [['roadRing1','roundabout'],['roadRing2','roundabout2']]){const p=roadProfile(kind);this.geometries[shape]=roadRingGeometry(T,p.circle.island,p.circle.outer);}
    this.material=new T.MeshLambertMaterial();this.windowMaterial=new T.MeshStandardMaterial({roughness:.28,metalness:.12,emissive:'#ffca81',emissiveIntensity:0});this.tileMaterial=new T.MeshLambertMaterial();this.metalMaterial=new T.MeshStandardMaterial({roughness:.58,metalness:.3});this.lampMaterial=new T.MeshBasicMaterial({color:'#fff5d4'});
    this.groundMaterial=new T.MeshLambertMaterial({vertexColors:true});this.waterMaterial=new T.MeshLambertMaterial({color:'#379bbc',transparent:true,opacity:.94});
    this.ghostGroup=new T.Group();this.scene.add(this.ghostGroup);this.connectionGroup=new T.Group();this.scene.add(this.connectionGroup);this.ghostMaterial=new T.MeshBasicMaterial({transparent:true,opacity:.36,depthWrite:false});this.pickables=[];this.regions=new Map();this.actorGroup=new T.Group();this.scene.add(this.actorGroup);this.actorMeshes=new Map();
    this.signalMeshes=new Map();for(const [name,color] of [['red','#ff584b'],['amber','#ffca5b'],['green','#55eba0']]){const material=new T.MeshBasicMaterial({color}),mesh=new T.InstancedMesh(this.geometries.sphere,material,256);mesh.count=0;mesh.visible=false;this.signalMeshes.set(name,mesh);this.scene.add(mesh);}
    this.ray=new T.Raycaster();this.ndc=new T.Vector2();this.object=new T.Object3D();this.frustum=new T.Frustum();this.matrix=new T.Matrix4();
    this.selection=new T.Mesh(new T.BoxGeometry(20,.08,20),new T.MeshBasicMaterial({color:'#ffdaa4',transparent:true,opacity:.3,depthWrite:false}));this.selection.visible=false;this.scene.add(this.selection);
    this.autoQuality=new AutoQuality(innerWidth<600);this.qualityPreference='auto';this.setQuality('auto');this.resize();this.center();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
    this.contextLost=e=>{e.preventDefault();this.onContextLost?.();};view.addEventListener('webglcontextlost',this.contextLost);
  }
  resize(){this.width=this.canvas.clientWidth;this.height=this.canvas.clientHeight;this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();this.gpu.setPixelRatio(Math.min(devicePixelRatio||1,PROFILES[this.quality].dpr));this.gpu.setSize(this.width,this.height,false);this.updateCamera();}
  setQuality(value){if(value!=='auto'&&!PROFILES[value])return;this.qualityPreference=value;if(value==='auto')value=this.autoQuality.reset(performance.now());this.applyQuality(value);}
  applyQuality(value){this.quality=value;document.documentElement.dataset.graphicsQuality=value;const size=PROFILES[value].shadow;this.gpu.shadowMap.enabled=!!size;this.gpu.shadowMap.type=T.PCFSoftShadowMap;if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.sun.shadow.mapSize.set(size||512,size||512);this.gpu.setPixelRatio(Math.min(devicePixelRatio||1,PROFILES[value].dpr));this.gpu.setSize(this.width||1,this.height||1,false);}
  updateCamera(){this.target.x=T.MathUtils.clamp(this.target.x,0,SIZE*20);this.target.z=T.MathUtils.clamp(this.target.z,0,SIZE*20);this.target.y=terrainHeight(this.getCity().world,this.target.x,this.target.z);this.camera.position.set(this.target.x+this.distance*Math.sin(this.polar)*Math.sin(this.yaw),this.target.y+this.distance*Math.cos(this.polar),this.target.z+this.distance*Math.sin(this.polar)*Math.cos(this.yaw));this.camera.lookAt(this.target);this.camera.updateMatrixWorld();this.sun.target.position.copy(this.target);this.sun.position.set(this.target.x-300,this.target.y+900,this.target.z+180);}
  center(){const f=cityFocus(this.getCity(),this.width);this.target.set((f.x+.5)*20,2,(f.y+.5)*20);this.distance=f.distance;this.polar=.92;this.yaw=Math.PI/4;this.follow=null;this.updateCamera();}
  focusTile(x,y){this.follow=null;this.target.x=(x+.5)*20;this.target.z=(y+.5)*20;this.updateCamera();}
  entryScreenPosition(){const s=this.getCity(),i=cityEntry(s),p=vec((i%SIZE+.5)*20,surfaceHeight(s,i,SIZE)+9,(Math.floor(i/SIZE)+.5)*20).project(this.camera);return {x:(p.x+1)*this.width/2,y:(1-p.y)*this.height/2,visible:p.z>=-1&&p.z<=1&&Math.abs(p.x)<.95&&Math.abs(p.y)<.95};}
  panBy(dx,dy){this.follow=null;if(this.dragMode==='orbit'){this.yaw-=dx*.007;this.polar=T.MathUtils.clamp(this.polar+dy*.005,.25,1.35);}else{const unit=2*this.distance*Math.tan(T.MathUtils.degToRad(43/2))/this.height;this.target.x+=(-dx*Math.cos(this.yaw)-dy*Math.sin(this.yaw)/Math.max(.2,Math.cos(this.polar)))*unit;this.target.z+=(dx*Math.sin(this.yaw)-dy*Math.cos(this.yaw)/Math.max(.2,Math.cos(this.polar)))*unit;}this.updateCamera();}
  topView(){this.polar=this.polar<.1?.86:.02;this.updateCamera();}
  zoomAt(factor,px=this.width/2,py=this.height/2){const plane=new T.Plane(vec(0,1,0),-this.target.y),before=vec(0,0,0),after=vec(0,0,0);this.setRay(px,py);const a=this.ray.ray.intersectPlane(plane,before);this.distance=T.MathUtils.clamp(this.distance/factor,20,1600);this.updateCamera();this.setRay(px,py);if(a&&this.ray.ray.intersectPlane(plane,after)){this.target.add(before.sub(after));this.updateCamera();}}
  setRay(px,py){this.ndc.set(px/this.width*2-1,1-py/this.height*2);this.ray.setFromCamera(this.ndc,this.camera);}
  tileAt(px,py){this.setRay(px,py);this.scene.updateMatrixWorld(true);const hit=this.ray.intersectObjects(this.pickables,false)[0];if(!hit)return null;const tile=hit.object.userData.tiles?.[hit.instanceId];let i=tile??Math.floor(hit.point.z/20)*SIZE+Math.floor(hit.point.x/20);return Number.isInteger(i)&&i>=0&&i<SIZE*SIZE?{i,x:i%SIZE,y:Math.floor(i/SIZE)}:null;}
  actorAt(px,py){this.setRay(px,py);this.scene.updateMatrixWorld(true);const hit=this.ray.intersectObjects([...this.actorMeshes.values()],false)[0];return hit?.object.userData.actors?.[hit.instanceId]||null;}
  batches(parts,parent,ghost=false){
    const sets=new Map();for(const p of parts){const key=p.shape+'-'+(p.material||'concrete')+(p.detail?'-detail':'');if(!sets.has(key))sets.set(key,[]);sets.get(key).push(p);}
    for(const [key,list] of sets){const shape=list[0].shape,m=new T.InstancedMesh(this.geometries[shape],ghost?this.ghostMaterial:list[0].material==='glow'?this.lampMaterial:shape==='window'?this.windowMaterial:list[0].material==='metal'?this.metalMaterial:list[0].material==='tile'?this.tileMaterial:this.material,list.length);m.userData.tiles=list.map(p=>p.tile);m.userData.detail=key.endsWith('-detail');m.castShadow=!ghost&&shape!=='window';m.receiveShadow=!ghost;
      for(let i=0;i<list.length;i++){const p=list[i];this.object.position.fromArray(p.position);this.object.scale.fromArray(p.scale);this.object.rotation.set(0,p.rotation?.yaw||0,p.rotation?.pitch||0,'YXZ');this.object.updateMatrix();m.setMatrixAt(i,this.object.matrix);m.setColorAt(i,new T.Color(p.color));}updateBounds(m);parent.add(m);if(!ghost)this.pickables.push(m);
    }
  }
  removeRegion(region){for(const m of region.assets.children){m.dispose();const at=this.pickables.indexOf(m);if(at>=0)this.pickables.splice(at,1);}this.scene.remove(region.assets);}
  rebuild(s){
    if(this.city===s&&this.cachedGraph===s.graphVersion&&this.cachedDay===s.day&&this.cachedLayer===this.layer&&this.lastPaths>=0)return;
    this.cachedGraph=s.graphVersion;this.cachedDay=s.day;this.cachedLayer=this.layer;
    if(this.city!==s){for(const m of this.actorMeshes.values()){this.actorGroup.remove(m);m.dispose();}this.actorMeshes.clear();for(const r of this.regions.values()){this.removeRegion(r);r.ground.geometry.dispose();this.scene.remove(r.ground);if(r.water){this.scene.remove(r.water);r.water.geometry.dispose();}}this.regions.clear();this.pickables=[];this.city=s;}
    for(let y=0;y<SIZE;y+=REGION)for(let x=0;x<SIZE;x+=REGION){const key=y*SIZE+x,signature=chunkSignature(s,x,y,this.layer)+s.contracts.filter(c=>c.status==='building'&&c.tile%SIZE>=x&&c.tile%SIZE<x+REGION&&Math.floor(c.tile/SIZE)>=y&&Math.floor(c.tile/SIZE)<y+REGION).map(c=>c.id).join(',');let r=this.regions.get(key);
      if(!r){const data=terrainArrays(s,x,y),geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(data.colors,3));geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();const ground=new T.Mesh(geo,this.groundMaterial);ground.receiveShadow=true;this.scene.add(ground);this.pickables.push(ground);
        const water=new T.Mesh(new T.PlaneGeometry(REGION*20,REGION*20),this.waterMaterial);water.rotation.x=-Math.PI/2;water.position.set((x+REGION/2)*20,s.world.waterHeight,(y+REGION/2)*20); // clip water to the actual river cells below
        const waterPositions=[];for(let ty=y;ty<y+REGION;ty++)for(let tx=x;tx<x+REGION;tx++)if(s.tiles[ty*SIZE+tx].terrain==='water'){for(const p of [[tx,ty],[tx,ty+1],[tx+1,ty],[tx+1,ty],[tx,ty+1],[tx+1,ty+1]])waterPositions.push(p[0]*20,waterHeightAt(s.world,ty*SIZE+tx),p[1]*20);}
        water.geometry.dispose();water.geometry=new T.BufferGeometry();water.geometry.setAttribute('position',new T.Float32BufferAttribute(waterPositions,3));water.geometry.computeVertexNormals();water.rotation.set(0,0,0);water.position.set(0,0,0);if(waterPositions.length){this.scene.add(water);this.pickables.push(water);}
        r={x,y,ground,water,assets:new T.Group(),signature:null,center:vec((x+REGION/2)*20,0,(y+REGION/2)*20)};this.scene.add(r.assets);this.regions.set(key,r);
      }
      if(r.signature!==signature){this.removeRegion(r);r.assets=new T.Group();this.scene.add(r.assets);this.batches(chunkParts(s,x,y,this.layer),r.assets);r.signature=signature;}
    }
    this.minimap();
  }
  // Lag interpolation along the saved path; it does not predict through blocked roads.
  actorPosition(c){const j=c.journey||c.trip;if(!j||c.state==='blocked'||!this.renderAlpha)return c.position;let back=(1-this.renderAlpha)*(j.actualSpeed??j.speed)*STEP_SECONDS,seg=j.segment,d=j.distance;while(back>d&&seg>0){back-=d;seg--;d=Math.hypot(j.path[seg+1].x-j.path[seg].x,j.path[seg+1].y-j.path[seg].y,j.path[seg+1].z-j.path[seg].z);}d=Math.max(0,d-back);const a=j.path[seg],b=j.path[seg+1],len=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z),u=len?d/len:0;return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u};}
  drawActors(s){
    const parts=[],profile=PROFILES[this.quality],budget=actorBudget(s.citizens.length,this.quality,this.width<600);
    if(this.actorCity!==s||this.actorStep!==s.clock.step){
      this.actorCity=s;this.actorStep=s.clock.step;
      this.activeCitizens=s.citizens.filter(c=>c.journey||c.state==='waiting-bus');
      this.activeBuses=s.vehicles.filter(v=>v.kind==='bus'&&v.busPhase&&v.busPhase!=='depot');
      this.actorVehicles=new Map(s.vehicles.map(v=>[v.id,v]));
    }
    const vehicles=this.actorVehicles,point=vec(0,0,0),self=this;let visibleCount=0;
    function* candidates(){
      for(const c of self.activeCitizens){const p=self.actorPosition(c);point.set(p.x,p.z+1,p.y);if(!self.frustum.containsPoint(point))continue;visibleCount++;yield {c,p,d:point.distanceToSquared(self.camera.position)};}
      for(const c of self.activeBuses){const p=self.actorPosition(c);point.set(p.x,p.z+2,p.y);if(!self.frustum.containsPoint(point))continue;visibleCount++;yield {c,p,d:point.distanceToSquared(self.camera.position),bus:true};}
    }
    const selected=nearestActors(candidates(),budget,this.follow);
    this.visibleActors=visibleCount;this.renderedActors=selected.length;
    for(const {c,p,d,bus} of selected){
      const journey=c.journey||c.trip,target=journey?.path[journey.segment+1],angle=target?Math.atan2(target.x-p.x,target.y-p.y):(c.visualYaw||0),distance=Math.sqrt(d),lod=distance<90?0:distance<profile.details+this.distance*.45?1:2;
      const id=bus?vehicleArtId(c):c.journey?.mode==='car'?vehicles.get(c.vehicle)?.artId: c.artId;
      const motion=bus?{speed:c.speed,distance:Math.max(0,(c.travelled||0)-(c.trip&&this.renderAlpha?(1-this.renderAlpha)*c.speed:0)),doors:c.doors,night:this.night}:citizenMotion(s,c,this.renderAlpha);
      parts.push(...worldMobilityParts(id||actorArt(s,c),motion,lod,p,angle,c.id));
    }
    const sets=new Map();for(const p of parts){if(!sets.has(p.shape))sets.set(p.shape,[]);sets.get(p.shape).push(p);}
    for(const shape of Object.keys(this.geometries)){
      const list=sets.get(shape)||[];let mesh=this.actorMeshes.get(shape);if(mesh&&mesh.instanceMatrix.count<list.length){this.actorGroup.remove(mesh);mesh.dispose();this.actorMeshes.delete(shape);mesh=null;}
      if(!mesh&&list.length){mesh=new T.InstancedMesh(this.geometries[shape],shape==='window'?this.windowMaterial:this.material,2**Math.ceil(Math.log2(Math.max(16,list.length))));mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=false;mesh.userData.actors=[];this.actorGroup.add(mesh);this.actorMeshes.set(shape,mesh);}
      if(!mesh)continue;mesh.count=list.length;mesh.userData.actors=list.map(p=>p.id);mesh.visible=!!list.length;
      for(let i=0;i<list.length;i++){const p=list[i];this.object.position.fromArray(p.position);this.object.scale.fromArray(p.scale);this.object.rotation.set(p.rotation?.pitch||0,p.rotation?.yaw||0,p.rotation?.roll||0,'YXZ');this.object.updateMatrix();mesh.setMatrixAt(i,this.object.matrix);mesh.setColorAt(i,new T.Color(p.color));}if(list.length)updateBounds(mesh);
    }
  }
  signals(s,ms){
    if(this.signalGraph===s.graphVersion&&this.signalSecond===Math.floor(s.clock.seconds)&&ms-(this.lastSignals||0)<250)return;
    this.signalGraph=s.graphVersion;this.signalSecond=Math.floor(s.clock.seconds);this.lastSignals=ms;
    const junctions=s.tiles.flatMap((t,i)=>isJunction(s,i)?[{i,d:Math.hypot((i%SIZE+.5)*20-this.target.x,(Math.floor(i/SIZE)+.5)*20-this.target.z)}]:[]).filter(v=>v.d<350).sort((a,b)=>a.d-b.d).slice(0,32);
    const counts={red:0,amber:0,green:0};
    for(const {i} of junctions)for(const p of signalGlows(s,i,surfaceHeight(s,i,SIZE),roadProfile(s.tiles[i]).width)){const mesh=this.signalMeshes.get(p.light),n=counts[p.light]++;this.object.position.fromArray(p.position);this.object.scale.fromArray(p.scale);this.object.rotation.set(0,0,0);this.object.updateMatrix();mesh.setMatrixAt(n,this.object.matrix);}
    for(const [light,mesh] of this.signalMeshes){mesh.count=counts[light];mesh.visible=mesh.count>0;if(mesh.count)updateBounds(mesh);}
    this.visibleSignals=junctions.length;
  }
  minimap(){const s=this.getCity(),c=this.mc,w=this.mini.width,h=this.mini.height;for(let i=0;i<s.tiles.length;i++){const t=s.tiles[i];c.fillStyle=t.terrain==='water'?'#4c9eb7':isRoad(t)?'#4c6a70':CATALOG[t.kind||t.zone]?.color||'#7ba583';c.fillRect(i%SIZE*w/SIZE,Math.floor(i/SIZE)*h/SIZE,w/SIZE+.2,h/SIZE+.2);}drawEntryMini(c,s,w,h);c.strokeStyle='#fff';c.strokeRect(this.target.x/(SIZE*20)*w-10,this.target.z/(SIZE*20)*h-7,20,14);}
  frame(ms){if(this.dead)return;this.raf=requestAnimationFrame(this.frame);if(document.hidden||document.body?.dataset.screen==='home'||!frameDue(ms,this.lastDraw,PROFILES[this.quality].fps))return;this.lastDraw=ms;const s=this.getCity();if(this.follow){const c=s.citizens.find(c=>c.id===this.follow)||s.vehicles.find(v=>v.id===this.follow);if(c){const p=this.actorPosition(c);this.target.x=p.x;this.target.z=p.y;}}
    this.updateCamera();if(ms-(this.lastCheck||0)>250||this.lastPaths<0){this.rebuild(s);this.lastCheck=ms;this.lastPaths=s.day;}
    const night=this.night;this.scene.background.set(night?'#182e3b':'#e3edf2');this.scene.fog.color.copy(this.scene.background);this.sun.intensity=night?.3:2.1;this.ambient.intensity=night?.75:1.15;this.windowMaterial.emissiveIntensity=night?.8:0;this.windowMaterial.color.set(night?'#ffe1a3':'#c4e6ef');
    this.matrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.matrix);for(const r of this.regions.values()){const distance=r.center.distanceTo(this.target),limit=PROFILES[this.quality].details+this.distance*.35,selected=this.selected&&this.selected.x>=r.x&&this.selected.x<r.x+REGION&&this.selected.y>=r.y&&this.selected.y<r.y+REGION;r.detailed=detailVisible(r.detailed,distance,limit,selected);for(const m of r.assets.children){if(m.userData.detail)m.visible=r.detailed;m.castShadow=this.quality==='high'&&distance<600&&!m.userData.detail;}}
    this.updateGhost(s);this.drawActors(s);const select=this.selected||this.hover;this.selection.visible=!!select;if(select)this.selection.position.set((select.x+.5)*20,surfaceHeight(s,select.i,SIZE)+.12,(select.y+.5)*20);this.signals(s,ms);this.gpu.render(this.scene,this.camera);this.onRender?.(ms);if(this.qualityPreference==='auto'){const value=this.autoQuality.sample(ms-(this.previousDraw||ms),ms);if(value)this.applyQuality(value);}this.fps=1000/(ms-(this.previousDraw||ms-33));this.previousDraw=ms;
  }
  updateGhost(s){
    if(this.connectionGuide!==this.entryGuide){
      for(const m of [...this.connectionGroup.children]){this.connectionGroup.remove(m);m.dispose();}
      if(this.entryGuide?.length)this.batches(this.entryGuide.flatMap(i=>roadParts(s,i%SIZE,Math.floor(i/SIZE),'road','normal','#ffd080').filter(p=>!p.detail)),this.connectionGroup,true);
      this.connectionGuide=this.entryGuide;
    }
    const ghost=placementGhost(s,this.hover,this.tool,this.blueprint);this.ghostGroup.visible=!!ghost;
    if(!ghost||ghost.key===this.ghostKey)return;
    for(const m of [...this.ghostGroup.children]){this.ghostGroup.remove(m);m.dispose();}
    this.batches(ghost.parts,this.ghostGroup,true);this.ghostKey=ghost.key;
  }
  reset(){this.lastPaths=-1;this.selected=null;this.center();}
  capturePNG(){
    // Capture immediately after rendering; no persistent drawing buffer or extra loop.
    const selected=this.selection.visible,ghost=this.ghostGroup.visible;
    try{this.selection.visible=false;this.ghostGroup.visible=false;this.gpu.render(this.scene,this.camera);return new Promise((resolve,reject)=>this.view.toBlob(blob=>blob?resolve(blob):reject(new Error('Không chụp được ảnh bản đồ.')),'image/png'));}
    finally{this.selection.visible=selected;this.ghostGroup.visible=ghost;}
  }
  stats(){return{mode:this.mode,quality:this.quality,qualityPreference:this.qualityPreference,pixelRatio:this.gpu.getPixelRatio(),triangles:this.gpu.info.render.triangles,regions:this.regions.size,drawCalls:this.gpu.info.render.calls,geometries:this.gpu.info.memory.geometries,textures:this.gpu.info.memory.textures,fps:Math.round(this.fps||0),citizens:this.getCity().citizens.length,sharedMaterials:12,camera:{target:this.target.toArray(),distance:this.distance,yaw:this.yaw,polar:this.polar},night:this.night,activeActors:this.getCity().citizens.filter(c=>c.journey||c.state==='waiting-bus').length+this.getCity().vehicles.filter(v=>v.kind==='bus'&&v.busPhase!=='depot').length,visibleActors:this.visibleActors||0,renderedActors:this.renderedActors||0,visibleSignals:this.visibleSignals||0,actorBudget:actorBudget(this.getCity().citizens.length,this.quality,this.width<600)};}
  dispose(){this.dead=true;cancelAnimationFrame(this.raf);this.view.removeEventListener('webglcontextlost',this.contextLost);for(const r of this.regions.values()){this.removeRegion(r);r.ground.geometry.dispose();r.water.geometry.dispose();}for(const m of this.actorMeshes.values())m.dispose();for(const m of this.signalMeshes.values()){m.dispose();m.material.dispose();}Object.values(this.geometries).forEach(g=>g.dispose());for(const m of [this.material,this.tileMaterial,this.metalMaterial,this.lampMaterial,this.groundMaterial,this.windowMaterial,this.waterMaterial,this.selection.material])m.dispose();this.selection.geometry.dispose();for(const m of [...this.ghostGroup.children,...this.connectionGroup.children])m.dispose();this.ghostMaterial.dispose();this.gpu.dispose();this.gpu.forceContextLoss();}
}
