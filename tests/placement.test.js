import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createEmptyCity,createCity,place,index,SIZE,serialize,validateSave} from '../src/game/core.js';
import {placementQuote} from '../src/game/systems/placement.js';
import {placementGhost} from '../src/game/render/build-ghost.js';
import {createVietnamCity,geographyBuildRule} from '../src/game/geography/city.js';
import {startUpgrade,updateUpgrades} from '../src/game/systems/upgrades.js';
import {slopeAt} from '../src/game/systems/terrain.js';

const hover=i=>({i,x:i%SIZE,y:Math.floor(i/SIZE)});
function execute(s,i,kind){const p=hover(i);return place(s,p.x,p.y,kind);}
test('land, bridge and road widening quotes equal the charged amount, including saved bridge upgrades',()=>{
 const s=createEmptyCity(),land=index(0,18),water=s.tiles.findIndex(t=>t.terrain==='water');
 for(const [i,kind,expected] of [[land,'road',14000],[land,'avenue',11400],[water,'road',134000]]){
  const before=s.money,q=placementQuote(s,i,kind);assert.equal(q.ok,true);assert.equal(q.cost,expected);assert.equal(execute(s,i,kind).cost,q.cost);assert.equal(before-s.money,q.cost);
 }
 const copy=validateSave(JSON.parse(JSON.stringify(serialize(s)))),q=placementQuote(copy,water,'avenue');
 assert.equal(q.cost,42000);assert.equal(execute(copy,water,'avenue').cost,q.cost);
});
test('insufficient funds, occupied parcels and procedural water reject both ghost and command without mutation',()=>{
 const s=createEmptyCity(),i=index(0,18);s.money=13999;s.ledger.openingCash=s.money;
 const before=serialize(s),q=placementQuote(s,i,'road');assert.equal(q.ok,false);assert.equal(q.shortfall,1);assert.equal(placementGhost(s,hover(i),'road').valid,false);
 assert.equal(execute(s,i,'road').message,q.message);assert.deepEqual(serialize(s),before);
 s.money=14000;s.ledger.openingCash=s.money;assert.equal(placementGhost(s,hover(i),'road').valid,true);assert.equal(execute(s,i,'road').ok,true);
 for(const [tile,kind] of [[i,'residential'],[s.tiles.findIndex(t=>t.terrain==='water'),'smallWater']]){
  const before=serialize(s),q=placementQuote(s,tile,kind);assert.equal(q.ok,false);assert.equal(placementGhost(s,hover(tile),kind).valid,false);assert.equal(execute(s,tile,kind).message,q.message);assert.deepEqual(serialize(s),before);
 }
 assert.equal(placementQuote(s,i,'bulldoze').refund,3500);
 assert.equal(placementQuote(s,-1,'road').ok,false);assert.equal(placementQuote(s,0,'unknown').ok,false);
});
test('geographic slope, outside-province and terrain-adjusted prices share the same quote',async()=>{
 const root=new URL('../public/geodata/vn-20261008/',import.meta.url),load=async f=>JSON.parse(await readFile(new URL(f,root)));
 const s=createVietnamCity(await load('22-start.json'),await load('manifest.json'));
 const steep=s.tiles.findIndex((t,i)=>!t.kind&&s.world.geography.insideProvince[i]&&slopeAt(s.world,i,SIZE)>20);
 assert.ok(steep>=0);assert.equal(placementQuote(s,steep,'road').ok,false);assert.equal(placementGhost(s,hover(steep),'road').valid,false);
 // This coastal package is entirely inside the province; exercise a boundary-mask cell explicitly.
 const outside=0,original=s.world.geography.insideProvince[outside];s.world.geography.insideProvince[outside]=0;
 assert.equal(execute(s,outside,'road').message,placementQuote(s,outside,'road').message);assert.equal(placementGhost(s,hover(outside),'road').valid,false);s.world.geography.insideProvince[outside]=original;
 const land=s.tiles.findIndex((t,i)=>!t.kind&&t.terrain!=='water'&&geographyBuildRule(s,i,'road').ok&&slopeAt(s.world,i,SIZE)>0);
 assert.ok(land>=0);const before=serialize(s),q=placementQuote(s,land,'road');assert.ok(q.cost>14000);assert.deepEqual(serialize(s),before);assert.equal(execute(s,land,'road').cost,q.cost);
});
test('demolition shows the actual city refund including unused public upgrade capital, excluding owner capital',()=>{
 const s=createCity(),i=index(8,17);assert.equal(startUpgrade(s,i,'city').ok,true);for(let n=0;n<90;n++)updateUpgrades(s);
 const before=s.money,q=placementQuote(s,i,'bulldoze');assert.ok(q.cancellation>0);assert.equal(execute(s,i,'bulldoze').ok,true);assert.equal(s.money-before,q.refund);
 const owner=createCity(),j=index(12,17);assert.equal(place(owner,10,17,'waste').ok,true);assert.equal(place(owner,10,19,'park').ok,true);
 assert.equal(startUpgrade(owner,j,'owner').ok,true);const cash=owner.money,privateFunds=owner.privateInvestment.available,ownerQuote=placementQuote(owner,j,'bulldoze');
 assert.equal(ownerQuote.cancellation,0);assert.equal(execute(owner,j,'bulldoze').ok,true);assert.equal(owner.money-cash,ownerQuote.refund);assert.ok(owner.privateInvestment.available>privateFunds);
});
