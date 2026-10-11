import test from 'node:test';
import assert from 'node:assert/strict';
import {MISSIONS,CAP_XP,levelFromXp} from '../src/config/progression.js';
import {metricKey,leaves,metricSupport} from '../src/game/systems/mission-metrics.js';
import {evaluateCondition} from '../src/game/systems/campaign.js';
import {auditPrerequisites,auditProgression,auditUnlocks,buildMissionAudit,providerConditionSupported,renderMarkdown} from '../scripts/audit-missions.mjs';

test('audit reads exactly every catalogue ID, target, scope, filter, reward and prerequisite without rewriting them',()=>{
 const a=buildMissionAudit({generatedAt:'test'});
 assert.equal(a.missions.length,300);assert.deepEqual(a.missions.map(m=>m.id),MISSIONS.map(m=>m.id));
 for(const [i,m] of a.missions.entries()){
  assert.deepEqual(m.condition,MISSIONS[i].condition);assert.deepEqual(m.rewards,MISSIONS[i].rewards);assert.deepEqual(m.prerequisiteClaims,MISSIONS[i].prerequisiteClaims);
  const nodes=leaves(MISSIONS[i].condition);assert.equal(m.metrics.length,nodes.length);
  for(const [j,n] of m.metrics.entries()){
   assert.equal(n.key,metricKey(nodes[j]));assert.equal(n.target,nodes[j].target);assert.equal(n.scope,nodes[j].scope);assert.deepEqual(n.filters,nodes[j].filters);
   assert.equal(n.supported,metricSupport(nodes[j]));assert.equal(typeof n.fixture.empty.valid,'boolean');assert.equal(typeof n.fixture.starter.valid,'boolean');
   if(!n.supported){assert.ok(n.missing);assert.equal(n.fixture.empty.valid,false);assert.equal(n.fixture.starter.valid,false);}
  }
 }
 assert.equal(a.summary.providerSupported+a.summary.missingProvider,300);
 assert.equal(a.summary.providerSupported,a.missions.filter(m=>evaluateCondition(m.condition,()=>({valid:false})).supported).length);
 assert.equal(a.summary.fixtureAvailabilityAgreement,true);
 assert.deepEqual(a.blockedMissionIds,a.missions.filter(m=>!m.providerSupported).map(m=>m.id));
 assert.ok(a.sourceManifest.some(m=>m.file==='src/config/missions/missions-300.json'&&/^[a-f0-9]{64}$/.test(m.sha256)));
 assert.equal((renderMarkdown(a).match(/\| `bc26-main-\d{3}-[abc]` ·/g)||[]).length,300);
});

test('provider support follows ALL/ANY semantics, including supported alternative and unsupported zero-demand lte',()=>{
 const supplied={metric:'treasury',scope:'snapshot',filters:{},operator:'gte',target:1};
 const missing={metric:'not_a_real_metric',scope:'snapshot',filters:{},operator:'lte',target:100};
 assert.equal(providerConditionSupported({all:[supplied,missing]}),false);
 assert.equal(providerConditionSupported({any:[missing,supplied]}),true);
 assert.equal(providerConditionSupported({all:[{any:[missing,supplied]},supplied]}),true);
 assert.equal(providerConditionSupported({all:[]}),false);assert.equal(providerConditionSupported({any:[]}),false);
});

test('all 100 stage gates and 297 rewards reach level 100 exactly; epilogue adds lifetime XP without 101',()=>{
 const p=auditProgression();assert.deepEqual(p.errors,[]);assert.equal(p.passed,true);assert.equal(p.first297Xp,CAP_XP);assert.equal(p.first297Xp,4_230_468);assert.equal(p.levelAfter297,100);assert.equal(p.epilogueXp,125_732);assert.equal(p.lifetimeXpAfter300,4_356_200);assert.equal(p.levelAfter300,100);
 for(const stage of p.stages){assert.equal(stage.levelBefore,stage.stage);if(stage.stage<100){assert.equal(stage.xpAfter,stage.nextLevelXp);assert.equal(stage.levelAfter,stage.stage+1);}}
 for(const m of MISSIONS){assert.ok(m.prerequisiteClaims.every(id=>MISSIONS.some(p=>p.id===id)));assert.ok(m.rewards.xp>=0);}
 assert.equal(levelFromXp(p.lifetimeXpAfter300),100);
 const broken=structuredClone(MISSIONS);broken[0].rewards.xp++;
 assert.equal(auditProgression(broken).passed,false);
});

test('prerequisite checker detects orphan and real cycles instead of merely checking array order',()=>{
 assert.equal(auditPrerequisites().acyclic,true);assert.deepEqual(auditPrerequisites().missingIds,[]);
 const input=[{id:'a',prerequisiteClaims:['c']},{id:'b',prerequisiteClaims:['a']},{id:'c',prerequisiteClaims:['b','missing']}];
 const bad=auditPrerequisites(input);assert.equal(bad.acyclic,false);assert.deepEqual(bad.cycles,[['a','c','b','a']]);assert.deepEqual(bad.missingIds,[{id:'c',prerequisite:'missing'}]);
});

test('audit propagates missing prerequisite barriers and groups every missing leaf by its full filter identity',()=>{
 const a=buildMissionAudit({generatedAt:'test'}),byId=new Map(a.missions.map(m=>[m.id,m]));
 for(const m of a.missions){assert.equal(m.reachableWithCurrentProviders,m.providerSupported&&m.prerequisiteClaims.every(id=>byId.get(id).reachableWithCurrentProviders));}
 assert.equal(a.summary.providerSupportedButPrerequisiteBlocked,a.missions.filter(m=>m.providerSupported&&!m.reachableWithCurrentProviders).length);
 for(const g of a.missingByMetricFilter){assert.equal(g.key,metricKey(g));assert.equal(g.missionCount,g.missionIds.length);assert.equal(new Set(g.missionIds).size,g.missionIds.length);for(const id of g.missionIds)assert.ok(byId.get(id).metrics.some(n=>n.key===g.key&&!n.supported));}
 const first=a.missions.find(m=>!m.providerSupported);if(first)assert.equal(a.summary.firstMissingProvider,first.id);
});

test('declared unlocks are no later than actual first required mission, and all intermediate tiers are considered',()=>{
 const a=auditUnlocks();assert.equal(a.passedDeclaredDeadlines,true);
 for(const kind of a.kinds){assert.ok(kind.declaredLatestUnlock<=kind.firstRequiredLevel);if(kind.mapped)assert.ok(kind.catalogue.length&&kind.catalogue.every(item=>Number.isFinite(item.cost)));}
 for(const m of MISSIONS)for(const n of leaves(m.condition))if(n.filters?.minTier>1)for(let tier=2;tier<=n.filters.minTier;tier++)assert.ok(a.systems.some(s=>s.key===`${n.filters.kind}:tier-${tier}`&&s.missionIds.includes(m.id)));
});
