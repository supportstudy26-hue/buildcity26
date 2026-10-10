// Lightweight game weather, not a forecast or a flood/hydrology model.
// All transitions derive from the one simulation clock; no wall-clock timers.
export const WEATHER_MODES=['auto','clear','rain','heat'];
export function weatherState(s){const hour=Math.floor((s.clock?.seconds||0)/3600),phase=(Math.floor(hour/3)+(s.initialSeed||s.seed||0))%12,mode=s.weatherMode||'clear',kind=mode==='auto'?(phase<3?'rain':phase===8?'heat':'clear'):mode;return {kind,name:{clear:'Trời quang',rain:'Mưa · đường ướt',heat:'Nắng nóng'}[kind],temperature:kind==='heat'?36:kind==='rain'?25:29,roadSpeedFactor:kind==='rain'?.75:1,powerDemandFactor:kind==='heat'?1.15:1,waterDemandFactor:kind==='heat'?1.1:1,window:Math.floor(hour/3)};}
export function setWeatherMode(s,mode){if(!WEATHER_MODES.includes(mode))return {ok:false,message:'Chế độ thời tiết không hợp lệ.'};s.weatherMode=mode;return {ok:true};}
