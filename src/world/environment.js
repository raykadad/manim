/**
 * Lighting, fog and weather.
 *
 * Holds the sun, the hemisphere fill, exponential fog and the particle systems
 * (soot, rain, mist). Everything cross-fades so scrubbing the timeline reads as
 * one continuous afternoon that happens to last 110 years.
 */

import * as THREE from 'three';
import { Sky } from './sky.js';
import { makeRng } from '../util/rng.js';
import { particleTexture } from '../gfx/textures.js';
import { damp, DEG, lerp } from '../util/math.js';

const RAIN_COUNT = 2600;
const MOTE_COUNT = 700;

export class Environment {
  constructor(scene, { quality = 'high' } = {}) {
    this.scene = scene;
    this.sky = new Sky(scene);

    /* ---- fog --------------------------------------------------------- */
    this.fog = new THREE.FogExp2('#b6a58c', 0.0055);
    scene.fog = this.fog;
    this.fogTargetColor = new THREE.Color('#b6a58c');
    this.fogTargetDensity = 0.0055;

    /* ---- lights ------------------------------------------------------ */
    this.hemi = new THREE.HemisphereLight('#95a6bc', '#6b5a44', 0.62);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight('#ffc482', 2.7);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(quality === 'low' ? 1024 : 2048, quality === 'low' ? 1024 : 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 320;
    this.sun.shadow.camera.left = -78;
    this.sun.shadow.camera.right = 78;
    this.sun.shadow.camera.top = 62;
    this.sun.shadow.camera.bottom = -46;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.035;
    this.sun.target.position.set(0, 0, 0);
    scene.add(this.sun);
    scene.add(this.sun.target);

    /* A cool bounce from the opposite side keeps shadowed brick readable. */
    this.fill = new THREE.DirectionalLight('#8fa8c8', 0.35);
    this.fill.position.set(-60, 40, 70);
    scene.add(this.fill);

    this.state = {
      sunColor: new THREE.Color('#ffc482'),
      sunIntensity: 2.7,
      elevation: 21,
      azimuth: 202,
      hemiSky: new THREE.Color('#95a6bc'),
      hemiGround: new THREE.Color('#6b5a44'),
      hemiIntensity: 0.62,
      exposure: 1.04,
      wetness: 0.05
    };
    this.targetState = { ...this.state };

    /* ---- weather ------------------------------------------------------ */
    this._buildRain();
    this._buildMotes();
    this._buildMist();
    this.weather = { type: 'clear', intensity: 0, wetness: 0 };
    this.weatherEnabled = true;
    this.rainLevel = 0;
    this.mistLevel = 0;
    this.moteLevel = 0;
  }

  _buildRain() {
    const rng = makeRng(404);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(RAIN_COUNT * 3);
    const spd = new Float32Array(RAIN_COUNT);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = rng.range(-70, 70);
      pos[i * 3 + 1] = rng.range(0, 46);
      pos[i * 3 + 2] = rng.range(-60, 60);
      spd[i] = rng.range(24, 42);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.rainSpeeds = spd;
    this.rainMat = new THREE.PointsMaterial({
      map: particleTexture('streak'),
      color: '#c8d6e4',
      size: 0.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    this.rain = new THREE.Points(geo, this.rainMat);
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    this.scene.add(this.rain);
  }

  _buildMotes() {
    const rng = makeRng(909);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(MOTE_COUNT * 3);
    const phase = new Float32Array(MOTE_COUNT);
    for (let i = 0; i < MOTE_COUNT; i++) {
      pos[i * 3] = rng.range(-70, 70);
      pos[i * 3 + 1] = rng.range(0.4, 26);
      pos[i * 3 + 2] = rng.range(-45, 45);
      phase[i] = rng.range(0, Math.PI * 2);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.motePhase = phase;
    this.moteBase = pos.slice();
    this.moteMat = new THREE.PointsMaterial({
      map: particleTexture('dot'),
      color: '#d9c6a4',
      size: 0.09,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    this.motes = new THREE.Points(geo, this.moteMat);
    this.motes.frustumCulled = false;
    this.scene.add(this.motes);
  }

  _buildMist() {
    const rng = makeRng(1212);
    this.mistMat = new THREE.MeshBasicMaterial({
      map: particleTexture('flake'),
      color: '#9fd8ea',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      side: THREE.DoubleSide
    });
    this.mist = new THREE.Group();
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mistMat);
      const s = rng.range(16, 42);
      m.scale.set(s, s * 0.45, 1);
      m.position.set(rng.range(-70, 70), rng.range(0.5, 7), rng.range(-40, 40));
      m.userData.drift = rng.range(0.2, 0.8) * rng.sign();
      this.mist.add(m);
    }
    this.mist.visible = false;
    this.scene.add(this.mist);
  }

  /** Feed a (possibly blended) era config. */
  apply(sky, weather, { instant = false } = {}) {
    this.sky.set(sky);
    this.targetState = {
      sunColor: new THREE.Color(sky.sunColor),
      sunIntensity: sky.sunIntensity,
      elevation: sky.sunElevation,
      azimuth: sky.sunAzimuth,
      hemiSky: new THREE.Color(sky.ambientSky),
      hemiGround: new THREE.Color(sky.ambientGround),
      hemiIntensity: sky.ambientIntensity,
      exposure: sky.exposure,
      wetness: weather?.wetness ?? 0
    };
    this.fogTargetColor.set(sky.fog);
    this.fogTargetDensity = sky.fogDensity;
    this.weather = weather || { type: 'clear', intensity: 0 };
    if (instant) {
      this.state.sunColor.copy(this.targetState.sunColor);
      this.state.hemiSky.copy(this.targetState.hemiSky);
      this.state.hemiGround.copy(this.targetState.hemiGround);
      this.state.sunIntensity = this.targetState.sunIntensity;
      this.state.hemiIntensity = this.targetState.hemiIntensity;
      this.state.elevation = this.targetState.elevation;
      this.state.azimuth = this.targetState.azimuth;
      this.state.exposure = this.targetState.exposure;
      this.state.wetness = this.targetState.wetness;
      this.fog.color.copy(this.fogTargetColor);
      this.fog.density = this.fogTargetDensity;
    }
  }

  setWeatherEnabled(on) {
    this.weatherEnabled = on;
  }

  get exposure() {
    return this.state.exposure;
  }

  get wetness() {
    return this.state.wetness * (this.weatherEnabled ? 1 : 0.35);
  }

  update(dt, time, camera) {
    const k = 2.2;
    const s = this.state;
    const t = this.targetState;
    s.sunColor.lerp(t.sunColor, 1 - Math.exp(-k * dt));
    s.hemiSky.lerp(t.hemiSky, 1 - Math.exp(-k * dt));
    s.hemiGround.lerp(t.hemiGround, 1 - Math.exp(-k * dt));
    s.sunIntensity = damp(s.sunIntensity, t.sunIntensity, k, dt);
    s.hemiIntensity = damp(s.hemiIntensity, t.hemiIntensity, k, dt);
    s.elevation = damp(s.elevation, t.elevation, k, dt);
    s.azimuth = damp(s.azimuth, t.azimuth, k, dt);
    s.exposure = damp(s.exposure, t.exposure, k, dt);
    s.wetness = damp(s.wetness, t.wetness, k, dt);

    this.sun.color.copy(s.sunColor);
    this.sun.intensity = s.sunIntensity;
    this.hemi.color.copy(s.hemiSky);
    this.hemi.groundColor.copy(s.hemiGround);
    this.hemi.intensity = s.hemiIntensity;
    this.fill.color.copy(s.hemiSky).offsetHSL(0, 0.05, 0.05);
    this.fill.intensity = 0.18 + s.hemiIntensity * 0.3;

    const el = s.elevation * DEG;
    const az = s.azimuth * DEG;
    const dist = 160;
    this.sun.position.set(Math.cos(el) * Math.sin(az) * dist, Math.sin(el) * dist, Math.cos(el) * Math.cos(az) * dist);
    // keep the shadow frustum following the camera along the street
    const fx = THREE.MathUtils.clamp(camera.position.x, -50, 50);
    this.sun.position.x += fx;
    this.sun.target.position.set(fx, 0, 0);
    this.sun.target.updateMatrixWorld();

    this.fog.color.lerp(this.fogTargetColor, 1 - Math.exp(-k * dt));
    this.fog.density = damp(this.fog.density, this.fogTargetDensity, k, dt);

    this.sky.update(dt, time, camera);
    this._updateWeather(dt, time, camera);
  }

  _updateWeather(dt, time, camera) {
    const on = this.weatherEnabled ? 1 : 0;
    const w = this.weather;
    const wantRain = w.type === 'rain' ? w.intensity * on : 0;
    const wantMist = (w.type === 'mist' ? w.intensity : w.type === 'smog' ? w.intensity * 0.4 : 0) * on;
    const wantMotes = (w.motes ? 1 : 0) * on * (w.type === 'rain' ? 0.3 : 1);

    this.rainLevel = damp(this.rainLevel, wantRain, 1.8, dt);
    this.mistLevel = damp(this.mistLevel, wantMist, 1.4, dt);
    this.moteLevel = damp(this.moteLevel, wantMotes, 1.4, dt);

    /* rain */
    this.rain.visible = this.rainLevel > 0.01;
    if (this.rain.visible) {
      this.rainMat.opacity = this.rainLevel * 0.6;
      this.rainMat.size = lerp(0.35, 0.62, this.rainLevel);
      const p = this.rain.geometry.attributes.position;
      const arr = p.array;
      const cx = camera.position.x;
      const cz = camera.position.z;
      for (let i = 0; i < RAIN_COUNT; i++) {
        const iy = i * 3 + 1;
        arr[iy] -= this.rainSpeeds[i] * dt;
        arr[i * 3] += dt * 2.4;
        if (arr[iy] < 0) {
          arr[iy] = 40 + Math.random() * 8;
          arr[i * 3] = cx + (Math.random() - 0.5) * 130;
          arr[i * 3 + 2] = cz + (Math.random() - 0.5) * 110;
        }
      }
      p.needsUpdate = true;
    }

    /* drifting motes / soot / spores */
    this.motes.visible = this.moteLevel > 0.01;
    if (this.motes.visible) {
      const cfg = w.motes || { color: '#ffffff', size: 0.05, drift: 0.3 };
      this.moteMat.opacity = this.moteLevel * 0.55;
      this.moteMat.color.set(cfg.color);
      this.moteMat.size = cfg.size;
      const p = this.motes.geometry.attributes.position;
      const arr = p.array;
      for (let i = 0; i < MOTE_COUNT; i++) {
        const ph = this.motePhase[i];
        arr[i * 3] = this.moteBase[i * 3] + Math.sin(time * 0.24 * cfg.drift + ph) * 3.2;
        arr[i * 3 + 1] = this.moteBase[i * 3 + 1] + Math.sin(time * 0.16 + ph * 1.7) * 1.4;
        arr[i * 3 + 2] = this.moteBase[i * 3 + 2] + Math.cos(time * 0.19 * cfg.drift + ph) * 3.2;
      }
      p.needsUpdate = true;
    }

    /* low-lying mist banks */
    this.mist.visible = this.mistLevel > 0.01;
    if (this.mist.visible) {
      this.mistMat.opacity = this.mistLevel * 0.16;
      this.mistMat.color.set(this.weather.type === 'smog' ? '#c8b898' : '#9fd8ea');
      for (const m of this.mist.children) {
        m.position.x += m.userData.drift * dt * 1.6;
        if (m.position.x > 78) m.position.x = -78;
        if (m.position.x < -78) m.position.x = 78;
        m.lookAt(camera.position.x, m.position.y, camera.position.z);
      }
    }
  }

  setQuality(q) {
    const size = q === 'low' ? 1024 : q === 'medium' ? 1536 : 2048;
    if (this.sun.shadow.mapSize.x !== size) {
      this.sun.shadow.mapSize.set(size, size);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
    }
    this.sun.castShadow = q !== 'low';
  }

  dispose() {
    this.sky.dispose();
    this.rain.geometry.dispose();
    this.rainMat.dispose();
    this.motes.geometry.dispose();
    this.moteMat.dispose();
    this.mistMat.dispose();
  }
}
