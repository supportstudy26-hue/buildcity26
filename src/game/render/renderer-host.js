import {CityRenderer} from '../renderer.js';
const PREF='bc26:graphics';
export async function createRenderer(input,mini,getCity){
  let view=document.createElement('canvas');view.id='world3d';view.setAttribute('aria-hidden','true');input.before(view);
  let backend,loading=false,notice='',preference;
  try{preference=JSON.parse(localStorage.getItem(PREF)||'{}');}catch{preference={};}
  async function switchMode(mode){
    if(loading)return false;if(backend?.mode===mode)return true;loading=true;
    const old=backend,settings=old?{tool:old.tool,layer:old.layer,night:old.night,selected:old.selected,follow:old.follow}:{};
    try{
      if(mode==='3d'){
        const {ThreeCityRenderer}=await import('./three-renderer.js');
        view.remove();view=document.createElement('canvas');view.id='world3d';view.setAttribute('aria-hidden','true');input.before(view);
        backend=new ThreeCityRenderer(input,mini,getCity,view);backend.onContextLost=()=>{notice='WebGL bị ngắt; đã chuyển sang Canvas nhẹ. Bạn có thể bật lại 3D trong cài đặt.';void switchMode('2d');};view.hidden=false;input.style.opacity='0';
      }else{backend=new CityRenderer(input,mini,getCity);backend.mode='2d';view.hidden=true;input.style.opacity='1';}
    }catch(error){
      notice='Thiết bị chưa chạy được WebGL 3D; game dùng Canvas nhẹ và vẫn xây/lưu bình thường.';
      backend=new CityRenderer(input,mini,getCity);backend.mode='2d';view.hidden=true;input.style.opacity='1';
    }
    if(old)old.dispose();Object.assign(backend,settings);if(backend.setQuality)backend.setQuality(preference.quality||'auto');
    preference.mode=backend.mode;try{localStorage.setItem(PREF,JSON.stringify(preference));}catch{}loading=false;return backend.mode===mode;
  }
  await switchMode(preference.mode||'3d');
  const host={setMode:switchMode,get notice(){const n=notice;notice='';return n;},setQuality(value){preference.quality=value;backend.setQuality?.(value);try{localStorage.setItem(PREF,JSON.stringify(preference));}catch{}},stats(){return backend.stats?.()||{mode:'2d',quality:'light',citizens:getCity().citizens.length};}};
  return new Proxy(host,{get:(target,key)=>key in target?target[key]:typeof backend[key]==='function'?backend[key].bind(backend):backend[key],set:(target,key,value)=>{backend[key]=value;return true;}});
}
