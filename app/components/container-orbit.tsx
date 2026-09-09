'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { CONTAINER_GROUPS, type ContainerGroup, type ContainerSnapshot } from 'app/lib/server-dashboard-snapshot'

const GROUP_VARIABLE: Record<ContainerGroup, string> = {
  media: '--series-cpu',
  monitoring: '--status-up',
  home: '--series-third',
  apps: '--series-ram',
  infra: '--ink-soft',
}

export const GROUP_LABEL: Record<ContainerGroup, string> = {
  media: 'Media',
  monitoring: 'Monitoring',
  home: 'Home automation',
  apps: 'Applications',
  infra: 'Infrastructure',
}

const HOST_RADIUS = 0.95

/**
 * Beyond about six a ring reads as a crowd rather than an orbit, so only the
 * largest containers in a group get to be planets. The rest become moons of
 * those planets, which keeps every ring sparse no matter how big the group is.
 */
const MAX_PLANETS_PER_GROUP = 6
const MIN_PLANETS_PER_GROUP = 4
/** Below this a group is small enough that everything can be a planet. */
const ALL_PLANETS_BELOW = 6

const STAR_CLEARANCE = 1.15

const MIN_PLANET = 0.16
const MAX_PLANET = 0.55
const MIN_MOON = 0.07
const MAX_MOON = 0.18
const MIN_STAR = 0.32
const MAX_STAR = 0.7

/** Clearance between a planet's surface and its innermost moon, then between
 *  successive moons. */
const MOON_CLEARANCE = 0.26
const MOON_GAP = 0.19

/** Clear space between one planet's outermost moon and the next orbit in. */
const ORBIT_SPACING = 0.26

/** Keeps a five-container group from zooming in until it fills the frame. */
const MIN_CLUSTER_EXTENT = 3.6

/** Moons sweep faster than planets, which is what makes them read as moons. */
const BASE_MOON_SPEED = 0.4
const MOON_CPU_SPEED = 1.3

/**
 * A logarithmic spiral, stepped by the golden angle. That angle is what stops
 * successive clusters from lining up along the same arm, which is the whole
 * reason a sunflower packs its seeds this way.
 */
const SPIRAL_BASE = 4.6
const SPIRAL_GROWTH = 1.15
const SPIRAL_TURN = 2.39996
/** Breathing room between two clusters' outermost orbits. */
const CLUSTER_GAP = 0.9

/** How small a cluster sits while the whole galaxy is in frame. */
const GALAXY_SCALE = 0.34

const BASE_ANGULAR_SPEED = 0.055
const CPU_ANGULAR_SPEED = 0.5

/** Exponential smoothing rate for the zoom: roughly two thirds of the way
 *  there in a quarter second, settled by about a second. */
const FOCUS_RATE = 5.5

const GALAXY_DIRECTION = new THREE.Vector3(0, 0.95, 0.31).normalize()
const SYSTEM_DIRECTION = new THREE.Vector3(0, 0.5, 0.87).normalize()

type PlacedMoon = {
  container: ContainerSnapshot
  /** Distance from its planet's centre. */
  orbit: number
  size: number
  speed: number
  angle: number
}

type PlacedPlanet = {
  container: ContainerSnapshot
  ringIndex: number
  /** Distance from the group's star. */
  radius: number
  size: number
  speed: number
  angle: number
  moons: PlacedMoon[]
}

type Cluster = {
  group: ContainerGroup
  spiral: THREE.Vector3
  /** Radius of the cluster at full size, used to frame the camera. */
  extent: number
  root: THREE.Group
  /** One group per planet, holding that planet and its moons. */
  orbits: THREE.Group[]
  /** Every clickable body in the cluster, planets and moons alike. */
  meshes: THREE.Mesh[]
  material: THREE.MeshStandardMaterial
  starMaterial: THREE.MeshBasicMaterial
  guideMaterial: THREE.LineBasicMaterial
  hit: THREE.Mesh
  label: HTMLDivElement
  focus: number
}

/** Volume, not radius: five gigabytes beside fifty megabytes would otherwise be
 *  a hundred times wider and swallow the ring it shares. */
function bodySize(memoryBytes: number | null, peak: number, min: number, max: number) {
  if (!memoryBytes || memoryBytes <= 0 || peak <= 0) return min
  return min + Math.cbrt(memoryBytes / peak) * (max - min)
}

function moonSpeed(cpuPercent: number | null, peak: number) {
  if (!cpuPercent || cpuPercent <= 0 || peak <= 0) return BASE_MOON_SPEED
  return BASE_MOON_SPEED + Math.sqrt(Math.min(cpuPercent / peak, 1)) * MOON_CPU_SPEED
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
    host: new THREE.Color(read('--series-third', '#d8a62b')),
    // --chart-grid is a tenth-opacity overlay colour and THREE.Color drops the
    // alpha, which would leave every ring either black or white.
    guide: new THREE.Color(read('--ink-soft', '#888888')),
  }
}

export default function ContainerOrbit({
  containers,
  hostCpuPercent,
  activeGroup,
  onSelectGroup,
  onSelectContainer,
}: Readonly<{
  containers: ContainerSnapshot[]
  hostCpuPercent: number
  activeGroup: ContainerGroup | null
  onSelectGroup: (group: ContainerGroup | null) => void
  onSelectContainer: (container: ContainerSnapshot | null) => void
}>) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState<{ label: string; detail: string; x: number; y: number } | null>(null)

  // Read inside the loop, so a prop change never tears the scene down.
  const hostCpuRef = useRef(hostCpuPercent)
  hostCpuRef.current = hostCpuPercent
  const activeGroupRef = useRef(activeGroup)
  activeGroupRef.current = activeGroup
  const selectGroupRef = useRef(onSelectGroup)
  selectGroupRef.current = onSelectGroup
  const selectContainerRef = useRef(onSelectContainer)
  selectContainerRef.current = onSelectContainer

  const layout = useMemo(() => {
    const peakMemory = Math.max(...containers.map((entry) => entry.memoryBytes ?? 0), 1)
    const peakCpu = Math.max(...containers.map((entry) => entry.cpuPercent ?? 0), 1)
    const present = CONTAINER_GROUPS.filter((group) => containers.some((entry) => entry.group === group))
    const peakGroupMemory = Math.max(
      ...present.map((group) =>
        containers.filter((entry) => entry.group === group).reduce((sum, entry) => sum + (entry.memoryBytes ?? 0), 0),
      ),
      1,
    )

    return present.map((group, index) => {
      const members = containers.filter((entry) => entry.group === group)

      // Biggest first: the heaviest containers earn a planet, and the long tail
      // of small ones becomes their moons.
      const byMemory = [...members].sort((a, b) => (b.memoryBytes ?? 0) - (a.memoryBytes ?? 0))
      const planetCount =
        members.length <= ALL_PLANETS_BELOW
          ? members.length
          : Math.min(Math.max(Math.ceil(members.length / 3), MIN_PLANETS_PER_GROUP), MAX_PLANETS_PER_GROUP)

      const primaries = byMemory.slice(0, planetCount)
      const satellites = byMemory.slice(planetCount)

      const placed: PlacedPlanet[] = primaries.map((container, ringIndex) => ({
        container,
        ringIndex,
        radius: 0,
        size: bodySize(container.memoryBytes, peakMemory, MIN_PLANET, MAX_PLANET),
        speed: angularSpeed(container.cpuPercent, peakCpu),
        // Staggered rather than aligned, so the system does not start as a
        // single spoke.
        angle: ringIndex * 2.1,
        moons: [] as PlacedMoon[],
      }))

      // Round-robin so the moons spread evenly rather than piling onto one host.
      const peakMoonMemory = Math.max(...satellites.map((entry) => entry.memoryBytes ?? 0), 1)
      satellites.forEach((container, position) => {
        const host = placed[position % placed.length]
        if (!host) return
        const rank = host.moons.length
        host.moons.push({
          container,
          orbit: host.size + MOON_CLEARANCE + rank * MOON_GAP,
          size: bodySize(container.memoryBytes, peakMoonMemory, MIN_MOON, MAX_MOON),
          speed: moonSpeed(container.cpuPercent, peakCpu),
          angle: (rank / Math.max(satellites.length / placed.length, 1)) * Math.PI * 2 + position,
        })
      })

      /** How much room a planet needs including everything orbiting it. */
      const footprint = (planet: PlacedPlanet) =>
        planet.moons.length === 0
          ? planet.size
          : planet.moons[planet.moons.length - 1].orbit + planet.moons[planet.moons.length - 1].size

      // One planet per orbit, nested outwards. Planets on a shared ring drift
      // into each other by design here - orbital speed is CPU, so they move at
      // different rates and will always eventually collide. Giving each its own
      // orbit makes that impossible, and is what a solar system looks like.
      const ringRadii: number[] = []
      let edge = STAR_CLEARANCE
      for (const planet of placed) {
        const reach = footprint(planet)
        const radius = edge + reach
        planet.radius = radius
        ringRadii.push(radius)
        edge = radius + reach + ORBIT_SPACING
      }

      const moonReach = placed.length > 0 ? footprint(placed[placed.length - 1]) : MAX_PLANET

      const totalMemory = members.reduce((sum, entry) => sum + (entry.memoryBytes ?? 0), 0)

      return {
        group,
        placed,
        ringRadii,
        // Floored, so a small group does not zoom in until its planets fill the
        // whole frame.
        extent: Math.max(ringRadii[ringRadii.length - 1] + moonReach, MIN_CLUSTER_EXTENT),
        starRadius: MIN_STAR + Math.cbrt(totalMemory / peakGroupMemory) * (MAX_STAR - MIN_STAR),
        spiral: new THREE.Vector3(),
        count: members.length,
        planetCount: placed.length,
        moonCount: satellites.length,
        totalMemory,
        meanCpu: members.reduce((sum, entry) => sum + (entry.cpuPercent ?? 0), 0) / Math.max(members.length, 1),
      }
    })
  }, [containers])

  // Positions are assigned after every cluster's size is known, then pushed
  // outward until nothing overlaps. A fixed progression cannot do this: how
  // wide a cluster ends up depends on how many planets and moons it holds.
  const positioned = useMemo(() => {
    let radius = SPIRAL_BASE

    layout.forEach((cluster, index) => {
      const theta = index * SPIRAL_TURN
      const clears = () =>
        // The host sits at the origin and is an obstacle too, or the innermost
        // cluster's outer orbit ends up drawn straight through it.
        cluster.spiral.length() >= cluster.extent * GALAXY_SCALE + HOST_RADIUS + CLUSTER_GAP &&
        layout.slice(0, index).every((other) => {
          const needed = (cluster.extent + other.extent) * GALAXY_SCALE + CLUSTER_GAP
          return cluster.spiral.distanceTo(other.spiral) >= needed
        })

      cluster.spiral.set(Math.cos(theta) * radius, 0, Math.sin(theta) * radius)

      // Nudge outward until this cluster clears every one already placed.
      let guard = 0
      while (!clears() && guard < 200) {
        radius *= 1.05
        cluster.spiral.set(Math.cos(theta) * radius, 0, Math.sin(theta) * radius)
        guard += 1
      }

      radius *= SPIRAL_GROWTH
    })

    return layout
  }, [layout])

  const handleLeave = useCallback(() => setHovered(null), [])

  useEffect(() => {
    const mount = mountRef.current
    const overlay = overlayRef.current
    if (!mount || !overlay || positioned.length === 0) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'

    let palette = readPalette(mount)

    const sphere = new THREE.SphereGeometry(1, 20, 16)

    const hostMaterial = new THREE.MeshBasicMaterial({ color: palette.host, transparent: true })
    const host = new THREE.Mesh(new THREE.SphereGeometry(HOST_RADIUS, 32, 24), hostMaterial)
    scene.add(host)

    // Inside a system the planets sit close to the light, and inverse-square
    // falloff blew them out to white at that range. Most of the illumination is
    // ambient; the point light only supplies enough shading to read as a sphere.
    const light = new THREE.PointLight(0xffffff, 24, 300, 2)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xffffff, 1.75))

    const clusters: Cluster[] = positioned.map((entry) => {
      const root = new THREE.Group()
      root.position.copy(entry.spiral)
      root.scale.setScalar(GALAXY_SCALE)
      scene.add(root)

      const material = new THREE.MeshStandardMaterial({
        color: palette.groups[entry.group],
        roughness: 0.85,
        metalness: 0,
        transparent: true,
      })
      const starMaterial = new THREE.MeshBasicMaterial({ color: palette.groups[entry.group], transparent: true })
      const guideMaterial = new THREE.LineBasicMaterial({ color: palette.guide, transparent: true, opacity: 0.42 })

      const star = new THREE.Mesh(sphere, starMaterial)
      star.scale.setScalar(entry.starRadius)
      root.add(star)

      for (const ringRadius of entry.ringRadii) {
        const points = Array.from({ length: 97 }, (_, step) => {
          const angle = (step / 96) * Math.PI * 2
          return new THREE.Vector3(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius)
        })
        root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), guideMaterial))
      }

      // Each planet is a group so its moons ride along with it: a moon is
      // positioned relative to its planet, not to the group's star.
      const orbits: THREE.Group[] = []
      const meshes: THREE.Mesh[] = []

      for (const placed of entry.placed) {
        const orbit = new THREE.Group()
        orbit.position.set(Math.cos(placed.angle) * placed.radius, 0, Math.sin(placed.angle) * placed.radius)
        orbit.userData.placed = placed
        root.add(orbit)
        orbits.push(orbit)

        const planet = new THREE.Mesh(sphere, material)
        planet.scale.setScalar(placed.size)
        planet.userData.placed = placed
        orbit.add(planet)
        meshes.push(planet)

        for (const moon of placed.moons) {
          const mesh = new THREE.Mesh(sphere, material)
          mesh.scale.setScalar(moon.size)
          mesh.position.set(Math.cos(moon.angle) * moon.orbit, 0, Math.sin(moon.angle) * moon.orbit)
          mesh.userData.placed = moon
          orbit.add(mesh)
          meshes.push(mesh)
        }
      }

      // An invisible sphere gives the whole cluster one generous click target,
      // rather than asking anyone to hit a half-millimetre planet.
      const hit = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ visible: false }))
      hit.scale.setScalar(entry.extent * 0.85)
      hit.userData.group = entry.group
      root.add(hit)

      // Styled inline rather than with utility classes: this element is created
      // in JavaScript, so a class-scanning build step never sees the names and
      // the positioning transforms would silently not exist.
      const label = document.createElement('div')
      label.style.position = 'absolute'
      label.style.left = '0'
      label.style.top = '0'
      label.style.pointerEvents = 'none'
      label.style.whiteSpace = 'nowrap'
      label.style.textAlign = 'center'
      label.style.fontSize = '11px'
      label.style.lineHeight = '1.25'
      label.style.transition = 'opacity 120ms linear'
      label.innerHTML =
        `<span style="color:var(--ink-strong);font-weight:600">${GROUP_LABEL[entry.group]}</span>` +
        `<br/><span style="color:var(--ink-soft)">${entry.count} containers</span>`
      overlay.appendChild(label)

      return {
        group: entry.group,
        spiral: entry.spiral,
        extent: entry.extent,
        root,
        orbits,
        meshes,
        material,
        starMaterial,
        guideMaterial,
        hit,
        label,
        focus: 0,
      }
    })

    const galaxyExtent = Math.max(
      ...clusters.map((cluster) => cluster.spiral.length() + cluster.extent * GALAXY_SCALE),
      1,
    )

    /**
     * The system is a flat disc, so how tall it lands on screen depends on the
     * viewing elevation: looking straight down it stays circular, and from a
     * low angle it flattens. Framing on width alone crops the far clusters the
     * moment the camera swings overhead.
     */
    const frameDistance = (worldRadius: number, elevation: number) => {
      const halfVertical = THREE.MathUtils.degToRad(camera.fov / 2)
      const halfHorizontal = Math.atan(Math.tan(halfVertical) * camera.aspect)
      // Perspective makes the near edge of the disc project lower and larger
      // than elevation alone predicts, and the flatter the angle the worse it
      // gets. Looking almost straight down needs almost none of that slack.
      const margin = 1.12 + (1 - elevation) * 0.4

      const byWidth = (worldRadius * margin) / Math.tan(halfHorizontal)
      const byHeight = (worldRadius * elevation * margin) / Math.tan(halfVertical)
      return Math.max(byWidth, byHeight)
    }

    const resize = () => {
      const { clientWidth, clientHeight } = mount
      if (clientWidth === 0 || clientHeight === 0) return
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    const applyPalette = () => {
      palette = readPalette(mount)
      hostMaterial.color.copy(palette.host)
      for (const cluster of clusters) {
        cluster.material.color.copy(palette.groups[cluster.group])
        cluster.starMaterial.color.copy(palette.groups[cluster.group])
        cluster.guideMaterial.color.copy(palette.guide)
      }
    }
    const themeObserver = new MutationObserver(applyPalette)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', applyPalette)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const projected = new THREE.Vector3()
    const edge = new THREE.Vector3()

    const focusedCluster = () => clusters.find((cluster) => cluster.group === activeGroupRef.current) ?? null

    const pick = (event: PointerEvent | MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)

      const focused = focusedCluster()
      // In the galaxy the target is a whole cluster; inside one it is a planet.
      const targets = focused ? focused.meshes : clusters.map((cluster) => cluster.hit)
      return { hit: raycaster.intersectObjects(targets, false)[0], rect, focused }
    }

    const onPointerMove = (event: PointerEvent) => {
      const { hit, rect, focused } = pick(event)

      if (!hit) {
        setHovered(null)
        renderer.domElement.style.cursor = 'default'
        return
      }

      renderer.domElement.style.cursor = 'pointer'
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      if (focused) {
        const placed = hit.object.userData.placed as PlacedPlanet | PlacedMoon
        setHovered({
          label: placed.container.name,
          detail: `${(placed.container.cpuPercent ?? 0).toFixed(2)}% CPU · ${Math.round(
            (placed.container.memoryBytes ?? 0) / 1e6,
          )} MB`,
          x,
          y,
        })
        return
      }

      const group = hit.object.userData.group as ContainerGroup
      const entry = positioned.find((candidate) => candidate.group === group)
      setHovered({
        label: GROUP_LABEL[group],
        detail: entry
          ? `${entry.count} containers · ${(entry.totalMemory / 1e9).toFixed(2)} GB · ${entry.meanCpu.toFixed(2)}% mean CPU`
          : '',
        x,
        y,
      })
    }

    const onClick = (event: MouseEvent) => {
      const { hit, focused } = pick(event)

      if (focused) {
        // Empty space steps back out to the galaxy.
        if (hit) selectContainerRef.current((hit.object.userData.placed as PlacedPlanet | PlacedMoon).container)
        else selectGroupRef.current(null)
        return
      }

      if (hit) selectGroupRef.current(hit.object.userData.group as ContainerGroup)
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('click', onClick)

    let frame = 0
    let last = performance.now()
    let running = true

    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1)
      last = now

      // Exponential smoothing rather than a scheduled tween: interrupting a
      // zoom halfway just retargets, with no bookkeeping to unwind.
      const blend = reduceMotion ? 1 : 1 - Math.exp(-delta * FOCUS_RATE)
      let maxFocus = 0

      for (const cluster of clusters) {
        const target = cluster.group === activeGroupRef.current ? 1 : 0
        cluster.focus += (target - cluster.focus) * blend
        if (cluster.focus < 0.001) cluster.focus = 0
        if (cluster.focus > 0.999) cluster.focus = 1
        maxFocus = Math.max(maxFocus, cluster.focus)
      }

      const focused = focusedCluster()
      const labelOpacity = Math.max(0, 1 - maxFocus * 2.2)

      for (const cluster of clusters) {
        // The focused cluster slides to the origin and grows to full size;
        // everything else fades out of the way entirely.
        cluster.root.position.copy(cluster.spiral).multiplyScalar(1 - cluster.focus)
        cluster.root.scale.setScalar(GALAXY_SCALE + (1 - GALAXY_SCALE) * cluster.focus)

        const opacity = cluster.focus > 0 ? 1 : 1 - maxFocus
        cluster.material.opacity = opacity
        cluster.starMaterial.opacity = opacity
        cluster.guideMaterial.opacity = 0.42 * opacity
        cluster.root.visible = opacity > 0.01

        if (!reduceMotion && cluster.root.visible) {
          for (const orbit of cluster.orbits) {
            const planet = orbit.userData.placed as PlacedPlanet
            planet.angle += planet.speed * delta
            orbit.position.set(Math.cos(planet.angle) * planet.radius, 0, Math.sin(planet.angle) * planet.radius)

            // Moons are children of the planet's group, so these positions stay
            // relative and the moon follows its planet around the star for free.
            for (let index = 0; index < planet.moons.length; index += 1) {
              const moon = planet.moons[index]
              moon.angle += moon.speed * delta
              orbit.children[index + 1]?.position.set(
                Math.cos(moon.angle) * moon.orbit,
                0,
                Math.sin(moon.angle) * moon.orbit,
              )
            }
          }
        }

        // Labels belong to the galaxy view; inside a system they only clutter.
        if (labelOpacity <= 0.01 || !cluster.root.visible) {
          cluster.label.style.opacity = '0'
        } else {
          const width = renderer.domElement.clientWidth
          const height = renderer.domElement.clientHeight

          projected.copy(cluster.root.position).project(camera)
          const centreX = ((projected.x + 1) / 2) * width
          const centreY = ((-projected.y + 1) / 2) * height

          // Looking down, world "up" points at the camera and projects to
          // nothing, so the clearance has to be measured on screen: project a
          // point one cluster-radius out and use that pixel distance.
          edge.copy(cluster.root.position)
          edge.x += cluster.extent * cluster.root.scale.x
          edge.project(camera)
          const radiusPx = Math.abs(((edge.x + 1) / 2) * width - centreX)

          // Anchored by its own bottom centre, so the text sits clear above the
          // cluster whatever size the cluster happens to be.
          cluster.label.style.opacity = String(labelOpacity)
          cluster.label.style.transform = `translate(${Math.round(centreX)}px, ${Math.round(
            centreY - radiusPx - 10,
          )}px) translate(-50%, -100%)`
        }
      }

      hostMaterial.opacity = 1 - maxFocus
      host.visible = hostMaterial.opacity > 0.01
      if (!reduceMotion && host.visible) {
        host.scale.setScalar(1 + Math.sin(now / 900) * 0.02 + (hostCpuRef.current / 100) * 0.06)
      }

      const direction = GALAXY_DIRECTION.clone().lerp(SYSTEM_DIRECTION, maxFocus).normalize()
      const worldRadius = THREE.MathUtils.lerp(galaxyExtent, focused ? focused.extent : galaxyExtent, maxFocus)
      camera.position.copy(direction).multiplyScalar(frameDistance(worldRadius, direction.y))
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
      if (running) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

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

      for (const cluster of clusters) {
        cluster.material.dispose()
        cluster.starMaterial.dispose()
        cluster.guideMaterial.dispose()
        ;(cluster.hit.material as THREE.Material).dispose()
        cluster.root.traverse((object) => {
          if (object instanceof THREE.Line) object.geometry.dispose()
        })
        cluster.label.remove()
      }
      sphere.dispose()
      host.geometry.dispose()
      hostMaterial.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [positioned])

  return (
    <div className="relative">
      <div
        ref={mountRef}
        onPointerLeave={handleLeave}
        className="h-[400px] w-full overflow-hidden rounded-xl md:h-[500px]"
        style={{ background: 'var(--chart-surface)' }}
      />
      <div ref={overlayRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden />
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: hovered.x, top: hovered.y - 12 }}
        >
          <div className="font-[family-name:var(--font-geist-mono)] text-[var(--ink-strong)]">{hovered.label}</div>
          <div className="mt-0.5 text-[var(--ink-soft)] [font-variant-numeric:tabular-nums]">{hovered.detail}</div>
        </div>
      )}
    </div>
  )
}
