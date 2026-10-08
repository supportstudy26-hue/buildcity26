// Administrative sea polygons are not physical land. Keep the source unchanged;
// only omit Khánh Hòa's fully offshore administrative components from land fill.
export function overviewLandGeometry(feature){
  if(feature.id!=='56'||feature.geometry.type!=='MultiPolygon')return feature.geometry;
  return {type:'MultiPolygon',coordinates:feature.geometry.coordinates.filter(poly=>!poly[0].every(p=>p[0]>110))};
}
export function projectOverview([lon,lat]){return [(lon-102)*45,20+(Math.log(Math.tan(Math.PI/4+24.5*Math.PI/360))-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360)))*2578];}
export function geographicViewBox([west,south,east,north]){const [x,y]=projectOverview([west,north]),[right,bottom]=projectOverview([east,south]);return [x,y,right-x,bottom-y];}
