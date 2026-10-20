// Gameplay values in BC (1 BC = 1,000 displayed game dong). These are
// adjustable simulation parameters, not real medical standards or advice.
export const HEALTHCARE_PROFILES=Object.freeze({
  clinic:Object.freeze({name:'Phòng khám',staff:4,beds:8,bedsPerStaff:2,residentsPerStaff:200,queuePerBed:3,treatmentSeconds:60,urgentSeconds:180,recovery:25,supplies:80,urgentSupplies:180}),
  hospital:Object.freeze({name:'Bệnh viện',staff:12,beds:48,bedsPerStaff:4,residentsPerStaff:400,queuePerBed:3,treatmentSeconds:90,urgentSeconds:240,recovery:45,supplies:160,urgentSupplies:360})
});
export const HEALTHCARE_VERSION=1;
export const CARE_NEED_HEALTH=70;
export const CARE_URGENT_HEALTH=35;
export const CHECKUP_INTERVAL_SECONDS=6*3600;
export const CARE_RETRY_SECONDS=60;
export const HEALTH_ASSESSMENT_SECONDS=60;
export const CARE_PHASES=Object.freeze(['idle','requesting','travelling','waiting','treatment','returning']);
