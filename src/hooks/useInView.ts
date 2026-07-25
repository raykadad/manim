import { useEffect, useRef, useState } from 'react'

export function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit = { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
  once = true,
) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        if (once) io.disconnect()
      } else if (!once) {
        setInView(false)
      }
    }, options)
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [once])

  return { ref, inView }
}
