import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyCity,place,analyze,index,serialize,validateSave,route,executeCommand,random} from '../src/game/core.js';
import {createTerrain,surfaceHeight} from '../src/game/systems/terrain.js';
import {placementQuote} from '../src/game/systems/placement.js';
import {roadConnectionAllowed,remainingRouteValid} from '../src/game/systems/road-network.js';
import {mobilityPath} from '../src/game/systems/mobility-path.js';
import {roadControllers} from '../src/game/systems/road-controller.js';
import {startJourney,updateCitizens} from '../src/game/systems/citizens.js';
import {calendar} from '../src/game/systems/clock.js';
import {isJunction} from '../src/game/systems/junctions.js';
import {roadParts,chunkParts} from '../src/game/render/scene-data.js';
import {pierParts} from '../src/game/render/infrastructure-parts.js';
import {roadProfile} from '../src/config/road-profiles.js';
globalThis.IntersectionObserver=class {observe(){}unobserve(){}};
const {buildingPreview}=await import('../src/ui/build-card.js');
import {reconcileSociety} from '../src/game/systems/foundation.js';
import {HUD_CATALOGUE} from '../src/ui/hud-snapshot.js';
const city=()=>createEmptyCity({world:createTerrain(64,{flat:true}),startingCash:10000000});
function build(s,x,y,k){const q=placementQuote(s,index(x,y),k),before=s.money,r=place(s,x,y,k);assert.ok(r.ok,r.message);assert.equal(before-s.money,q.cost);return s.tiles[index(x,y)];}
function circleCity(kind='roundabout'){const s=city();for(let x=0;x<=10;x++)build(s,x,18,'road');build(s,6,18,kind);for(let y=15;y<=21;y++)if(y!==18)build(s,6,y,'road');return s;}
const cmd=(s,type,payload)=>executeCommand(s,{id:'infra-'+(s.commandSequence+1),sequence:s.commandSequence+1,type,payload});
test('pier is solid but not driveable; deck charges remaining capital once and retains identity across saves',()=>{
 const s=city(),t=build(s,5,18,'bridgePier'),id=t.assetId,paid=t.historicalCost,quote=placementQuote(s,index(5,18),'highwayViaduct');assert.equal(s.metrics.powerNeed,0);assert.equal(s.metrics.waterNeed,0);assert.equal(roadProfile(t),undefined);assert.equal(quote.cost,176000-paid);
 const loaded=validateSave(serialize(s)),before=loaded.money,r=cmd(loaded,'place',{x:5,y:18,kind:'highwayViaduct'});assert.ok(r.ok);assert.equal(before-loaded.money,quote.cost);assert.equal(loaded.tiles[index(5,18)].assetId,id);assert.equal(loaded.tiles[index(5,18)].historicalCost,176000);assert.equal(placementQuote(loaded,index(5,18),'highwayViaduct').ok,false);
 const cash=loaded.money;assert.ok(cmd(loaded,'place',{x:5,y:18,kind:'bulldoze'}).ok);assert.equal(loaded.money-cash,44000);assert.equal(s.tiles[index(5,18)].kind,'bridgePier');
});
test('water piers and decks save/load; water roundabouts and ramps are rejected before charging',()=>{
 const s=city(),i=index(30,18);s.tiles[i].terrain='water';build(s,30,18,'bridgePier');build(s,30,18,'highwayViaduct');assert.ok(surfaceHeight(s,i,64)>=6);assert.deepEqual(serialize(validateSave(serialize(s))),serialize(s));
 for(const kind of ['roundabout','roundabout2','highwayRamp','viaductRamp']){const before=s.money;s.tiles[index(31,18)].terrain='water';assert.equal(place(s,31,18,kind).ok,false);assert.equal(s.money,before);}
 const bad=serialize(s);bad.tiles[i].kind='roundabout';assert.throws(()=>validateSave(bad),/Vòng xuyến/);
});
test('motorways need ramps, forbid walking/frontage and elevated links require the 3 m intermediate deck',()=>{
 const s=city();for(let x=0;x<=3;x++)build(s,x,18,'road');build(s,4,18,'highway2');assert.equal(s.tiles[index(4,18)].connected,false);build(s,3,18,'highwayRamp');assert.equal(s.tiles[index(4,18)].connected,true);build(s,4,17,'residential');assert.equal(s.tiles[index(4,17)].connected,false);
 build(s,5,18,'highwayViaduct');assert.equal(roadConnectionAllowed(s,index(4,18),index(5,18)),false);assert.equal(route(s,index(0,18),index(5,18)).length,0);build(s,4,18,'viaductRamp');assert.equal(s.tiles[index(5,18)].connected,true);assert.equal(route(s,index(0,18),index(5,18)).length,6);assert.equal(route(s,index(5,18),index(0,18)).length,0);assert.equal(route(s,index(0,18),index(5,18),'walk').length,0);
 const path=mobilityPath(s,index(0,18),index(5,18),route(s,index(0,18),index(5,18)),64,'car');assert.ok(path.some(p=>p.z===3));assert.ok(path.some(p=>p.z===6));assert.ok(remainingRouteValid(s,path,'car'));const loaded=validateSave(serialize(s));assert.deepEqual(route(loaded,index(0,18),index(5,18)),route(s,index(0,18),index(5,18)));
 build(loaded,4,18,'bulldoze');assert.equal(route(loaded,index(0,18),index(5,18)).length,0);
});
test('every roundabout entry/exit route follows the actual ring without cutting the island',()=>{
 for(const kind of ['roundabout','roundabout2']){const s=circleCity(kind),i=index(6,18),p=roadProfile(kind);assert.equal(isJunction(s,i),false);
  const endpoints=[index(4,18),index(8,18),index(6,16),index(6,20)];for(const from of endpoints)for(const to of endpoints)if(from!==to){const path=mobilityPath(s,from,to,route(s,from,to),64,'car'),arc=path.filter(p=>p.road===i);assert.ok(arc.length>=5);assert.equal(arc.filter(p=>p.roundaboutEntry).length,1);for(let n=0;n<arc.length;n++){assert.ok(Math.hypot(arc[n].x-130,arc[n].y-370)>p.circle.island+.5);if(n)assert.ok(Math.hypot((arc[n].x+arc[n-1].x)/2-130,(arc[n].y+arc[n-1].y)/2-370)>p.circle.island+.5);}assert.ok(remainingRouteValid(s,path,'car'));}
 }
});
test('incoming car yields to a real car within the circle and resumes once it clears',()=>{
 const s=circleCity(),i=index(6,18),path=mobilityPath(s,index(4,18),index(8,18),route(s,index(4,18),index(8,18)),64,'car'),entry=path.findIndex(p=>p.roundaboutEntry),target=path[entry];
 const a={id:'yield-car',position:{x:target.x-1,y:target.y,z:0},state:'in-vehicle',journey:{mode:'car',speed:10,path,segment:entry-1}},b={id:'circle-car',position:{x:130,y:376.7,z:0},state:'in-vehicle',journey:{mode:'car',speed:5,path:[{x:130,y:376.7,z:0,road:i},{x:131,y:376.6,z:0,road:i}],segment:0}};s.citizens=[a,b];const stopped=roadControllers(s)(a);assert.match(stopped.reason,/vòng xuyến/);assert.ok(stopped.speed<.3);s.citizens=[a];assert.equal(roadControllers(s)(a).reason,'');
});
test('live car completes the circular journey, and saved in-flight path retains arcs and exact progress',()=>{
 const s=circleCity();build(s,4,17,'residential');build(s,8,17,'commercial');const home=index(4,17),destination=index(8,17);s.tiles[home].residents=1;analyze(s);reconcileSociety(s,64,random);
 const c=s.citizens[0];assert.ok(c);c.goal=home;c.state='home';c.vehicle='vehicle-test';s.vehicles.push({id:c.vehicle,owner:c.id,kind:'car',state:'parked',position:{...c.position},passengers:[],goal:home,speed:0});c.journey=null;startJourney(s,c,destination,route,64,false);assert.equal(c.journey.mode,'car');assert.ok(c.journey.path.some(p=>p.roundaboutEntry));
 updateCitizens(s,calendar(s.clock.seconds),route,64);const saved=serialize(s),loaded=validateSave(saved);assert.deepEqual(serialize(loaded),saved);assert.deepEqual(loaded.citizens[0].journey.path,c.journey.path);
 for(let n=0;n<120&&c.journey;n++){s.clock.seconds++;updateCitizens(s,calendar(s.clock.seconds),route,64);}assert.equal(c.goal,destination);assert.equal(c.journey,null);assert.equal(c.state,'at-work');assert.ok(c.travelled>80);
});
test('legacy linear circle and ground-to-raised saved routes are invalidated for replanning',()=>{
 const s=circleCity(),i=index(6,18);assert.equal(remainingRouteValid(s,[{x:130,y:372.5,z:0,road:i}],'car'),false);build(s,8,18,'highwayViaduct');assert.equal(remainingRouteValid(s,[{x:170,y:372.5,z:0,road:index(8,18)}],'car'),false);
});
test('catalogue, ghosts and instanced map meshes use distinct finite solid geometry with no carriageway through island centre',()=>{
 const s=circleCity(),shapes=new Set();for(const k of ['highway2','highwayViaduct','highwayRamp','viaductRamp','roundabout','roundabout2','bridgePier']){assert.ok(HUD_CATALOGUE.some(p=>p.kind===k&&p.cost>0&&p.maintenance>0));assert.ok(buildingPreview(k).includes('<polygon'));shapes.add(buildingPreview(k));}
 assert.equal(shapes.size,7);const circle=roadParts(s,6,18);assert.ok(circle.some(p=>p.role==='circle-island'));assert.ok(circle.some(p=>p.role==='circle-carriageway'&&p.shape==='roadRing1'));build(s,9,19,'bridgePier');const meshes=chunkParts(s,0,16);assert.ok(meshes.some(p=>p.role==='pier-cap'));assert.ok(meshes.every(p=>p.scale.every(n=>Number.isFinite(n)&&n>0)&&p.position.every(Number.isFinite)));assert.ok(pierParts(0,0,0).some(p=>p.position[1]>5));
});

test('shared annulus geometry leaves the island hole empty and has upward-facing surfaces',async()=>{
 const T=await import('three'),{roadRingGeometry}=await import('../src/game/render/road-ring.js');
 for(const k of ['roundabout','roundabout2']){const {island,outer}=roadProfile(k).circle,g=roadRingGeometry(T,island,outer),p=g.getAttribute('position'),n=g.getAttribute('normal');for(let i=0;i<p.count;i++){assert.ok(Math.hypot(p.getX(i),p.getZ(i))>=island/outer*.5-1e-7);assert.ok(n.getY(i)>.99);}g.dispose();}
});
