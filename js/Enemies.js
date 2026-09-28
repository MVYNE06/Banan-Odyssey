import { lerp, clamp, rand, dist, norm } from './utils.js';
import { W, H, spawnParticles, spawnHitSparks, spawnDeathExplosion, triggerShake, setHitstop, spawnNectar } from './Engine.js';
import { resolveVsPlatforms, aabb } from './Physics.js';
import { GRAVITY, MAX_FALL, HITSTOP_DUR, CONTACT_DMG, ORB_DMG, BOSS_HP } from './constants.js';

class Mite {
  constructor(x, y, wave) {
    this.type='mite'; this.x=x; this.y=y; this.vx=0; this.vy=0;
    this.w=24; this.h=24;
    this.hp=this.maxHp=30+wave*5;
    this.onGround=false; this.glowPulse=rand(0,Math.PI*2);
    this.pupilAngle=0; this.hurtFlash=0; this.lungeCD=rand(0.5,1.5);
  }
  update(dt, player, wave) {
    const dx=player.x-this.x, dy=player.y-this.y, d=Math.hypot(dx,dy);
    this.pupilAngle=Math.atan2(dy,dx);
    this.hurtFlash=Math.max(0,this.hurtFlash-dt*4);
    this.lungeCD=Math.max(0,this.lungeCD-dt);
    if (d<320) {
      const [nx]=norm(dx,0);
      this.vx=lerp(this.vx,nx*(140+Math.min(wave,15)*6),dt*5);
      if (d<85&&this.lungeCD<=0&&this.onGround) {
        const [lx,ly]=norm(dx,dy-30);
        this.vx=lx*(480+Math.min(wave,15)*20); this.vy=ly*400-180; this.lungeCD=rand(1.0,1.8);
      }
    } else this.vx*=0.88;
  }
}

class Turret {
  constructor(x, y, wave) {
    this.type='turret'; this.x=x; this.y=y; this.vx=0; this.vy=0;
    this.w=28; this.h=34;
    this.hp=this.maxHp=50+wave*8;
    this.onGround=false; this.glowPulse=rand(0,Math.PI*2);
    this.hurtFlash=0; this.fireCD=rand(1,2.5); this.orbs=[];
  }
  update(dt, player, wave) {
    this.hurtFlash=Math.max(0,this.hurtFlash-dt*4);
    this.fireCD=Math.max(0,this.fireCD-dt);
    if (this.onGround) this.vx*=0.9;
    if (this.fireCD<=0) {
      const [nx,ny]=norm(player.x-this.x,player.y-this.y);
      this.orbs.push({x:this.x,y:this.y-10,vx:nx*175,vy:ny*175,r:8,life:1,decay:0.28,age:0});
      this.fireCD=Math.max(0.8,rand(1.8-wave*0.08,3.2-wave*0.1));
      spawnParticles(this.x,this.y-10,6,()=>'#cc88ff',{minSpeed:40,maxSpeed:160,upBias:80,minDecay:3,maxDecay:6,minR:1,maxR:3,glow:true});
    }
    for (let oi=this.orbs.length-1; oi>=0; oi--) {
      const orb=this.orbs[oi];
      orb.age+=dt; orb.life-=orb.decay*dt;
      if (orb.age<2.5) {
        const [hx,hy]=norm(player.x-orb.x,player.y-orb.y);
        const str=Math.min(orb.age*50,80)*dt;
        orb.vx=lerp(orb.vx,hx*210,str); orb.vy=lerp(orb.vy,hy*210,str);
      }
      orb.x+=orb.vx*dt; orb.y+=orb.vy*dt;
      if (player.iFrames<=0 && dist(orb.x,orb.y,player.x,player.y)<orb.r+15) {
        const hit=player.takeDamage(ORB_DMG);
        if (hit) spawnParticles(orb.x,orb.y,8,()=>'#cc88ff',{minSpeed:60,maxSpeed:220,minDecay:2,maxDecay:4,minR:1,maxR:3,glow:true});
        this.orbs.splice(oi,1); continue;
      }
      if (orb.life<=0||orb.x<-20||orb.x>W+20||orb.y>H+20) this.orbs.splice(oi,1);
    }
  }
}

class Boss {
  constructor(x, y, wave=5) {
    this.type='boss'; this.x=x; this.y=y; this.vx=0; this.vy=0;
    this.w=80; this.h=120;
    this.hp=this.maxHp=BOSS_HP + Math.max(0,wave-5)*70;
    this.onGround=false; this.glowPulse=0; this.fireCD=2; this.pullCD=0; this.orbs=[];
    this.hurtFlash=0; this.isPulling=false;
  }
  update(dt, player, wave) {
    this.glowPulse+=dt;
    this.hurtFlash=Math.max(0,this.hurtFlash-dt*4);
    const enraged = this.hp < this.maxHp*0.5;
    
    this.pullCD+=dt;
    this.isPulling = this.pullCD > 3;
    if (this.isPulling) {
      player.vx += (this.x-player.x > 0 ? 1 : -1) * (enraged?1200:600) * dt;
      if (this.pullCD>5) this.pullCD=0;
      spawnParticles(this.x,this.y+this.h/2-20,4,()=>'#fff',{minSpeed:150,maxSpeed:400,upBias:50});
    }
    
    this.fireCD-=dt;
    if (this.fireCD<=0) {
      this.orbs.push({x:this.x-this.w/2,y:this.y-this.h/2+20,vx:rand(-350,-150),vy:rand(-250,-50),r:12,life:1,decay:0.2,age:0});
      this.fireCD = enraged ? 0.6 : 1.2;
    }
    
    for (let oi=this.orbs.length-1; oi>=0; oi--) {
      const o=this.orbs[oi]; o.vy+=GRAVITY*0.5*dt; o.x+=o.vx*dt; o.y+=o.vy*dt; o.life-=o.decay*dt;
      if (o.y>H-60) { o.y=H-60; o.vy*=-0.85; }
      if (player.iFrames<=0 && dist(o.x,o.y,player.x,player.y)<o.r+15) {
        player.takeDamage(ORB_DMG*2); this.orbs.splice(oi,1); continue;
      }
      if (o.life<=0||o.x<-50) this.orbs.splice(oi,1);
    }
  }
}

export class EnemyManager {
  constructor() { this.list=[]; this.queue=[]; this.spawnTimer=0; }

  buildWave(wave) {
    const q=[];
    if (wave % 5 === 0) { q.push('boss'); for (let i=0;i<(wave/5-1)*3;i++) q.push('mite'); }
    else {
      const m=3+wave*2, t=Math.min(6,Math.floor(wave/2));
      for (let i=0;i<m;i++) q.push('mite');
      for (let i=0;i<t;i++) q.push('turret');
      for (let i=q.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [q[i],q[j]]=[q[j],q[i]];
      }
    }
    this.queue=q; this.list=[]; this.spawnTimer=0;
  }

  trySpawn(wave) {
    if (!this.queue.length) return;
    const type=this.queue.shift();
    if (type==='boss') this.list.push(new Boss(W-100, H-120, wave));
    else {
      const sx=Math.random()<0.5?rand(40,W*0.25):rand(W*0.75,W-40);
      this.list.push(type==='mite'?new Mite(sx,H-220,wave):new Turret(sx,H-220,wave));
    }
  }

  update(dt, platforms, player, wave) {
    this.spawnTimer+=dt;
    if (this.spawnTimer>=Math.max(0.3,0.75-wave*0.03)&&this.queue.length) { this.trySpawn(wave); this.spawnTimer=0; }

    for (let i=this.list.length-1; i>=0; i--) {
      const e=this.list[i];
      e.update(dt,player,wave);
      e.vy=clamp(e.vy+GRAVITY*dt,-Infinity,MAX_FALL);
      e.x+=e.vx*dt; e.y+=e.vy*dt;
      resolveVsPlatforms(e,platforms);

      if (player.iFrames<=0&&aabb(player.x-player.w/2,player.y-player.h/2,player.w,player.h,e.x-e.w/2,e.y-e.h/2,e.w,e.h)) {
        player.takeDamage(CONTACT_DMG);
      }
    }
  }

  slashCheck(slashX, slashY, dmg, playerReach) {
    let killed=0;
    for (let i=this.list.length-1; i>=0; i--) {
      const e=this.list[i];
      if (dist(slashX,slashY,e.x,e.y) > 78*playerReach) continue;
      e.hp-=dmg; e.hurtFlash=0.12;
      spawnHitSparks(e.x,e.y);
      triggerShake(3.5); setHitstop(HITSTOP_DUR);
      if (e.hp<=0) {
        spawnDeathExplosion(e.x,e.y,e.type==='mite'?'#ff4444':e.type==='boss'?'#ffaa00':'#aa44ff');
        if (e.type==='boss') { setHitstop(0.1); triggerShake(25); }
        if (e.orbs) e.orbs.length=0;
        spawnNectar(e.x,e.y,e.type==='boss'?40:e.type==='mite'?3:6);
        this.list.splice(i,1); killed++; triggerShake(7);
      }
    }
    return killed;
  }

  get isDone() { return !this.list.length && !this.queue.length; }
}
