// Design parameters, not real-world statistics or legal standards.
export const RULE_VERSION = 'clock-5';
export const CELL_METERS = 20;
export const STEP_SECONDS = 1;
export const DAY_SECONDS = 86400;
export const START_DATE = Date.UTC(2026, 0, 1);
export const PLAY_SECONDS_PER_SECOND = 5; // one real second = five simulation seconds
export const LEGACY_BC_FACTOR = 100; // schema 1/2 only, exactly once
export const START_CASH_BC = 12_000_000; // legacy tutorial fixture, existing saves are never reset
export const NEW_CITY_CASH_BC = 10_000_000; // 10 billion displayed game dong, user decision 2026-10-10
export const ANNUAL_INTEREST = .05;
export const WATER_PER_PERSON = .15; // m³/day
