// Original scenery, BC per asset and per simulation month. These assets do not
// supply utility or telecom services. Nearby amenity is capped at 6 happiness points.
export const LANDMARKS=Object.freeze({
 clockTower:{name:'Tháp đồng hồ',cost:450000,upkeep:700,height:24,range:5,amenity:3,power:1,water:0},
 observationTower:{name:'Tháp quan sát',cost:900000,upkeep:1400,height:30,range:7,amenity:4,power:2,water:0},
 cityTower:{name:'Tháp biểu tượng',cost:1600000,upkeep:2000,height:36,range:8,amenity:6,power:2,water:0},
 flagpole:{name:'Cột cờ quảng trường',cost:45000,upkeep:80,height:16,range:3,amenity:1,power:0,water:0},
 monument:{name:'Tượng đài thành phố',cost:250000,upkeep:350,height:9,range:5,amenity:3,power:0,water:0},
 welcomeGate:{name:'Cổng chào',cost:180000,upkeep:300,height:10,range:4,amenity:2,power:1,water:0},
 fountain:{name:'Đài phun nước',cost:120000,upkeep:350,height:4,range:4,amenity:3,power:4,water:2},
 flowerBed:{name:'Vườn hoa',cost:20000,upkeep:60,height:2.2,range:3,amenity:2,power:0,water:.4},
 benches:{name:'Cụm ghế nghỉ',cost:8000,upkeep:20,height:2,range:2,amenity:1,power:0,water:0},
 streetLamp:{name:'Cụm đèn cảnh quan',cost:18000,upkeep:45,height:6.5,range:2,amenity:1,power:.4,water:0}
});
export const landmarkDescription=k=>{const d=LANDMARKS[k];return `Cao ${d.height} m. Tăng tối đa ${d.amenity} điểm hài lòng trong ${d.range*20} m khi có kết nối và đủ nhu cầu ${d.power} kW, ${d.water} m³/ngày. Lấy tác động lớn nhất của cảnh quan gần nhà, tổng không quá 6 điểm; không cộng dồn từng tháp. Không cung cấp điện, nước hoặc viễn thông.`;};
