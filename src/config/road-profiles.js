// Metres, km/h and BC. Existing road/avenue IDs and paid costs remain unchanged.
// Tile-network roads, engineered decks and compact circular intersections.
export const ROAD_PROFILES=Object.freeze({
 road:{name:'Đường dân cư hai chiều',width:12,lanes:2,speed:30,capacity:45,sidewalk:1.25,modes:['car','bus','walk','bicycle'],rate:50,upkeep:25},
 roadOneWay:{name:'Đường một chiều',width:10,lanes:2,speed:40,capacity:60,sidewalk:1.25,modes:['car','bus','walk','bicycle'],rate:50,upkeep:24,oneWay:true},
 treeRoad:{name:'Đường phố hàng cây',width:12,lanes:2,speed:30,capacity:45,sidewalk:1.75,modes:['car','bus','walk','bicycle'],rate:55,upkeep:34,trees:true},
 avenue:{name:'Đại lộ có dải phân cách',width:18,lanes:4,speed:50,capacity:90,sidewalk:.75,modes:['car','bus','walk','bicycle'],rate:65,upkeep:50,median:1.2},
 busRoad:{name:'Đường có làn xe buýt',width:18,lanes:4,speed:40,capacity:60,sidewalk:.75,modes:['car','bus','walk','bicycle'],rate:70,upkeep:58,busLane:true},
 pedestrian:{name:'Đường đi bộ',width:6,lanes:0,speed:5,capacity:0,sidewalk:0,modes:['walk'],rate:30,upkeep:10},
 bicycle:{name:'Đường xe đạp',width:6,lanes:2,speed:20,capacity:0,sidewalk:0,modes:['bicycle','walk'],rate:35,upkeep:12},
 highway2:{name:'Cao tốc 2 làn mỗi chiều',width:18,lanes:4,speed:90,capacity:180,sidewalk:0,modes:['car','bus'],rate:95,upkeep:90,median:1.4,motorway:true,frontage:false},
 highwayViaduct:{name:'Cầu cạn cao tốc · trụ 6 m',width:18,lanes:4,speed:90,capacity:180,sidewalk:0,modes:['car','bus'],rate:350,upkeep:180,median:1.4,motorway:true,frontage:false,elevation:6,structure:true},
 highwayRamp:{name:'Nhánh cao tốc một chiều',width:9,lanes:1,speed:40,capacity:75,sidewalk:0,modes:['car','bus'],rate:90,upkeep:40,oneWay:true,ramp:true,frontage:false},
 viaductRamp:{name:'Nhánh lên / xuống cầu cạn',width:9,lanes:1,speed:35,capacity:65,sidewalk:0,modes:['car','bus'],rate:220,upkeep:90,oneWay:true,ramp:true,frontage:false,elevation:3,structure:true},
 roundabout:{name:'Vòng xuyến một làn',width:18,lanes:1,speed:20,capacity:55,sidewalk:0,modes:['car','bus','walk','bicycle'],rate:80,upkeep:65,circle:{radius:6.7,island:4.6,outer:8.7},frontage:false},
 roundabout2:{name:'Vòng xuyến hai làn',width:20,lanes:2,speed:25,capacity:95,sidewalk:0,modes:['car','bus','walk','bicycle'],rate:95,upkeep:95,circle:{radius:7.8,island:3.4,outer:9.8},frontage:false}
});
export const ROAD_KINDS=Object.freeze(Object.keys(ROAD_PROFILES));
export const roadProfile=t=>ROAD_PROFILES[typeof t==='string'?t:t?.kind];
export const DIRECTION_VECTORS=Object.freeze({north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]});
export const ROAD_MODE_LABELS={car:'ô tô',bus:'xe buýt',walk:'người đi bộ',bicycle:'xe đạp'};
export function profilePrice(kind,water=false){const p=roadProfile(kind);if(!p)return 0;if(p.circle)return Math.ceil(Math.PI*(p.circle.outer**2-p.circle.island**2)*p.rate+15000);return water||p.structure?20*p.width*p.rate+(water&&!p.structure?20*p.width*(350-p.rate):0)+50000:20*p.width*p.rate+(p.sidewalk?20*4*25:0)+(p.trees?4000:0)+(p.busLane?2000:0);}
export function roadDescription(kind){const p=roadProfile(kind);return `${p.width} m · ${p.lanes} làn · ${p.speed} km/h. Cho phép ${p.modes.map(m=>ROAD_MODE_LABELS[m]).join(', ')}. ${p.circle?'Giá gồm toàn bộ vòng và đảo cây xanh trong một ô; nối đường vào các cạnh. Xe đi quanh đảo, nhường xe trong vòng.':'Giá cho mỗi đoạn 20 m; cầu qua nước được tính riêng. Xây được trên đồi núi; chi phí nền tăng theo độ dốc, xem giá tại ô trước khi đặt.'}${p.oneWay?' Hướng mặc định về đông; chọn đoạn đường để đổi hướng.':''}${p.motorway?' Không có lối vào nhà hay người đi bộ. Nối đường phố qua nhánh cao tốc.':''}${p.elevation?` Mặt đường cao ${p.elevation} m so với nền; gồm trụ, dầm và lan can.`:''}${kind==='highwayViaduct'?' Có thể dựng trụ trước rồi đặt mặt cầu; chỉ trả phần còn thiếu. Dùng nhánh 3 m để nối xuống đường.':''}${p.busLane?' Làn ngoài dành cho xe buýt; ô tô chạy làn trong.':''}${p.median?' Có dải phân cách giữa hai chiều.':''}`;}
