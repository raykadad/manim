import { Suspense, lazy } from 'react'
import { Arrow } from './primitives'

const HeroScene = lazy(() =>
  import('../three/HeroScene').then((m) => ({ default: m.HeroScene })),
)

export function Hero({ onReady }: { onReady: () => void }) {
  return (
    <section className="hero" id="top">
      <div className="hero__stage">
        <Suspense fallback={null}>
          <HeroScene onReady={onReady} />
        </Suspense>
      </div>
      <div className="hero__scrim" />
      <div className="hero__grain" />

      <div className="hero__content shell">
        <div className="hero__top">
          <p className="eyebrow eyebrow--bare" style={{ letterSpacing: '0.42em' }}>
            Summer 2026 Collection
          </p>
          <h1 className="display hero__title">
            Time, rendered in <em>light</em>.
          </h1>
        </div>

        <div />

        <div className="hero__foot">
          <div className="hero__meta">
            <p className="hero__sub">
              Two references, machined in Genève and finished by hand. Everything you see
              here — case, sapphire, walnut — is drawn from mathematics, in real time.
            </p>
            <span>Est. MMXIX · Genève, Suisse</span>
          </div>
          <div className="hero__actions">
            <a className="btn" href="#collection">
              See the two pieces <Arrow />
            </a>
            <a className="btn btn--ghost" href="#house">
              The house
            </a>
          </div>
          <div className="hero__meta hero__meta--right">
            <span>46°12′N · 6°09′E</span>
            <span>Ref. SLP·39.02 — Solstice 39</span>
            <span>Marine Azure, steel</span>
          </div>
          <div className="hero__scroll">
            <i />
            <span>Scroll</span>
          </div>
        </div>
      </div>
    </section>
  )
}
