import "./style.css";
import * as THREE from "three";
import { config } from "./config";
import { Bubble } from "./bubbles/Bubble";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10121f);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bokehPass = new BokehPass(scene, camera, {
  focus: 5,
  aperture: 0.0004,
  maxblur: 0.02,
});
composer.addPass(bokehPass);

document.body.appendChild(renderer.domElement);

camera.position.z = 5;

const geometry = new THREE.SphereGeometry(1, 32, 32);

const material = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: false,
  transparent: true,
  opacity: config.projectBubbles.material.fillOpacity,
});

const outlineMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: config.projectBubbles.material.outlineOpacity,
});

// Foreground bubbles.
const bubbles: Bubble[] = [];

for (let i = 0; i < config.projectBubbles.count; i++) {
  const bubble = new Bubble(geometry, material, outlineMaterial);
  bubbles.push(bubble);
  scene.add(bubble.mesh);
}

// Background bubbles.
const backgroundBubbles: THREE.Group[] = [];
const backgroundVelocities: THREE.Vector2[] = [];
const backgroundSizes: number[] = [];
const backgroundDrift: number[] = [];

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

function placeBackgroundBubbleAnywhere(bubble: THREE.Group) {
  bubble.position.z =
    config.backgroundBubbles.appearance.depthMin +
    Math.random() *
      (config.backgroundBubbles.appearance.depthMax -
        config.backgroundBubbles.appearance.depthMin);

  const bounds = getBounds(bubble.position.z);

  const paddingX = bounds.x * 0.1;
  const paddingY = bounds.y * 0.1;

  bubble.position.x = (Math.random() * 2 - 1) * (bounds.x - paddingX);

  bubble.position.y = (Math.random() * 2 - 1) * (bounds.y - paddingY);
}

function spawnBackgroundBubble(bubble: THREE.Group): THREE.Vector2 {
  bubble.position.z =
    config.backgroundBubbles.appearance.depthMin +
    Math.random() *
      (config.backgroundBubbles.appearance.depthMax -
        config.backgroundBubbles.appearance.depthMin);

  const bounds = getBounds(bubble.position.z);
  const edge = Math.floor(Math.random() * 4);

  const x = (Math.random() * 2 - 1) * bounds.x;
  const y = (Math.random() * 2 - 1) * bounds.y;

  if (edge === 0) {
    bubble.position.set(-bounds.x, y, bubble.position.z);
    return new THREE.Vector2(1, (Math.random() - 0.5) * 0.8).normalize();
  } else if (edge === 1) {
    bubble.position.set(bounds.x, y, bubble.position.z);
    return new THREE.Vector2(-1, (Math.random() - 0.5) * 0.8).normalize();
  } else if (edge === 2) {
    bubble.position.set(x, -bounds.y, bubble.position.z);
    return new THREE.Vector2((Math.random() - 0.5) * 0.8, 1).normalize();
  } else {
    bubble.position.set(x, bounds.y, bubble.position.z);
    return new THREE.Vector2((Math.random() - 0.5) * 0.8, -1).normalize();
  }
}

for (let i = 0; i < config.backgroundBubbles.count; i++) {
  const bubble = new THREE.Group();
  const scale =
    config.backgroundBubbles.appearance.sizeMin +
    Math.random() *
      (config.backgroundBubbles.appearance.sizeMax -
        config.backgroundBubbles.appearance.sizeMin);
  const drift =
    config.backgroundBubbles.movement.driftMin +
    Math.random() *
      (config.backgroundBubbles.movement.driftMax -
        config.backgroundBubbles.movement.driftMin);

  backgroundSizes.push(scale);
  backgroundDrift.push(drift);

  const fill = new THREE.Mesh(geometry, backgroundFillMaterial);
  const outline = new THREE.Mesh(geometry, backgroundOutlineMaterial);

  bubble.add(fill);
  bubble.add(outline);

  bubble.scale.setScalar(scale);

  placeBackgroundBubbleAnywhere(bubble);

  const direction = new THREE.Vector2(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
  ).normalize();

  const speed =
    config.backgroundBubbles.movement.speedMin +
    Math.random() *
      (config.backgroundBubbles.movement.speedMax -
        config.backgroundBubbles.movement.speedMin);

  backgroundVelocities.push(direction.multiplyScalar(speed));

  backgroundBubbles.push(bubble);
  scene.add(bubble);
}

function getBounds(z = 0) {
  const distance = camera.position.z - z;
  const vertical =
    2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
  const horizontal = vertical * camera.aspect;
  return { x: horizontal / 2, y: vertical / 2 };
}

const bounds = getBounds();

function animate() {
  // Update sphere positions and handle collisions with bounds
  for (const bubble of bubbles) {
    bubble.update();

    const radius = bubble.mesh.scale.x;

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

  // Handle collisions between spheres
  for (let i = 0; i < bubbles.length; i++) {
    for (let j = i + 1; j < bubbles.length; j++) {
      const bubbleA = bubbles[i];
      const bubbleB = bubbles[j];

      const direction = new THREE.Vector3().subVectors(
        bubbleB.mesh.position,
        bubbleA.mesh.position,
      );

      const distance = direction.length();
      const minDistance = bubbleA.mesh.scale.x + bubbleB.mesh.scale.x;

      if (distance < minDistance && distance > 0) {
        direction.normalize();

        // Separate overlapping bubbles.
        const overlap = minDistance - distance;

        bubbleA.mesh.position.addScaledVector(direction, -overlap / 2);
        bubbleB.mesh.position.addScaledVector(direction, overlap / 2);

        // Only exchange momentum if the bubbles are approaching each other.
        const relativeVelocity = bubbleB.velocity.clone().sub(bubbleA.velocity);
        const speedAlongCollision = relativeVelocity.dot(direction);

        if (speedAlongCollision < 0) {
          const impulse = direction.clone().multiplyScalar(speedAlongCollision);
          bubbleA.velocity.add(impulse);
          bubbleB.velocity.sub(impulse);
        }
      }
    }
  }

  // Animate background bubbles with a gentle floating effect. The bubbles will move slowly to the right and oscillate up and down using a sine wave.
  const time = Date.now() * 0.001;
  for (let i = 0; i < backgroundBubbles.length; i++) {
    const bubble = backgroundBubbles[i];
    const velocity = backgroundVelocities[i];
    const baseSize = backgroundSizes[i];

    const driftFrequency = config.backgroundBubbles.movement.driftFrequency;
    const drift = Math.sin(time * driftFrequency + i) * backgroundDrift[i];

    bubble.position.x += velocity.x + drift;
    bubble.position.y +=
      velocity.y + Math.cos(time * driftFrequency + i) * backgroundDrift[i];

    const pulse =
      1 +
      Math.sin(
        time * config.backgroundBubbles.appearance.pulseFrequency +
          i * config.backgroundBubbles.appearance.pulsePhaseOffset,
      ) *
        config.backgroundBubbles.appearance.pulseAmplitude;
    bubble.scale.setScalar(baseSize * pulse);

    const bounds = getBounds(bubble.position.z);
    const margin = bubble.scale.x;

    if (
      bubble.position.x > bounds.x + margin ||
      bubble.position.x < -bounds.x - margin ||
      bubble.position.y > bounds.y + margin ||
      bubble.position.y < -bounds.y - margin
    ) {
      const direction = spawnBackgroundBubble(bubble);
      const speed =
        config.backgroundBubbles.movement.speedMin +
        Math.random() *
          (config.backgroundBubbles.movement.speedMax -
            config.backgroundBubbles.movement.speedMin);

      velocity.copy(direction).multiplyScalar(speed);
    }
  }

  composer.render();
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
