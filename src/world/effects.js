/**
 * Effects: the chrono wave that rebuilds the block, plus steam, mist and the
 * pools of light the lamps throw on the pavement after dark.
 */

import * as THREE from 'three';
import { BLOCK } from './layout.js';
import { plane, box, cyl } from './kit.js';
import { makeGlow } from '../gfx/materials.js';
import { glowTexture, particleTexture } from '../gfx/textures.js';
import { makeRng } from '../util/rng.js';
import { clamp, smoothstep } from '../util/math.js';

/* ------------------------------------------------------------------ */

const WAVE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const WAVE_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;

  float hash( vec2 p ) { return fract( sin( dot( p, vec2( 41.3, 289.1 ) ) ) * 43758.5453 ); }

  void main() {
    float edge = smoothstep( 0.0, 0.14, vUv.x ) * ( 1.0 - smoothstep( 0.6, 1.0, vUv.x ) );
    float bands = 0.55 + 0.45 * sin( vUv.y * 160.0 - uTime * 22.0 );
    float spark = step( 0.985, hash( floor( vUv * vec2( 40.0, 220.0 ) ) + floor( uTime * 22.0 ) ) );
    float fade = 1.0 - smoothstep( 0.55, 1.0, vUv.y );
    float a = ( edge * ( 0.35 + bands * 0.5 ) + spark * 0.9 * edge ) * fade * uOpacity;
    gl_FragColor = vec4( uColor * ( 1.4 + spark * 2.4 ), a );
  }
`;

/**
 * A luminous curtain that travels along the street while an era dissolves in.
 * Purely decorative — the actual dissolve lives in the material shader.
 */
export class ChronoWave {
  constructor(scene) {
    this.uniforms = {
      uColor: { value: new THREE.Color('#ffd9a0') },
      uTime: { value: 0 },
      uOpacity: { value: 0 }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: WAVE_VERT,
      fragmentShader: WAVE_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false
    });
    this.group = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 60), mat);
    wall.rotation.y = Math.PI / 2;
    wall.position.y = 28;
    this.group.add(wall);
    const wall2 = wall.clone();
    wall2.rotation.y = -Math.PI / 2;
    this.group.add(wall2);
    // ground ring
    const ring = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 90),
      makeGlow({ color: '#ffd9a0', map: glowTexture('#ffd9a0', 0.9), opacity: 0.55 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    this.ring = ring;
    this.group.add(ring);
    this.group.visible = false;
    this.group.renderOrder = 50;
    scene.add(this.group);
    this.active = false;
    this.t = 0;
    this.dur = 1;
    this.dir = 1;
  }

  play(color, duration = 2.0, dir = 1) {
    this.uniforms.uColor.value.set(color);
    this.ring.material.color.set(color);
    this.active = true;
    this.group.visible = true;
    this.start = performance.now();
    this.dur = duration * 1000;
    this.dir = dir;
  }

  update(dt, time) {
    this.uniforms.uTime.value = time;
    if (!this.active) return;
    // wall clock: a render hitch must not leave the curtain parked on screen
    const p = clamp((performance.now() - this.start) / this.dur);
    const from = this.dir > 0 ? -BLOCK.halfLength * 0.8 : BLOCK.halfLength * 0.8;
    const to = -from;
    this.group.position.x = from + (to - from) * p;
    const env = Math.sin(p * Math.PI);
    this.uniforms.uOpacity.value = env * 0.9;
    this.ring.material.opacity = env * 0.5;
    if (p >= 1) {
      this.active = false;
      this.group.visible = false;
    }
  }
}

/* ------------------------------------------------------------------ */

/** Recycled sprite puffs for steam grates, misting arches and exhaust. */
export class PuffSystem {
  constructor(scene, { count = 260, color = '#e8eef2', size = 1.6 } = {}) {
    const geo = new THREE.BufferGeometry();
    this.count = count;
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));
    this.material = new THREE.PointsMaterial({
      map: particleTexture('flake'),
      color: new THREE.Color(color),
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.NormalBlending,
      fog: true
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.parts = [];
    for (let i = 0; i < count; i++) this.parts.push({ life: 0, max: 1, vel: new THREE.Vector3(), pos: new THREE.Vector3(0, -999, 0) });
    this.cursor = 0;
    this.emitters = [];
    this.accum = 0;
  }

  setEmitters(list) {
    this.emitters = list || [];
  }

  emit(pos, { spread = 0.35, rise = 1.2, life = 2.6 } = {}) {
    const p = this.parts[this.cursor];
    this.cursor = (this.cursor + 1) % this.count;
    p.pos.copy(pos);
    p.vel.set((Math.random() - 0.5) * spread, rise * (0.6 + Math.random() * 0.8), (Math.random() - 0.5) * spread);
    p.life = 0;
    p.max = life * (0.7 + Math.random() * 0.6);
  }

  update(dt, time) {
    this.accum += dt;
    const rate = 0.055;
    while (this.accum > rate && this.emitters.length) {
      this.accum -= rate;
      const e = this.emitters[Math.floor(Math.random() * this.emitters.length)];
      this.emit(e.pos, e.kind === 'mist' ? { spread: 1.1, rise: -0.35, life: 2.2 } : { spread: 0.4, rise: 1.5, life: 3.2 });
    }
    const arr = this.points.geometry.attributes.position.array;
    for (let i = 0; i < this.count; i++) {
      const p = this.parts[i];
      if (p.life >= p.max) {
        arr[i * 3 + 1] = -999;
        continue;
      }
      p.life += dt;
      p.vel.y += dt * 0.35;
      p.vel.multiplyScalar(1 - dt * 0.5);
      p.pos.addScaledVector(p.vel, dt);
      arr[i * 3] = p.pos.x;
      arr[i * 3 + 1] = p.pos.y;
      arr[i * 3 + 2] = p.pos.z;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  setLevel(v) {
    this.material.opacity = 0.3 * v;
    this.points.visible = v > 0.02;
  }

  dispose() {
    this.points.removeFromParent();
    this.points.geometry.dispose();
    this.material.dispose();
  }
}

/* ------------------------------------------------------------------ */

/** Ground light pools + volumetric cones under each street lamp. */
export function buildLightPools(era, lampLights) {
  const g = new THREE.Group();
  g.name = 'lightpools';
  const rng = makeRng(era.year);
  const poolMat = makeGlow({ color: era.props.lamps.glow, map: glowTexture(era.props.lamps.glow, 0.85), opacity: 0.3 });
  const coneMat = makeGlow({ color: era.props.lamps.glow, map: glowTexture(era.props.lamps.glow, 0.5), opacity: 0.1 });
  for (const L of lampLights) {
    const r = L.radius;
    const disc = plane(poolMat, r * 1.9, r * 1.9, L.pos.x, BLOCK.sidewalkHeight + 0.03, L.pos.z);
    disc.rotation.x = -Math.PI / 2;
    g.add(disc);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 0.55, L.pos.y, 12, 1, true), coneMat);
    cone.position.set(L.pos.x, L.pos.y / 2, L.pos.z);
    cone.rotation.x = Math.PI;
    g.add(cone);
  }
  g.userData.materials = [poolMat, coneMat];
  return g;
}
