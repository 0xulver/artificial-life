import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'langtons-ant',
  name: "Langton's Ant",
  description: 'Simple rules create complex emergent patterns and highways',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const CELL_SIZE = 4;
const STEPS_PER_FRAME = 50;

const DIRECTIONS = [
  { dx: 0, dy: -1 }, // Up
  { dx: 1, dy: 0 },  // Right
  { dx: 0, dy: 1 },  // Down
  { dx: -1, dy: 0 }, // Left
];

export function createLangtonsAnt(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let cols = 0;
  let rows = 0;
  let grid: Uint8Array = new Uint8Array(0);
  
  let antX = 0;
  let antY = 0;
  let antDir = 0;

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function getCell(x: number, y: number): number {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return 0;
    return grid[y * cols + x];
  }

  function setCell(x: number, y: number, value: number): void {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return;
    grid[y * cols + x] = value;
  }

  function step(): void {
    const currentCell = getCell(antX, antY);

    if (currentCell === 0) {
      antDir = (antDir + 1) % 4;
      setCell(antX, antY, 1);
    } else {
      antDir = (antDir + 3) % 4;
      setCell(antX, antY, 0);
    }

    antX += DIRECTIONS[antDir].dx;
    antY += DIRECTIONS[antDir].dy;

    if (antX < 0) antX = cols - 1;
    if (antX >= cols) antX = 0;
    if (antY < 0) antY = rows - 1;
    if (antY >= rows) antY = 0;
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);
      
      grid = new Uint8Array(rows * cols);
      
      antX = Math.floor(cols / 2);
      antY = Math.floor(rows / 2);
      antDir = 0;

      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        step();
        state.generation++;
      }
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);

      ctx.fillStyle = '#fff';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (grid[y * cols + x] === 1) {
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }

      ctx.fillStyle = '#f00';
      ctx.fillRect(
        antX * CELL_SIZE,
        antY * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      grid.fill(0);
      antX = Math.floor(cols / 2);
      antY = Math.floor(rows / 2);
      antDir = 0;
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      grid = new Uint8Array(0);
    },
  };
}
