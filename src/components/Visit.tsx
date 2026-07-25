import { useState } from 'react'
import { Arrow, Reveal } from './primitives'

export function Visit() {
  const [sent, setSent] = useState(false)

  return (
    <section className="section visit" id="visit">
      <div className="shell visit__grid">
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <Reveal>
            <p className="eyebrow">04 — Enquiries</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display visit__title">
              Come and <em>handle</em> one.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="body" style={{ maxWidth: '46ch' }}>
              The atelier is open by appointment on Thursdays and Fridays. Rue du Rhône 62,
              third floor, ring twice. We will have the loupe out and the kettle on.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <div className="form__field">
              <label htmlFor="visit-name">Name</label>
              <input id="visit-name" name="name" placeholder="Your name" required />
            </div>
            <div className="form__field">
              <label htmlFor="visit-email">Email</label>
              <input
                id="visit-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form__field">
              <label htmlFor="visit-piece">Piece of interest</label>
              <input id="visit-piece" name="piece" placeholder="Solstice 39 · Marine Azure" />
            </div>
            <button className="btn" type="submit" style={{ justifySelf: 'start', marginTop: '0.75rem' }}>
              {sent ? 'Request received' : 'Request an appointment'} <Arrow />
            </button>
            <p className="form__note">
              A demonstration form — nothing is transmitted anywhere. Waiting time for the
              Meridian 41 is presently around nine months.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  )
}
