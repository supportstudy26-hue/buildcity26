import * as T from 'three';
import {SIZE,isRoad,CATALOG} from '../core.js';
import {surfaceHeight,terrainHeight} from '../systems/terrain.js';
import {REGION,chunkParts,chunkSignature,terrainArrays} from './scene-data.js';
const PROFILES={low:{dpr:1,fps:30,shadow:0,details:70},medium:{dpr:1.25,fps:45,shadow:1024,details:160},high:{dpr:1.75,fps:60,shadow:2048,details:260}};
const vec=(x,y,z)=>new T.Vector3(x,y,z);
export function updateBounds(mesh){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();}
export class ThreeCityRenderer{
  constructor(input,mini,getCity,view){
    this.canvas=input;this.view=view;this.mini=mini;this.mc=mini.getContext('2d');this.getCity=getCity;
    this.mode='3d';this.tool='inspect';this.layer='normal';this.night=false;this.follow=null;this.selected=null;this.hover=null;this.lastPaths=-1;this.renderAlpha=0;this.dragMode='pan';this.dead=false;
    this.gpu=new T.WebGLRenderer({canvas:view,antialias:false,powerPreference:'low-power'});this.gpu.outputColorSpace=T.SRGBColorSpace;
    this.scene=new T.Scene();this.scene.background=new T.Color('#c3d3ca');this.scene.fog=new T.Fog('#c3d3ca',1100,2400);
    this.camera=new T.PerspectiveCamera(43,1,.3,4000);this.target=vec(310,2,370);this.distance=410;this.yaw=Math.PI/4;this.polar=.86;
    this.sun=new T.DirectionalLight('#ffe4c5',2.1);this.sun.position.set(-300,900,180);this.sun.castShadow=true;this.sun.shadow.camera.left=-700;this.sun.shadow.camera.right=700;this.sun.shadow.camera.top=700;this.sun.shadow.camera.bottom=-700;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=1800;this.sun.shadow.bias=-.0004;this.scene.add(this.sun);
    this.ambient=new T.HemisphereLight('#d8edee','#71865c',2.0);this.scene.add(this.ambient);this.scene.add(this.sun.target);
    this.geometries={box:new T.BoxGeometry(1,1,1),window:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(.5,1,7),cylinder:new T.CylinderGeometry(.5,.5,1,10),ico:new T.IcosahedronGeometry(.5,0)};
    this.material=new T.MeshLambertMaterial();this.windowMaterial=new T.MeshBasicMaterial({color:'#7299a4'});
    this.groundMaterial=new T.MeshLambertMaterial({vertexColors:true});this.waterMaterial=new T.MeshLambertMaterial({color:'#76adb0',transparent:true,opacity:.84});
    this.pickables=[];this.regions=new Map();this.actorGroup=new T.Group();this.scene.add(this.actorGroup);this.actorMeshes=new Map();
    this.ray=new T.Raycaster();this.ndc=new T.Vector2();this.object=new T.Object3D();this.frustum=new T.Frustum();this.matrix=new T.Matrix4();
    this.selection=new T.Mesh(new T.BoxGeometry(20,.08,20),new T.MeshBasicMaterial({color:'#ffdaa4',transparent:true,opacity:.3,depthWrite:false}));this.selection.visible=false;this.scene.add(this.selection);
    this.quality=innerWidth<600?'low':'medium';this.setQuality(this.quality);this.resize();this.center();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
    this.contextLost=e=>{e.preventDefault();this.onContextLost?.();};view.addEventListener('webglcontextlost',this.contextLost);
  }
  resize(){this.width=this.canvas.clientWidth;this.height=this.canvas.clientHeight;this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();this.gpu.setPixelRatio(Math.min(devicePixelRatio||1,PROFILES[this.quality].dpr));this.gpu.setSize(this.width,this.height,false);this.updateCamera();}
  setQuality(value){if(!PROFILES[value])return;this.quality=value;const size=PROFILES[value].shadow;this.gpu.shadowMap.enabled=!!size;this.gpu.shadowMap.type=T.PCFSoftShadowMap;if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.sun.shadow.mapSize.set(size||512,size||512);this.gpu.setPixelRatio(Math.min(devicePixelRatio||1,PROFILES[value].dpr));this.gpu.setSize(this.width||1,this.height||1,false);}
  updateCamera(){this.target.x=T.MathUtils.clamp(this.target.x,0,SIZE*20);this.target.z=T.MathUtils.clamp(this.target.z,0,SIZE*20);this.target.y=terrainHeight(this.getCity().world,this.target.x,this.target.z);this.camera.position.set(this.target.x+this.distance*Math.sin(this.polar)*Math.sin(this.yaw),this.target.y+this.distance*Math.cos(this.polar),this.target.z+this.distance*Math.sin(this.polar)*Math.cos(this.yaw));this.camera.lookAt(this.target);this.camera.updateMatrixWorld();this.sun.target.position.copy(this.target);this.sun.position.set(this.target.x-300,900,this.target.z+180);}
  center(){this.target.set(310,2,370);this.distance=this.width<600?530:410;this.polar=.86;this.yaw=Math.PI/4;this.follow=null;this.updateCamera();}
  focusTile(x,y){this.follow=null;this.target.x=(x+.5)*20;this.target.z=(y+.5)*20;this.updateCamera();}
  panBy(dx,dy){this.follow=null;if(this.dragMode==='orbit'){this.yaw-=dx*.007;this.polar=T.MathUtils.clamp(this.polar+dy*.005,.25,1.35);}else{const unit=2*this.distance*Math.tan(T.MathUtils.degToRad(43/2))/this.height;this.target.x+=(-dx*Math.cos(this.yaw)-dy*Math.sin(this.yaw)/Math.max(.2,Math.cos(this.polar)))*unit;this.target.z+=(dx*Math.sin(this.yaw)-dy*Math.cos(this.yaw)/Math.max(.2,Math.cos(this.polar)))*unit;}this.updateCamera();}
  topView(){this.polar=this.polar<.1?.86:.02;this.updateCamera();}
  zoomAt(factor,px=this.width/2,py=this.height/2){const plane=new T.Plane(vec(0,1,0),-this.target.y),before=vec(0,0,0),after=vec(0,0,0);this.setRay(px,py);const a=this.ray.ray.intersectPlane(plane,before);this.distance=T.MathUtils.clamp(this.distance/factor,20,1600);this.updateCamera();this.setRay(px,py);if(a&&this.ray.ray.intersectPlane(plane,after)){this.target.add(before.sub(after));this.updateCamera();}}
  setRay(px,py){this.ndc.set(px/this.width*2-1,1-py/this.height*2);this.ray.setFromCamera(this.ndc,this.camera);}
  tileAt(px,py){this.setRay(px,py);this.scene.updateMatrixWorld(true);const hit=this.ray.intersectObjects(this.pickables,false)[0];if(!hit)return null;const tile=hit.object.userData.tiles?.[hit.instanceId];let i=tile??Math.floor(hit.point.z/20)*SIZE+Math.floor(hit.point.x/20);return Number.isInteger(i)&&i>=0&&i<SIZE*SIZE?{i,x:i%SIZE,y:Math.floor(i/SIZE)}:null;}
  actorAt(px,py){this.setRay(px,py);this.scene.updateMatrixWorld(true);const hit=this.ray.intersectObjects([...this.actorMeshes.values()],false)[0];return hit?.object.userData.actors?.[hit.instanceId]||null;}
  batches(parts,parent){
    const sets=new Map();for(const p of parts){const key=p.shape+(p.detail?'-detail':'');if(!sets.has(key))sets.set(key,[]);sets.get(key).push(p);}
    for(const [key,list] of sets){const shape=list[0].shape,m=new T.InstancedMesh(this.geometries[shape],shape==='window'?this.windowMaterial:this.material,list.length);m.userData.tiles=list.map(p=>p.tile);m.userData.detail=key.endsWith('-detail');m.castShadow=shape!=='window';m.receiveShadow=true;
      for(let i=0;i<list.length;i++){const p=list[i];this.object.position.fromArray(p.position);this.object.scale.fromArray(p.scale);this.object.rotation.set(0,p.rotation?.yaw||0,p.rotation?.pitch||0,'YXZ');this.object.updateMatrix();m.setMatrixAt(i,this.object.matrix);m.setColorAt(i,new T.Color(p.color));}updateBounds(m);parent.add(m);this.pickables.push(m);
    }
  }
  removeRegion(region){for(const m of region.assets.children){m.dispose();const at=this.pickables.indexOf(m);if(at>=0)this.pickables.splice(at,1);}this.scene.remove(region.assets);}
  rebuild(s){
    if(this.city!==s){for(const r of this.regions.values()){this.removeRegion(r);r.ground.geometry.dispose();this.scene.remove(r.ground);if(r.water){this.scene.remove(r.water);r.water.geometry.dispose();}}this.regions.clear();this.pickables=[];this.city=s;}
    for(let y=0;y<SIZE;y+=REGION)for(let x=0;x<SIZE;x+=REGION){const key=y*SIZE+x,signature=chunkSignature(s,x,y,this.layer)+s.contracts.filter(c=>c.status==='building'&&c.tile%SIZE>=x&&c.tile%SIZE<x+REGION&&Math.floor(c.tile/SIZE)>=y&&Math.floor(c.tile/SIZE)<y+REGION).map(c=>c.id).join(',');let r=this.regions.get(key);
      if(!r){const data=terrainArrays(s,x,y),geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(data.colors,3));geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();const ground=new T.Mesh(geo,this.groundMaterial);ground.receiveShadow=true;this.scene.add(ground);this.pickables.push(ground);
        const water=new T.Mesh(new T.PlaneGeometry(REGION*20,REGION*20),this.waterMaterial);water.rotation.x=-Math.PI/2;water.position.set((x+REGION/2)*20,s.world.waterHeight,(y+REGION/2)*20); // clip water to the actual river cells below
        const waterPositions=[];for(let ty=y;ty<y+REGION;ty++)for(let tx=x;tx<x+REGION;tx++)if(s.tiles[ty*SIZE+tx].terrain==='water'){for(const p of [[tx,ty],[tx,ty+1],[tx+1,ty],[tx+1,ty],[tx,ty+1],[tx+1,ty+1]])waterPositions.push(p[0]*20,s.world.waterHeight,p[1]*20);}
        water.geometry.dispose();water.geometry=new T.BufferGeometry();water.geometry.setAttribute('position',new T.Float32BufferAttribute(waterPositions,3));water.geometry.computeVertexNormals();water.rotation.set(0,0,0);water.position.set(0,0,0);if(waterPositions.length){this.scene.add(water);this.pickables.push(water);}
        r={ground,water,assets:new T.Group(),signature:null,center:vec((x+4)*20,0,(y+4)*20)};this.scene.add(r.assets);this.regions.set(key,r);
      }
      if(r.signature!==signature){this.removeRegion(r);r.assets=new T.Group();this.scene.add(r.assets);this.batches(chunkParts(s,x,y,this.layer),r.assets);r.signature=signature;}
    }
    this.minimap();
  }
  // Lag interpolation along the saved path; it does not predict through blocked roads.
  actorPosition(c){const j=c.journey;if(!j||c.state==='blocked'||!this.renderAlpha)return c.position;let back=(1-this.renderAlpha)*j.speed*10,seg=j.segment,d=j.distance;while(back>d&&seg>0){back-=d;seg--;d=Math.hypot(j.path[seg+1].x-j.path[seg].x,j.path[seg+1].y-j.path[seg].y,j.path[seg+1].z-j.path[seg].z);}d=Math.max(0,d-back);const a=j.path[seg],b=j.path[seg+1],len=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z),u=len?d/len:0;return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u};}
  drawActors(s){
    const parts=[];const profile=PROFILES[this.quality];
    const add=(shape,p,scale,color,id,rotation=null)=>parts.push({shape,position:p,scale,color,id,rotation});
    for(const c of s.citizens){if(!c.journey)continue;const p=this.actorPosition(c),point=vec(p.x,p.z+1,p.y);if(!this.frustum.containsPoint(point))continue;const target=c.journey.path[c.journey.segment+1],angle=Math.atan2(target.x-p.x,target.y-p.y),near=point.distanceTo(this.camera.position)<profile.details+this.distance*.85;
      if(c.journey.mode==='car'){
        add('box',[p.x,p.z+.6,p.y],[1.8,1.1,4.2],c.id===this.follow?'#fae6af':'#dba775',c.id,{yaw:angle});add('window',[p.x,p.z+1.35,p.y],[1.65,.7,2],'#719dab',c.id,{yaw:angle});
        if(near)for(const side of [-1,1])for(const along of [-1,1]){const dx=side*.94,dz=along*1.25;add('box',[p.x+dx*Math.cos(angle)+dz*Math.sin(angle),p.z+.32,p.y-dx*Math.sin(angle)+dz*Math.cos(angle)],[.25,.5,.7],'#384d50',c.id,{yaw:angle});}
      }else{
        const moving=c.state==='walking',phase=moving?(s.clock.seconds-(this.renderAlpha?(1-this.renderAlpha)*10:0))*c.walkSpeed*Math.PI/1.4:0,swing=moving?Math.sin(phase)*.45:0;
        add('box',[p.x,p.z+1.05,p.y],[.42,.65,.28],c.id===this.follow?'#f4cc8d':'#648b97',c.id,{yaw:angle});add('ico',[p.x,p.z+1.55,p.y],[.34,.37,.34],'#edc7a2',c.id);
        if(near)for(const side of [-1,1]){const offset=side*.13;add('box',[p.x+offset*Math.cos(angle),p.z+.42,p.y-offset*Math.sin(angle)],[.13,.62,.15],'#526671',c.id,{yaw:angle,pitch:side*swing});add('box',[p.x+side*.29*Math.cos(angle),p.z+1.02,p.y-side*.29*Math.sin(angle)],[.12,.56,.12],'#e8c19f',c.id,{yaw:angle,pitch:-side*swing});}
      }
    }
    const sets=new Map();for(const p of parts){if(!sets.has(p.shape))sets.set(p.shape,[]);sets.get(p.shape).push(p);}
    for(const shape of Object.keys(this.geometries)){
      const list=sets.get(shape)||[];let mesh=this.actorMeshes.get(shape);if(mesh&&mesh.instanceMatrix.count<list.length){this.actorGroup.remove(mesh);mesh.dispose();this.actorMeshes.delete(shape);mesh=null;}
      if(!mesh&&list.length){mesh=new T.InstancedMesh(this.geometries[shape],shape==='window'?this.windowMaterial:this.material,2**Math.ceil(Math.log2(Math.max(16,list.length))));mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=false;mesh.userData.actors=[];this.actorGroup.add(mesh);this.actorMeshes.set(shape,mesh);}
      if(!mesh)continue;mesh.count=list.length;mesh.userData.actors=list.map(p=>p.id);mesh.visible=!!list.length;
      for(let i=0;i<list.length;i++){const p=list[i];this.object.position.fromArray(p.position);this.object.scale.fromArray(p.scale);this.object.rotation.set(p.rotation?.pitch||0,p.rotation?.yaw||0,0,'YXZ');this.object.updateMatrix();mesh.setMatrixAt(i,this.object.matrix);mesh.setColorAt(i,new T.Color(p.color));}if(list.length)updateBounds(mesh);
    }
  }
  minimap(){const s=this.getCity(),c=this.mc,w=this.mini.width,h=this.mini.height;for(let i=0;i<s.tiles.length;i++){const t=s.tiles[i];c.fillStyle=t.terrain==='water'?'#75a9ae':isRoad(t)?'#4c6a70':CATALOG[t.kind||t.zone]?.color||'#94ae7d';c.fillRect(i%SIZE*w/SIZE,Math.floor(i/SIZE)*h/SIZE,w/SIZE+.2,h/SIZE+.2);}c.strokeStyle='#fff';c.strokeRect(this.target.x/(SIZE*20)*w-10,this.target.z/(SIZE*20)*h-7,20,14);}
  frame(ms){if(this.dead)return;this.raf=requestAnimationFrame(this.frame);if(document.hidden||ms-(this.lastDraw||0)<1000/PROFILES[this.quality].fps)return;this.lastDraw=ms;const s=this.getCity();if(this.follow){const c=s.citizens.find(c=>c.id===this.follow);if(c){const p=this.actorPosition(c);this.target.x=p.x;this.target.z=p.y;}}
    this.updateCamera();if(ms-(this.lastCheck||0)>250||this.lastPaths<0){this.rebuild(s);this.lastCheck=ms;this.lastPaths=s.day;}
    const night=this.night;this.scene.background.set(night?'#182e3b':'#c3d3ca');this.scene.fog.color.copy(this.scene.background);this.sun.intensity=night?.3:2.1;this.ambient.intensity=night?.75:2;this.windowMaterial.color.set(night?'#ffe1a3':'#7299a4');
    this.matrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.matrix);for(const r of this.regions.values())for(const m of r.assets.children)if(m.userData.detail)m.visible=r.center.distanceTo(this.target)<PROFILES[this.quality].details+this.distance*.35;
    this.drawActors(s);const select=this.selected||this.hover;this.selection.visible=!!select;if(select)this.selection.position.set((select.x+.5)*20,surfaceHeight(s,select.i,SIZE)+.12,(select.y+.5)*20);this.gpu.render(this.scene,this.camera);this.fps=1000/(ms-(this.previousDraw||ms-33));this.previousDraw=ms;
  }
  reset(){this.lastPaths=-1;this.selected=null;this.center();}
  stats(){return{mode:this.mode,quality:this.quality,regions:this.regions.size,drawCalls:this.gpu.info.render.calls,geometries:this.gpu.info.memory.geometries,textures:this.gpu.info.memory.textures,fps:Math.round(this.fps||0),citizens:this.getCity().citizens.length};}
  dispose(){this.dead=true;cancelAnimationFrame(this.raf);this.view.removeEventListener('webglcontextlost',this.contextLost);for(const r of this.regions.values()){this.removeRegion(r);r.ground.geometry.dispose();r.water.geometry.dispose();}for(const m of this.actorMeshes.values())m.dispose();Object.values(this.geometries).forEach(g=>g.dispose());for(const m of [this.material,this.groundMaterial,this.windowMaterial,this.waterMaterial,this.selection.material])m.dispose();this.selection.geometry.dispose();this.gpu.dispose();this.gpu.forceContextLoss();}
}
