export class AudioManager {
  constructor() { this.ctx = null; this.bgm = false; }
  
  init() { 
    if(!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); 
  }
  
  playSFX(type) {
    if(!this.ctx) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.connect(g); g.connect(this.ctx.destination);
    
    if(type==='slash') { 
      o.type='triangle'; 
      o.frequency.setValueAtTime(800, t); 
      o.frequency.exponentialRampToValueAtTime(100, t+0.15); 
      g.gain.setValueAtTime(0.3, t); 
      g.gain.exponentialRampToValueAtTime(0.01, t+0.15); 
      o.start(t); o.stop(t+0.15); 
    } else if(type==='jump') { 
      o.type='sine'; 
      o.frequency.setValueAtTime(300, t); 
      o.frequency.exponentialRampToValueAtTime(600, t+0.15); 
      g.gain.setValueAtTime(0.2, t); 
      g.gain.linearRampToValueAtTime(0.01, t+0.15); 
      o.start(t); o.stop(t+0.15); 
    } else if(type==='hit') { 
      o.type='square'; 
      o.frequency.setValueAtTime(100, t); 
      o.frequency.exponentialRampToValueAtTime(40, t+0.2); 
      g.gain.setValueAtTime(0.4, t); 
      g.gain.exponentialRampToValueAtTime(0.01, t+0.2); 
      o.start(t); o.stop(t+0.2); 
    }
  }
  
  playBGM() {
    if(!this.ctx || this.bgm) return;
    this.bgm = true;
    const p = () => {
      if(!this.bgm) return;
      const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sawtooth'; 
      o.frequency.value = [110, 110, 164.81, 146.83][Math.floor(Math.random()*4)];
      o.connect(g); g.connect(this.ctx.destination);
      g.gain.setValueAtTime(0.05, t); 
      g.gain.exponentialRampToValueAtTime(0.001, t+0.25);
      o.start(t); o.stop(t+0.25);
      setTimeout(p, 250);
    };
    p();
  }
}

export const audio = new AudioManager();
