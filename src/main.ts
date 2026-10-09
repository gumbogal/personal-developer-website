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

const radius = 1;

function animate() {
  // Update sphere positions and handle collisions with bounds
  for (const bubble of bubbles) {
    bubble.update();

    if (
      bubble.mesh.position.x > bounds.x ||
      bubble.mesh.position.x < -bounds.x
    ) {
      bubble.velocity.x *= -1;
    }
    if (
      bubble.mesh.position.y > bounds.y ||
      bubble.mesh.position.y < -bounds.y
    ) {
      bubble.velocity.y *= -1;
    }
  }

  // Handle collisions between spheres
  for (let i = 0; i < bubbles.length; i++) {
    for (let j = i + 1; j < bubbles.length; j++) {
      const distance = bubbles[i].mesh.position.distanceTo(
        bubbles[j].mesh.position,
      );

      if (distance < radius * 2) {
        bubbles[i].velocity.multiplyScalar(-1);
        bubbles[j].velocity.multiplyScalar(-1);
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
