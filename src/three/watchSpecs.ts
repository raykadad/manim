import type { DialSpec } from './textures'

export type MetalId = 'steel' | 'rosegold' | 'titanium'

export const METALS: Record<MetalId, { color: string; roughness: number; label: string }> = {
  steel: { color: '#d2d6da', roughness: 0.24, label: 'Polished & satin steel' },
  titanium: { color: '#b9bcbe', roughness: 0.33, label: 'Grade 5 titanium' },
  rosegold: { color: '#e7b189', roughness: 0.2, label: '18k 5N rose gold' },
}

export type BandSpec =
  | { kind: 'bracelet'; metal: MetalId }
  | { kind: 'leather'; color: string; stitch: string }

export type WatchSpec = {
  diameter: number
  metal: MetalId
  dial: DialSpec
  hands: 'dauphine' | 'baton'
  handMetal: MetalId | 'blued'
  secondsAccent: string
  band: BandSpec
  /** null on dress pieces, which carry no luminous material at all */
  lume: string | null
}

export type Colourway = {
  id: string
  name: string
  swatch: string
  dial: Pick<DialSpec, 'color' | 'print' | 'accent' | 'finish'>
  secondsAccent: string
  band?: BandSpec
}

export type WatchModel = {
  id: string
  index: string
  name: string
  family: string
  reference: string
  price: string
  tagline: string
  story: string
  diameter: number
  metal: MetalId
  hands: 'dauphine' | 'baton'
  handMetal: MetalId | 'blued'
  lume: string | null
  band: BandSpec
  dialBase: Pick<DialSpec, 'brand' | 'line1' | 'line2' | 'date' | 'dateAngle'>
  colourways: Colourway[]
  specs: { label: string; value: string }[]
  notes: string[]
}

export const MODELS: WatchModel[] = [
  {
    id: 'solstice',
    index: '01',
    name: 'Solstice 39',
    family: 'Summer 2026',
    reference: 'SLP·39.02',
    price: 'CHF 9,450',
    tagline: 'The long light of June, held in steel.',
    story:
      'Our integrated-bracelet piece, cut from a single billet of 316L and finished by hand across eleven separate surfaces. The sunburst dial is stamped, brushed on a rotating lathe and lacquered seven times — so the light travels across it rather than sitting on it.',
    diameter: 39,
    metal: 'steel',
    hands: 'dauphine',
    handMetal: 'steel',
    lume: '#cfe6df',
    band: { kind: 'bracelet', metal: 'steel' },
    dialBase: {
      brand: 'SLAPPIS',
      line1: 'SOLSTICE',
      line2: 'AUTOMATIC · CHRONOMÈTRE',
      date: '26',
      dateAngle: 90,
    },
    colourways: [
      {
        id: 'azure',
        name: 'Marine Azure',
        swatch: '#1b4a7e',
        dial: { color: '#153f6d', print: '#eef2f6', accent: '#cfd7de', finish: 'sunray' },
        secondsAccent: '#d98a3d',
      },
      {
        id: 'glacier',
        name: 'Glacier Silver',
        swatch: '#b8c2c9',
        dial: { color: '#9aa6ae', print: '#1d2429', accent: '#5d6b74', finish: 'sunray' },
        secondsAccent: '#1f3f6b',
      },
      {
        id: 'verdant',
        name: 'Verdant Coast',
        swatch: '#25553f',
        dial: { color: '#1d4a37', print: '#eef3ef', accent: '#c8d3cb', finish: 'sunray' },
        secondsAccent: '#d9b45a',
      },
    ],
    specs: [
      { label: 'Case', value: '39.0 mm × 10.4 mm, 316L steel' },
      { label: 'Movement', value: 'Calibre SW·26, self-winding' },
      { label: 'Reserve', value: '72 hours' },
      { label: 'Frequency', value: '28,800 vph' },
      { label: 'Crystal', value: 'Double-domed sapphire, AR both sides' },
      { label: 'Water resistance', value: '100 m' },
      { label: 'Bracelet', value: 'Integrated three-link, on-the-fly clasp' },
    ],
    notes: [
      'Hand-brushed flanks with polished chamfers',
      'Applied faceted indices, Super-LumiNova X1',
      'Rhodium-plated dauphine hands',
    ],
  },
  {
    id: 'meridian',
    index: '02',
    name: 'Meridian 41',
    family: 'Summer 2026',
    reference: 'SLP·41.07',
    price: 'CHF 27,800',
    tagline: 'A dress watch for the hour after sunset.',
    story:
      'Rose gold, guilloché and a movement you can see breathe. The central medallion is engraved on a 1920s rose-engine at eighty revolutions a minute; the flange is left plain so the engraving has somewhere quiet to end. Fitted to a cognac alligator strap, hand-stitched in a single unbroken thread.',
    diameter: 41,
    metal: 'rosegold',
    hands: 'baton',
    handMetal: 'blued',
    lume: null,
    band: { kind: 'leather', color: '#5a3220', stitch: '#c9a575' },
    dialBase: {
      brand: 'SLAPPIS',
      line1: 'MERIDIAN',
      line2: 'MICRO-ROTOR · GENÈVE',
    },
    colourways: [
      {
        id: 'ivory',
        name: 'Sahara Ivory',
        swatch: '#e3d9c3',
        dial: { color: '#ddd2b8', print: '#31291d', accent: '#9c7b45', finish: 'guilloche' },
        secondsAccent: '#2a3f7a',
      },
      {
        id: 'obsidian',
        name: 'Obsidian Lacquer',
        swatch: '#14161a',
        dial: { color: '#0f1114', print: '#e8e2d4', accent: '#c39a5f', finish: 'lacquer' },
        secondsAccent: '#c39a5f',
        band: { kind: 'leather', color: '#20191a', stitch: '#8d7a63' },
      },
      {
        id: 'champagne',
        name: 'Champagne Doré',
        swatch: '#cbae7c',
        dial: { color: '#c2a271', print: '#2c2415', accent: '#7d5f2c', finish: 'guilloche' },
        secondsAccent: '#43351d',
        band: { kind: 'leather', color: '#3d2a1c', stitch: '#c2a075' },
      },
    ],
    specs: [
      { label: 'Case', value: '41.0 mm × 9.2 mm, 18k 5N gold' },
      { label: 'Movement', value: 'Calibre SW·31, micro-rotor' },
      { label: 'Reserve', value: '80 hours' },
      { label: 'Frequency', value: '21,600 vph' },
      { label: 'Crystal', value: 'Box sapphire, exhibition caseback' },
      { label: 'Water resistance', value: '50 m' },
      { label: 'Strap', value: 'Cognac alligator, gold pin buckle' },
    ],
    notes: [
      'Rose-engine guilloché centre medallion',
      'Flame-blued baton hands, no luminous material',
      'Hand-bevelled bridges, black-polished caps',
    ],
  },
]

export function specFor(model: WatchModel, colourwayIndex: number): WatchSpec {
  const c = model.colourways[colourwayIndex % model.colourways.length]
  return {
    diameter: model.diameter,
    metal: model.metal,
    hands: model.hands,
    handMetal: model.handMetal,
    lume: model.lume,
    secondsAccent: c.secondsAccent,
    band: c.band ?? model.band,
    dial: { ...model.dialBase, ...c.dial },
  }
}
