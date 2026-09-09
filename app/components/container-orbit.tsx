'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { CONTAINER_GROUPS, type ContainerGroup, type ContainerSnapshot } from 'app/lib/server-dashboard-snapshot'

/** Each group gets one ring, and the ring order is the draw order outward. */
const GROUP_VARIABLE: Record<ContainerGroup, string> = {
  media: '--series-cpu',
  monitoring: '--status-up',
  home: '--series-third',
  apps: '--series-ram',
  infra: '--ink-soft',
}

const SUN_RADIUS = 1.05
/** Far enough out that the largest planet still clears the sun once the
 *  camera tilt foreshortens the near side of the ring. */
const FIRST_RING = 3.9
const RING_GAP = 1.75
const MIN_PLANET = 0.16
const MAX_PLANET = 0.68

/** Idle containers still drift, or a third of the scene would sit frozen and
 *  read as broken rather than quiet. */
const BASE_ANGULAR_SPEED = 0.055
const CPU_ANGULAR_SPEED = 0.5

type Placed = {
  container: ContainerSnapshot
  ring: number
  radius: number
  size: number
  speed: number
  angle: number
}

/**
 * Memory drives volume rather than radius: a container holding five gigabytes
 * against a neighbour's fifty megabytes would otherwise be a hundred times
 * wider and swallow the ring.
 */
function planetSize(memoryBytes: number | null, peak: number) {
  if (!memoryBytes || memoryBytes <= 0 || peak <= 0) return MIN_PLANET
  const scaled = Math.cbrt(memoryBytes / peak)
  return MIN_PLANET + scaled * (MAX_PLANET - MIN_PLANET)
}

function angularSpeed(cpuPercent: number | null, peak: number) {
  if (!cpuPercent || cpuPercent <= 0 || peak <= 0) return BASE_ANGULAR_SPEED
  return BASE_ANGULAR_SPEED + Math.sqrt(Math.min(cpuPercent / peak, 1)) * CPU_ANGULAR_SPEED
}

function readPalette(element: HTMLElement) {
  const styles = getComputedStyle(element)
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback

  return {
    groups: Object.fromEntries(
      CONTAINER_GROUPS.map((group) => [group, new THREE.Color(read(GROUP_VARIABLE[group], '#888888'))]),
    ) as Record<ContainerGroup, THREE.Color>,
    sun: new THREE.Color(read('--series-third', '#d8a62b')),
    // --chart-grid is a tenth-opacity overlay colour, and THREE.Color drops the
    // alpha, so the rings would read as either black or white. --ink-soft is
    // solid in both themes and is what an orbit guide should sit at.
    guide: new THREE.Color(read('--ink-soft', '#888888')),
  }
}

export default function ContainerOrbit({
  containers,
  hostCpuPercent,
  onSelect,
}: Readonly<{
  containers: ContainerSnapshot[]
  hostCpuPercent: number
  onSelect: (container: ContainerSnapshot | null) => void
}>) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState<{ container: ContainerSnapshot; x: number; y: number } | null>(null)
  // Read in the animation loop, so a re-render never restarts the scene.
  const hostCpuRef = useRef(hostCpuPercent)
  hostCpuRef.current = hostCpuPercent

  const placed = useMemo<Placed[]>(() => {
    const peakMemory = Math.max(...containers.map((entry) => entry.memoryBytes ?? 0), 1)
    const peakCpu = Math.max(...containers.map((entry) => entry.cpuPercent ?? 0), 1)
    const present = CONTAINER_GROUPS.filter((group) => containers.some((entry) => entry.group === group))

    return present.flatMap((group, ringIndex) => {
      const members = containers.filter((entry) => entry.group === group)
      const radius = FIRST_RING + ringIndex * RING_GAP

      return members.map((container, index) => ({
        container,
        ring: ringIndex,
        radius,
        size: planetSize(container.memoryBytes, peakMemory),
        speed: angularSpeed(container.cpuPercent, peakCpu),
        // Spread evenly so a busy ring does not start as one clump.
        angle: (index / members.length) * Math.PI * 2,
      }))
    })
  }, [containers])

  const handleLeave = useCallback(() => setHovered(null), [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || placed.length === 0) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200)
    // Held constant so the tilt survives every reframe; only distance changes.
    const viewDirection = new THREE.Vector3(0, 0.44, 0.9).normalize()

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'

    let palette = readPalette(mount)

    // One geometry and one material per group, scaled per mesh: 47 planets
    // should not mean 47 of each.
    const sphere = new THREE.SphereGeometry(1, 20, 16)
    const groupMaterials = Object.fromEntries(
      CONTAINER_GROUPS.map((group) => [
        group,
        new THREE.MeshStandardMaterial({ color: palette.groups[group], roughness: 0.85, metalness: 0 }),
      ]),
    ) as Record<ContainerGroup, THREE.MeshStandardMaterial>

    const highlight = new THREE.MeshStandardMaterial({
      color: palette.groups.media,
      emissive: palette.sun,
      emissiveIntensity: 0.6,
      roughness: 0.4,
    })

    const sunMaterial = new THREE.MeshBasicMaterial({ color: palette.sun })
    const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_RADIUS, 32, 24), sunMaterial)
    scene.add(sun)

    // Soft enough that a sphere reads as its group colour rather than as a
    // white specular hotspot.
    const light = new THREE.PointLight(0xffffff, 90, 120, 2)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xffffff, 1.15))

    // Ring guides, so an empty stretch of orbit still reads as an orbit.
    const guideMaterial = new THREE.LineBasicMaterial({ color: palette.guide, transparent: true, opacity: 0.42 })
    const ringCount = new Set(placed.map((entry) => entry.ring)).size
    const guides: THREE.Line[] = []
    for (let index = 0; index < ringCount; index += 1) {
      const radius = FIRST_RING + index * RING_GAP
      const points = Array.from({ length: 97 }, (_, step) => {
        const angle = (step / 96) * Math.PI * 2
        return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
      })
      const guide = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), guideMaterial)
      guides.push(guide)
      scene.add(guide)
    }

    const meshes = placed.map((entry) => {
      const mesh = new THREE.Mesh(sphere, groupMaterials[entry.container.group])
      mesh.scale.setScalar(entry.size)
      mesh.position.set(Math.cos(entry.angle) * entry.radius, 0, Math.sin(entry.angle) * entry.radius)
      mesh.userData.entry = entry
      scene.add(mesh)
      return mesh
    })

    // The outermost orbit plus its widest planet is what has to stay on screen.
    const systemRadius = FIRST_RING + (ringCount - 1) * RING_GAP + MAX_PLANET

    const resize = () => {
      const { clientWidth, clientHeight } = mount
      if (clientWidth === 0 || clientHeight === 0) return
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight

      // Frame to the horizontal field of view: the system is a flat disc, so
      // width binds long before height, and a narrow phone must pull back
      // rather than crop the outer ring.
      const halfVertical = THREE.MathUtils.degToRad(camera.fov / 2)
      const halfHorizontal = Math.atan(Math.tan(halfVertical) * camera.aspect)
      const distance = (systemRadius * 1.12) / Math.tan(Math.min(halfHorizontal, halfVertical * 1.6))

      camera.position.copy(viewDirection).multiplyScalar(distance)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    // Re-read the palette when the theme flips rather than baking in colours.
    const applyPalette = () => {
      palette = readPalette(mount)
      for (const group of CONTAINER_GROUPS) groupMaterials[group].color.copy(palette.groups[group])
      sunMaterial.color.copy(palette.sun)
      guideMaterial.color.copy(palette.guide)
      highlight.emissive.copy(palette.sun)
    }
    const themeObserver = new MutationObserver(applyPalette)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', applyPalette)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let hoveredMesh: THREE.Mesh | null = null

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(meshes, false)[0]

      if (hoveredMesh && hoveredMesh !== hit?.object) {
        hoveredMesh.material = groupMaterials[(hoveredMesh.userData.entry as Placed).container.group]
        hoveredMesh = null
      }

      if (hit) {
        hoveredMesh = hit.object as THREE.Mesh
        hoveredMesh.material = highlight
        const entry = hoveredMesh.userData.entry as Placed
        setHovered({
          container: entry.container,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        })
        renderer.domElement.style.cursor = 'pointer'
      } else {
        setHovered(null)
        renderer.domElement.style.cursor = 'grab'
      }
    }

    const onClick = () => {
      const entry = hoveredMesh?.userData.entry as Placed | undefined
      onSelect(entry ? entry.container : null)
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('click', onClick)

    let frame = 0
    let last = performance.now()
    let running = true

    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1)
      last = now

      if (!reduceMotion) {
        for (let index = 0; index < meshes.length; index += 1) {
          const entry = meshes[index].userData.entry as Placed
          entry.angle += entry.speed * delta
          meshes[index].position.set(
            Math.cos(entry.angle) * entry.radius,
            0,
            Math.sin(entry.angle) * entry.radius,
          )
        }
        // The host's own load shows as the sun breathing.
        const pulse = 1 + Math.sin(now / 900) * 0.02 + (hostCpuRef.current / 100) * 0.06
        sun.scale.setScalar(pulse)
      }

      renderer.render(scene, camera)
      if (running) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    // A hidden tab should not keep a WebGL loop warm.
    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(frame)
      } else if (!running) {
        running = true
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
      scheme.removeEventListener('change', applyPalette)
      themeObserver.disconnect()
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('click', onClick)

      sphere.dispose()
      sun.geometry.dispose()
      sunMaterial.dispose()
      highlight.dispose()
      guideMaterial.dispose()
      for (const guide of guides) guide.geometry.dispose()
      for (const group of CONTAINER_GROUPS) groupMaterials[group].dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [placed, onSelect])

  return (
    <div className="relative">
      <div
        ref={mountRef}
        onPointerLeave={handleLeave}
        className="h-[380px] w-full overflow-hidden rounded-xl md:h-[460px]"
        style={{ background: 'var(--chart-surface)' }}
      />
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: hovered.x, top: hovered.y - 10 }}
        >
          <div className="font-[family-name:var(--font-geist-mono)] text-[var(--ink-strong)]">
            {hovered.container.name}
          </div>
          <div className="mt-0.5 text-[var(--ink-soft)] [font-variant-numeric:tabular-nums]">
            {(hovered.container.cpuPercent ?? 0).toFixed(2)}% CPU ·{' '}
            {Math.round((hovered.container.memoryBytes ?? 0) / 1e6)} MB
          </div>
        </div>
      )}
    </div>
  )
}
