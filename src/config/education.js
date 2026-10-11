// Game design values, not official school standards. One simulation clock.
export const SCHOOL_PROFILES=Object.freeze({
  school:{name:'Tiểu học',minAge:6,maxAge:11,seats:120,teachers:6},
  secondarySchool:{name:'Trung học',minAge:12,maxAge:17,seats:240,teachers:12}
});
export const SCHOOL_START=8*3600;
export const SCHOOL_END=14*3600;
export const SCHOOL_DEPART=7*3600+30*60;
export const TEACHER_DEPART=7*3600;
export const ATTENDANCE_SECONDS=60;
export const PUPILS_PER_TEACHER=20;
export const schoolKindForAge=age=>Object.keys(SCHOOL_PROFILES).find(k=>age>=SCHOOL_PROFILES[k].minAge&&age<=SCHOOL_PROFILES[k].maxAge)||null;
