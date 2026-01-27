import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'schelling',
  name: 'Schelling Segregation',
  description: 'Emergent segregation from individual preferences',
  width: 800,
  height: 600,
  targetFPS: 10,
};

const CELL_SIZE = 6;
const TOLERANCE = 0.3;
const MAX_MOVES_PER_FRAME = 50;

const EMPTY = 0;
const TYPE_A = 1;
const TYPE_B = 2;

const COLOR_EMPTY = '#222';
const COLOR_TYPE_A = '#e74c3c';
const COLOR_TYPE_B = '#3498db';

export function createSchelling(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let cols = 0;
  let rows = 0;
  let grid: number[][] = [];
  let emptyCells: { row: number; col: number }[] = [];

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createEmptyGrid(): number[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(EMPTY));
  }

  function randomizeGrid(): void {
    grid = createEmptyGrid();
    emptyCells = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const rand = Math.random();
        if (rand < 0.4) {
          grid[row][col] = TYPE_A;
        } else if (rand < 0.8) {
          grid[row][col] = TYPE_B;
        } else {
          emptyCells.push({ row, col });
        }
      }
    }
  }

  function getNeighbors(row: number, col: number): { row: number; col: number; value: number }[] {
    const neighbors: { row: number; col: number; value: number }[] = [];

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;

        const r = (row + i + rows) % rows;
        const c = (col + j + cols) % cols;
        neighbors.push({ row: r, col: c, value: grid[r][c] });
      }
    }

    return neighbors;
  }

  function isAgentHappy(row: number, col: number): boolean {
    const myType = grid[row][col];
    if (myType === EMPTY) return true;

    const neighbors = getNeighbors(row, col);
    const occupiedNeighbors = neighbors.filter(n => n.value !== EMPTY);

    if (occupiedNeighbors.length === 0) return true;

    const sameTypeCount = occupiedNeighbors.filter(n => n.value === myType).length;
    const ratio = sameTypeCount / occupiedNeighbors.length;

    return ratio >= TOLERANCE;
  }

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);

      randomizeGrid();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      const unhappyAgents: { row: number; col: number; type: number }[] = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (grid[row][col] !== EMPTY && !isAgentHappy(row, col)) {
            unhappyAgents.push({ row, col, type: grid[row][col] });
          }
        }
      }

      if (unhappyAgents.length === 0 || emptyCells.length === 0) {
        state.generation++;
        return;
      }

      const shuffledUnhappy = shuffleArray(unhappyAgents);
      const movesToMake = Math.min(shuffledUnhappy.length, MAX_MOVES_PER_FRAME);
      let moves = 0;

      for (let i = 0; i < movesToMake; i++) {
        const agent = shuffledUnhappy[i];
        if (emptyCells.length === 0) break;

        const emptyIndex = Math.floor(Math.random() * emptyCells.length);
        const emptyCell = emptyCells[emptyIndex];

        grid[emptyCell.row][emptyCell.col] = agent.type;
        grid[agent.row][agent.col] = EMPTY;

        emptyCells.splice(emptyIndex, 1);
        emptyCells.push({ row: agent.row, col: agent.col });

        moves++;
      }

      state.generation += moves;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = COLOR_EMPTY;
      ctx.fillRect(0, 0, config.width, config.height);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cellValue = grid[row][col];

          if (cellValue === TYPE_A) {
            ctx.fillStyle = COLOR_TYPE_A;
          } else if (cellValue === TYPE_B) {
            ctx.fillStyle = COLOR_TYPE_B;
          } else {
            continue;
          }

          ctx.fillRect(
            col * CELL_SIZE + 1,
            row * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
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
      randomizeGrid();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      grid = [];
      emptyCells = [];
    },
  };
}
