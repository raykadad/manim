import { Suspense, lazy, useMemo, useState } from 'react'
import { MODELS, specFor, type WatchModel } from '../three/watchSpecs'
import { useVisibility } from '../hooks/useVisibility'
import { Arrow, Reveal } from './primitives'

const ProductScene = lazy(() =>
  import('../three/ProductScene').then((m) => ({ default: m.ProductScene })),
)

const GLOWS: Record<string, string> = {
  solstice: '#2c3b4c',
  meridian: '#453221',
}

function Piece({ model, flip }: { model: WatchModel; flip: boolean }) {
  const [colour, setColour] = useState(0)
  const { ref, mount, active } = useVisibility<HTMLDivElement>()
  const spec = useMemo(() => specFor(model, colour), [model, colour])
  const current = model.colourways[colour]

  return (
    <article className={`piece ${flip ? 'piece--flip' : ''}`} id={model.id}>
      <div className="piece__visual" ref={ref}>
        <span className="piece__index">{model.index}</span>
        <span className="piece__corner piece__corner--tl">{model.reference}</span>
        <span className="piece__corner piece__corner--br">{current.name}</span>
        {mount && (
          <Suspense fallback={null}>
            <ProductScene spec={spec} active={active} glow={GLOWS[model.id]} />
          </Suspense>
        )}
        <span className="piece__hint">Drag to turn</span>
      </div>

      <div className="piece__info">
        <Reveal>
          <p className="eyebrow">
            {model.family} — Reference {model.reference}
          </p>
        </Reveal>
        <Reveal delay={70}>
          <h3 className="piece__name">{model.name}</h3>
        </Reveal>
        <Reveal delay={120}>
          <p className="piece__tagline">{model.tagline}</p>
        </Reveal>
        <Reveal delay={170}>
          <p className="body piece__story">{model.story}</p>
        </Reveal>

        <Reveal delay={210}>
          <div className="swatches">
            <div className="swatch__label">Dial — {current.name}</div>
            <div className="swatches__row">
              {model.colourways.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  className={`swatch ${i === colour ? 'is-active' : ''}`}
                  style={{ '--sw': c.swatch } as React.CSSProperties}
                  onClick={() => setColour(i)}
                  aria-pressed={i === colour}
                  aria-label={c.name}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={250}>
          <div className="specs">
            {model.specs.map((s) => (
              <div className="specs__row" key={s.label}>
                <div className="specs__label">{s.label}</div>
                <div className="specs__value">{s.value}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={300}>
          <div className="piece__buy">
            <span className="piece__price">{model.price}</span>
            <a className="btn" href="#visit">
              Reserve this piece <Arrow />
            </a>
          </div>
        </Reveal>
      </div>
    </article>
  )
}

export function Collection() {
  return (
    <section className="section collection" id="collection">
      <div className="shell">
        <div className="section__head" style={{ marginBottom: 'clamp(2rem, 6vh, 4rem)' }}>
          <Reveal>
            <p className="eyebrow">03 — Summer 2026</p>
          </Reveal>
          <div className="about__copy">
            <Reveal delay={80}>
              <h2 className="display about__title">
                Two pieces. <em>That is the collection.</em>
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="body" style={{ maxWidth: '52ch' }}>
                One for the harbour and one for the evening after it. Both are turned,
                brushed and set here — turn them, change the dial, look closely at the
                chamfers.
              </p>
            </Reveal>
          </div>
        </div>

        {MODELS.map((model, i) => (
          <Piece key={model.id} model={model} flip={i % 2 === 1} />
        ))}
      </div>
    </section>
  )
}
