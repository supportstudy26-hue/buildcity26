import {startJourney} from './citizens.js';
import {route} from './roads.js';
import {position,index} from './world.js';
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
export function reconcileSociety(s,size,rng,{arriving=false}={}) {
  initializeWorld(s,size);
  const source={seed:s.societySeed};
  const added=reconcileHouseholds(s,size,()=>rng(source));s.societySeed=source.seed;
  reconcileFirms(s);reconcileVehicles(s);
  if(arriving){const entry=s.world?.geography?.entryTile??index(0,18);for(const c of added){if(!s.tiles[c.home].connected)continue;c.goal=entry;c.position=position(entry,size,s);startJourney(s,c,c.home,route,size,false);if(c.journey){c.journey.purpose='move-in';if(c.missionTrip)c.missionTrip.purpose='move-in';}}}
  updateVehicles(s);
}
