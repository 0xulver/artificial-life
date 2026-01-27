import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'wireworld',
  name: 'Wireworld',
  description: 'Cellular automaton for simulating electronic circuits and logic gates',
  width: 800,
  height: 600,
  targetFPS: 10,
};

const CELL_SIZE = 6;

const EMPTY = 0;
const HEAD = 1;
const TAIL = 2;
const WIRE = 3;

const COLORS: Record<number, string> = {
  [EMPTY]: '#000000',
  [HEAD]: '#00aaff',
  [TAIL]: '#ffffff',
  [WIRE]: '#ff8800',
};

export function createWireworld(customConfig?: Partial<SimulationConfig>): Simulation {
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
    return Array(rows).fill(null).map(() => Array(cols).fill(EMPTY));
  }

  function countHeadNeighbors(row: number, col: number): number {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const r = row + i;
        const c = col + j;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          if (grid[r][c] === HEAD) count++;
        }
      }
    }
    return count;
  }

  function createCircuits(): void {
    grid = createEmptyGrid();
    
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    
    for (let i = -15; i <= 15; i++) {
      if (centerX + i >= 0 && centerX + i < cols) {
        grid[centerY][centerX + i] = WIRE;
      }
    }
    
    const loopTop = centerY - 5;
    const loopBottom = centerY + 5;
    const loopLeft = centerX - 8;
    const loopRight = centerX - 4;
    
    for (let x = loopLeft; x <= loopRight; x++) {
      if (x >= 0 && x < cols) {
        if (loopTop >= 0) grid[loopTop][x] = WIRE;
        if (loopBottom < rows) grid[loopBottom][x] = WIRE;
      }
    }
    for (let y = loopTop; y <= loopBottom; y++) {
      if (y >= 0 && y < rows) {
        if (loopLeft >= 0) grid[y][loopLeft] = WIRE;
        if (loopRight < cols) grid[y][loopRight] = WIRE;
      }
    }
    
    if (loopTop >= 0 && loopLeft >= 0 && loopLeft < cols) {
      grid[loopTop][loopLeft] = HEAD;
      grid[loopTop][loopLeft + 1] = TAIL;
    }
    
    const loop2Top = centerY - 3;
    const loop2Bottom = centerY + 3;
    const loop2Left = centerX + 5;
    const loop2Right = centerX + 10;
    
    for (let x = loop2Left; x <= loop2Right; x++) {
      if (x >= 0 && x < cols) {
        if (loop2Top >= 0) grid[loop2Top][x] = WIRE;
        if (loop2Bottom < rows) grid[loop2Bottom][x] = WIRE;
      }
    }
    for (let y = loop2Top; y <= loop2Bottom; y++) {
      if (y >= 0 && y < rows) {
        if (loop2Left >= 0) grid[y][loop2Left] = WIRE;
        if (loop2Right < cols) grid[y][loop2Right] = WIRE;
      }
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);
      
      nextGrid = createEmptyGrid();
      createCircuits();
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
          
          if (current === EMPTY) {
            nextGrid[row][col] = EMPTY;
          } else if (current === HEAD) {
            nextGrid[row][col] = TAIL;
          } else if (current === TAIL) {
            nextGrid[row][col] = WIRE;
          } else if (current === WIRE) {
            const heads = countHeadNeighbors(row, col);
            nextGrid[row][col] = (heads === 1 || heads === 2) ? HEAD : WIRE;
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
          if (cell === EMPTY) continue;
          
          ctx.fillStyle = COLORS[cell];
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
      nextGrid = createEmptyGrid();
      createCircuits();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      grid = [];
      nextGrid = [];
    },
  };
}
