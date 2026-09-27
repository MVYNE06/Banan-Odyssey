import { ctx, W, H, keys, mouseClick, setMouseClick, updateParticles, updateSlashArcs, particles, slashArcs, trail, triggerShake, shakeX, shakeY, updateShake, hitstop, tickHitstop, setHitstop, spawnDeathExplosion, nectars, updateNectars } from './Engine.js';
import { Player } from './Player.js';
import { EnemyManager } from './Enemies.js';
import { generatePlatforms } from './Level.js';
import { drawBackground, drawPlatforms, drawSlashArcs, drawParticles, drawPlayer, drawEnemies, drawVignette, drawScanlines, drawTitleScreen, drawDeadScreen, drawWaveClear, drawVictoryScreen, drawUpgradeScreen } from './Renderer.js';
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
let upgradeSel = 0;

// -- Wave lifecycle --
function startWave(w) {
  wave = w;
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
  waveInfo.textContent = `WAVE ${wave}`;
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
  const pool = [
    {name:'+1 MAX DASH', cost:10, apply:()=>{ player.maxDashes++; player.dashes=player.maxDashes; }},
    {name:'+20% REACH',  cost:15, apply:()=>{ player.slashReach+=0.2; }},
    {name:'DOUBLE JUMP', cost:25, apply:()=>{ player.maxJumps++; player.jumps=player.maxJumps; }},
    {name:'HEAL 50%',    cost:5,  apply:()=>{ player.hp=Math.min(player.maxHp,player.hp+50); }}
  ];
  for (let i=pool.length-1; i>0; i--) {
    const j=Math.floor(Math.random()*(i+1));
    [pool[i],pool[j]]=[pool[j],pool[i]];
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
function loop(ts) {
  requestAnimationFrame(loop);
  const rawDt = Math.min((ts - lastTime)/1000, 0.05);
  lastTime = ts;

  // Hitstop: render only
  if (hitstop > 0) { tickHitstop(rawDt); renderScene(); return; }

  const dt = rawDt;
  totalTime += dt;
  updateShake(dt);

  // ---- TITLE ----
  if (gameState === 'title') {
    drawTitleScreen(totalTime, W, H);
    if (keys['Space'] || mouseClick) {
      setMouseClick(false);
      audio.init(); audio.playBGM();
      player = new Player(W/2, H-200);
      score = 0; startWave(1); gameState = 'playing';
    }
    return;
  }

  // ---- DEAD ----
  if (gameState === 'dead') {
    updateParticles(dt); renderScene(); drawDeadScreen(totalTime, score, wave, W, H);
    if (keys['Space'] || mouseClick) {
      setMouseClick(false);
      player = new Player(W/2, H-200);
      score = 0; startWave(1); gameState = 'playing';
    }
    return;
  }

  // ---- WAVE CLEAR ----
  if (gameState === 'waveclear') {
    updateParticles(dt); updateNectars(dt, platforms); renderScene(); drawWaveClear(totalTime, wave, W, H);
    if ((waveClearDelay -= dt) <= 0) {
      if(wave === 3) { gameState = 'victory'; }
      else { rollUpgrades(); gameState = 'upgrade'; keys['Space']=false; keys['KeyA']=false; keys['KeyD']=false; keys['ArrowLeft']=false; keys['ArrowRight']=false; }
    }
    return;
  }

  // ---- UPGRADE ----
  if (gameState === 'upgrade') {
    renderScene(); drawUpgradeScreen(W, H, upgrades, upgradeSel);
    if (keys['KeyA'] || keys['ArrowLeft']) { upgradeSel=Math.max(0,upgradeSel-1); keys['KeyA']=keys['ArrowLeft']=false; }
    if (keys['KeyD'] || keys['ArrowRight']) { upgradeSel=Math.min(2,upgradeSel+1); keys['KeyD']=keys['ArrowRight']=false; }
    if (keys['Space']) {
      keys['Space']=false;
      const u = upgrades[upgradeSel];
      if (u && player.nectar >= u.cost) { player.nectar-=u.cost; u.apply(); syncHUD(); }
      startWave(wave+1); gameState='playing';
    }
    return;
  }

  // ---- VICTORY ----
  if (gameState === 'victory') {
    renderScene(); drawVictoryScreen(totalTime, W, H);
    if (keys['Space'] || mouseClick) {
      setMouseClick(false);
      player = new Player(W/2, H-200);
      score = 0; startWave(1); gameState = 'playing';
    }
    return;
  }

  // ---- PLAYING ----
  player.update(dt, platforms, onSlash);
  enemyMgr.update(dt, platforms, player, wave);
  updateParticles(dt);
  updateSlashArcs(dt);
  updateNectars(dt, platforms);

  for (let i=nectars.length-1; i>=0; i--) {
    const n=nectars[i];
    if (dist(player.x,player.y,n.x,n.y)<25) {
      player.nectar++; nectars.splice(i,1); syncHUD();
    }
  }

  if (player.isDead) {
    gameState = 'dead';
    spawnDeathExplosion(player.x, player.y, '#ffe033');
    triggerShake(16);
  } else if (enemyMgr.isDone && !nectars.length) {
    waveClearDelay = 2.2; gameState = 'waveclear';
  }

  renderScene();
  syncHUD();
}

// -- Boot --
platforms = generatePlatforms(1);
requestAnimationFrame(loop);
