// One shared annulus per circle profile avoids overlapping coplanar box faces.
export function roadRingGeometry(T,inner,outer){const geometry=new T.RingGeometry(inner/outer*.5,.5,48);geometry.rotateX(-Math.PI/2);return geometry;}
