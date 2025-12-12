import * as THREE from 'three'
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh'
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg'

/** CONFIG **/
const SEGMENT_LENGTH = 10
const VISIBLE_SEGMENTS = 8
const SCROLL_SPEED = 0.12
const ROAD_WIDTH = 8
const CUBE_SIZE = 1
const LANE_OFFSET = 1.2
const JUMP_FORCE = 0.2
const GRAVITY = -0.01

// Enable BVH accelerated raycast + helpers
THREE.Mesh.prototype.raycast = acceleratedRaycast
THREE.BufferGeometry.prototype.computeBoundsTree = MeshBVH.prototype.build
THREE.BufferGeometry.prototype.disposeBoundsTree = MeshBVH.prototype.dispose

export default function initThree(canvasEl) {
  /** SCENE & CAMERA **/
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x222222)

  const camera = new THREE.PerspectiveCamera(
    75,
    canvasEl.clientWidth / canvasEl.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 5, 10)
  camera.lookAt(0, 1, 0)

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true })
  renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight)

  /** LIGHTS **/
  scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 1))
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(2, 5, 4)
  scene.add(dir)

  /** PLAYER CUBE **/
  const cubeGeometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)
  const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffcc })
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
  cube.position.set(0, 1, 0)
  scene.add(cube)

  let targetX = 0
  let targetY = 1
  let verticalVelocity = 0

  /** SCORE COUNTER **/
  let score = 0
  const scoreDiv = document.createElement('div')
  scoreDiv.style.position = 'absolute'
  scoreDiv.style.top = '10px'
  scoreDiv.style.left = '50%'
  scoreDiv.style.transform = 'translateX(-50%)'
  scoreDiv.style.color = '#fff'
  scoreDiv.style.fontSize = '24px'
  scoreDiv.innerText = 'Score: 0'
  document.body.appendChild(scoreDiv)

  /** WSAD CONTROLS **/
  const keys = { w: false, a: false, s: false, d: false, ' ': false }
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase()
    if (keys.hasOwnProperty(k)) keys[k] = true
  })
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase()
    if (keys.hasOwnProperty(k)) keys[k] = false
  })

  /** MOUSE / TOUCH **/
  let isDragging = false
  let dragOffset = new THREE.Vector2()
  let isRotating = false
  let rotateStartX = 0
  let isGameOver = false

  canvasEl.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      const rect = canvasEl.getBoundingClientRect()
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera({ x: mouseX, y: mouseY }, camera)
      const intersects = raycaster.intersectObject(cube)
      if (intersects.length > 0) {
        isDragging = true
        dragOffset.set(
          intersects[0].point.x - cube.position.x,
          intersects[0].point.y - cube.position.y
        )
      } else {
        isRotating = true
        rotateStartX = e.clientX
      }
    } else if (e.button === 2) {
      isRotating = true
      rotateStartX = e.clientX
    }
  })

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const rect = canvasEl.getBoundingClientRect()
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1
      const vector = new THREE.Vector3(mouseX, mouseY, 0.5)
      vector.unproject(camera)
      const dir = vector.sub(camera.position).normalize()
      const distance = (cube.position.z - camera.position.z) / dir.z
      const pos = camera.position.clone().add(dir.multiplyScalar(distance))
      targetX = pos.x - dragOffset.x
      targetY = pos.y - dragOffset.y
    }
    if (isRotating) {
      const deltaX = e.clientX - rotateStartX
      camera.rotation.y -= deltaX * 0.002
      rotateStartX = e.clientX
    }
  })

  window.addEventListener('mouseup', () => {
    isDragging = false
    isRotating = false
  })

  canvasEl.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const rect = canvasEl.getBoundingClientRect()
      const mouseX = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1
      const mouseY = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1
      const vector = new THREE.Vector3(mouseX, mouseY, 0.5)
      vector.unproject(camera)
      const dir = vector.sub(camera.position).normalize()
      const distance = (cube.position.z - camera.position.z) / dir.z
      const pos = camera.position.clone().add(dir.multiplyScalar(distance))
      targetX = pos.x
      targetY = pos.y
    }
  })

  /** ROAD SEGMENTS **/
  const roadSegments = []
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.2 })
  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  const gateMaterial = new THREE.MeshStandardMaterial({ color: 0xaa2222 })

  function createGateWithHole() {
    const frameGeom = new THREE.BoxGeometry(ROAD_WIDTH, 4, 0.6)
    const holeGeom = new THREE.BoxGeometry(3, 3, 0.6)
    const brushA = new Brush(frameGeom)
    const brushB = new Brush(holeGeom)

    brushB.position.set(
      THREE.MathUtils.randFloatSpread(ROAD_WIDTH - 3),
      THREE.MathUtils.randFloatSpread(3 - 3),
      0
    )
    brushB.updateMatrixWorld(true)

    const evaluator = new Evaluator()
    const resultBrush = evaluator.evaluate(brushA, brushB, SUBTRACTION)
    const cut = new THREE.Mesh(resultBrush.geometry, gateMaterial)
    // if (!(cut.geometry instanceof THREE.BufferGeometry))
    //   cut.geometry = new THREE.BufferGeometry().fromGeometry(cut.geometry)
    // if (cut.geometry.computeBoundsTree) cut.geometry.computeBoundsTree() // BVH for triangle-level collision
    return cut
  }

  function createRoadSegment(index) {
    const group = new THREE.Group()
    const planeGeom = new THREE.BoxGeometry(ROAD_WIDTH, 0, SEGMENT_LENGTH)
    const plane = new THREE.Mesh(planeGeom, roadMaterial)
    plane.position.y = 0
    group.add(plane)

    const stripeGeom = new THREE.BoxGeometry(0.2, 0, SEGMENT_LENGTH * 0.8)
    const stripe = new THREE.Mesh(stripeGeom, lineMaterial)
    stripe.position.y = 0.06
    group.add(stripe)

    // const gate = createGateWithHole()
    // gate.position.set(0, 1, -SEGMENT_LENGTH * 0.5)
    // group.add(gate)

    group.position.z = -index * SEGMENT_LENGTH
    scene.add(group)
    return group
  }

  for (let i = 0; i < VISIBLE_SEGMENTS; i++) roadSegments.push(createRoadSegment(i))

  /** COLLISION DETECTION USING BVH **/
  const cubeBox = new THREE.Box3()
  const cubeVertices = []
  cubeGeometry.attributes.position.array.forEach((v, i) => {
    if (i % 3 === 0)
      cubeVertices.push(new THREE.Vector3(
        cubeGeometry.attributes.position.array[i],
        cubeGeometry.attributes.position.array[i + 1],
        cubeGeometry.attributes.position.array[i + 2]
      ))
  })

  function checkCollisions() {
    cubeBox.setFromObject(cube)
    for (const segment of roadSegments) {
      const gate = segment.children[2]

      // Use raycast from cube center to gate
      const origin = cube.position.clone()
      const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
      ]

      for (const dir of directions) {
        const raycaster = new THREE.Raycaster(origin, dir, 0, 1)
        const intersects = raycaster.intersectObject(gate, true)
        if (intersects.length > 0) {
          // isGameOver = true
          console.log('💥 COLLISION!')
          return true
        }
      }
    }
    return false
  }

  /** ANIMATION LOOP **/
  function animate() {
    if (isGameOver) return
    requestAnimationFrame(animate)

    // WSAD movement + rolling
    if (keys.a) {
      targetX -= LANE_OFFSET * 0.05
      cube.rotation.z += 0.1
    }
    if (keys.d) {
      targetX += LANE_OFFSET * 0.05
      cube.rotation.z -= 0.1
    }
    if (keys.w) {
      targetY += LANE_OFFSET * 0.05
      cube.rotation.x -= 0.1
    }
    if (keys.s) {
      targetY -= LANE_OFFSET * 0.05
      cube.rotation.x += 0.1
    }

    // Jump
    if (keys[' '] && cube.position.y <= 1.01) verticalVelocity = JUMP_FORCE
    verticalVelocity += GRAVITY
    targetY += verticalVelocity
    if (targetY < 1) {
      targetY = 1
      verticalVelocity = 0
    }

    // Clamp
    targetX = Math.max(-ROAD_WIDTH / 2 + 0.5, Math.min(ROAD_WIDTH / 2 - 0.5, targetX))
    targetY = Math.max(1, Math.min(3, targetY))

    cube.position.x += (targetX - cube.position.x) * 0.2
    cube.position.y += (targetY - cube.position.y) * 0.2

    // Move road
    for (const seg of roadSegments) seg.position.z += SCROLL_SPEED

    // Recycle road
    const first = roadSegments[0]
    if (first.position.z > camera.position.z + 2) {
      const last = roadSegments[roadSegments.length - 1]
      first.position.z = last.position.z - SEGMENT_LENGTH
      first.remove(first.children[2])
      const newGate = createGateWithHole()
      newGate.position.set(0, 1.5, -SEGMENT_LENGTH * 0.5)
      first.add(newGate)
      roadSegments.push(first)
      roadSegments.shift()

      // Increase score if passed
      if (!checkCollisions()) {
        score++
        scoreDiv.innerText = `Score: ${score}`
      }
    }

    checkCollisions()
    renderer.render(scene, camera)
  }

  animate()
}
