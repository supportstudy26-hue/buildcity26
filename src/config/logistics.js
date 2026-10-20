// Original game design values. BC × 1,000 = displayed game đồng.
// One goods unit is a standard shipment crate, not a tonne.
export const LOGISTICS_VERSION=1;
export const GOODS=Object.freeze({agricultural:{name:'Nông sản / nguyên liệu',importPrice:6,salePrice:9},food:{name:'Thực phẩm',importPrice:12,salePrice:18},manufactured:{name:'Hàng sản xuất',importPrice:20,salePrice:30}});
const profiles={
 farm:{name:'Nông trại',posts:8,capacity:120,recipe:{input:{},output:{agricultural:8},seconds:30,cost:2}},
 food_factory:{name:'Xưởng thực phẩm',posts:12,capacity:160,recipe:{input:{agricultural:6},output:{food:4},seconds:30,cost:3}},
 industrial_plant:{name:'Xưởng sản xuất',posts:12,capacity:160,recipe:{input:{agricultural:4},output:{manufactured:3},seconds:40,cost:4}},
 warehouse:{name:'Kho hàng',posts:4,capacity:240},
 shop:{name:'Cửa hàng',posts:4,capacity:80}
};
export const LOGISTICS_PROFILES=Object.freeze({...profiles,freightWarehouse:profiles.warehouse,foodFactory:profiles.food_factory});
export const LOGISTICS_CATALOG=Object.freeze({
 farm:{name:'Nông trại',group:'services',icon:'farm',cost:220000,upkeep:1200,range:0,jobs:8,service:'farm',color:'#8baa58',desc:'8 vị trí việc làm. Người làm tới nông trại mới tạo nông sản; xe chở hàng tới kho và xưởng trên đường thực. 120 thùng sức chứa.'},
 freightWarehouse:{name:'Kho hàng thành phố',group:'transport',icon:'warehouse',cost:350000,upkeep:1400,range:0,jobs:4,service:'warehouse',color:'#8293a1',desc:'240 thùng sức chứa; nhận nông sản, thực phẩm và hàng sản xuất, phân phối bằng xe tải. Cần đường, điện, nước và nhân viên.'},
 foodFactory:{name:'Xưởng thực phẩm',group:'services',icon:'factory',cost:680000,upkeep:2400,range:0,jobs:12,service:'food_factory',color:'#bd9770',desc:'Nhận 6 thùng nông sản để chế biến 4 thùng thực phẩm mỗi 30 giây game khi nhân viên có mặt. 160 thùng sức chứa.'}
});
export const FREIGHT_CAPACITY=24;
export const MAX_FREIGHT_TRUCKS=12;
export const ORDER_DEADLINE_SECONDS=180;
export const LOGISTICS_KINDS=Object.freeze(['farm','freightWarehouse','foodFactory']);
export function logisticsKind(t){
 if(!t)return null;
 if(t.kind==='farm')return 'farm';
 if(t.kind==='freightWarehouse')return 'warehouse';
 if(t.kind==='foodFactory')return 'food_factory';
 if(t.kind==='commercial')return t.development?.designId==='glass-office'?null:'shop';
 if(t.kind==='industrial')return t.development?.designId==='warehouse'?'warehouse':t.development?.designId==='processing'?'food_factory':'industrial_plant';
 return null;
}
export function logisticsPosts(t){const kind=logisticsKind(t);return LOGISTICS_KINDS.includes(t?.kind)?LOGISTICS_PROFILES[kind].posts:0;}
