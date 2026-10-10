import {createProgression,updateProgression as updateLegacy,validateProgression as validateLegacy,missionViews as legacyMissionViews} from './legacy-progression.js';
import {updateCampaign,validateCampaign,missionViews as campaignViews} from './campaign.js';
export {createProgression,legacyMissionViews};
export const missionViews=campaignViews;
export function updateProgression(s,force=false){updateLegacy(s,force);updateCampaign(s,force);}
export function validateProgression(p,seconds){validateLegacy(p,seconds);validateCampaign(p.campaign,seconds);}
