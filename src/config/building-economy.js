// BC design prices from appendices A/D/F. 1 BC = 1,000 displayed game dong.
// Starter utilities are deliberately smaller than the full-scale A2 plants.
export const ECONOMY_VERSION='buildings-a-d-f-20261010';
export const ZONE_PERMIT_BC=2*20*20;
export const PRIVATE_PLANS=Object.freeze({
 residential:{designId:'townhouse',name:'Cụm 3 nhà phố',floorArea:480,rate:900,equipment:0,capacity:24},
 commercial:{designId:'shop-house',name:'Cửa hàng góc phố',floorArea:144,rate:1000,equipment:0,capacity:16},
 industrial:{designId:'sawtooth',name:'Xưởng dệt mái răng cưa',floorArea:196,rate:800,equipment:200000,capacity:28}
});
export const PRIVATE_DESIGNS=Object.freeze({
 townhouse:{...PRIVATE_PLANS.residential,kind:'residential'},
 'tile-house':{kind:'residential',designId:'tile-house',name:'Nhà mái ngói',floorArea:90,rate:900,equipment:0,capacity:8},
 'garden-villa':{kind:'residential',designId:'garden-villa',name:'Biệt thự sân vườn',floorArea:240,rate:900,equipment:0,capacity:12},
 courtyard:{kind:'residential',designId:'courtyard',name:'Nhà sân trong',floorArea:120,rate:900,equipment:0,capacity:12},
 'terraced-apartment':{kind:'residential',designId:'terraced-apartment',name:'Chung cư giật cấp',floorArea:576,rate:900,equipment:0,capacity:48},
 'twin-apartment':{kind:'residential',designId:'twin-apartment',name:'Chung cư hai khối',floorArea:704,rate:900,equipment:0,capacity:64},
 'balcony-apartment':{kind:'residential',designId:'balcony-apartment',name:'Chung cư ban công',floorArea:575,rate:900,equipment:0,capacity:48},
 'shop-house':{...PRIVATE_PLANS.commercial,kind:'commercial'},
 'market-hall':{kind:'commercial',designId:'market-hall',name:'Chợ mái đôi',floorArea:168,rate:1000,equipment:0,capacity:24},
 'glass-office':{kind:'commercial',designId:'glass-office',name:'Văn phòng kính',floorArea:484,rate:1000,equipment:0,capacity:48},
 sawtooth:{...PRIVATE_PLANS.industrial,kind:'industrial'},
 warehouse:{kind:'industrial',designId:'warehouse',name:'Kho hàng',floorArea:168,rate:800,equipment:100000,capacity:20},
 processing:{kind:'industrial',designId:'processing',name:'Xưởng chế biến',floorArea:130,rate:800,equipment:300000,capacity:32}
});
export function privatePlan(kind,designId=null){const p=PRIVATE_DESIGNS[designId];return p?.kind===kind?p:PRIVATE_PLANS[kind];}
export const privateBuildPrice=(kind,designId=null)=>{const p=privatePlan(kind,designId);return p?p.floorArea*p.rate+p.equipment:0;};
export const CAPACITY_FACTORS=[0,1,1.25,1.5,1.75,2];
export const MAINTENANCE_FACTORS=[0,1,1.15,1.35,1.6,1.9];
export const UPGRADE_COST_FACTORS=[0,0,.25,.45,.7,1];
export function capacityFactor(tile){return tile?.development?.version===1||tile?.upgrade?.version===1?CAPACITY_FACTORS[tile.level]||1:1;}
export function residentCapacity(tile){return tile.development?.version===1?Math.floor(privatePlan(tile.kind,tile.development.designId).capacity*capacityFactor(tile)/4)*4:tile.upgrade?.version===1?Math.floor(tile.upgrade.baseCapacity*CAPACITY_FACTORS[tile.level]/CAPACITY_FACTORS[tile.upgrade.baseLevel]/4)*4:24*(tile.level||1);}
export function jobsCapacity(tile){const base=tile.kind==='commercial'?16:28;return tile.development?.version===1?Math.floor(privatePlan(tile.kind,tile.development.designId).capacity*capacityFactor(tile)):tile.upgrade?.version===1?Math.floor(tile.upgrade.baseCapacity*CAPACITY_FACTORS[tile.level]/CAPACITY_FACTORS[tile.upgrade.baseLevel]):base*(tile.level||1);}
export function roadPrice(kind,water=false){const width=kind==='avenue'?18:12;return water?20*width*350+2*25000:20*width*(kind==='avenue'?65:50)+20*4*25;}
export function placementPrice(kind,tile,factor=1,catalog){const road=['road','avenue'].includes(kind);let p=road?roadPrice(kind,tile.terrain==='water'):catalog[kind].cost;if(tile.kind==='road'&&kind==='avenue')p-=roadPrice('road',tile.terrain==='water');return Math.ceil(p*factor);}
