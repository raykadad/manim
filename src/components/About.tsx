import { MODELS } from '../three/watchSpecs'
import { CaseDrawing } from './CaseDrawing'
import { MaterialSwatch } from './MaterialSwatch'
import { Reveal } from './primitives'

const STATS = [
  { value: '2019', label: 'Founded, Genève' },
  { value: '214', label: 'Components per calibre' },
  { value: '11', label: 'Hand-finishing operations' },
  { value: '250', label: 'Watches a year' },
]

export function About() {
  const solstice = MODELS[0]
  const meridian = MODELS[1]

  return (
    <section className="section" id="house">
      <div className="shell">
        <div className="section__head">
          <div className="about__aside">
            <Reveal>
              <p className="eyebrow">01 — The house</p>
            </Reveal>
            <Reveal delay={240}>
              <CaseDrawing diameter={solstice.diameter} />
            </Reveal>
          </div>
          <div className="about__copy">
            <Reveal delay={80}>
              <h2 className="display about__title">
                We make two watches a year. <em>Slowly.</em>
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="lede">
                Slappis Watch Co. began in a first-floor workshop off the Rue du Rhône with
                one bench, one lathe and a stubborn idea: that a wristwatch should be
                finished to the standard of the surfaces nobody ever sees.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <p className="body">
                Every case is cut from solid bar, then passed between four hands — turning,
                satin-brushing, chamfering, and finally black-polishing the anglage under a
                loupe. A single Solstice case takes eleven separate finishing operations and
                rather more coffee. Dials are stamped in-house, brushed on a rotating lathe
                so the sunburst radiates from the true centre, and lacquered seven times
                before the printing is applied by hand.
              </p>
            </Reveal>
            <Reveal delay={280}>
              <p className="body">
                We do not make many. Two hundred and fifty pieces leave the atelier each
                year, each one regulated in six positions over a fortnight, each one signed
                on the caseback by the watchmaker who closed it.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="stats">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="stat">
              <div className="stat__value">{s.value}</div>
              <div className="stat__label">{s.label}</div>
            </Reveal>
          ))}
        </div>

        <div className="section__head" style={{ marginTop: 'clamp(4rem, 10vh, 8rem)' }}>
          <Reveal>
            <p className="eyebrow">02 — Materials</p>
          </Reveal>
          <Reveal delay={80}>
            <p className="lede" style={{ maxWidth: '46ch' }}>
              Walnut, alligator, brushed brass. Nothing on this page was photographed —
              every surface is generated in your browser from noise functions and drawn to
              a canvas at load.
            </p>
          </Reveal>
        </div>

        <div className="materials">
          <MaterialSwatch
            name="American black walnut"
            desc="Cathedral grain flowed around a distorted centre line, with pore speckle and ring darkening driving both the colour and the roughness of the table."
            source={async () =>
              (await import('../three/assets')).getWood().map.image as HTMLCanvasElement
            }
            crop={[0.08, 0.1, 0.5, 0.55]}
          />
          <MaterialSwatch
            name="Marine azure sunburst"
            desc="A fumé lacquer gradient, fifteen hundred radial spokes, and a printed minute track — the same canvas that feeds the dial's albedo, metalness and roughness."
            source={async () =>
              (await import('../three/assets')).getDial({
                ...solstice.dialBase,
                ...solstice.colourways[0].dial,
              }).map.image as HTMLCanvasElement
            }
            crop={[0.1, 0.1, 0.8, 0.8]}
          />
          <MaterialSwatch
            name="Cognac alligator"
            desc="Two-tone Worley cells raised into a height field, converted to a normal map, then saddle-stitched by hand along both edges of the strap."
            source={async () => {
              const band = meridian.band as Extract<typeof meridian.band, { kind: 'leather' }>
              const [{ getLeather }, { strapStitchRows }] = await Promise.all([
                import('../three/assets'),
                import('../three/profile'),
              ])
              return getLeather(band.color, band.stitch, strapStitchRows()).map
                .image as HTMLCanvasElement
            }}
            crop={[0.06, 0.02, 0.55, 0.96]}
          />
        </div>
      </div>
    </section>
  )
}
