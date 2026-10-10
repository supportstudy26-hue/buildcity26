export interface UtilitySnapshot {
  coveragePct?: number; capacity?: number; demand?: number;
  unit?: string; activeBuildings?: number; served?:number; denominator?:number; definition?:string;
}
export interface MissionSnapshot {
  id: string; level: number; title: string; description: string;
  current?: number; target?: number; rewardXp?: number; rewardMoney?: number;
  claimable: boolean; claimed: boolean; progressLabel?:string;
}
export interface CatalogueEntry {
  id: string; category: 'road'|'residential'|'commercial'|'industrial'|'utilities'|'health'|'transport'|'park';
  name: string; description?: string; icon?: string; cost?: number;
  maintenance?: number; unlockLevel?: number; available?: boolean; kind?:string; designId?:string; privatePrice?:number; thumbnailMarkup?:string;
}
export interface BuildingSnapshot {
  id: string; name: string; icon?: string; description?: string; tier?: number;
  statusLabel?: string; users?: number; capacity?: number; maintenance?: number;
  upgradeCost?: number; canUpgrade?: boolean; canDemolish?: boolean; upgradeBenefits?: string; detailsElement?:HTMLElement;
}
export interface HudSnapshot {
  cityName?: string; level?: number; xpIntoLevel?: number; xpToNext?: number;
  moneyUnit?:string; budgetDefinition?:string; money?: number; income?: number; expense?: number; budgetPeriodLabel?: string; debt?: number;
  housingCapacity?:number; jobs?:number; population?: number; populationDelta?: number; happinessPct?: number; employmentPct?: number; housedPct?: number;
  electricity?: UtilitySnapshot; water?: UtilitySnapshot;
  multiplier?:number; observe?:boolean; saveLabel?:string; accountLabel?:string; activeTool?:string; terrainAvailable?:boolean; terrainReason?:string; paused?: boolean; weatherLabel?: string; gameDateLabel?: string;
  mission?: MissionSnapshot; catalogue?: CatalogueEntry[]; selectedBuilding?: BuildingSnapshot;
  alerts?: Array<{id: string; title: string; message?: string; icon?: string; location?: unknown}>;
}
export type HudAction =
  | {type:'save'|'settings'|'map'|'ranking'|'budget'|'missions'|'account'|'home'|'weather'|'residents'|'catalogueMounted'|'closePanel'}
  | {type:'layers';layer?:string}
  | {type:'pause';paused:boolean}
  | {type:'speed';multiplier:number}
  | {type:'tool';tool:string}
  | {type:'build'|'upgrade'|'demolishRequest';buildingId:string}
  | {type:'claimMission';missionId:string}
  | {type:'locate';location:unknown;alertId:string};
export function createCityHud(container: HTMLElement, initialSnapshot?: HudSnapshot,
  onAction?: (action: HudAction) => void): {
    update(snapshot: HudSnapshot): void; showBuilding():void; notify(message:string):void;
    close():void; destroy():void; element:HTMLElement; setSaveLabel(label:string):void; setHint(text:string):void; openCatalogue(id:string):void; isOpen(type:string):boolean; selectTool(id:string):void;
  };
