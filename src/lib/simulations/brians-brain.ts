import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'brians-brain',
  name: "Brian's Brain",
  description: '3-state cellular automaton with Alive, Dying, and Dead states',
  width: 800,
  height: 600,
  targetFPS: 15,
};

const CELL_SIZE = 4;

const DEAD = 0;
const ALIVE = 1;
const DYING = 2;

export function createBriansBrain(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };
  
  let cols = 0;
  let rows = 0;
  let grid: number[][] = [];
  let nextGrid: number[][] = [];
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createEmptyGrid(): number[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(DEAD));
  }

  function randomizeGrid(): void {
    grid = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => {
        const r = Math.random();
        if (r > 0.85) return ALIVE;
        if (r > 0.8) return DYING;
        return DEAD;
      })
    );
  }

  function countAliveNeighbors(row: number, col: number): number {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const r = (row + i + rows) % rows;
        const c = (col + j + cols) % cols;
        if (grid[r][c] === ALIVE) count++;
      }
    }
    return count;
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);
      
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
          const current = grid[row][col];
          
          if (current === ALIVE) {
            nextGrid[row][col] = DYING;
          } else if (current === DYING) {
            nextGrid[row][col] = DEAD;
          } else {
            const aliveNeighbors = countAliveNeighbors(row, col);
            nextGrid[row][col] = aliveNeighbors === 2 ? ALIVE : DEAD;
          }
        }
      }
      
      [grid, nextGrid] = [nextGrid, grid];
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cell = grid[row][col];
          if (cell === DEAD) continue;
          
          if (cell === ALIVE) {
            ctx.fillStyle = '#fff';
          } else {
            ctx.fillStyle = '#4488ff';
          }
          
          ctx.fillRect(
            col * CELL_SIZE,
            row * CELL_SIZE,
            CELL_SIZE - 1,
            CELL_SIZE - 1
          );
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
