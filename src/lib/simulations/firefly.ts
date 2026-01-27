import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'firefly',
  name: 'Firefly Synchronization',
  description: 'Coupled oscillators achieving spontaneous synchrony',
  width: 800,
  height: 600,
  targetFPS: 30,
};

const CELL_SIZE = 8;
const PHASE_SPEED = 0.01;
const COUPLING = 0.05;

export function createFirefly(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let cols = 0;
  let rows = 0;
  let phases: Float32Array = new Float32Array(0);
  let nextPhases: Float32Array = new Float32Array(0);

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function idx(x: number, y: number): number {
    return y * cols + x;
  }

  function initializePhases(): void {
    const size = cols * rows;
    phases = new Float32Array(size);
    nextPhases = new Float32Array(size);

    for (let i = 0; i < size; i++) {
      phases[i] = Math.random();
    }
  }

  function getNeighbors(x: number, y: number): number[] {
    const neighbors: number[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = (x + dx + cols) % cols;
        const ny = (y + dy + rows) % rows;
        neighbors.push(idx(nx, ny));
      }
    }
    return neighbors;
  }

  function updatePhases(): void {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = idx(x, y);
        let phase = phases[i];

        // Increment phase
        phase += PHASE_SPEED;

        // Check if firefly flashed
        if (phase >= 1.0) {
          phase = 0.0;

          // Nudge all 8 neighbors forward in their cycle
          const neighbors = getNeighbors(x, y);
          for (const ni of neighbors) {
            nextPhases[ni] = Math.min(1.0, phases[ni] + COUPLING);
          }
        }

        nextPhases[i] = phase;
      }
    }

    // Apply updates - only update neighbors that were nudged by a flash
    for (let i = 0; i < phases.length; i++) {
      if (nextPhases[i] !== phases[i]) {
        phases[i] = nextPhases[i];
      }
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);

      initializePhases();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;
      updatePhases();
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = idx(x, y);
          const phase = phases[i];

          // Use phase^4 for brightness - makes flash sharp and brief
          const brightness = Math.pow(phase, 4);

          if (brightness > 0.01) {
            const r = Math.floor(brightness * 127);
            const g = Math.floor(brightness * 255);
            const b = 0;
            const alpha = Math.floor(brightness * 255);

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

            // Draw as circle for softer look
            ctx.beginPath();
            ctx.arc(
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
              CELL_SIZE / 2 - 1,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      initializePhases();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      phases = new Float32Array(0);
      nextPhases = new Float32Array(0);
    },
  };
}
