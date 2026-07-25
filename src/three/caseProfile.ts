import type { Vector2 } from 'three'
import { fillet, V2 } from './profile'

/**
 * The lathe profiles that define a case, in the (radius, height) plane with
 * the caseback resting on y = 0. Shared by the 3D build and the technical
 * drawing on the page, so the two can never disagree.
 */

export const caseHeightFor = (R: number) => R * 0.538

export function caseProfile(R: number, H: number): Vector2[] {
  return fillet(
    [
      V2(0, 0.115 * H),
      V2(0.44 * R, 0.1 * H),
      V2(0.84 * R, 0.008 * H),
      V2(0.935 * R, 0.075 * H),
      V2(0.995 * R, 0.26 * H),
      V2(1.0 * R, 0.45 * H),
      V2(0.972 * R, 0.6 * H),
      V2(0.988 * R, 0.648 * H),
      V2(0.79 * R, 0.648 * H),
      V2(0.775 * R, 0.45 * H),
      V2(0.75 * R, 0.42 * H),
      V2(0, 0.42 * H),
    ],
    [
      0,
      0.34 * R,
      0.05 * R,
      0.035 * R,
      0.09 * R,
      0.14 * R,
      0.02 * R,
      0.012 * R,
      0.02 * R,
      0.03 * R,
      0.03 * R,
      0,
    ],
    6,
  )
}

export function bezelProfile(R: number, H: number): Vector2[] {
  return fillet(
    [
      V2(0.9 * R, 0.638 * H),
      V2(0.985 * R, 0.648 * H),
      V2(1.003 * R, 0.7 * H),
      V2(0.995 * R, 0.778 * H),
      V2(0.962 * R, 0.834 * H),
      V2(0.862 * R, 0.874 * H),
      V2(0.8 * R, 0.864 * H),
      V2(0.792 * R, 0.66 * H),
      V2(0.9 * R, 0.638 * H),
    ],
    [0, 0.02 * R, 0.024 * R, 0.02 * R, 0.022 * R, 0.018 * R, 0.012 * R, 0.02 * R, 0],
    6,
  )
}

export function crystalProfile(R: number, H: number): Vector2[] {
  return fillet(
    [
      V2(0, 0.655 * H),
      V2(0.755 * R, 0.655 * H),
      V2(0.788 * R, 0.7 * H),
      V2(0.788 * R, 0.812 * H),
      V2(0.764 * R, 0.858 * H),
      V2(0.58 * R, 0.912 * H),
      V2(0.32 * R, 0.936 * H),
      V2(0, 0.941 * H),
    ],
    [0, 0.018 * R, 0.012 * R, 0.03 * R, 0.07 * R, 0.36 * R, 0.62 * R, 0],
    7,
  )
}

export const DIAL_Y = (H: number) => 0.44 * H
export const DIAL_RADIUS = (R: number) => 0.762 * R
