/**
 * The city assembler.
 *
 * One `EraWorld` per decade: it owns a ChronoField (its dissolve uniforms), a
 * material pool, and every object standing on the block in that year. Switching
 * eras is a matter of revealing one field while hiding another, so no geometry
 * is rebuilt mid-transition.
 */

import * as THREE from 'three';
import { BLOCK, NORTH_LOTS, SOUTH_LOTS, BACKDROP_BLOCKS } from './layout.js';
import { ChronoField } from '../gfx/materials.js';
import { makePool, buildBuilding } from './buildings.js';
import { buildStorefront, buildStation, buildOpenLot } from './storefronts.js';
import { buildProps, buildBillboards } from './props.js';
import { buildStreet } from './street.js';
import { Traffic, buildVehicle } from './vehicles.js';
import { People } from './people.js';
import { buildLightPools } from './effects.js';
import { makeStandard } from '../gfx/materials.js';
import { windowSheetTexture, brickTexture, concreteTexture } from '../gfx/textures.js';
import { box, plane, tiledBox, meshOf, mergeStatic } from './kit.js';
import { makeRng } from '../util/rng.js';
import { damp } from '../util/math.js';

export class EraWorld {
  constructor(era, scene, { seed = 1 } = {}) {
    this.era = era;
    this.scene = scene;
    this.field = new ChronoField({ minX: -BLOCK.halfLength * 0.75, maxX: BLOCK.halfLength * 0.75, edgeColor: era.accent });
    this.pool = makePool(this.field);
    this.group = new THREE.Group();
    this.group.name = `era-${era.year}`;
    this.group.visible = false;
    this.seed = seed;
    this.built = false;
    this.billboardSprites = [];
    this.spinners = [];
    this.hoverers = [];
    this.flutterers = [];
    this.flickers = [];
    this.pulsers = [];
    this.scanners = [];
    this.holos = [];
    this.chaseSets = [];
    this.bobbers = [];
    this.vents = [];
    this.spills = [];
    this.night = false;
  }

  /** Build everything. Sliced into steps so the loader can show progress. */
  *buildSteps() {
    const era = this.era;
    const pool = this.pool;
    const lotMap = {};

    yield 'laying out the street';
    this.street = buildStreet(era, this.field, this.seed);
    mergeStatic(this.street);
    this.group.add(this.street);

    yield 'raising the north side';
    this._buildSide(NORTH_LOTS, 'north', lotMap);

    yield 'raising the south side';
    this._buildSide(SOUTH_LOTS, 'south', lotMap);

    yield 'hanging the signs';
    this.billboards = buildBillboards(era, pool, lotMap, this.seed);
    mergeStatic(this.billboards);
    this.group.add(this.billboards);

    yield 'bolting down the street furniture';
    this.props = buildProps(era, pool, this.seed);
    mergeStatic(this.props);
    this.group.add(this.props);
    this.lampLights = this.props.userData.lampLights || [];
    for (const v of this.props.userData.vents || []) this.vents.push(v);

    yield 'closing off the avenue';
    this._buildBackdrop();

    yield 'putting traffic on the road';
    this.traffic = new Traffic(era, pool, this.seed);
    this.group.add(this.traffic.group);
    this._fillParking(lotMap);

    yield 'filling the pavement';
    this.people = new People(era, pool, this.seed);
    this.group.add(this.people.group);

    yield 'switching on the lamps';
    this.lightPools = buildLightPools(era, this.lampLights);
    this.lightPools.visible = false;
    this.group.add(this.lightPools);

    this._collectAnimated();
    this.built = true;
    this.scene.add(this.group);
    yield 'done';
  }

  _buildSide(lots, side, lotMap) {
    const era = this.era;
    const pool = this.pool;
    for (let i = 0; i < lots.length; i++) {
      const lot = { ...lots[i], side };
      const spec = era.lots[lot.id];
      if (!spec) continue;
      const prev = lots[i - 1] ? era.lots[lots[i - 1].id] : null;
      const next = lots[i + 1] ? era.lots[lots[i + 1].id] : null;
      const cx = (lot.x0 + lot.x1) / 2;
      const facing = side === 'north' ? 1 : -1;
      const frontZ = side === 'north' ? -BLOCK.frontage : BLOCK.frontage;

      const holder = new THREE.Group();
      holder.position.set(cx, 0, frontZ);
      if (side === 'south') holder.rotation.y = Math.PI;

      const isOpen = spec.kind === 'yard' || spec.kind === 'lot' || spec.kind === 'park';
      const isStation = spec.kind === 'station';

      if (isOpen) {
        const open = buildOpenLot(era, lot, spec, pool, this.seed + i);
        holder.add(open);
        if (open.userData.parkingLot) holder.userData.parkingLot = open.userData.parkingLot;
        if (open.userData.misters) for (const m of open.userData.misters) this.vents.push({ pos: m.clone().applyMatrix4(holder.matrix), kind: 'mist' });
      } else {
        const built = buildBuilding(era, lot, spec, pool, {
          neighborL: prev?.h || 0,
          neighborR: next?.h || 0,
          seed: this.seed + i * 3 + (side === 'north' ? 0 : 50)
        });
        holder.add(built.group);
        if (isStation) {
          holder.add(buildStation(era, lot, spec, pool, this.seed + i));
        } else {
          holder.add(buildStorefront(era, lot, spec, pool, this.seed + i));
        }
        if (built.group.userData.roofParking) holder.userData.roofParking = { ...built.group.userData.roofParking, lot };
      }

      holder.updateMatrixWorld(true);
      mergeStatic(holder);
      this.group.add(holder);

      lotMap[lot.id] = {
        cx,
        h: (spec.h || 0) + (spec.cornice?.h || 0),
        w: lot.x1 - lot.x0,
        d: lot.depth,
        frontZ: frontZ + facing * 0.4,
        side,
        holder
      };
    }
  }

  /** Distant massing so the street does not end in fog-coloured nothing. */
  _buildBackdrop() {
    const era = this.era;
    const pool = this.pool;
    const rng = makeRng(this.seed + era.year * 3);
    const g = new THREE.Group();
    g.name = 'backdrop';
    for (const b of BACKDROP_BLOCKS) {
      const isFuture = era.year >= 2055;
      const wallMat = pool.get(`bd|${b.seed}|${era.year}`, () =>
        makeStandard(this.field, {
          map: windowSheetTexture({
            wall: era.year <= 1965 ? '#7d5a49' : era.year <= 2005 ? '#8a7f70' : isFuture ? '#39424f' : '#8f8578',
            frame: '#2f2b26',
            glass: era.year >= 2025 ? '#3d5a68' : '#2a3038',
            lit: isFuture ? era.accent : '#ffd9a0',
            litChance: era.year <= 1945 ? 0.14 : era.year >= 2025 ? 0.4 : 0.26,
            cols: 4,
            rows: 6,
            seed: b.seed * 13 + era.year,
            grime: era.year === 1985 ? 0.7 : 0.35
          }),
          roughness: 0.92
        })
      );
      const h = b.h * (era.year <= 1965 ? 0.85 : era.year >= 2055 ? 1.35 : 1);
      const m = meshOf(tiledBox(b.w, h, b.d, 6), wallMat, b.x, h / 2, b.z);
      m.castShadow = false;
      m.receiveShadow = true;
      g.add(m);
      // roof clutter reads as a silhouette at this distance
      const capMat = pool.get(`bdcap|${era.year}`, () =>
        makeStandard(this.field, { color: new THREE.Color(era.year >= 2055 ? '#2b3240' : '#5f5a52'), roughness: 0.9 })
      );
      g.add(box(capMat, b.w * 0.3, 2.4, b.d * 0.3, b.x + rng.range(-b.w * 0.2, b.w * 0.2), h + 1.2, b.z));
      if (isFuture) {
        const glowMat = pool.get('bdglow', () => makeStandard(this.field, { color: new THREE.Color(era.accent), emissive: new THREE.Color(era.accent), emissiveIntensity: 2 }));
        g.add(box(glowMat, b.w * 0.7, 0.2, 0.2, b.x, h + 0.4, b.z - b.d / 2));
      }
    }
    mergeStatic(g);
    this.group.add(g);
    this.backdrop = g;
  }

  /** Cars in the surface lot and on the garage roof. */
  _fillParking(lotMap) {
    const era = this.era;
    const rng = makeRng(this.seed + 313 + era.year);
    const kinds = era.vehicles.parked;
    const place = (holder, cfg, count, rowZ) => {
      for (let i = 0; i < count; i++) {
        const kind = kinds[i % kinds.length];
        const type = era.vehicles.types.find((t) => t.kind === kind) || era.vehicles.types[0];
        const built = buildVehicle(kind, rng.pick(type.colors), this.pool, era, rng);
        if (!built.group.children.length) continue;
        const g = built.group;
        g.rotation.y = Math.PI / 2 + rng.range(-0.04, 0.04);
        g.position.set(-cfg.w / 2 + 1.4 + i * (cfg.w / count), cfg.y || 0, rowZ);
        holder.add(g);
      }
    };
    for (const id of Object.keys(lotMap)) {
      const info = lotMap[id];
      const holder = info.holder;
      if (holder.userData.parkingLot) {
        const pl = holder.userData.parkingLot;
        place(holder, { w: pl.w, y: 0 }, 5, -pl.d * 0.35);
        place(holder, { w: pl.w, y: 0 }, 5, -pl.d * 0.65);
      }
      if (holder.userData.roofParking) {
        const rp = holder.userData.roofParking;
        place(holder, { w: rp.w, y: rp.y }, 4, -rp.d * 0.35);
      }
    }
  }

  /** Walk the tree once and cache anything that needs per-frame work. */
  _collectAnimated() {
    this.group.traverse((o) => {
      if (o.userData.billboard) this.billboardSprites.push(o);
      if (o.userData.spin !== undefined) this.spinners.push(o);
      if (o.userData.hover) this.hoverers.push(o);
      if (o.userData.flutter) this.flutterers.push(o);
      if (o.userData.pulse) this.pulsers.push(o);
      if (o.userData.scan) this.scanners.push(o);
      if (o.userData.holo) this.holos.push(o);
      if (o.userData.chaseBulbs) this.chaseSets.push(o.userData.chaseBulbs);
      if (o.userData.bob) this.bobbers.push(o);
      if (o.userData.spinTex) this.spinners.push(o);
      if (o.userData.spinners) this.spinners.push(...o.userData.spinners);
      if (o.userData.hoverers) this.hoverers.push(...o.userData.hoverers);
      if (o.userData.flutterers) this.flutterers.push(...o.userData.flutterers);
      if (o.userData.flickers) this.flickers.push(...o.userData.flickers);
      if (o.userData.spill) this.spills.push(o.userData.spill);
      if (o.userData.steamVents) for (const v of o.userData.steamVents) this.vents.push({ pos: v.clone(), kind: 'steam' });
      if (o.userData.misters) for (const v of o.userData.misters) this.vents.push({ pos: v.clone(), kind: 'mist' });
    });
    // resolve vent positions into world space
    this.group.updateMatrixWorld(true);
    this.ventWorld = this.vents.map((v) => ({ kind: v.kind, pos: v.pos.clone() }));
  }

  setNight(on) {
    this.night = on;
    if (this.lightPools) this.lightPools.visible = on;
    if (this.traffic) this.traffic.setNight(on);
    for (const s of this.spills) s.material.opacity = on ? 0.34 : 0.1;
    // boost every self-lit surface after dark
    for (const m of this.field.materials) {
      if (m.emissiveIntensity !== undefined && m.userData.__baseEmissive === undefined) m.userData.__baseEmissive = m.emissiveIntensity;
      if (m.userData.__baseEmissive !== undefined) m.emissiveIntensity = m.userData.__baseEmissive * (on ? 1.7 : 1);
    }
  }

  show() {
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  update(dt, time, camera) {
    if (!this.built || !this.group.visible) return;
    this.field.update(time);
    this.traffic?.update(dt, time);
    this.people?.update(dt, time);

    for (const s of this.billboardSprites) {
      // cards face the camera but stay upright
      const wp = s.getWorldPosition(_v);
      const angle = Math.atan2(camera.position.x - wp.x, camera.position.z - wp.z);
      s.rotation.set(0, angle - _parentYaw(s), 0);
    }
    for (const s of this.spinners) {
      if (s.userData.spinTex) {
        if (s.material?.map) {
          s.material.map.offset.y -= s.userData.spinTex * dt;
        }
      } else s.rotation.y += (s.userData.spin ?? 1) * dt;
    }
    for (const h of this.hoverers) {
      const cfg = h.userData.hover;
      h.position.y = cfg.base + Math.sin(time * cfg.speed) * cfg.amp;
      h.rotation.z = Math.sin(time * cfg.speed * 0.7) * 0.05;
    }
    for (const f of this.flutterers) {
      const cfg = f.userData.flutter;
      f.rotation.z = cfg.base + Math.sin(time * cfg.speed) * cfg.amp;
      f.rotation.y = Math.sin(time * cfg.speed * 0.6) * cfg.amp * 1.4;
    }
    for (const p of this.pulsers) {
      const cfg = p.userData.pulse;
      if (p.material) p.material.emissiveIntensity = cfg.base + Math.sin(time * cfg.speed) * cfg.amp;
    }
    for (const s of this.scanners) {
      const cfg = s.userData.scan;
      s.position.y = cfg.min + ((Math.sin(time * cfg.speed) + 1) / 2) * (cfg.max - cfg.min);
    }
    for (const h of this.holos) {
      if (h.material) h.material.opacity = 0.72 + Math.sin(time * 3.1 + (h.userData.holo?.phase || 0)) * 0.12;
    }
    for (const set of this.chaseSets) {
      const n = set.length;
      for (let i = 0; i < n; i++) {
        const on = ((i + Math.floor(time * 7)) % 3) !== 0;
        if (set[i].material.emissiveIntensity !== undefined) set[i].material.emissiveIntensity = on ? 3.4 : 0.5;
      }
    }
    for (const b of this.bobbers) b.position.y += Math.sin(time * 3 + b.userData.bob.phase) * 0.0008;
    for (const f of this.flickers) {
      if (Math.random() < f.chance) f.mat.userData.__flick = 0.09 + Math.random() * 0.14;
      if (f.mat.userData.__flick > 0) {
        f.mat.userData.__flick -= dt;
        f.mat.emissiveIntensity = f.base * (0.12 + Math.random() * 0.2);
      } else {
        const base = f.base * (this.night ? 1.7 : 1);
        f.mat.emissiveIntensity = damp(f.mat.emissiveIntensity, base, 8, dt);
      }
    }
  }

  dispose() {
    this.group.removeFromParent();
    this.traffic?.dispose();
    this.people?.dispose();
    this.pool.dispose();
    this.field.dispose();
  }
}

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

/** Yaw contributed by an object's parents, so billboards can cancel it out. */
function _parentYaw(obj) {
  let yaw = 0;
  let p = obj.parent;
  while (p) {
    yaw += p.rotation.y;
    p = p.parent;
  }
  return yaw;
}
