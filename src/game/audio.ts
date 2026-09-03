export class AudioSys {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  muted = false;
  unlocked = false;

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.7;
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.master.gain.value = this.muted ? 0 : 0.85;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.unlocked = true;
  }

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.now(), 0.02);
  }

  private now() {
    return this.ctx?.currentTime ?? 0;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType = "square",
    gain = 0.05,
    slide?: number,
  ) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  codecOpen() {
    this.tone(620, 0.09, "square", 0.04);
    setTimeout(() => this.tone(820, 0.1, "square", 0.035), 90);
  }

  begin() {
    this.tone(180, 0.18, "sawtooth", 0.03);
    this.tone(360, 0.22, "square", 0.025);
  }

  foot(stealth: boolean) {
    this.tone(stealth ? 90 : 130, stealth ? 0.04 : 0.06, "triangle", stealth ? 0.012 : 0.028);
  }

  caution() {
    this.tone(440, 0.16, "square", 0.05, 380);
  }

  alert() {
    this.tone(880, 0.12, "square", 0.07);
    setTimeout(() => this.tone(660, 0.18, "square", 0.06), 110);
    setTimeout(() => this.tone(990, 0.22, "square", 0.05), 240);
  }

  pickup() {
    this.tone(520, 0.12, "square", 0.045, 780);
    setTimeout(() => this.tone(880, 0.16, "square", 0.035), 80);
  }

  box() {
    this.tone(140, 0.08, "triangle", 0.04);
  }

  caught() {
    this.tone(110, 0.5, "sawtooth", 0.06, 55);
  }

  win() {
    this.tone(392, 0.14, "square", 0.04);
    setTimeout(() => this.tone(523, 0.16, "square", 0.04), 140);
    setTimeout(() => this.tone(659, 0.28, "square", 0.045), 300);
  }

  interactFail() {
    this.tone(160, 0.07, "square", 0.02);
  }
}
