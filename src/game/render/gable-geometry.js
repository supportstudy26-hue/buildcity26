// One shared eight-triangle roof prism for every pitched roof in the city.
export function createGableGeometry(T){
  const v=[[-.5,-.5,.5],[.5,-.5,.5],[0,.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[0,.5,-.5]];
  const faces=[0,1,2,4,3,5,3,0,2,3,2,5,1,4,5,1,5,2,3,4,1,3,1,0],positions=faces.flatMap(i=>v[i]);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;
}
