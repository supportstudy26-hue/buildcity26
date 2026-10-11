// Refresh live figures without unloading images, resetting scroll or replacing
// the button/input a player is using. Event handlers come from the fresh view.
const handlers=['onclick','onchange','oninput','onsubmit'];
function identity(node){return node.nodeType===1?[node.tagName,node.id,node.getAttribute('data-art-id'),node.getAttribute('data-mobility-id'),node.getAttribute('data-person')].join('|'):String(node.nodeType);}
function patchNode(current,next){
 if(current.nodeType!==1){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}
 const image=current.tagName==='IMG'&&current.getAttribute('data-art-id')===next.getAttribute('data-art-id')&&current.getAttribute('data-mobility-id')===next.getAttribute('data-mobility-id');
 for(const attr of [...current.attributes])if(!next.hasAttribute(attr.name)&&!(image&&['src','data-art-error','data-mobility-error'].includes(attr.name)))current.removeAttribute(attr.name);
 for(const attr of next.attributes)if(current.getAttribute(attr.name)!==attr.value)current.setAttribute(attr.name,attr.value);
 for(const name of handlers)current[name]=next[name];
 patchView(current,next);
 const editing=current===current.ownerDocument.activeElement;
 if(!editing&&['INPUT','TEXTAREA','SELECT'].includes(current.tagName)){
  if(current.value!==next.value)current.value=next.value;
  if('checked' in next)current.checked=next.checked;
 }
}
export function patchView(current,next){
 let cursor=current.firstChild;
 for(const desired of [...next.childNodes]){
  if(cursor&&identity(cursor)===identity(desired)){patchNode(cursor,desired);cursor=cursor.nextSibling;}
  else {current.insertBefore(desired,cursor);}
 }
 while(cursor){const following=cursor.nextSibling;current.removeChild(cursor);cursor=following;}
}
