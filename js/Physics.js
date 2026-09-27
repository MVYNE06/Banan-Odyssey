import { clamp } from './utils.js';
import { W, H } from './Engine.js';

export function aabb(ax,ay,aw,ah,bx,by,bw,bh) {
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

export function resolveVsPlatforms(e, plats) {
  const ew = e.w, eh = e.h;
  e.onGround = false;
  for (const plat of plats) {
    const ex = e.x-ew/2, ey = e.y-eh/2;
    if (!aabb(ex,ey,ew,eh, plat.x,plat.y,plat.w,plat.h)) continue;
    const oR=(ex+ew)-plat.x, oL=(plat.x+plat.w)-ex;
    const oB=(ey+eh)-plat.y, oT=(plat.y+plat.h)-ey;
    if (Math.min(oB,oT) < Math.min(oR,oL)) {
      if (oB<oT && e.vy>=0) { e.y=plat.y-eh/2; e.vy=0; e.onGround=true; }
      else if (e.vy<0)      { e.y=plat.y+plat.h+eh/2; e.vy=0; }
    } else {
      if (oR<oL) { e.x=plat.x-ew/2; e.vx=0; }
      else       { e.x=plat.x+plat.w+ew/2; e.vx=0; }
    }
  }
  if (e.x-ew/2 < 0)    { e.x=ew/2;     e.vx=0; }
  if (e.x+ew/2 > W)    { e.x=W-ew/2;   e.vx=0; }
  if (e.y+eh/2 > H-8)  { e.y=H-8-eh/2; e.vy=0; e.onGround=true; }
}
