import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'elementary-ca',
  name: 'Elementary CA',
  description: 'Explore all 256 elementary cellular automata rules',
  width: 800,
  height: 600,
  targetFPS: 30,
};

const CELL_SIZE = 2;

const INTERESTING_RULES = [30, 45, 60, 73, 90, 105, 110, 150, 182, 225];

export function createElementaryCA(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let cols = 0;
  let rows = 0;
  let currentRow: boolean[] = [];
  let history: boolean[][] = [];
  let currentGeneration = 0;
  let ruleNumber = 110;

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function initializeRow(): void {
    currentRow = Array(cols).fill(false);
    currentRow[cols - 10] = true;
    for (let i = 0; i < 20; i++) {
      const pos = Math.floor(Math.random() * cols);
      currentRow[pos] = true;
    }
    history = [currentRow.slice()];
    currentGeneration = 0;
  }

  function applyRule(left: boolean, center: boolean, right: boolean): boolean {
    const index = (left ? 4 : 0) + (center ? 2 : 0) + (right ? 1 : 0);
    return ((ruleNumber >> index) & 1) === 1;
  }

  function computeNextRow(): boolean[] {
    const next: boolean[] = Array(cols);
    for (let i = 0; i < cols; i++) {
      const left = currentRow[(i - 1 + cols) % cols];
      const center = currentRow[i];
      const right = currentRow[(i + 1) % cols];
      next[i] = applyRule(left, center, right);
    }
    return next;
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);

      initializeRow();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      currentRow = computeNextRow();
      history.push(currentRow.slice());

      if (history.length > rows) {
        history.shift();
      }

      currentGeneration++;
      state.generation = currentGeneration;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);

      ctx.fillStyle = '#0ff';

      const startY = Math.max(0, rows - history.length);

      for (let rowIdx = 0; rowIdx < history.length; rowIdx++) {
        const row = history[rowIdx];
        const y = (startY + rowIdx) * CELL_SIZE;

        for (let col = 0; col < cols; col++) {
          if (row[col]) {
            ctx.fillRect(col * CELL_SIZE, y, CELL_SIZE, CELL_SIZE);
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
      ruleNumber = INTERESTING_RULES[Math.floor(Math.random() * INTERESTING_RULES.length)];
      initializeRow();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      currentRow = [];
      history = [];
    },
  };
}
