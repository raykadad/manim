import { useEffect, useRef, useState } from 'react'

/**
 * Two-stage visibility: `mount` latches shortly before the element scrolls
 * into view (so a canvas can warm up), `active` tracks whether it is on
 * screen right now (so its render loop can idle).
 */
export function useVisibility<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [mount, setMount] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMount(true)
          near.disconnect()
        }
      },
      { rootMargin: '600px 0px' },
    )
    const onScreen = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      threshold: 0.1,
    })
    near.observe(el)
    onScreen.observe(el)
    return () => {
      near.disconnect()
      onScreen.disconnect()
    }
  }, [])

  return { ref, mount, active }
}
