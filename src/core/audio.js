/**
 * Procedural audio.
 *
 * Nothing is downloaded: the ambience is filtered noise, the music is a
 * generative sequencer with a synth voice per era, and every sound effect —
 * ah-oo-ga horns, trolley bells, car alarms, arcade attract loops, maglev
 * passes — is built from oscillators and envelopes.
 */

const A4 = 440;
const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

/** Note name like "A3" → frequency. */
function f(name) {
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) return 440;
  const semis = NOTE[m[1]] + (parseInt(m[2], 10) - 4) * 12 - 9;
  return A4 * Math.pow(2, semis / 12);
}

/* ------------------------------------------------------------------ */
/*  Era music definitions                                              */
/* ------------------------------------------------------------------ */

const MUSIC = {
  bigband: {
    bpm: 168,
    swing: 0.62,
    radio: true,
    prog: [
      ['C3', 'E3', 'G3', 'A3'],
      ['C3', 'E3', 'G3', 'A3'],
      ['F3', 'A3', 'C4', 'D4'],
      ['G3', 'B3', 'D4', 'F4']
    ],
    melody: ['E5', 'G5', 'A5', 'C6', 'B5', 'G5', 'E5', 'D5'],
    lead: { type: 'sawtooth', attack: 0.02, decay: 0.28, gain: 0.06, detune: 8 },
    bass: { type: 'triangle', gain: 0.16 },
    drums: 'swing'
  },
  surf: {
    bpm: 152,
    swing: 0.5,
    prog: [
      ['E2', 'G2', 'B2', 'E3'],
      ['A2', 'C3', 'E3', 'A3'],
      ['B2', 'D3', 'F#3', 'B3'],
      ['E2', 'G2', 'B2', 'E3']
    ],
    melody: ['E4', 'G4', 'A4', 'B4', 'D5', 'B4', 'A4', 'G4'],
    lead: { type: 'square', attack: 0.005, decay: 0.22, gain: 0.05, detune: 12, trem: 6 },
    bass: { type: 'triangle', gain: 0.2 },
    drums: 'backbeat'
  },
  synthwave: {
    bpm: 116,
    swing: 0.5,
    prog: [
      ['A2', 'C3', 'E3', 'G3'],
      ['F2', 'A2', 'C3', 'E3'],
      ['C3', 'E3', 'G3', 'B3'],
      ['G2', 'B2', 'D3', 'F3']
    ],
    melody: ['A4', 'C5', 'E5', 'A5', 'G5', 'E5', 'C5', 'B4'],
    lead: { type: 'sawtooth', attack: 0.004, decay: 0.16, gain: 0.045, detune: 14, filter: 1800, res: 12 },
    bass: { type: 'sawtooth', gain: 0.17, filter: 520 },
    pad: { type: 'sawtooth', gain: 0.035 },
    drums: 'electro'
  },
  poprock: {
    bpm: 128,
    swing: 0.5,
    prog: [
      ['D3', 'F#3', 'A3', 'D4'],
      ['A2', 'C#3', 'E3', 'A3'],
      ['B2', 'D3', 'F#3', 'B3'],
      ['G2', 'B2', 'D3', 'G3']
    ],
    melody: ['D5', 'F#5', 'A5', 'G5', 'F#5', 'E5', 'D5', 'A4'],
    lead: { type: 'sawtooth', attack: 0.006, decay: 0.2, gain: 0.04, detune: 10, filter: 2400 },
    bass: { type: 'square', gain: 0.15, filter: 600 },
    drums: 'rock'
  },
  lofi: {
    bpm: 82,
    swing: 0.56,
    prog: [
      ['F2', 'A2', 'C3', 'E3'],
      ['D2', 'F2', 'A2', 'C3'],
      ['G2', 'B2', 'D3', 'F3'],
      ['C3', 'E3', 'G3', 'B3']
    ],
    melody: ['A4', 'C5', 'E5', 'D5', 'C5', 'A4', 'G4', 'E4'],
    lead: { type: 'triangle', attack: 0.02, decay: 0.5, gain: 0.05, detune: 4, filter: 1400 },
    bass: { type: 'sine', gain: 0.2, filter: 300 },
    pad: { type: 'triangle', gain: 0.04 },
    drums: 'lofi',
    crackle: true
  },
  ambient: {
    bpm: 64,
    swing: 0.5,
    prog: [
      ['D2', 'A2', 'D3', 'F3'],
      ['C2', 'G2', 'C3', 'E3'],
      ['A#1', 'F2', 'A#2', 'D3'],
      ['C2', 'G2', 'C3', 'F3']
    ],
    melody: ['D4', 'F4', 'A4', 'C5', 'A4', 'F4', 'E4', 'D4'],
    lead: { type: 'sine', attack: 0.5, decay: 2.4, gain: 0.05, detune: 6 },
    bass: { type: 'sine', gain: 0.16 },
    pad: { type: 'sawtooth', gain: 0.05, filter: 900 },
    drums: 'none',
    shimmer: true
  }
};

/* ------------------------------------------------------------------ */

export class AudioEngine {
  constructor() {
    this.ready = false;
    this.enabled = true;
    this.ctx = null;
    this.era = null;
    this.night = false;
    this.nextNoteTime = 0;
    this.step = 0;
    this.eventTimers = new Map();
    this.emitters = [];
    this.listenerPos = { x: 0, y: 2, z: 20 };
  }

  async start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC({ latencyHint: 'interactive' });
    this.ctx = ctx;

    /* master chain: bus → compressor → limiter-ish gain → out */
    this.master = ctx.createGain();
    this.master.gain.value = 0.85;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -16;
    this.comp.knee.value = 22;
    this.comp.ratio.value = 5;
    this.comp.attack.value = 0.005;
    this.comp.release.value = 0.22;
    this.master.connect(this.comp);
    this.comp.connect(ctx.destination);

    /* reverb: a synthesised impulse response (street canyon) */
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._impulse(2.6, 2.4);
    this.revGain = ctx.createGain();
    this.revGain.gain.value = 0.32;
    this.reverb.connect(this.revGain);
    this.revGain.connect(this.master);

    /* sub-buses */
    this.busAmb = ctx.createGain();
    this.busAmb.gain.value = 0.5;
    this.busMusic = ctx.createGain();
    this.busMusic.gain.value = 0.42;
    this.busSfx = ctx.createGain();
    this.busSfx.gain.value = 0.7;
    for (const b of [this.busAmb, this.busMusic, this.busSfx]) {
      b.connect(this.master);
      const send = ctx.createGain();
      send.gain.value = b === this.busSfx ? 0.4 : 0.22;
      b.connect(send);
      send.connect(this.reverb);
    }

    /* noise buffers */
    this.noise = this._noiseBuffer(4, 'white');
    this.brown = this._noiseBuffer(6, 'brown');

    this._buildAmbience();
    this.ready = true;
    if (this.era) this.setEra(this.era, { instant: true });
  }

  _impulse(seconds = 2.4, decay = 2.6) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // a few discrete early reflections then exponential tail
        let s = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
        if (i < len * 0.06 && Math.random() < 0.02) s += (Math.random() * 2 - 1) * 0.6;
        d[i] = s;
      }
    }
    return buf;
  }

  _noiseBuffer(seconds, kind) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.2;
      } else d[i] = w;
    }
    return buf;
  }

  /** Continuous traffic bed + a low rumble that follows the era. */
  _buildAmbience() {
    const ctx = this.ctx;
    this.ambSrc = ctx.createBufferSource();
    this.ambSrc.buffer = this.brown;
    this.ambSrc.loop = true;
    this.ambFilter = ctx.createBiquadFilter();
    this.ambFilter.type = 'lowpass';
    this.ambFilter.frequency.value = 600;
    this.ambFilter.Q.value = 0.7;
    this.ambGain = ctx.createGain();
    this.ambGain.gain.value = 0.0;
    this.ambSrc.connect(this.ambFilter);
    this.ambFilter.connect(this.ambGain);
    this.ambGain.connect(this.busAmb);
    this.ambSrc.start();

    // slow amplitude movement so the bed breathes like passing traffic
    this.ambLfo = ctx.createOscillator();
    this.ambLfo.frequency.value = 0.07;
    this.ambLfoGain = ctx.createGain();
    this.ambLfoGain.gain.value = 0.06;
    this.ambLfo.connect(this.ambLfoGain);
    this.ambLfoGain.connect(this.ambGain.gain);
    this.ambLfo.start();

    // high hiss layer (wind, tyre noise, HVAC)
    this.hissSrc = ctx.createBufferSource();
    this.hissSrc.buffer = this.noise;
    this.hissSrc.loop = true;
    this.hissFilter = ctx.createBiquadFilter();
    this.hissFilter.type = 'bandpass';
    this.hissFilter.frequency.value = 2400;
    this.hissFilter.Q.value = 0.6;
    this.hissGain = ctx.createGain();
    this.hissGain.gain.value = 0.012;
    this.hissSrc.connect(this.hissFilter);
    this.hissFilter.connect(this.hissGain);
    this.hissGain.connect(this.busAmb);
    this.hissSrc.start();

    // sub-bass presence
    this.subOsc = ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.value = 52;
    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0.01;
    this.subOsc.connect(this.subGain);
    this.subGain.connect(this.busAmb);
    this.subOsc.start();

    // vinyl crackle (used by the lo-fi era)
    this.crackSrc = ctx.createBufferSource();
    this.crackSrc.buffer = this.noise;
    this.crackSrc.loop = true;
    this.crackFilter = ctx.createBiquadFilter();
    this.crackFilter.type = 'highpass';
    this.crackFilter.frequency.value = 3600;
    this.crackGain = ctx.createGain();
    this.crackGain.gain.value = 0;
    this.crackSrc.connect(this.crackFilter);
    this.crackFilter.connect(this.crackGain);
    this.crackGain.connect(this.busAmb);
    this.crackSrc.start();
  }

  /* ---------------------------------------------------------------- */

  setEra(era, { instant = false } = {}) {
    this.era = era;
    if (!this.ready) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const ramp = instant ? 0.01 : 1.6;
    const a = era.audio;

    this.ambFilter.frequency.cancelScheduledValues(t);
    this.ambFilter.frequency.linearRampToValueAtTime(a.trafficTone.cutoff, t + ramp);
    this.ambGain.gain.cancelScheduledValues(t);
    this.ambGain.gain.linearRampToValueAtTime(a.trafficTone.level * a.ambienceLevel, t + ramp);
    this.hissGain.gain.linearRampToValueAtTime(era.year >= 2025 ? 0.02 : 0.012, t + ramp);
    this.subGain.gain.linearRampToValueAtTime(era.year >= 2055 ? 0.03 : era.year === 1985 ? 0.02 : 0.012, t + ramp);
    this.subOsc.frequency.linearRampToValueAtTime(era.year >= 2055 ? 44 : 52, t + ramp);
    this.crackGain.gain.linearRampToValueAtTime(MUSIC[a.music]?.crackle ? 0.02 : 0, t + ramp);

    this.music = MUSIC[a.music] || MUSIC.lofi;
    this.stepDur = 60 / this.music.bpm / 4;
    this.nextNoteTime = Math.max(this.nextNoteTime, t + 0.06);
    this.step = 0;

    // reset scheduled random events
    this.eventTimers.clear();
    for (const e of a.events) this.eventTimers.set(e.kind, { t: e.every * Math.random() * 0.6 + 1.5, cfg: e });

    this._buildEmitters(a.emitters);
  }

  /** Positional loops: jukeboxes, arcades, HVAC, the maglev overhead. */
  _buildEmitters(list) {
    for (const e of this.emitters) {
      try {
        e.stop();
      } catch {}
    }
    this.emitters = [];
    if (!list) return;
    const spots = {
      'radio-diner': { pos: [-16, 3, -10], kind: 'radio' },
      'jukebox-diner': { pos: [-16, 3, -10], kind: 'radio' },
      'cafe-espresso': { pos: [-16, 2.5, -10], kind: 'steam' },
      'cafe-patio': { pos: [-16, 2, -6], kind: 'chatter' },
      'arcade-tower': { pos: [5, 2.5, -11], kind: 'arcade' },
      'radio-records': { pos: [17, 3, -11], kind: 'radio' },
      'boombox': { pos: [17, 1.5, -8], kind: 'beat' },
      'laundry-hum': { pos: [-25, 2, 11], kind: 'hum' },
      'construction': { pos: [-2, 4, 12], kind: 'hum' },
      'store-radio': { pos: [-7, 2.5, -11], kind: 'radio' },
      'ebike-hum': { pos: [17, 1.5, -10], kind: 'whine' },
      'hvac': { pos: [8, 12, -20], kind: 'hum' },
      streetcar: { pos: [0, 2, 0], kind: 'hum' },
      newsboy: { pos: [-34, 1.6, -8], kind: 'chatter' },
      maglev: { pos: [0, 15, 0], kind: 'whine' },
      mister: { pos: [-16, 3, -8], kind: 'steam' },
      'holo-hum': { pos: [5, 5, -11], kind: 'whine' }
    };
    for (const name of list) {
      const spot = spots[name];
      if (!spot) continue;
      const e = this._makeEmitter(spot.kind, spot.pos);
      if (e) this.emitters.push(e);
    }
  }

  _makeEmitter(kind, pos) {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0;
    const panner = ctx.createStereoPanner();
    out.connect(panner);
    panner.connect(this.busAmb);
    const nodes = [];

    if (kind === 'hum' || kind === 'whine') {
      const o = ctx.createOscillator();
      o.type = kind === 'whine' ? 'sawtooth' : 'sine';
      o.frequency.value = kind === 'whine' ? 320 : 96;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = kind === 'whine' ? 1400 : 300;
      const g = ctx.createGain();
      g.gain.value = kind === 'whine' ? 0.05 : 0.09;
      o.connect(filt);
      filt.connect(g);
      g.connect(out);
      o.start();
      nodes.push(o);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.3;
      const lg = ctx.createGain();
      lg.gain.value = kind === 'whine' ? 20 : 4;
      lfo.connect(lg);
      lg.connect(o.frequency);
      lfo.start();
      nodes.push(lfo);
    } else if (kind === 'steam') {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 3800;
      filt.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      src.connect(filt);
      filt.connect(g);
      g.connect(out);
      src.start();
      nodes.push(src);
    } else if (kind === 'radio' || kind === 'beat' || kind === 'arcade' || kind === 'chatter') {
      // driven by the scheduler; this emitter just provides the output path
      out.userData = { kind };
    }

    return {
      kind,
      pos,
      out,
      panner,
      nodes,
      stop() {
        for (const n of nodes) {
          try {
            n.stop();
          } catch {}
        }
        try {
          out.disconnect();
        } catch {}
      }
    };
  }

  /* ---------------------------------------------------------------- */

  setMuted(muted) {
    this.enabled = !muted;
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.85, t + 0.25);
  }

  setNight(on) {
    this.night = on;
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.ambGain.gain.linearRampToValueAtTime((this.era?.audio.trafficTone.level ?? 0.4) * (this.era?.audio.ambienceLevel ?? 0.5) * (on ? 0.55 : 1), t + 1.2);
  }

  setListener(pos) {
    this.listenerPos = pos;
  }

  /* ------------------------------ voices --------------------------- */

  _env(node, at, { a = 0.01, d = 0.2, s = 0, r = 0.1, peak = 1 } = {}) {
    const g = node.gain;
    g.cancelScheduledValues(at);
    g.setValueAtTime(0.0001, at);
    g.linearRampToValueAtTime(peak, at + a);
    if (s > 0) {
      g.linearRampToValueAtTime(peak * 0.7, at + a + d);
      g.setValueAtTime(peak * 0.7, at + a + d + s);
      g.linearRampToValueAtTime(0.0001, at + a + d + s + r);
    } else {
      g.exponentialRampToValueAtTime(0.0001, at + a + d);
    }
  }

  _tone(freq, at, dur, { type = 'sine', gain = 0.1, bus = null, filter = 0, res = 1, detune = 0, attack = 0.01, trem = 0, glide = 0 } = {}) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * glide), at + dur);
    const g = ctx.createGain();
    let node = g;
    if (filter) {
      const fl = ctx.createBiquadFilter();
      fl.type = 'lowpass';
      fl.frequency.setValueAtTime(filter, at);
      fl.frequency.exponentialRampToValueAtTime(Math.max(160, filter * 0.35), at + dur);
      fl.Q.value = res;
      g.connect(fl);
      node = fl;
    }
    o.connect(g);
    node.connect(bus || this.busMusic);
    this._env(g, at, { a: attack, d: dur, peak: gain });
    if (detune) {
      const o2 = ctx.createOscillator();
      o2.type = type;
      o2.frequency.setValueAtTime(freq, at);
      o2.detune.value = detune;
      o2.connect(g);
      o2.start(at);
      o2.stop(at + dur + 0.1);
    }
    if (trem) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = trem;
      const lg = ctx.createGain();
      lg.gain.value = gain * 0.5;
      lfo.connect(lg);
      lg.connect(g.gain);
      lfo.start(at);
      lfo.stop(at + dur + 0.1);
    }
    o.start(at);
    o.stop(at + dur + 0.12);
    return o;
  }

  _noiseHit(at, dur, { freq = 4000, Q = 1, gain = 0.1, type = 'bandpass', bus = null } = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const fl = ctx.createBiquadFilter();
    fl.type = type;
    fl.frequency.setValueAtTime(freq, at);
    fl.Q.value = Q;
    const g = ctx.createGain();
    src.connect(fl);
    fl.connect(g);
    g.connect(bus || this.busSfx);
    this._env(g, at, { a: 0.002, d: dur, peak: gain });
    src.start(at);
    src.stop(at + dur + 0.05);
    return src;
  }

  _kick(at, gain = 0.32) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, at);
    o.frequency.exponentialRampToValueAtTime(46, at + 0.14);
    const g = ctx.createGain();
    o.connect(g);
    g.connect(this.busMusic);
    this._env(g, at, { a: 0.002, d: 0.2, peak: gain });
    o.start(at);
    o.stop(at + 0.3);
  }

  /* ---------------------------- sequencer -------------------------- */

  _scheduleMusic() {
    if (!this.music || !this.ready) return;
    const ctx = this.ctx;
    const lookahead = 0.35;
    const m = this.music;
    while (this.nextNoteTime < ctx.currentTime + lookahead) {
      const at = this.nextNoteTime;
      const s = this.step;
      const bar = Math.floor(s / 16) % m.prog.length;
      const chord = m.prog[bar];
      const inBar = s % 16;
      const swung = inBar % 2 === 1 ? (m.swing - 0.5) * this.stepDur * 2 : 0;
      const tt = at + swung;

      /* bass */
      if (inBar % 4 === 0 || (m.drums === 'swing' && inBar % 2 === 0)) {
        const note = chord[inBar % 4 === 0 ? 0 : (inBar / 2) % chord.length];
        this._tone(f(note) / 2, tt, m.drums === 'swing' ? this.stepDur * 1.6 : this.stepDur * 3.4, {
          type: m.bass.type,
          gain: m.bass.gain,
          filter: m.bass.filter || 0,
          attack: 0.01
        });
      }

      /* chords / pad */
      if (m.pad && inBar === 0) {
        for (const n of chord) {
          this._tone(f(n), tt, this.stepDur * 15, { type: m.pad.type, gain: m.pad.gain, filter: m.pad.filter || 1200, attack: 0.6 });
        }
      }
      if (m.drums === 'swing' && (inBar === 4 || inBar === 12)) {
        for (const n of chord.slice(1)) this._tone(f(n) * 2, tt, this.stepDur * 1.2, { type: m.lead.type, gain: 0.035, filter: 2600, attack: 0.01 });
      }
      if (m.drums === 'rock' && inBar % 8 === 0) {
        for (const n of chord.slice(0, 3)) this._tone(f(n) * 2, tt, this.stepDur * 6, { type: 'sawtooth', gain: 0.026, filter: 1600, attack: 0.02 });
      }

      /* lead / arpeggio */
      const melIdx = Math.floor(s / 2) % m.melody.length;
      const playLead =
        m.drums === 'electro'
          ? true
          : m.drums === 'ambient' || m.drums === 'none'
            ? inBar % 8 === 0
            : inBar % 2 === 0 && (s % 32 < 24 || m.drums === 'swing');
      if (playLead) {
        const note = m.drums === 'electro' ? chord[s % chord.length] : m.melody[melIdx];
        const oct = m.drums === 'electro' ? 2 : 1;
        this._tone(f(note) * oct, tt, m.lead.decay, {
          type: m.lead.type,
          gain: m.lead.gain,
          filter: m.lead.filter || 0,
          res: m.lead.res || 1,
          detune: m.lead.detune,
          attack: m.lead.attack,
          trem: m.lead.trem || 0
        });
      }

      /* drums */
      switch (m.drums) {
        case 'swing':
          if (inBar % 4 === 0) this._noiseHit(tt, 0.14, { freq: 7200, Q: 0.7, gain: 0.045, bus: this.busMusic });
          if (inBar % 2 === 1) this._noiseHit(tt, 0.09, { freq: 8600, Q: 0.7, gain: 0.028, bus: this.busMusic });
          if (inBar === 4 || inBar === 12) this._noiseHit(tt, 0.12, { freq: 2200, Q: 1.2, gain: 0.05, bus: this.busMusic });
          break;
        case 'backbeat':
          if (inBar % 8 === 0) this._kick(tt, 0.26);
          if (inBar === 4 || inBar === 12) this._noiseHit(tt, 0.16, { freq: 1900, Q: 1, gain: 0.08, bus: this.busMusic });
          if (inBar % 2 === 0) this._noiseHit(tt, 0.05, { freq: 9200, Q: 0.8, gain: 0.02, bus: this.busMusic });
          break;
        case 'electro':
          if (inBar % 8 === 0) this._kick(tt, 0.34);
          if (inBar === 4 || inBar === 12) this._noiseHit(tt, 0.2, { freq: 1600, Q: 0.9, gain: 0.075, bus: this.busMusic });
          if (inBar % 2 === 1) this._noiseHit(tt, 0.04, { freq: 11000, Q: 1.2, gain: 0.022, bus: this.busMusic });
          break;
        case 'rock':
          if (inBar % 8 === 0 || inBar === 6) this._kick(tt, 0.28);
          if (inBar === 4 || inBar === 12) this._noiseHit(tt, 0.17, { freq: 1800, Q: 1, gain: 0.07, bus: this.busMusic });
          if (inBar % 2 === 0) this._noiseHit(tt, 0.05, { freq: 9800, Q: 0.9, gain: 0.02, bus: this.busMusic });
          break;
        case 'lofi':
          if (inBar === 0 || inBar === 10) this._kick(tt, 0.22);
          if (inBar === 4 || inBar === 12) this._noiseHit(tt, 0.13, { freq: 1400, Q: 0.8, gain: 0.05, bus: this.busMusic });
          if (inBar % 4 === 2) this._noiseHit(tt, 0.05, { freq: 7200, Q: 0.7, gain: 0.014, bus: this.busMusic });
          break;
        default:
          if (m.shimmer && inBar === 8 && Math.random() < 0.5) {
            this._tone(f(m.melody[(melIdx + 2) % m.melody.length]) * 2, tt, 3.2, { type: 'sine', gain: 0.03, attack: 0.8 });
          }
          break;
      }

      this.step = (s + 1) % (16 * m.prog.length);
      this.nextNoteTime += this.stepDur;
    }
  }

  /* ---------------------------- one-shots -------------------------- */

  oneShot(kind, { pan = 0, gain = 1 } = {}) {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    const at = ctx.currentTime + 0.02;
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    panner.connect(this.busSfx);
    const bus = panner;
    const G = gain;

    switch (kind) {
      case 'ahooga': {
        // two-tone vacuum horn with a wheeze
        for (let i = 0; i < 2; i++) {
          const t0 = at + i * 0.34;
          this._tone(i ? 196 : 262, t0, 0.3, { type: 'sawtooth', gain: 0.16 * G, bus, filter: 1300, detune: 22, attack: 0.03 });
          this._tone(i ? 392 : 524, t0, 0.3, { type: 'square', gain: 0.05 * G, bus, filter: 1800, attack: 0.03 });
        }
        break;
      }
      case 'horn':
      case 'classic': {
        this._tone(392, at, 0.5, { type: 'square', gain: 0.11 * G, bus, filter: 2400, detune: 14, attack: 0.01 });
        this._tone(494, at, 0.5, { type: 'square', gain: 0.08 * G, bus, filter: 2400, detune: -14, attack: 0.01 });
        break;
      }
      case 'beep': {
        for (let i = 0; i < 2; i++) this._tone(880, at + i * 0.16, 0.09, { type: 'square', gain: 0.07 * G, bus });
        break;
      }
      case 'polite':
      case 'chime': {
        this._tone(1174, at, 0.5, { type: 'sine', gain: 0.09 * G, bus, attack: 0.005 });
        this._tone(1568, at + 0.09, 0.6, { type: 'sine', gain: 0.07 * G, bus, attack: 0.005 });
        break;
      }
      case 'trolleybell': {
        for (let i = 0; i < 2; i++) {
          const t0 = at + i * 0.22;
          this._tone(1046, t0, 0.7, { type: 'triangle', gain: 0.1 * G, bus, attack: 0.001 });
          this._tone(1567, t0, 0.5, { type: 'sine', gain: 0.05 * G, bus, attack: 0.001 });
          this._noiseHit(t0, 0.06, { freq: 5200, Q: 3, gain: 0.03 * G, bus });
        }
        break;
      }
      case 'propplane': {
        const src = ctx.createBufferSource();
        src.buffer = this.brown;
        src.loop = true;
        const fl = ctx.createBiquadFilter();
        fl.type = 'lowpass';
        fl.frequency.value = 420;
        const g = ctx.createGain();
        const lfo = ctx.createOscillator();
        lfo.type = 'sawtooth';
        lfo.frequency.value = 26;
        const lg = ctx.createGain();
        lg.gain.value = 0.05;
        lfo.connect(lg);
        lg.connect(g.gain);
        src.connect(fl);
        fl.connect(g);
        g.connect(bus);
        this._env(g, at, { a: 2.4, d: 3.4, s: 1.4, r: 3, peak: 0.09 * G });
        const p2 = ctx.createStereoPanner();
        src.start(at);
        lfo.start(at);
        src.stop(at + 10);
        lfo.stop(at + 10);
        panner.pan.setValueAtTime(-0.9, at);
        panner.pan.linearRampToValueAtTime(0.9, at + 9);
        break;
      }
      case 'jet': {
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        src.loop = true;
        const fl = ctx.createBiquadFilter();
        fl.type = 'lowpass';
        fl.frequency.setValueAtTime(300, at);
        fl.frequency.linearRampToValueAtTime(900, at + 4);
        fl.frequency.linearRampToValueAtTime(240, at + 9);
        const g = ctx.createGain();
        src.connect(fl);
        fl.connect(g);
        g.connect(bus);
        this._env(g, at, { a: 3, d: 3, s: 1, r: 3, peak: 0.05 * G });
        src.start(at);
        src.stop(at + 11);
        panner.pan.setValueAtTime(0.8, at);
        panner.pan.linearRampToValueAtTime(-0.8, at + 9);
        break;
      }
      case 'v8': {
        const src = ctx.createBufferSource();
        src.buffer = this.brown;
        src.loop = true;
        const fl = ctx.createBiquadFilter();
        fl.type = 'lowpass';
        fl.frequency.setValueAtTime(180, at);
        fl.frequency.linearRampToValueAtTime(700, at + 1.6);
        fl.frequency.linearRampToValueAtTime(200, at + 3.4);
        const g = ctx.createGain();
        src.connect(fl);
        fl.connect(g);
        g.connect(bus);
        this._env(g, at, { a: 0.4, d: 1.2, s: 0.8, r: 1.2, peak: 0.14 * G });
        src.start(at);
        src.stop(at + 4);
        panner.pan.setValueAtTime(-0.7, at);
        panner.pan.linearRampToValueAtTime(0.7, at + 3.4);
        break;
      }
      case 'siren': {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        const g = ctx.createGain();
        const fl = ctx.createBiquadFilter();
        fl.type = 'bandpass';
        fl.frequency.value = 1200;
        fl.Q.value = 2;
        o.connect(fl);
        fl.connect(g);
        g.connect(bus);
        for (let i = 0; i < 8; i++) {
          o.frequency.setValueAtTime(660, at + i * 0.7);
          o.frequency.linearRampToValueAtTime(1180, at + i * 0.7 + 0.35);
          o.frequency.linearRampToValueAtTime(660, at + i * 0.7 + 0.7);
        }
        this._env(g, at, { a: 1.4, d: 1.4, s: 2.2, r: 1.6, peak: 0.055 * G });
        o.start(at);
        o.stop(at + 6.5);
        panner.pan.setValueAtTime(-0.85, at);
        panner.pan.linearRampToValueAtTime(0.85, at + 6);
        break;
      }
      case 'carAlarm': {
        for (let i = 0; i < 10; i++) {
          const t0 = at + i * 0.24;
          this._tone(i % 2 ? 1046 : 784, t0, 0.16, { type: 'square', gain: 0.05 * G, bus });
        }
        break;
      }
      case 'subwayRumble': {
        const src = ctx.createBufferSource();
        src.buffer = this.brown;
        src.loop = true;
        const fl = ctx.createBiquadFilter();
        fl.type = 'lowpass';
        fl.frequency.value = 120;
        const g = ctx.createGain();
        src.connect(fl);
        fl.connect(g);
        g.connect(bus);
        this._env(g, at, { a: 1.6, d: 1.4, s: 1.2, r: 2.4, peak: 0.16 * G });
        src.start(at);
        src.stop(at + 7);
        break;
      }
      case 'ringtone': {
        const mel = [1318, 1174, 1046, 1174, 1318, 1568];
        for (let i = 0; i < mel.length; i++) this._tone(mel[i], at + i * 0.13, 0.11, { type: 'square', gain: 0.045 * G, bus });
        break;
      }
      case 'notification': {
        this._tone(1568, at, 0.1, { type: 'sine', gain: 0.06 * G, bus });
        this._tone(2093, at + 0.1, 0.16, { type: 'sine', gain: 0.05 * G, bus });
        break;
      }
      case 'beepReverse': {
        for (let i = 0; i < 6; i++) this._tone(1046, at + i * 0.5, 0.2, { type: 'square', gain: 0.04 * G, bus });
        break;
      }
      case 'scooter': {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, at);
        o.frequency.linearRampToValueAtTime(560, at + 1.4);
        o.frequency.linearRampToValueAtTime(180, at + 3);
        const fl = ctx.createBiquadFilter();
        fl.type = 'lowpass';
        fl.frequency.value = 1400;
        const g = ctx.createGain();
        o.connect(fl);
        fl.connect(g);
        g.connect(bus);
        this._env(g, at, { a: 0.5, d: 0.8, s: 0.6, r: 1, peak: 0.045 * G });
        o.start(at);
        o.stop(at + 3.4);
        panner.pan.setValueAtTime(-0.6, at);
        panner.pan.linearRampToValueAtTime(0.6, at + 3);
        break;
      }
      case 'drone':
      case 'droneSwarm': {
        const n = kind === 'droneSwarm' ? 3 : 1;
        for (let i = 0; i < n; i++) {
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = 240 + i * 46;
          const fl = ctx.createBiquadFilter();
          fl.type = 'bandpass';
          fl.frequency.value = 900 + i * 260;
          fl.Q.value = 3;
          const g = ctx.createGain();
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 42 + i * 7;
          const lg = ctx.createGain();
          lg.gain.value = 60;
          lfo.connect(lg);
          lg.connect(o.frequency);
          o.connect(fl);
          fl.connect(g);
          g.connect(bus);
          this._env(g, at + i * 0.3, { a: 1.2, d: 1, s: 1.4, r: 1.6, peak: 0.035 * G });
          o.start(at);
          lfo.start(at);
          o.stop(at + 6);
          lfo.stop(at + 6);
        }
        panner.pan.setValueAtTime(0.7, at);
        panner.pan.linearRampToValueAtTime(-0.7, at + 5);
        break;
      }
      case 'maglevPass': {
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        src.loop = true;
        const fl = ctx.createBiquadFilter();
        fl.type = 'bandpass';
        fl.frequency.setValueAtTime(400, at);
        fl.frequency.exponentialRampToValueAtTime(2600, at + 1.6);
        fl.frequency.exponentialRampToValueAtTime(320, at + 3.6);
        fl.Q.value = 1.4;
        const g = ctx.createGain();
        src.connect(fl);
        fl.connect(g);
        g.connect(bus);
        this._env(g, at, { a: 1, d: 0.9, s: 0.6, r: 1.4, peak: 0.11 * G });
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(70, at);
        o.frequency.linearRampToValueAtTime(120, at + 1.6);
        o.frequency.linearRampToValueAtTime(60, at + 3.6);
        const og = ctx.createGain();
        o.connect(og);
        og.connect(bus);
        this._env(og, at, { a: 0.8, d: 0.8, s: 0.8, r: 1.4, peak: 0.1 * G });
        src.start(at);
        o.start(at);
        src.stop(at + 4.2);
        o.stop(at + 4.2);
        panner.pan.setValueAtTime(-0.95, at);
        panner.pan.linearRampToValueAtTime(0.95, at + 3.6);
        break;
      }
      case 'aiVoice': {
        // formant-ish blips: a public announcement without words
        const notes = [520, 660, 590, 720, 640];
        for (let i = 0; i < notes.length; i++) {
          this._tone(notes[i], at + i * 0.17, 0.15, { type: 'sine', gain: 0.05 * G, bus, filter: 1600 });
          this._tone(notes[i] * 2.4, at + i * 0.17, 0.12, { type: 'triangle', gain: 0.016 * G, bus, filter: 3200 });
        }
        break;
      }
      case 'chatter': {
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const t0 = at + i * (0.16 + Math.random() * 0.2);
          const base = 140 + Math.random() * 190;
          this._tone(base, t0, 0.12 + Math.random() * 0.1, { type: 'sawtooth', gain: 0.02 * G, bus, filter: 700 + Math.random() * 600, res: 5 });
        }
        panner.pan.value = Math.random() * 1.6 - 0.8;
        break;
      }
      case 'skateboard': {
        for (let i = 0; i < 14; i++) {
          this._noiseHit(at + i * 0.14, 0.06, { freq: 2600 + Math.random() * 1800, Q: 2, gain: 0.02 * G, bus });
        }
        break;
      }
      case 'arcade': {
        const notes = [880, 1174, 659, 987, 1318];
        for (let i = 0; i < 5; i++) this._tone(notes[i], at + i * 0.11, 0.08, { type: 'square', gain: 0.03 * G, bus });
        break;
      }
      case 'whoosh': {
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const fl = ctx.createBiquadFilter();
        fl.type = 'bandpass';
        fl.frequency.setValueAtTime(160, at);
        fl.frequency.exponentialRampToValueAtTime(5200, at + 0.7);
        fl.frequency.exponentialRampToValueAtTime(220, at + 1.9);
        fl.Q.value = 1.1;
        const g = ctx.createGain();
        src.connect(fl);
        fl.connect(g);
        g.connect(bus);
        this._env(g, at, { a: 0.25, d: 0.5, s: 0.4, r: 0.9, peak: 0.3 * G });
        src.start(at);
        src.stop(at + 2.2);
        // rising shepard-ish tone under the noise
        for (let i = 0; i < 3; i++) {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.setValueAtTime(80 * (i + 1), at);
          o.frequency.exponentialRampToValueAtTime(700 * (i + 1), at + 1.5);
          const og = ctx.createGain();
          o.connect(og);
          og.connect(bus);
          this._env(og, at, { a: 0.3, d: 0.6, s: 0.3, r: 0.6, peak: 0.05 * G });
          o.start(at);
          o.stop(at + 1.8);
        }
        break;
      }
      case 'thump': {
        this._kick(at, 0.3 * G);
        this._noiseHit(at, 0.4, { freq: 200, Q: 0.6, gain: 0.14 * G, bus, type: 'lowpass' });
        break;
      }
      case 'click': {
        this._tone(2200, at, 0.03, { type: 'square', gain: 0.03 * G, bus });
        break;
      }
      case 'tick': {
        this._noiseHit(at, 0.02, { freq: 6400, Q: 4, gain: 0.05 * G, bus });
        break;
      }
      case 'shutter': {
        this._noiseHit(at, 0.05, { freq: 3400, Q: 2, gain: 0.09 * G, bus });
        this._noiseHit(at + 0.07, 0.04, { freq: 2400, Q: 2, gain: 0.06 * G, bus });
        break;
      }
      default:
        break;
    }
  }

  /** Big transition sound: whoosh + impact + a bell for the arrival. */
  transition(dir = 1) {
    if (!this.ready) return;
    this.oneShot('whoosh', { pan: -dir * 0.6, gain: 1 });
    const ctx = this.ctx;
    setTimeout(() => this.oneShot('thump', { gain: 0.9 }), 900);
    setTimeout(() => {
      if (!this.ready) return;
      const at = ctx.currentTime + 0.02;
      this._tone(1568, at, 1.4, { type: 'sine', gain: 0.06, bus: this.busSfx, attack: 0.004 });
      this._tone(2093, at + 0.05, 1.2, { type: 'sine', gain: 0.04, bus: this.busSfx, attack: 0.004 });
    }, 1150);
  }

  /* ---------------------------- per frame -------------------------- */

  update(dt, cameraPos) {
    if (!this.ready || !this.era) return;
    if (this.ctx.state === 'suspended') return;
    this._scheduleMusic();

    /* random era events */
    for (const [kind, state] of this.eventTimers) {
      state.t -= dt;
      if (state.t <= 0) {
        state.t = state.cfg.every + (Math.random() - 0.5) * 2 * (state.cfg.jitter || 0);
        if (this.enabled) this.oneShot(kind, { pan: Math.random() * 1.6 - 0.8, gain: kind === 'chatter' ? 0.8 : 1 });
      }
    }

    /* positional emitters: distance attenuation + stereo placement */
    for (const e of this.emitters) {
      const dx = e.pos[0] - cameraPos.x;
      const dy = e.pos[1] - cameraPos.y;
      const dz = e.pos[2] - cameraPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const level = Math.max(0, 1 - dist / 34);
      const target = level * level * (e.kind === 'whine' ? 0.9 : 1);
      const t = this.ctx.currentTime;
      e.out.gain.setTargetAtTime(target, t, 0.4);
      e.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, dx / 18)), t, 0.4);
      if (e.kind === 'radio' || e.kind === 'arcade' || e.kind === 'beat' || e.kind === 'chatter') {
        e.acc = (e.acc || 0) + dt;
        const gate = e.kind === 'arcade' ? 1.6 : e.kind === 'beat' ? 0.55 : 3.4;
        if (e.acc > gate && level > 0.08) {
          e.acc = 0;
          const at = t + 0.02;
          if (e.kind === 'arcade') {
            const notes = [880, 1174, 659, 987, 1318, 1568];
            for (let i = 0; i < 3; i++)
              this._tone(notes[Math.floor(Math.random() * notes.length)], at + i * 0.1, 0.07, {
                type: 'square',
                gain: 0.05 * level,
                bus: e.out
              });
          } else if (e.kind === 'beat') {
            this._kick(at, 0.12 * level);
            this._noiseHit(at + 0.28, 0.08, { freq: 8200, Q: 0.8, gain: 0.02 * level, bus: e.out });
          } else if (e.kind === 'chatter') {
            for (let i = 0; i < 3; i++)
              this._tone(150 + Math.random() * 180, at + i * 0.2, 0.14, {
                type: 'sawtooth',
                gain: 0.02 * level,
                bus: e.out,
                filter: 800,
                res: 5
              });
          } else {
            // tinny radio through a small speaker
            const scale = [523, 587, 659, 784, 880, 1046];
            for (let i = 0; i < 4; i++)
              this._tone(scale[Math.floor(Math.random() * scale.length)], at + i * 0.22, 0.2, {
                type: 'square',
                gain: 0.022 * level,
                bus: e.out,
                filter: 2200,
                res: 4
              });
          }
        }
      }
    }
  }
}
