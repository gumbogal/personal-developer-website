import * as THREE from "three";

// This class represents a bubble in the 3D scene. It has a mesh (the visual representation of the bubble) and a velocity (the speed and direction of movement). The constructor initializes the mesh with a random position and velocity, and the update method updates the position of the bubble based on its velocity.
export class Bubble {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;

  constructor(geometry: THREE.SphereGeometry, material: THREE.Material) {
    this.mesh = new THREE.Mesh(geometry, material);

    this.mesh.position.set(Math.random() * 6 - 3, Math.random() * 4 - 2, 0);

    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      0,
    );
  }

  update() {
    this.mesh.position.add(this.velocity);
  }
}
