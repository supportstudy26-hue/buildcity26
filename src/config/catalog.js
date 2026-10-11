import {LANDMARKS,landmarkDescription} from './landmarks.js';
import {ROAD_PROFILES,ROAD_KINDS,profilePrice,roadDescription} from './road-profiles.js';
import { LEGACY_BC_FACTOR } from './simulation.js';
import {ZONE_PERMIT_BC,roadPrice} from './building-economy.js';
export const CATALOG = {
  road: {name:'Đường phố',cost:60,upkeep:.25,icon:'╋',color:'#536a6c',group:'roads',description:'Đường hai làn. Kéo để xây liên tiếp; cầu được tạo tự động khi đi qua sông.'},
  avenue: {name:'Đại lộ',cost:140,upkeep:.5,icon:'═',color:'#536a6c',group:'roads',description:'Đường rộng với sức chứa gấp đôi. Có thể nâng cấp đường phố.'},
  residential: {name:'Khu dân cư',cost:25,icon:'⌂',color:'#8ce0ac',group:'zones',description:'Chi phí quy hoạch ô đất; nhà ở do cư dân tự xây. Nhà sẽ mọc lên khi có đường kết nối, điện, nước và nhu cầu dân cư.'},
  commercial: {name:'Thương mại',cost:25,icon:'▤',color:'#83c8ed',group:'zones',description:'Cửa hàng cung cấp 16 việc làm mỗi ô. Cần đường, điện và nước.'},
  industrial: {name:'Công nghiệp',cost:25,icon:'▥',color:'#eacc79',group:'zones',description:'Nhà xưởng cung cấp 28 việc làm mỗi ô nhưng gây ô nhiễm. Nên đặt xa nhà ở.'},
  smallPower: {name:'Trạm điện khu phố',cost:15000,upkeep:150,capacity:100,range:8,service:'power',color:'#eacc79',group:'utilities',description:'Cấp 100 kW, bán kính 8 ô. Bộ khởi đầu giá 15 triệu đồng game; cần đường nối cổng.'},
  smallWater: {name:'Trạm nước khu phố',cost:12000,upkeep:120,capacity:100,range:8,service:'water',color:'#83c8ed',group:'utilities',description:'Cấp 15 m³/ngày, bán kính 8 ô. Bộ khởi đầu giá 12 triệu đồng game; cần đường nối cổng.'},
  smallSewage: {name:'Xử lý nước thải nhỏ',cost:12000,upkeep:150,capacity:100,range:8,service:'sewage',color:'#77b8c9',group:'utilities',description:'Xử lý 15 m³/ngày, bán kính 8 ô. Cần đường, điện và nước; vốn xây 12 triệu đồng game.'},
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
  waterPump: {name:'Nhà máy nước',cost:650000,upkeep:2000,capacity:5000/.15,range:24,service:'water',color:'#83c8ed',group:'utilities',description:'Cấp 5.000 m³/ngày trong bán kính 24 ô. Cần đường nối cổng thành phố.'},
  treatmentPlant: {name:'Nhà máy nước thải',cost:1200000,upkeep:4000,capacity:5000/.15,range:24,service:'sewage',color:'#77b8c9',group:'utilities',description:'Xử lý 5.000 m³/ngày, bán kính 24 ô. Chỉ vận hành khi có đường, điện và nước.'},
  wasteCenter: {name:'Trung tâm thu gom rác',cost:600000,upkeep:2200,range:18,service:'waste',collection:8,color:'#b8c4ba',group:'utilities',description:'Thu gom 8 đơn vị rác/ngày mỗi nhà trong bán kính 18 ô, gấp đôi trạm nhỏ. Cần điện, nước và đường; đặt xa nhà ở.'},
  secondarySchool: {name:'Trường trung học',cost:2500000,upkeep:5000,range:14,service:'school',color:'#f2bc92',group:'services',description:'Cải thiện giáo dục trong bán kính 14 ô. Cần đường, điện và nước; chưa mô phỏng chỗ học theo từng học sinh.'},
  university: {name:'Đại học',cost:8000000,upkeep:12000,range:22,service:'school',color:'#f2bc92',group:'services',description:'Phục vụ giáo dục trong bán kính 22 ô. Chi phí cao; cần đường, điện và nước. Chưa có bằng cấp hay tuyển sinh riêng.'},
  hospital: {name:'Bệnh viện',cost:6000000,upkeep:12000,range:20,service:'clinic',color:'#dfaaa6',group:'services',description:'Phục hồi sức khỏe trong bán kính 20 ô. Cần đường, điện và nước; chưa có hàng đợi khám hay giường bệnh.'},
  fireCenter: {name:'Trung tâm cứu hỏa',cost:1800000,upkeep:4000,range:18,service:'fire',color:'#e69e7b',group:'services',description:'Giảm nguy cơ và dập cháy trong bán kính 18 ô. Cần đường, điện và nước; chưa điều phối xe cứu hỏa riêng.'},
  policeCenter: {name:'Sở cảnh sát',cost:1600000,upkeep:4000,range:18,service:'police',color:'#a6bcd2',group:'services',description:'Giảm mất an ninh trong bán kính 18 ô. Cần đường, điện và nước; thất nghiệp vẫn làm tăng nguy cơ.'},
  plaza: {name:'Quảng trường',cost:220000,upkeep:450,range:8,service:'park',color:'#c8d4ac',group:'parks',description:'Không gian công cộng giúp tăng hạnh phúc trong bán kính 8 ô. Cần đường, điện và nước.'},
  sportsPark: {name:'Công viên thể thao',cost:350000,upkeep:700,range:11,service:'park',color:'#8ce0ac',group:'parks',description:'Không gian xanh và sân chơi phục vụ bán kính 11 ô. Cần đường, điện và nước; chưa có lịch thi đấu.'},
  bulldoze: {name:'Phá dỡ',cost:0,icon:'⌫',color:'#ef9f91',group:'bulldoze',description:'Phá dỡ từng ô và hoàn lại 25% chi phí xây. Kiểm tra trước khi kéo.'},
  inspect: {name:'Xem thông tin',cost:0,icon:'⌖',color:'#d1dedc',group:'inspect',description:'Chọn một ô để xem cư dân, kết nối và dịch vụ.'}
};
// New facilities use BC directly; existing prices remain compatible with paid assets.
for(const v of Object.values(CATALOG))if(!v.service){v.cost*=LEGACY_BC_FACTOR;if(v.upkeep)v.upkeep*=LEGACY_BC_FACTOR;}
// Current catalogue prices change future purchases only, never an asset's paid cost.
const priceBook={power:[250000,800],water:[200000,500],sewage:[1200000,4000],waste:[300000,1000],school:[1500000,3000],clinic:[1200000,3000],fire:[900000,2000],police:[800000,2000],park:[150000,300],bus:[900000,2500],busStop:[12000,30],fireCenter:[3000000,6000],policeCenter:[3000000,6000],wasteCenter:[1800000,4000],sportsPark:[1200000,3000]};
for(const [kind,[cost,upkeep]] of Object.entries(priceBook))Object.assign(CATALOG[kind],{cost,upkeep});
for(const kind of ['residential','commercial','industrial'])CATALOG[kind].cost=ZONE_PERMIT_BC;
for(const kind of ['road','avenue'])CATALOG[kind].cost=roadPrice(kind);
CATALOG.residential.description='Phí cấp phép 2 BC/m² đất, không phải giá mua nhà. Nhà 3D xuất hiện ngay khi đặt, vốn xây do chủ đầu tư trả. Dân có thể đến khi nhà an toàn, nối đường về cổng và có nước sạch. Điện, nước thải, việc làm và hài lòng giúp dân đến nhanh hơn; dịch vụ chưa đủ vẫn có tác động thật.';
CATALOG.commercial.description='Phí cấp phép đất; mỗi mẫu cửa hàng có giá xây theo diện tích sàn riêng do chủ đầu tư trả. Xuất hiện ngay khi đặt; cần đường, điện, nước và nước thải để hoạt động.';
CATALOG.industrial.description='Phí cấp phép đất; giá xưởng gồm diện tích sàn và thiết bị, do chủ đầu tư trả. Xuất hiện ngay khi đặt; cần tiện ích để hoạt động; gây ô nhiễm nên đặt xa nhà ở.';
CATALOG.school.name='Trường tiểu học';
CATALOG.school.description='120 chỗ cho trẻ 6–11 tuổi, tối đa 6 giáo viên cư dân. Mỗi giáo viên phụ trách 20 chỗ; cần đường, điện, nước và nước thải. Học ngày thường 8–14h; ghi nhận lượt sau 60 giây game học có giáo viên. Vận hành gồm nhân sự.';
CATALOG.secondarySchool.description='240 chỗ cho trẻ 12–17 tuổi, tối đa 12 giáo viên cư dân. Học sinh có đường và chỗ học thật; giáo viên phải đến lớp để giảng dạy. Học ngày thường 8–14h, cần đầy đủ tiện ích. Vận hành gồm nhân sự.';
for(const [kind,p] of Object.entries(ROAD_PROFILES))CATALOG[kind]={...CATALOG[kind],name:p.name,cost:profilePrice(kind),upkeep:p.upkeep,color:'#536a6c',group:'roads',description:roadDescription(kind)};
for(const [kind,d] of Object.entries(LANDMARKS))CATALOG[kind]={...d,color:'#9bba8e',group:'parks',description:landmarkDescription(kind),decorative:true};
export const serviceKind=kind=>CATALOG[kind]?.service||kind;
export const BUILDINGS = Object.keys(CATALOG).filter(k=>['utilities','services','parks','transport'].includes(CATALOG[k].group));
export const ZONES = ['residential','commercial','industrial'];
export const ROADS = ROAD_KINDS;
