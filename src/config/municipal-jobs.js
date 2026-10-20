// Original game balancing values. Stock and service units are simulation units,
// not claims about real fire appliances or official staffing standards.
export const MUNICIPAL_PROFILES=Object.freeze({
 fire:{name:'Trạm cứu hỏa',service:'firefighting',posts:6,vehicles:1,crew:2,range:10,speed:15,water:120,waterRate:1.5,workSeconds:20,refillSeconds:30,supplyCostBC:30,inspectionSeconds:45,inspectionCostBC:15,inspectionReduction:12,artId:'pv-fire-engine'},
 fireCenter:{name:'Trung tâm cứu hỏa',service:'firefighting',posts:12,vehicles:3,crew:2,range:18,speed:15,water:240,waterRate:2,workSeconds:20,refillSeconds:30,supplyCostBC:45,inspectionSeconds:45,inspectionCostBC:15,inspectionReduction:12,artId:'pv-fire-engine'},
 police:{name:'Trạm cảnh sát',service:'security_patrol',posts:4,vehicles:2,crew:1,range:10,speed:12,workSeconds:30,patrolSeconds:600,refillSeconds:15,supplyCostBC:15,artId:'pv-police-car'},
 policeCenter:{name:'Trung tâm cảnh sát',service:'security_patrol',posts:10,vehicles:4,crew:1,range:18,speed:12,workSeconds:30,patrolSeconds:600,refillSeconds:15,supplyCostBC:15,artId:'pv-police-car'},
 waste:{name:'Điểm thu gom rác',service:'waste_collection',posts:4,vehicles:2,crew:1,range:12,speed:10,cargo:8,workSeconds:15,refillSeconds:20,supplyCostBC:20,artId:'pv-garbage-truck'},
 wasteCenter:{name:'Trung tâm thu gom rác',service:'waste_collection',posts:12,vehicles:4,crew:1,range:18,speed:10,cargo:16,workSeconds:15,refillSeconds:20,supplyCostBC:25,artId:'pv-garbage-truck'}
});
export const MUNICIPAL_MAX_JOBS=128;
export const MUNICIPAL_MAX_HISTORY=256;
export const MUNICIPAL_MIN_WASTE=.001;
export const MUNICIPAL_WASTE_PER_RESIDENT_DAY=.045;
export const MUNICIPAL_JOB_SCAN_SECONDS=10;
export const FIRE_INSPECTION_INITIAL_SECONDS=300;
export const FIRE_INSPECTION_COOLDOWN_SECONDS=6*3600;
