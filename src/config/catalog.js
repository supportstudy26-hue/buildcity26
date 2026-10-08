import { LEGACY_BC_FACTOR } from './simulation.js';
export const CATALOG = {
  road: {name:'Đường phố',cost:60,upkeep:.25,icon:'╋',color:'#536a6c',group:'roads',description:'Đường hai làn. Kéo để xây liên tiếp; cầu được tạo tự động khi đi qua sông.'},
  avenue: {name:'Đại lộ',cost:140,upkeep:.5,icon:'═',color:'#536a6c',group:'roads',description:'Đường rộng với sức chứa gấp đôi. Có thể nâng cấp đường phố.'},
  residential: {name:'Khu dân cư',cost:25,icon:'⌂',color:'#8ce0ac',group:'zones',description:'Chi phí quy hoạch ô đất; nhà ở do cư dân tự xây. Nhà sẽ mọc lên khi có đường kết nối, điện, nước và nhu cầu dân cư.'},
  commercial: {name:'Thương mại',cost:25,icon:'▤',color:'#83c8ed',group:'zones',description:'Cửa hàng cung cấp 16 việc làm mỗi ô. Cần đường, điện và nước.'},
  industrial: {name:'Công nghiệp',cost:25,icon:'▥',color:'#eacc79',group:'zones',description:'Nhà xưởng cung cấp 28 việc làm mỗi ô nhưng gây ô nhiễm. Nên đặt xa nhà ở.'},
  power: {name:'Trạm điện',cost:4200,upkeep:80,capacity:500,range:17,icon:'ϟ',color:'#eacc79',group:'utilities',description:'Cấp 500 kW trong bán kính 17 ô khi nối vào đường.'},
  water: {name:'Trạm cấp nước',cost:3200,upkeep:55,capacity:500,range:17,icon:'◈',color:'#83c8ed',group:'utilities',description:'Cấp 75 m³ nước/ngày trong bán kính 17 ô khi nối vào đường.'},
  sewage: {name:'Xử lý nước thải',cost:3900,upkeep:60,capacity:600,range:17,icon:'≈',color:'#77b8c9',group:'utilities',description:'Xử lý 90 m³ nước thải/ngày trong bán kính 17 ô. Nước thải chưa xử lý làm tăng ô nhiễm và giảm hạnh phúc.'},
  waste: {name:'Thu gom rác',cost:2800,upkeep:35,range:12,icon:'♻',color:'#b8c4ba',group:'utilities',description:'Phục vụ dân cư trong bán kính 12 ô. Đặt cách nhà ở vì có ô nhiễm.'},
  school: {name:'Trường học',cost:3600,upkeep:45,range:9,icon:'▧',color:'#f2bc92',group:'services',description:'Trình độ giáo dục tăng dần trong vùng phục vụ. Nhà nâng cấp cần trình độ ít nhất 35 và sức khỏe ít nhất 60.'},
  clinic: {name:'Trạm y tế',cost:4200,upkeep:55,range:9,icon:'✚',color:'#dfaaa6',group:'services',description:'Phục hồi sức khỏe dân cư trong vùng phục vụ. Nước thải, ô nhiễm và rác làm sức khỏe giảm dần.'},
  fire: {name:'Trạm cứu hỏa',cost:3800,upkeep:45,range:10,icon:'♨',color:'#e69e7b',group:'services',description:'Giảm nguy cơ và dập cháy trong phạm vi có đường kết nối. Nguy cơ tăng khi rác tích tụ hoặc nhà xưởng ô nhiễm.'},
  police: {name:'Trạm cảnh sát',cost:3800,upkeep:45,range:10,icon:'⬡',color:'#a6bcd2',group:'services',description:'Giảm mất an ninh trong phạm vi đường kết nối. Thất nghiệp và chất lượng sống thấp làm mất an ninh tăng dần.'},
  park: {name:'Công viên',cost:850,upkeep:8,range:6,icon:'♧',color:'#8ce0ac',group:'parks',description:'Tạo không gian xanh, nâng hạnh phúc cho nhà ở trong bán kính 6 ô.'},
  bus: {name:'Bến xe buýt',cost:5200,upkeep:50,range:15,icon:'▣',color:'#f2bc92',group:'transport',description:'Bến vận hành các tuyến xe buýt. Xây điểm dừng rồi tạo tuyến trong Quản lý xe buýt.'},
  busStop: {name:'Điểm dừng xe buýt',cost:280,upkeep:1,range:5,icon:'▣',color:'#f2bc92',group:'transport',description:'Đặt cạnh đường kết nối. Tuyến cần ít nhất hai điểm dừng; nhà ở và nơi làm việc gần tuyến sẽ giảm ô tô.'},
  bulldoze: {name:'Phá dỡ',cost:0,icon:'⌫',color:'#ef9f91',group:'bulldoze',description:'Phá dỡ từng ô và hoàn lại 25% chi phí xây. Kiểm tra trước khi kéo.'},
  inspect: {name:'Xem thông tin',cost:0,icon:'⌖',color:'#d1dedc',group:'inspect',description:'Chọn một ô để xem cư dân, kết nối và dịch vụ.'}
};
for(const v of Object.values(CATALOG)){v.cost*=LEGACY_BC_FACTOR;if(v.upkeep)v.upkeep*=LEGACY_BC_FACTOR;}
export const BUILDINGS = ['power','water','sewage','waste','school','clinic','fire','police','park','bus','busStop'];
export const ZONES = ['residential','commercial','industrial'];
export const ROADS = ['road','avenue'];
