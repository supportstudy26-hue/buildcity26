export function designHash(x,y){let n=(Math.imul(x+19,374761393)^Math.imul(y+37,668265263))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return(n^(n>>>16))>>>0;}
