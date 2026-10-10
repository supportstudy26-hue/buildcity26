import {createProgression,updateProgression} from './progression.js';
import { RULE_VERSION } from '../../config/simulation.js';
import { createClock,createPlayback } from './clock.js';
import { initializeWorld } from './world.js';
import { reconcileHouseholds } from './households.js';
import { reconcileFirms } from './firms.js';
import { reconcileVehicles, updateVehicles } from './vehicles.js';
export function initializeFoundation(s,size,rng) {
  s.mobilityVersion??=1;s.playback??=createPlayback();s.progression??=createProgression();s.ruleVersion=RULE_VERSION;s.clock??=createClock(s.day);s.graphVersion??=0;
  s.initialSeed??=s.seed;s.societySeed??=(s.initialSeed^0x26bc1234)>>>0;
  s.nextEntityId??=1;s.nextEventId??=1;s.events??=[];
  s.households??=[];s.citizens??=[];s.firms??=[];s.vehicles??=[];s.contracts??=[];
  s.commandSequence??=0;s.commandReceipts??=[];
  s.ledger??={openingCash:s.money,entries:[],receipts:[]};
  initializeWorld(s,size);reconcileSociety(s,size,rng);updateProgression(s,true);
}
export function reconcileSociety(s,size,rng) {
  initializeWorld(s,size);
  const source={seed:s.societySeed};
  reconcileHouseholds(s,size,()=>rng(source));s.societySeed=source.seed;
  reconcileFirms(s);reconcileVehicles(s);updateVehicles(s);
}
