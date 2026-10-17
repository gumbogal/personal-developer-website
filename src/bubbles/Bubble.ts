import * as THREE from "three";
import { config } from "../config";

// This class represents a bubble in the 3D scene. It has a mesh (the visual representation of the bubble) and a velocity (the speed and direction of movement). The constructor initializes the mesh with a random position and velocity, and the update method updates the position of the bubble based on its velocity.
export class Bubble {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;

  private baseScale = 1;
  private impact = 0;
  private impactDirection = new THREE.Vector2();

  constructor(
    geometry: THREE.SphereGeometry,
    material: THREE.Material,
    outlineMaterial: THREE.Material,
  ) {
    this.mesh = new THREE.Mesh(geometry, material.clone());
    this.mesh.position.set(Math.random() * 6 - 3, Math.random() * 4 - 2, 0);

    const angle = Math.random() * Math.PI * 2;
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

    this.baseScale = scale;
    this.mesh.scale.setScalar(scale);

    const outline = new THREE.Mesh(geometry, outlineMaterial);
    this.mesh.add(outline);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: config.projectBubbles.glow.opacity,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(geometry, glowMaterial);
    glow.scale.setScalar(config.projectBubbles.glow.scale);
    this.mesh.add(glow);
  }

  applyImpact(direction: THREE.Vector2, strength: number) {
    this.impact = Math.max(this.impact, strength);
    this.impactDirection.copy(direction).normalize();
  }

  get collisionRadius(): number {
    return this.baseScale;
  }

  update() {
    // Add a tiny random force.
    const randomForceX = config.projectBubbles.movement.randomForceX;
    const randomForceY = config.projectBubbles.movement.randomForceY;
    this.velocity.x += (Math.random() - 0.5) * randomForceX;
    this.velocity.y += (Math.random() - 0.5) * randomForceY;

    // Keep the movement slow and gentle.
    this.velocity.clampLength(0, config.projectBubbles.movement.maxSpeed);

    const speed = this.velocity.length();

    const stretch =
      Math.min(speed / config.projectBubbles.movement.maxSpeed, 1) * 0.12;

    // Gradually recover from the previous impact.
    this.impact *= 0.85;

    const impactAmount = this.impact * 0.25;

    // Squash aong the impact direction and expand perpendicular to it.
    const impactAngle = Math.atan2(
      this.impactDirection.y,
      this.impactDirection.x,
    );

    this.mesh.rotation.z =
      this.impact > 0.01
        ? impactAngle
        : Math.atan2(this.velocity.y, this.velocity.x);

    const stretchX = 1 + stretch + impactAmount;
    const squashY = 1 / stretchX;

    this.mesh.scale.set(
      this.baseScale * stretchX,
      this.baseScale * squashY,
      this.baseScale,
    );

    this.mesh.position.add(this.velocity);
  }
}
