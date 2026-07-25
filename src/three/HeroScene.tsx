import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { BackdropGlow, StudioEnvironment, Table } from './Studio'
import { Watch } from './Watch'
import { MODELS, specFor } from './watchSpecs'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

const FOCUS = new THREE.Vector3(0, 0.5, 0)

/**
 * Slow orbit with a breathing dolly and drifting elevation — the move a
 * turntable render would make, rather than a constant spin.
 */
function CameraRig({ still }: { still: boolean }) {
  const { camera, pointer } = useThree()
  const look = useRef(new THREE.Vector3(0, 0.55, 0))
  const drift = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const t = still ? 7.4 : state.clock.elapsedTime
    const spin = t * 0.05

    drift.current.x += (pointer.x - drift.current.x) * Math.min(1, delta * 1.6)
    drift.current.y += (pointer.y - drift.current.y) * Math.min(1, delta * 1.6)

    const azimuth = spin * Math.PI * 2 + drift.current.x * 0.14 + 0.55
    const elevation =
      0.44 + 0.26 * Math.sin(spin * Math.PI * 2 * 0.41) + drift.current.y * 0.06
    const radius = 19.5 + 2.1 * Math.sin(spin * Math.PI * 2 * 0.27 + 1.1)

    camera.position.set(
      Math.sin(azimuth) * Math.cos(elevation) * radius,
      Math.max(1.4, Math.sin(elevation) * radius),
      Math.cos(azimuth) * Math.cos(elevation) * radius,
    )
    look.current.set(0, 2.3 + Math.sin(spin * Math.PI * 2 * 0.6) * 0.16, 0)
    camera.lookAt(look.current)
  })

  return null
}

function HeroContents({ still }: { still: boolean }) {
  const spec = useMemo(() => specFor(MODELS[0], 0), [])
  const light = useRef<THREE.SpotLight>(null)

  useEffect(() => {
    if (light.current) light.current.target.position.set(0, 0, 0)
  }, [])

  return (
    <>
      <color attach="background" args={['#07080a']} />
      <fog attach="fog" args={['#07080a', 26, 78]} />

      <StudioEnvironment />
      <BackdropGlow />

      <spotLight
        ref={light}
        position={[6, 16, 7]}
        angle={0.4}
        penumbra={1}
        decay={0}
        intensity={1.5}
        color="#fff2e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.012}
        shadow-camera-near={4}
        shadow-camera-far={40}
      />
      <directionalLight position={[-9, 6, -6]} intensity={0.22} color="#b9d0ff" />

      <Table />
      <ContactShadows
        position={[0, 0.004, 0]}
        scale={26}
        resolution={1024}
        blur={2.4}
        far={3}
        opacity={0.62}
        color="#000000"
      />

      <group rotation-y={-0.28}>
        <Watch spec={spec} />
      </group>

      <CameraRig still={still} />
    </>
  )
}

export function HeroScene({ onReady }: { onReady?: () => void }) {
  const reduced = usePrefersReducedMotion()
  const [dpr, setDpr] = useState(1.5)

  return (
    <Canvas
      flat
      shadows
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 24, near: 0.5, far: 200, position: [8, 8, 14] }}
      onCreated={({ gl }) => {
        gl.transmissionResolutionScale = 1
        setDpr(Math.min(window.devicePixelRatio, 1.75))
        onReady?.()
      }}
    >
      <HeroContents still={reduced} />
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <DepthOfField
          target={FOCUS}
          worldFocusRange={5.5}
          bokehScale={2.1}
          height={720}
        />
        <Bloom
          intensity={0.34}
          luminanceThreshold={0.95}
          luminanceSmoothing={0.22}
          mipmapBlur
          radius={0.6}
        />
        <Vignette offset={0.24} darkness={0.7} />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.13} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
