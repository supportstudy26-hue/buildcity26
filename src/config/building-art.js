import assets from './building-art-assets.json' with {type:'json'};
// Explicit art IDs: these are references, never simulation type IDs or capacities.
export const BuildingArtRegistry=Object.freeze(Object.fromEntries(assets.map(a=>[a.id,Object.freeze(a)])));
export const BUILDING_ART=Object.freeze({
 road:'road-bridge',avenue:'highway-bridge',residential:'row-houses',commercial:'corner-shop',industrial:'textile-factory',
 smallPower:'transformer-station',power:'distribution-substation',smallWater:'groundwater-pump',water:'water-tower',waterPump:'advanced-water-pump',
 smallSewage:'sewage-treatment',sewage:'sludge-processing',treatmentPlant:'advanced-treatment',waste:'waste-transfer',wasteCenter:'recycling-center',
 school:'primary-school',secondarySchool:'secondary-school',university:'university',clinic:'clinic',hospital:'large-hospital',
 fire:'small-fire-station',fireCenter:'large-fire-station',police:'small-police-station',policeCenter:'police-headquarters',
 bus:'bus-depot',busStop:'bus-stop',park:'small-park',plaza:'public-plaza',sportsPark:'sports-center'
});
export const DESIGN_ART=Object.freeze({townhouse:'row-houses','tile-house':'detached-house','garden-villa':'residential-villa',courtyard:'rural-house',
 'terraced-apartment':'midrise-apartments','twin-apartment':'social-housing','balcony-apartment':'affordable-apartments',
 'shop-house':'corner-shop','market-hall':'traditional-market','glass-office':'high-commercial',sawtooth:'textile-factory',warehouse:'private-warehouse',processing:'food-factory'});
export function artForBuilding(kind,designId=null){return BuildingArtRegistry[DESIGN_ART[designId]||BUILDING_ART[kind]]||null;}
