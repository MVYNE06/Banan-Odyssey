import { ctx, W, H, keys, mouseClick, setMouseClick, updateParticles, updateSlashArcs, particles, slashArcs, trail, triggerShake, shakeX, shakeY, updateShake, hitstop, tickHitstop, setHitstop, spawnDeathExplosion, nectars, updateNectars } from './Engine.js';
import { Player } from './Player.js';
import { EnemyManager } from './Enemies.js';
import { generatePlatforms } from './Level.js';
import { drawBackground, drawPlatforms, drawSlashArcs, drawParticles, drawPlayer, drawEnemies, drawVignette, drawScanlines, drawTitleScreen, drawDeadScreen, drawWaveClear, drawPauseScreen, drawUpgradeScreen } from './Renderer.js';
import { dist } from './utils.js';
import { audio } from './AudioManager.js';

// -- DOM refs --
const hpFill   = document.getElementById('hpFill');
const waveInfo = document.getElementById('waveInfo');
const scoreEl  = document.getElementById('score');
const nectarUi = document.getElementById('nectarUi');

// -- Game state --
let gameState = 'title'; // title | playing | dead | waveclear | upgrade | victory
let score = 0, wave = 1;
let platforms = [];
let waveClearDelay = 0;
let totalTime = 0, lastTime = 0;

let player   = new Player(W/2, H-200);
const enemyMgr = new EnemyManager();
let upgrades = [];
let upgradeSel = 0, pauseSel = 0, deadAge = 0, best = 0;
try { best = +localStorage.getItem('bo_best') || 0; } catch {}

// -- Wave lifecycle --
function startWave(w) {
  wave = w;
  audio.setTempo(w);
  platforms = generatePlatforms(w);
  enemyMgr.buildWave(w);
  particles.length = 0;
  slashArcs.length = 0;
  trail.length = 0;
  nectars.length = 0;
  player.hp = Math.min(player.maxHp, player.hp + 25);
  syncHUD();
}

function syncHUD() {
  hpFill.style.width = (Math.max(0,player.hp)/player.maxHp*100)+'%';
  waveInfo.textContent = `WAVE ${wave}${wave%5===0?' - BOSS':''}`;
  scoreEl.textContent  = `SCORE: ${score}`;
  if (nectarUi) nectarUi.textContent = `NECTAR: ${player.nectar}`;
}

// -- Slash handler injected into Player --
function onSlash() {
  const killed = enemyMgr.slashCheck(player.slashOriginX, player.y, 20+wave*2, player.slashReach);
  score += 10 + killed*50;
}

// -- Upgrades --
function rollUpgrades() {
  const j=player.maxJumps, d=player.maxDashes, r=Math.round(player.slashReach*100);
  const pool = [
    {name:'+1 MAX DASH', desc:`DASHES ${d} > ${d+1}`, cost:10, apply:()=>{ player.maxDashes++; player.dashes=player.maxDashes; }},
    {name:'+25% REACH', desc:`REACH ${r}% > ${r+25}%`, cost:12, apply:()=>{ player.slashReach+=0.25; }},
    {name:j<2?'DOUBLE JUMP':'+1 JUMP', desc:`JUMPS ${j} > ${j+1}`, cost:20, apply:()=>{ player.maxJumps++; player.jumps=player.maxJumps; }},
    {name:'+20 MAX HP', desc:`MAX HP ${player.maxHp} > ${player.maxHp+20}`, cost:10, apply:()=>{ player.maxHp+=20; player.hp+=20; }},
    {name:'HEAL 50%', desc:'RESTORE 50 HP', cost:5, apply:()=>{ player.hp=Math.min(player.maxHp,player.hp+50); }}
  ];
  for (let i=pool.length-1; i>0; i--) {
    const k=Math.floor(Math.random()*(i+1));
    [pool[i],pool[k]]=[pool[k],pool[i]];
  }
  upgrades = pool.slice(0,3);
  upgradeSel = 1;
}

// -- Full render pass --
function renderScene() {
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawBackground(totalTime);
  drawPlatforms(platforms);
  drawSlashArcs();
  drawParticles();
  drawEnemies(enemyMgr.list);
  if (gameState !== 'dead') drawPlayer(player);
  drawScanlines();
  drawVignette();
  ctx.restore();
}

// -- Main loop --
function newRun() {
  player = new Player(W/2, H-200);
  score = 0; startWave(1); gameState = 'playing';
}

function setPause(p) {
  gameState = p ? 'paused' : 'playing';
  pauseSel = 0;
  audio.setPaused(p);
  if (!p) player._prevJ = player._prevA = player._prevD = true;
}

function loop(ts) {
  requestAnimationFrame(loop);
  const rawDt = Math.min((ts - lastTime)/1000, 0.05);
  lastTime = ts;

  if (keys['Escape'] || keys['KeyP']) {
    keys['Escape'] = keys['KeyP'] = false;
    if (gameState === 'playing') setPause(true);
    else if (gameState === 'paused') setPause(false);
  }

  if (gameState === 'paused') {
    setMouseClick(false);
    renderScene();
    drawPauseScreen(W, H, ['RESUME', `MUTE: ${audio.muted?'ON':'OFF'}`, 'RESTART RUN'], pauseSel,
      `JUMPS ${player.maxJumps}  |  DASHES ${player.maxDashes}  |  REACH ${Math.round(player.slashReach*100)}%  |  MAX HP ${player.maxHp}`);
    if (keys['KeyW']||keys['ArrowUp'])   { pauseSel=(pauseSel+2)%3; keys['KeyW']=keys['ArrowUp']=false; }
    if (keys['KeyS']||keys['ArrowDown']) { pauseSel=(pauseSel+1)%3; keys['KeyS']=keys['ArrowDown']=false; }
    if (keys['Space']||keys['Enter']) {
      keys['Space']=keys['Enter']=false;
      if (pauseSel===0) setPause(false);
      else if (pauseSel===1) audio.toggleMute();
      else { audio.setPaused(false); newRun(); }
    }
    return;
  }

  if (hitstop > 0) { tickHitstop(rawDt); renderScene(); return; }

  const dt = rawDt;
  totalTime += dt;
  updateShake(dt);

  if (gameState === 'title') {
    drawTitleScreen(totalTime, W, H);
    if (keys['Space'] || mouseClick) {
      setMouseClick(false); keys['Space']=false;
      audio.init(); audio.playBGM();
      newRun();
    }
    return;
  }

  if (gameState === 'dead') {
    deadAge += dt;
    updateParticles(dt); renderScene(); drawDeadScreen(totalTime, score, wave, W, H, deadAge, best);
    if (deadAge > 1.2 && (keys['Space'] || keys['Enter'] || mouseClick)) {
      keys['Space']=keys['Enter']=false; newRun();
    }
    setMouseClick(false);
    return;
  }

  if (gameState === 'waveclear') {
    updateParticles(dt); updateNectars(dt, platforms); renderScene(); drawWaveClear(totalTime, wave, W, H);
    if ((waveClearDelay -= dt) <= 0) {
      rollUpgrades(); gameState = 'upgrade';
      keys['Space']=keys['Enter']=keys['KeyA']=keys['KeyD']=keys['ArrowLeft']=keys['ArrowRight']=false;
    }
    return;
  }

  if (gameState === 'upgrade') {
    setMouseClick(false);
    renderScene(); drawUpgradeScreen(W, H, upgrades, upgradeSel, player.nectar);
    if (keys['KeyA'] || keys['ArrowLeft'])  { upgradeSel=Math.max(0,upgradeSel-1); keys['KeyA']=keys['ArrowLeft']=false; }
    if (keys['KeyD'] || keys['ArrowRight']) { upgradeSel=Math.min(upgrades.length-1,upgradeSel+1); keys['KeyD']=keys['ArrowRight']=false; }
    if (keys['Space'] && upgrades.length) {
      keys['Space']=false;
      const u = upgrades[upgradeSel];
      if (player.nectar >= u.cost) {
        player.nectar -= u.cost; u.apply(); audio.playSFX('buy');
        upgrades.splice(upgradeSel,1); upgradeSel=Math.max(0,Math.min(upgradeSel,upgrades.length-1)); syncHUD();
      } else audio.playSFX('fail');
    }
    if (keys['Enter']) {
      keys['Enter']=false; player._prevJ=true;
      startWave(wave+1); gameState='playing';
    }
    return;
  }

  player.update(dt, platforms, onSlash);
  enemyMgr.update(dt, platforms, player, wave);
  updateParticles(dt);
  updateSlashArcs(dt);
  updateNectars(dt, platforms);

  for (let i=nectars.length-1; i>=0; i--) {
    const n=nectars[i];
    if (dist(player.x,player.y,n.x,n.y)<25) {
      player.nectar++; nectars.splice(i,1); audio.playSFX('nectar'); syncHUD();
    }
  }

  if (player.isDead) {
    gameState = 'dead'; deadAge = 0; keys['Space']=false; setMouseClick(false);
    if (score > best) { best = score; try { localStorage.setItem('bo_best', best); } catch {} }
    audio.playSFX('death');
    spawnDeathExplosion(player.x, player.y, '#ffe033');
    triggerShake(16);
  } else if (enemyMgr.isDone && !nectars.length) {
    waveClearDelay = 2.2; gameState = 'waveclear'; audio.playSFX('clear');
  }

  renderScene();
  syncHUD();
}

// -- Boot --
platforms = generatePlatforms(1);
requestAnimationFrame(loop);
document.addEventListener('visibilitychange', () => { if (document.hidden && gameState === 'playing') setPause(true); });
