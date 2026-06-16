'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Moroccan city clusters mapped to canvas space [x, y] in -1..1 range
// Based on actual geographic positions within Morocco
const CITY_CLUSTERS = [
  { x: -0.2, y: -0.1, spread: 2.2, count: 72, hue: 0.67 }, // Casablanca — largest cluster
  { x: 0.0,  y:  0.3, spread: 1.4, count: 32, hue: 0.67 }, // Rabat
  { x: -0.6, y:  0.5, spread: 1.2, count: 22, hue: 0.68 }, // Tanger
  { x: 0.1,  y: -0.5, spread: 1.2, count: 22, hue: 0.65 }, // Marrakech
  { x: -0.7, y: -0.6, spread: 1.0, count: 18, hue: 0.63 }, // Agadir
  { x: 0.5,  y:  0.4, spread: 1.0, count: 18, hue: 0.68 }, // Fès
  { x: 0.7,  y: -0.2, spread: 0.8, count: 14, hue: 0.66 }, // Meknès
]

function ParticleField() {
  const meshRef = useRef<THREE.Points>(null)
  const timeRef = useRef(0)

  const { positions, colors, sizes, phases } = useMemo(() => {
    const total = CITY_CLUSTERS.reduce((s, c) => s + c.count, 0)
    const positions = new Float32Array(total * 3)
    const colors    = new Float32Array(total * 3)
    const sizes     = new Float32Array(total)
    const phases    = new Float32Array(total)
    let idx = 0

    CITY_CLUSTERS.forEach(cluster => {
      for (let i = 0; i < cluster.count; i++) {
        // Gaussian-ish scatter around cluster center
        const angle  = Math.random() * Math.PI * 2
        const radius = Math.random() * cluster.spread * (0.3 + Math.random() * 0.7)
        const x = cluster.x * 7 + Math.cos(angle) * radius
        const y = cluster.y * 4 + Math.sin(angle) * radius
        const z = (Math.random() - 0.5) * 2

        positions[idx * 3]     = x
        positions[idx * 3 + 1] = y
        positions[idx * 3 + 2] = z

        // Indigo palette: hsl(238, 72%, 50-80%)
        const lightness = 0.5 + Math.random() * 0.3
        const saturation = 0.6 + Math.random() * 0.3
        const c = new THREE.Color().setHSL(cluster.hue, saturation, lightness)
        colors[idx * 3]     = c.r
        colors[idx * 3 + 1] = c.g
        colors[idx * 3 + 2] = c.b

        // Slightly varied sizes — a few "city" nodes are larger
        sizes[idx]  = i < 3 ? 0.09 + Math.random() * 0.04 : 0.03 + Math.random() * 0.04
        phases[idx] = Math.random() * Math.PI * 2
        idx++
      }
    })

    return { positions, colors, sizes, phases }
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    timeRef.current += delta

    // Very gentle global drift
    meshRef.current.rotation.z += delta * 0.008
    meshRef.current.position.y = Math.sin(timeRef.current * 0.12) * 0.08

    // Subtle per-particle vertical oscillation via geometry mutation
    const pos = meshRef.current.geometry.attributes.position
    const total = pos.count
    for (let i = 0; i < total; i++) {
      const origY = positions[i * 3 + 1]
      const t = timeRef.current * 0.4 + phases[i]
      pos.setY(i, origY + Math.sin(t) * 0.04)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]}    />
        <bufferAttribute attach="attributes-size"     args={[sizes, 1]}     />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.55}
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
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'low-power',
        preserveDrawingBuffer: false,
      }}
      dpr={[1, 1.5]}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <ParticleField />
    </Canvas>
  )
}
