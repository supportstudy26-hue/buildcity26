// Design parameters, not real-world statistics or legal standards.
export const RULE_VERSION = 'foundation-3';
export const CELL_METERS = 20;
export const STEP_SECONDS = 10;
export const DAY_SECONDS = 86400;
export const START_DATE = Date.UTC(2026, 0, 1);
export const PLAY_SECONDS_PER_SECOND = 2880; // one day in 30 seconds
export const LEGACY_BC_FACTOR = 100; // schema 1/2 only, exactly once
export const START_CASH_BC = 12_000_000;
export const ANNUAL_INTEREST = .05;
export const WATER_PER_PERSON = .15; // m³/day
