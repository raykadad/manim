# CHRONOBLOCK

**One city block. Six eras. 110 years.**

An interactive 3D scene of a single city block — 14th & Kessler, lot 0041 — that
rebuilds itself in front of you as you drag a timeline across **1945 · 1965 ·
1985 · 2005 · 2025 · 2055**.

Every era changes *everything*: the buildings and what has been bolted to their
roofs, the tenants behind the glass, the lettering on the signs, the
advertising, the cars, what people are wearing and carrying, the street
furniture, the road surface, the weather, the light, the colour grade and the
soundscape.

Nothing is downloaded. All geometry, all textures, all signage and every sound
is generated procedurally in the browser at runtime.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/
```

---

## The block

The same seven north lots and six south lots persist across all six eras — what
changes is what stands on them. That continuity is the point: you are watching
one place age, not six unrelated streets.

| Lot | 1945 | 1965 | 1985 | 2005 | 2025 | 2055 |
| --- | --- | --- | --- | --- | --- | --- |
| Corner bank | First Fidelity Savings | First Fidelity, auto banking | Cash Express, bars on the glass | Meridian Bank | Meridian, appointment only | Axiom Credit, autonomous |
| Cinema | The Kessler — *The Lost Weekend* | Kessler Cinerama — *Dr. No* | Kessler Twin — *Back to the Future* | Kessler 4, stadium seating | Kessler Arthouse, 35mm revival | Kessler Immersion, volumetric |
| Diner | Mel's Luncheonette | Mel's, googie, 24 hours | Mel's Coffee Shop | Beanworks Coffee | Mel's, specialty coffee | Mel's Neuro-Café |
| Market | Kessler Bros. Grocer | Five & Dime | Video World (VHS · Beta) | Cell City | Greenleaf Market | Fabricatory |
| Tower | Kessler Building + tailor | Mod Boutique | Galaxy Arcade | Kessler Lofts | Form Studio, green wall | Kessler Vertical Farm |
| Music | Harlow Radio & Phonograph | Spin City Records | Records & Tapes | DVD & Games | Volt E-Bikes | Avatar Atelier |
| Corner lot | Sunray Service, 21¢ | Sunray, full service, 31¢ | Self Serve, $1.09⁹ | Quik Stop, $2.29⁹ | Volta DC fast charge | Skyport 04 |
| Vacant lot | Coal & lumber yard | Parking, 25¢ | Rubble and chainlink | Condo construction | Kessler Green park | Hydroponic garden |

…plus the Ardmore hotel, the laundry, the Blue Note, the chemist and the
municipal parking deck on the south side.

## Controls

| | |
| --- | --- |
| **Timeline** | drag the slider, click a year, `←` / `→`, `1`–`6`, or `Space` to auto-advance |
| **Orbit** | drag to swing, scroll to dolly, shift-drag to pan |
| **Walk** | pointer-locked at eye height, `W A S D`, `Shift` to hurry |
| **Drone** | free flight, `R` / `F` for height |
| **Cinematic** | scripted dollies, hands off |
| **Inspect** | click anything — the fire escape, the hydrant, the marquee, the pigeons |
| `C` `V` | cycle camera mode / saved viewpoint |
| `N` `W` `G` `M` `Q` | night · weather · film grade · mute · render quality |
| `P` | save a screenshot |

## How it is built

```
src/
  main.js              boot, era transitions, the frame loop
  core/
    camera.js          orbit / walk / drone / cinematic rig
    postfx.js          bloom + a per-era film grade
    audio.js           the whole soundtrack, synthesised
  gfx/
    canvas2d.js        drawing primitives: brick, grime, distress, lettering
    textures.js        every texture in the scene
    materials.js       material factory + the chrono-dissolve shader
  world/
    eras.js            the six-decade script: every building, tenant, sign, car, outfit
    layout.js          lot boundaries, kerb lines, lane geometry
    city.js            assembles one era into a dissolvable group
    buildings.js       mass, fenestration, cornices, fire escapes, roofscapes
    storefronts.js     shopfronts, awnings, marquees, blade signs, forecourts
    props.js           street furniture, lamps, wires, signals, trees, billboards
    vehicles.js        parametric car shells + the traffic simulation
    people.js          pedestrians, outfits, walk cycles, dogs, prams
    street.js          roadway, kerbs, crossings, rail, drains
    environment.js     sun, sky, fog, rain, mist, soot
    effects.js         the chrono wave, steam, night light pools
    kit.js             mesh shorthand + static batching
```

### The chrono-dissolve

Each era owns a `ChronoField`: a small set of uniforms woven into every one of
its materials via `onBeforeCompile`. The shader computes a noise threshold from
world position and discards fragments below it, with a hot emissive rim riding
the boundary. Driving one uniform therefore dissolves an entire decade — and
because the threshold is offset by distance along the street, the wave travels
down the block rather than fading everywhere at once. A matching light curtain,
a camera shake and an audio whoosh ride along with it.

### Sound

`core/audio.js` builds a mixer (compressor, a synthesised convolution reverb,
three sub-buses) and then plays:

- a **traffic bed** of filtered brown noise whose cutoff and level follow the era,
- **generative music** with a voice per decade — swing brass and a walking bass
  in 1945, tremolo surf in 1965, a resonant synthwave arpeggio in 1985,
  power chords in 2005, lo-fi keys and vinyl crackle in 2025, slow ambient pads
  in 2055,
- **positional emitters** — the jukebox in the diner, the arcade in the tower,
  the laundry's dryers, the maglev overhead — panned and attenuated against the
  camera,
- **random era events**: ah-oo-ga horns and trolley bells, V8s and a propeller
  plane, car alarms and a distant siren, polyphonic ringtones and reversing
  beeps, e-scooters and delivery drones, maglev passes and station announcements.

### Performance

Roughly 2,500–4,000 draw calls and ~120k triangles per era at 1600×900. Static
geometry is batched per material inside each inspectable subtree (`mergeStatic`
in `world/kit.js`), which cuts the raw mesh count by about 70% while keeping
click-to-inspect and every animated object intact. Eras stream in during idle
frames after 1945 is standing, so the first view arrives quickly.

## Headless capture

`tools/shoot.mjs` boots the scene in Chromium (SwiftShader), steps the timeline
and writes a PNG per era, reporting any console errors:

```bash
npm run dev
node tools/shoot.mjs --years=1945,1985,2055 --preset=3 --out=shots
```
