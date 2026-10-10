// WGS84 / UTM, northern hemisphere. Snyder Transverse Mercator series (USGS PP1395).
const A=6378137,E=0.0066943799901413165,K=.9996,R=Math.PI/180;
function zone(crs){const m=/^EPSG:326(\d{2})$/.exec(crs);if(!m||+m[1]<1||+m[1]>60)throw new Error('Phép chiếu UTM không hợp lệ.');return +m[1];}
export function wgs84ToUtm([lon,lat],crs){
  const z=zone(crs),p=lat*R,l=(lon-(z*6-183))*R,s=Math.sin(p),c=Math.cos(p),t=Math.tan(p)**2,ep=E/(1-E),C=ep*c*c,N=A/Math.sqrt(1-E*s*s),a=c*l;
  const M=A*((1-E/4-3*E**2/64-5*E**3/256)*p-(3*E/8+3*E**2/32+45*E**3/1024)*Math.sin(2*p)+(15*E**2/256+45*E**3/1024)*Math.sin(4*p)-35*E**3/3072*Math.sin(6*p));
  return [500000+K*N*(a+(1-t+C)*a**3/6+(5-18*t+t*t+72*C-58*ep)*a**5/120),K*(M+N*Math.tan(p)*(a*a/2+(5-t+9*C+4*C*C)*a**4/24+(61-58*t+t*t+600*C-330*ep)*a**6/720))];
}
export function utmToWgs84([e,n],crs){
  const z=zone(crs),ep=E/(1-E),e1=(1-Math.sqrt(1-E))/(1+Math.sqrt(1-E)),mu=n/K/(A*(1-E/4-3*E**2/64-5*E**3/256));
  const p=mu+(3*e1/2-27*e1**3/32)*Math.sin(2*mu)+(21*e1**2/16-55*e1**4/32)*Math.sin(4*mu)+151*e1**3/96*Math.sin(6*mu)+1097*e1**4/512*Math.sin(8*mu),s=Math.sin(p),c=Math.cos(p),t=Math.tan(p)**2,C=ep*c*c,N=A/Math.sqrt(1-E*s*s),rho=A*(1-E)/(1-E*s*s)**1.5,D=(e-500000)/(N*K);
  const lat=p-N*Math.tan(p)/rho*(D*D/2-(5+3*t+10*C-4*C*C-9*ep)*D**4/24+(61+90*t+298*C+45*t*t-252*ep-3*C*C)*D**6/720);
  const lon=(D-(1+2*t+C)*D**3/6+(5-2*C+28*t-3*C*C+8*ep+24*t*t)*D**5/120)/c;
  return [(z*6-183)+lon/R,lat/R];
}
export function localToWgs84([x,y],g){return utmToWgs84([g.utmOrigin[0]+x,g.utmOrigin[1]-y],g.crs);}
export function wgs84ToLocal(point,g){const [e,n]=wgs84ToUtm(point,g.crs);return [e-g.utmOrigin[0],g.utmOrigin[1]-n];}
