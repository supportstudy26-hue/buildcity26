// Game balance, not real-world migration statistics. One shared simulation clock.
export const ARRIVAL_BALANCE=Object.freeze({
 progressPerResident:60, // Keep existing save progress in [0,60).
 starterPopulation:100,
 starterSeconds:30,
 settledSeconds:60,
 noPowerFactor:.65,
 noSewageFactor:.8,
 minimumHappinessFactor:.35,
 minimumEmploymentFactor:.5
});
