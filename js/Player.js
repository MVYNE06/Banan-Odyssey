import { clamp } from './utils.js';
import { keys, mouseClick, setMouseClick, spawnParticles, spawnSlashArc, pushTrail, updateTrail, triggerShake, setHitstop } from './Engine.js';
import { resolveVsPlatforms } from './Physics.js';
import { GRAVITY, MAX_FALL, PLAYER_SPEED, JUMP_FORCE, DASH_SPEED, DASH_DUR, IFRAMES_DUR, SLASH_DUR, HITSTOP_DUR, HP_REGEN } from './constants.js';
import { audio } from './AudioManager.js';

export class Player {
  constructor(x, y) {
    this.x=x; this.y=y; this.w=28; this.h=30;
    this.vx=0; this.vy=0;
    this.hp=100; this.maxHp=100;
    this.onGround=false; this.facingDir=1;
    this.state='idle';
    this.dashTimer=0; this.dashCooldown=0;
    this.attackTimer=0; this.attackCooldown=0;
    this.iFrames=0; this.jumpHeld=false; this.jumpTimer=0;
    this.glowPulse=0; this.bobPhase=0;
    this._prevJ=false; this._prevA=false; this._prevD=false;
    this.nectar=0; this.maxJumps=1; this.jumps=1; this.slashReach=1; this.maxDashes=1; this.dashes=1;
  }

  get slashOriginX() { return this.x + this.facingDir*30*this.slashReach; }

  update(dt, platforms, onSlash) {
    this.glowPulse   += dt*2.5;
    this.bobPhase    += dt*(this.state==='idle'?2:4);
    this.iFrames      = Math.max(0, this.iFrames-dt);
    this.dashCooldown = Math.max(0, this.dashCooldown-dt);
    this.attackCooldown = Math.max(0, this.attackCooldown-dt);

    // Passive HP regen — stops if dead
    if (this.hp > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + HP_REGEN*dt);
    }

    if (this.onGround) { this.jumps=this.maxJumps; this.dashes=this.maxDashes; }

    const jN = !!(keys['Space']||keys['KeyW']||keys['ArrowUp']);
    const aN = !!(mouseClick||keys['KeyJ']);
    const dN = !!(keys['ShiftLeft']||keys['ShiftRight']);
    const lN = !!(keys['KeyA']||keys['ArrowLeft']);
    const rN = !!(keys['KeyD']||keys['ArrowRight']);
    setMouseClick(false);

    if (this.state==='dash') {
      this.dashTimer -= dt;
      if (this.dashTimer<=0) { this.state='idle'; this.vx=0; }
      else { this.vx=this.facingDir*DASH_SPEED; this.vy*=0.75; }
    } else if (this.state==='attack') {
      this.attackTimer -= dt;
      if (this.attackTimer<=0) this.state=this.onGround?'idle':'jump';
    } else {
      if (lN)      { this.vx=-PLAYER_SPEED; this.facingDir=-1; }
      else if (rN) { this.vx= PLAYER_SPEED; this.facingDir= 1; }
      else         { this.vx*=0.72; }

      if (jN && !this._prevJ && this.jumps>0) {
        const air=!this.onGround; audio.playSFX(air?'jump2':'jump');
        this.vy=JUMP_FORCE; this.onGround=false; this.jumpHeld=true; this.jumpTimer=0.18; this.jumps--;
        spawnParticles(this.x, this.y+this.h/2, 5, ()=>'#886600',
          {minSpeed:30,maxSpeed:100,minDecay:2,maxDecay:4,minR:1,maxR:2});
        if (air) spawnParticles(this.x,this.y+this.h/2,10,()=>'#ffe9a0',{minSpeed:60,maxSpeed:180,minDecay:3,maxDecay:6,minR:1,maxR:3,glow:true,gravity:0});
      }
      if (jN && this.jumpHeld && this.jumpTimer>0) {
        this.jumpTimer-=dt; if(this.jumpTimer>0) this.vy+=JUMP_FORCE*0.016;
      } else this.jumpHeld=false;

      if (aN && !this._prevA && this.attackCooldown<=0) {
        audio.playSFX('slash');
        this.state='attack'; this.attackTimer=SLASH_DUR; this.attackCooldown=0.2;
        spawnSlashArc(this.slashOriginX, this.y, this.facingDir, this.slashReach);
        onSlash();
      }

      if (dN && !this._prevD && this.dashCooldown<=0 && this.dashes>0) {
        this.state='dash'; this.dashTimer=DASH_DUR; this.dashCooldown=0.65; this.iFrames=IFRAMES_DUR; this.dashes--;
        spawnParticles(this.x, this.y, 12, ()=>'rgba(255,190,0,0.85)',
          {minSpeed:50,maxSpeed:200,upBias:80,minDecay:2,maxDecay:5,minR:1,maxR:4,glow:true});
      }
    }

    if (this.state!=='dash'&&this.state!=='attack') {
      this.state = !this.onGround?'jump':Math.abs(this.vx)>20?'run':'idle';
    }
    if (this.state!=='dash') this.vy=clamp(this.vy+GRAVITY*dt,-Infinity,MAX_FALL);

    this.x+=this.vx*dt; this.y+=this.vy*dt;
    resolveVsPlatforms(this, platforms);

    if (['run','jump','dash','attack'].includes(this.state)) pushTrail(this.x, this.y);
    updateTrail();

    this._prevJ=jN; this._prevA=aN; this._prevD=dN;
  }

  takeDamage(amt) {
    if (this.iFrames>0) return false;
    audio.playSFX('hit');
    this.hp = Math.max(0, this.hp-amt);
    this.iFrames=0.5;
    triggerShake(5.5);
    spawnParticles(this.x, this.y, 8, ()=>'#ff2222',
      {minSpeed:100,maxSpeed:300,upBias:100,minDecay:2,maxDecay:4,minR:2,maxR:4,glow:true});
    return true;
  }

  get isDead() { return this.hp<=0; }
}
