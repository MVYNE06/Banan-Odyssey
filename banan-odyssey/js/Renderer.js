import { ctx, W, H, particles, slashArcs, trail, bgStars } from './Engine.js';
import { platformPoly } from './Level.js';
import { nectars } from './Engine.js';

const FONT = "'Cinzel', Georgia, serif";

// ---- Shared draw helpers ----
function drawBanana(cx, cy, dir, w, h, color, glowAmt) {
  ctx.save();
  ctx.translate(cx,cy);
  if (dir<0) ctx.scale(-1,1);
  ctx.scale(Math.max(w,h)/30, Math.max(w,h)/30);

  ctx.save(); ctx.globalCompositeOperation='lighter';
  const bz=ctx.createRadialGradient(0,0,4,0,0,26);
  bz.addColorStop(0,'rgba(201,162,75,0.35)'); bz.addColorStop(1,'rgba(120,60,20,0)');
  ctx.fillStyle=bz; ctx.beginPath(); ctx.arc(0,0,26,0,Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.save(); ctx.translate(0,-15);
  ctx.shadowBlur=16; ctx.shadowColor='#ff2200'; ctx.fillStyle='#c81c1c';
  ctx.beginPath();
  ctx.moveTo(-1,3); ctx.quadraticCurveTo(-8,-9,-1,-17);
  ctx.quadraticCurveTo(1,-9,0,-2); ctx.quadraticCurveTo(2,-10,8,-16);
  ctx.quadraticCurveTo(3,-7,1,3); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,120,80,0.4)';
  ctx.beginPath(); ctx.moveTo(-0.5,1); ctx.quadraticCurveTo(-4,-9,-0.5,-15); ctx.quadraticCurveTo(0,-8,0,1); ctx.closePath(); ctx.fill();
  ctx.restore();

  if (glowAmt>0) { ctx.shadowBlur=glowAmt; ctx.shadowColor='#ffcc00'; }
  ctx.beginPath();
  ctx.arc(0,0,14,Math.PI*0.15,Math.PI*1.85);
  ctx.arc(3,0,10,Math.PI*1.85,Math.PI*0.15,true);
  ctx.closePath();
  ctx.fillStyle=color; ctx.fill();
  ctx.beginPath();
  ctx.arc(0,0,11,Math.PI*0.32,Math.PI*1.68);
  ctx.arc(2,0, 8,Math.PI*1.68,Math.PI*0.32,true);
  ctx.closePath();
  ctx.fillStyle='rgba(255,255,200,0.28)'; ctx.fill();
  ctx.shadowBlur=glowAmt*0.5; ctx.fillStyle='#cc8800';
  ctx.beginPath(); ctx.arc(0,-14,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 14,3,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function hpBar(x,y,w,ratio,col) {
  ctx.fillStyle='#1a0505'; ctx.fillRect(x,y,w,5);
  ctx.fillStyle=col; ctx.fillRect(x,y,w*Math.max(0,ratio),5);
}

// ---- Public draw calls ----
export function drawBackground(t) {
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#050208'); bg.addColorStop(0.55,'#0c0505'); bg.addColorStop(1,'#160404');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  ctx.save(); ctx.globalCompositeOperation='lighter';
  for (let i=0;i<3;i++) {
    const nx=W*(0.18+i*0.32)+Math.sin(t*0.07+i*1.4)*25;
    const ny=H*0.28+Math.cos(t*0.055+i*2.1)*35;
    const ng=ctx.createRadialGradient(nx,ny,8,nx,ny,160+i*35);
    ng.addColorStop(0,i===1?'rgba(140,10,10,0.11)':'rgba(90,20,0,0.09)');
    ng.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ng; ctx.beginPath();
    ctx.ellipse(nx,ny,190+i*50,85+i*25,t*0.012+i,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  for (const s of bgStars) {
    s.twinkle+=0.025;
    const a=Math.max(0.05,0.35+Math.sin(s.twinkle)*0.4);
    ctx.save(); ctx.globalAlpha=a;
    ctx.fillStyle=s.col; ctx.shadowBlur=5; ctx.shadowColor=s.col;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
}

export function drawPlatforms(platforms) {
  for (const plat of platforms) {
    const poly=platformPoly(plat);
    ctx.save();
    ctx.shadowBlur=12; ctx.shadowColor='#000';
    const pg=ctx.createLinearGradient(plat.x,plat.y,plat.x,plat.y+plat.h);
    pg.addColorStop(0,'#2b2622'); pg.addColorStop(0.5,'#1a1613'); pg.addColorStop(1,'#0a0806');
    ctx.fillStyle=pg;
    ctx.beginPath();
    ctx.moveTo(poly[0][0],poly[0][1]);
    for (let i=1;i<poly.length;i++) ctx.lineTo(poly[i][0],poly[i][1]);
    ctx.closePath(); ctx.fill();

    const tc=Math.ceil(plat.w/28)+1;
    ctx.strokeStyle='#4a4034'; ctx.lineWidth=2; ctx.shadowBlur=4; ctx.shadowColor='#000';
    ctx.beginPath(); ctx.moveTo(poly[0][0],poly[0][1]);
    for (let i=1;i<tc;i++) ctx.lineTo(poly[i][0],poly[i][1]);
    ctx.stroke();

    const seed=Math.floor(plat.x*3+plat.y);
    const cx0=plat.x+plat.w*0.12+(seed%Math.max(1,Math.floor(plat.w*0.3)));
    const cy0=plat.y+plat.h*0.5;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='#ff4400'; ctx.lineWidth=1.4; ctx.shadowBlur=9; ctx.shadowColor='#ff2200';
    ctx.beginPath(); ctx.moveTo(cx0,cy0);
    ctx.lineTo(cx0+plat.w*0.16,cy0+3); ctx.lineTo(cx0+plat.w*0.27,cy0-4);
    ctx.lineTo(cx0+plat.w*0.4, cy0+4);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
}

export function drawSlashArcs() {
  for (const arc of slashArcs) {
    const a=Math.pow(Math.max(0,arc.life),0.5);
    ctx.save(); ctx.globalAlpha=a; ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle=arc.col; ctx.shadowColor=arc.gcol; ctx.shadowBlur=22;
    ctx.lineWidth=arc.lw; ctx.lineCap='round';
    const r=arc.r*(1+(1-arc.life)*0.25);
    ctx.beginPath(); ctx.arc(arc.cx,arc.cy,r,arc.sa,arc.ea); ctx.stroke();
    ctx.lineWidth=arc.lw*0.35; ctx.strokeStyle='#fff'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(arc.cx,arc.cy,r,arc.sa,arc.ea); ctx.stroke();
    ctx.restore();
  }
}

export function drawParticles() {
  for (const p of particles) {
    const a=Math.max(0,p.life);
    ctx.save(); ctx.globalAlpha=a;
    if (p.glow) { ctx.shadowBlur=p.r*4; ctx.shadowColor=p.color; ctx.globalCompositeOperation='lighter'; }
    ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(0.5,p.r*a),0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  for (const n of nectars) {
    ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.shadowBlur=8; ctx.shadowColor='#ffaa00'; ctx.fillStyle='#ffff44';
    ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

export function drawPlayer(player) {
  // Trail
  for (let i=0;i<trail.length;i++) {
    const t=trail[i]; if (t.life<0.05) continue;
    ctx.save(); ctx.globalAlpha=t.life*0.3*((i+1)/trail.length);
    ctx.globalCompositeOperation='lighter';
    drawBanana(t.x,t.y,player.facingDir,player.w,player.h,'#ffaa00',0);
    ctx.restore();
  }
  const alpha=player.iFrames>0?(Math.sin(player.iFrames*35)>0?0.32:0.9):1;
  const bobY =player.state==='idle'?Math.sin(player.bobPhase)*2:0;
  const glow =20+Math.sin(player.glowPulse)*8;
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const hg=ctx.createRadialGradient(player.x,player.y+bobY,4,player.x,player.y+bobY,50);
  hg.addColorStop(0,'rgba(255,200,0,0.20)'); hg.addColorStop(1,'rgba(255,80,0,0)');
  ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(player.x,player.y+bobY,50,0,Math.PI*2); ctx.fill();
  ctx.restore();
  if (player.onGround) {
    ctx.save(); ctx.globalAlpha=0.22*alpha; ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(player.x,player.y+player.h/2+3,14,4,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
  drawBanana(player.x,player.y+bobY,player.facingDir,player.w,player.h,'#ffe033',glow);
  ctx.restore();
}

export function drawEnemies(enemies) {
  for (const e of enemies) {
    if (e.type==='mite') _drawMite(e);
    else if (e.type==='turret') _drawTurret(e);
    else _drawBoss(e);
  }
}

function _drawBoss(e) {
  const enraged = e.hp < e.maxHp*0.5;
  const eyeCol = e.hurtFlash > 0 ? '#fff' : '#ff1100';
  const pulse = 14+Math.sin(e.glowPulse*(enraged?6:3))*8;

  ctx.save(); ctx.translate(e.x,e.y);

  ctx.shadowBlur=16; ctx.shadowColor='#000'; ctx.fillStyle='#0a0a0c';
  ctx.beginPath();
  ctx.moveTo(-e.w/2,     e.h/2);
  ctx.lineTo(-e.w/2-6,   e.h*0.1);
  ctx.lineTo(-e.w/2+4,  -e.h*0.2);
  ctx.lineTo(-e.w*0.22, -e.h/2-10);
  ctx.lineTo(0,         -e.h/2);
  ctx.lineTo(e.w*0.22,  -e.h/2-10);
  ctx.lineTo(e.w/2-4,   -e.h*0.2);
  ctx.lineTo(e.w/2+6,    e.h*0.1);
  ctx.lineTo(e.w/2,      e.h/2);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle=e.hurtFlash>0?'#fff':'#c98a2e'; ctx.lineWidth=5;
  ctx.shadowBlur=10; ctx.shadowColor='#c98a2e';
  ctx.beginPath(); ctx.moveTo(-e.w/2,e.h*0.05); ctx.lineTo(e.w/2,e.h*0.05); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-e.w*0.3,e.h*0.35); ctx.lineTo(e.w*0.3,e.h*0.35); ctx.stroke();

  ctx.save(); ctx.globalCompositeOperation='lighter';
  const eg=ctx.createRadialGradient(0,-e.h*0.08,2,0,-e.h*0.08,pulse*2.4);
  eg.addColorStop(0,'rgba(255,20,0,0.9)'); eg.addColorStop(1,'rgba(255,0,0,0)');
  ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(0,-e.h*0.08,pulse*2.4,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.shadowBlur=pulse; ctx.shadowColor=eyeCol; ctx.fillStyle=eyeCol;
  ctx.beginPath(); ctx.arc(0,-e.h*0.08,pulse*0.55,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#220000'; ctx.shadowBlur=0;
  ctx.beginPath(); ctx.arc(0,-e.h*0.08,pulse*0.18,0,Math.PI*2); ctx.fill();

  const spinSpeed = e.isPulling ? (enraged?45:25) : (enraged?15:5);
  ctx.save(); ctx.translate(0, e.h/4); ctx.rotate(e.glowPulse * spinSpeed);
  ctx.fillStyle='#c98a2e'; ctx.shadowBlur=8; ctx.shadowColor='#c98a2e';
  ctx.fillRect(-e.w/1.5, -3, e.w*1.3, 6);
  ctx.fillRect(-3, -e.w/1.5, 6, e.w*1.3);
  ctx.restore();

  ctx.restore();
  if (e.hp<e.maxHp) hpBar(e.x-e.w/2,e.y-e.h/2-20,e.w,e.hp/e.maxHp,'#ff1100');
  for (const o of e.orbs) {
    ctx.save(); ctx.fillStyle='#f33'; ctx.shadowBlur=10; ctx.shadowColor='#f00';
    ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
}

function _drawMite(e) {
  e.glowPulse+=0.04;
  const col=e.hurtFlash>0?'#fff':'#ff3333';
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const aura=ctx.createRadialGradient(e.x,e.y,2,e.x,e.y,30);
  aura.addColorStop(0,'rgba(255,50,0,0.32)'); aura.addColorStop(1,'rgba(180,0,0,0)');
  ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(e.x,e.y,30,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.save();
  ctx.shadowBlur=14+Math.sin(e.glowPulse)*6; ctx.shadowColor='#f00'; ctx.fillStyle=col;
  ctx.beginPath(); ctx.arc(e.x,e.y,12,0,Math.PI*2); ctx.fill();
  const px=Math.cos(e.pupilAngle)*4, py=Math.sin(e.pupilAngle)*4;
  ctx.fillStyle='#220000'; ctx.shadowBlur=0;
  ctx.beginPath(); ctx.arc(e.x+px,e.y+py,5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#ff6666'; ctx.lineWidth=1.5; ctx.shadowBlur=8; ctx.shadowColor='#f44';
  ctx.beginPath(); ctx.arc(e.x+px,e.y+py,3,0,Math.PI*2); ctx.stroke();
  ctx.restore();
  if (e.hp<e.maxHp) hpBar(e.x-16,e.y-20,32,e.hp/e.maxHp,'#f33');
}

function _drawTurret(e) {
  e.glowPulse+=0.025;
  const col=e.hurtFlash>0?'#fff':'#aa33ff';
  const ga=12+Math.sin(e.glowPulse)*5;
  ctx.save(); ctx.translate(e.x,e.y);

  ctx.shadowBlur=8; ctx.shadowColor='#000'; ctx.fillStyle='#3a3630';
  ctx.fillRect(-e.w/2, -e.h/2+6, e.w, e.h-12);
  ctx.fillStyle='#4a4438';
  ctx.fillRect(-e.w/2-5, -e.h/2,   e.w+10, 10);
  ctx.fillRect(-e.w/2-5,  e.h/2-6, e.w+10, 10);

  ctx.strokeStyle='#221f1a'; ctx.lineWidth=2;
  for (let i=1;i<4;i++) {
    const fx=-e.w/2+e.w/4*i;
    ctx.beginPath(); ctx.moveTo(fx,-e.h/2+8); ctx.lineTo(fx,e.h/2-8); ctx.stroke();
  }
  ctx.strokeStyle='#151210'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(-e.w*0.3,-e.h*0.12); ctx.lineTo(e.w*0.08,e.h*0.04); ctx.lineTo(-e.w*0.05,e.h*0.34);
  ctx.stroke();

  ctx.save(); ctx.globalCompositeOperation='lighter';
  const og=ctx.createRadialGradient(0,0,1,0,0,ga*2.2);
  og.addColorStop(0,'rgba(200,100,255,0.7)'); og.addColorStop(1,'rgba(80,0,180,0)');
  ctx.fillStyle=og; ctx.beginPath(); ctx.arc(0,0,ga*2.2,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.fillStyle=col; ctx.shadowBlur=ga; ctx.shadowColor='#8800ff';
  ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(6,0); ctx.lineTo(0,9); ctx.lineTo(-6,0); ctx.closePath(); ctx.fill();

  ctx.restore();
  for (const orb of e.orbs) {
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const og2=ctx.createRadialGradient(orb.x,orb.y,1,orb.x,orb.y,orb.r*2.8);
    og2.addColorStop(0,'rgba(200,100,255,0.85)'); og2.addColorStop(1,'rgba(80,0,180,0)');
    ctx.fillStyle=og2; ctx.beginPath(); ctx.arc(orb.x,orb.y,orb.r*2.8,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.fillStyle='#cc88ff'; ctx.shadowBlur=14; ctx.shadowColor='#8800ff';
    ctx.beginPath(); ctx.arc(orb.x,orb.y,orb.r,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
  if (e.hp<e.maxHp) hpBar(e.x-18,e.y-26,36,e.hp/e.maxHp,'#a3f');
}

export function drawVignette() {
  const vig=ctx.createRadialGradient(W/2,H/2,H*0.22,W/2,H/2,H*0.86);
  vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
}

export function drawScanlines() {
  ctx.save(); ctx.globalAlpha=0.035; ctx.fillStyle='#000';
  for (let y=0;y<H;y+=4) ctx.fillRect(0,y,W,2);
  ctx.restore();
}

export function drawTitleScreen(t, W, H) {
  drawBackground(t);
  ctx.save(); ctx.textAlign='center';
  ctx.font=`bold 13px ${FONT}`; ctx.fillStyle='#c9a24b';
  ctx.shadowBlur=10; ctx.shadowColor='#8a0303';
  ctx.fillText('T H E',W/2,H/2-90);
  const pulse=Math.sin(t*1.8)*4;
  ctx.font=`bold 50px ${FONT}`; ctx.shadowBlur=32; ctx.shadowColor='#c81c1c';
  const tg=ctx.createLinearGradient(W/2-200,0,W/2+200,0);
  tg.addColorStop(0,'#8a0303'); tg.addColorStop(0.5,'#d4af37'); tg.addColorStop(1,'#8a0303');
  ctx.fillStyle=tg; ctx.fillText('BANAN-ODYSSEY',W/2,H/2-30+pulse);
  ctx.font=`bold 26px ${FONT}`; ctx.fillStyle='#c98a2e';
  ctx.shadowColor='#8a0303'; ctx.shadowBlur=18;
  ctx.fillText('T A R T A R U S',W/2,H/2+14);
  ctx.globalAlpha=0.85;
  ctx.save(); ctx.translate(W/2+200,H/2-20);
  ctx.scale(70/30,80/30); ctx.shadowBlur=38+Math.sin(t*3)*6; ctx.shadowColor='#ffcc00';
  ctx.beginPath(); ctx.arc(0,0,14,Math.PI*0.15,Math.PI*1.85); ctx.arc(3,0,10,Math.PI*1.85,Math.PI*0.15,true);
  ctx.closePath(); ctx.fillStyle='#ffe033'; ctx.fill(); ctx.restore();
  ctx.globalAlpha=1;
  if (Math.sin(t*4)>0) {
    ctx.font=`15px ${FONT}`; ctx.fillStyle='#d4af37'; ctx.shadowBlur=8; ctx.shadowColor='#c9a24b';
    ctx.fillText('PRESS SPACE OR CLICK TO BEGIN',W/2,H/2+74);
  }
  ctx.font=`11px ${FONT}`; ctx.fillStyle='#6b5a30'; ctx.shadowBlur=0;
  ctx.fillText('A/D: MOVE  |  SPACE/W: JUMP  |  SHIFT: DODGE ROLL  |  CLICK/J: SLASH',W/2,H/2+102);
  ctx.restore();
}

export function drawDeadScreen(t, score, wave, W, H) {
  ctx.save(); ctx.fillStyle='rgba(30,0,0,0.72)'; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';
  ctx.font=`bold 46px ${FONT}`; ctx.fillStyle='#c81c1c'; ctx.shadowBlur=28; ctx.shadowColor='#8a0303';
  ctx.fillText('THE ODYSSEY ENDS',W/2,H/2-28);
  ctx.font=`18px ${FONT}`; ctx.fillStyle='#c9a24b'; ctx.shadowColor='#c9a24b'; ctx.shadowBlur=10;
  ctx.fillText(`SCORE: ${score}  —  WAVE ${wave}`,W/2,H/2+16);
  if (Math.sin(t*4)>0) {
    ctx.font=`14px ${FONT}`; ctx.fillStyle='#d4af37'; ctx.shadowBlur=8;
    ctx.fillText('PRESS SPACE TO DESCEND AGAIN',W/2,H/2+58);
  }
  ctx.restore();
}

export function drawWaveClear(t, wave, W, H) {
  ctx.save(); ctx.textAlign='center';
  const pulse=Math.sin(t*6)*3;
  ctx.font=`bold 34px ${FONT}`;
  const wg=ctx.createLinearGradient(W/2-160,0,W/2+160,0);
  wg.addColorStop(0,'#c98a2e'); wg.addColorStop(0.5,'#f0d888'); wg.addColorStop(1,'#c98a2e');
  ctx.fillStyle=wg; ctx.shadowBlur=22; ctx.shadowColor='#d4af37';
  ctx.fillText(`WAVE ${wave} CLEARED!`,W/2,H/2+pulse);
  ctx.font=`13px ${FONT}`; ctx.fillStyle='#8a3a3a';
  ctx.shadowColor='#8a0303'; ctx.shadowBlur=10;
  ctx.fillText('Descending deeper into Tartarus...',W/2,H/2+42);
  ctx.restore();
}

export function drawVictoryScreen(t, W, H) {
  ctx.save(); ctx.fillStyle='rgba(15,8,0,0.72)'; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';
  ctx.font=`bold 46px ${FONT}`; ctx.fillStyle='#d4af37'; ctx.shadowBlur=28; ctx.shadowColor='#c98a2e';
  ctx.fillText('ITHACA REACHED',W/2,H/2-28);
  if (Math.sin(t*4)>0) {
    ctx.font=`14px ${FONT}`; ctx.fillStyle='#f0d888'; ctx.shadowBlur=8;
    ctx.fillText('PRESS SPACE TO RESTART',W/2,H/2+58);
  }
  ctx.restore();
}

export function drawUpgradeScreen(W, H, upgrades, selected) {
  ctx.save(); ctx.fillStyle='rgba(5,3,3,0.85)'; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center'; ctx.font=`bold 32px ${FONT}`; ctx.fillStyle='#c98a2e';
  ctx.shadowBlur=14; ctx.shadowColor='#8a0303';
  ctx.fillText('OFFERINGS OF THE GODS', W/2, H/2 - 120);
  for (let i=0; i<upgrades.length; i++) {
    const u = upgrades[i], px = W/2 + (i-1)*240, py = H/2 - 40;
    ctx.fillStyle = i===selected ? '#2a1010' : '#120808';
    ctx.strokeStyle = i===selected ? '#c9a24b' : '#4a3020';
    ctx.lineWidth = 2; ctx.shadowBlur = i===selected?12:0; ctx.shadowColor='#8a0303';
    ctx.fillRect(px-100, py, 200, 120); ctx.strokeRect(px-100, py, 200, 120);
    ctx.fillStyle='#f0d888'; ctx.font=`16px ${FONT}`; ctx.shadowBlur=0;
    ctx.fillText(u.name, px, py+50);
    ctx.fillStyle='#c98a2e'; ctx.font=`14px ${FONT}`;
    ctx.fillText(u.cost + ' NECTAR', px, py+90);
  }
  ctx.fillStyle='#d4af37'; ctx.font=`14px ${FONT}`;
  ctx.fillText('A/D TO SELECT  |  SPACE TO BUY', W/2, H/2+140);
  ctx.restore();
}
