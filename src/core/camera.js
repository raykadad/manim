/**
 * Camera rig.
 *
 * Four modes share one smoothed transform so switching never cuts:
 *   orbit     – drag to swing round the block, wheel to dolly
 *   walk      – pointer-locked, eye height, stays on the pavement
 *   drone     – pointer-locked free flight
 *   cinematic – slow scripted dollies chosen to show the era off
 */

import * as THREE from 'three';
import { damp, clamp, lerp, easeInOutCubic, DEG } from '../util/math.js';
import { BLOCK } from '../world/layout.js';

/**
 * Sight-lines are chosen to stay clear of the south row: either inside the
 * roadway, past the ends of the block, or high enough to clear the parapets.
 */
export const VIEW_PRESETS = [
  { name: 'ESTABLISH', pos: [48, 11.5, 4.2], target: [-30, 7.5, -7.5] },
  { name: 'AERIAL', pos: [16, 46, 68], target: [-2, 11, -10] },
  { name: 'CROSSING', pos: [-25, 2.1, 8.6], target: [-15, 4.4, -11] },
  { name: 'DINER', pos: [-10.5, 2.2, 1.4], target: [-16.5, 3.6, -11] },
  { name: 'MARQUEE', pos: [-18, 4.6, 6.4], target: [-27, 9, -11] },
  { name: 'ROOFTOP', pos: [18, 27, 27], target: [-1, 16, -14] },
  { name: 'KERB', pos: [6.5, 1.78, 4.4], target: [-9, 3.4, -11] },
  { name: 'FORECOURT', pos: [21, 3.6, 5.2], target: [32, 3.4, -14] },
  { name: 'AVENUE', pos: [-58, 3.4, -3.4], target: [45, 9, 2] }
];

const CINEMATIC_SHOTS = [
  // slow dolly down the roadway past the north frontage
  { from: [46, 3.1, 5.4], to: [-34, 3.3, 5.4], look: [-14, 5, -12], dur: 26, fov: 46 },
  // high crane over the block
  { from: [-40, 30, 44], to: [30, 22, 40], look: [-2, 10, -10], dur: 24, fov: 38 },
  // push in on the diner
  { from: [-13, 2.0, 5.2], to: [-14.5, 2.1, 0.4], look: [-16.5, 3.6, -11], dur: 18, fov: 50 },
  // rooftop drift above the parapets
  { from: [32, 25, 18], to: [-30, 21, 16], look: [-4, 12, -12], dur: 22, fov: 40 },
  // long lens straight down the avenue
  { from: [-54, 2.6, -3.4], to: [40, 2.6, -3.4], look: [46, 7, 0], dur: 30, fov: 34 }
];

export class CameraRig {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;
    this.mode = 'orbit';

    this.target = new THREE.Vector3(-30, 7.5, -7.5);
    this.smoothTarget = this.target.clone();
    this.spherical = new THREE.Spherical(58, Math.PI * 0.42, Math.PI * 0.42);
    this.sphericalTarget = this.spherical.clone();

    this.position = new THREE.Vector3();
    this.smoothPos = new THREE.Vector3(48, 11.5, 4.2);
    this.camera.position.copy(this.smoothPos);

    this.yaw = 0;
    this.pitch = 0;
    this.smoothYaw = 0;
    this.smoothPitch = 0;
    this.freePos = new THREE.Vector3(0, 1.75, 16);
    this.velocity = new THREE.Vector3();

    this.keys = new Set();
    this.pointerLocked = false;
    this.dragging = false;
    this.panning = false;
    this.lastPointer = { x: 0, y: 0 };
    this.presetIndex = 0;
    this.shot = 0;
    this.shotT = 0;
    this.fov = 46;
    this.targetFov = 46;
    this.shakeAmount = 0;
    this.enabled = true;
    this.onModeChange = null;

    this._bind();
    this.applyPreset(0, true);
  }

  /* ------------------------------------------------------------ */

  _bind() {
    const dom = this.dom;
    dom.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      if (this.mode === 'orbit') {
        this.dragging = true;
        this.panning = e.button === 2 || e.shiftKey;
        this.lastPointer = { x: e.clientX, y: e.clientY };
        dom.setPointerCapture(e.pointerId);
      }
    });
    dom.addEventListener('pointermove', (e) => {
      if (!this.enabled) return;
      if (this.dragging && this.mode === 'orbit') {
        const dx = e.clientX - this.lastPointer.x;
        const dy = e.clientY - this.lastPointer.y;
        this.lastPointer = { x: e.clientX, y: e.clientY };
        if (this.panning) {
          const scale = this.sphericalTarget.radius * 0.0016;
          const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
          const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
          this.target.addScaledVector(right, -dx * scale);
          this.target.addScaledVector(up, dy * scale);
          this.target.y = clamp(this.target.y, 0.5, 40);
          this.target.x = clamp(this.target.x, -70, 70);
          this.target.z = clamp(this.target.z, -50, 50);
        } else {
          this.sphericalTarget.theta -= dx * 0.0042;
          this.sphericalTarget.phi = clamp(this.sphericalTarget.phi - dy * 0.0034, 0.12, Math.PI * 0.495);
        }
      }
    });
    const endDrag = () => {
      this.dragging = false;
      this.panning = false;
    };
    dom.addEventListener('pointerup', endDrag);
    dom.addEventListener('pointercancel', endDrag);
    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    dom.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        if (this.mode === 'orbit') {
          this.sphericalTarget.radius = clamp(this.sphericalTarget.radius * (1 + Math.sign(e.deltaY) * 0.11), 6, 190);
        } else {
          this.targetFov = clamp(this.targetFov + Math.sign(e.deltaY) * 2, 24, 78);
        }
      },
      { passive: false }
    );

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.dom;
      document.body.classList.toggle('is-pointerlocked', this.pointerLocked);
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = clamp(this.pitch - e.movementY * 0.0022, -1.35, 1.35);
    });

    // touch: one finger orbits, two fingers dolly
    let pinch = 0;
    dom.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 2) {
          pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
      },
      { passive: true }
    );
    dom.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 2 && this.mode === 'orbit') {
          const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          this.sphericalTarget.radius = clamp(this.sphericalTarget.radius * (pinch / Math.max(1, d)), 6, 190);
          pinch = d;
        }
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------ */

  setMode(mode) {
    if (mode === this.mode) return;
    // carry the current transform into the new mode so nothing jumps
    const pos = this.camera.position.clone();
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    if (mode === 'walk' || mode === 'drone') {
      this.freePos.copy(pos);
      if (mode === 'walk') this.freePos.y = BLOCK.sidewalkHeight + 1.72;
      this.yaw = Math.atan2(-dir.x, -dir.z);
      this.pitch = Math.asin(clamp(dir.y, -1, 1));
      this.smoothYaw = this.yaw;
      this.smoothPitch = this.pitch;
      this.dom.requestPointerLock?.();
    } else {
      if (document.pointerLockElement) document.exitPointerLock();
      if (mode === 'orbit') {
        const off = pos.clone().sub(this.target);
        this.sphericalTarget.setFromVector3(off);
        this.sphericalTarget.phi = clamp(this.sphericalTarget.phi, 0.12, Math.PI * 0.495);
        this.spherical.copy(this.sphericalTarget);
      }
      if (mode === 'cinema') {
        this.shotT = 0;
        this.shot = (this.shot + 1) % CINEMATIC_SHOTS.length;
      }
    }
    this.mode = mode;
    this.onModeChange?.(mode);
  }

  cycleMode() {
    const order = ['orbit', 'walk', 'drone', 'cinema'];
    this.setMode(order[(order.indexOf(this.mode) + 1) % order.length]);
  }

  applyPreset(i, instant = false) {
    const p = VIEW_PRESETS[i % VIEW_PRESETS.length];
    this.presetIndex = i % VIEW_PRESETS.length;
    this.target.set(...p.target);
    const pos = new THREE.Vector3(...p.pos);
    const off = pos.clone().sub(this.target);
    this.sphericalTarget.setFromVector3(off);
    this.sphericalTarget.phi = clamp(this.sphericalTarget.phi, 0.12, Math.PI * 0.495);
    if (this.mode !== 'orbit') this.setMode('orbit');
    if (instant) {
      this.spherical.copy(this.sphericalTarget);
      this.smoothTarget.copy(this.target);
      this.smoothPos.copy(pos);
      this.camera.position.copy(pos);
      this.camera.lookAt(this.target);
    }
    return p.name;
  }

  cyclePreset() {
    return this.applyPreset(this.presetIndex + 1);
  }

  shake(amount = 0.5) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  /* ------------------------------------------------------------ */

  update(dt, time) {
    const cam = this.camera;
    const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 3.2 : 1;

    if (this.mode === 'orbit') {
      this.spherical.radius = damp(this.spherical.radius, this.sphericalTarget.radius, 6, dt);
      this.spherical.theta = damp(this.spherical.theta, this.sphericalTarget.theta, 8, dt);
      this.spherical.phi = damp(this.spherical.phi, this.sphericalTarget.phi, 8, dt);
      this.smoothTarget.lerp(this.target, 1 - Math.exp(-7 * dt));
      // a hint of drift keeps a static shot alive
      const drift = new THREE.Vector3(Math.sin(time * 0.11) * 0.35, Math.sin(time * 0.17) * 0.16, Math.cos(time * 0.13) * 0.35);
      const off = new THREE.Vector3().setFromSpherical(this.spherical);
      this.smoothPos.copy(this.smoothTarget).add(off).add(drift);
      this.smoothPos.y = Math.max(1.1, this.smoothPos.y);
      cam.position.copy(this.smoothPos);
      cam.lookAt(this.smoothTarget);
      this.targetFov = 46;
    } else if (this.mode === 'walk' || this.mode === 'drone') {
      const speed = (this.mode === 'walk' ? 3.6 : 11) * sprint;
      const fwd = new THREE.Vector3(-Math.sin(this.smoothYaw), 0, -Math.cos(this.smoothYaw));
      const right = new THREE.Vector3(Math.cos(this.smoothYaw), 0, -Math.sin(this.smoothYaw));
      const wish = new THREE.Vector3();
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) wish.add(fwd);
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) wish.sub(fwd);
      if (this.keys.has('KeyA')) wish.sub(right);
      if (this.keys.has('KeyD')) wish.add(right);
      if (this.mode === 'drone') {
        if (this.keys.has('KeyR') || this.keys.has('Space')) wish.y += 1;
        if (this.keys.has('KeyF')) wish.y -= 1;
      }
      if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed);
      this.velocity.lerp(wish, 1 - Math.exp(-11 * dt));
      this.freePos.addScaledVector(this.velocity, dt);
      this.freePos.x = clamp(this.freePos.x, -95, 95);
      this.freePos.z = clamp(this.freePos.z, -60, 60);
      if (this.mode === 'walk') {
        // stay at eye height, step up onto the kerb
        const onWalk = Math.abs(this.freePos.z) > BLOCK.kerb;
        const ground = onWalk ? BLOCK.sidewalkHeight : 0;
        this.freePos.y = damp(this.freePos.y, ground + 1.72, 9, dt);
        // head bob while moving
        const sp = this.velocity.length();
        this.freePos.y += Math.sin(time * 9) * 0.012 * Math.min(1, sp / 3);
      } else {
        this.freePos.y = clamp(this.freePos.y, 0.8, 90);
      }
      this.smoothYaw = damp(this.smoothYaw, this.yaw, 22, dt);
      this.smoothPitch = damp(this.smoothPitch, this.pitch, 22, dt);
      cam.position.copy(this.freePos);
      cam.rotation.set(0, 0, 0);
      cam.rotateY(this.smoothYaw);
      cam.rotateX(this.smoothPitch);
      // subtle roll when strafing
      cam.rotateZ(-this.velocity.dot(right) * 0.004);
    } else {
      const shot = CINEMATIC_SHOTS[this.shot];
      this.shotT += dt;
      const p = clamp(this.shotT / shot.dur);
      const e = easeInOutCubic(p);
      const from = new THREE.Vector3(...shot.from);
      const to = new THREE.Vector3(...shot.to);
      const pos = from.lerp(to, e);
      pos.y += Math.sin(this.shotT * 0.4) * 0.12;
      cam.position.copy(pos);
      const look = new THREE.Vector3(...shot.look);
      cam.lookAt(look);
      this.targetFov = shot.fov;
      if (p >= 1) {
        this.shot = (this.shot + 1) % CINEMATIC_SHOTS.length;
        this.shotT = 0;
      }
    }

    /* shake */
    if (this.shakeAmount > 0.001) {
      const s = this.shakeAmount;
      cam.position.x += (Math.random() - 0.5) * s * 0.35;
      cam.position.y += (Math.random() - 0.5) * s * 0.35;
      cam.rotateZ((Math.random() - 0.5) * s * 0.012);
      this.shakeAmount = damp(this.shakeAmount, 0, 3.2, dt);
    }

    this.fov = damp(this.fov, this.targetFov, 5, dt);
    if (Math.abs(cam.fov - this.fov) > 0.01) {
      cam.fov = this.fov;
      cam.updateProjectionMatrix();
    }
  }
}
