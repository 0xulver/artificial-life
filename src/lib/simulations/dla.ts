import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'dla',
  name: 'Diffusion-Limited Aggregation',
  description: 'Fractal growth from random walking particles',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const CELL_SIZE = 2;
const NUM_WALKERS = 500;
const STEPS_PER_FRAME = 50;

interface Walker {
  col: number;
  row: number;
}

export function createDLA(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let cols = 0;
  let rows = 0;
  let grid: boolean[][] = [];
  let walkers: Walker[] = [];

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createEmptyGrid(): boolean[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(false));
  }

  function spawnWalkerAtEdge(): Walker {
    const side = Math.floor(Math.random() * 4);
    let col = 0;
    let row = 0;

    switch (side) {
      case 0:
        col = Math.floor(Math.random() * cols);
        row = 0;
        break;
      case 1:
        col = cols - 1;
        row = Math.floor(Math.random() * rows);
        break;
      case 2:
        col = Math.floor(Math.random() * cols);
        row = rows - 1;
        break;
      case 3:
        col = 0;
        row = Math.floor(Math.random() * rows);
        break;
    }

    return { col, row };
  }

  function initializeWalkers(): void {
    walkers = [];
    for (let i = 0; i < NUM_WALKERS; i++) {
      walkers.push(spawnWalkerAtEdge());
    }
  }

  function isFrozen(col: number, row: number): boolean {
    if (col < 0 || col >= cols || row < 0 || row >= rows) {
      return false;
    }
    return grid[row][col];
  }

  function moveWalker(walker: Walker): void {
    const direction = Math.floor(Math.random() * 4);
    let newCol = walker.col;
    let newRow = walker.row;

    switch (direction) {
      case 0: newRow--; break;
      case 1: newCol++; break;
      case 2: newRow++; break;
      case 3: newCol--; break;
    }

    if (
      isFrozen(newCol - 1, newRow) ||
      isFrozen(newCol + 1, newRow) ||
      isFrozen(newCol, newRow - 1) ||
      isFrozen(newCol, newRow + 1)
    ) {
      if (newCol >= 0 && newCol < cols && newRow >= 0 && newRow < rows) {
        grid[newRow][newCol] = true;
      }
      const newWalker = spawnWalkerAtEdge();
      walker.col = newWalker.col;
      walker.row = newWalker.row;
    } else if (newCol < 0 || newCol >= cols || newRow < 0 || newRow >= rows) {
      const newWalker = spawnWalkerAtEdge();
      walker.col = newWalker.col;
      walker.row = newWalker.row;
    } else {
      walker.col = newCol;
      walker.row = newRow;
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);

      grid = createEmptyGrid();

      const centerCol = Math.floor(cols / 2);
      const centerRow = Math.floor(rows / 2);
      grid[centerRow][centerCol] = true;

      initializeWalkers();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(_deltaTime: number): void {
      if (!state.running) return;

      for (let step = 0; step < STEPS_PER_FRAME; step++) {
        for (const walker of walkers) {
          moveWalker(walker);
        }
      }

      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);

      ctx.fillStyle = '#0ff';
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (grid[row][col]) {
            ctx.fillRect(
              col * CELL_SIZE,
              row * CELL_SIZE,
              CELL_SIZE,
              CELL_SIZE
            );
          }
        }
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (const walker of walkers) {
        ctx.fillRect(
          walker.col * CELL_SIZE,
          walker.row * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      grid = createEmptyGrid();

      const centerCol = Math.floor(cols / 2);
      const centerRow = Math.floor(rows / 2);
      grid[centerRow][centerCol] = true;

      initializeWalkers();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      grid = [];
      walkers = [];
    },
  };
}
