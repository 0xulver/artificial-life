import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'sandpile',
  name: 'Abelian Sandpile',
  description: 'Self-organized criticality with cascading avalanches',
  width: 800,
  height: 600,
  targetFPS: 10,
};

const CELL_SIZE = 4;
const MAX_TOPPLE_ITERATIONS = 1000;

export function createSandpile(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let cols = 0;
  let rows = 0;
  let grid: number[][] = [];

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createEmptyGrid(): number[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  }

  function initializeGrid(): void {
    grid = createEmptyGrid();
    
    // Add initial sand pile in center to immediately show activity
    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);
    grid[centerRow][centerCol] = 100;
    
    // Add some random seeds across the grid
    for (let i = 0; i < 50; i++) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      grid[row][col] += Math.floor(Math.random() * 8) + 4;
    }
  }

  function getColor(height: number): string {
    switch (height) {
      case 0: return '#000';
      case 1: return '#006';
      case 2: return '#00f';
      case 3: return '#ff0';
      default: return '#f00';
    }
  }

  function runToppleCascade(): number {
    let iterations = 0;
    let hasUnstableCells = true;

    while (hasUnstableCells && iterations < MAX_TOPPLE_ITERATIONS) {
      hasUnstableCells = false;
      const changes: { row: number; col: number; delta: number }[] = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (grid[row][col] >= 4) {
            hasUnstableCells = true;
            changes.push({ row, col, delta: -4 });

            const neighbors = [
              { r: (row - 1 + rows) % rows, c: col },
              { r: (row + 1) % rows, c: col },
              { r: row, c: (col - 1 + cols) % cols },
              { r: row, c: (col + 1) % cols },
            ];

            for (const n of neighbors) {
              changes.push({ row: n.r, col: n.c, delta: 1 });
            }
          }
        }
      }

      for (const change of changes) {
        grid[change.row][change.col] += change.delta;
      }

      iterations++;
    }

    return iterations;
  }

  function addRandomGrains(count: number): void {
    for (let i = 0; i < count; i++) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      grid[row][col]++;
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);

      initializeGrid();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      const grainsToAdd = Math.floor(Math.random() * 3) + 1;
      addRandomGrains(grainsToAdd);

      runToppleCascade();

      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const height = grid[row][col];
          if (height === 0) continue;

          ctx.fillStyle = getColor(height);
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
      initializeGrid();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      grid = [];
    },
  };
}
