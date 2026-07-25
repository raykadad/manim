/**
 * Sky dome, sun, stars, aurora, clouds and the things that fly overhead.
 *
 * The dome is a single shader sphere so the gradient can be cross-faded
 * between eras (and between day and night) without swapping materials.
 */

import * as THREE from 'three';
import { makeRng } from '../util/rng.js';
import { createCanvas, radialGradient, grain } from '../gfx/canvas2d.js';
import { damp, DEG } from '../util/math.js';

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 mv = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mv;
  }
`;

const SKY_FRAG = /* glsl */ `
  varying vec3 vDir;

  uniform vec3  uTop;
  uniform vec3  uMid;
  uniform vec3  uBot;
  uniform vec3  uSunColor;
  uniform vec3  uSunDir;
  uniform float uStars;
  uniform float uAurora;
  uniform float uTime;
  uniform float uHaze;
  uniform float uSunGlow;

  float hash13( vec3 p ) {
    p = fract( p * 0.1031 );
    p += dot( p, p.zyx + 31.32 );
    return fract( ( p.x + p.y ) * p.z );
  }

  float noise2( vec2 p ) {
    vec2 i = floor( p ), f = fract( p );
    f = f * f * ( 3.0 - 2.0 * f );
    float a = hash13( vec3( i, 0.0 ) );
    float b = hash13( vec3( i + vec2( 1.0, 0.0 ), 0.0 ) );
    float c = hash13( vec3( i + vec2( 0.0, 1.0 ), 0.0 ) );
    float d = hash13( vec3( i + vec2( 1.0, 1.0 ), 0.0 ) );
    return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
  }

  void main() {
    vec3 dir = normalize( vDir );
    float h = dir.y;

    vec3 col = mix( uBot, uMid, smoothstep( -0.08, 0.28, h ) );
    col = mix( col, uTop, smoothstep( 0.16, 0.82, h ) );

    // stars, thinned out towards the horizon haze
    if ( uStars > 0.001 ) {
      vec3 sp = dir * 220.0;
      float s = hash13( floor( sp ) );
      float star = smoothstep( 0.9965, 1.0, s );
      float twinkle = 0.65 + 0.35 * sin( uTime * 2.4 + s * 90.0 );
      col += vec3( star ) * twinkle * uStars * smoothstep( 0.02, 0.4, h );
    }

    // aurora / atmospheric light sheet for the 2055 sky
    if ( uAurora > 0.001 ) {
      float band = smoothstep( 0.06, 0.5, h ) * ( 1.0 - smoothstep( 0.45, 0.95, h ) );
      float n = noise2( vec2( dir.x * 3.0 + uTime * 0.04, dir.z * 3.0 - uTime * 0.02 ) );
      float n2 = noise2( vec2( dir.x * 7.0 - uTime * 0.07, dir.z * 6.0 + uTime * 0.05 ) );
      float a = pow( n * 0.6 + n2 * 0.4, 2.4 ) * band;
      col += mix( vec3( 0.15, 0.85, 0.7 ), vec3( 0.5, 0.25, 0.95 ), n2 ) * a * uAurora * 1.6;
    }

    // sun disc + forward scatter
    float sd = max( dot( dir, normalize( uSunDir ) ), 0.0 );
    col += uSunColor * pow( sd, 1400.0 ) * 2.4 * uSunGlow;
    col += uSunColor * pow( sd, 26.0 ) * 0.18 * uSunGlow;
    col += uSunColor * pow( sd, 4.0 ) * 0.05 * uHaze * uSunGlow;

    // horizon thickening
    col = mix( col, uBot, smoothstep( 0.12, -0.25, h ) * 0.85 * uHaze );

    gl_FragColor = vec4( col, 1.0 );
    #include <colorspace_fragment>
  }
`;

function cloudTexture(seed = 1) {
  const S = 256;
  const { canvas, ctx } = createCanvas(S, S);
  const rng = makeRng(seed);
  ctx.clearRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) {
    const x = S / 2 + rng.gauss(0, S * 0.17);
    const y = S * 0.56 + rng.gauss(0, S * 0.1);
    const r = rng.range(S * 0.08, S * 0.22);
    ctx.fillStyle = radialGradient(ctx, x, y, 0, r, [
      [0, 'rgba(255,255,255,0.85)'],
      [0.55, 'rgba(255,255,255,0.35)'],
      [1, 'rgba(255,255,255,0)']
    ]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.uniforms = {
      uTop: { value: new THREE.Color('#5f7ea6') },
      uMid: { value: new THREE.Color('#b3aa93') },
      uBot: { value: new THREE.Color('#dcc59d') },
      uSunColor: { value: new THREE.Color('#ffc482') },
      uSunDir: { value: new THREE.Vector3(0.4, 0.4, -0.8) },
      uStars: { value: 0 },
      uAurora: { value: 0 },
      uTime: { value: 0 },
      uHaze: { value: 1 },
      uSunGlow: { value: 1 }
    };

    const geo = new THREE.SphereGeometry(900, 40, 24);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
    scene.add(this.mesh);

    /* ---- clouds ---------------------------------------------------- */
    this.cloudGroup = new THREE.Group();
    this.cloudGroup.renderOrder = -900;
    scene.add(this.cloudGroup);
    const tex = [cloudTexture(1), cloudTexture(2), cloudTexture(3)];
    this.cloudMat = tex.map(
      (t) =>
        new THREE.MeshBasicMaterial({
          map: t,
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
          fog: false,
          side: THREE.DoubleSide,
          toneMapped: false
        })
    );
    const rng = makeRng(77);
    this.clouds = [];
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.cloudMat[i % 3]);
      const scale = rng.range(90, 240);
      m.scale.set(scale, scale * rng.range(0.4, 0.62), 1);
      m.position.set(rng.range(-600, 600), rng.range(80, 190), rng.range(-600, 600));
      m.userData.speed = rng.range(0.4, 1.4);
      m.userData.baseY = m.position.y;
      m.renderOrder = -900;
      this.cloudGroup.add(m);
      this.clouds.push(m);
    }

    /* ---- aircraft ---------------------------------------------------- */
    this.aircraft = new THREE.Group();
    scene.add(this.aircraft);
    this.planes = [];
    this.contrails = [];
    this._buildAircraft();

    this.target = null;
    this.current = {
      top: new THREE.Color(),
      mid: new THREE.Color(),
      bot: new THREE.Color(),
      sun: new THREE.Color(),
      stars: 0,
      aurora: 0,
      cloudOpacity: 0.6,
      cloudColor: new THREE.Color('#ffffff'),
      haze: 1,
      sunGlow: 1
    };
  }

  _buildAircraft() {
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x2b3038, fog: false, toneMapped: false });
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      fog: false,
      toneMapped: false
    });
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      const fuse = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 5, 4, 8), bodyMat);
      fuse.rotation.z = Math.PI / 2;
      g.add(fuse);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 7.5), bodyMat);
      g.add(wing);
      const trail = new THREE.Mesh(new THREE.PlaneGeometry(150, 1.4), trailMat.clone());
      trail.position.set(-78, 0, 0);
      trail.rotation.x = Math.PI / 2;
      g.add(trail);
      g.visible = false;
      g.userData = { trail, t: Math.random(), speed: 0.02 + Math.random() * 0.02, lane: i };
      this.aircraft.add(g);
      this.planes.push(g);
    }
  }

  /** Apply an era's sky block (already blended by the caller). */
  set(cfg) {
    this.target = cfg;
  }

  update(dt, time, camera) {
    const u = this.uniforms;
    u.uTime.value = time;
    const c = this.current;
    const t = this.target;
    if (t) {
      const k = 2.6;
      c.top.lerp(new THREE.Color(t.top), 1 - Math.exp(-k * dt));
      c.mid.lerp(new THREE.Color(t.mid), 1 - Math.exp(-k * dt));
      c.bot.lerp(new THREE.Color(t.bottom), 1 - Math.exp(-k * dt));
      c.sun.lerp(new THREE.Color(t.sunColor), 1 - Math.exp(-k * dt));
      c.stars = damp(c.stars, t.stars || 0, k, dt);
      c.aurora = damp(c.aurora, t.aurora || 0, k, dt);
      c.haze = damp(c.haze, t.haze ?? 1, k, dt);
      c.sunGlow = damp(c.sunGlow, t.sunGlow ?? 1, k, dt);
      const cl = t.clouds || { opacity: 0.5, color: '#ffffff' };
      c.cloudOpacity = damp(c.cloudOpacity, cl.opacity, k, dt);
      c.cloudColor.lerp(new THREE.Color(cl.color), 1 - Math.exp(-k * dt));

      const el = (t.sunElevation ?? 40) * DEG;
      const az = (t.sunAzimuth ?? 180) * DEG;
      u.uSunDir.value.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).normalize();
    }
    u.uTop.value.copy(c.top);
    u.uMid.value.copy(c.mid);
    u.uBot.value.copy(c.bot);
    u.uSunColor.value.copy(c.sun);
    u.uStars.value = c.stars;
    u.uAurora.value = c.aurora;
    u.uHaze.value = c.haze;
    u.uSunGlow.value = c.sunGlow;

    for (const m of this.cloudMat) {
      m.opacity = c.cloudOpacity;
      m.color.copy(c.cloudColor);
    }

    const speed = (this.target?.clouds?.speed ?? 0.3) * 6;
    for (const cl of this.clouds) {
      cl.position.x += cl.userData.speed * speed * dt;
      if (cl.position.x > 640) cl.position.x = -640;
      cl.lookAt(camera.position.x, cl.position.y, camera.position.z);
    }

    // aircraft: props crawl, jets streak, air taxis hover in lanes
    const kind = this.target?.aircraft || 'jet';
    const wantsContrail = (this.target?.contrails || 0) > 0;
    this.planes.forEach((p, i) => {
      const active = kind !== 'airtaxi' && (i === 0 || wantsContrail);
      p.visible = active;
      if (!active) return;
      const s = kind === 'prop' ? 0.16 : 0.55;
      p.userData.t += dt * s * (0.6 + i * 0.25) * 0.02;
      const tt = (p.userData.t % 1) * 2 - 1;
      p.position.set(tt * 700, 150 + i * 44, -220 - i * 120);
      p.rotation.y = 0;
      p.scale.setScalar(kind === 'prop' ? 2.4 : 3.4);
      p.userData.trail.visible = wantsContrail && kind === 'jet';
    });

    this.mesh.position.copy(camera.position);
    this.cloudGroup.position.set(camera.position.x * 0.35, 0, camera.position.z * 0.35);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    for (const m of this.cloudMat) {
      m.map.dispose();
      m.dispose();
    }
  }
}
