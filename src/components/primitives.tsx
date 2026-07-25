import type { ReactNode } from 'react'
import { useInView } from '../hooks/useInView'

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`.trim()}
      style={{ '--delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12.6" stroke="currentColor" strokeWidth="0.55" opacity="0.32" />
      <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="0.9" opacity="0.85" />
      <path
        d="M16 9.8V16l4 2.5"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="0.9" fill="currentColor" />
      <rect x="26.1" y="14.7" width="2.4" height="2.6" rx="0.7" fill="currentColor" opacity="0.75" />
      <path
        d="M11.6 3.9h8.8l-1 2.6M11.6 28.1h8.8l-1-2.6"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.35"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Arrow() {
  return (
    <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
      <path
        d="M0 4h12M9 1l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
