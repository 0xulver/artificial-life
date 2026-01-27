import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'game-of-life',
  name: "Conway's Game of Life",
  description: 'Classic cellular automaton where cells live or die based on neighbor count',
  width: 800,
  height: 600,
  targetFPS: 10,
};

const CELL_SIZE = 8;

export function createGameOfLife(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };
  
  const cols = Math.floor(config.width / CELL_SIZE);
  const rows = Math.floor(config.height / CELL_SIZE);
  
  let grid: boolean[][] = [];
  let nextGrid: boolean[][] = [];
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createEmptyGrid(): boolean[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(false));
  }

  function randomizeGrid(): void {
    grid = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => Math.random() > 0.7)
    );
  }

  function countNeighbors(row: number, col: number): number {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const r = (row + i + rows) % rows;
        const c = (col + j + cols) % cols;
        if (grid[r][c]) count++;
      }
    }
    return count;
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      grid = createEmptyGrid();
      nextGrid = createEmptyGrid();
      randomizeGrid();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;
      
      state.elapsedTime += deltaTime;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const neighbors = countNeighbors(row, col);
          const alive = grid[row][col];
          
          if (alive && (neighbors === 2 || neighbors === 3)) {
            nextGrid[row][col] = true;
          } else if (!alive && neighbors === 3) {
            nextGrid[row][col] = true;
          } else {
            nextGrid[row][col] = false;
          }
        }
      }
      
      [grid, nextGrid] = [nextGrid, grid];
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);
      
      ctx.fillStyle = '#0f0';
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (grid[row][col]) {
            ctx.fillRect(
              col * CELL_SIZE + 1,
              row * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
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
      grid = createEmptyGrid();
      nextGrid = createEmptyGrid();
      randomizeGrid();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      grid = [];
      nextGrid = [];
    },
  };
}
