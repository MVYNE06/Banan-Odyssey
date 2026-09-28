import { rand } from './utils.js';
import { SHAKE_DECAY, SLASH_ARC_DUR } from './constants.js';

// -- Canvas --
export const canvas = document.getElementById('gameCanvas');
export const ctx    = canvas.getContext('2d');
export const W = Math.min(window.innerWidth, 960);
export const H = Math.min(window.innerHeight * 0.92, 600);
canvas.width  = W;
canvas.height = H;

// -- Input --
export const keys = {};
export let mouseClick = false;
export const setMouseClick = v => { mouseClick = v; };

window.addEventListener('keydown', e => { keys[e.code] = true;  e.preventDefault(); });
window.addEventListener('keyup',   e => { keys[e.code] = false; });
canvas.addEventListener('mousedown', () => { mouseClick = true; });

// -- Particles --
export const particles = [];

export function spawnParticles(x, y, count, colorFn, o = {}) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(o.minSpeed || 80, o.maxSpeed || 320);
    particles.push({
      x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s - rand(0, o.upBias||0),
      life: 1, decay: rand(o.minDecay||1.5, o.maxDecay||3.5),
      r: rand(o.minR||2, o.maxR||5),
      color: colorFn(), glow: !!o.glow,
      gravity: o.gravity !== undefined ? o.gravity : 600,
    });
  }
}

export function spawnHitSparks(x, y) {
  spawnParticles(x,y,10,()=>`hsl(${rand(40,60)},100%,${rand(60,90)}%)`,{minSpeed:120,maxSpeed:400,upBias:150,minDecay:2,maxDecay:4,minR:2,maxR:5,glow:true});
  spawnParticles(x,y, 8,()=>`hsl(${rand(0,20)},100%,${rand(50,80)}%)`, {minSpeed:200,maxSpeed:500,upBias:100,minDecay:3,maxDecay:6,minR:1,maxR:3,glow:true});
}

export function spawnDeathExplosion(x, y, col) {
  spawnParticles(x,y,20,()=>col,     {minSpeed:80, maxSpeed:500,upBias:200,minDecay:0.8,maxDecay:2,minR:3,maxR:8,glow:true});
  spawnParticles(x,y,15,()=>'#fff',  {minSpeed:200,maxSpeed:700,             minDecay:2,  maxDecay:5,minR:1,maxR:3,glow:true});
}

export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx*dt; p.y += p.vy*dt;
    p.vy += p.gravity*dt; p.life -= p.decay*dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// -- Slash Arcs --
export const slashArcs = [];

export function spawnSlashArc(cx, cy, dirX, rm = 1) {
  const ba = dirX > 0 ? 0 : Math.PI;
  slashArcs.push({cx,cy,sa:ba-1.0,ea:ba+1.0,life:1,  decay:1/SLASH_ARC_DUR,   r:72*rm, lw:4,  col:'#ffffcc',gcol:'#fff'});
  slashArcs.push({cx,cy,sa:ba-1.3,ea:ba+1.3,life:0.8, decay:1.4/SLASH_ARC_DUR,r:92*rm, lw:2,  col:'#ffcc44',gcol:'#ffaa00'});
}

export function updateSlashArcs(dt) {
  for (let i = slashArcs.length - 1; i >= 0; i--) {
    slashArcs[i].life -= slashArcs[i].decay * dt;
    if (slashArcs[i].life <= 0) slashArcs.splice(i, 1);
  }
}

// -- Motion Trail --
export const trail = [];

export function pushTrail(x, y) {
  trail.push({ x, y, life: 1 });
  if (trail.length > 10) trail.shift();
}

export function updateTrail() {
  for (const t of trail) t.life = Math.max(0, t.life - 0.14);
}

// -- Screen Shake --
export let shakeX = 0, shakeY = 0, shakeMag = 0;

export function triggerShake(m) { shakeMag = Math.max(shakeMag, m); }

export function updateShake(dt) {
  shakeMag = Math.max(0, shakeMag - SHAKE_DECAY * dt);
  shakeX = (Math.random()*2-1) * shakeMag;
  shakeY = (Math.random()*2-1) * shakeMag;
}

// -- Hitstop --
export let hitstop = 0;
export const setHitstop = v => { hitstop = Math.max(hitstop, v); };
export const tickHitstop = dt => { hitstop = Math.max(0, hitstop - dt); };

export const nectars = [];
export function spawnNectar(x, y, count) {
  for(let i=0; i<count; i++) nectars.push({x,y,vx:rand(-150,150),vy:rand(-350,-150),life:15,r:4});
}
export function updateNectars(dt, platforms) {
  for(let i=nectars.length-1; i>=0; i--) {
    const n=nectars[i];
    n.vy+=600*dt; n.x+=n.vx*dt; n.y+=n.vy*dt; n.life-=dt;
    for(const p of platforms) {
      if(n.x>p.x && n.x<p.x+p.w && n.y>p.y && n.y<p.y+p.h) {
        n.y=p.y-n.r; n.vy*=-0.6; n.vx*=0.8;
      }
    }
    if(n.life<=0) nectars.splice(i,1);
  }
}

// -- Background Stars --
export const bgStars = Array.from({length:130}, () => ({
  x: rand(0,W), y: rand(0,H*0.78), r: rand(0.5,2.2),
  twinkle: rand(0,Math.PI*2),
  col: Math.random() < 0.28 ? '#9966ff' : '#ffffff',
}));
