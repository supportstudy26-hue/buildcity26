export const LEVEL_GRANT_BC=100_000; // 100 million game đồng through the common display conversion.
export const XP_VERSION='city-missions-1';
export const legacyXpForLevel=level=>500*(level-1)+125*(level-1)*(level-2);
export function legacyLevelFromXp(xp){if(!Number.isSafeInteger(xp)||xp<0)throw new Error('XP không hợp lệ.');let level=1+Math.floor((Math.sqrt(9+.032*xp)-3)/2);if(xp<legacyXpForLevel(level))level--;if(xp>=legacyXpForLevel(level+1))level++;return level;}
export const LEGACY_MISSIONS=[
  {id:'population-100',name:'Khu dân cư đầu tiên',description:'Giữ 100 cư dân, đủ nhà, điện, nước và xử lý nước thải trong 1 ngày.',kind:'population',target:100,xp:100,level:1,tool:'residential'},
  {id:'roads-5',name:'Mở rộng kết nối',description:'Xây thêm 5 ô đường nối với mạng thành phố và duy trì 1 ngày.',kind:'roads',target:5,xp:100,level:1,tool:'road'},
  {id:'work-20',name:'Nhịp sống đi làm',description:'Ít nhất 20 cư dân thực sự đã tới nơi làm việc, duy trì điều kiện 1 ngày.',kind:'attendance',target:20,xp:100,level:1},
  {id:'utilities-100',name:'Nền hạ tầng ổn định',description:'Phục vụ đủ điện, nước và nước thải cho ít nhất 100 cư dân trong 1 ngày.',kind:'utilities',target:100,xp:100,level:1,tool:'sewage'},
  {id:'park-built',name:'Thêm không gian xanh',description:'Hoàn thành một công viên do bạn đặt thi công; giữ công trình hoạt động 1 ngày.',kind:'park',target:1,xp:150,level:1,tool:'park'},
  {id:'school-80',name:'Cơ hội học tập',description:'Trường đang hoạt động phục vụ ít nhất 80% dân cư trong 1 ngày.',kind:'school',target:80,xp:150,level:2,tool:'school'},
  {id:'clinic-80',name:'Chăm sóc cộng đồng',description:'Y tế đang hoạt động phục vụ ít nhất 80% dân cư trong 1 ngày.',kind:'clinic',target:80,xp:150,level:2,tool:'clinic'},
  {id:'population-500',name:'Thị trấn đang lớn',description:'Giữ 500 cư dân có đủ nhà và tiện ích trong 1 ngày.',kind:'population',target:500,xp:300,level:2,tool:'residential'},
  {id:'waste-80',name:'Khu phố sạch',description:'Thu gom rác đang hoạt động phục vụ ít nhất 80% dân cư trong 1 ngày.',kind:'waste',target:80,xp:150,level:2,tool:'waste'},
  {id:'fire-80',name:'Chủ động cứu hỏa',description:'Cứu hỏa đang hoạt động phục vụ ít nhất 80% dân cư trong 1 ngày.',kind:'fire',target:80,xp:150,level:3,tool:'fire'},
  {id:'police-80',name:'Giữ an ninh',description:'Cảnh sát đang hoạt động phục vụ ít nhất 80% dân cư trong 1 ngày.',kind:'police',target:80,xp:150,level:3,tool:'police'},
  {id:'population-1000',name:'Đô thị nhỏ',description:'Giữ 1.000 cư dân có đủ nhà và tiện ích trong 1 ngày.',kind:'population',target:1000,xp:600,level:3,tool:'residential'},
  {id:'population-5000',name:'Thành phố phát triển',description:'Giữ 5.000 cư dân có đủ nhà và tiện ích trong 1 ngày.',kind:'population',target:5000,xp:2000,level:4,tool:'residential'},
  {id:'population-10000',name:'Đại đô thị',description:'Giữ 10.000 cư dân có đủ nhà và tiện ích trong 1 ngày.',kind:'population',target:10000,xp:4000,level:5,tool:'residential'}
];
