/**
 * Post-processing: bloom, then a single grade pass that gives each era its own
 * film stock — saturation, contrast, tint, halation, grain, vignette,
 * chromatic aberration and (for 1985 and 2055) scanlines.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { damp } from '../util/math.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSaturation: { value: 1 },
    uContrast: { value: 1 },
    uTint: { value: new THREE.Color('#ffffff') },
    uTintAmount: { value: 0 },
    uGrain: { value: 0.2 },
    uVignette: { value: 0.35 },
    uChroma: { value: 0.06 },
    uScanlines: { value: 0 },
    uHalation: { value: 0.2 },
    uTime: { value: 0 },
    uFlash: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uEnabled: { value: 1 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uSaturation;
    uniform float uContrast;
    uniform vec3  uTint;
    uniform float uTintAmount;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uChroma;
    uniform float uScanlines;
    uniform float uHalation;
    uniform float uTime;
    uniform float uFlash;
    uniform float uEnabled;
    uniform vec2  uResolution;
    varying vec2 vUv;

    float hash( vec2 p ) {
      p = fract( p * vec2( 443.897, 441.423 ) );
      p += dot( p, p.yx + 19.19 );
      return fract( ( p.x + p.y ) * p.x );
    }

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float r2 = dot( c, c );

      // chromatic aberration grows towards the corners
      float ca = uChroma * 0.012 * uEnabled;
      vec3 col;
      col.r = texture2D( tDiffuse, uv + c * ca * 1.6 ).r;
      col.g = texture2D( tDiffuse, uv ).g;
      col.b = texture2D( tDiffuse, uv - c * ca * 1.6 ).b;

      if ( uEnabled > 0.5 ) {
        // halation: bleed the brightest areas outward a little
        if ( uHalation > 0.001 ) {
          vec3 blur = vec3( 0.0 );
          float o = 2.5 / uResolution.y;
          blur += texture2D( tDiffuse, uv + vec2(  o * 2.0, 0.0 ) ).rgb;
          blur += texture2D( tDiffuse, uv + vec2( -o * 2.0, 0.0 ) ).rgb;
          blur += texture2D( tDiffuse, uv + vec2( 0.0,  o * 2.0 ) ).rgb;
          blur += texture2D( tDiffuse, uv + vec2( 0.0, -o * 2.0 ) ).rgb;
          blur += texture2D( tDiffuse, uv + vec2(  o * 4.0,  o * 4.0 ) ).rgb;
          blur += texture2D( tDiffuse, uv + vec2( -o * 4.0, -o * 4.0 ) ).rgb;
          blur /= 6.0;
          float lum = dot( blur, vec3( 0.299, 0.587, 0.114 ) );
          col += blur * smoothstep( 0.62, 1.0, lum ) * uHalation * 0.85;
        }

        // contrast around mid grey, then saturation
        col = ( col - 0.5 ) * uContrast + 0.5;
        float g = dot( col, vec3( 0.2126, 0.7152, 0.0722 ) );
        col = mix( vec3( g ), col, uSaturation );

        // split-tone toward the era's stock
        col = mix( col, col * uTint, uTintAmount );
        col += ( uTint - 0.5 ) * uTintAmount * 0.06;

        // scanlines
        if ( uScanlines > 0.001 ) {
          float sl = sin( uv.y * uResolution.y * 1.6 ) * 0.5 + 0.5;
          col *= 1.0 - uScanlines * sl;
        }

        // vignette
        col *= 1.0 - uVignette * smoothstep( 0.12, 0.78, r2 );

        // grain, animated
        float n = hash( uv * uResolution * 0.5 + fract( uTime ) * 91.7 );
        col += ( n - 0.5 ) * uGrain * 0.14;
      }

      col += uFlash;
      gl_FragColor = vec4( max( col, 0.0 ), 1.0 );
    }
  `
};

export class PostFX {
  constructor(renderer, scene, camera, { quality = 'high' } = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.quality = quality;
    this.enabled = true;

    const size = renderer.getSize(new THREE.Vector2());
    this.composer = new EffectComposer(renderer);
    this.composer.setSize(size.x, size.y);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.5, 0.6, 0.8);
    this.composer.addPass(this.bloom);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    this.grade = new ShaderPass(GradeShader);
    this.grade.uniforms.uResolution.value.set(size.x, size.y);
    this.composer.addPass(this.grade);

    this.state = {
      saturation: 1,
      contrast: 1,
      tint: new THREE.Color('#ffffff'),
      tintAmount: 0,
      grain: 0.2,
      vignette: 0.35,
      chroma: 0.06,
      scanlines: 0,
      halation: 0.2,
      bloomStrength: 0.5,
      bloomRadius: 0.6,
      bloomThreshold: 0.8
    };
    this.target = { ...this.state, tint: this.state.tint.clone() };
    this.flash = 0;
  }

  apply(grade, { instant = false } = {}) {
    this.target = {
      saturation: grade.saturation,
      contrast: grade.contrast,
      tint: new THREE.Color(grade.tint),
      tintAmount: grade.tintAmount,
      grain: grade.grain,
      vignette: grade.vignette,
      chroma: grade.chroma,
      scanlines: grade.scanlines,
      halation: grade.halation,
      bloomStrength: grade.bloom.strength,
      bloomRadius: grade.bloom.radius,
      bloomThreshold: grade.bloom.threshold
    };
    if (instant) {
      this.state = { ...this.target, tint: this.target.tint.clone() };
      this._push();
    }
  }

  pulse(amount = 0.25) {
    this.flash = amount;
  }

  setEnabled(on) {
    this.enabled = on;
    this.grade.uniforms.uEnabled.value = on ? 1 : 0;
  }

  setQuality(q) {
    this.quality = q;
    this.bloom.enabled = q !== 'low';
    const pr = q === 'low' ? 0.7 : q === 'medium' ? 0.85 : 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * pr);
    this.setSize(window.innerWidth, window.innerHeight);
  }

  setSize(w, h) {
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
    const pr = this.renderer.getPixelRatio();
    this.grade.uniforms.uResolution.value.set(w * pr, h * pr);
  }

  _push() {
    const s = this.state;
    const u = this.grade.uniforms;
    u.uSaturation.value = s.saturation;
    u.uContrast.value = s.contrast;
    u.uTint.value.copy(s.tint);
    u.uTintAmount.value = s.tintAmount;
    u.uGrain.value = s.grain;
    u.uVignette.value = s.vignette;
    u.uChroma.value = s.chroma;
    u.uScanlines.value = s.scanlines;
    u.uHalation.value = s.halation;
    this.bloom.strength = s.bloomStrength;
    this.bloom.radius = s.bloomRadius;
    this.bloom.threshold = s.bloomThreshold;
  }

  render(dt, time) {
    const s = this.state;
    const t = this.target;
    const k = 2.2;
    s.saturation = damp(s.saturation, t.saturation, k, dt);
    s.contrast = damp(s.contrast, t.contrast, k, dt);
    s.tint.lerp(t.tint, 1 - Math.exp(-k * dt));
    s.tintAmount = damp(s.tintAmount, t.tintAmount, k, dt);
    s.grain = damp(s.grain, t.grain, k, dt);
    s.vignette = damp(s.vignette, t.vignette, k, dt);
    s.chroma = damp(s.chroma, t.chroma, k, dt);
    s.scanlines = damp(s.scanlines, t.scanlines, k, dt);
    s.halation = damp(s.halation, t.halation, k, dt);
    s.bloomStrength = damp(s.bloomStrength, t.bloomStrength, k, dt);
    s.bloomRadius = damp(s.bloomRadius, t.bloomRadius, k, dt);
    s.bloomThreshold = damp(s.bloomThreshold, t.bloomThreshold, k, dt);
    this._push();

    this.flash = damp(this.flash, 0, 4.5, dt);
    this.grade.uniforms.uFlash.value = this.flash;
    this.grade.uniforms.uTime.value = time;

    this.composer.render(dt);
  }
}
