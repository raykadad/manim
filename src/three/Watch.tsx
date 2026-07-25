import { useEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { buildWatch } from './buildWatch'
import type { WatchSpec } from './watchSpecs'

type WatchProps = { spec: WatchSpec } & Omit<ThreeElements['group'], 'ref'>

export function Watch({ spec, ...props }: WatchProps) {
  const key = useMemo(() => JSON.stringify(spec), [spec])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const built = useMemo(() => buildWatch(spec), [key])

  useEffect(() => () => built.dispose(), [built])

  return (
    <group {...props}>
      <primitive object={built.group} />
    </group>
  )
}
