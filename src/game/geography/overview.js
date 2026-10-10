// Equirectangular overview only. Never use screen pixels as city metres.
const COS=Math.cos(16*Math.PI/180),SCALE=45;
export const NATIONAL_VIEW=[-20,-10,800,840];
export function projectOverview([lon,lat]){return [(lon-101.5)*COS*SCALE,(24-lat)*SCALE];}
export function unprojectOverview([x,y]){return [101.5+x/(COS*SCALE),24-y/SCALE];}
export function geographicViewBox([west,south,east,north]){const a=projectOverview([west,north]),b=projectOverview([east,south]);return [a[0],a[1],b[0]-a[0],b[1]-a[1]];}
export function overviewLandGeometry(f){return f.geometry;}
export function overviewPath(geometry){const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;return polygons.map(poly=>poly.map(r=>r.map((p,i)=>`${i?'L':'M'}${projectOverview(p).map(n=>n.toFixed(5)).join(',')}`).join(' ')+'Z').join(' ')).join(' ');}
