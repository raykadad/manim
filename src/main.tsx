import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/cormorant-garamond'
import '@fontsource-variable/inter'
import './styles/global.css'
import App from './App'

const root = createRoot(document.getElementById('root')!)

/**
 * Dial printing is drawn to a canvas with the site's own typefaces, so the
 * fonts have to be resident before anything is baked.
 */
async function start() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('600 64px "Cormorant Garamond Variable"'),
        document.fonts.load('500 24px "Inter Variable"'),
      ]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ])
  } catch {
    /* fall back to system faces */
  }
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
