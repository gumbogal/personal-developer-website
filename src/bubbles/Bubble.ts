import * as THREE from "three";
import { config } from "../config";

// This class represents a bubble in the 3D scene. It has a mesh (the visual representation of the bubble) and a velocity (the speed and direction of movement). The constructor initializes the mesh with a random position and velocity, and the update method updates the position of the bubble based on its velocity.
export class Bubble {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;

  constructor(
    geometry: THREE.SphereGeometry,
    material: THREE.Material,
    outlineMaterial: THREE.Material,
  ) {
    this.mesh = new THREE.Mesh(geometry, material.clone());
    this.mesh.position.set(Math.random() * 6 - 3, Math.random() * 4 - 2, 0);

    const angle = Math.random() * 2 * Math.PI * 2;
    const speed =
      config.projectBubbles.movement.speedMin +
      Math.random() *
        (config.projectBubbles.movement.speedMax -
          config.projectBubbles.movement.speedMin);

    this.velocity = new THREE.Vector3(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      0,
    );

    const colors = config.projectBubbles.colors;
    const color = colors[Math.floor(Math.random() * colors.length)];

    const bubbleMaterial = this.mesh.material as THREE.MeshBasicMaterial;
    bubbleMaterial.color.setHex(color);

    // Eventually, the scale will be set by some representation of importance to me.
    const scale =
      config.projectBubbles.appearance.sizeMin +
      Math.random() *
        (config.projectBubbles.appearance.sizeMax -
          config.projectBubbles.appearance.sizeMin);
    this.mesh.scale.setScalar(scale);
    const outline = new THREE.Mesh(geometry, outlineMaterial);
    this.mesh.add(outline);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(geometry, glowMaterial);
    glow.scale.setScalar(1.15);
    this.mesh.add(glow);
  }

  update() {
    // Add a tiny random force.
    const randomForce = config.projectBubbles.movement.randomForce;
    this.velocity.x += (Math.random() - 0.5) * randomForce;
    this.velocity.y += (Math.random() - 0.5) * randomForce;

    // Keep the movement slow and gentle.
    this.velocity.clampLength(0, config.projectBubbles.movement.maxSpeed);
    this.mesh.position.add(this.velocity);
  }
}
