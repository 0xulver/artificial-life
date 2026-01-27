import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'lenia',
  name: 'Lenia',
  description: 'Continuous cellular automaton with lifelike emergent creatures',
  width: 800,
  height: 600,
  targetFPS: 30,
};

const RESOLUTION = 256;

export function createLenia(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let size = RESOLUTION;
  let grid: Float32Array = new Float32Array(0);
  let nextGrid: Float32Array = new Float32Array(0);
  let kernel: Float32Array = new Float32Array(0);
  let kernelRadius = 0;
  let kernelDiameter = 0;

  const R = 12;
  const T = 10;
  const mu = 0.15;
  const sigma = 0.017;
  const beta1 = 1;

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function bell(x: number, m: number, s: number): number {
    return Math.exp(-((x - m) * (x - m)) / (2 * s * s));
  }

  function kernelCore(r: number): number {
    return bell(r, 0.5, 0.15) * beta1;
  }

  function createKernel(): void {
    kernelRadius = R;
    kernelDiameter = 2 * kernelRadius + 1;
    kernel = new Float32Array(kernelDiameter * kernelDiameter);

    let sum = 0;
    for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
      for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        const r = dist / R;
        if (r <= 1 && dist > 0) {
          const value = kernelCore(r);
          kernel[(dy + kernelRadius) * kernelDiameter + (dx + kernelRadius)] = value;
          sum += value;
        }
      }
    }

    if (sum > 0) {
      for (let i = 0; i < kernel.length; i++) {
        kernel[i] /= sum;
      }
    }
  }

  function growth(u: number): number {
    return 2 * bell(u, mu, sigma) - 1;
  }

  function getCell(x: number, y: number): number {
    const wx = ((x % size) + size) % size;
    const wy = ((y % size) + size) % size;
    return grid[wy * size + wx];
  }

  function seedCreature(cx: number, cy: number, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const x = ((cx + dx) % size + size) % size;
          const y = ((cy + dy) % size + size) % size;
          const r = dist / radius;
          const value = bell(r, 0.5, 0.25) * (0.8 + Math.random() * 0.2);
          grid[y * size + x] = Math.max(grid[y * size + x], value);
        }
      }
    }
  }

  function seedRandom(): void {
    grid.fill(0);
    
    const numCreatures = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numCreatures; i++) {
      const cx = Math.floor(Math.random() * size);
      const cy = Math.floor(Math.random() * size);
      const radius = 8 + Math.floor(Math.random() * 8);
      seedCreature(cx, cy, radius);
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      const minDim = Math.min(config.width, config.height);
      size = Math.min(RESOLUTION, Math.floor(minDim / 3));
      size = Math.max(128, size);

      grid = new Float32Array(size * size);
      nextGrid = new Float32Array(size * size);

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

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let sum = 0;

          for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
            for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
              const ki = (ky + kernelRadius) * kernelDiameter + (kx + kernelRadius);
              const kv = kernel[ki];
              if (kv > 0) {
                sum += getCell(x + kx, y + ky) * kv;
              }
            }
          }

          const g = growth(sum);
          const idx = y * size + x;
          const newVal = grid[idx] + dt * g;
          nextGrid[idx] = Math.max(0, Math.min(1, newVal));
        }
      }

      const temp = grid;
      grid = nextGrid;
      nextGrid = temp;
      
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      const cellWidth = config.width / size;
      const cellHeight = config.height / size;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const value = grid[y * size + x];
          if (value > 0.01) {
            const intensity = Math.pow(value, 0.7);
            const r = Math.floor(intensity * 50);
            const g = Math.floor(intensity * 255);
            const b = Math.floor(intensity * 150);
            
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(
              Math.floor(x * cellWidth),
              Math.floor(y * cellHeight),
              Math.ceil(cellWidth),
              Math.ceil(cellHeight)
            );
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
