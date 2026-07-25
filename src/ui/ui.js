/**
 * DOM layer: the timeline slider, the era dossier, the HUD, the inspector
 * tooltip and the boot screen.
 */

import { YEARS, ERA_TICK_LABELS } from '../world/eras.js';
import { VIEW_PRESETS } from '../core/camera.js';
import { clamp } from '../util/math.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(handlers = {}) {
    this.h = handlers;
    this.index = 0;
    this.dragging = false;

    this.el = {
      boot: $('boot'),
      bootBar: $('boot-bar-fill'),
      bootStatus: $('boot-status'),
      bootEnter: $('boot-enter'),
      timeline: $('timeline'),
      rail: $('rail'),
      railProgress: $('rail-progress'),
      railTicks: $('rail-ticks'),
      railLabels: $('rail-labels'),
      thumb: $('rail-thumb'),
      thumbYear: $('thumb-year'),
      metaEra: $('meta-era'),
      metaSub: $('meta-sub'),
      dossier: $('dossier'),
      dossierYear: $('dossier-year'),
      dossierTitle: $('dossier-title'),
      dossierBody: $('dossier-body'),
      dossierSwatches: $('dossier-swatches'),
      dossierFacts: $('dossier-facts'),
      dossierAudio: $('dossier-audio'),
      inspector: $('inspector'),
      inspectorYear: $('inspector-year'),
      inspectorName: $('inspector-name'),
      inspectorDesc: $('inspector-desc'),
      hud: $('hud'),
      hint: $('hud-hint'),
      stats: $('stats'),
      statFps: $('stat-fps'),
      statDraws: $('stat-draws'),
      statTris: $('stat-tris'),
      help: $('help'),
      flash: $('flash'),
      flashYear: $('flash-year'),
      views: $('view-presets'),
      modes: $('camera-modes'),
      qualityLabel: $('quality-label')
    };

    this._buildTimeline();
    this._buildViews();
    this._bind();
  }

  /* ------------------------------------------------------------ */

  _buildTimeline() {
    const ticks = this.el.railTicks;
    const labels = this.el.railLabels;
    ticks.innerHTML = '';
    labels.innerHTML = '';
    this.tickEls = [];
    this.labelEls = [];
    YEARS.forEach((y, i) => {
      const t = i / (YEARS.length - 1);
      const tick = document.createElement('div');
      tick.className = 'tick';
      tick.style.left = `${t * 100}%`;
      ticks.appendChild(tick);
      this.tickEls.push(tick);

      const label = document.createElement('div');
      label.className = 'year-label';
      label.style.left = `${t * 100}%`;
      label.innerHTML = `<b>${y}</b><i>${ERA_TICK_LABELS[y]}</i>`;
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        this.select(i);
      });
      labels.appendChild(label);
      this.labelEls.push(label);
    });
  }

  _buildViews() {
    const wrap = this.el.views;
    wrap.innerHTML = '';
    VIEW_PRESETS.forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = p.name;
      b.addEventListener('click', () => {
        this.h.onPreset?.(i);
        [...wrap.children].forEach((c) => c.classList.remove('is-on'));
        b.classList.add('is-on');
      });
      wrap.appendChild(b);
    });
    wrap.children[0]?.classList.add('is-on');
  }

  _bind() {
    const rail = this.el.rail;
    const pick = (clientX) => {
      const r = rail.getBoundingClientRect();
      const t = clamp((clientX - r.left) / r.width);
      return Math.round(t * (YEARS.length - 1));
    };
    const move = (e) => {
      if (!this.dragging) return;
      const r = rail.getBoundingClientRect();
      const t = clamp((e.clientX - r.left) / r.width);
      this.el.thumb.style.left = `${t * 100}%`;
      const i = Math.round(t * (YEARS.length - 1));
      this.el.thumbYear.textContent = YEARS[i];
      if (i !== this.index) this.select(i, { fromDrag: true });
    };
    rail.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.el.thumb.classList.add('is-dragging');
      rail.setPointerCapture(e.pointerId);
      this.select(pick(e.clientX));
      move(e);
    });
    rail.addEventListener('pointermove', move);
    const end = () => {
      if (!this.dragging) return;
      this.dragging = false;
      this.el.thumb.classList.remove('is-dragging');
      this._layout();
    };
    rail.addEventListener('pointerup', end);
    rail.addEventListener('pointercancel', end);
    rail.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.select(this.index - 1);
      if (e.key === 'ArrowRight') this.select(this.index + 1);
    });

    $('btn-prev').addEventListener('click', () => this.select(this.index - 1));
    $('btn-next').addEventListener('click', () => this.select(this.index + 1));
    $('btn-play').addEventListener('click', () => this.h.onPlayToggle?.());

    this.el.modes.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      this.h.onMode?.(b.dataset.mode);
    });

    const toggles = {
      'btn-audio': 'audio',
      'btn-weather': 'weather',
      'btn-grade': 'grade',
      'btn-night': 'night'
    };
    for (const [id, key] of Object.entries(toggles)) {
      $(id).addEventListener('click', () => {
        const el = $(id);
        const on = !el.classList.contains('is-on');
        el.classList.toggle('is-on', on);
        this.h.onToggle?.(key, on);
      });
    }
    $('btn-quality').addEventListener('click', () => this.h.onQuality?.());
    $('btn-help').addEventListener('click', () => this.toggleHelp(true));
    $('help-close').addEventListener('click', () => this.toggleHelp(false));
    this.el.help.addEventListener('click', (e) => {
      if (e.target === this.el.help) this.toggleHelp(false);
    });

    this.el.bootEnter.addEventListener('click', () => this.h.onEnter?.());
  }

  /* ------------------------------------------------------------ */

  select(i, opts = {}) {
    const idx = clamp(i, 0, YEARS.length - 1);
    if (idx === this.index && !opts.force) return;
    const prev = this.index;
    this.index = idx;
    this._layout();
    this.h.onYear?.(YEARS[idx], idx, idx > prev ? 1 : -1);
  }

  setIndex(i) {
    this.index = clamp(i, 0, YEARS.length - 1);
    this._layout();
  }

  _layout() {
    const t = this.index / (YEARS.length - 1);
    if (!this.dragging) this.el.thumb.style.left = `${t * 100}%`;
    this.el.thumbYear.textContent = YEARS[this.index];
    this.el.railProgress.style.width = `${t * 100}%`;
    this.tickEls.forEach((el, i) => {
      el.classList.toggle('is-past', i <= this.index);
      el.classList.toggle('is-now', i === this.index);
    });
    this.labelEls.forEach((el, i) => el.classList.toggle('is-active', i === this.index));
    this.el.rail.setAttribute('aria-valuenow', String(YEARS[this.index]));
  }

  /** Repaint every era-coloured piece of chrome. */
  setEra(era) {
    const root = document.documentElement;
    root.style.setProperty('--accent', era.accent);
    root.style.setProperty('--accent-2', era.accent2);
    this.el.metaEra.textContent = era.name.toUpperCase();
    this.el.metaSub.textContent = era.tagline;
    this.el.dossierYear.textContent = era.year;
    this.el.dossierTitle.textContent = era.name;
    this.el.dossierBody.textContent = era.blurb;
    this.el.dossierAudio.textContent = era.audioLabel;
    this.el.dossierSwatches.innerHTML = era.palette.map((c) => `<i style="background:${c}"></i>`).join('');
    this.el.dossierFacts.innerHTML = era.facts.map((f) => `<li><b>${f.k}</b> — ${f.v}</li>`).join('');
  }

  flashYear(year) {
    const f = this.el.flash;
    this.el.flashYear.textContent = year;
    f.classList.remove('is-firing');
    void f.offsetWidth;
    f.classList.add('is-firing');
  }

  setPlaying(on) {
    $('btn-play').classList.toggle('is-on', on);
    $('btn-play').textContent = on ? '❚❚' : '▶';
  }

  setMode(mode) {
    [...this.el.modes.children].forEach((c) => c.classList.toggle('is-on', c.dataset.mode === mode));
    const hints = {
      orbit: 'drag to orbit · scroll to zoom · click anything to inspect it',
      walk: 'W A S D to walk · mouse to look · Esc to release the pointer',
      drone: 'W A S D to fly · R / F for height · Shift to sprint · Esc to release',
      cinema: 'sit back — press C or pick a mode to take the controls again'
    };
    this.el.hint.textContent = hints[mode] || '';
  }

  setQualityLabel(q) {
    this.el.qualityLabel.textContent = `QUALITY: ${q.toUpperCase()}`;
  }

  setToggle(key, on) {
    const id = { audio: 'btn-audio', weather: 'btn-weather', grade: 'btn-grade', night: 'btn-night' }[key];
    if (id) $(id).classList.toggle('is-on', on);
  }

  toggleHelp(on) {
    this.el.help.classList.toggle('is-open', on ?? !this.el.help.classList.contains('is-open'));
  }

  showInspector(info, x, y) {
    const el = this.el.inspector;
    this.el.inspectorYear.textContent = `${info.year} · INSPECT`;
    this.el.inspectorName.textContent = info.name;
    this.el.inspectorDesc.textContent = info.desc;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.classList.add('is-live');
    clearTimeout(this._inspectorTimer);
    this._inspectorTimer = setTimeout(() => el.classList.remove('is-live'), 6500);
  }

  hideInspector() {
    this.el.inspector.classList.remove('is-live');
  }

  setStats(fps, draws, tris) {
    this.el.statFps.textContent = `${fps.toFixed(0)} fps`;
    this.el.statDraws.textContent = `${draws} draws`;
    this.el.statTris.textContent = `${(tris / 1000).toFixed(0)}k tris`;
  }

  boot(progress, message) {
    this.el.bootBar.style.right = `${(1 - clamp(progress)) * 100}%`;
    if (message) this.el.bootStatus.textContent = message;
  }

  bootReady() {
    this.el.bootEnter.disabled = false;
    this.el.bootStatus.textContent = 'ready';
  }

  bootDismiss() {
    this.el.boot.classList.add('is-gone');
    setTimeout(() => {
      this.el.timeline.classList.add('is-live');
      this.el.dossier.classList.add('is-live');
      this.el.hud.classList.add('is-live');
      this.el.stats.classList.add('is-live');
    }, 260);
  }
}
