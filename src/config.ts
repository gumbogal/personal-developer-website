export const config = {
  backgroundBubbles: {
    count: 500, // Number of background bubbles to generate.
    movement: {
      speedMin: 0.001, // Minimum speed of the background bubbles.
      speedMax: 0.006, // Maximum speed of the background bubbles.

      driftMin: 0.000001, // Minimum drift amount for the background bubbles.
      driftMax: 0.0005, // Maximum drift amount for the background bubbles.
      driftFrequency: 0.25, // Frequency of the drift oscillation for the background bubbles.
    },
    appearance: {
      sizeMin: 0.15, // Minimum size of the background bubbles.
      sizeMax: 0.5, // Maximum size of the background bubbles.

      pulseAmplitude: 0.05, // Amplitude of the pulsing effect for the background bubbles.
      pulseFrequency: 5, // Frequency of the pulsing effect for the background bubbles.
      pulsePhaseOffset: 1.2, // Phase offset for the pulsing effect of the background bubbles.

      depthMin: -100, // Minimum depth (z-position) of the background bubbles.
      depthMax: -2, // Maximum depth (z-position) of the background bubbles.
    },
    material: {
      fillOpacity: 0.6, // Opacity of the fill material for the background bubbles.
      outlineOpacity: 0.22, // Opacity of the outline material for the background bubbles.
    },
    colors: {
      fill: 0x7197d1, // Fill color of the background bubbles.
      outline: 0x9bcfff, // Outline color of the background bubbles.
    },
  },

  projectBubbles: {
    count: 5, // Number of project bubbles to generate.
    movement: {
      speedMin: 0.001, // Minimum speed of the project bubbles.
      speedMax: 0.006, // Maximum speed of the project bubbles.
      maxSpeed: 0.015, // Maximum speed of the project bubbles.
      randomForce: 0.0005, // Random force applied to the project bubbles for gentle movement.
    },
    appearance: {
      sizeMin: 0.6, // Minimum size of the project bubbles.
      sizeMax: 1.2, // Maximum size of the project bubbles.
    },
    colors: [0x8ecae6, 0xffafcc, 0xcdb4db, 0xb7e4c7, 0xffd6a5],
    material: {
      fillOpacity: 0.3, // Opacity of the fill material for the project bubbles.
      outlineOpacity: 0.5, // Opacity of the outline material for the project bubbles.
    },
  },
};
