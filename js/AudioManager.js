const SEM = [0,1,4,5,7,8,10];
const f = d => 146.83 * 2 ** ((SEM[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7)) / 12);
const P = [.85,0,.7,0,.7,0,.7,.3,.45];

export class AudioManager {
  constructor() { this.ctx=null; this.bgm=false; this.muted=false; this.step=0; this.next=0; this.sd=0.19; this.deg=4; this.ln=0; }

  init() {
    if (this.ctx) { if (this.ctx.state==='suspended') this.ctx.resume(); return; }
    const c = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const cmp=c.createDynamicsCompressor(), d=c.createDelay(1), fb=c.createGain(), lp=c.createBiquadFilter(), wet=c.createGain();
    this.master=c.createGain(); this.master.gain.value=this.muted?0:0.7;
    this.bus=c.createGain();
    d.delayTime.value=0.27; fb.gain.value=0.38; lp.type='lowpass'; lp.frequency.value=2000; wet.gain.value=0.32;
    this.bus.connect(this.master); this.bus.connect(wet); wet.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(this.master);
    this.master.connect(cmp); cmp.connect(c.destination);
    const n=c.createBuffer(1,c.sampleRate,c.sampleRate), a=n.getChannelData(0);
    for (let i=0;i<a.length;i++) a[i]=Math.random()*2-1;
    this.nb=n;
  }

  setTempo(w) { this.sd=Math.max(0.13,0.19-w*0.004); }
  toggleMute() { this.muted=!this.muted; if (this.master) this.master.gain.value=this.muted?0:0.7; return this.muted; }
  setPaused(p) { if (this.ctx) p ? this.ctx.suspend() : this.ctx.resume(); }

  _env(g,t,a,d,v) {
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(v,t+a);
    g.gain.exponentialRampToValueAtTime(0.0001,t+a+d);
  }

  _tone(type,fr,t,d,v) {
    const c=this.ctx, o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.value=fr; this._env(g,t,0.004,d,v);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t+d+0.05);
  }

  _noise(t,d,fr,type,v) {
    const c=this.ctx, s=c.createBufferSource(), fl=c.createBiquadFilter(), g=c.createGain();
    s.buffer=this.nb; fl.type=type; fl.frequency.value=fr; this._env(g,t,0.002,d,v);
    s.connect(fl); fl.connect(g); g.connect(this.bus); s.start(t); s.stop(t+d+0.05);
  }

  pluck(fr,t,d=0.9,v=0.2) {
    const c=this.ctx, o1=c.createOscillator(), o2=c.createOscillator(), g2=c.createGain(), lp=c.createBiquadFilter(), g=c.createGain();
    o1.type='triangle'; o2.type='sawtooth'; o1.frequency.value=fr; o2.frequency.value=fr*2.004; g2.gain.value=0.25;
    lp.type='lowpass'; lp.frequency.setValueAtTime(fr*7,t); lp.frequency.exponentialRampToValueAtTime(fr*1.5,t+d*0.5);
    this._env(g,t,0.004,d,v);
    o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(this.bus);
    o1.start(t); o2.start(t); o1.stop(t+d+0.05); o2.stop(t+d+0.05);
  }

  aulos(fr,t,d,v=0.11) {
    const c=this.ctx, g=c.createGain(), lp=c.createBiquadFilter(), pk=c.createBiquadFilter(), lfo=c.createOscillator(), lg=c.createGain();
    lp.type='lowpass'; lp.frequency.value=2600; pk.type='peaking'; pk.frequency.value=1400; pk.gain.value=8; pk.Q.value=1.5;
    lfo.frequency.value=5.2; lg.gain.value=fr*0.012; lfo.connect(lg);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+0.06);
    g.gain.setValueAtTime(v,t+d*0.8); g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    for (const dt of [0,6]) {
      const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=fr; o.detune.value=dt;
      lg.connect(o.frequency); o.connect(lp); o.start(t); o.stop(t+d+0.05);
    }
    lfo.start(t); lfo.stop(t+d+0.05);
    lp.connect(pk); pk.connect(g); g.connect(this.bus);
  }

  drum(t,type='dum',v=1) {
    if (type==='dum') {
      const c=this.ctx, o=c.createOscillator(), g=c.createGain();
      o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(58,t+0.2);
      this._env(g,t,0.003,0.32,0.55*v); o.connect(g); g.connect(this.bus); o.start(t); o.stop(t+0.4);
      this._noise(t,0.05,300,'lowpass',0.25*v);
    } else this._noise(t,0.07,2800,'bandpass',0.22*v);
  }

  _drone() {
    const c=this.ctx, g=c.createGain(), lp=c.createBiquadFilter(), lfo=c.createOscillator(), lg=c.createGain();
    g.gain.value=0.045; lp.type='lowpass'; lp.frequency.value=380; lp.Q.value=2;
    lfo.frequency.value=0.13; lg.gain.value=140; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    for (const fr of [73.42,110,73.9]) { const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=fr; o.connect(lp); o.start(); }
    lp.connect(g); g.connect(this.bus);
  }

  playBGM() {
    if (!this.ctx || this.bgm) return;
    this.bgm=true; this._drone();
    this.next=this.ctx.currentTime+0.1; this.step=0;
    setInterval(()=>this._tick(),50);
  }

  _tick() {
    const c=this.ctx; if (c.state!=='running') return;
    while (this.next<c.currentTime+0.3) { this._step(this.step%9,this.next); this.next+=this.sd; this.step++; }
  }

  _step(s,t) {
    const end=Math.floor(this.step/9)%4===3;
    if (s===0||s===6) this.drum(t,'dum'); else if (s===2||s===4||s===8) this.drum(t,'tek',s===8?1:0.7);
    if (s===0) this.pluck(f(-7),t,1.2,0.3); else if (s===6) this.pluck(f(-3),t,1,0.24);
    else if (s===2) this.pluck(f(4),t,0.6,0.12); else if (s===4) this.pluck(f(2),t,0.6,0.12); else if (s===8) this.pluck(f(0),t,0.5,0.1);
    if (end&&s===4) { this.deg=0; this.aulos(f(7),t,this.sd*5,0.13); return; }
    if (Math.random()<P[s] && !(end&&s>4)) {
      this.deg=Math.max(0,Math.min(8,this.deg+[-2,-1,-1,1,1,2][Math.floor(Math.random()*6)]));
      this.aulos(f(7+this.deg),t,((s===7||s===8)?1:2)*this.sd*0.95);
    }
  }

  playSFX(type) {
    const c=this.ctx; if (!c||c.state!=='running') return;
    const t=c.currentTime;
    if (type==='nectar') {
      if (t-this.ln<0.05) return; this.ln=t;
      const nf=f(14+Math.floor(Math.random()*4)*2);
      this._tone('sine',nf,t,0.4,0.1); this._tone('sine',nf*2.76,t,0.15,0.03);
    } else if (type==='slash') {
      this._noise(t,0.14,2600,'bandpass',0.3);
      [1,2.76,5.4].forEach((m,i)=>this._tone('sine',600*m,t,0.22/(i+1),0.09/(i+1)));
    } else if (type==='jump') this.pluck(f(7),t,0.3,0.16);
    else if (type==='jump2') this.pluck(f(11),t,0.3,0.16);
    else if (type==='hit') { this.drum(t,'dum',1.3); this._noise(t,0.1,900,'lowpass',0.3); this.pluck(f(-6),t,0.5,0.2); }
    else if (type==='buy') [0,2,4,7].forEach((d,i)=>this.pluck(f(d+7),t+i*0.07,0.7,0.16));
    else if (type==='fail') { this.drum(t,'dum',0.7); this.pluck(f(-6),t,0.4,0.15); }
    else if (type==='clear') {
      let o=0; this.drum(t,'dum');
      [[7,.18],[9,.18],[11,.18],[14,1]].forEach(([d,l])=>{ this.aulos(f(d),t+o,l*1.2,0.13); o+=l; });
    } else if (type==='death') {
      [11,9,7,5,3].forEach((d,i)=>this.pluck(f(d),t+i*0.16,0.9,0.2));
      this.drum(t+0.8,'dum',1.4); this.aulos(f(0),t+0.85,2,0.12);
    }
  }
}

export const audio = new AudioManager();
