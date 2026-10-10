const KEY='bc26:catalog-favorites:v1';
let memory=null;
export function catalogFavorites(){
  if(memory)return new Set(memory);
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');memory=new Set(Array.isArray(raw)?raw.filter(k=>typeof k==='string'&&/^[a-z][a-zA-Z0-9-]*(:[a-z][a-z0-9-]*)?$/.test(k)).slice(0,200):[]);}
  catch{memory=new Set();}
  return new Set(memory);
}
export function toggleCatalogFavorite(key){
  const favorites=catalogFavorites();favorites.has(key)?favorites.delete(key):favorites.add(key);memory=favorites;
  try{localStorage.setItem(KEY,JSON.stringify([...favorites]));return{favorites,saved:true};}
  catch{return{favorites,saved:false};}
}
