import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createEmptyCity,place,index,SIZE,serialize,validateSave,stepSimulation,analyze,route} from '../src/game/core.js';
import {cityEntry,entryConnectionPlan,entryPlanUnchanged} from '../src/game/systems/city-entry.js';
import {arrivalReady,populationStatus} from '../src/game/systems/resident-arrivals.js';
import {createVietnamCity,geographyBuildRule} from '../src/game/geography/city.js';
import {placementQuote} from '../src/game/systems/placement.js';
import {slopeAt} from '../src/game/systems/terrain.js';
import {roadParts,chunkParts} from '../src/game/render/scene-data.js';
import {entryParts} from '../src/game/render/entry-marker.js';
import {makeHudSnapshot} from '../src/ui/hud-snapshot.js';
const load=async f=>JSON.parse(await readFile(new URL('../public/geodata/vn-20261008/'+f,import.meta.url)));
const build=(s,i,k)=>place(s,i%SIZE,Math.floor(i/SIZE),k);
function isolated(){const s=createEmptyCity();for(let x=3;x<=7;x++)assert.ok(place(s,x,18,'road').ok);assert.ok(place(s,5,19,'residential').ok);return s;}

test('connection preview finds the real gate, preserves existing assets and charges only missing links',()=>{
 const s=isolated(),home=index(5,19),before=serialize(s),plan=entryConnectionPlan(s,home);
 assert.deepEqual(serialize(s),before);assert.equal(plan.ok,true);assert.equal(plan.entry,index(0,18));assert.deepEqual(plan.tiles,[index(0,18),index(1,18),index(2,18)]);assert.equal(plan.cost,42000);assert.equal(entryPlanUnchanged(s,plan),true);
 const ids=s.tiles.slice(index(3,18),index(7,18)+1).map(t=>t.assetId),cash=s.money;
 for(const i of plan.tiles)assert.equal(build(s,i,'road').ok,true);
 assert.equal(cash-s.money,plan.cost);assert.deepEqual(s.tiles.slice(index(3,18),index(7,18)+1).map(t=>t.assetId),ids);assert.equal(s.tiles[home].connected,true);assert.equal(entryPlanUnchanged(s,plan),false);assert.equal(entryConnectionPlan(s,home).ok,false);
});
test('zero residents become real arrivals after gate connection and three starter utilities; reload keeps their journey',()=>{
 const s=isolated(),home=index(5,19);let hud=makeHudSnapshot(s);assert.equal(hud.electricity.coveragePct,0);assert.equal(hud.water.coveragePct,0);
 for(const [x,k] of [[4,'smallPower'],[5,'smallWater'],[6,'smallSewage']])assert.ok(place(s,x,17,k).ok);
 for(let n=0;n<60;n++)stepSimulation(s);assert.equal(s.citizens.length,0);assert.match(populationStatus(s).label,/cổng/);
 const plan=entryConnectionPlan(s,home);for(const i of plan.tiles)assert.ok(build(s,i,'road').ok);assert.equal(arrivalReady(s.tiles[home]),true);
 hud=makeHudSnapshot(s);assert.equal(hud.electricity.coveragePct,100);assert.equal(hud.water.coveragePct,100);
 for(let n=0;n<60;n++)stepSimulation(s);assert.equal(s.citizens.length,1);assert.equal(s.citizens[0].journey.origin,cityEntry(s));assert.equal(s.citizens[0].journey.purpose,'move-in');
 const copy=validateSave(JSON.parse(JSON.stringify(serialize(s))));assert.deepEqual(copy.citizens,s.citizens);assert.equal(copy.money,s.money);assert.equal(copy.tiles[home].connected,true);
});
test('job shortages name the actual next step, and a working shop permits more residents',()=>{
 const s=isolated(),home=index(5,19),plan=entryConnectionPlan(s,home);for(const i of plan.tiles)assert.ok(build(s,i,'road').ok);
 for(const [x,k] of [[4,'smallPower'],[5,'smallWater'],[6,'smallSewage']])assert.ok(place(s,x,17,k).ok);
 for(let n=0;n<180;n++)stepSimulation(s);assert.ok(s.citizens.length>0);assert.equal(populationStatus(s).needsJobs,true);assert.match(populationStatus(s).label,/việc làm/);
 const before=s.citizens.length;assert.ok(place(s,7,17,'commercial').ok);assert.ok(s.metrics.jobs>0);for(let n=0;n<60;n++)stepSimulation(s);assert.ok(s.citizens.length>before);assert.equal(populationStatus(s).needsJobs,undefined);
});
test('occupied gate, stale plans and insufficient funds never silently replace buildings or change cash',()=>{
 const s=isolated(),home=index(5,19),plan=entryConnectionPlan(s,home);s.money=plan.cost-1;assert.equal(entryConnectionPlan(s,home).affordable,false);assert.equal(entryPlanUnchanged(s,plan),false);
 s.money=1000000;assert.ok(build(s,cityEntry(s),'residential').ok);const before=serialize(s);assert.equal(entryConnectionPlan(s,home).ok,false);assert.deepEqual(serialize(s),before);
});
test('mountain roads build, upgrade, route and save on real DEM slopes above 20%; buildings keep their slope restriction',async()=>{
 const s=createVietnamCity(await load('04-start.json'),await load('manifest.json'));
 const steep=s.tiles.findIndex((t,i)=>!t.kind&&t.terrain!=='water'&&slopeAt(s.world,i,SIZE)>30&&geographyBuildRule(s,i,'road').ok);assert.ok(steep>=0);
 const q=placementQuote(s,steep,'road');assert.ok(q.cost>14000);assert.ok(build(s,steep,'road').ok);assert.equal(geographyBuildRule(s,steep,'residential').ok,false);
 const uq=placementQuote(s,steep,'avenue');const cash=s.money;assert.equal(build(s,steep,'avenue').cost,uq.cost);assert.equal(cash-s.money,uq.cost);
 // Isolate routing on this real DEM hill with a local entrance fixture.
 const next=[steep+1,steep-1,steep+SIZE,steep-SIZE].find(i=>i>=0&&i<s.tiles.length&&Math.abs(i%SIZE-steep%SIZE)+Math.abs(Math.floor(i/SIZE)-Math.floor(steep/SIZE))===1&&placementQuote(s,i,'road').ok);
 assert.notEqual(next,undefined);s.world.geography.entryTile=steep;assert.ok(build(s,next,'road').ok);analyze(s);assert.deepEqual(route(s,steep,next,'car'),[steep,next]);assert.deepEqual(route(s,steep,next,'walk'),[steep,next]);
 const outside=0;s.world.geography.insideProvince[outside]=0;assert.equal(placementQuote(s,outside,'road').ok,false);s.world.geography.insideProvince[outside]=1;
 const copy=validateSave(JSON.parse(JSON.stringify(serialize(s))));assert.equal(copy.tiles[steep].kind,'avenue');assert.deepEqual(copy.world,s.world);assert.equal(copy.money,s.money);
 assert.deepEqual(route(copy,steep,next,'car'),[steep,next]);
 const parts=roadParts(s,steep%SIZE,Math.floor(steep/SIZE));assert.ok(parts.some(p=>p.color==='#899b91'));assert.ok(parts.every(p=>p.scale.every(v=>v>0&&Number.isFinite(v))));
});
test('Hanoi uses its interior gate rather than another map edge and the marker follows the exact saved tile',async()=>{
 const s=createVietnamCity(await load('01-start.json'),await load('manifest.json')),entry=cityEntry(s);assert.equal(entry,index(11,22));
 // Remove only this test fixture's initial connector, then place an isolated home nearby.
 for(let dx=0;dx<4;dx++)assert.ok(build(s,entry+dx,'bulldoze').ok);
 const home=index(15,23);assert.ok(build(s,home,'residential').ok);assert.ok(build(s,index(15,22),'road').ok);assert.equal(s.tiles[home].connected,false);
 const plan=entryConnectionPlan(s,home);assert.equal(plan.entry,entry);for(const i of plan.tiles)assert.ok(build(s,i,'road').ok);assert.equal(s.tiles[home].connected,true);
 const marker=entryParts(s);assert.ok(marker.every(p=>p.tile===entry));assert.ok(chunkParts(s,0,16).some(p=>p.tile===entry&&p.shape==='cylinder'&&!p.detail));
});
