// Metres, km/h and BC. Existing road/avenue IDs and paid costs remain unchanged.
// These are the ground-level profiles supported by the current tile network.
export const ROAD_PROFILES=Object.freeze({
 road:{name:'Đường dân cư hai chiều',width:12,lanes:2,speed:30,capacity:45,sidewalk:1.25,modes:['car','bus','walk','bicycle'],rate:50,upkeep:25},
 roadOneWay:{name:'Đường một chiều',width:10,lanes:2,speed:40,capacity:60,sidewalk:1.25,modes:['car','bus','walk','bicycle'],rate:50,upkeep:24,oneWay:true},
 treeRoad:{name:'Đường phố hàng cây',width:12,lanes:2,speed:30,capacity:45,sidewalk:1.75,modes:['car','bus','walk','bicycle'],rate:55,upkeep:34,trees:true},
 avenue:{name:'Đại lộ có dải phân cách',width:18,lanes:4,speed:50,capacity:90,sidewalk:.75,modes:['car','bus','walk','bicycle'],rate:65,upkeep:50,median:1.2},
 busRoad:{name:'Đường có làn xe buýt',width:18,lanes:4,speed:40,capacity:60,sidewalk:.75,modes:['car','bus','walk','bicycle'],rate:70,upkeep:58,busLane:true},
 pedestrian:{name:'Đường đi bộ',width:6,lanes:0,speed:5,capacity:0,sidewalk:0,modes:['walk'],rate:30,upkeep:10},
 bicycle:{name:'Đường xe đạp',width:6,lanes:2,speed:20,capacity:0,sidewalk:0,modes:['bicycle','walk'],rate:35,upkeep:12}
});
export const ROAD_KINDS=Object.freeze(Object.keys(ROAD_PROFILES));
export const roadProfile=t=>ROAD_PROFILES[typeof t==='string'?t:t?.kind];
export const DIRECTION_VECTORS=Object.freeze({north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]});
export const ROAD_MODE_LABELS={car:'ô tô',bus:'xe buýt',walk:'người đi bộ',bicycle:'xe đạp'};
export function profilePrice(kind,water=false){const p=roadProfile(kind);if(!p)return 0;return water?20*p.width*350+50000:20*p.width*p.rate+(p.sidewalk?20*4*25:0)+(p.trees?4000:0)+(p.busLane?2000:0);}
export function roadDescription(kind){const p=roadProfile(kind);return `${p.width} m · ${p.lanes} làn · ${p.speed} km/h. Cho phép ${p.modes.map(m=>ROAD_MODE_LABELS[m]).join(', ')}. Giá cho mỗi đoạn 20 m; cầu qua nước được tính riêng.${p.oneWay?' Hướng mặc định về đông; chọn đoạn đường để đổi hướng. Người đi bộ được đi hai chiều.':''}${p.busLane?' Làn ngoài dành cho xe buýt; ô tô chạy làn trong.':''}${p.median?' Dải phân cách ngắt tại giao lộ.':''}`;}
