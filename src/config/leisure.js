// Each tree position matches an authored tree in facility-designs.js. Terrain
// decoration does not count as verified planted trees in this service model.
export const PARK_TREE_POSITIONS=Object.freeze([Object.freeze([-6,-6]),Object.freeze([6,6]),Object.freeze([-6,6])]);
export const LEISURE_PROFILES=Object.freeze({
 park:Object.freeze({name:'Công viên khu phố',capacity:16,visitSeconds:30,rangeMeters:400,trees:PARK_TREE_POSITIONS}),
 plaza:Object.freeze({name:'Quảng trường',capacity:24,visitSeconds:30,rangeMeters:400,trees:PARK_TREE_POSITIONS}),
 sportsPark:Object.freeze({name:'Công viên thể thao',capacity:20,visitSeconds:45,rangeMeters:400,trees:PARK_TREE_POSITIONS})
});
export const LEISURE_VERSION=1;
export const LEISURE_VISIT_COOLDOWN=1800;
export const LEISURE_RETRY_SECONDS=60;
export const LEISURE_TREE_UPDATE_SECONDS=60;
export const LEISURE_PHASES=Object.freeze(['idle','travelling','visiting','returning']);
export const WALKABLE_MAX_METERS=400;
