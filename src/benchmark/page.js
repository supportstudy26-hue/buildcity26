import {benchmarkCity,architectureCity,facilityCity} from './scenario.js';
import {PerformanceSample} from './metrics.js';
import {ThreeCityRenderer} from '../game/render/three-renderer.js';
import {stepSimulation,serialize} from '../game/core.js';
import {simulationDelta,consumeSteps} from '../game/systems/clock.js';
import {createVietnamCity} from '../game/geography/city.js';
import {fetchGeoJSON,loadRegion,geographyCacheStats} from '../game/geography/data.js';
const $=id=>document.getElementById(id);
let city=benchmarkCity(1000),last=performance.now(),pending=0,report=null,loadMs=null;
const view=document.createElement('canvas');view.id='world3d';$('world').before(view);$('world').style.opacity='0';
const renderer=new ThreeCityRenderer($('world'),$('mini'),()=>city,view);renderer.setQuality('medium');
const sample=new PerformanceSample();renderer.onRender=ms=>sample.frame(ms);
function stats(){return{...sample.report(),...renderer.stats(),scenario:$('scenario').value,loadMs,geographyCache:geographyCacheStats(),population:city.citizens.length,activeAgents:city.citizens.filter(c=>!!c.journey).length,vehicles:city.vehicles.length,employed:city.citizens.filter(c=>!!c.work).length,arrivals:city.citizens.reduce((n,c)=>n+c.attendance,0),pathfindingQueue:'synchronous / not yet queued',gpuMemoryBytes:null,saveBytes:new TextEncoder().encode(JSON.stringify(serialize(city))).length,heapBytes:performance.memory?.usedJSHeapSize??null,viewport:[innerWidth,innerHeight],browser:navigator.userAgent,timeScale:5,seed:city.initialSeed,simulationSeconds:city.clock.seconds};}
function output(){report=stats();$('results').textContent=JSON.stringify(report,null,2);}
$('start').onclick=async()=>{
  sample.running=false;$('start').disabled=true;$('scenario').disabled=true;$('population').disabled=true;$('quality').disabled=true;$('status').textContent='Đang chuẩn bị dữ liệu…';$('results').textContent='';
  try{
    const start=performance.now();
    if($('scenario').value==='sandbox')city=benchmarkCity(Number($('population').value));
    else if($('scenario').value==='architecture')city=architectureCity();
    else if($('scenario').value==='facilities')city=facilityCity();
    else{const manifest=await fetchGeoJSON('manifest.json'),catalog=await fetchGeoJSON('catalog.json',{checksum:manifest.files['catalog.json'].sha256}),region=catalog.provinces.flatMap(p=>p.regions).find(r=>r.id===$('scenario').value);city=createVietnamCity(await loadRegion(region),manifest);}
    loadMs=+(performance.now()-start).toFixed(1);renderer.reset();if(['architecture','facilities'].includes($('scenario').value))renderer.focusTile(18,19);renderer.setQuality($('quality').value);pending=0;last=performance.now();sample.start(last);$('status').textContent='Đang đo 30 giây · '+($('scenario').value==='sandbox'?'giờ đi làm':['architecture','facilities'].includes($('scenario').value)?'kiến trúc + cư dân thực trong fixture riêng':'DEM thật, chưa có cư dân');
  }catch(e){$('status').textContent=e.message;enableControls();}
};
function enableControls(){for(const id of ['start','scenario','population','quality'])$(id).disabled=false;}
$('zoomIn').onclick=()=>renderer.zoomAt(1.3);$('zoomOut').onclick=()=>renderer.zoomAt(1/1.3);
$('view').onclick=()=>renderer.topView();$('home').onclick=()=>renderer.center();$('night').onclick=()=>renderer.night=!renderer.night;
$('panel').onclick=()=>{$('results').hidden=!$('results').hidden;$('panel').textContent=$('results').hidden?'Mở số liệu':'Thu gọn';};
let pointer=null;$('world').onpointerdown=e=>{pointer=[e.clientX,e.clientY];$('world').setPointerCapture(e.pointerId);};$('world').onpointermove=e=>{if(pointer){renderer.panBy(e.clientX-pointer[0],e.clientY-pointer[1]);pointer=[e.clientX,e.clientY];}};$('world').onpointerup=()=>pointer=null;$('world').onwheel=e=>{e.preventDefault();renderer.zoomAt(e.deltaY<0?1.08:1/1.08,e.clientX,e.clientY);};
window.addEventListener('resize',()=>renderer.resize());document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden&&sample.running){sample.running=false;enableControls();$('status').textContent='Mẫu bị gián đoạn do tab ẩn; hãy đo lại.';}});
function frame(now){requestAnimationFrame(frame);if(now<last)return;const dt=Math.max(0,(now-last)/1000);last=now;if(document.hidden)return;if(sample.running){pending+=simulationDelta(dt,city.playback);pending=consumeSteps(pending,()=>{const start=performance.now();stepSimulation(city);sample.tick(performance.now()-start);},120).remaining;renderer.renderAlpha=Math.min(1,pending);if(now-sample.started>=30000){sample.running=false;output();$('status').textContent='Đã đo xong 30 giây';enableControls();}}}
requestAnimationFrame(frame);
if(document.modelContext){document.modelContext.registerTool({name:'read_benchmark',description:'Read the visible measured performance report from this isolated benchmark page.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({status:$('status').textContent,report})});}
