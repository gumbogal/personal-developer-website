import "./style.css";
import * as THREE from "three";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { Bubble } from "./bubbles/Bubble";
import { config } from "./config";

interface BackgroundBubbleState {
  mesh: THREE.Group;
  velocity: THREE.Vector2;
  baseSize: number;
  drift: number;
  impact: number;
  impactDirection: THREE.Vector2;
  depthPhase: number;
  depthSpeed: number;
  depthProgress: number;
  depthDirection: 1 | -1;
  travelsInDepth: boolean;
  hasCompletedInitialPlacement: boolean;
}

interface ViewportBounds {
  x: number;
  y: number;
}

// Scene, camera, and post-processing.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10121f);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(
  new BokehPass(scene, camera, {
    focus: 5,
    aperture: 0.0004,
    maxblur: 0.02,
  }),
);

// Shared sphere geometry and foreground bubble materials.
const geometry = new THREE.SphereGeometry(1, 32, 32);

const projectBubbleMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: config.projectBubbles.material.fillOpacity,
});

const projectBubbleOutlineMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: config.projectBubbles.material.outlineOpacity,
});

// Foreground bubbles use the Bubble class for movement and collisions.
const projectBubbles: Bubble[] = [];

for (let index = 0; index < config.projectBubbles.count; index++) {
  const bubble = new Bubble(
    geometry,
    projectBubbleMaterial,
    projectBubbleOutlineMaterial,
  );
  projectBubbles.push(bubble);
  scene.add(bubble.mesh);
}

// Background bubbles share materials, while their motion data stays together.
const backgroundFillMaterial = new THREE.MeshBasicMaterial({
  color: config.backgroundBubbles.colors.fill,
  transparent: true,
  opacity: config.backgroundBubbles.material.fillOpacity,
  depthWrite: false,
});

const backgroundOutlineMaterial = new THREE.MeshBasicMaterial({
  color: config.backgroundBubbles.colors.outline,
  transparent: true,
  opacity: config.backgroundBubbles.material.outlineOpacity,
  wireframe: true,
  depthWrite: false,
});

const backgroundBubbleStates: BackgroundBubbleState[] = [];

// Fade background bubbles as they approach the foreground layer.
const fadeStartZ = -2;
const fadeEndZ = 0;

// Convert a bubble's depth into the horizontal and vertical camera bounds.
function getViewportBounds(z = 0): ViewportBounds {
  const distance = camera.position.z - z;
  const vertical =
    2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
  const horizontal = vertical * camera.aspect;

  return { x: horizontal / 2, y: vertical / 2 };
}

// Place a new background bubble within the visible area at a random depth.
function placeBackgroundBubble(mesh: THREE.Group): void {
  const { depthMin, depthMax, initialPadding } =
    config.backgroundBubbles.appearance;

  mesh.position.z = depthMin + Math.random() * (depthMax - depthMin);

  const bounds = getViewportBounds(mesh.position.z);
  const paddingX = bounds.x * initialPadding;
  const paddingY = bounds.y * initialPadding;

  mesh.position.x = (Math.random() * 2 - 1) * (bounds.x - paddingX);
  mesh.position.y = (Math.random() * 2 - 1) * (bounds.y - paddingY);
}

// Respawn a bubble just outside a random edge and point it back into view.
function spawnBackgroundBubble(mesh: THREE.Group): THREE.Vector2 {
  const { spawnPadding } = config.backgroundBubbles.appearance;

  const bounds = getViewportBounds(mesh.position.z);
  const edge = Math.floor(Math.random() * 4);
  const x = (Math.random() * 2 - 1) * bounds.x;
  const y = (Math.random() * 2 - 1) * bounds.y;

  if (edge === 0) {
    mesh.position.set(-bounds.x - spawnPadding, y, mesh.position.z);
    return new THREE.Vector2(1, (Math.random() - 0.5) * 0.8).normalize();
  }

  if (edge === 1) {
    mesh.position.set(bounds.x + spawnPadding, y, mesh.position.z);
    return new THREE.Vector2(-1, (Math.random() - 0.5) * 0.8).normalize();
  }

  if (edge === 2) {
    mesh.position.set(x, -bounds.y - spawnPadding, mesh.position.z);
    return new THREE.Vector2((Math.random() - 0.5) * 0.8, 1).normalize();
  }

  mesh.position.set(x, bounds.y + spawnPadding, mesh.position.z);
  return new THREE.Vector2((Math.random() - 0.5) * 0.8, -1).normalize();
}

// Create the background bubble meshes and initialize their motion once.
for (let index = 0; index < config.backgroundBubbles.count; index++) {
  const mesh = new THREE.Group();
  const { sizeMin, sizeMax, depthTravelChance } =
    config.backgroundBubbles.appearance;
  const {
    driftMin,
    driftMax,
    speedMin,
    speedMax,
    depthSpeedMin,
    depthSpeedMax,
  } = config.backgroundBubbles.movement;

  const baseSize = sizeMin + Math.random() * (sizeMax - sizeMin);
  const drift = driftMin + Math.random() * (driftMax - driftMin);
  const direction = new THREE.Vector2(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
  ).normalize();
  const speed = speedMin + Math.random() * (speedMax - speedMin);

  mesh.add(
    new THREE.Mesh(geometry, backgroundFillMaterial.clone()),
    new THREE.Mesh(geometry, backgroundOutlineMaterial.clone()),
  );
  mesh.scale.setScalar(baseSize);
  placeBackgroundBubble(mesh);

  backgroundBubbleStates.push({
    mesh,
    velocity: direction.multiplyScalar(speed),
    baseSize,
    drift,
    impact: 0,
    impactDirection: new THREE.Vector2(),
    depthPhase: Math.random() * Math.PI * 2,
    depthSpeed: depthSpeedMin + Math.random() * (depthSpeedMax - depthSpeedMin),
    depthProgress: Math.random(),
    depthDirection: Math.random() < 0.5 ? 1 : -1,
    travelsInDepth: Math.random() < depthTravelChance,
    hasCompletedInitialPlacement: false,
  });

  scene.add(mesh);
}

// Advance foreground bubbles and keep them inside the current viewport.
function updateProjectBubbles(bounds: ViewportBounds): void {
  for (const bubble of projectBubbles) {
    bubble.update();

    const radius = bubble.collisionRadius;

    if (bubble.mesh.position.x > bounds.x - radius) {
      bubble.mesh.position.x = bounds.x - radius;
      bubble.velocity.x = -Math.abs(bubble.velocity.x);
    }

    if (bubble.mesh.position.x < -bounds.x + radius) {
      bubble.mesh.position.x = -bounds.x + radius;
      bubble.velocity.x = Math.abs(bubble.velocity.x);
    }

    if (bubble.mesh.position.y > bounds.y - radius) {
      bubble.mesh.position.y = bounds.y - radius;
      bubble.velocity.y = -Math.abs(bubble.velocity.y);
    }

    if (bubble.mesh.position.y < -bounds.y + radius) {
      bubble.mesh.position.y = -bounds.y + radius;
      bubble.velocity.y = Math.abs(bubble.velocity.y);
    }
  }
}

// Separate overlapping foreground bubbles and exchange their velocity along
// the collision direction when they are moving toward one another.
function resolveProjectBubbleCollisions(): void {
  for (let firstIndex = 0; firstIndex < projectBubbles.length; firstIndex++) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < projectBubbles.length;
      secondIndex++
    ) {
      const first = projectBubbles[firstIndex];
      const second = projectBubbles[secondIndex];
      const direction = new THREE.Vector3().subVectors(
        second.mesh.position,
        first.mesh.position,
      );
      const distance = direction.length();
      const minimumDistance = first.collisionRadius + second.collisionRadius;

      if (distance >= minimumDistance || distance === 0) {
        continue;
      }

      direction.normalize();

      const overlap = minimumDistance - distance;
      first.mesh.position.addScaledVector(direction, -overlap / 2);
      second.mesh.position.addScaledVector(direction, overlap / 2);

      const relativeVelocity = second.velocity.clone().sub(first.velocity);
      const speedAlongCollision = relativeVelocity.dot(direction);

      if (speedAlongCollision >= 0) {
        continue;
      }

      const impulse = direction.clone().multiplyScalar(speedAlongCollision);
      first.velocity.add(impulse);
      second.velocity.sub(impulse);

      const impactStrength = Math.min(Math.abs(speedAlongCollision) * 20, 1);
      const impactDirection = new THREE.Vector2(direction.x, direction.y);

      first.applyImpact(impactDirection, impactStrength);
      second.applyImpact(impactDirection.clone().negate(), impactStrength);
    }
  }
}

// Move, pulse, and stretch background bubbles, then respawn those that leave
// the viewport. The depth path is sampled from each bubble's stored state.
function updateBackgroundBubbles(time: number, deltaTime: number): void {
  const appearance = config.backgroundBubbles.appearance;
  const movement = config.backgroundBubbles.movement;
  const depthMin = appearance.depthPathMin;
  const depthMax = Math.min(appearance.depthPathMax, 0);
  const depthRange = depthMax - depthMin;

  for (let index = 0; index < backgroundBubbleStates.length; index++) {
    const state = backgroundBubbleStates[index];
    const { mesh, velocity, baseSize } = state;

    if (state.travelsInDepth) {
      state.depthProgress +=
        (state.depthDirection * state.depthSpeed * deltaTime) / depthRange;

      if (state.depthProgress >= 1) {
        state.depthProgress = 1;
        state.depthDirection = -1;
      }

      if (state.depthProgress <= 0) {
        state.depthProgress = 0;
        state.depthDirection = 1;
      }

      mesh.position.z = depthMin + state.depthProgress * depthRange;

      if (!state.hasCompletedInitialPlacement) {
        const bounds = getViewportBounds(mesh.position.z);
        const padding = 0.15;

        mesh.position.x = (Math.random() * 2 - 1) * bounds.x * (1 - padding);
        mesh.position.y = (Math.random() * 2 - 1) * bounds.y * (1 - padding);

        state.hasCompletedInitialPlacement = true;
      }
    }

    const driftOffset =
      Math.sin(time * movement.driftFrequency + index) * state.drift;
    const frameScale = deltaTime * 60;

    mesh.position.x += (velocity.x + driftOffset) * frameScale;
    mesh.position.y +=
      (velocity.y +
        Math.cos(time * movement.driftFrequency + index) * state.drift) *
      frameScale;

    const pulse =
      1 +
      Math.sin(
        time * appearance.pulseFrequency + index * appearance.pulsePhaseOffset,
      ) *
        appearance.pulseAmplitude;
    const speed = velocity.length();
    const stretch = Math.min(speed / movement.speedMax, 1) * 0.12;

    state.impact *= 0.85;
    const impactAmount = state.impact * 0.25;
    const impactAngle = Math.atan2(
      state.impactDirection.y,
      state.impactDirection.x,
    );
    const stretchX = 1 + stretch + impactAmount;
    const squashY = 1 / stretchX;

    mesh.rotation.z =
      state.impact > 0.01 ? impactAngle : Math.atan2(velocity.y, velocity.x);
    const visualSize = baseSize * pulse;
    mesh.scale.set(visualSize * stretchX, visualSize * squashY, visualSize);

    // Fade bubbles as they approach the foreground project layer.
    const opacityMultiplier =
      1 - THREE.MathUtils.smoothstep(mesh.position.z, fadeStartZ, fadeEndZ);

    // Fade both the fill and outline together.
    const fill = mesh.children[0] as THREE.Mesh;
    const outline = mesh.children[1] as THREE.Mesh;

    (fill.material as THREE.MeshBasicMaterial).opacity =
      config.backgroundBubbles.material.fillOpacity * opacityMultiplier;

    (outline.material as THREE.MeshBasicMaterial).opacity =
      config.backgroundBubbles.material.outlineOpacity * opacityMultiplier;

    const bounds = getViewportBounds(mesh.position.z);
    const margin = Math.max(mesh.scale.x, appearance.spawnPadding);
    const hasLeftViewport =
      mesh.position.x > bounds.x + margin ||
      mesh.position.x < -bounds.x - margin ||
      mesh.position.y > bounds.y + margin ||
      mesh.position.y < -bounds.y - margin;

    if (hasLeftViewport) {
      const previousZ = mesh.position.z;
      const direction = spawnBackgroundBubble(mesh);
      if (!state.travelsInDepth) {
        mesh.position.z = previousZ;
      }
      const respawnSpeed =
        movement.speedMin +
        Math.random() * (movement.speedMax - movement.speedMin);
      velocity.copy(direction).multiplyScalar(respawnSpeed);
    }
  }
}

// Background collisions add a small impact squash and exchange velocity along
// the collision axis. Unlike the foreground, bubbles are not pushed apart.
function resolveBackgroundBubbleCollisions(): void {
  for (
    let firstIndex = 0;
    firstIndex < backgroundBubbleStates.length;
    firstIndex++
  ) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < backgroundBubbleStates.length;
      secondIndex++
    ) {
      const first = backgroundBubbleStates[firstIndex];
      const second = backgroundBubbleStates[secondIndex];
      const direction = new THREE.Vector2(
        second.mesh.position.x - first.mesh.position.x,
        second.mesh.position.y - first.mesh.position.y,
      );

      const depthDistance = Math.abs(
        second.mesh.position.z - first.mesh.position.z,
      );

      const minimumDistance = first.baseSize + second.baseSize;
      const distance = direction.length();

      // Don't collide if the bubbles are too far apart in depth.
      if (depthDistance >= minimumDistance || distance === 0) {
        continue;
      }

      // Calculate the required separation in the X/Y plane.
      const minimumXYDistance = Math.sqrt(
        minimumDistance * minimumDistance - depthDistance * depthDistance,
      );

      if (distance >= minimumXYDistance || distance === 0) {
        continue;
      }

      direction.normalize();

      const overlap = minimumXYDistance - distance;

      // Separate overlapping bubbles so they don't remain stuck and repeatedly trigger collision impulses.
      first.mesh.position.x -= (direction.x * overlap) / 2;
      first.mesh.position.y -= (direction.y * overlap) / 2;
      second.mesh.position.x += (direction.x * overlap) / 2;
      second.mesh.position.y += (direction.y * overlap) / 2;

      const relativeVelocity = second.velocity.clone().sub(first.velocity);
      const speedAlongCollision = relativeVelocity.dot(direction);

      if (speedAlongCollision >= 0) {
        continue;
      }

      const impactStrength = Math.min(Math.abs(speedAlongCollision) * 20, 1);
      first.impact = Math.max(first.impact, impactStrength);
      second.impact = Math.max(second.impact, impactStrength);
      first.impactDirection.copy(direction);
      second.impactDirection.copy(direction).negate();

      const impulse = direction.clone().multiplyScalar(speedAlongCollision);
      first.velocity.add(impulse);
      second.velocity.sub(impulse);
    }
  }
}

let previousFrameTime = 0;

// Run the simulation and render one frame, then schedule the next frame.
function animate(timestamp: number = performance.now()): void {
  const bounds = getViewportBounds();
  const time = timestamp * 0.001;

  const deltaTime =
    previousFrameTime === 0
      ? 0
      : Math.min((timestamp - previousFrameTime) / 1000, 0.05);

  previousFrameTime = timestamp;

  updateProjectBubbles(bounds);
  resolveProjectBubbleCollisions();
  updateBackgroundBubbles(time, deltaTime);
  resolveBackgroundBubbleCollisions();

  composer.render();
  requestAnimationFrame(animate);
}

// Keep the camera projection and renderer dimensions in sync with the window.
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

animate();
