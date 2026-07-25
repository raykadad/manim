import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
import { getWood } from './assets'
import { createGlowTexture } from './textures'

/**
 * A softbox rig baked into an environment map. Polished metal is almost
 * entirely a mirror, so the shape of these panels *is* the look of the watch.
 */
export function StudioEnvironment({ intensity = 1 }: { intensity?: number }) {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={['#242a32']} />

      {/* broad, dim front fill so satin surfaces never go to black */}
      <Lightformer
        form="rect"
        intensity={0.95 * intensity}
        color="#e2eaf5"
        position={[0, 2.4, 9]}
        scale={[16, 12, 1]}
        target={[0, 0, 0]}
      />
      {/* key: large overhead softbox, pushed slightly forward */}
      <Lightformer
        form="rect"
        intensity={2.2 * intensity}
        color="#fff7ee"
        position={[1.2, 6, 2.4]}
        scale={[12, 9, 1]}
        target={[0, 0, 0]}
      />
      {/* the two grazing strips that draw long highlights down polished flanks */}
      <Lightformer
        form="rect"
        intensity={1.55 * intensity}
        color="#eef4ff"
        position={[-6.5, 2.8, 1.2]}
        scale={[0.65, 10, 1]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        intensity={1.4 * intensity}
        color="#ffffff"
        position={[6.2, 2.4, -1.4]}
        scale={[0.5, 9, 1]}
        target={[0, 0, 0]}
      />
      {/* rim from behind, cool, separates the case from the background */}
      <Lightformer
        form="rect"
        intensity={1.35 * intensity}
        color="#cddeff"
        position={[0, 3.4, -7]}
        scale={[9, 3.5, 1]}
        target={[0, 0, 0]}
      />
      {/* warm bounce from the table side */}
      <Lightformer
        form="rect"
        intensity={0.3 * intensity}
        color="#f6e0c8"
        position={[0, -2.6, 4.5]}
        scale={[10, 4, 1]}
        target={[0, 0, 0]}
      />
      {/* small speculars — the glints that sell faceted indices */}
      <Lightformer
        form="circle"
        intensity={3.8 * intensity}
        color="#ffffff"
        position={[-2.4, 4.2, -2.2]}
        scale={0.85}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="circle"
        intensity={2.2 * intensity}
        color="#fff1e0"
        position={[3.2, 3.4, 3.2]}
        scale={0.65}
        target={[0, 0, 0]}
      />
    </Environment>
  )
}

/** Walnut slab with a lacquered, gently reflective top. */
export function Table() {
  const wood = getWood()
  const maps = useMemo(() => {
    const clone = (t: THREE.Texture, rx: number, ry: number) => {
      const c = t.clone()
      c.repeat.set(rx, ry)
      c.needsUpdate = true
      return c
    }
    const [rx, ry] = [3.2, 4.6]
    return {
      map: clone(wood.map, rx, ry),
      roughnessMap: clone(wood.roughnessMap!, rx, ry),
      normalMap: clone(wood.normalMap!, rx, ry),
    }
  }, [wood])

  useEffect(() => () => Object.values(maps).forEach((m) => m.dispose()), [maps])

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[160, 120]} />
      <MeshReflectorMaterial
        map={maps.map}
        roughnessMap={maps.roughnessMap}
        normalMap={maps.normalMap}
        normalScale={new THREE.Vector2(0.55, 0.55)}
        resolution={1024}
        mixBlur={1.6}
        mixStrength={1.35}
        mixContrast={1}
        blur={[600, 180]}
        depthScale={1.3}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.4}
        depthToBlurRatioBias={0.4}
        metalness={0.04}
        roughness={0.72}
        color="#e8d9c8"
        envMapIntensity={0.45}
      />
    </mesh>
  )
}

/** Soft luminous backdrop so the subject never sits on dead black. */
export function BackdropGlow({
  position = [0, 5, -26] as [number, number, number],
  scale = 48,
  inner = '#3a444f',
}) {
  const tex = useMemo(() => createGlowTexture(inner, '#000000'), [inner])
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={tex}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  )
}
