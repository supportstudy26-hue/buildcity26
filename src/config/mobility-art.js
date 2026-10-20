import data from './mobility-art-assets.json' with {type:'json'};
export const MobilityArtRegistry=Object.freeze(Object.fromEntries(data.assets.map(a=>[a.id,Object.freeze(a)])));
export const MOBILITY_GROUPS=Object.freeze(data.groups);
export const PRIVATE_CARS=['pv-compact-car','pv-sedan','pv-electric-car','pv-suv','pv-family-minivan','pv-pickup'];
export function artHash(id){let h=2166136261;for(const ch of String(id))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
export function citizenArtId(c){
 if(MobilityArtRegistry[c.artId]?.kind==='person')return c.artId;
 const female=artHash(c.id)%2===0;
 return c.age<13?(female?'pv-child-girl':'pv-child-boy'):c.age<20?(female?'pv-teen-girl':'pv-teen-boy'):c.age>=65?(female?'pv-elder-woman':'pv-elder-man'):(female?'pv-adult-woman':'pv-adult-man');
}
export function vehicleArtId(v){return MobilityArtRegistry[v?.artId]&&MobilityArtRegistry[v.artId].kind!=='person'?v.artId:v?.kind==='bus'?'pv-city-bus':PRIVATE_CARS[artHash(v?.id)%PRIVATE_CARS.length];}
export function assignMobilityArt(s){for(const c of s.citizens)c.artId??=citizenArtId(c);for(const v of s.vehicles)v.artId??=vehicleArtId(v);}
// A reference is not a working service. Only these families currently have authored meshes.
export function mobilityMeshStatus(id){const a=MobilityArtRegistry[id];return a&&(a.kind==='person'||a.group==='04-private-cars'||a.animationProfile==='bus'||['fire-engine','police-car','ambulance','garbage-truck','light-box-truck','medium-truck','refrigerated-truck'].includes(a.semanticKey))?'mesh':'reference';}
export function mobilityRuntimeStatus(id){const fleet={'pv-fire-engine':'Cứu hỏa theo đường','pv-police-car':'Tuần tra theo đường','pv-garbage-truck':'Thu gom và đưa rác về trạm','pv-light-box-truck':'Giao hàng theo đơn','pv-medium-truck':'Giao hàng theo đơn','pv-refrigerated-truck':'Giao hàng thực phẩm'};if(fleet[id])return fleet[id];return PRIVATE_CARS.includes(id)?'Xe cá nhân theo hành trình':id==='pv-city-bus'?'Tuyến xe buýt':MobilityArtRegistry[id]?.group==='01-residents'&&id!=='pv-wheelchair-user'?'Cư dân theo lịch':'Chưa nối nghiệp vụ';}
