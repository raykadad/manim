/**
 * Mesh-building shorthand.
 *
 * Two rules keep the scene affordable: shared unit geometry for the hundreds of
 * small props, and per-surface UV scaling for the big textured walls so a
 * single brick texture can tile correctly at any size.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);
const unitCyl = new Map();
const unitSph = new Map();
const uvGeoCache = new Map();

export function unitCylinder(segments = 12, openEnded = false) {
  const key = `${segments}|${openEnded}`;
  if (!unitCyl.has(key)) unitCyl.set(key, new THREE.CylinderGeometry(0.5, 0.5, 1, segments, 1, openEnded));
  return unitCyl.get(key);
}

export function unitSphere(w = 12, h = 8) {
  const key = `${w}|${h}`;
  if (!unitSph.has(key)) unitSph.set(key, new THREE.SphereGeometry(0.5, w, h));
  return unitSph.get(key);
}

/** Box mesh built from shared unit geometry (no per-call allocation). */
export function box(mat, w, h, d, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(UNIT_BOX, mat);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  return m;
}

export function plane(mat, w, h, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(UNIT_PLANE, mat);
  m.scale.set(w, h, 1);
  m.position.set(x, y, z);
  return m;
}

export function cyl(mat, r, h, x = 0, y = 0, z = 0, seg = 12) {
  const m = new THREE.Mesh(unitCylinder(seg), mat);
  m.scale.set(r * 2, h, r * 2);
  m.position.set(x, y, z);
  return m;
}

export function cone(mat, r, h, x = 0, y = 0, z = 0, seg = 10) {
  const g = new THREE.ConeGeometry(r, h, seg);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  return m;
}

export function sphere(mat, r, x = 0, y = 0, z = 0, seg = 12) {
  const m = new THREE.Mesh(unitSphere(seg, Math.max(6, seg / 2)), mat);
  m.scale.setScalar(r * 2);
  m.position.set(x, y, z);
  return m;
}

/** Plane geometry whose UVs tile every `tile` world units. */
export function tiledPlane(w, h, tile = 4, tileV = null) {
  const key = `tp|${w}|${h}|${tile}|${tileV}`;
  if (uvGeoCache.has(key)) return uvGeoCache.get(key);
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  const su = w / tile;
  const sv = h / (tileV ?? tile);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  uvGeoCache.set(key, g);
  return g;
}

/** Box geometry with per-face UVs scaled so the texture keeps a constant size. */
export function tiledBox(w, h, d, tile = 4) {
  const key = `tb|${w}|${h}|${d}|${tile}`;
  if (uvGeoCache.has(key)) return uvGeoCache.get(key);
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z (4 verts each)
  const spans = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h]
  ];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = spans[f];
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i;
      uv.setXY(idx, uv.getX(idx) * (su / tile), uv.getY(idx) * (sv / tile));
    }
  }
  uv.needsUpdate = true;
  uvGeoCache.set(key, g);
  return g;
}

export function meshOf(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

export function group(...children) {
  const g = new THREE.Group();
  for (const c of children) if (c) g.add(c);
  return g;
}

/** Make an object castable / receivable in one call. */
export function shade(obj, cast = true, receive = true) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return obj;
}

/** Attach inspector metadata so clicking the object explains it. */
export function tag(obj, year, name, desc) {
  obj.userData.info = { year, name, desc };
  obj.traverse?.((o) => {
    if (o !== obj && !o.userData.info) o.userData.infoRef = obj;
  });
  return obj;
}

/** Extrude a flat outline into a solid — used for cornices and canopies. */
export function extrude(shapePoints, depth, mat, bevel = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(shapePoints[0][0], shapePoints[0][1]);
  for (let i = 1; i < shapePoints.length; i++) shape.lineTo(shapePoints[i][0], shapePoints[i][1]);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 1
  });
  g.translate(0, 0, -depth / 2);
  return new THREE.Mesh(g, mat);
}

/* ------------------------------------------------------------------ */
/*  Static batching                                                    */
/* ------------------------------------------------------------------ */

const DYNAMIC_KEYS = ['billboard', 'hover', 'flutter', 'spin', 'spinTex', 'scan', 'bob', 'pulse', 'holo', 'chaseBulbs', 'police'];

function isDynamic(o) {
  for (const k of DYNAMIC_KEYS) if (o.userData[k] !== undefined) return true;
  return false;
}

/**
 * Collapse a subtree's static meshes into one mesh per material.
 *
 * Nodes carrying inspector metadata act as boundaries so clicking a fire
 * escape still reports a fire escape, and anything animated per-object is left
 * alone. This is what keeps a block of this density inside a sane draw count.
 */
export function mergeStatic(root, { minBatch = 3 } = {}) {
  let saved = 0;

  const processNode = (node) => {
    const buckets = new Map();
    const originals = [];

    const walk = (o, isRoot) => {
      if (!isRoot && o.userData.noMerge) return;
      if (!isRoot && o.userData.info) {
        // a tagged child owns its own batch
        processNode(o);
        return;
      }
      if (o.isMesh && !isDynamic(o) && o.geometry?.attributes?.position && o.geometry.attributes.uv && o.geometry.attributes.normal) {
        const key = o.material.uuid + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0);
        if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, receive: o.receiveShadow, list: [] });
        buckets.get(key).list.push(o);
        originals.push(o);
      }
      for (const c of [...o.children]) walk(c, false);
    };
    walk(node, true);

    node.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(node.matrixWorld).invert();

    for (const b of buckets.values()) {
      if (b.list.length < minBatch) continue;
      const geos = [];
      let indexed = null;
      let ok = true;
      for (const m of b.list) {
        const isIdx = !!m.geometry.index;
        if (indexed === null) indexed = isIdx;
        else if (indexed !== isIdx) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (const m of b.list) {
        const g = m.geometry.clone();
        // strip anything but the three attributes every geometry here shares
        for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
        g.clearGroups();
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
        geos.push(g);
      }
      let merged = null;
      try {
        merged = mergeGeometries(geos, false);
      } catch {
        merged = null;
      }
      for (const g of geos) g.dispose();
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, b.mat);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = b.receive;
      mesh.userData.merged = true;
      node.add(mesh);
      saved += b.list.length - 1;
      for (const m of b.list) m.removeFromParent();
    }
  };

  root.updateMatrixWorld(true);
  processNode(root);
  return saved;
}

export function disposeTree(root) {
  root.traverse((o) => {
    if (o.isMesh || o.isPoints || o.isLine) {
      if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose?.();
    }
  });
}

export function disposeKitCaches() {
  for (const g of uvGeoCache.values()) g.dispose();
  uvGeoCache.clear();
  for (const g of unitCyl.values()) g.dispose();
  unitCyl.clear();
  for (const g of unitSph.values()) g.dispose();
  unitSph.clear();
}
