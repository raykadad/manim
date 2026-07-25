import { useEffect, useRef } from 'react'

type Props = {
  source: () => HTMLCanvasElement
  /** 0-1 crop box, in source-canvas space */
  crop?: [number, number, number, number]
  name: string
  desc: string
}

/**
 * Paints one of the generated material canvases straight into the page, so
 * the textures on the watches can be inspected as flat swatches.
 */
export function MaterialSwatch({ source, crop = [0, 0, 1, 1], name, desc }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const target = ref.current
    if (!target) return
    let cancelled = false
    // baking is synchronous and heavy — let the section paint first
    const id = window.setTimeout(() => {
      if (cancelled) return
      const src = source()
      const box = target.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio, 2)
      target.width = Math.round(box.width * dpr)
      target.height = Math.round(box.height * dpr)
      const ctx = target.getContext('2d')
      if (!ctx) return
      ctx.drawImage(
        src,
        crop[0] * src.width,
        crop[1] * src.height,
        crop[2] * src.width,
        crop[3] * src.height,
        0,
        0,
        target.width,
        target.height,
      )
    }, 40)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <figure className="material">
      <div className="material__frame">
        <canvas ref={ref} />
      </div>
      <figcaption>
        <div className="material__name">{name}</div>
        <p className="material__desc">{desc}</p>
      </figcaption>
    </figure>
  )
}
