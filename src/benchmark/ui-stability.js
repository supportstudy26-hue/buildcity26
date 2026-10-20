// On-demand QA only: no observer or sampling runs during ordinary play.
export async function measureUiStability(root,seconds=5){
 if(!root||!root.offsetHeight)throw new Error('Mở bảng thông tin trước khi đo.');
 const images=[...root.querySelectorAll('img')],controls=[...root.querySelectorAll('button,input,select')];
 const pane=root.closest('.bc26-drawer')||root;
 const scroll=pane.scrollTop,focus=root.ownerDocument.activeElement,initial=pane.getBoundingClientRect();
 let childRemovals=0,textChanges=0,blankImageFrames=0,detachedImageFrames=0,maxLayoutShiftPx=0,frames=0,maxVisibleImages=0;
 const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')textChanges++;if(r.type==='childList')childRemovals+=r.removedNodes.length;}});
 observer.observe(root,{subtree:true,childList:true,characterData:true});
 const started=performance.now();
 try{await new Promise(resolve=>{function sample(now){
  frames++;const box=pane.getBoundingClientRect();maxLayoutShiftPx=Math.max(maxLayoutShiftPx,Math.abs(box.x-initial.x),Math.abs(box.y-initial.y),Math.abs(box.width-initial.width),Math.abs(box.height-initial.height));
  if(images.some(im=>!im.isConnected))detachedImageFrames++;
  // Lazy thumbnails outside the clipped pane are intentionally unloaded.
  const visibleImages=images.filter(im=>{if(!im.isConnected)return false;const r=im.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>Math.max(0,box.top)&&r.top<Math.min(innerHeight,box.bottom)&&r.right>Math.max(0,box.left)&&r.left<Math.min(innerWidth,box.right);});
  maxVisibleImages=Math.max(maxVisibleImages,visibleImages.length);
  if(visibleImages.some(im=>!im.complete||!im.naturalWidth))blankImageFrames++;
  if(now-started>=seconds*1000)resolve();else requestAnimationFrame(sample);
 }requestAnimationFrame(sample);});}finally{observer.disconnect();}
 return {durationMs:Math.round(performance.now()-started),frames,images:images.length,maxVisibleImages,controls:controls.length,childRemovals,textChanges,blankImageFrames,detachedImageFrames,maxLayoutShiftPx,imagesRetained:images.every(im=>root.contains(im)),controlsRetained:controls.every(control=>root.contains(control)),scrollBefore:scroll,scrollAfter:pane.scrollTop,focusRetained:focus===root.ownerDocument.activeElement,viewport:{width:innerWidth,height:innerHeight}};
}
