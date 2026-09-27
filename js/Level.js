import { rand } from './utils.js';
import { W, H } from './Engine.js';

export function generatePlatforms(wave) {
  const p = [{ x:0, y:H-60, w:W, h:60, poly:null }];
  const n = 5 + Math.min(wave, 4);
  const cols = 4, colW = W/cols;
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const pw = rand(90,190);
    const px = col*colW + rand(20, colW-pw-20);
    const py = Math.min(Math.max(H-160-rand(20,160)-Math.floor(i/cols)*80, H*0.18), H-180);
    p.push({ x:px, y:py, w:pw, h:18, poly:null });
  }
  return p;
}

export function platformPoly(plat) {
  if (plat.poly) return plat.poly;
  const pts=[], segs=Math.max(2,Math.ceil(plat.w/28));
  pts.push([plat.x, plat.y]);
  for (let i=1; i<segs; i++) {
    const jag = (i%2===0) ? rand(-5,1) : rand(-2,3);
    pts.push([plat.x+plat.w/segs*i, plat.y+jag]);
  }
  pts.push([plat.x+plat.w, plat.y]);
  pts.push([plat.x+plat.w, plat.y+plat.h]);
  pts.push([plat.x,        plat.y+plat.h]);
  plat.poly = pts;
  return pts;
}
