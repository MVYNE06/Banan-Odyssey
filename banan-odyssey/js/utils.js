export const lerp  = (a,b,t) => a+(b-a)*t;
export const clamp = (v,mn,mx) => Math.min(mx,Math.max(mn,v));
export const rand  = (a,b) => Math.random()*(b-a)+a;
export const dist  = (ax,ay,bx,by) => Math.hypot(bx-ax,by-ay);
export const norm  = (x,y) => { const l=Math.hypot(x,y)||1; return [x/l,y/l]; };
