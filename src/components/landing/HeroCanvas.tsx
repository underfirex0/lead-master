'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CLUSTERS = [
  { x: -0.2, y: -0.1, spread: 2.2, count: 60, hue: 0.67 }, // Casablanca
  { x:  0.0, y:  0.3, spread: 1.4, count: 28, hue: 0.67 }, // Rabat
  { x: -0.6, y:  0.5, spread: 1.2, count: 20, hue: 0.68 }, // Tanger
  { x:  0.1, y: -0.5, spread: 1.2, count: 20, hue: 0.65 }, // Marrakech
  { x: -0.7, y: -0.6, spread: 1.0, count: 16, hue: 0.63 }, // Agadir
  { x:  0.5, y:  0.4, spread: 1.0, count: 16, hue: 0.68 }, // Fès
]

function Particles() {
  const ref   = useRef<THREE.Points>(null)
  const clock = useRef(0)

  const { positions, colors, phases } = useMemo(() => {
    const total     = CLUSTERS.reduce((s, c) => s + c.count, 0)
    const positions = new Float32Array(total * 3)
    const colors    = new Float32Array(total * 3)
    const phases    = new Float32Array(total)
    let idx = 0

    CLUSTERS.forEach(cluster => {
      for (let i = 0; i < cluster.count; i++) {
        const angle  = Math.random() * Math.PI * 2
        const radius = Math.random() * cluster.spread * (0.3 + Math.random() * 0.7)
        positions[idx * 3]     = cluster.x * 7 + Math.cos(angle) * radius
        positions[idx * 3 + 1] = cluster.y * 4 + Math.sin(angle) * radius
        positions[idx * 3 + 2] = (Math.random() - 0.5) * 2
        const c = new THREE.Color().setHSL(cluster.hue, 0.65 + Math.random() * 0.25, 0.5 + Math.random() * 0.3)
        colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b
        phases[idx] = Math.random() * Math.PI * 2
        idx++
      }
    })
    return { positions, colors, phases }
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    clock.current += delta
    ref.current.rotation.z += delta * 0.006
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, positions[i * 3 + 1] + Math.sin(clock.current * 0.4 + phases[i]) * 0.05)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]}    />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 75 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      dpr={[1, 1.5]}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Particles />
    </Canvas>
  )
}
