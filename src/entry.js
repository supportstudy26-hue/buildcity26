import {landingMarkup} from './ui/landing.js';
const home=document.getElementById('landing'),game=document.getElementById('game');
home.innerHTML=landingMarkup();
let boot;
function showHome(){home.hidden=false;game.inert=true;document.body.dataset.screen='home';document.getElementById('landingStatus').hidden=true;home.querySelector('.landing-current').focus({preventScroll:true});}
function showGame(){home.hidden=true;game.inert=false;document.body.dataset.screen='game';document.getElementById('world').focus({preventScroll:true});}
async function loadGame(){
 if(!boot)boot=import('./app.js').then(module=>module.gameReady).catch(error=>{boot=null;throw error;});
 return boot;
}
home.querySelector('.landing-brand').onclick=e=>{e.preventDefault();showHome();};
home.querySelectorAll('[data-home-action]').forEach(button=>button.onclick=async()=>{
 const action=button.dataset.homeAction;if(action==='home'){showHome();return;}
 const status=document.getElementById('landingStatus');status.hidden=false;status.textContent='Đang mở thành phố…';button.disabled=true;
 try{const api=await loadGame();status.hidden=true;
  if(action==='play')api.startBuilding();
  else if(action==='login'||action==='register')api.openAccount(action);
  else if(action==='map')api.openGeography();
  else if(action==='guide')api.openGuide();
  else{showGame();api.enterGame();if(action==='missions')api.openMissions();else api.openSaves();}
 }catch{status.hidden=false;status.textContent='Chưa mở được game. Hãy tải lại trang; bản lưu trên máy vẫn được giữ.';}
 finally{button.disabled=false;}
});
document.getElementById('homeBtn').onclick=()=>{showHome();};
document.addEventListener('bc26:home',showHome);
document.addEventListener('bc26:play',showGame);
if(location.protocol!=='file:'){home.hidden=false;game.inert=true;document.body.dataset.screen='home';}
