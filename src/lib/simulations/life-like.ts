import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

interface LifeLikeRule {
  name: string;
  birth: number[];
  survive: number[];
  color: string;
}

const RULES: Record<string, LifeLikeRule> = {
  highlife: {
    name: 'HighLife',
    birth: [3, 6],
    survive: [2, 3],
    color: '#ff6600',
  },
  seeds: {
    name: 'Seeds',
    birth: [2],
    survive: [],
    color: '#00ff88',
  },
  daynight: {
    name: 'Day & Night',
    birth: [3, 6, 7, 8],
    survive: [3, 4, 6, 7, 8],
    color: '#ffff00',
  },
};

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'highlife',
  name: 'HighLife',
  description: 'Life-like CA that produces replicators (B36/S23)',
  width: 800,
  height: 600,
  targetFPS: 10,
};

const CELL_SIZE = 4;

export function createLifeLike(
  variant: keyof typeof RULES = 'highlife',
  customConfig?: Partial<SimulationConfig>
): Simulation {
  const rule = RULES[variant];
  const config: SimulationConfig = {
    ...DEFAULT_CONFIG,
    id: variant,
    name: rule.name,
    ...customConfig,
  };
  
  let cols = 0;
  let rows = 0;
  let grid: boolean[][] = [];
  let nextGrid: boolean[][] = [];
  
  const birthSet = new Set(rule.birth);
  const surviveSet = new Set(rule.survive);
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createEmptyGrid(): boolean[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(false));
  }

  function randomizeGrid(): void {
    const density = variant === 'seeds' ? 0.01 : 0.3;
    grid = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => Math.random() < density)
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
          const neighbors = countNeighbors(row, col);
          const alive = grid[row][col];
          
          if (alive) {
            nextGrid[row][col] = surviveSet.has(neighbors);
          } else {
            nextGrid[row][col] = birthSet.has(neighbors);
          }
        }
      }
      
      [grid, nextGrid] = [nextGrid, grid];
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);
      
      ctx.fillStyle = rule.color;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (grid[row][col]) {
            ctx.fillRect(
              col * CELL_SIZE,
              row * CELL_SIZE,
              CELL_SIZE - 1,
              CELL_SIZE - 1
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

export const createHighLife = (config?: Partial<SimulationConfig>) => createLifeLike('highlife', config);
export const createSeeds = (config?: Partial<SimulationConfig>) => createLifeLike('seeds', config);
export const createDayNight = (config?: Partial<SimulationConfig>) => createLifeLike('daynight', config);
