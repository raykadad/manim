/**
 * CHRONOBLOCK — one city block, six eras.
 *
 * Boots the renderer, builds 1945 up front and streams the other five decades
 * in during idle frames, then hands the timeline to the user.
 */

import * as THREE from 'three';
import { ERAS, YEARS, eraIndex } from './world/eras.js';
import { EraWorld } from './world/city.js';
import { buildGround } from './world/street.js';
import { Environment } from './world/environment.js';
import { ChronoWave, PuffSystem } from './world/effects.js';
import { CameraRig, VIEW_PRESETS } from './core/camera.js';
import { PostFX } from './core/postfx.js';
import { AudioEngine } from './core/audio.js';
import { UI } from './ui/ui.js';
import { setMaxAnisotropy } from './gfx/textures.js';
import { clamp, smoothstep, damp, easeInOutCubic } from './util/math.js';

const TRANSITION_MS = 2300;

class Chronoblock {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.clock = new THREE.Clock();
    this.time = 0;
    this.frames = 0;
    this.fps = 60;
    this.fpsAccum = 0;
    this.quality = 'high';
    this.night = false;
    this.playing = false;
    this.playTimer = 0;
    this.transition = null;
    this.pendingBuild = null;
    this.worlds = new Map();
    this.started = false;

    this._initRenderer();
    this._initScene();
    this._initUI();
    this._initInput();
  }

  /* ------------------------------------------------------------ */

  _initRenderer() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.info.autoReset = false;
    this.renderer = renderer;
    setMaxAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.12, 1400);
    this.camera.position.set(34, 12.5, 46);

    this.ground = buildGround(this.scene);
    this.env = new Environment(this.scene, { quality: this.quality });
    this.wave = new ChronoWave(this.scene);
    this.puffs = new PuffSystem(this.scene, { count: 300, color: '#dfe6ec', size: 1.9 });

    this.rig = new CameraRig(this.camera, this.canvas);
    this.rig.onModeChange = (m) => this.ui?.setMode(m);
    this.post = new PostFX(this.renderer, this.scene, this.camera, { quality: this.quality });
    this.audio = new AudioEngine();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
  }

  _initUI() {
    this.ui = new UI({
      onYear: (year, index, dir) => this.goToEra(index, dir),
      onEnter: () => this.enter(),
      onPreset: (i) => {
        const name = this.rig.applyPreset(i);
        this.ui.setMode('orbit');
        this.audio.oneShot('click');
      },
      onMode: (m) => {
        this.rig.setMode(m);
        this.ui.setMode(m);
        this.audio.oneShot('click');
      },
      onToggle: (key, on) => this.setToggle(key, on),
      onQuality: () => this.cycleQuality(),
      onPlayToggle: () => this.setPlaying(!this.playing)
    });
    this.ui.setEra(ERAS[0]);
    this.ui.setQualityLabel(this.quality);
  }

  _initInput() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => this.onKey(e));

    let downAt = null;
    this.canvas.addEventListener('pointerdown', (e) => {
      downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    this.canvas.addEventListener('pointerup', (e) => {
      if (!downAt) return;
      const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
      const quick = performance.now() - downAt.t < 420;
      const settled = performance.now() - (this._lastPick || 0) > 140;
      if (moved < 6 && quick && settled) {
        this._lastPick = performance.now();
        this.pick(e.clientX, e.clientY);
      }
      downAt = null;
    });
  }

  /* ------------------------------------------------------------ */

  async boot() {
    const first = ERAS[0];
    this.ui.boot(0.04, 'compiling shaders');
    await frame();

    // build 1945 with visible progress
    const world = new EraWorld(first, this.scene, { seed: 11 });
    this.worlds.set(first.year, world);
    const steps = world.buildSteps();
    let n = 0;
    const total = 10;
    for (;;) {
      const r = steps.next();
      if (r.done) break;
      n++;
      this.ui.boot(0.06 + (n / total) * 0.82, r.value);
      await frame();
    }
    world.show();
    world.field.reveal = 1;

    this.current = world;
    this.currentIndex = 0;
    this.env.apply(first.sky, first.weather, { instant: true });
    this.post.apply(first.grade, { instant: true });
    this.puffs.setEmitters(world.ventWorld);
    this.audio.setEra(first);

    // warm the pipeline so the first interactive frame is not a stutter
    this.ui.boot(0.94, 'warming the pipeline');
    await frame();
    this.renderer.compile(this.scene, this.camera);
    this.post.render(0.016, 0);
    await frame();

    this.ui.boot(1, 'ready');
    this.ui.bootReady();
    this.loop();
  }

  /** Stream the remaining eras in during spare frames. */
  _pumpBackgroundBuild(budgetMs = 7) {
    if (this.transition) return;
    if (!this.pendingBuild) {
      const next = ERAS.find((e) => !this.worlds.has(e.year));
      if (!next) return;
      const w = new EraWorld(next, this.scene, { seed: 11 });
      this.worlds.set(next.year, w);
      this.pendingBuild = { world: w, steps: w.buildSteps() };
    }
    const t0 = performance.now();
    while (performance.now() - t0 < budgetMs) {
      const r = this.pendingBuild.steps.next();
      if (r.done) {
        this.pendingBuild.world.hide();
        this.pendingBuild.world.field.reveal = 0;
        this.pendingBuild = null;
        break;
      }
    }
  }

  /** Force an era to finish building right now (used if the user jumps ahead). */
  _ensureBuilt(era) {
    let w = this.worlds.get(era.year);
    if (w?.built) return w;
    if (this.pendingBuild && this.pendingBuild.world.era.year === era.year) {
      while (!this.pendingBuild.steps.next().done) {
        /* finish it */
      }
      w = this.pendingBuild.world;
      this.pendingBuild = null;
      w.hide();
      w.field.reveal = 0;
      return w;
    }
    if (!w) {
      w = new EraWorld(era, this.scene, { seed: 11 });
      this.worlds.set(era.year, w);
    }
    const steps = w.buildSteps();
    while (!steps.next().done) {
      /* build it all */
    }
    w.hide();
    w.field.reveal = 0;
    return w;
  }

  /* ------------------------------------------------------------ */

  enter() {
    if (this.started) return;
    this.started = true;
    this.ui.bootDismiss();
    this.audio.start().then(() => {
      this.audio.setEra(ERAS[this.currentIndex], { instant: true });
      this.audio.oneShot('chime');
    });
    this.ui.setMode(this.rig.mode);
    setTimeout(() => this.ui.flashYear(YEARS[this.currentIndex]), 400);
  }

  goToEra(index, dir = 1) {
    if (index === this.currentIndex && this.current?.built) return;
    const era = ERAS[index];
    const from = this.current;
    const to = this._ensureBuilt(era);

    this.currentIndex = index;
    this.ui.setEra(era);
    this.ui.flashYear(era.year);
    this.env.apply(this.night ? era.night : era.sky, era.weather);
    this.post.apply(era.grade);
    this.post.pulse(0.16);
    this.audio.setEra(era);
    this.audio.transition(dir);
    this.rig.shake(0.35);
    this.wave.play(era.accent, TRANSITION_MS / 1000, dir);

    to.show();
    to.setNight(this.night);
    to.field.uniforms.uDir.value = dir > 0 ? 0 : 1;
    to.field.reveal = 0;
    if (from && from !== to) {
      from.field.uniforms.uDir.value = dir > 0 ? 0 : 1;
      from.field.reveal = 1;
    }
    this.puffs.setEmitters(to.ventWorld);

    this.transition = { from, to, start: performance.now(), dur: TRANSITION_MS, dir };
    this.current = to;
  }

  _updateTransition() {
    const tr = this.transition;
    if (!tr) return;
    // wall-clock so a build hitch never stretches the wipe
    const p = clamp((performance.now() - tr.start) / tr.dur);
    // the outgoing era dissolves away first, the incoming one follows it down the street
    if (tr.from && tr.from !== tr.to) {
      tr.from.field.reveal = 1 - smoothstep(clamp(p / 0.55));
      if (p > 0.62) tr.from.hide();
      else tr.from.show();
    }
    tr.to.field.reveal = smoothstep(clamp((p - 0.24) / 0.7));
    if (p >= 1) {
      tr.to.field.reveal = 1;
      if (tr.from && tr.from !== tr.to) tr.from.hide();
      this.transition = null;
    }
  }

  /* ------------------------------------------------------------ */

  setToggle(key, on) {
    if (key === 'audio') this.audio.setMuted(!on);
    if (key === 'weather') this.env.setWeatherEnabled(on);
    if (key === 'grade') this.post.setEnabled(on);
    if (key === 'night') this.setNight(on);
  }

  setNight(on) {
    this.night = on;
    const era = ERAS[this.currentIndex];
    this.env.apply(on ? era.night : era.sky, era.weather);
    for (const w of this.worlds.values()) w.setNight(on);
    this.audio.setNight(on);
    this.ui.setToggle('night', on);
  }

  setPlaying(on) {
    this.playing = on;
    this.playTimer = on ? 1.4 : 0;
    this.ui.setPlaying(on);
  }

  cycleQuality() {
    const order = ['high', 'medium', 'low'];
    this.quality = order[(order.indexOf(this.quality) + 1) % order.length];
    this.post.setQuality(this.quality);
    this.env.setQuality(this.quality);
    this.renderer.shadowMap.enabled = this.quality !== 'low';
    this.ui.setQualityLabel(this.quality);
  }

  onKey(e) {
    if (e.target instanceof HTMLInputElement) return;
    const k = e.code;
    if (k === 'ArrowLeft') this.ui.select(this.currentIndex - 1);
    else if (k === 'ArrowRight') this.ui.select(this.currentIndex + 1);
    else if (/^Digit[1-6]$/.test(k)) this.ui.select(parseInt(k.slice(5), 10) - 1);
    else if (k === 'Space' && !this.rig.pointerLocked) {
      e.preventDefault();
      this.setPlaying(!this.playing);
    } else if (k === 'KeyC') {
      this.rig.cycleMode();
      this.ui.setMode(this.rig.mode);
    } else if (k === 'KeyV') {
      this.rig.cyclePreset();
      this.ui.setMode('orbit');
    } else if (k === 'KeyN') this.setNight(!this.night);
    else if (k === 'KeyM') {
      const on = !this.audio.enabled;
      this.audio.setMuted(!on);
      this.ui.setToggle('audio', on);
    } else if (k === 'KeyW' && !this.rig.pointerLocked && this.rig.mode === 'orbit') {
      const on = !this.env.weatherEnabled;
      this.env.setWeatherEnabled(on);
      this.ui.setToggle('weather', on);
    } else if (k === 'KeyG') {
      const on = !this.post.enabled;
      this.post.setEnabled(on);
      this.ui.setToggle('grade', on);
    } else if (k === 'KeyQ') this.cycleQuality();
    else if (k === 'KeyH' || k === 'Slash') this.ui.toggleHelp();
    else if (k === 'KeyP') this.screenshot();
    else if (k === 'Escape') this.ui.toggleHelp(false);
  }

  pick(clientX, clientY) {
    if (!this.current) return;
    this.pointer.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.current.group, true);
    for (const hit of hits) {
      let o = hit.object;
      while (o) {
        if (o.userData?.info) {
          this.ui.showInspector(o.userData.info, clientX, clientY);
          this.audio.oneShot('tick');
          return;
        }
        o = o.parent;
      }
    }
    this.ui.hideInspector();
  }

  screenshot() {
    this.post.render(0.016, this.time);
    this.canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `chronoblock-${YEARS[this.currentIndex]}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    });
    this.audio.oneShot('shutter');
    this.post.pulse(0.3);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.post.setSize(w, h);
  }

  /* ------------------------------------------------------------ */

  loop() {
    const tick = () => {
      requestAnimationFrame(tick);
      const dt = Math.min(0.05, this.clock.getDelta());
      this.time += dt;

      this.rig.update(dt, this.time);
      this.env.update(dt, this.time, this.camera);
      this.renderer.toneMappingExposure = this.env.exposure;

      this._updateTransition();
      this.current?.update(dt, this.time, this.camera);
      if (this.transition?.from && this.transition.from !== this.current) {
        this.transition.from.update(dt, this.time, this.camera);
      }
      this.wave.update(dt, this.time);
      this.puffs.setLevel(this.env.weatherEnabled ? 1 : 0.25);
      this.puffs.update(dt, this.time);
      this.audio.setListener(this.camera.position);
      this.audio.update(dt, this.camera.position);

      if (this.playing) {
        this.playTimer -= dt;
        if (this.playTimer <= 0 && !this.transition) {
          this.playTimer = 8.5;
          const next = (this.currentIndex + 1) % YEARS.length;
          this.ui.select(next);
        }
      }

      this.renderer.info.reset();
      this.post.render(dt, this.time);

      // stats
      this.fpsAccum += dt;
      this.frames++;
      if (this.fpsAccum > 0.5) {
        this.fps = this.frames / this.fpsAccum;
        this.frames = 0;
        this.fpsAccum = 0;
        this.ui.setStats(this.fps, this.renderer.info.render.calls, this.renderer.info.render.triangles);
      }

      // stream the other decades in when there is headroom
      if (!this.transition && dt < 0.03) this._pumpBackgroundBuild(this.started ? 6 : 10);
    };
    tick();
  }
}

function frame() {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

const app = new Chronoblock();
app.boot();
window.chronoblock = app;
