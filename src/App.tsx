import { useEffect, useState } from 'react'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Ticker } from './components/Ticker'
import { About } from './components/About'
import { Collection } from './components/Collection'
import { Visit } from './components/Visit'
import { Footer } from './components/Footer'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // never trap the visitor behind the loader
    const bail = window.setTimeout(() => setReady(true), 9000)
    return () => window.clearTimeout(bail)
  }, [])

  useEffect(() => {
    document.documentElement.style.overflow = ready ? '' : 'hidden'
  }, [ready])

  return (
    <>
      <div className={`intro ${ready ? 'is-done' : ''}`} aria-hidden={ready}>
        <div className="intro__inner">
          <div className="intro__mark">SLAPPIS</div>
          <div className="intro__bar">
            <span />
          </div>
          <div className="intro__note">Turning the case</div>
        </div>
      </div>

      <Nav />
      <main>
        <Hero onReady={() => setReady(true)} />
        <Ticker />
        <About />
        <Collection />
        <Visit />
      </main>
      <Footer />
    </>
  )
}
