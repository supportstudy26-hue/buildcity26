import { RULE_VERSION } from '../../config/simulation.js';
import { createClock } from './clock.js';
import { initializeWorld } from './world.js';
import { reconcileHouseholds } from './households.js';
import { reconcileFirms } from './firms.js';
import { reconcileVehicles, updateVehicles } from './vehicles.js';
export function initializeFoundation(s,size,rng) {
  s.ruleVersion=RULE_VERSION;s.clock??=createClock(s.day);s.graphVersion??=0;
  s.initialSeed??=s.seed;s.societySeed??=(s.initialSeed^0x26bc1234)>>>0;
  s.nextEntityId??=1;s.nextEventId??=1;s.events??=[];
  s.households??=[];s.citizens??=[];s.firms??=[];s.vehicles??=[];s.contracts??=[];
  s.commandSequence??=0;s.commandReceipts??=[];
  s.ledger??={openingCash:s.money,entries:[],receipts:[]};
  initializeWorld(s,size);reconcileSociety(s,size,rng);
}
export function reconcileSociety(s,size,rng) {
  const source={seed:s.societySeed};
  reconcileHouseholds(s,size,()=>rng(source));s.societySeed=source.seed;
  reconcileFirms(s);reconcileVehicles(s);updateVehicles(s);
}
