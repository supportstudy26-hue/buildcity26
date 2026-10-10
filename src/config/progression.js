import catalogue from './missions/missions-300.json' with {type:'json'};
import curve from './missions/levels-1-100.json' with {type:'json'};
export {XP_VERSION,LEVEL_GRANT_BC,LEGACY_MISSIONS} from './legacy-progression.js';
export const MISSION_CATALOGUE_VERSION=catalogue.catalogueId;
export const MAX_CITY_LEVEL=100;
export const MISSIONS=Object.freeze(catalogue.missions);
export const LEVELS=Object.freeze(curve.levels);
export const CAP_XP=4_230_468;
export function xpForLevel(level){if(!Number.isInteger(level)||level<1||level>100)throw new Error('Cấp không hợp lệ.');return LEVELS[level-1].cumulativeXp;}
export function levelFromXp(xp){if(!Number.isSafeInteger(xp)||xp<0)throw new Error('XP không hợp lệ.');let lo=1,hi=100;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(xp>=xpForLevel(mid))lo=mid;else hi=mid-1;}return lo;}
