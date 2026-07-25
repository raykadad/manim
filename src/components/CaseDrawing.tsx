import { useMemo } from 'react'
import type * as THREE from 'three'
import {
  bezelProfile,
  caseHeightFor,
  caseProfile,
  crystalProfile,
  DIAL_RADIUS,
  DIAL_Y,
} from '../three/caseProfile'

/**
 * A sectional drawing of the case, plotted straight from the lathe profiles
 * the 3D model is turned from. Change the geometry and the blueprint follows.
 */
export function CaseDrawing({ diameter = 39 }: { diameter?: number }) {
  const R = diameter / 20
  const H = caseHeightFor(R)

  const paths = useMemo(() => {
    const toPath = (pts: THREE.Vector2[], mirror: boolean) => {
      const half = pts.map((p) => `${p.x.toFixed(4)},${(-p.y).toFixed(4)}`)
      const back = mirror
        ? [...pts].reverse().map((p) => `${(-p.x).toFixed(4)},${(-p.y).toFixed(4)}`)
        : []
      return `M${[...half, ...back].join('L')}Z`
    }
    const bezel = bezelProfile(R, H)
    return {
      body: toPath(caseProfile(R, H), true),
      crystal: toPath(crystalProfile(R, H), true),
      bezelRight: toPath(bezel, false),
      bezelLeft: `M${bezel
        .map((p) => `${(-p.x).toFixed(4)},${(-p.y).toFixed(4)}`)
        .join('L')}Z`,
    }
  }, [R, H])

  const pad = 0.55
  const top = -(H * 1.02) - 0.5
  const w = R * 2 + pad * 2
  const h = H * 1.02 + 0.5 + 0.62
  const dy = DIAL_Y(H)
  const dr = DIAL_RADIUS(R)

  return (
    <figure className="drawing">
      <svg
        viewBox={`${-R - pad} ${top} ${w} ${h}`}
        role="img"
        aria-label={`Sectional drawing of the ${diameter} mm case`}
      >
        <g className="drawing__thin">
          {/* centre line */}
          <line x1="0" y1={top + 0.1} x2="0" y2="0.34" strokeDasharray="0.22 0.07 0.04 0.07" />
          {/* bench line */}
          <line x1={-R - pad + 0.12} y1="0" x2={R + pad - 0.12} y2="0" strokeDasharray="0.05 0.05" />
        </g>

        <path className="drawing__part" d={paths.body} />
        <path className="drawing__part" d={paths.bezelRight} />
        <path className="drawing__part" d={paths.bezelLeft} />
        <path className="drawing__glass" d={paths.crystal} />
        <line className="drawing__part" x1={-dr} y1={-dy} x2={dr} y2={-dy} />

        {/* diameter dimension */}
        <g className="drawing__dim">
          <line x1={-R} y1="0.4" x2={R} y2="0.4" />
          <path d={`M${-R + 0.11},0.35L${-R},0.4L${-R + 0.11},0.45`} />
          <path d={`M${R - 0.11},0.35L${R},0.4L${R - 0.11},0.45`} />
          <line x1={-R} y1="0.06" x2={-R} y2="0.46" />
          <line x1={R} y1="0.06" x2={R} y2="0.46" />
          <text x="0" y="0.36" textAnchor="middle">
            ⌀ {diameter.toFixed(1)}
          </text>
        </g>

        {/* height dimension */}
        <g className="drawing__dim">
          <line x1={R + 0.34} y1={-H * 0.941} x2={R + 0.34} y2="0" />
          <path d={`M${R + 0.29},${-H * 0.941 + 0.1}L${R + 0.34},${-H * 0.941}L${R + 0.39},${-H * 0.941 + 0.1}`} />
          <path d={`M${R + 0.29},${-0.1}L${R + 0.34},0L${R + 0.39},${-0.1}`} />
          <text
            x={R + 0.46}
            y={-H * 0.47}
            textAnchor="middle"
            transform={`rotate(-90 ${R + 0.46} ${-H * 0.47})`}
          >
            {(H * 10).toFixed(1)}
          </text>
        </g>

        <g className="drawing__note">
          <line
            className="drawing__lead"
            x1={-R * 0.35}
            y1={-H * 0.93}
            x2={-R * 0.86}
            y2={-H * 1.28}
          />
          <text x={-R * 0.88} y={-H * 1.33} textAnchor="end">
            SAPPHIRE
          </text>
          <line
            className="drawing__lead"
            x1={R * 0.93}
            y1={-H * 0.83}
            x2={R * 0.62}
            y2={-H * 1.28}
          />
          <text x={R * 0.6} y={-H * 1.33}>
            BEZEL
          </text>
        </g>
      </svg>
      <figcaption>Solstice 39 — section through the crown axis</figcaption>
      <dl className="drawing__block">
        {[
          ['Drawn', 'Atelier Slappis'],
          ['Scale', '2 : 1'],
          ['Reference', 'SLP·39.02'],
          ['Sheet', 'VI · MMXXVI'],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}
