import { useEffect, useState } from 'react'
import { Mark } from './primitives'

const LINKS = [
  { href: '#house', label: 'The House' },
  { href: '#collection', label: 'Collection' },
  { href: '#solstice', label: 'Solstice 39' },
  { href: '#meridian', label: 'Meridian 41' },
]

export function Nav() {
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav ${stuck ? 'is-stuck' : ''}`}>
      <div className="shell nav__inner">
        <a className="nav__brand" href="#top" aria-label="Slappis Watch Co.">
          <Mark />
          <span className="nav__word">SLAPPIS</span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className="btn btn--ghost nav__cta" href="#visit">
          Book a viewing
        </a>
      </div>
    </header>
  )
}
