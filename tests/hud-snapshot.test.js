import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeHudSnapshot,HUD_CATALOGUE,normalizeSearch} from '../src/ui/hud-snapshot.js';
import {createEmptyCity,createCity,serialize,place,index,analyze} from '../src/game/core.js';
import {LANDMARKS} from '../src/config/landmarks.js';
test('empty city HUD preserves unknown coverage, real BC conversion and zero population rather than sample data',()=>{
 const s=createEmptyCity(),before=serialize(s),h=makeHudSnapshot(s);
 assert.equal(h.money,10000000000);assert.equal(h.population,0);assert.equal(h.electricity.coveragePct,undefined);assert.equal(h.water.coveragePct,undefined);assert.equal(h.electricity.capacity,0);assert.equal(h.paused,s.playback.paused);assert.match(h.moneyUnit,/game/);assert.equal(h.populationDelta,undefined);assert.deepEqual(serialize(s),before);
});
test('HUD counters match actual supply, households, alert positions and all buildable catalogue IDs',()=>{
 const s=createCity(),h=makeHudSnapshot(s);assert.equal(h.population,s.citizens.length);assert.equal(h.housingCapacity,s.metrics.homes);assert.equal(h.income,(s.metrics.taxIncome+s.metrics.transitIncome)*1000);assert.equal(h.electricity.demand,s.metrics.powerNeed);assert.equal(new Set(HUD_CATALOGUE.map(x=>x.id)).size,HUD_CATALOGUE.length);assert.ok(HUD_CATALOGUE.some(e=>e.id==='roadOneWay'));assert.ok(HUD_CATALOGUE.some(e=>e.id==='clockTower'));assert.equal(normalizeSearch('Đường Hàng Cây'),'duong hang cay');
 const pack=JSON.parse(readFileSync(new URL('../src/ui/refresh/icons.json',import.meta.url)));assert.equal(pack.length,48);
});
test('multiple decorations give the largest amenity only and cannot become electricity, water or park service sources',()=>{
 const s=createEmptyCity();for(let x=0;x<14;x++)place(s,x,18,'road');place(s,4,17,'power');place(s,5,17,'water');place(s,7,17,'residential');place(s,6,17,'cityTower');place(s,8,17,'clockTower');place(s,8,19,'observationTower');analyze(s);
 const home=s.tiles[index(7,17)];assert.equal(home.landscapeBonus,6);assert.ok(home.services.every(k=>!LANDMARKS[k]));assert.equal(s.metrics.power,500);assert.equal(s.metrics.water,75);
 const before=s.metrics.expenses;assert.ok(place(s,6,19,'cityTower').ok);assert.equal(home.landscapeBonus,6);assert.ok(s.metrics.expenses>before);
});
