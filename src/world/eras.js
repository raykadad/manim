/**
 * The six decades of the block.
 *
 * This file is the script the whole simulation performs: sky and light, colour
 * grade, weather, road surface, every lot's building and tenant, the traffic
 * mix, what people are wearing, the street furniture, and the soundscape.
 * The builders in ./ read from here and never invent content of their own.
 */

export const YEARS = [1945, 1965, 1985, 2005, 2025, 2055];

/* ------------------------------------------------------------------ */
/*  1945 — POST-WAR BOOM                                               */
/* ------------------------------------------------------------------ */

const ERA_1945 = {
  year: 1945,
  name: 'Post-War Boom',
  tagline: 'V-J Day + 3 months · the block is brick, canvas and coal smoke',
  blurb:
    'Three months after the war ends the block is still running on 1920s bones. Brick, terracotta and painted glass. Coal smoke hangs at roof height, the streetcar still has its rails, and half the men on the sidewalk are wearing a uniform they have not finished paying off.',
  facts: [
    { k: 'On the corner', v: 'Sunray full-service station, 21¢ a gallon' },
    { k: 'At the Kessler', v: '“The Lost Weekend”, 55¢ matinee' },
    { k: 'Overhead', v: 'Trolley wire, 40 telephone pairs, no TV aerials yet' },
    { k: 'Underfoot', v: 'Granite kerbs, streetcar rail, coal chutes' }
  ],
  audioLabel: 'big band radio · streetcar bells · ah-oo-ga horns',
  accent: '#f0a24b',
  accent2: '#d8b98c',
  palette: ['#7d4534', '#c9b08a', '#2f4739', '#8c2f2a', '#e8d9b8'],

  sky: {
    top: '#5f7ea6',
    mid: '#b3aa93',
    bottom: '#dcc59d',
    sunColor: '#ffc482',
    sunIntensity: 2.7,
    sunGlow: 0.6,
    sunElevation: 21,
    sunAzimuth: 44,
    ambientSky: '#9db0c8',
    ambientGround: '#75634c',
    ambientIntensity: 0.78,
    fog: '#b6a58c',
    fogDensity: 0.005,
    exposure: 1.12,
    stars: 0,
    clouds: { count: 16, color: '#e9dcc4', opacity: 0.5, height: 92, speed: 0.35 },
    contrails: 0,
    aircraft: 'prop'
  },
  night: {
    top: '#0d1520',
    mid: '#1b2331',
    bottom: '#3a3428',
    sunColor: '#7f8fb0',
    sunIntensity: 0.22,
    sunGlow: 0.15,
    sunElevation: 14,
    sunAzimuth: 72,
    ambientSky: '#26303f',
    ambientGround: '#1a1712',
    ambientIntensity: 0.3,
    fog: '#141a24',
    fogDensity: 0.011,
    exposure: 1.18,
    stars: 0.55,
    clouds: { count: 12, color: '#39424f', opacity: 0.4, height: 92, speed: 0.3 }
  },
  grade: {
    saturation: 0.62,
    contrast: 1.09,
    tint: '#f2d3a4',
    tintAmount: 0.34,
    grain: 0.5,
    vignette: 0.52,
    chroma: 0.12,
    scanlines: 0,
    halation: 0.25,
    bloom: { strength: 0.5, radius: 0.7, threshold: 1.06 }
  },
  weather: { type: 'smog', intensity: 0.5, wetness: 0.05, motes: { count: 420, color: '#d9c6a4', size: 0.05, drift: 0.25 } },

  street: {
    asphalt: '#3a3a38',
    asphaltGrime: 0.45,
    sidewalk: '#b9b1a2',
    sidewalkGrime: 0.4,
    kerb: '#8f8b80',
    markings: 'none',
    markingColor: '#d8cba8',
    crosswalk: 'ladder-faded',
    tracks: true,
    cobblePatch: true,
    manholes: true,
    hydrantColor: '#5b6b4a',
    trees: { count: 4, kind: 'young', leaf: '#4d7333', autumn: 0.2 }
  },

  lots: {
    bank: {
      h: 15,
      floors: 4,
      wall: { type: 'stone', color: '#cdc3ad', grime: 0.4 },
      base: { color: '#a89b83' },
      cornice: { style: 'classical', color: '#c2b79f', h: 1.1 },
      columns: 4,
      windows: { style: 'arched', cols: 5, litChance: 0.12, frame: '#3b342a', glass: '#2b3138' },
      roof: ['cornice', 'chimney', 'flagpole', 'pigeons'],
      tenant: {
        name: 'FIRST FIDELITY',
        sub: 'SAVINGS & TRUST · EST 1904',
        style: 'painted',
        bg: '#25201a',
        ink: '#e3c579',
        accent: '#8c2f2a',
        font: 'deco',
        kind: 'bank',
        window: 'grille',
        interior: { base: '#2b2419', warm: '#e8c489' },
        props: ['clockpost', 'nightdeposit']
      }
    },
    theater: {
      h: 16.5,
      floors: 3,
      wall: { type: 'plaster', color: '#c48a5c', grime: 0.35 },
      base: { color: '#6d4a34' },
      cornice: { style: 'classical', color: '#d9a877', h: 1.4 },
      windows: { style: 'arched', cols: 3, litChance: 0.1, frame: '#3a2b20', glass: '#241f1b' },
      roof: ['cornice', 'watertank', 'pigeons'],
      tenant: {
        name: 'THE KESSLER',
        sub: 'PHOTOPLAYS · CONTINUOUS',
        style: 'painted',
        bg: '#3b1f1c',
        ink: '#f0d9a2',
        accent: '#b8232a',
        font: 'deco',
        kind: 'cinema',
        window: 'poster',
        marquee: { line1: 'NOW SHOWING', line2: 'THE LOST WEEKEND', bg: '#efe3c8', ink: '#1b1714', accent: '#b8232a', bulbs: true },
        blade: { text: 'KESSLER', bg: '#8c1f1f', ink: '#ffd9a0', style: 'bulb' },
        interior: { base: '#2a1c17', warm: '#e0b070' },
        props: ['boxoffice', 'posterframes']
      }
    },
    diner: {
      h: 6.4,
      floors: 1,
      wall: { type: 'brick', color: '#8f5240', grime: 0.4 },
      base: { color: '#5b4034' },
      cornice: { style: 'simple', color: '#7d6a52', h: 0.5 },
      windows: { style: 'none' },
      roof: ['vent', 'sign_rooftop'],
      tenant: {
        name: "MEL'S LUNCHEONETTE",
        sub: 'COFFEE 5¢ · SANDWICHES',
        style: 'painted',
        bg: '#20201c',
        ink: '#f2dda8',
        accent: '#b8232a',
        font: 'slab',
        kind: 'diner',
        window: 'display',
        awning: { a: '#8c2b26', b: '#e8dcc0', count: 9 },
        interior: { base: '#3a2a1c', warm: '#ffcf8f' },
        props: ['stools', 'menuboard', 'milkcrates']
      }
    },
    market: {
      h: 7.6,
      floors: 2,
      wall: { type: 'brick', color: '#7f4a3a', grime: 0.45 },
      base: { color: '#4f3a2e' },
      cornice: { style: 'dentil', color: '#8a7458', h: 0.7 },
      windows: { style: 'sash', cols: 3, litChance: 0.14, frame: '#33291f', glass: '#28303a' },
      roof: ['cornice', 'chimney', 'clothesline'],
      tenant: {
        name: 'KESSLER BROS.',
        sub: 'FINE GROCERIES · MEATS',
        style: 'painted',
        bg: '#1f2a20',
        ink: '#eccf85',
        accent: '#7d1f1c',
        font: 'deco',
        kind: 'grocer',
        window: 'display',
        awning: { a: '#2f4a33', b: '#e2d6b6', count: 8 },
        interior: { base: '#2a2418', warm: '#f0c07a' },
        props: ['cratestack', 'scale', 'iceblock']
      }
    },
    tower: {
      h: 25,
      floors: 7,
      wall: { type: 'brick', color: '#8a4b38', grime: 0.5 },
      base: { color: '#57402f' },
      cornice: { style: 'classical', color: '#9c8462', h: 1.2 },
      windows: { style: 'sash', cols: 5, litChance: 0.16, frame: '#332a20', glass: '#26303a' },
      roof: ['cornice', 'watertank', 'chimney', 'pigeons', 'clothesline'],
      fireEscape: true,
      wallArt: { type: 'ghost', text: 'KESSLER & SONS', sub: 'DRY GOODS', ink: '#e8dcc0', y: 0.55, h: 11 },
      tenant: {
        name: 'A. RUBIN · TAILOR',
        sub: 'PRESSING WHILE YOU WAIT',
        style: 'painted',
        bg: '#241d18',
        ink: '#e0c88c',
        accent: '#6b4a2a',
        font: 'serif',
        kind: 'tailor',
        window: 'display',
        interior: { base: '#2e2418', warm: '#e6bd7d' },
        props: ['mannequin', 'sewing']
      }
    },
    music: {
      h: 8.2,
      floors: 2,
      wall: { type: 'brick', color: '#94604a', grime: 0.4 },
      base: { color: '#54392c' },
      cornice: { style: 'simple', color: '#8d7659', h: 0.6 },
      windows: { style: 'sash', cols: 3, litChance: 0.12, frame: '#30271e', glass: '#2a323c' },
      roof: ['cornice', 'antenna_wire', 'pigeons'],
      tenant: {
        name: 'HARLOW RADIO',
        sub: 'PHONOGRAPHS · REPAIRS',
        style: 'painted',
        bg: '#1b232b',
        ink: '#e8c979',
        accent: '#2f6b8c',
        font: 'deco',
        kind: 'radio',
        window: 'display',
        awning: { a: '#28455c', b: '#ddd2b4', count: 7 },
        interior: { base: '#241f1a', warm: '#e6b876' },
        props: ['barberpole', 'radios']
      }
    },
    service: {
      h: 4.6,
      floors: 1,
      kind: 'station',
      wall: { type: 'plaster', color: '#eae4d4', grime: 0.3 },
      base: { color: '#2f4739' },
      cornice: { style: 'simple', color: '#2f4739', h: 0.4 },
      windows: { style: 'none' },
      roof: ['sign_rooftop'],
      tenant: {
        name: 'SUNRAY',
        sub: 'SERVICE · 21¢ GAL',
        style: 'painted',
        bg: '#2f4739',
        ink: '#f2d98c',
        accent: '#c8452f',
        font: 'deco',
        kind: 'gas',
        window: 'open',
        interior: { base: '#2b2b24', warm: '#e8cf95' },
        props: ['pumps_round', 'oilrack', 'airhose', 'liftbay']
      }
    },

    hotel: {
      h: 19,
      floors: 6,
      wall: { type: 'brick', color: '#7b4436', grime: 0.5 },
      base: { color: '#4d372c' },
      cornice: { style: 'classical', color: '#95805f', h: 1 },
      windows: { style: 'sash', cols: 5, litChance: 0.24, frame: '#2f271f', glass: '#2a323c' },
      roof: ['cornice', 'watertank', 'chimney'],
      fireEscape: true,
      tenant: {
        name: 'HOTEL ARDMORE',
        sub: 'ROOMS $2 · TRANSIENT',
        style: 'painted',
        bg: '#2a1d1a',
        ink: '#e6c98a',
        accent: '#8c2f2a',
        font: 'deco',
        kind: 'hotel',
        window: 'grille',
        blade: { text: 'ARDMORE', bg: '#7d1f1c', ink: '#ffdca8', style: 'bulb' },
        interior: { base: '#2b2018', warm: '#dfae6e' }
      }
    },
    laundry: {
      h: 6.8,
      floors: 2,
      wall: { type: 'brick', color: '#8b5b45', grime: 0.5 },
      base: { color: '#503a2d' },
      cornice: { style: 'simple', color: '#87715a', h: 0.5 },
      windows: { style: 'sash', cols: 3, litChance: 0.1, frame: '#2f271f', glass: '#2b333d' },
      roof: ['vent', 'clothesline', 'steam'],
      tenant: {
        name: 'STEAM LAUNDRY',
        sub: 'HAND PRESSED · 1 DAY',
        style: 'painted',
        bg: '#1e2a2c',
        ink: '#e2d3a4',
        accent: '#4a7080',
        font: 'slab',
        kind: 'laundry',
        window: 'display',
        interior: { base: '#2a2622', warm: '#dcc190' }
      }
    },
    bar: {
      h: 7.2,
      floors: 2,
      wall: { type: 'brick', color: '#6f4437', grime: 0.55 },
      base: { color: '#3f2e25' },
      cornice: { style: 'simple', color: '#7a6650', h: 0.5 },
      windows: { style: 'sash', cols: 3, litChance: 0.2, frame: '#2b241d', glass: '#262d36' },
      roof: ['vent', 'chimney'],
      tenant: {
        name: "O'MARA'S",
        sub: 'TAVERN · COLD BEER',
        style: 'painted',
        bg: '#1f2418',
        ink: '#e8cf8f',
        accent: '#b03a2a',
        font: 'deco',
        kind: 'bar',
        window: 'glassblock',
        neon: { text: 'BEER', color: '#ff6a3d' },
        interior: { base: '#241c14', warm: '#dfa863' }
      }
    },
    vacant: {
      kind: 'yard',
      h: 3.4,
      yard: 'coal',
      wall: { type: 'brick', color: '#6b4a3a', grime: 0.6 },
      tenant: {
        name: 'KESSLER COAL & LUMBER',
        sub: 'DELIVERIES DAILY',
        style: 'painted',
        bg: '#241c17',
        ink: '#dcc189',
        accent: '#6b4a2a',
        font: 'slab',
        kind: 'yard'
      }
    },
    pharmacy: {
      h: 7.8,
      floors: 2,
      wall: { type: 'brick', color: '#8a5643', grime: 0.42 },
      base: { color: '#4d382c' },
      cornice: { style: 'dentil', color: '#8d7659', h: 0.65 },
      windows: { style: 'sash', cols: 3, litChance: 0.16, frame: '#2f2820', glass: '#2a323c' },
      roof: ['cornice', 'sign_rooftop'],
      tenant: {
        name: 'CORNER DRUG CO.',
        sub: 'SODA FOUNTAIN · PRESCRIPTIONS',
        style: 'painted',
        bg: '#1c2a33',
        ink: '#eddb9f',
        accent: '#c8452f',
        font: 'deco',
        kind: 'pharmacy',
        window: 'display',
        awning: { a: '#25505e', b: '#e6dcc2', count: 8 },
        neon: { text: 'DRUGS', color: '#4ad4e6' },
        interior: { base: '#2b241b', warm: '#f0c581' }
      }
    },
    garage: {
      h: 6.5,
      floors: 1,
      wall: { type: 'brick', color: '#7a5140', grime: 0.55 },
      base: { color: '#463327' },
      cornice: { style: 'simple', color: '#7c6a54', h: 0.5 },
      windows: { style: 'industrial', cols: 6, litChance: 0.1, frame: '#3a3128', glass: '#2c343d' },
      roof: ['vent', 'skylight'],
      tenant: {
        name: 'AUTO LIVERY',
        sub: 'REPAIRS · STORAGE · TIRES',
        style: 'painted',
        bg: '#20242a',
        ink: '#dfc98d',
        accent: '#7d4a2a',
        font: 'slab',
        kind: 'garage',
        window: 'bay',
        interior: { base: '#241f1a', warm: '#cfa060' }
      }
    }
  },

  billboards: [
    { at: 'roof-garage', headline: 'DRINK COLA', sub: 'ICE COLD · 5¢', brand: 'BOTTLED HERE', scheme: ['#b8232a', '#f4ecd8', '#241a14'], style: 'painted' },
    { at: 'wall-hotel', headline: 'BUY WAR BONDS', sub: 'KEEP FAITH WITH OUR BOYS', brand: '', scheme: ['#1b3a6b', '#f2e6c8', '#8c2f2a'], style: 'litho' },
    { at: 'roof-market', headline: 'LUCKY SMOKES', sub: 'TOASTED · MILD', brand: 'A GOOD SMOKE', scheme: ['#2f4739', '#f0e5c6', '#c8452f'], style: 'painted' }
  ],

  vehicles: {
    density: 0.62,
    speed: 7.5,
    types: [
      { kind: 'sedan45', weight: 5, colors: ['#1b1b1e', '#23301f', '#3a1f24', '#2b3550', '#4a4238'] },
      { kind: 'coupe45', weight: 2, colors: ['#1a1a1c', '#402c22', '#2c3b46'] },
      { kind: 'panelTruck', weight: 2, colors: ['#3d5a4a', '#6b3f2c', '#2f4a63'] },
      { kind: 'pickup45', weight: 1.4, colors: ['#43423b', '#2d3b2c'] },
      { kind: 'streetcar', weight: 0.55, colors: ['#8c5a1f'] },
      { kind: 'cab45', weight: 1.6, colors: ['#d8a52a'] },
      { kind: 'bicycle', weight: 1.2, colors: ['#22282e', '#3b2a22'] }
    ],
    parked: ['sedan45', 'coupe45', 'panelTruck', 'pickup45'],
    horn: 'ahooga'
  },

  pedestrians: {
    count: 30,
    speed: 1.05,
    skin: ['#e5c2a0', '#d3a179', '#a9764f', '#6f4a30', '#f0d3b6'],
    outfits: [
      { top: '#3a3f4b', bottom: '#2b2f38', hat: 'fedora', hatColor: '#4a4038', kind: 'suit', coat: 0.6, weight: 3 },
      { top: '#4b4034', bottom: '#3a3128', hat: 'fedora', hatColor: '#33291f', kind: 'suit', coat: 0.7, weight: 3 },
      { top: '#2c3b52', bottom: '#2c3b52', hat: 'cap', hatColor: '#243044', kind: 'uniform', coat: 0.2, weight: 1.6 },
      { top: '#7d3f42', bottom: '#4a2b2c', hat: 'pillbox', hatColor: '#6b3436', kind: 'dress', coat: 0.5, weight: 2.4 },
      { top: '#4d5b45', bottom: '#3b4436', hat: 'pillbox', hatColor: '#44503d', kind: 'dress', coat: 0.4, weight: 2 },
      { top: '#5a5348', bottom: '#3f3a32', hat: 'newsboy', hatColor: '#4c463c', kind: 'worker', coat: 0.2, weight: 1.6 },
      { top: '#8d8577', bottom: '#4a4438', hat: 'none', hatColor: '#000', kind: 'child', coat: 0.2, weight: 0.8 }
    ],
    accessories: ['briefcase', 'newspaper', 'shoppingbag', 'umbrella', 'dog']
  },

  props: {
    lamps: { kind: 'castiron', color: '#2f3a33', glow: '#ffd39a', spacing: 17, height: 6.2 },
    poles: { kind: 'wood', wires: 8, spacing: 24, color: '#4a3a2c' },
    signals: { kind: 'pedestal', color: '#1f3326' },
    kit: ['mailbox_olive', 'hydrant', 'ashcan', 'newsstand', 'phonebooth_wood', 'clockpost', 'bench_wood', 'trashcan_metal', 'sandwichboard', 'crates', 'firealarm', 'coalchute'],
    litter: 0.35,
    awningWear: 0.35,
    treeGuards: true
  },

  audio: {
    ambienceLevel: 0.5,
    trafficTone: { cutoff: 620, level: 0.42 },
    music: 'bigband',
    emitters: ['radio-diner', 'streetcar', 'newsboy'],
    events: [
      { kind: 'ahooga', every: 12, jitter: 8 },
      { kind: 'trolleybell', every: 17, jitter: 9 },
      { kind: 'propplane', every: 34, jitter: 16 },
      { kind: 'chatter', every: 9, jitter: 6 }
    ]
  }
};

/* ------------------------------------------------------------------ */
/*  1965 — SPACE-AGE OPTIMISM                                          */
/* ------------------------------------------------------------------ */

const ERA_1965 = {
  year: 1965,
  name: 'Space-Age Optimism',
  tagline: 'Kodachrome noon · plastic, chrome and a boomerang on every sign',
  blurb:
    'Twenty years of prosperity have refaced the block. Ground floors are wrapped in porcelain panel and anodised aluminium, the grocer is now a five-and-dime, and the signage has discovered plastic, starbursts and 40 feet of neon. The streetcar rails are still there under fresh asphalt.',
  facts: [
    { k: 'On the corner', v: 'Sunray, now a canopy station — 31¢ a gallon' },
    { k: 'At the Kessler', v: '“Dr. No” — in colour, on the wide screen' },
    { k: 'Overhead', v: 'First TV aerials, trolley wire coming down' },
    { k: 'New this year', v: 'Anodised shopfronts, terrazzo entries, mod boutique' }
  ],
  audioLabel: 'surf rock · V8 rumble · transistor radios',
  accent: '#ff5d5d',
  accent2: '#43d6c4',
  palette: ['#e8503f', '#43c9c4', '#f2c14e', '#f5f0e4', '#2d3f52'],

  sky: {
    top: '#2f6bb5',
    mid: '#82b6dc',
    bottom: '#dbe9f0',
    sunColor: '#fff3d6',
    sunIntensity: 3.5,
    sunGlow: 0.75,
    sunElevation: 54,
    sunAzimuth: 34,
    ambientSky: '#a8c8e6',
    ambientGround: '#7d6f58',
    ambientIntensity: 0.7,
    fog: '#cbdae4',
    fogDensity: 0.0026,
    exposure: 1.08,
    stars: 0,
    clouds: { count: 12, color: '#ffffff', opacity: 0.75, height: 100, speed: 0.28 },
    contrails: 2,
    aircraft: 'jet'
  },
  night: {
    top: '#0a1730',
    mid: '#152743',
    bottom: '#2d3a4e',
    sunColor: '#8aa4d0',
    sunIntensity: 0.24,
    sunGlow: 0.15,
    sunElevation: 16,
    sunAzimuth: 72,
    ambientSky: '#233246',
    ambientGround: '#1a1c22',
    ambientIntensity: 0.32,
    fog: '#101a2b',
    fogDensity: 0.0085,
    exposure: 1.2,
    stars: 0.7,
    clouds: { count: 8, color: '#2b3648', opacity: 0.4, height: 100, speed: 0.25 }
  },
  grade: {
    saturation: 1.32,
    contrast: 1.11,
    tint: '#ffdfae',
    tintAmount: 0.16,
    grain: 0.24,
    vignette: 0.33,
    chroma: 0.08,
    scanlines: 0,
    halation: 0.18,
    bloom: { strength: 0.55, radius: 0.66, threshold: 1.22 }
  },
  weather: { type: 'clear', intensity: 0.15, wetness: 0, motes: { count: 260, color: '#fff0c8', size: 0.045, drift: 0.2 } },

  street: {
    asphalt: '#37383a',
    asphaltGrime: 0.3,
    sidewalk: '#c2bcae',
    sidewalkGrime: 0.28,
    kerb: '#9b978d',
    markings: 'dashed-white',
    markingColor: '#e8e4d6',
    crosswalk: 'ladder',
    tracks: true,
    cobblePatch: false,
    manholes: true,
    hydrantColor: '#c8452f',
    trees: { count: 6, kind: 'mid', leaf: '#5c8a3c', autumn: 0.05 }
  },

  lots: {
    bank: {
      h: 15,
      floors: 4,
      wall: { type: 'stone', color: '#d6cdb8', grime: 0.22 },
      base: { color: '#b8c4c8', refaced: 'aluminium' },
      cornice: { style: 'classical', color: '#cdc2a8', h: 1.1 },
      columns: 4,
      windows: { style: 'arched', cols: 5, litChance: 0.2, frame: '#5c6168', glass: '#3a4a55' },
      roof: ['cornice', 'antenna_tv', 'flagpole'],
      tenant: {
        name: 'FIRST FIDELITY',
        sub: 'AUTO BANKING · DRIVE UP',
        style: 'plastic',
        bg: '#12365e',
        ink: '#f4f0e2',
        accent: '#e8b93f',
        font: 'futura',
        kind: 'bank',
        window: 'plate',
        interior: { base: '#2e3238', warm: '#f2e3b8' },
        props: ['clockpost', 'driveup']
      }
    },
    theater: {
      h: 16.5,
      floors: 3,
      wall: { type: 'plaster', color: '#d9b58a', grime: 0.2 },
      base: { color: '#2f4a63' },
      cornice: { style: 'slab', color: '#e8dcc4', h: 1.2 },
      windows: { style: 'arched', cols: 3, litChance: 0.14, frame: '#4c4238', glass: '#2c3138' },
      roof: ['cornice', 'watertank', 'starburst'],
      tenant: {
        name: 'KESSLER',
        sub: 'CINERAMA · 70MM',
        style: 'neon',
        bg: '#1b2436',
        ink: '#ff5d5d',
        accent: '#43d6c4',
        font: 'futura',
        kind: 'cinema',
        window: 'poster',
        marquee: { line1: 'IN COLOR', line2: 'DR. NO', bg: '#f7efd8', ink: '#1b1714', accent: '#e8503f', bulbs: true },
        blade: { text: 'KESSLER', bg: '#1b2436', ink: '#ff5d5d', style: 'neon' },
        interior: { base: '#2a2230', warm: '#ffd39a' },
        props: ['boxoffice', 'posterframes', 'starburst']
      }
    },
    diner: {
      h: 6.8,
      floors: 1,
      kind: 'googie',
      wall: { type: 'panel', color: '#f0ede2', grime: 0.15 },
      base: { color: '#43c9c4' },
      cornice: { style: 'swoop', color: '#e8503f', h: 0.8 },
      windows: { style: 'none' },
      roof: ['googie_spire', 'sign_rooftop'],
      tenant: {
        name: "MEL'S",
        sub: 'OPEN 24 HOURS · CURB SERVICE',
        style: 'neon',
        bg: '#20242e',
        ink: '#ff5d5d',
        accent: '#f2c14e',
        font: 'futura',
        kind: 'diner',
        window: 'plate',
        interior: { base: '#3b3a33', warm: '#fff0c4' },
        props: ['stools', 'jukebox', 'boomerang']
      }
    },
    market: {
      h: 7.6,
      floors: 2,
      wall: { type: 'brick', color: '#a8705a', grime: 0.25, painted: '#e8dfcc' },
      base: { color: '#c8483a' },
      cornice: { style: 'slab', color: '#f0e8d4', h: 0.7 },
      windows: { style: 'strip', cols: 4, litChance: 0.24, frame: '#8a8f94', glass: '#3d5462' },
      roof: ['cornice', 'antenna_tv', 'ac_units'],
      tenant: {
        name: 'FIVE & DIME',
        sub: 'EVERYTHING FOR THE HOME',
        style: 'plastic',
        bg: '#c8202a',
        ink: '#f7f2e2',
        accent: '#f2c14e',
        font: 'futura',
        kind: 'grocer',
        window: 'plate',
        awning: { a: '#c8202a', b: '#f2ead6', count: 9 },
        interior: { base: '#3a352a', warm: '#ffe0a0' },
        props: ['gumball', 'cratestack']
      }
    },
    tower: {
      h: 25,
      floors: 7,
      wall: { type: 'brick', color: '#95563f', grime: 0.32 },
      base: { color: '#2d3f52', refaced: 'panel' },
      cornice: { style: 'classical', color: '#a08a66', h: 1.2 },
      windows: { style: 'sash', cols: 5, litChance: 0.28, frame: '#4a4238', glass: '#33454f' },
      roof: ['cornice', 'watertank', 'antenna_tv', 'ac_units'],
      fireEscape: true,
      wallArt: { type: 'ad', headline: 'FLY JET', sub: 'NEW YORK IN 5 HRS', scheme: ['#1b5ea8', '#f2ead6', '#e8503f'], style: 'litho', y: 0.55, h: 11 },
      tenant: {
        name: 'MOD',
        sub: 'BOUTIQUE · LONDON STYLES',
        style: 'plastic',
        bg: '#f2c14e',
        ink: '#241f2a',
        accent: '#e8503f',
        font: 'futura',
        kind: 'boutique',
        window: 'plate',
        interior: { base: '#3d3444', warm: '#ffd9ea' },
        props: ['mannequin_mod', 'record']
      }
    },
    music: {
      h: 8.2,
      floors: 2,
      wall: { type: 'brick', color: '#a2705a', grime: 0.28, painted: '#3a5f7d' },
      base: { color: '#f2ead6' },
      cornice: { style: 'slab', color: '#f0e8d4', h: 0.6 },
      windows: { style: 'strip', cols: 3, litChance: 0.2, frame: '#8a8f94', glass: '#3d5462' },
      roof: ['cornice', 'antenna_tv'],
      tenant: {
        name: 'SPIN CITY',
        sub: '45s · LPs · HI-FI',
        style: 'neon',
        bg: '#241d33',
        ink: '#43d6c4',
        accent: '#ff5d5d',
        font: 'futura',
        kind: 'records',
        window: 'plate',
        awning: { a: '#43c9c4', b: '#f2ead6', count: 7 },
        interior: { base: '#2d2438', warm: '#ffc9e0' },
        props: ['barberpole', 'record', 'listeningbooth']
      }
    },
    service: {
      h: 5,
      floors: 1,
      kind: 'station',
      wall: { type: 'panel', color: '#f4f1e6', grime: 0.18 },
      base: { color: '#c8452f' },
      cornice: { style: 'slab', color: '#c8452f', h: 0.5 },
      windows: { style: 'none' },
      roof: ['canopy', 'sign_pylon'],
      tenant: {
        name: 'SUNRAY',
        sub: 'FULL SERVICE · 31¢',
        style: 'plastic',
        bg: '#c8452f',
        ink: '#f7f0dc',
        accent: '#f2c14e',
        font: 'futura',
        kind: 'gas',
        window: 'plate',
        interior: { base: '#33352e', warm: '#f4e0a8' },
        props: ['pumps_60s', 'canopy', 'oilrack', 'airhose', 'liftbay']
      }
    },

    hotel: {
      h: 19,
      floors: 6,
      wall: { type: 'brick', color: '#8a5140', grime: 0.34 },
      base: { color: '#2f4a63', refaced: 'panel' },
      cornice: { style: 'classical', color: '#9c8663', h: 1 },
      windows: { style: 'sash', cols: 5, litChance: 0.3, frame: '#4a4238', glass: '#33454f' },
      roof: ['cornice', 'watertank', 'antenna_tv'],
      fireEscape: true,
      tenant: {
        name: 'ARDMORE',
        sub: 'TV IN EVERY ROOM · AIR COOLED',
        style: 'neon',
        bg: '#1b2a3d',
        ink: '#43d6c4',
        accent: '#ff5d5d',
        font: 'futura',
        kind: 'hotel',
        window: 'plate',
        blade: { text: 'ARDMORE', bg: '#123049', ink: '#43d6c4', style: 'neon' },
        interior: { base: '#2c2f38', warm: '#f0cf94' }
      }
    },
    laundry: {
      h: 6.8,
      floors: 2,
      wall: { type: 'brick', color: '#9a6a52', grime: 0.3, painted: '#eae2cc' },
      base: { color: '#43c9c4' },
      cornice: { style: 'slab', color: '#f0e8d4', h: 0.5 },
      windows: { style: 'strip', cols: 3, litChance: 0.22, frame: '#8a8f94', glass: '#3d5462' },
      roof: ['vent', 'steam', 'antenna_tv'],
      tenant: {
        name: 'WASH-O-MAT',
        sub: 'SELF SERVICE · 20¢',
        style: 'neon',
        bg: '#123049',
        ink: '#f2c14e',
        accent: '#43d6c4',
        font: 'futura',
        kind: 'laundry',
        window: 'plate',
        interior: { base: '#3a3d3a', warm: '#e8eec8' }
      }
    },
    bar: {
      h: 7.2,
      floors: 2,
      wall: { type: 'brick', color: '#6a4438', grime: 0.4, painted: '#2b2733' },
      base: { color: '#1b1723' },
      cornice: { style: 'simple', color: '#7a6650', h: 0.5 },
      windows: { style: 'sash', cols: 3, litChance: 0.26, frame: '#3b3540', glass: '#2b2f3a' },
      roof: ['vent', 'martini'],
      tenant: {
        name: 'BLUE NOTE',
        sub: 'COCKTAIL LOUNGE',
        style: 'neon',
        bg: '#171b2e',
        ink: '#5d9dff',
        accent: '#ff5d5d',
        font: 'script',
        kind: 'bar',
        window: 'glassblock',
        neon: { text: 'COCKTAILS', color: '#5d9dff' },
        interior: { base: '#1d1c28', warm: '#e8a4d0' }
      }
    },
    vacant: {
      kind: 'lot',
      h: 2.6,
      yard: 'parking',
      wall: { type: 'brick', color: '#7d5745', grime: 0.4 },
      tenant: {
        name: 'PARK 25¢',
        sub: 'ALL DAY · ATTENDANT',
        style: 'plastic',
        bg: '#f2c14e',
        ink: '#241f1a',
        accent: '#c8452f',
        font: 'futura',
        kind: 'parking'
      }
    },
    pharmacy: {
      h: 7.8,
      floors: 2,
      wall: { type: 'brick', color: '#9a6450', grime: 0.28, painted: '#e2e8e2' },
      base: { color: '#25707d' },
      cornice: { style: 'slab', color: '#f0f0e4', h: 0.65 },
      windows: { style: 'strip', cols: 3, litChance: 0.24, frame: '#8a8f94', glass: '#3d5462' },
      roof: ['cornice', 'sign_rooftop', 'ac_units'],
      tenant: {
        name: 'DRUG STORE',
        sub: 'SODA FOUNTAIN · LUNCH',
        style: 'neon',
        bg: '#124c56',
        ink: '#43d6c4',
        accent: '#ff5d5d',
        font: 'futura',
        kind: 'pharmacy',
        window: 'plate',
        awning: { a: '#25707d', b: '#f0ece0', count: 8 },
        neon: { text: 'DRUGS', color: '#4ad4e6' },
        interior: { base: '#33372f', warm: '#fbe4a8' }
      }
    },
    garage: {
      h: 11,
      floors: 3,
      kind: 'parking',
      wall: { type: 'concrete', color: '#b8b4a8', grime: 0.3 },
      base: { color: '#8f8b80' },
      cornice: { style: 'slab', color: '#c8c4b8', h: 0.4 },
      windows: { style: 'openramp', cols: 6, litChance: 0.3, frame: '#7d7a70', glass: '#22262a' },
      roof: ['parked_cars', 'lightpole'],
      tenant: {
        name: 'MUNICIPAL PARKING',
        sub: '500 CARS · 50¢ HR',
        style: 'plastic',
        bg: '#1b5ea8',
        ink: '#f2ead6',
        accent: '#f2c14e',
        font: 'futura',
        kind: 'parking',
        window: 'bay',
        interior: { base: '#3a3a38', warm: '#dfe4c8' }
      }
    }
  },

  billboards: [
    { at: 'roof-garage', headline: 'SEE THE U.S.A.', sub: 'IN YOUR NEW HARDTOP', brand: 'MOTORS DIVISION', scheme: ['#e8503f', '#f7f0dc', '#1b3a6b'], style: 'litho' },
    { at: 'wall-hotel', headline: 'THINK COLOR TV', sub: 'THE FUTURE IS BRIGHT', brand: 'ELECTRONICS CORP', scheme: ['#1b5ea8', '#f7f0dc', '#f2c14e'], style: 'photo' },
    { at: 'roof-market', headline: 'FILTER SMOOTH', sub: 'THE MODERN TASTE', brand: '20 CLASS A', scheme: ['#f2c14e', '#241f1a', '#c8202a'], style: 'litho' }
  ],

  vehicles: {
    density: 0.9,
    speed: 9.5,
    types: [
      { kind: 'finned', weight: 4, colors: ['#43c9c4', '#f0ece0', '#e8503f', '#f2c14e', '#5d9dff', '#c8d6b8'] },
      { kind: 'muscle', weight: 2, colors: ['#c8202a', '#1b3a6b', '#2b2b2e', '#f0ece0'] },
      { kind: 'beetle', weight: 1.6, colors: ['#e8dfc4', '#5d9dff', '#8ab84a'] },
      { kind: 'wagon65', weight: 1.6, colors: ['#8a9a5b', '#dfe0d4', '#7d5a3a'] },
      { kind: 'bus65', weight: 0.8, colors: ['#e8f0f2'] },
      { kind: 'cab65', weight: 1.8, colors: ['#f2c14e'] },
      { kind: 'vespa', weight: 1, colors: ['#f0ece0', '#43c9c4', '#e8503f'] },
      { kind: 'streetcar', weight: 0.3, colors: ['#2f6b8c'] }
    ],
    parked: ['finned', 'muscle', 'beetle', 'wagon65'],
    horn: 'classic'
  },

  pedestrians: {
    count: 34,
    speed: 1.15,
    skin: ['#e8c6a4', '#d5a37c', '#ab7a52', '#71503a', '#f2d6ba'],
    outfits: [
      { top: '#e8503f', bottom: '#f0ece0', hat: 'none', hatColor: '#000', kind: 'mod', coat: 0.15, weight: 3 },
      { top: '#f2c14e', bottom: '#2d3f52', hat: 'none', hatColor: '#000', kind: 'mod', coat: 0.1, weight: 2.4 },
      { top: '#2d3f52', bottom: '#2d3f52', hat: 'trilby', hatColor: '#2b2f38', kind: 'suit', coat: 0.25, weight: 2.6 },
      { top: '#43c9c4', bottom: '#f4f0e4', hat: 'none', hatColor: '#000', kind: 'dress', coat: 0.1, weight: 2.6 },
      { top: '#f4f0e4', bottom: '#5d3f6b', hat: 'none', hatColor: '#000', kind: 'dress', coat: 0.12, weight: 2 },
      { top: '#8a9a5b', bottom: '#3f4436', hat: 'cap', hatColor: '#4a5040', kind: 'worker', coat: 0.15, weight: 1.4 },
      { top: '#ff8fb4', bottom: '#f4f0e4', hat: 'none', hatColor: '#000', kind: 'child', coat: 0.1, weight: 0.9 }
    ],
    accessories: ['shoppingbag', 'transistor', 'briefcase', 'balloon', 'dog']
  },

  props: {
    lamps: { kind: 'streamline', color: '#8f938f', glow: '#fff0c4', spacing: 16, height: 7.4 },
    poles: { kind: 'wood', wires: 5, spacing: 26, color: '#5a4636' },
    signals: { kind: 'mast', color: '#f2c14e' },
    kit: ['mailbox_blue', 'hydrant', 'parkingmeter', 'newsbox', 'phonebooth_alum', 'bench_slat', 'trashcan_wire', 'busshelter', 'bikerack', 'firealarm'],
    litter: 0.22,
    awningWear: 0.15,
    treeGuards: true
  },

  audio: {
    ambienceLevel: 0.62,
    trafficTone: { cutoff: 900, level: 0.5 },
    music: 'surf',
    emitters: ['jukebox-diner', 'radio-records', 'construction'],
    events: [
      { kind: 'horn', every: 10, jitter: 7 },
      { kind: 'v8', every: 13, jitter: 8 },
      { kind: 'jet', every: 40, jitter: 20 },
      { kind: 'chatter', every: 8, jitter: 5 }
    ]
  }
};

/* ------------------------------------------------------------------ */
/*  1985 — HARD YEARS                                                  */
/* ------------------------------------------------------------------ */

const ERA_1985 = {
  year: 1985,
  name: 'Hard Years',
  tagline: 'Sodium dusk · plywood, spray paint and a buzzing transformer',
  blurb:
    'The department stores left for the mall a decade ago. Half the upper floors are dark, the theatre has been chopped into two screens, and the coal yard is a fenced hole full of weeds. It rains most evenings and the sodium lamps turn everything the colour of weak tea. It is also the best the block has ever sounded.',
  facts: [
    { k: 'On the corner', v: 'Self-serve pumps, $1.09⁹, cash inside' },
    { k: 'At the Kessler', v: 'Twinned. “Back to the Future”, second run' },
    { k: 'New this year', v: 'Galaxy Arcade, 50 machines, tokens only' },
    { k: 'Ambient', v: 'Car alarms, a distant siren, steam from the manhole' }
  ],
  audioLabel: 'synthwave · car alarms · arcade attract loops',
  accent: '#ff2e88',
  accent2: '#39e6ff',
  palette: ['#6b5f4e', '#ff2e88', '#39e6ff', '#3b3f45', '#c8a24a'],

  sky: {
    top: '#3a4657',
    mid: '#6e6c68',
    bottom: '#9c8163',
    sunColor: '#ffa257',
    sunIntensity: 2.05,
    sunGlow: 0.3,
    sunElevation: 13,
    sunAzimuth: 96,
    ambientSky: '#68788a',
    ambientGround: '#443e35',
    ambientIntensity: 0.8,
    fog: '#6d6a63',
    fogDensity: 0.0072,
    exposure: 1.12,
    stars: 0.1,
    clouds: { count: 22, color: '#5f5c58', opacity: 0.75, height: 84, speed: 0.6 },
    contrails: 1,
    aircraft: 'jet'
  },
  night: {
    top: '#0b1018',
    mid: '#1a1d24',
    bottom: '#3d2f1f',
    sunColor: '#6f7a90',
    sunIntensity: 0.18,
    sunGlow: 0.15,
    sunElevation: 12,
    sunAzimuth: 72,
    ambientSky: '#1f2833',
    ambientGround: '#191510',
    ambientIntensity: 0.28,
    fog: '#131720',
    fogDensity: 0.013,
    exposure: 1.24,
    stars: 0.35,
    clouds: { count: 18, color: '#2b2f36', opacity: 0.6, height: 84, speed: 0.55 }
  },
  grade: {
    saturation: 0.94,
    contrast: 1.18,
    tint: '#8a93c4',
    tintAmount: 0.2,
    grain: 0.58,
    vignette: 0.5,
    chroma: 0.3,
    scanlines: 0.12,
    halation: 0.4,
    bloom: { strength: 0.72, radius: 0.72, threshold: 0.88 }
  },
  weather: { type: 'rain', intensity: 0.72, wetness: 0.85, motes: { count: 180, color: '#a8b0bc', size: 0.04, drift: 0.5 } },

  street: {
    asphalt: '#2c2d30',
    asphaltGrime: 0.65,
    sidewalk: '#8f8c84',
    sidewalkGrime: 0.68,
    kerb: '#75736c',
    markings: 'dashed-yellow',
    markingColor: '#c9a23f',
    crosswalk: 'ladder-worn',
    tracks: false,
    cobblePatch: true,
    manholes: true,
    hydrantColor: '#b03a2a',
    trees: { count: 3, kind: 'scraggly', leaf: '#4a5f34', autumn: 0.4 }
  },

  lots: {
    bank: {
      h: 15,
      floors: 4,
      wall: { type: 'stone', color: '#a9a294', grime: 0.66 },
      base: { color: '#5b5a54' },
      cornice: { style: 'classical', color: '#9c9484', h: 1.1 },
      columns: 4,
      windows: { style: 'arched', cols: 5, litChance: 0.16, frame: '#3d3a34', glass: '#22262b', boarded: 0.3, bars: true },
      roof: ['cornice', 'ac_units', 'sat_dish', 'pigeons'],
      tenant: {
        name: 'CASH EXPRESS',
        sub: 'CHECKS CASHED · MONEY ORDERS',
        style: 'plastic',
        bg: '#1e7a4a',
        ink: '#f6f2df',
        accent: '#f2c14e',
        font: 'helvetica',
        kind: 'checkcash',
        window: 'grille',
        interior: { base: '#232620', warm: '#c9e08a' },
        props: ['atm', 'bars', 'securitycam']
      }
    },
    theater: {
      h: 16.5,
      floors: 3,
      wall: { type: 'plaster', color: '#9c7a5e', grime: 0.62, crackLevel: 0.7 },
      base: { color: '#4a3d33' },
      cornice: { style: 'classical', color: '#a08466', h: 1.4 },
      windows: { style: 'arched', cols: 3, litChance: 0.1, frame: '#3a332c', glass: '#1e2126', boarded: 0.5 },
      roof: ['cornice', 'watertank', 'ac_units', 'pigeons'],
      tenant: {
        name: 'KESSLER TWIN',
        sub: 'ALL SEATS $2 BEFORE 6',
        style: 'plastic',
        bg: '#2b1f2e',
        ink: '#ff2e88',
        accent: '#39e6ff',
        font: 'impact',
        kind: 'cinema',
        window: 'poster',
        marquee: { line1: 'HELD OVER 3RD WK', line2: 'BACK TO THE FUTURE', bg: '#e4dcc4', ink: '#1b1714', accent: '#c8202a', bulbs: true, broken: 0.35 },
        blade: { text: 'KESSLER', bg: '#3a2030', ink: '#ff2e88', style: 'neon', broken: 0.3 },
        interior: { base: '#241c22', warm: '#e0a070' },
        props: ['boxoffice', 'posterframes', 'graffiti']
      }
    },
    diner: {
      h: 6.8,
      floors: 1,
      wall: { type: 'panel', color: '#cdc6b4', grime: 0.6 },
      base: { color: '#6b7a72' },
      cornice: { style: 'swoop', color: '#b0503f', h: 0.8 },
      windows: { style: 'none' },
      roof: ['vent', 'ac_units', 'sign_rooftop'],
      tenant: {
        name: "MEL'S COFFEE SHOP",
        sub: 'BREAKFAST ALL DAY · $2.99',
        style: 'plastic',
        bg: '#c8402f',
        ink: '#f4ecd6',
        accent: '#f2c14e',
        font: 'helvetica',
        kind: 'diner',
        window: 'plate',
        interior: { base: '#33302a', warm: '#ffdda0' },
        props: ['stools', 'jukebox', 'newsbox', 'cigmachine']
      }
    },
    market: {
      h: 7.6,
      floors: 2,
      wall: { type: 'brick', color: '#7d5748', grime: 0.7, painted: '#3c3f4a' },
      base: { color: '#241f2a' },
      cornice: { style: 'dentil', color: '#6d6254', h: 0.7 },
      windows: { style: 'sash', cols: 3, litChance: 0.14, frame: '#2d2a26', glass: '#1f2429', boarded: 0.35 },
      roof: ['cornice', 'ac_units', 'sat_dish'],
      tenant: {
        name: 'VIDEO WORLD',
        sub: 'VHS · BETA · RENT 3 GET 1',
        style: 'neon',
        bg: '#1a1030',
        ink: '#ff2e88',
        accent: '#39e6ff',
        font: 'impact',
        kind: 'video',
        window: 'plate',
        interior: { base: '#221a2e', warm: '#c48aff' },
        props: ['vhswall', 'securitycam', 'gumball']
      }
    },
    tower: {
      h: 25,
      floors: 7,
      wall: { type: 'brick', color: '#6f4839', grime: 0.78 },
      base: { color: '#3a2f28' },
      cornice: { style: 'classical', color: '#7c6c52', h: 1.2 },
      windows: { style: 'sash', cols: 5, litChance: 0.2, frame: '#2b251f', glass: '#1e2429', boarded: 0.28, acUnits: 0.4 },
      roof: ['cornice', 'watertank', 'ac_units', 'sat_dish', 'antenna_tv', 'pigeons'],
      fireEscape: true,
      wallArt: { type: 'graffiti', words: ['ZEKE', 'RUSH 2'], y: 0.22, h: 6 },
      tenant: {
        name: 'GALAXY',
        sub: '50 GAMES · TOKENS ONLY',
        style: 'neon',
        bg: '#160f2e',
        ink: '#39e6ff',
        accent: '#ff2e88',
        font: 'impact',
        kind: 'arcade',
        window: 'plate',
        interior: { base: '#150f24', warm: '#7d5dff' },
        props: ['arcadecabs', 'tokenmachine', 'graffiti']
      }
    },
    music: {
      h: 8.2,
      floors: 2,
      wall: { type: 'brick', color: '#84574a', grime: 0.72 },
      base: { color: '#3d332c' },
      cornice: { style: 'simple', color: '#75634e', h: 0.6 },
      windows: { style: 'sash', cols: 3, litChance: 0.16, frame: '#2c2620', glass: '#1f2429', boarded: 0.4 },
      roof: ['cornice', 'ac_units', 'sat_dish'],
      tenant: {
        name: 'RECORDS & TAPES',
        sub: 'IMPORTS · 12" SINGLES',
        style: 'plastic',
        bg: '#241d33',
        ink: '#f2c14e',
        accent: '#ff2e88',
        font: 'impact',
        kind: 'records',
        window: 'plate',
        interior: { base: '#241c2e', warm: '#e0a0ff' },
        props: ['barberpole_broken', 'flyers', 'boombox']
      }
    },
    service: {
      h: 5,
      floors: 1,
      kind: 'station',
      wall: { type: 'panel', color: '#d8d2c0', grime: 0.6 },
      base: { color: '#8d3a2c' },
      cornice: { style: 'slab', color: '#8d3a2c', h: 0.5 },
      windows: { style: 'none' },
      roof: ['canopy', 'sign_pylon'],
      tenant: {
        name: 'SELF SERVE',
        sub: 'UNLEADED 1.09⁹ · CASH ONLY',
        style: 'plastic',
        bg: '#b03a2a',
        ink: '#f4ecd6',
        accent: '#f2c14e',
        font: 'helvetica',
        kind: 'gas',
        window: 'grille',
        interior: { base: '#2d2f2a', warm: '#e8dfa0' },
        props: ['pumps_80s', 'canopy', 'airhose', 'securitycam']
      }
    },

    hotel: {
      h: 19,
      floors: 6,
      wall: { type: 'brick', color: '#68433a', grime: 0.8 },
      base: { color: '#37291f' },
      cornice: { style: 'classical', color: '#7b6a50', h: 1 },
      windows: { style: 'sash', cols: 5, litChance: 0.3, frame: '#2a231d', glass: '#1e2429', boarded: 0.22, acUnits: 0.5 },
      roof: ['cornice', 'watertank', 'ac_units', 'sat_dish'],
      fireEscape: true,
      tenant: {
        name: 'ARDMORE',
        sub: 'WEEKLY RATES · SRO',
        style: 'neon',
        bg: '#2a1f28',
        ink: '#ff6a3d',
        accent: '#39e6ff',
        font: 'impact',
        kind: 'hotel',
        window: 'grille',
        blade: { text: 'OTEL', bg: '#3a1f2a', ink: '#ff6a3d', style: 'neon', broken: 0.5 },
        interior: { base: '#231c18', warm: '#c98f5a' }
      }
    },
    laundry: {
      h: 6.8,
      floors: 2,
      wall: { type: 'brick', color: '#8a6250', grime: 0.7, painted: '#d6d0bc' },
      base: { color: '#4a5f6b' },
      cornice: { style: 'slab', color: '#c8c2ac', h: 0.5 },
      windows: { style: 'strip', cols: 3, litChance: 0.4, frame: '#6b6a64', glass: '#2c343a' },
      roof: ['vent', 'steam', 'ac_units'],
      tenant: {
        name: '24 HR LAUNDROMAT',
        sub: 'WASH 75¢ · DRY 25¢',
        style: 'plastic',
        bg: '#1b6a8a',
        ink: '#f4f0e0',
        accent: '#f2c14e',
        font: 'helvetica',
        kind: 'laundry',
        window: 'plate',
        interior: { base: '#33383a', warm: '#e8f0d0' }
      }
    },
    bar: {
      h: 7.2,
      floors: 2,
      wall: { type: 'brick', color: '#5b3c32', grime: 0.75, painted: '#221f28' },
      base: { color: '#171420' },
      cornice: { style: 'simple', color: '#6a5a48', h: 0.5 },
      windows: { style: 'sash', cols: 3, litChance: 0.3, frame: '#332e38', glass: '#1c2028', boarded: 0.2 },
      roof: ['vent', 'ac_units'],
      tenant: {
        name: 'BLUE NOTE',
        sub: 'LIVE BANDS · NO COVER TUE',
        style: 'neon',
        bg: '#141428',
        ink: '#39e6ff',
        accent: '#ff2e88',
        font: 'impact',
        kind: 'bar',
        window: 'glassblock',
        neon: { text: 'LIVE', color: '#ff2e88' },
        interior: { base: '#181524', warm: '#a05dff' },
        props: ['flyers', 'graffiti']
      }
    },
    vacant: {
      kind: 'lot',
      h: 2.2,
      yard: 'rubble',
      wall: { type: 'brick', color: '#63443a', grime: 0.8 },
      wallArt: { type: 'graffiti', words: ['FADE', 'TKO'], y: 0.3, h: 5 },
      tenant: {
        name: 'POST NO BILLS',
        sub: 'CITY ORDINANCE 44-B',
        style: 'plastic',
        bg: '#4a4a44',
        ink: '#d8d2c0',
        accent: '#b03a2a',
        font: 'helvetica',
        kind: 'vacant'
      }
    },
    pharmacy: {
      h: 7.8,
      floors: 2,
      wall: { type: 'brick', color: '#8a6250', grime: 0.6, painted: '#cdd4cd' },
      base: { color: '#1e5a6b' },
      cornice: { style: 'slab', color: '#c4cac2', h: 0.65 },
      windows: { style: 'strip', cols: 3, litChance: 0.24, frame: '#6b6a64', glass: '#2c343a' },
      roof: ['cornice', 'sign_rooftop', 'ac_units'],
      tenant: {
        name: 'DISCOUNT DRUGS',
        sub: 'PHOTO 1 HR · LOTTO',
        style: 'plastic',
        bg: '#1e5a8a',
        ink: '#f4f0e0',
        accent: '#e8503f',
        font: 'helvetica',
        kind: 'pharmacy',
        window: 'plate',
        neon: { text: 'OPEN', color: '#ff2e88' },
        interior: { base: '#32362f', warm: '#f0e0a0' }
      }
    },
    garage: {
      h: 11,
      floors: 3,
      kind: 'parking',
      wall: { type: 'concrete', color: '#8e8b82', grime: 0.75 },
      base: { color: '#6b6860' },
      cornice: { style: 'slab', color: '#9c988e', h: 0.4 },
      windows: { style: 'openramp', cols: 6, litChance: 0.35, frame: '#5f5c56', glass: '#1c2024' },
      roof: ['parked_cars', 'lightpole', 'sat_dish'],
      wallArt: { type: 'graffiti', words: ['SPEK', 'ONE'], y: 0.35, h: 6 },
      tenant: {
        name: 'PARK',
        sub: '$4 DAY · $2 EVE',
        style: 'plastic',
        bg: '#1e4a8a',
        ink: '#f2ead6',
        accent: '#f2c14e',
        font: 'helvetica',
        kind: 'parking',
        window: 'bay',
        interior: { base: '#2f3033', warm: '#c8d0b0' }
      }
    }
  },

  billboards: [
    { at: 'roof-garage', headline: 'NEW WAVE 97.3', sub: 'ALL NIGHT · NO TALK', brand: 'FM STEREO', scheme: ['#241033', '#39e6ff', '#ff2e88'], style: 'photo' },
    { at: 'wall-hotel', headline: 'SMOOTH 100s', sub: 'TASTE THE CITY', brand: 'SURGEON GENERAL WARNING', scheme: ['#2b2f38', '#f2ead6', '#c8202a'], style: 'photo' },
    { at: 'roof-market', headline: 'RENT THE HITS', sub: 'NEW RELEASES FRIDAY', brand: 'VIDEO WORLD', scheme: ['#8a1f6b', '#f7f0dc', '#39e6ff'], style: 'photo' }
  ],

  vehicles: {
    density: 0.85,
    speed: 8.5,
    types: [
      { kind: 'boxy', weight: 4, colors: ['#7d6b4a', '#8a8f94', '#3a4a5c', '#9c3a2f', '#c9c2b0'] },
      { kind: 'hatch80', weight: 2.4, colors: ['#c8452f', '#f0ece0', '#4a6b8a', '#d9c24a'] },
      { kind: 'wagon80', weight: 1.4, colors: ['#6b5a3a', '#8a9a8b'] },
      { kind: 'cab80', weight: 2, colors: ['#f2c14e'] },
      { kind: 'police80', weight: 0.5, colors: ['#1c2430'] },
      { kind: 'van80', weight: 1.4, colors: ['#d8d2c0', '#4a5f6b'] },
      { kind: 'bus80', weight: 0.7, colors: ['#e0dcd0'] },
      { kind: 'moto', weight: 0.8, colors: ['#1c1c1e', '#8a1f2a'] }
    ],
    parked: ['boxy', 'hatch80', 'wagon80', 'van80'],
    horn: 'flat'
  },

  pedestrians: {
    count: 26,
    speed: 1.2,
    skin: ['#e8c6a4', '#cf9c76', '#a5744d', '#6b4a34', '#f0d2b4'],
    outfits: [
      { top: '#2b2b30', bottom: '#39435c', hat: 'none', hatColor: '#000', kind: 'leather', coat: 0.5, weight: 3 },
      { top: '#ff2e88', bottom: '#2b2b30', hat: 'none', hatColor: '#000', kind: 'bighair', coat: 0.2, weight: 2.2 },
      { top: '#39e6ff', bottom: '#e8e2d0', hat: 'none', hatColor: '#000', kind: 'tracksuit', coat: 0.15, weight: 2 },
      { top: '#7d5a3a', bottom: '#4a4438', hat: 'beanie', hatColor: '#3a3630', kind: 'worker', coat: 0.5, weight: 2 },
      { top: '#4a5f8a', bottom: '#2f3540', hat: 'none', hatColor: '#000', kind: 'suit', coat: 0.6, weight: 1.8 },
      { top: '#c8452f', bottom: '#3a3f4a', hat: 'cap', hatColor: '#2b2f38', kind: 'boombox', coat: 0.2, weight: 1.2 },
      { top: '#d9c24a', bottom: '#4a4a52', hat: 'none', hatColor: '#000', kind: 'child', coat: 0.3, weight: 0.7 }
    ],
    accessories: ['boombox', 'umbrella', 'shoppingbag', 'skateboard', 'walkman', 'dog']
  },

  props: {
    lamps: { kind: 'cobra', color: '#6b6f72', glow: '#ffab4a', spacing: 18, height: 8.4 },
    poles: { kind: 'wood', wires: 6, spacing: 26, color: '#48403a' },
    signals: { kind: 'mast', color: '#3a4a3f' },
    kit: ['mailbox_blue', 'hydrant', 'parkingmeter', 'newsbox', 'payphone', 'dumpster', 'trashbags', 'bench_slat', 'trashcan_wire', 'busshelter', 'bikerack', 'graffitiwall', 'steamvent', 'chainlink'],
    litter: 0.75,
    awningWear: 0.7,
    treeGuards: false
  },

  audio: {
    ambienceLevel: 0.66,
    trafficTone: { cutoff: 780, level: 0.46 },
    music: 'synthwave',
    emitters: ['arcade-tower', 'boombox', 'laundry-hum'],
    events: [
      { kind: 'carAlarm', every: 22, jitter: 12 },
      { kind: 'siren', every: 30, jitter: 16 },
      { kind: 'horn', every: 11, jitter: 7 },
      { kind: 'subwayRumble', every: 26, jitter: 12 },
      { kind: 'chatter', every: 12, jitter: 8 }
    ]
  }
};

/* ------------------------------------------------------------------ */
/*  2005 — BROADBAND BOOM                                              */
/* ------------------------------------------------------------------ */

const ERA_2005 = {
  year: 2005,
  name: 'Broadband Boom',
  tagline: 'Vinyl banners, EIFS trim and a construction fence on the vacant lot',
  blurb:
    'Money came back and refaced everything in beige stucco and brushed aluminium. The chains arrived: a coffee brand, a mobile carrier, a chemist with a loyalty card. A developer has fenced the old coal yard and hung a rendering of the condos that are coming. Everyone is holding a flip phone.',
  facts: [
    { k: 'On the corner', v: 'Quik Stop — pump-top TV screens, $2.29⁹' },
    { k: 'At the Kessler', v: 'Four screens, stadium seating, digital sound' },
    { k: 'On the lot', v: '“Kessler Place — luxury condos, from $389k”' },
    { k: 'Roofline', v: 'Cellular panel antennas on every parapet' }
  ],
  audioLabel: 'pop-rock · polyphonic ringtones · reversing beeps',
  accent: '#4aa3e0',
  accent2: '#8ecf4a',
  palette: ['#c8b89a', '#4aa3e0', '#8ecf4a', '#e8e4dc', '#454a52'],

  sky: {
    top: '#4a7fb5',
    mid: '#a2bfd6',
    bottom: '#e0e8ec',
    sunColor: '#fff0d4',
    sunIntensity: 3.05,
    sunGlow: 0.7,
    sunElevation: 45,
    sunAzimuth: 58,
    ambientSky: '#b0c6da',
    ambientGround: '#7a7364',
    ambientIntensity: 0.66,
    fog: '#c3ccd2',
    fogDensity: 0.0034,
    exposure: 1.0,
    stars: 0,
    clouds: { count: 14, color: '#f4f6f8', opacity: 0.6, height: 96, speed: 0.32 },
    contrails: 3,
    aircraft: 'jet'
  },
  night: {
    top: '#0a1220',
    mid: '#16202e',
    bottom: '#2e3340',
    sunColor: '#7f92b0',
    sunIntensity: 0.2,
    sunGlow: 0.15,
    sunElevation: 15,
    sunAzimuth: 72,
    ambientSky: '#1f2a38',
    ambientGround: '#191b1e',
    ambientIntensity: 0.3,
    fog: '#131a24',
    fogDensity: 0.0095,
    exposure: 1.18,
    stars: 0.4,
    clouds: { count: 10, color: '#2a3240', opacity: 0.45, height: 96, speed: 0.3 }
  },
  grade: {
    saturation: 1.0,
    contrast: 1.03,
    tint: '#d4e4f2',
    tintAmount: 0.1,
    grain: 0.16,
    vignette: 0.28,
    chroma: 0.05,
    scanlines: 0,
    halation: 0.1,
    bloom: { strength: 0.5, radius: 0.62, threshold: 1.14 }
  },
  weather: { type: 'clear', intensity: 0.2, wetness: 0.05, motes: { count: 200, color: '#dfe6ec', size: 0.04, drift: 0.2 } },

  street: {
    asphalt: '#3d3e40',
    asphaltGrime: 0.35,
    sidewalk: '#c0bcb2',
    sidewalkGrime: 0.32,
    kerb: '#a09c92',
    markings: 'dashed-yellow',
    markingColor: '#d8b83f',
    crosswalk: 'ladder',
    tracks: false,
    cobblePatch: false,
    manholes: true,
    hydrantColor: '#c8452f',
    trees: { count: 7, kind: 'mid', leaf: '#568a3a', autumn: 0.1 }
  },

  lots: {
    bank: {
      h: 15,
      floors: 4,
      wall: { type: 'stone', color: '#c8c0b0', grime: 0.3 },
      base: { color: '#2f4d6b', refaced: 'glass' },
      cornice: { style: 'classical', color: '#bcb3a0', h: 1.1 },
      columns: 4,
      windows: { style: 'arched', cols: 5, litChance: 0.34, frame: '#7d8286', glass: '#3f5866' },
      roof: ['cornice', 'cell', 'hvac'],
      tenant: {
        name: 'MERIDIAN BANK',
        sub: 'MEMBER FDIC · 24H ATM',
        style: 'corporate',
        bg: '#123a63',
        ink: '#f2f6fa',
        accent: '#4aa3e0',
        font: 'helvetica',
        kind: 'bank',
        window: 'plate',
        interior: { base: '#2e3a44', warm: '#dfeaf4' },
        props: ['atm', 'securitycam', 'planter']
      }
    },
    theater: {
      h: 16.5,
      floors: 3,
      wall: { type: 'plaster', color: '#c6b294', grime: 0.28 },
      base: { color: '#5a4436' },
      cornice: { style: 'classical', color: '#cdb896', h: 1.4 },
      windows: { style: 'arched', cols: 3, litChance: 0.2, frame: '#6b6156', glass: '#2f3840' },
      roof: ['cornice', 'hvac', 'cell'],
      tenant: {
        name: 'KESSLER 4',
        sub: 'STADIUM SEATING · DIGITAL',
        style: 'corporate',
        bg: '#5a1f3a',
        ink: '#f6eede',
        accent: '#e8b93f',
        font: 'helvetica',
        kind: 'cinema',
        window: 'poster',
        marquee: { line1: 'NOW PLAYING · 4 SCREENS', line2: 'SHOWTIMES ONLINE', bg: '#f2ecdc', ink: '#211c18', accent: '#8a2f4a', bulbs: false },
        interior: { base: '#2b232a', warm: '#e8c088' },
        props: ['boxoffice', 'posterframes', 'standee']
      }
    },
    diner: {
      h: 6.8,
      floors: 1,
      wall: { type: 'plaster', color: '#d8ceb6', grime: 0.24 },
      base: { color: '#2f5d3f' },
      cornice: { style: 'slab', color: '#2f5d3f', h: 0.7 },
      windows: { style: 'none' },
      roof: ['hvac', 'sign_rooftop'],
      tenant: {
        name: 'BEANWORKS',
        sub: 'COFFEE · FREE WI-FI HOTSPOT',
        style: 'corporate',
        bg: '#1e4d33',
        ink: '#f4f0e2',
        accent: '#8ecf4a',
        font: 'helvetica',
        kind: 'cafe',
        window: 'plate',
        awning: { a: '#2f5d3f', b: '#e8e2d0', count: 8 },
        interior: { base: '#33302a', warm: '#f0dcb0' },
        props: ['patiotables', 'menuboard', 'newsbox']
      }
    },
    market: {
      h: 7.6,
      floors: 2,
      wall: { type: 'brick', color: '#8f6250', grime: 0.35 },
      base: { color: '#e8722a' },
      cornice: { style: 'dentil', color: '#8a7864', h: 0.7 },
      windows: { style: 'sash', cols: 3, litChance: 0.3, frame: '#5f5a52', glass: '#33454f' },
      roof: ['cornice', 'hvac', 'cell'],
      tenant: {
        name: 'CELL CITY',
        sub: 'PHONES · PLANS · UNLOCKS',
        style: 'corporate',
        bg: '#e8722a',
        ink: '#ffffff',
        accent: '#2f3540',
        font: 'helvetica',
        kind: 'phones',
        window: 'plate',
        interior: { base: '#3a3a3f', warm: '#dfe8f4' },
        props: ['banner', 'securitycam', 'standee']
      }
    },
    tower: {
      h: 25,
      floors: 7,
      wall: { type: 'brick', color: '#9c6249', grime: 0.3 },
      base: { color: '#4a4a4f', refaced: 'glass' },
      cornice: { style: 'classical', color: '#a89070', h: 1.2 },
      windows: { style: 'sash', cols: 5, litChance: 0.4, frame: '#6b6156', glass: '#3d5462' },
      roof: ['cornice', 'watertank', 'cell', 'hvac', 'deck'],
      fireEscape: true,
      scaffold: true,
      wallArt: { type: 'ad', headline: 'KESSLER LOFTS', sub: 'NOW LEASING · 1 & 2 BR', scheme: ['#2f4d6b', '#f2ead6', '#8ecf4a'], style: 'photo', y: 0.55, h: 10 },
      tenant: {
        name: 'KESSLER LOFTS',
        sub: 'AUTHENTIC URBAN LIVING',
        style: 'corporate',
        bg: '#2f3d4a',
        ink: '#f2f0e8',
        accent: '#8ecf4a',
        font: 'helvetica',
        kind: 'lofts',
        window: 'plate',
        interior: { base: '#3a3a3a', warm: '#e8dcc0' },
        props: ['planter', 'scaffold', 'buzzer']
      }
    },
    music: {
      h: 8.2,
      floors: 2,
      wall: { type: 'brick', color: '#8f6753', grime: 0.34 },
      base: { color: '#1b3a6b' },
      cornice: { style: 'simple', color: '#82705a', h: 0.6 },
      windows: { style: 'sash', cols: 3, litChance: 0.26, frame: '#5f5a52', glass: '#33454f' },
      roof: ['cornice', 'hvac'],
      tenant: {
        name: 'DVD & GAMES',
        sub: 'NEW RELEASES · TRADE-INS',
        style: 'corporate',
        bg: '#1b3a6b',
        ink: '#f4f2ea',
        accent: '#e8b93f',
        font: 'helvetica',
        kind: 'video',
        window: 'plate',
        interior: { base: '#2a2f3a', warm: '#c8d8f0' },
        props: ['standee', 'banner', 'securitycam']
      }
    },
    service: {
      h: 5.2,
      floors: 1,
      kind: 'station',
      wall: { type: 'panel', color: '#e4e0d2', grime: 0.3 },
      base: { color: '#1e6b4a' },
      cornice: { style: 'slab', color: '#1e6b4a', h: 0.5 },
      windows: { style: 'none' },
      roof: ['canopy', 'sign_pylon'],
      tenant: {
        name: 'QUIK STOP',
        sub: 'GAS 2.29⁹ · COFFEE · ATM',
        style: 'corporate',
        bg: '#1e6b4a',
        ink: '#f6f2e2',
        accent: '#e8b93f',
        font: 'helvetica',
        kind: 'gas',
        window: 'plate',
        interior: { base: '#33352e', warm: '#f0eac0' },
        props: ['pumps_00s', 'canopy', 'icechest', 'securitycam']
      }
    },

    hotel: {
      h: 19,
      floors: 6,
      wall: { type: 'brick', color: '#8a5a48', grime: 0.4 },
      base: { color: '#3f4a52' },
      cornice: { style: 'classical', color: '#8f7c5e', h: 1 },
      windows: { style: 'sash', cols: 5, litChance: 0.42, frame: '#5c5750', glass: '#3d5462', acUnits: 0.3 },
      roof: ['cornice', 'watertank', 'hvac', 'cell'],
      fireEscape: true,
      tenant: {
        name: 'ARDMORE INN',
        sub: 'FREE HBO · WIRELESS INTERNET',
        style: 'corporate',
        bg: '#8a2f3a',
        ink: '#f6f0e4',
        accent: '#e8b93f',
        font: 'helvetica',
        kind: 'hotel',
        window: 'plate',
        interior: { base: '#2f2822', warm: '#e0b880' }
      }
    },
    laundry: {
      h: 6.8,
      floors: 2,
      wall: { type: 'brick', color: '#94705c', grime: 0.4, painted: '#e0dcc8' },
      base: { color: '#3a7d9a' },
      cornice: { style: 'slab', color: '#d4cfba', h: 0.5 },
      windows: { style: 'strip', cols: 3, litChance: 0.44, frame: '#8a8880', glass: '#3d5462' },
      roof: ['vent', 'steam', 'hvac'],
      tenant: {
        name: 'SUDS CITY',
        sub: 'WASH & FOLD · OPEN 6AM',
        style: 'corporate',
        bg: '#3a7d9a',
        ink: '#f4f2e8',
        accent: '#e8b93f',
        font: 'helvetica',
        kind: 'laundry',
        window: 'plate',
        interior: { base: '#3a3d3c', warm: '#eaf2d8' }
      }
    },
    bar: {
      h: 7.2,
      floors: 2,
      wall: { type: 'brick', color: '#6b483c', grime: 0.45, painted: '#2f3540' },
      base: { color: '#1f242c' },
      cornice: { style: 'simple', color: '#6f6050', h: 0.5 },
      windows: { style: 'sash', cols: 3, litChance: 0.38, frame: '#43474e', glass: '#2b323a' },
      roof: ['vent', 'hvac', 'dish'],
      tenant: {
        name: 'BLUE NOTE',
        sub: 'SPORTS BAR & GRILL · 12 TVs',
        style: 'corporate',
        bg: '#1b3a6b',
        ink: '#f2f2ea',
        accent: '#e8503f',
        font: 'helvetica',
        kind: 'bar',
        window: 'plate',
        neon: { text: 'OPEN', color: '#ff5d5d' },
        interior: { base: '#1f232c', warm: '#8ab4e0' }
      }
    },
    vacant: {
      kind: 'lot',
      h: 2.6,
      yard: 'construction',
      wall: { type: 'brick', color: '#7d5745', grime: 0.4 },
      tenant: {
        name: 'KESSLER PLACE',
        sub: 'LUXURY CONDOS FROM $389K',
        style: 'corporate',
        bg: '#2f4d6b',
        ink: '#f2f2ea',
        accent: '#8ecf4a',
        font: 'helvetica',
        kind: 'construction'
      }
    },
    pharmacy: {
      h: 7.8,
      floors: 2,
      wall: { type: 'brick', color: '#946a56', grime: 0.34, painted: '#e4e6e0' },
      base: { color: '#1e4d8a' },
      cornice: { style: 'slab', color: '#d6d8d0', h: 0.65 },
      windows: { style: 'strip', cols: 3, litChance: 0.34, frame: '#8a8880', glass: '#3d5462' },
      roof: ['cornice', 'sign_rooftop', 'hvac'],
      tenant: {
        name: 'MEDIMART',
        sub: 'PHARMACY · PHOTO · 24 HOURS',
        style: 'corporate',
        bg: '#1e4d8a',
        ink: '#f4f4ec',
        accent: '#e8503f',
        font: 'helvetica',
        kind: 'pharmacy',
        window: 'plate',
        interior: { base: '#34383a', warm: '#f0ecc8' }
      }
    },
    garage: {
      h: 11,
      floors: 3,
      kind: 'parking',
      wall: { type: 'concrete', color: '#a5a297', grime: 0.42 },
      base: { color: '#7d7a72' },
      cornice: { style: 'slab', color: '#b0ada2', h: 0.4 },
      windows: { style: 'openramp', cols: 6, litChance: 0.45, frame: '#6f6c66', glass: '#22272c' },
      roof: ['parked_cars', 'lightpole', 'cell'],
      tenant: {
        name: 'PARK',
        sub: '$12 DAY · EARLY BIRD $8',
        style: 'corporate',
        bg: '#1e4d8a',
        ink: '#f2f2ea',
        accent: '#e8b93f',
        font: 'helvetica',
        kind: 'parking',
        window: 'bay',
        interior: { base: '#33342f', warm: '#d8dcc0' }
      }
    }
  },

  billboards: [
    { at: 'roof-garage', headline: 'UNLIMITED NIGHTS', sub: 'NEW FLIP · FREE WITH PLAN', brand: 'CELL CITY', scheme: ['#e8722a', '#ffffff', '#2f3540'], style: 'photo' },
    { at: 'wall-hotel', headline: 'BROADBAND IS HERE', sub: '3 MEGABITS · NO DIAL TONE', brand: 'MERIDIAN NET', scheme: ['#1b5ea8', '#f2f6fa', '#8ecf4a'], style: 'photo' },
    { at: 'roof-market', headline: 'ENERGY DRINK', sub: 'GO ALL NIGHT', brand: 'TAURINE + B12', scheme: ['#8ecf4a', '#1c1f24', '#f2ead6'], style: 'photo' }
  ],

  vehicles: {
    density: 1.0,
    speed: 9,
    types: [
      { kind: 'suv05', weight: 3.4, colors: ['#2f3540', '#8a8f94', '#4a5f3a', '#a8aab0', '#f0eee8'] },
      { kind: 'sedan05', weight: 3, colors: ['#9ca3a8', '#2b3540', '#f0eee8', '#3a4a6b'] },
      { kind: 'minivan', weight: 1.6, colors: ['#c8c4bc', '#5f6b7d'] },
      { kind: 'cab05', weight: 1.8, colors: ['#f2c14e'] },
      { kind: 'van05', weight: 1.3, colors: ['#f0eee8', '#8a4a2f'] },
      { kind: 'bus05', weight: 0.7, colors: ['#dfe4e8'] },
      { kind: 'moto', weight: 0.7, colors: ['#1c1c1e', '#2b4a8a'] },
      { kind: 'hybrid05', weight: 1.1, colors: ['#b8c8d0', '#7d9a6b'] }
    ],
    parked: ['suv05', 'sedan05', 'minivan', 'van05'],
    horn: 'beep'
  },

  pedestrians: {
    count: 32,
    speed: 1.18,
    skin: ['#e8c6a4', '#cf9c76', '#a5744d', '#6b4a34', '#f0d2b4', '#8a5f42'],
    outfits: [
      { top: '#4a5f8a', bottom: '#3a4452', hat: 'none', hatColor: '#000', kind: 'business', coat: 0.3, weight: 2.6 },
      { top: '#8ecf4a', bottom: '#3f4a58', hat: 'cap', hatColor: '#2f3540', kind: 'hoodie', coat: 0.2, weight: 2.4 },
      { top: '#e8e2d0', bottom: '#6b7a8a', hat: 'none', hatColor: '#000', kind: 'cargo', coat: 0.15, weight: 2.2 },
      { top: '#c8452f', bottom: '#2f3540', hat: 'none', hatColor: '#000', kind: 'casual', coat: 0.2, weight: 2 },
      { top: '#f2c14e', bottom: '#4a5260', hat: 'trucker', hatColor: '#c8452f', kind: 'casual', coat: 0.15, weight: 1.6 },
      { top: '#5f3f7d', bottom: '#e0dcd0', hat: 'none', hatColor: '#000', kind: 'dress', coat: 0.15, weight: 1.6 },
      { top: '#4aa3e0', bottom: '#3a4452', hat: 'none', hatColor: '#000', kind: 'child', coat: 0.2, weight: 0.8 }
    ],
    accessories: ['flipphone', 'coffeecup', 'shoppingbag', 'backpack', 'ipod', 'dog', 'stroller']
  },

  props: {
    lamps: { kind: 'shepherd', color: '#3f4a52', glow: '#ffe9c0', spacing: 15, height: 7.6 },
    poles: { kind: 'steel', wires: 4, spacing: 30, color: '#5c605f' },
    signals: { kind: 'mast', color: '#3a4a3f' },
    kit: ['mailbox_blue', 'hydrant', 'parkingmeter', 'newsbox', 'payphone', 'bench_slat', 'trashcan_mesh', 'busshelter', 'bikerack', 'planter', 'atm', 'securitycam', 'construction_fence', 'sandwichboard'],
    litter: 0.3,
    awningWear: 0.25,
    treeGuards: true
  },

  audio: {
    ambienceLevel: 0.6,
    trafficTone: { cutoff: 860, level: 0.48 },
    music: 'poprock',
    emitters: ['cafe-espresso', 'construction', 'store-radio'],
    events: [
      { kind: 'ringtone', every: 15, jitter: 9 },
      { kind: 'beepReverse', every: 20, jitter: 10 },
      { kind: 'horn', every: 12, jitter: 8 },
      { kind: 'chatter', every: 8, jitter: 5 },
      { kind: 'siren', every: 45, jitter: 20 }
    ]
  }
};

/* ------------------------------------------------------------------ */
/*  2025 — RETROFIT                                                    */
/* ------------------------------------------------------------------ */

const ERA_2025 = {
  year: 2025,
  name: 'Retrofit',
  tagline: 'Parklets, murals, e-bikes and a QR code on every table',
  blurb:
    'The block has learned to like itself again. The brick has been repointed and left visible, the condo tower grew a green wall, and the vacant lot is finally a park. Two storefronts are dark behind “FOR LEASE” vinyl. Everything is delivered. Everything has a screen. It is quieter than it has ever been, because the cars stopped making noise.',
  facts: [
    { k: 'On the corner', v: 'Volta — eight DC fast chargers under solar' },
    { k: 'On the lot', v: 'Kessler Green, opened 2019, community mural' },
    { k: 'At the kerb', v: 'Bike-share dock, four scooters lying down' },
    { k: 'Vacancy', v: '2 of 13 storefronts papered over' }
  ],
  audioLabel: 'lo-fi patio speakers · e-scooter whine · delivery drone',
  accent: '#5fd6a4',
  accent2: '#ffb35c',
  palette: ['#b3543f', '#5fd6a4', '#2f3a3f', '#e8e4dc', '#ffb35c'],

  sky: {
    top: '#3d78bd',
    mid: '#97bfdd',
    bottom: '#e4eef4',
    sunColor: '#ffe9c4',
    sunIntensity: 3.25,
    sunGlow: 0.7,
    sunElevation: 36,
    sunAzimuth: 66,
    ambientSky: '#b6cee2',
    ambientGround: '#7c7a6a',
    ambientIntensity: 0.7,
    fog: '#ccd8e0',
    fogDensity: 0.0028,
    exposure: 1.04,
    stars: 0,
    clouds: { count: 11, color: '#fdfdfd', opacity: 0.55, height: 98, speed: 0.26 },
    contrails: 4,
    aircraft: 'jet'
  },
  night: {
    top: '#080f1c',
    mid: '#141e2e',
    bottom: '#2a3140',
    sunColor: '#8296b8',
    sunIntensity: 0.2,
    sunGlow: 0.15,
    sunElevation: 15,
    sunAzimuth: 72,
    ambientSky: '#1d2836',
    ambientGround: '#181a1e',
    ambientIntensity: 0.32,
    fog: '#111823',
    fogDensity: 0.0085,
    exposure: 1.16,
    stars: 0.42,
    clouds: { count: 9, color: '#252f3c', opacity: 0.4, height: 98, speed: 0.24 }
  },
  grade: {
    saturation: 1.06,
    contrast: 1.05,
    tint: '#e8f2fa',
    tintAmount: 0.07,
    grain: 0.1,
    vignette: 0.24,
    chroma: 0.035,
    scanlines: 0,
    halation: 0.08,
    bloom: { strength: 0.56, radius: 0.64, threshold: 1.1 }
  },
  weather: { type: 'clear', intensity: 0.12, wetness: 0.02, motes: { count: 220, color: '#f0e8d8', size: 0.05, drift: 0.3 } },

  street: {
    asphalt: '#3a3b3e',
    asphaltGrime: 0.3,
    sidewalk: '#bdb9b0',
    sidewalkGrime: 0.28,
    kerb: '#a5a198',
    markings: 'dashed-white',
    markingColor: '#e4e2da',
    crosswalk: 'continental',
    bikeLane: '#2f6b4a',
    tracks: false,
    cobblePatch: false,
    manholes: true,
    hydrantColor: '#c8452f',
    trees: { count: 9, kind: 'mature', leaf: '#4f8a3c', autumn: 0.08 }
  },

  lots: {
    bank: {
      h: 15,
      floors: 4,
      wall: { type: 'stone', color: '#cdc6b6', grime: 0.24 },
      base: { color: '#2f3a3f', refaced: 'glass' },
      cornice: { style: 'classical', color: '#c0b8a4', h: 1.1 },
      columns: 4,
      windows: { style: 'arched', cols: 5, litChance: 0.3, frame: '#8f9498', glass: '#465e6b' },
      roof: ['cornice', 'cell', 'hvac', 'solar'],
      tenant: {
        name: 'MERIDIAN',
        sub: 'BRANCH · APPOINTMENT ONLY',
        style: 'minimal',
        bg: '#f2efe8',
        ink: '#26313a',
        accent: '#5fd6a4',
        font: 'grotesk',
        kind: 'bank',
        window: 'plate',
        interior: { base: '#3a4046', warm: '#e8f0f4' },
        props: ['atm', 'planter', 'bikeshare', 'ebikes']
      }
    },
    theater: {
      h: 16.5,
      floors: 3,
      wall: { type: 'plaster', color: '#c9b89c', grime: 0.24 },
      base: { color: '#26313a' },
      cornice: { style: 'classical', color: '#d0bc9c', h: 1.4 },
      windows: { style: 'arched', cols: 3, litChance: 0.24, frame: '#77706a', glass: '#37424a' },
      roof: ['cornice', 'hvac', 'solar', 'cell'],
      tenant: {
        name: 'KESSLER',
        sub: 'ARTHOUSE · 35MM REVIVAL',
        style: 'minimal',
        bg: '#1e2429',
        ink: '#f2ece0',
        accent: '#ffb35c',
        font: 'grotesk',
        kind: 'cinema',
        window: 'poster',
        marquee: { line1: 'DOUBLE FEATURE · SOLD OUT', line2: 'THE LOST WEEKEND', bg: '#181c20', ink: '#f2ece0', accent: '#ffb35c', bulbs: true, led: true },
        interior: { base: '#22262a', warm: '#e8c088' },
        props: ['boxoffice', 'posterframes', 'patiotables']
      }
    },
    diner: {
      h: 6.8,
      floors: 1,
      wall: { type: 'brick', color: '#a2634c', grime: 0.26 },
      base: { color: '#2f3a3f' },
      cornice: { style: 'slab', color: '#2f3a3f', h: 0.6 },
      windows: { style: 'none' },
      roof: ['hvac', 'solar', 'planter_roof'],
      tenant: {
        name: "MEL'S",
        sub: 'SPECIALTY COFFEE · SINCE 1946',
        style: 'minimal',
        bg: '#f4f0e6',
        ink: '#2a2420',
        accent: '#b3543f',
        font: 'grotesk',
        kind: 'cafe',
        window: 'plate',
        awning: { a: '#2f3a3f', b: '#e8e2d0', count: 2 },
        interior: { base: '#31302c', warm: '#f4dfb8' },
        props: ['parklet', 'patiotables', 'menuboard_digital', 'qrcode', 'planter']
      }
    },
    market: {
      h: 7.6,
      floors: 2,
      wall: { type: 'brick', color: '#96604c', grime: 0.28 },
      base: { color: '#2f5d3f' },
      cornice: { style: 'dentil', color: '#8d7a64', h: 0.7 },
      windows: { style: 'sash', cols: 3, litChance: 0.32, frame: '#6b665e', glass: '#3d5462' },
      roof: ['cornice', 'hvac', 'solar'],
      tenant: {
        name: 'GREENLEAF',
        sub: 'MARKET · REFILL · LOCAL',
        style: 'minimal',
        bg: '#eef0e6',
        ink: '#26362a',
        accent: '#5fd6a4',
        font: 'grotesk',
        kind: 'grocer',
        window: 'plate',
        awning: { a: '#2f5d3f', b: '#eef0e6', count: 2 },
        interior: { base: '#33372f', warm: '#e8eec8' },
        props: ['produce', 'planter', 'qrcode', 'deliverybikes']
      }
    },
    tower: {
      h: 25,
      floors: 7,
      wall: { type: 'brick', color: '#a06a4f', grime: 0.24 },
      base: { color: '#31404a', refaced: 'glass' },
      cornice: { style: 'classical', color: '#ad9674', h: 1.2 },
      windows: { style: 'sash', cols: 5, litChance: 0.36, frame: '#7a746c', glass: '#42606e', balcony: 0.5 },
      roof: ['cornice', 'watertank', 'solar', 'garden', 'hvac', 'cell'],
      greenWall: true,
      fireEscape: true,
      wallArt: { type: 'mural', y: 0.45, h: 12 },
      tenant: {
        name: 'FORM',
        sub: 'STRENGTH & CONDITIONING',
        style: 'minimal',
        bg: '#1f262b',
        ink: '#f0ece2',
        accent: '#5fd6a4',
        font: 'grotesk',
        kind: 'gym',
        window: 'plate',
        interior: { base: '#2a2f33', warm: '#dfe8ec' },
        props: ['planter', 'ebikes', 'qrcode']
      }
    },
    music: {
      h: 8.2,
      floors: 2,
      wall: { type: 'brick', color: '#8f6753', grime: 0.3 },
      base: { color: '#ffb35c' },
      cornice: { style: 'simple', color: '#86735d', h: 0.6 },
      windows: { style: 'sash', cols: 3, litChance: 0.26, frame: '#6b665e', glass: '#3d5462' },
      roof: ['cornice', 'hvac', 'solar'],
      tenant: {
        name: 'VOLT',
        sub: 'E-BIKES · SERVICE · RENTALS',
        style: 'minimal',
        bg: '#161a1c',
        ink: '#ffb35c',
        accent: '#5fd6a4',
        font: 'grotesk',
        kind: 'ebike',
        window: 'plate',
        interior: { base: '#26292c', warm: '#ffd9a0' },
        props: ['ebikes', 'chargepost', 'qrcode']
      }
    },
    service: {
      h: 5.4,
      floors: 1,
      kind: 'station',
      wall: { type: 'panel', color: '#eceade', grime: 0.22 },
      base: { color: '#1f7d6b' },
      cornice: { style: 'slab', color: '#1f7d6b', h: 0.5 },
      windows: { style: 'none' },
      roof: ['canopy_solar', 'sign_pylon'],
      tenant: {
        name: 'VOLTA',
        sub: 'DC FAST CHARGE · 350 kW',
        style: 'minimal',
        bg: '#0f3c36',
        ink: '#eafaf2',
        accent: '#5fd6a4',
        font: 'grotesk',
        kind: 'charge',
        window: 'plate',
        interior: { base: '#2c322f', warm: '#dff4e8' },
        props: ['chargers', 'canopy_solar', 'planter', 'securitycam']
      }
    },

    hotel: {
      h: 19,
      floors: 6,
      wall: { type: 'brick', color: '#8f6250', grime: 0.3 },
      base: { color: '#2b3238' },
      cornice: { style: 'classical', color: '#96805f', h: 1 },
      windows: { style: 'sash', cols: 5, litChance: 0.4, frame: '#6b665e', glass: '#42606e', balcony: 0.3 },
      roof: ['cornice', 'watertank', 'hvac', 'garden', 'rooftopbar', 'solar'],
      fireEscape: true,
      tenant: {
        name: 'THE ARDMORE',
        sub: 'BOUTIQUE · ROOFTOP BAR',
        style: 'minimal',
        bg: '#f2ede2',
        ink: '#2a2420',
        accent: '#b3543f',
        font: 'grotesk',
        kind: 'hotel',
        window: 'plate',
        interior: { base: '#2f2a24', warm: '#e8c58c' }
      }
    },
    laundry: {
      h: 6.8,
      floors: 2,
      wall: { type: 'brick', color: '#94705c', grime: 0.3 },
      base: { color: '#4a6b7d' },
      cornice: { style: 'slab', color: '#cbc6b2', h: 0.5 },
      windows: { style: 'strip', cols: 3, litChance: 0.4, frame: '#8a8880', glass: '#3d5462' },
      roof: ['vent', 'steam', 'hvac', 'solar'],
      tenant: {
        name: 'WASHBOARD',
        sub: 'CO-OP LAUNDRY · APP UNLOCK',
        style: 'minimal',
        bg: '#eaf0f2',
        ink: '#26313a',
        accent: '#4a9ed6',
        font: 'grotesk',
        kind: 'laundry',
        window: 'plate',
        interior: { base: '#383d3e', warm: '#e8f2e4' }
      }
    },
    bar: {
      h: 7.2,
      floors: 2,
      wall: { type: 'brick', color: '#7a5244', grime: 0.32 },
      base: { color: '#20262b' },
      cornice: { style: 'simple', color: '#77664f', h: 0.5 },
      windows: { style: 'sash', cols: 3, litChance: 0.4, frame: '#4d5158', glass: '#33404a' },
      roof: ['vent', 'hvac', 'planter_roof'],
      tenant: {
        name: 'NOTE',
        sub: 'NATURAL WINE · SMALL PLATES',
        style: 'minimal',
        bg: '#1a1f22',
        ink: '#f0e8dc',
        accent: '#b3543f',
        font: 'grotesk',
        kind: 'bar',
        window: 'plate',
        interior: { base: '#221f22', warm: '#e8b878' },
        props: ['parklet', 'patiotables', 'stringlights']
      }
    },
    vacant: {
      kind: 'park',
      h: 0.6,
      yard: 'park',
      wall: { type: 'brick', color: '#8a6250', grime: 0.3 },
      wallArt: { type: 'mural', y: 0.4, h: 7 },
      tenant: {
        name: 'KESSLER GREEN',
        sub: 'A COMMUNITY SPACE · 2019',
        style: 'minimal',
        bg: '#233d2c',
        ink: '#eaf4e4',
        accent: '#5fd6a4',
        font: 'grotesk',
        kind: 'park'
      }
    },
    pharmacy: {
      h: 7.8,
      floors: 2,
      wall: { type: 'brick', color: '#946a56', grime: 0.3 },
      base: { color: '#2f4d5d' },
      cornice: { style: 'slab', color: '#cfcbba', h: 0.65 },
      windows: { style: 'strip', cols: 3, litChance: 0.3, frame: '#8a8880', glass: '#3d5462' },
      roof: ['cornice', 'hvac', 'solar'],
      tenant: {
        name: 'APOTHECARY',
        sub: 'PHARMACY · WELLNESS · DERM',
        style: 'minimal',
        bg: '#f0f2ee',
        ink: '#25332c',
        accent: '#5fd6a4',
        font: 'grotesk',
        kind: 'pharmacy',
        window: 'plate',
        interior: { base: '#353a36', warm: '#eef2dc' }
      }
    },
    garage: {
      h: 11,
      floors: 3,
      kind: 'parking',
      wall: { type: 'concrete', color: '#a8a79c', grime: 0.38 },
      base: { color: '#7d7a72' },
      cornice: { style: 'slab', color: '#b2afa4', h: 0.4 },
      windows: { style: 'openramp', cols: 6, litChance: 0.4, frame: '#6f6c66', glass: '#22272c' },
      roof: ['parked_cars', 'lightpole', 'cell', 'solar'],
      greenWall: true,
      tenant: {
        name: 'MOBILITY HUB',
        sub: 'BIKES · SCOOTERS · 40 EV BAYS',
        style: 'minimal',
        bg: '#1f3a34',
        ink: '#eaf4ee',
        accent: '#5fd6a4',
        font: 'grotesk',
        kind: 'parking',
        window: 'bay',
        interior: { base: '#32332f', warm: '#dae4c8' },
        props: ['ebikes', 'chargers', 'bikeshare']
      }
    }
  },

  billboards: [
    { at: 'roof-garage', headline: 'GET IT IN 15', sub: 'GROCERIES · FIRST ORDER FREE', brand: 'DELIVERY APP', scheme: ['#5fd6a4', '#12241d', '#f2f6f0'], style: 'digital' },
    { at: 'wall-hotel', headline: 'ALL ELECTRIC', sub: '480 KM · 18 MIN CHARGE', brand: 'VOLTA MOTORS', scheme: ['#1a2b3a', '#eaf4ff', '#5fd6a4'], style: 'digital' },
    { at: 'roof-market', headline: 'THIS COULD BE YOU', sub: 'ADVERTISE HERE · SCAN', brand: 'KESSLER MEDIA', scheme: ['#ffb35c', '#241c14', '#f2ead6'], style: 'digital' }
  ],

  vehicles: {
    density: 0.82,
    speed: 8.5,
    types: [
      { kind: 'ev25', weight: 3.2, colors: ['#f0f0ee', '#1c2024', '#8a9098', '#2b4a6b', '#4a6b5a'] },
      { kind: 'crossover25', weight: 2.6, colors: ['#e8e6e0', '#2f3540', '#7d8288', '#3a4a52'] },
      { kind: 'pickupEV', weight: 1.1, colors: ['#b8bcc0', '#2b2f34'] },
      { kind: 'rideshare', weight: 1.6, colors: ['#1c1f24', '#f0eee8'] },
      { kind: 'deliveryVan25', weight: 1.5, colors: ['#f4f2ec', '#3a5f8a'] },
      { kind: 'busEV', weight: 0.7, colors: ['#e8eef0'] },
      { kind: 'escooter', weight: 1.8, colors: ['#5fd6a4', '#ffb35c'] },
      { kind: 'cargobike', weight: 1.2, colors: ['#2f6b4a', '#c8452f'] },
      { kind: 'sidewalkbot', weight: 0.9, colors: ['#e8e4dc'] }
    ],
    parked: ['ev25', 'crossover25', 'deliveryVan25', 'pickupEV'],
    horn: 'polite'
  },

  pedestrians: {
    count: 36,
    speed: 1.16,
    skin: ['#eac9a8', '#d2a07c', '#a8784f', '#6f4d35', '#f2d6ba', '#8a5f42'],
    outfits: [
      { top: '#2f3a3f', bottom: '#3a4048', hat: 'none', hatColor: '#000', kind: 'athleisure', coat: 0.25, weight: 2.8 },
      { top: '#5fd6a4', bottom: '#26313a', hat: 'beanie', hatColor: '#26313a', kind: 'puffer', coat: 0.45, weight: 2.4 },
      { top: '#ffb35c', bottom: '#2b3238', hat: 'cap', hatColor: '#1f2429', kind: 'courier', coat: 0.2, weight: 1.8 },
      { top: '#e8e4dc', bottom: '#4a5058', hat: 'none', hatColor: '#000', kind: 'casual', coat: 0.2, weight: 2.4 },
      { top: '#b3543f', bottom: '#e8e4dc', hat: 'none', hatColor: '#000', kind: 'dress', coat: 0.2, weight: 1.8 },
      { top: '#3a4a6b', bottom: '#2f3540', hat: 'none', hatColor: '#000', kind: 'business', coat: 0.3, weight: 1.6 },
      { top: '#f0a24b', bottom: '#3f4650', hat: 'none', hatColor: '#000', kind: 'child', coat: 0.2, weight: 0.9 }
    ],
    accessories: ['phone', 'coffeecup', 'totebag', 'deliverybag', 'earbuds', 'dog', 'stroller', 'yogamat']
  },

  props: {
    lamps: { kind: 'led', color: '#4a4f54', glow: '#f4f0e0', spacing: 15, height: 7.8 },
    poles: { kind: 'smart', wires: 2, spacing: 34, color: '#54585c' },
    signals: { kind: 'mast_countdown', color: '#3a4a3f' },
    kit: ['mailbox_blue', 'hydrant', 'newsbox_free', 'bench_modern', 'trashcan_solar', 'busshelter_led', 'bikeshare', 'planter', 'parklet', 'scooters', 'chargepost', 'securitycam', 'sandwichboard', 'stringlights', 'raingarden'],
    litter: 0.22,
    awningWear: 0.18,
    treeGuards: true
  },

  audio: {
    ambienceLevel: 0.5,
    trafficTone: { cutoff: 520, level: 0.32 },
    music: 'lofi',
    emitters: ['cafe-patio', 'ebike-hum', 'hvac'],
    events: [
      { kind: 'scooter', every: 14, jitter: 8 },
      { kind: 'drone', every: 24, jitter: 12 },
      { kind: 'notification', every: 17, jitter: 10 },
      { kind: 'chatter', every: 9, jitter: 5 },
      { kind: 'skateboard', every: 26, jitter: 14 }
    ]
  }
};

/* ------------------------------------------------------------------ */
/*  2055 — CANOPY CITY                                                 */
/* ------------------------------------------------------------------ */

const ERA_2055 = {
  year: 2055,
  name: 'Canopy City',
  tagline: 'Dusk under the maglev · grown facades, projected signs, no engines',
  blurb:
    'The street was given back to people in the forties and the kerb line never came back. A maglev spur runs above the roofline, the tower is a working farm, and the shopfronts advertise with light rather than paint. The block is still brick underneath all of it — the preservation order saw to that.',
  facts: [
    { k: 'Above the street', v: 'Kessler maglev spur, 90-second headway' },
    { k: 'On the tower', v: '11 growing floors, 40 tonnes of produce a year' },
    { k: 'At the kerb', v: 'No kerb. Light-strip edge, adaptive priority' },
    { k: 'Air', v: 'Misting arches, 3°C below the district average' }
  ],
  audioLabel: 'maglev hum · drone lanes · generative ambient',
  accent: '#63f5ff',
  accent2: '#ff5dc8',
  palette: ['#10182c', '#63f5ff', '#ff5dc8', '#7dffb0', '#e8f4ff'],

  sky: {
    top: '#0d1230',
    mid: '#2b2358',
    bottom: '#6b2f66',
    sunColor: '#ff92b8',
    sunIntensity: 1.3,
    sunGlow: 0.28,
    sunElevation: 8,
    sunAzimuth: 84,
    ambientSky: '#3d4a86',
    ambientGround: '#241f38',
    ambientIntensity: 0.72,
    fog: '#1c2440',
    fogDensity: 0.0092,
    exposure: 1.02,
    stars: 0.75,
    clouds: { count: 14, color: '#4a3a6b', opacity: 0.5, height: 105, speed: 0.2 },
    contrails: 0,
    aircraft: 'airtaxi',
    aurora: 0.4
  },
  night: {
    top: '#05071a',
    mid: '#120f30',
    bottom: '#2e1440',
    sunColor: '#8f7fd0',
    sunIntensity: 0.16,
    sunGlow: 0.15,
    sunElevation: 14,
    sunAzimuth: 72,
    ambientSky: '#232a52',
    ambientGround: '#150f24',
    ambientIntensity: 0.34,
    fog: '#0c1024',
    fogDensity: 0.012,
    exposure: 1.14,
    stars: 1,
    clouds: { count: 10, color: '#251f44', opacity: 0.45, height: 105, speed: 0.18 },
    aurora: 0.7
  },
  grade: {
    saturation: 1.2,
    contrast: 1.12,
    tint: '#78d4ff',
    tintAmount: 0.2,
    grain: 0.18,
    vignette: 0.44,
    chroma: 0.4,
    scanlines: 0.05,
    halation: 0.45,
    bloom: { strength: 0.66, radius: 0.8, threshold: 0.82 }
  },
  weather: { type: 'mist', intensity: 0.55, wetness: 0.35, motes: { count: 520, color: '#8fe8ff', size: 0.06, drift: 0.6 } },

  street: {
    asphalt: '#22262e',
    asphaltGrime: 0.2,
    sidewalk: '#3a4048',
    sidewalkGrime: 0.18,
    kerb: '#2f353d',
    markings: 'lightstrip',
    markingColor: '#63f5ff',
    crosswalk: 'projected',
    bikeLane: '#1f4a5c',
    tracks: false,
    cobblePatch: false,
    manholes: false,
    hydrantColor: '#4a5f6b',
    trees: { count: 12, kind: 'canopy', leaf: '#3d8a5f', autumn: 0 },
    lightStrips: true
  },

  lots: {
    bank: {
      h: 15,
      floors: 4,
      wall: { type: 'stone', color: '#b8b4a8', grime: 0.2 },
      base: { color: '#101828', refaced: 'holo' },
      cornice: { style: 'classical', color: '#a8a494', h: 1.1 },
      columns: 4,
      windows: { style: 'arched', cols: 5, litChance: 0.5, frame: '#4a5462', glass: '#1e3a4a', smart: true },
      roof: ['cornice', 'holo_ring', 'drone_pad', 'solar'],
      tenant: {
        name: 'AXIOM CREDIT',
        sub: 'AUTONOMOUS BRANCH · NODE 04',
        style: 'holo',
        bg: '#0a1220',
        ink: '#63f5ff',
        accent: '#ff5dc8',
        font: 'grotesk',
        kind: 'bank',
        window: 'smart',
        interior: { base: '#16202e', warm: '#7fe8ff' },
        props: ['holobollard', 'dronepad', 'chargepad']
      }
    },
    theater: {
      h: 16.5,
      floors: 3,
      wall: { type: 'plaster', color: '#8a7f8f', grime: 0.22 },
      base: { color: '#1a1030' },
      cornice: { style: 'classical', color: '#9a8a9a', h: 1.4 },
      windows: { style: 'arched', cols: 3, litChance: 0.4, frame: '#4a4452', glass: '#241e3a', smart: true },
      roof: ['cornice', 'holo_ring', 'antenna_laser'],
      tenant: {
        name: 'KESSLER',
        sub: 'IMMERSION HOUSE · VOLUMETRIC',
        style: 'holo',
        bg: '#140c26',
        ink: '#ff5dc8',
        accent: '#63f5ff',
        font: 'grotesk',
        kind: 'cinema',
        window: 'smart',
        marquee: { line1: 'NEURODRAMA · 4 SEATS LEFT', line2: 'THE LOST WEEKEND', bg: '#0c0a18', ink: '#ffffff', accent: '#ff5dc8', bulbs: false, holo: true },
        blade: { text: 'KESSLER', bg: '#1a0f2e', ink: '#ff5dc8', style: 'neon' },
        interior: { base: '#1a1228', warm: '#c07fff' },
        props: ['holobollard', 'projector']
      }
    },
    diner: {
      h: 6.8,
      floors: 1,
      wall: { type: 'brick', color: '#7d5546', grime: 0.24 },
      base: { color: '#0f2a2e' },
      cornice: { style: 'slab', color: '#0f2a2e', h: 0.6 },
      windows: { style: 'none' },
      roof: ['planter_roof', 'holo_ring', 'mister'],
      tenant: {
        name: "MEL'S",
        sub: 'NEURO-CAFÉ · MOOD-TUNED BREW',
        style: 'holo',
        bg: '#0c1a1c',
        ink: '#7dffb0',
        accent: '#63f5ff',
        font: 'grotesk',
        kind: 'cafe',
        window: 'smart',
        interior: { base: '#16221f', warm: '#8fffcf' },
        props: ['parklet', 'patiotables', 'holomenu', 'planter', 'mister']
      }
    },
    market: {
      h: 7.6,
      floors: 2,
      wall: { type: 'brick', color: '#6f4f42', grime: 0.24 },
      base: { color: '#1a1030' },
      cornice: { style: 'dentil', color: '#7a6a58', h: 0.7 },
      windows: { style: 'sash', cols: 3, litChance: 0.44, frame: '#4a4452', glass: '#22303c', smart: true },
      roof: ['cornice', 'holo_ring', 'solar'],
      tenant: {
        name: 'FABRICATORY',
        sub: 'PRINT ANYTHING · 9 MINUTES',
        style: 'holo',
        bg: '#140c26',
        ink: '#ff5dc8',
        accent: '#7dffb0',
        font: 'grotesk',
        kind: 'fab',
        window: 'smart',
        interior: { base: '#1c1828', warm: '#ff9fe0' },
        props: ['printer', 'holobollard', 'dronepad']
      }
    },
    tower: {
      h: 25,
      floors: 7,
      wall: { type: 'brick', color: '#7d5240', grime: 0.22 },
      base: { color: '#0f2a2e', refaced: 'holo' },
      cornice: { style: 'classical', color: '#8a765c', h: 1.2 },
      windows: { style: 'sash', cols: 5, litChance: 0.55, frame: '#4a5044', glass: '#1e3a32', farm: true },
      roof: ['cornice', 'watertank', 'garden', 'turbine', 'skybridge', 'drone_pad', 'holo_ring'],
      greenWall: true,
      farmTerraces: true,
      tenant: {
        name: 'KESSLER FARM',
        sub: 'VERTICAL · 11 FLOORS GROWING',
        style: 'holo',
        bg: '#0c1a14',
        ink: '#7dffb0',
        accent: '#63f5ff',
        font: 'grotesk',
        kind: 'farm',
        window: 'smart',
        interior: { base: '#16241c', warm: '#9fffc8' },
        props: ['planter', 'mister', 'holobollard']
      }
    },
    music: {
      h: 8.2,
      floors: 2,
      wall: { type: 'brick', color: '#6f5346', grime: 0.26 },
      base: { color: '#2a0f30' },
      cornice: { style: 'simple', color: '#7a6a58', h: 0.6 },
      windows: { style: 'sash', cols: 3, litChance: 0.4, frame: '#4a4452', glass: '#221e34', smart: true },
      roof: ['cornice', 'holo_ring'],
      tenant: {
        name: 'AVATAR ATELIER',
        sub: 'IDENTITY DESIGN · WALK-IN',
        style: 'holo',
        bg: '#1a0c26',
        ink: '#c07fff',
        accent: '#ff5dc8',
        font: 'grotesk',
        kind: 'avatar',
        window: 'smart',
        interior: { base: '#1e1630', warm: '#d0a0ff' },
        props: ['holobollard', 'scanbooth']
      }
    },
    service: {
      h: 6,
      floors: 1,
      kind: 'station',
      wall: { type: 'panel', color: '#39424f', grime: 0.2 },
      base: { color: '#0f3c46' },
      cornice: { style: 'slab', color: '#0f3c46', h: 0.5 },
      windows: { style: 'none' },
      roof: ['vertipad', 'sign_pylon'],
      tenant: {
        name: 'SKYPORT 04',
        sub: 'DRONE FREIGHT · POD CHARGE',
        style: 'holo',
        bg: '#08222a',
        ink: '#63f5ff',
        accent: '#7dffb0',
        font: 'grotesk',
        kind: 'skyport',
        window: 'smart',
        interior: { base: '#182a30', warm: '#8ff0ff' },
        props: ['chargepad', 'dronepad', 'holobollard', 'mister']
      }
    },

    hotel: {
      h: 19,
      floors: 6,
      wall: { type: 'brick', color: '#6f4b3e', grime: 0.24 },
      base: { color: '#181428' },
      cornice: { style: 'classical', color: '#82705a', h: 1 },
      windows: { style: 'sash', cols: 5, litChance: 0.5, frame: '#4a4452', glass: '#22303c', smart: true },
      roof: ['cornice', 'garden', 'holo_ring', 'drone_pad'],
      greenWall: true,
      tenant: {
        name: 'ARDMORE',
        sub: 'CAPSULE STAY · HOURLY',
        style: 'holo',
        bg: '#141024',
        ink: '#ff5dc8',
        accent: '#63f5ff',
        font: 'grotesk',
        kind: 'hotel',
        window: 'smart',
        blade: { text: 'ARDMORE', bg: '#1a1030', ink: '#ff5dc8', style: 'neon' },
        interior: { base: '#1c1824', warm: '#e0a0ff' }
      }
    },
    laundry: {
      h: 6.8,
      floors: 2,
      wall: { type: 'brick', color: '#7a5a4a', grime: 0.24 },
      base: { color: '#123040' },
      cornice: { style: 'slab', color: '#8a8272', h: 0.5 },
      windows: { style: 'strip', cols: 3, litChance: 0.46, frame: '#4a5058', glass: '#22303c', smart: true },
      roof: ['vent', 'mister', 'solar'],
      tenant: {
        name: 'MOLECULAR',
        sub: 'CLEANSE · 90 SECONDS',
        style: 'holo',
        bg: '#0a1e2a',
        ink: '#63f5ff',
        accent: '#7dffb0',
        font: 'grotesk',
        kind: 'laundry',
        window: 'smart',
        interior: { base: '#1a262c', warm: '#a0f0ff' }
      }
    },
    bar: {
      h: 7.2,
      floors: 2,
      wall: { type: 'brick', color: '#66463a', grime: 0.26 },
      base: { color: '#1c1030' },
      cornice: { style: 'simple', color: '#74624e', h: 0.5 },
      windows: { style: 'sash', cols: 3, litChance: 0.5, frame: '#4a4452', glass: '#241e34', smart: true },
      roof: ['vent', 'holo_ring', 'planter_roof'],
      tenant: {
        name: 'BLUE NOTE',
        sub: 'SYNTH BAR · LIVE GENERATIVE',
        style: 'holo',
        bg: '#0e1030',
        ink: '#5d9dff',
        accent: '#ff5dc8',
        font: 'grotesk',
        kind: 'bar',
        window: 'smart',
        neon: { text: 'LIVE', color: '#ff5dc8' },
        interior: { base: '#161428', warm: '#8f7fff' },
        props: ['parklet', 'holomenu', 'stringlights']
      }
    },
    vacant: {
      kind: 'park',
      h: 0.6,
      yard: 'garden2055',
      wall: { type: 'brick', color: '#6f5040', grime: 0.24 },
      wallArt: { type: 'holo', y: 0.45, h: 8 },
      tenant: {
        name: 'KESSLER GREEN',
        sub: 'CARBON SINK · PUBLIC',
        style: 'holo',
        bg: '#0c2418',
        ink: '#7dffb0',
        accent: '#63f5ff',
        font: 'grotesk',
        kind: 'park'
      }
    },
    pharmacy: {
      h: 7.8,
      floors: 2,
      wall: { type: 'brick', color: '#7a5a48', grime: 0.24 },
      base: { color: '#0e2e36' },
      cornice: { style: 'slab', color: '#8a8272', h: 0.65 },
      windows: { style: 'strip', cols: 3, litChance: 0.42, frame: '#4a5058', glass: '#22303c', smart: true },
      roof: ['cornice', 'holo_ring', 'solar'],
      tenant: {
        name: 'GENE CLINIC',
        sub: 'WALK-IN THERAPY · 20 MIN',
        style: 'holo',
        bg: '#0a2430',
        ink: '#7dffb0',
        accent: '#63f5ff',
        font: 'grotesk',
        kind: 'pharmacy',
        window: 'smart',
        interior: { base: '#1a2a2e', warm: '#b0ffe0' }
      }
    },
    garage: {
      h: 13,
      floors: 4,
      kind: 'parking',
      wall: { type: 'metal', color: '#4a5058', grime: 0.22 },
      base: { color: '#2b323a' },
      cornice: { style: 'slab', color: '#5a6068', h: 0.4 },
      windows: { style: 'openramp', cols: 6, litChance: 0.5, frame: '#3a4048', glass: '#141a20' },
      roof: ['vertipad', 'lightpole', 'holo_ring'],
      greenWall: true,
      tenant: {
        name: 'VERTIPARK',
        sub: 'AUTOMATED STACK · 400 PODS',
        style: 'holo',
        bg: '#0d1a28',
        ink: '#63f5ff',
        accent: '#ff5dc8',
        font: 'grotesk',
        kind: 'parking',
        window: 'smart',
        interior: { base: '#1c222a', warm: '#8fd0ff' },
        props: ['chargepad', 'dronepad']
      }
    }
  },

  billboards: [
    { at: 'roof-garage', headline: 'BE SOMEONE ELSE', sub: 'AVATAR LEASE · 30 DAY TRIAL', brand: 'ATELIER', scheme: ['#ff5dc8', '#0c0a18', '#63f5ff'], style: 'holo' },
    { at: 'wall-hotel', headline: 'ORBIT IN 40 MIN', sub: 'DEPARTURES HOURLY · KESSLER PAD', brand: 'LOW ORBIT TRANSIT', scheme: ['#63f5ff', '#060a18', '#7dffb0'], style: 'holo' },
    { at: 'roof-market', headline: 'GROWN HERE', sub: '11 FLOORS · ZERO FREIGHT', brand: 'KESSLER FARM', scheme: ['#7dffb0', '#08160f', '#63f5ff'], style: 'holo' }
  ],

  vehicles: {
    density: 0.55,
    speed: 11,
    types: [
      { kind: 'pod', weight: 4, colors: ['#e8f4ff', '#1c2434', '#63f5ff', '#ff5dc8', '#7dffb0'] },
      { kind: 'shuttle55', weight: 1.2, colors: ['#d8e8f4', '#2b3444'] },
      { kind: 'freightpod', weight: 1, colors: ['#3a4452', '#7dffb0'] },
      { kind: 'hoverbike', weight: 1.2, colors: ['#ff5dc8', '#63f5ff'] },
      { kind: 'sidewalkbot', weight: 1.4, colors: ['#e8f4ff', '#63f5ff'] }
    ],
    parked: ['pod', 'freightpod'],
    horn: 'chime',
    hover: true,
    airTraffic: { drones: 16, taxis: 4, maglev: true }
  },

  pedestrians: {
    count: 30,
    speed: 1.12,
    skin: ['#eac9a8', '#d2a07c', '#a8784f', '#6f4d35', '#f2d6ba', '#8a5f42', '#c8d4e0'],
    outfits: [
      { top: '#141c2a', bottom: '#1c2434', hat: 'visor', hatColor: '#63f5ff', kind: 'techwear', coat: 0.55, weight: 3, glow: '#63f5ff' },
      { top: '#2a1030', bottom: '#1a1024', hat: 'none', hatColor: '#000', kind: 'techwear', coat: 0.4, weight: 2.4, glow: '#ff5dc8' },
      { top: '#e8f4ff', bottom: '#3a4452', hat: 'none', hatColor: '#000', kind: 'clean', coat: 0.25, weight: 2, glow: '#7dffb0' },
      { top: '#1f3a34', bottom: '#26313a', hat: 'hood', hatColor: '#1f3a34', kind: 'courier', coat: 0.4, weight: 1.8, glow: '#7dffb0' },
      { top: '#3a4452', bottom: '#3a4452', hat: 'none', hatColor: '#000', kind: 'robot', coat: 0, weight: 1.4, glow: '#63f5ff' },
      { top: '#5d3f8a', bottom: '#241c34', hat: 'visor', hatColor: '#ff5dc8', kind: 'exosuit', coat: 0.3, weight: 1.2, glow: '#ff5dc8' },
      { top: '#63f5ff', bottom: '#1c2434', hat: 'none', hatColor: '#000', kind: 'child', coat: 0.2, weight: 0.8, glow: '#63f5ff' }
    ],
    accessories: ['holopad', 'drone-pet', 'deliverybag', 'umbrella-light', 'dog']
  },

  props: {
    lamps: { kind: 'floating', color: '#2b3240', glow: '#9fe8ff', spacing: 13, height: 6.6 },
    poles: { kind: 'maglev', wires: 0, spacing: 36, color: '#39424f' },
    signals: { kind: 'holo', color: '#63f5ff' },
    kit: ['holobollard', 'lightstrip', 'planter_big', 'bench_glow', 'trashcan_sorter', 'busshelter_holo', 'chargepad', 'mister', 'dronepad', 'raingarden', 'vertifarm_pod', 'sensorpole'],
    litter: 0.05,
    awningWear: 0.1,
    treeGuards: false
  },

  audio: {
    ambienceLevel: 0.42,
    trafficTone: { cutoff: 340, level: 0.22 },
    music: 'ambient',
    emitters: ['maglev', 'mister', 'holo-hum'],
    events: [
      { kind: 'maglevPass', every: 19, jitter: 6 },
      { kind: 'droneSwarm', every: 13, jitter: 7 },
      { kind: 'chime', every: 21, jitter: 11 },
      { kind: 'aiVoice', every: 33, jitter: 15 },
      { kind: 'chatter', every: 12, jitter: 7 }
    ]
  }
};

/* ------------------------------------------------------------------ */

export const ERAS = [ERA_1945, ERA_1965, ERA_1985, ERA_2005, ERA_2025, ERA_2055];

export const ERA_BY_YEAR = Object.fromEntries(ERAS.map((e) => [e.year, e]));

export function eraIndex(year) {
  return YEARS.indexOf(year);
}

/** Short label under each tick on the timeline. */
export const ERA_TICK_LABELS = {
  1945: 'post-war',
  1965: 'space age',
  1985: 'hard years',
  2005: 'broadband',
  2025: 'retrofit',
  2055: 'canopy'
};
