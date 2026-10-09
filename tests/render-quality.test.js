import test from 'node:test';
import assert from 'node:assert/strict';
import {AutoQuality,detailVisible,PROFILES,frameDue} from '../src/game/render/quality.js';
test('automatic quality uses a sustained window and cooldown, manual profiles cap retina resolution',()=>{const a=new AutoQuality(false);assert.equal(a.level,'medium');for(let n=0;n<180;n++)a.sample(70,n*50);assert.equal(a.level,'medium');for(let n=180;n<400;n++)a.sample(70,n*50);assert.equal(a.level,'low');for(let n=400;n<800;n++)a.sample(33,n*50);assert.equal(a.level,'low');for(let n=800;n<1300;n++)a.sample(33,n*50);assert.equal(a.level,'medium');assert.equal(new AutoQuality(true).level,'low');assert.ok(PROFILES.high.dpr<=2);});
test('LOD hysteresis preserves details near the boundary and selecting prioritizes them',()=>{assert.equal(detailVisible(true,180,160),true);assert.equal(detailVisible(false,150,160),false);assert.equal(detailVisible(false,100,160),true);assert.equal(detailVisible(true,210,160),false);assert.equal(detailVisible(false,3000,160,true),true);});

test('frame cap accepts normal fractional rAF jitter without halving 60Hz drawing',()=>{assert.equal(frameDue(0,undefined,60),true);for(const delta of [16.3,16.6,16.7,17])assert.equal(frameDue(100+delta,100,60),true);assert.equal(frameDue(108,100,60),false);assert.equal(frameDue(133.1,100,30),true);assert.equal(frameDue(116.7,100,30),false);});
