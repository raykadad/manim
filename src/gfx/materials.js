/**
 * Materials + the chrono-dissolve.
 *
 * Every material belonging to an era is patched with a shader chunk that
 * dissolves the surface along the street's X axis. Driving one shared uniform
 * makes the whole decade materialise (or disintegrate) as a wave that travels
 * down the block, with a hot glowing edge riding the boundary.
 */

import * as THREE from 'three';

const VERT_HEAD = /* glsl */ `
  varying vec3 vChronoWorld;
`;

const VERT_BODY = /* glsl */ `
  #ifdef USE_INSTANCING
    vChronoWorld = ( modelMatrix * instanceMatrix * vec4( transformed, 1.0 ) ).xyz;
  #else
    vChronoWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
  #endif
`;

const FRAG_HEAD = /* glsl */ `
  varying vec3 vChronoWorld;
  uniform float uReveal;
  uniform float uMinX;
  uniform float uMaxX;
  uniform float uFeather;
  uniform float uDir;
  uniform float uEdgeWidth;
  uniform float uNoiseScale;
  uniform float uTime;
  uniform vec3  uEdgeColor;

  float chronoHash( vec3 p ) {
    p = fract( p * 0.3183099 + vec3( 0.71, 0.113, 0.419 ) );
    p *= 17.0;
    return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
  }

  float chronoNoise( vec3 p ) {
    vec3 i = floor( p );
    vec3 f = fract( p );
    f = f * f * ( 3.0 - 2.0 * f );
    float n = mix(
      mix( mix( chronoHash( i + vec3(0,0,0) ), chronoHash( i + vec3(1,0,0) ), f.x ),
           mix( chronoHash( i + vec3(0,1,0) ), chronoHash( i + vec3(1,1,0) ), f.x ), f.y ),
      mix( mix( chronoHash( i + vec3(0,0,1) ), chronoHash( i + vec3(1,0,1) ), f.x ),
           mix( chronoHash( i + vec3(0,1,1) ), chronoHash( i + vec3(1,1,1) ), f.x ), f.y ), f.z );
    return n;
  }
`;

const FRAG_BODY = /* glsl */ `
  {
    float span = max( 0.0001, uMaxX - uMinX );
    float d = clamp( ( vChronoWorld.x - uMinX ) / span, 0.0, 1.0 );
    d = mix( d, 1.0 - d, uDir );

    float p = uReveal * ( 1.0 + uFeather ) - d * uFeather;

    float n = chronoNoise( vChronoWorld * uNoiseScale );
    n = mix( n, chronoNoise( vChronoWorld * uNoiseScale * 4.7 ), 0.35 );

    float a = p - n;
    if ( a < 0.0 ) discard;

    float edge = 1.0 - smoothstep( 0.0, uEdgeWidth, a );
    float flick = 0.82 + 0.18 * sin( uTime * 34.0 + vChronoWorld.y * 3.1 );
    gl_FragColor.rgb += uEdgeColor * edge * 2.6 * flick;
    gl_FragColor.rgb = mix( gl_FragColor.rgb, uEdgeColor * 1.7, edge * 0.55 );
  }
`;

let uidCounter = 0;

/**
 * A shared set of dissolve uniforms. One per era group (plus one for the
 * permanent scenery, which simply stays fully revealed).
 */
export class ChronoField {
  constructor({ minX = -90, maxX = 90, edgeColor = '#ffd9a0' } = {}) {
    this.id = ++uidCounter;
    this.uniforms = {
      uReveal: { value: 1 },
      uMinX: { value: minX },
      uMaxX: { value: maxX },
      uFeather: { value: 0.9 },
      uDir: { value: 0 },
      uEdgeWidth: { value: 0.16 },
      uNoiseScale: { value: 0.55 },
      uTime: { value: 0 },
      uEdgeColor: { value: new THREE.Color(edgeColor) }
    };
    this.materials = new Set();
  }

  setEdgeColor(hex) {
    this.uniforms.uEdgeColor.value.set(hex);
  }

  set reveal(v) {
    this.uniforms.uReveal.value = v;
  }

  get reveal() {
    return this.uniforms.uReveal.value;
  }

  update(time) {
    this.uniforms.uTime.value = time;
  }

  /** Weave the dissolve into an existing material. */
  patch(material) {
    if (!material || material.userData.__chrono === this.id) return material;
    material.userData.__chrono = this.id;
    const prev = material.onBeforeCompile;
    material.onBeforeCompile = (shader, renderer) => {
      prev?.(shader, renderer);
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('void main() {', `${VERT_HEAD}\nvoid main() {`)
        .replace('#include <project_vertex>', `${VERT_BODY}\n#include <project_vertex>`);
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', `${FRAG_HEAD}\nvoid main() {`)
        .replace('#include <dithering_fragment>', `${FRAG_BODY}\n#include <dithering_fragment>`);
    };
    material.customProgramCacheKey = () => `chrono${this.id}`;
    material.needsUpdate = true;
    this.materials.add(material);
    return material;
  }

  dispose() {
    for (const m of this.materials) m.dispose();
    this.materials.clear();
  }
}

/** A ChronoField that never dissolves — for the ground plane, sky, etc. */
export const STATIC_FIELD = null;

/* ------------------------------------------------------------------ */
/*  Material constructors                                              */
/* ------------------------------------------------------------------ */

const defaults = {
  standard: { roughness: 0.85, metalness: 0.0 },
  glass: { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.42 }
};

export function makeStandard(field, params = {}) {
  const m = new THREE.MeshStandardMaterial({ ...defaults.standard, ...params });
  return field ? field.patch(m) : m;
}

export function makePhysical(field, params = {}) {
  const m = new THREE.MeshPhysicalMaterial({ ...defaults.standard, ...params });
  return field ? field.patch(m) : m;
}

export function makeGlass(field, params = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    ...defaults.glass,
    ...params
  });
  return field ? field.patch(m) : m;
}

/** Self-lit surfaces: neon, screens, headlights, holograms. */
export function makeEmissive(field, { color = '#ffffff', intensity = 1, map = null, ...rest } = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    emissiveMap: map,
    map,
    roughness: 0.6,
    metalness: 0,
    toneMapped: true,
    ...rest
  });
  return field ? field.patch(m) : m;
}

/** Unlit additive sprite-ish material for glows and light shafts. */
export function makeGlow({ color = '#ffffff', map = null, opacity = 1, depthWrite = false } = {}) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    map,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite,
    side: THREE.DoubleSide,
    toneMapped: false
  });
}

/**
 * Cheap two-tone car paint: a standard material with a clearcoat sheen and a
 * touch of environment-driven specular.
 */
export function makeCarPaint(field, color, { metallic = 0.35, clear = 0.7, rough = 0.32 } = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: metallic,
    roughness: rough,
    clearcoat: clear,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.1
  });
  return field ? field.patch(m) : m;
}

export function makeChrome(field, { color = '#dfe6ec', rough = 0.12 } = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: 1,
    roughness: rough,
    envMapIntensity: 1.4
  });
  return field ? field.patch(m) : m;
}

/** Foliage: double-sided alpha cards with a bit of translucency baked in. */
export function makeFoliage(field, { map, color = '#5f8f42' } = {}) {
  const m = new THREE.MeshStandardMaterial({
    map,
    color: new THREE.Color(color),
    transparent: true,
    alphaTest: 0.32,
    side: THREE.DoubleSide,
    roughness: 0.92,
    metalness: 0
  });
  return field ? field.patch(m) : m;
}

/** Holographic panels: additive, scrolling, always facing the light. */
export function makeHologram({ map, color = '#63f5ff', opacity = 0.75 } = {}) {
  const mat = new THREE.MeshBasicMaterial({
    map,
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  mat.userData.holo = true;
  return mat;
}

/** Shared, cached geometry so repeated props do not allocate endlessly. */
const geoCache = new Map();
export function geo(key, build) {
  if (!geoCache.has(key)) geoCache.set(key, build());
  return geoCache.get(key);
}
export const BOX = (w, h, d) => geo(`box${w}_${h}_${d}`, () => new THREE.BoxGeometry(w, h, d));
export const CYL = (rt, rb, h, s = 12) => geo(`cyl${rt}_${rb}_${h}_${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
export const SPH = (r, s = 12, t = 8) => geo(`sph${r}_${s}_${t}`, () => new THREE.SphereGeometry(r, s, t));
export const PLANE = (w, h, sw = 1, sh = 1) => geo(`pl${w}_${h}_${sw}_${sh}`, () => new THREE.PlaneGeometry(w, h, sw, sh));

export function disposeGeometryCache() {
  for (const g of geoCache.values()) g.dispose();
  geoCache.clear();
}
