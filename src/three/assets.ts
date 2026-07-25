import type * as THREE from 'three'
import {
  createBrushedMaps,
  createDialMaps,
  createGuillocheNormalMap,
  createLeatherMaps,
  createSunrayAnisotropyMap,
  createWoodMaps,
  type DialMaps,
  type DialSpec,
} from './textures'

/**
 * Every procedural map is expensive to bake, so they are generated once and
 * shared across scenes. Nothing here touches the network.
 */
function once<T>(factory: () => T) {
  let value: T | undefined
  return () => (value ??= factory())
}

export const getWood = once(createWoodMaps)
export const getCaseBrushed = once(() => createBrushedMaps(0.3, 0.1, 7))
export const getLinkBrushed = once(() => createBrushedMaps(0.34, 0.12, 21))
export const getSunrayAnisotropy = once(createSunrayAnisotropyMap)
export const getGuilloche = once(createGuillocheNormalMap)

const dials = new Map<string, DialMaps>()
export function getDial(spec: DialSpec) {
  const key = JSON.stringify(spec)
  let maps = dials.get(key)
  if (!maps) {
    maps = createDialMaps(spec)
    dials.set(key, maps)
  }
  return maps
}

type LeatherMaps = {
  map: THREE.Texture
  normalMap: THREE.Texture
  roughnessMap: THREE.Texture
}
const leathers = new Map<string, LeatherMaps>()
export function getLeather(color: string, stitch: string, rows: [number, number]) {
  const key = `${color}|${stitch}|${rows[0].toFixed(3)}|${rows[1].toFixed(3)}`
  let maps = leathers.get(key)
  if (!maps) {
    maps = createLeatherMaps(color, stitch, rows)
    leathers.set(key, maps)
  }
  return maps
}
