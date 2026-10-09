import * as THREE from "three";

// This class represents a bubble in the 3D scene. It has a mesh (the visual representation of the bubble) and a velocity (the speed and direction of movement). The constructor initializes the mesh with a random position and velocity, and the update method updates the position of the bubble based on its velocity.
export class Bubble {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;

  constructor(geometry: THREE.SphereGeometry, material: THREE.Material) {
    this.mesh = new THREE.Mesh(geometry, material.clone());

    this.mesh.position.set(Math.random() * 6 - 3, Math.random() * 4 - 2, 0);

    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      0,
    );

    const colors = [0x8ecae6, 0xffafcc, 0xcdb4db, 0xb7e4c7, 0xffd6a5];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const bubbleMaterial = this.mesh.material as THREE.MeshBasicMaterial;
    bubbleMaterial.color.setHex(color);

    // Eventually, the scale will be set by some representation of importance to me.
    const scale = 0.6 * Math.random() * colors.length;
    this.mesh.scale.setScalar(scale);
  }

  update() {
    this.mesh.position.add(this.velocity);
  }
}
