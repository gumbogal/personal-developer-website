import "./style.css";
import * as THREE from "three";
import { Bubble } from "./bubbles/Bubble";

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

document.body.appendChild(renderer.domElement);

camera.position.z = 5;

const geometry = new THREE.SphereGeometry(1, 32, 32);

const material = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: false,
  transparent: true,
  opacity: 0.3,
});

const outlineMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.5,
});

const bubbles: Bubble[] = [];

for (let i = 0; i < 5; i++) {
  const bubble = new Bubble(geometry, material, outlineMaterial);
  bubbles.push(bubble);
  scene.add(bubble.mesh);
}

const bounds = {
  x: 4,
  y: 3,
};

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

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
