// Original short UI tones, generated locally. No audio files, API or background loop.
export function createInterfaceAudio(){
  let preference={enabled:false,volume:.25},context=null;
  try{const saved=JSON.parse(localStorage.getItem('bc26:interface-audio:v1')||'{}');preference={enabled:saved.enabled===true,volume:Number.isFinite(saved.volume)?Math.max(0,Math.min(1,saved.volume)):.25};}catch{}
  const save=()=>{try{localStorage.setItem('bc26:interface-audio:v1',JSON.stringify(preference));}catch{}};
  async function play(kind='click'){
    if(!preference.enabled||!preference.volume||document.hidden)return;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      context??=new Audio();if(context.state==='suspended')await context.resume();
      const oscillator=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
      oscillator.type='sine';oscillator.frequency.setValueAtTime(kind==='build'?480:680,now);oscillator.frequency.exponentialRampToValueAtTime(kind==='build'?740:510,now+.07);
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(preference.volume*.12,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+.09);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start(now);oscillator.stop(now+.1);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    }catch{/* Sound availability never blocks a game action. */}
  }
  return{get preference(){return{...preference};},setEnabled(value){preference.enabled=!!value;save();if(value)void play();},setVolume(value){preference.volume=Math.max(0,Math.min(1,Number(value)||0));save();},play,dispose(){void context?.close();context=null;}};
}
