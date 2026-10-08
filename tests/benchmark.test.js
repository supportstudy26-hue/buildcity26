import test from 'node:test';
import assert from 'node:assert/strict';
import {benchmarkCity} from '../src/benchmark/scenario.js';
import {PerformanceSample} from '../src/benchmark/metrics.js';
import {serialize,validateSave} from '../src/game/core.js';
test('isolated dense fixtures have exact populations, real employers, vehicles and routes',()=>{for(const n of [300,1000,5000,10000]){const s=benchmarkCity(n);assert.equal(s.citizens.length,n);assert.equal(s.metrics.population,n);assert.ok(s.citizens.some(c=>c.journey));assert.ok(s.firms.some(f=>f.employees.length));assert.ok(s.vehicles.some(v=>v.passengers.length));assert.equal(new Set(s.citizens.map(c=>c.id)).size,n);assert.ok(s.citizens.every(c=>!c.journey||c.journey.path.length>=2));if(n===300)assert.deepEqual(serialize(validateSave(serialize(s))),serialize(s));}});
test('frame statistics measure rendered frames, retain p95 and bounded samples',()=>{const p=new PerformanceSample();p.start(0);for(let i=0;i<=100;i++)p.frame(i*20);for(const n of [1,2,3,10])p.tick(n);const r=p.report(2000);assert.equal(r.medianFps,50);assert.equal(r.p95FrameMs,20);assert.equal(r.elapsedSeconds,2);assert.equal(r.workerTickMs,null);p.running=false;p.frame(10000);assert.equal(p.frames.length,100);});
