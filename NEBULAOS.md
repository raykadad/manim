# NebulaOS

A desktop operating system that runs in a browser tab. Everything — the window manager, the
filesystem, the synthesiser, the 3D renderer and both games — lives in a single self-contained
file, [`index.html`](index.html). There is no build step, no bundler, no CDN and no network
access at runtime.

**To run it:** open `index.html` in Chrome (double-click it, or `google-chrome index.html`).

---

## Applications

| App | What it does |
| --- | --- |
| 🚗 **Vice Grid** | 3D open-world crime sandbox (GTA clone) |
| 👾 **Neon Siege** | 3D first-person wave shooter |
| 🖥 **Nebula Shell** | Shell over a persistent virtual filesystem |
| 🗒 **Notes** | Text editor that saves into the filesystem |
| 📁 **Files** | File browser with rename/delete/open and "set as wallpaper" |
| 🎨 **Pixel Paint** | Brush/line/rect/circle/spray canvas; export to Pictures or the wallpaper |
| 🖼 **Image Viewer** | Opens saved pictures |
| 🧮 **Calculator** | Keyboard-driven calculator |
| 🎹 **Beat Lab** | 16-step, 5-track Web Audio drum sequencer |
| ⚙ **Settings** | Wallpaper, accent colour, sound, Chronos and storage settings |
| ⏱ **Chronos** | The time machine (see below) |
| 🌌 **About** | In-OS documentation |

### Vice Grid (3D game #1 — the GTA clone)

A procedurally generated city on a road grid: blocks of towers with windows that light up after
dark, parks, street lamps and lane markings.

- **On foot:** walk, sprint, third-person camera with mouse look, pistol with reload.
- **Vehicles:** walk up to any car and press <kbd>F</kbd>. Parked cars are free; occupied cars are
  a carjack, which ejects the driver and earns a wanted star. Driving has acceleration, grip that
  scales with speed, a handbrake, collision damage and a speedometer.
- **Traffic:** cars drive in the correct lane, brake for the car in front, brake for you, and turn
  at intersections.
- **Pedestrians** wander, panic when you shoot, and can be run over.
- **Wanted system:** five stars. Police cruisers spawn and pursue you along the road grid (with an
  unstick maneuver when they clip a wall), ram you, and shoot from two stars up. Foot patrols can
  bust you. Heat decays once you have shaken them.
- **Missions:** courier runs — collect the green package marker, deliver it to the yellow marker
  before the timer runs out, get paid. Cash and health pickups respawn around the map.
- **Day/night cycle** drives the sky, sun direction, fog and the glow of windows and headlights.
- HUD with money, stars, health, mini-map, mission text and a wrecked-car counter.

**Controls:** `W A S D` drive/walk · mouse look · `F` enter/exit vehicle · left click shoot (horn
in a car) · `Space` handbrake · `Shift` sprint · `R` reload · `H` re-roll the job · `Esc` release
the mouse.

### Neon Siege (3D game #2)

A first-person arena shooter. Waves of enemies spawn around a neon grid arena with cover blocks.

- Hitscan rifle with a 30-round magazine, recoil kick, muzzle flash and reload.
- Movement with jumping, gravity and a dash on <kbd>Shift</kbd>.
- Three enemy types: **drones** (fast, melee), **spitters** (keep their distance, lob projectiles)
  and a **boss** every fifth wave that fires three-round spreads.
- Kills drop health and shield pickups; wave clears award a bonus; high scores persist.

**Controls:** `W A S D` move · mouse aim · left click fire · `R` reload · `Shift` dash ·
`Space` jump · `Esc` release the mouse.

Both games are rendered by a ~200-line WebGL renderer written for this project: geometry is built
on the CPU out of boxes, cylinders and spheres, uploaded once, and drawn with a single shader that
handles directional + hemispheric light, per-vertex emissive (that is what makes windows, neon and
sirens glow) and per-fragment fog.

## Wallpapers

Change the wallpaper from Settings, the desktop right-click menu, <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>W</kbd>,
the shell (`wallpaper grid`), Pixel Paint ("Set as wallpaper") or the Files context menu.

Sources: six seeded procedural generators (aurora, nebula, mountains, synthwave grid, bokeh,
waves) with hue and seed controls, flat colours, uploaded images, and your own paintings.
Procedural wallpapers are stored as a descriptor (`{gen, seed, hue}`) rather than as pixels, so
they cost nothing to save, snapshot or restore.

---

## The special feature: Chronos

**What it is.** Chronos is an OS-wide state recorder and time machine. Once a second the shell
asks itself *and every running application* for a small serialisable snapshot and pushes it into a
ring buffer (about four minutes of history). A snapshot contains:

- the wallpaper descriptor and accent colour,
- every window's app id, geometry, z-order and minimised/maximised state,
- and each app's own state — the text in Notes, the working directory and scrollback in the shell,
  the Pixel Paint canvas, the Beat Lab pattern, and the **live state of both 3D games** (player
  position, health, money, wanted level, every car in the city, the active mission and the time of
  day in Vice Grid; position, wave, score, ammo and every enemy in Neon Siege).

Any snapshot can be re-applied to the live desktop: scrub the timeline in the Chronos app and hit
*Restore this moment*, press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Z</kbd> to jump back ten seconds,
use the desktop context menu, or type `rewind 30` in the shell. Windows that were closed are
relaunched with their old contents, windows opened since are closed, and everything returns to
where it was.

**Why it is special.** Undo is normally a per-document feature: your editor has it, your painting
app has it, and everything else — closing the wrong window, deleting a file, ruining a wallpaper,
rolling your car — is simply gone. Chronos makes undo a *platform service*. An application becomes
time-travellable by implementing two methods:

```js
return {
  root,                       // the app's DOM
  snapshot() { return {...}; }, // small serialisable state
  restore(s) { ... }            // put that state back
};
```

That is the entire contract, which is why it works uniformly across a text editor, a paint canvas
and two real-time 3D games. Crash a car in Vice Grid and rewind and the car is upright and the
police are still chasing (their pursuit state is restored too). Die on wave 7 of Neon Siege and
rewind and the wave is back, enemies and all. It also doubles as a scrubbable session recorder:
the timeline shows how many windows were open at each moment and which ones they were.

To keep it cheap, snapshots are deliberately lossy in the right places — coordinates are rounded
to two decimals, the paint canvas is stored as a 300 px JPEG thumbnail, wallpapers are descriptors
rather than images, and particle effects are dropped rather than serialised.

---

## Shell and shortcuts

Glass windows that drag, resize from any edge, minimise, maximise, snap to the screen edges and
cascade; a dock with running indicators; a launchpad; desktop icons; a right-click desktop menu;
notifications; a boot sequence; and a top bar with a clock, FPS counter and Chronos recorder
indicator.

| Shortcut | Action |
| --- | --- |
| <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Z</kbd> | Rewind the desktop 10 seconds |
| <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>W</kbd> | Shuffle the wallpaper |
| <kbd>Ctrl</kbd>+<kbd>Space</kbd> | Launchpad |
| <kbd>Ctrl</kbd>+<kbd>W</kbd> | Close the focused window |
| Right-click desktop | Context menu |

State (filesystem, wallpaper, notes, beats, settings, high scores) persists in `localStorage`;
Settings can reset it.

## Implementation notes

- One file, ~3,100 lines: utilities, matrix maths, the WebGL engine, the wallpaper generators, the
  window manager, Chronos, the shell and twelve applications.
- No dependencies. The only external thing it touches is `localStorage`.
- Each 3D app owns its own WebGL context and releases it (`WEBGL_lose_context`) when its window
  closes; game loops pause when a window is minimised.
- Verified end-to-end in headless Chrome with a Puppeteer harness: boot, every app, window
  management, both games under pointer lock (driving, carjacking, shooting, wanted escalation,
  pursuit, missions, FPS kills and wave progression) and Chronos round-trips.
