import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, MeshReflectorMaterial, OrbitControls } from '@react-three/drei'
import {
  Bloom,
  EffectComposer,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { BackdropGlow, StudioEnvironment } from './Studio'
import { Watch } from './Watch'
import type { WatchSpec } from './watchSpecs'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

/**
 * A slow sway rather than a full revolution — the dial stays legible while
 * the light still travels across the case.
 */
function Turntable({ spin, children }: { spin: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef(0)
  useFrame((_, delta) => {
    if (!ref.current) return
    if (spin) t.current += delta
    ref.current.rotation.y = 0.5 + Math.sin(t.current * 0.19) * 0.62
  })
  return <group ref={ref}>{children}</group>
}

type Props = {
  spec: WatchSpec
  active: boolean
  glow?: string
}

export function ProductScene({ spec, active, glow = '#2b3440' }: Props) {
  const reduced = usePrefersReducedMotion()
  const [ready, setReady] = useState(false)
  // frame every reference identically regardless of case size
  const k = spec.diameter / 39
  const eye: [number, number, number] = [3.5 * k, 8.1 * k, 6.5 * k]

  return (
    <Canvas
      flat
      shadows="soft"
      frameloop={active ? 'always' : 'demand'}
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 24, near: 0.5, far: 120, position: eye }}
      onCreated={({ gl }) => {
        gl.transmissionResolutionScale = 1
        setReady(true)
      }}
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms ease' }}
    >
      <color attach="background" args={['#0a0b0d']} />
      <fog attach="fog" args={['#0a0b0d', 16, 42]} />

      <StudioEnvironment intensity={1.05} />

      <BackdropGlow position={[0, 4.5, -15]} scale={38} inner={glow} />

      <spotLight
        position={[5, 13, 6]}
        angle={0.5}
        penumbra={1}
        decay={0}
        intensity={2.1}
        color="#fff3e6"
        castShadow
        shadow-mapSize={[1536, 1536]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.012}
      />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <MeshReflectorMaterial
          resolution={512}
          mixBlur={1.4}
          mixStrength={2.2}
          blur={[420, 120]}
          depthScale={1.2}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.4}
          color="#0e1013"
          metalness={0.5}
          roughness={0.62}
          envMapIntensity={0.35}
        />
      </mesh>

      <ContactShadows
        position={[0, 0.004, 0]}
        scale={18}
        resolution={1024}
        blur={2.2}
        far={2.6}
        opacity={0.7}
      />

      <Turntable spin={active && !reduced}>
        <Watch spec={spec} />
      </Turntable>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        target={[0, 0.45, 0]}
        minPolarAngle={0.5}
        maxPolarAngle={1.15}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.5}
      />

      <KeepFresh />

      <EffectComposer multisampling={4} enableNormalPass={false}>
        <Bloom
          intensity={0.55}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.3}
          mipmapBlur
          radius={0.7}
        />
        <Vignette offset={0.3} darkness={0.6} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}

/**
 * Paused canvases still need a handful of frames after mount so the
 * environment map, reflections and contact shadows resolve.
 */
function KeepFresh() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let n = 0
    const id = window.setInterval(() => {
      invalidate()
      if (++n > 12) window.clearInterval(id)
    }, 120)
    return () => window.clearInterval(id)
  }, [invalidate])
  return null
}
