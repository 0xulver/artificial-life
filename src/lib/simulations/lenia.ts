import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'lenia',
  name: 'Lenia',
  description: 'Continuous cellular automaton with lifelike emergent creatures',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const CELL_SIZE = 2;

export function createLenia(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let cols = 0;
  let rows = 0;
  let grid: Float32Array = new Float32Array(0);
  let nextGrid: Float32Array = new Float32Array(0);
  let kernel: Float32Array = new Float32Array(0);
  let kernelRadius = 0;
  let kernelSize = 0;

  const R = 13;
  const T = 10;
  const mu = 0.15;
  const sigma = 0.015;
  const rho = 0.5;
  const omega = 0.15;

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function bell(x: number, m: number, s: number): number {
    return Math.exp(-((x - m) * (x - m)) / (2 * s * s));
  }

  function createKernel(): void {
    kernelRadius = R;
    kernelSize = 2 * kernelRadius + 1;
    kernel = new Float32Array(kernelSize * kernelSize);

    let sum = 0;
    for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
      for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
        const r = Math.sqrt(dx * dx + dy * dy) / R;
        if (r <= 1) {
          const value = bell(r, rho, omega);
          kernel[(dy + kernelRadius) * kernelSize + (dx + kernelRadius)] = value;
          sum += value;
        }
      }
    }

    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }
  }

  function growth(u: number): number {
    return 2 * bell(u, mu, sigma) - 1;
  }

  function seedOrbium(centerX: number, centerY: number): void {
    const orbiumPattern = [
      [0, 0, 0, 0, 0, 0, 0.1, 0.14, 0.1, 0, 0, 0.03, 0.03, 0, 0, 0.3, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0.08, 0.24, 0.3, 0.3, 0.18, 0.14, 0.15, 0.16, 0.15, 0.09, 0.2, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0.15, 0.34, 0.44, 0.46, 0.38, 0.18, 0.14, 0.11, 0.13, 0.19, 0.18, 0.45, 0, 0, 0],
      [0, 0, 0, 0, 0.06, 0.13, 0.39, 0.5, 0.5, 0.37, 0.06, 0, 0, 0, 0.02, 0.16, 0.68, 0, 0, 0],
      [0, 0, 0, 0.11, 0.17, 0.17, 0.33, 0.4, 0.38, 0.28, 0.14, 0, 0, 0, 0, 0, 0.18, 0.42, 0, 0],
      [0, 0, 0.09, 0.18, 0.13, 0.06, 0.08, 0.26, 0.32, 0.32, 0.27, 0, 0, 0, 0, 0, 0, 0.82, 0, 0],
      [0.27, 0, 0.16, 0.12, 0, 0, 0, 0.25, 0.38, 0.44, 0.45, 0.34, 0, 0, 0, 0, 0, 0.22, 0.17, 0],
      [0, 0.07, 0.2, 0.02, 0, 0, 0, 0.31, 0.48, 0.57, 0.6, 0.57, 0, 0, 0, 0, 0, 0, 0.49, 0],
      [0, 0.59, 0.19, 0, 0, 0, 0, 0.2, 0.57, 0.69, 0.76, 0.76, 0.49, 0, 0, 0, 0, 0, 0.36, 0],
      [0, 0.58, 0.19, 0, 0, 0, 0, 0, 0.67, 0.83, 0.9, 0.92, 0.87, 0.12, 0, 0, 0, 0, 0.22, 0.07],
      [0, 0, 0.46, 0, 0, 0, 0, 0, 0.7, 0.93, 1, 1, 1, 0.61, 0, 0, 0, 0, 0.18, 0.11],
      [0, 0, 0.82, 0, 0, 0, 0, 0, 0.47, 1, 1, 0.98, 1, 0.96, 0.27, 0, 0, 0, 0.19, 0.1],
      [0, 0, 0.46, 0, 0, 0, 0, 0, 0.25, 1, 1, 0.84, 0.92, 0.97, 0.54, 0.14, 0.04, 0.1, 0.21, 0.05],
      [0, 0, 0, 0.4, 0, 0, 0, 0, 0.09, 0.8, 1, 0.82, 0.8, 0.85, 0.63, 0.31, 0.18, 0.19, 0.2, 0.01],
      [0, 0, 0, 0.36, 0.1, 0, 0, 0, 0.05, 0.54, 0.86, 0.79, 0.74, 0.72, 0.6, 0.39, 0.28, 0.24, 0.13, 0],
      [0, 0, 0, 0.01, 0.3, 0.07, 0, 0, 0.08, 0.36, 0.64, 0.7, 0.64, 0.6, 0.51, 0.39, 0.29, 0.19, 0.04, 0],
      [0, 0, 0, 0, 0.1, 0.24, 0.14, 0.1, 0.15, 0.29, 0.45, 0.53, 0.52, 0.46, 0.4, 0.31, 0.21, 0.08, 0, 0],
      [0, 0, 0, 0, 0, 0.08, 0.21, 0.21, 0.22, 0.29, 0.36, 0.39, 0.37, 0.33, 0.26, 0.18, 0.09, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0.03, 0.13, 0.19, 0.22, 0.24, 0.24, 0.23, 0.18, 0.13, 0.05, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0.02, 0.06, 0.08, 0.09, 0.07, 0.05, 0.01, 0, 0, 0, 0, 0],
    ];

    const patternHeight = orbiumPattern.length;
    const patternWidth = orbiumPattern[0].length;
    const startX = centerX - Math.floor(patternWidth / 2);
    const startY = centerY - Math.floor(patternHeight / 2);

    for (let py = 0; py < patternHeight; py++) {
      for (let px = 0; px < patternWidth; px++) {
        const x = (startX + px + cols) % cols;
        const y = (startY + py + rows) % rows;
        grid[y * cols + x] = orbiumPattern[py][px];
      }
    }
  }

  function seedRandom(): void {
    const numSeeds = 3 + Math.floor(Math.random() * 3);
    for (let s = 0; s < numSeeds; s++) {
      const cx = Math.floor(Math.random() * cols);
      const cy = Math.floor(Math.random() * rows);
      seedOrbium(cx, cy);
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);

      grid = new Float32Array(rows * cols);
      nextGrid = new Float32Array(rows * cols);

      createKernel();
      seedRandom();

      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      const dt = 1 / T;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let sum = 0;

          for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
            for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
              const nx = (x + kx + cols) % cols;
              const ny = (y + ky + rows) % rows;
              const ki = (ky + kernelRadius) * kernelSize + (kx + kernelRadius);
              sum += grid[ny * cols + nx] * kernel[ki];
            }
          }

          const g = growth(sum);
          const idx = y * cols + x;
          nextGrid[idx] = Math.max(0, Math.min(1, grid[idx] + dt * g));
        }
      }

      [grid, nextGrid] = [nextGrid, grid];
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      const imageData = ctx.createImageData(config.width, config.height);
      const data = imageData.data;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const value = grid[y * cols + x];
          
          const r = Math.floor(value * 20);
          const g = Math.floor(value * 255);
          const b = Math.floor(value * 80 + (1 - value) * 20);

          for (let py = 0; py < CELL_SIZE; py++) {
            for (let px = 0; px < CELL_SIZE; px++) {
              const pixelX = x * CELL_SIZE + px;
              const pixelY = y * CELL_SIZE + py;
              if (pixelX < config.width && pixelY < config.height) {
                const i = (pixelY * config.width + pixelX) * 4;
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
                data[i + 3] = 255;
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      grid.fill(0);
      nextGrid.fill(0);
      seedRandom();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      grid = new Float32Array(0);
      nextGrid = new Float32Array(0);
      kernel = new Float32Array(0);
    },
  };
}
