import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'reaction-diffusion',
  name: 'Reaction-Diffusion',
  description: 'Gray-Scott model creating spots, stripes, and organic patterns',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const SCALE = 2;

const DU = 1.0;
const DV = 0.5;
const F = 0.055;
const K = 0.062;

export function createReactionDiffusion(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };
  
  let cols = 0;
  let rows = 0;
  let u: Float32Array = new Float32Array(0);
  let v: Float32Array = new Float32Array(0);
  let nextU: Float32Array = new Float32Array(0);
  let nextV: Float32Array = new Float32Array(0);
  let imageData: ImageData | null = null;
  let offscreenCanvas: OffscreenCanvas | null = null;
  let offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function idx(x: number, y: number): number {
    return y * cols + x;
  }

  function laplacian(arr: Float32Array, x: number, y: number): number {
    const left = x > 0 ? x - 1 : cols - 1;
    const right = x < cols - 1 ? x + 1 : 0;
    const up = y > 0 ? y - 1 : rows - 1;
    const down = y < rows - 1 ? y + 1 : 0;
    
    return (
      arr[idx(left, y)] +
      arr[idx(right, y)] +
      arr[idx(x, up)] +
      arr[idx(x, down)] -
      4 * arr[idx(x, y)]
    );
  }

  function initializeGrids(): void {
    const size = cols * rows;
    u = new Float32Array(size);
    v = new Float32Array(size);
    nextU = new Float32Array(size);
    nextV = new Float32Array(size);
    
    u.fill(1.0);
    v.fill(0.0);
    
    const seedCount = 10;
    for (let s = 0; s < seedCount; s++) {
      const cx = Math.floor(Math.random() * cols);
      const cy = Math.floor(Math.random() * rows);
      const radius = 5 + Math.floor(Math.random() * 10);
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            const x = (cx + dx + cols) % cols;
            const y = (cy + dy + rows) % rows;
            const i = idx(x, y);
            u[i] = 0.5 + Math.random() * 0.1;
            v[i] = 0.25 + Math.random() * 0.1;
          }
        }
      }
    }
  }

  function simulate(): void {
    const dt = 1.0;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = idx(x, y);
        const uVal = u[i];
        const vVal = v[i];
        
        const lapU = laplacian(u, x, y);
        const lapV = laplacian(v, x, y);
        
        const uvv = uVal * vVal * vVal;
        
        nextU[i] = uVal + dt * (DU * lapU - uvv + F * (1 - uVal));
        nextV[i] = vVal + dt * (DV * lapV + uvv - (F + K) * vVal);
        
        nextU[i] = Math.max(0, Math.min(1, nextU[i]));
        nextV[i] = Math.max(0, Math.min(1, nextV[i]));
      }
    }
    
    [u, nextU] = [nextU, u];
    [v, nextV] = [nextV, v];
  }

  return {
    config,
    state,

    init(ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / SCALE);
      rows = Math.floor(config.height / SCALE);
      
      offscreenCanvas = new OffscreenCanvas(cols, rows);
      offscreenCtx = offscreenCanvas.getContext('2d');
      if (offscreenCtx) {
        imageData = offscreenCtx.createImageData(cols, rows);
      }
      
      initializeGrids();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;
      
      state.elapsedTime += deltaTime;
      
      for (let i = 0; i < 10; i++) {
        simulate();
      }
      
      state.generation += 10;
    },

    render(ctx: CanvasRenderingContext2D): void {
      if (!imageData || !offscreenCtx || !offscreenCanvas) return;
      
      const data = imageData.data;
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = idx(x, y);
          const pixelIdx = i * 4;
          
          const value = v[i];
          
          const r = Math.floor(value * 180);
          const g = Math.floor(value * 255);
          const b = Math.floor((1 - value) * 100 + value * 255);
          
          data[pixelIdx] = r;
          data[pixelIdx + 1] = g;
          data[pixelIdx + 2] = b;
          data[pixelIdx + 3] = 255;
        }
      }
      
      offscreenCtx.putImageData(imageData, 0, 0);
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        offscreenCanvas,
        0, 0, cols, rows,
        0, 0, config.width, config.height
      );
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      initializeGrids();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      u = new Float32Array(0);
      v = new Float32Array(0);
      nextU = new Float32Array(0);
      nextV = new Float32Array(0);
      imageData = null;
      offscreenCanvas = null;
      offscreenCtx = null;
    },
  };
}
