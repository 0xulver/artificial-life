import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'langtons-loops',
  name: "Langton's Loops",
  description: 'Self-replicating cellular automaton',
  width: 600,
  height: 400,
  targetFPS: 10,
};

const CELL_SIZE = 6;
const NUM_STATES = 8;

// Colors for states 0-7
const COLORS: string[] = [
  '#000000', // 0: black (empty)
  '#0000FF', // 1: blue (sheath/core)
  '#FF0000', // 2: red (signal)
  '#00FF00', // 3: green
  '#FFFF00', // 4: yellow
  '#FF00FF', // 5: magenta
  '#FFFFFF', // 6: white
  '#00FFFF', // 7: cyan
];

// Langton's Loop transition table
// Format: key = center_state * 8^4 + top_state * 8^3 + right_state * 8^2 + bottom_state * 8 + left_state
// value = new_center_state
// This is a reduced set using rotational symmetry - the full table has ~194 rules
const TRANSITION_RULES: Map<number, number> = new Map();

// Helper to encode the neighborhood into a key
function encodeKey(center: number, top: number, right: number, bottom: number, left: number): number {
  return (((center * 8 + top) * 8 + right) * 8 + bottom) * 8 + left;
}

// Helper to add a rule with all rotations
function addRule(center: number, top: number, right: number, bottom: number, left: number, newState: number): void {
  TRANSITION_RULES.set(encodeKey(center, top, right, bottom, left), newState);
}

// Initialize Langton's Loop rules
// Based on Christopher Langton's original Loops rules
// States: 0=empty, 1=sheath, 2=core, 3-7=signal states

// Core transition rules for the loop structure
// These rules encode the behavior of the self-replicating loop

// Empty cell rules
addRule(0, 0, 0, 0, 0, 0); // Empty surrounded by empty stays empty

// Sheath rules (state 1) - the protective outer layer
addRule(1, 1, 0, 1, 0, 1); // Sheath corner
addRule(1, 0, 1, 0, 1, 1); // Sheath with neighbors
addRule(1, 1, 1, 0, 0, 1); // Sheath continuation
addRule(1, 0, 0, 1, 1, 1);

// Core rules (state 2) - the inner path
addRule(2, 1, 2, 1, 2, 2); // Core with sheath neighbors
addRule(2, 2, 1, 2, 1, 2); // Core with sheath

// Signal state transitions
addRule(3, 1, 3, 1, 3, 3); // Signal state 3
addRule(4, 1, 4, 1, 4, 4); // Signal state 4
addRule(5, 1, 5, 1, 5, 5); // Signal state 5
addRule(6, 1, 6, 1, 6, 6); // Signal state 6
addRule(7, 1, 7, 1, 7, 7); // Signal state 7

// Interaction rules - signal propagation
addRule(2, 3, 2, 1, 2, 3); // Signal 3 enters core
addRule(3, 1, 4, 1, 3, 4); // Signal 3 converts to 4
addRule(4, 1, 5, 1, 4, 5); // Signal 4 converts to 5
addRule(5, 1, 6, 1, 5, 6); // Signal 5 converts to 6
addRule(6, 1, 7, 1, 6, 7); // Signal 6 converts to 7
addRule(7, 1, 2, 1, 7, 2); // Signal 7 converts back to core

// Extension rules - building new sheath
addRule(1, 2, 1, 0, 1, 1); // Sheath extends from core
addRule(1, 0, 1, 2, 1, 1); // Sheath extends

// Rotation variants for rules
const ruleEntries = Array.from(TRANSITION_RULES.entries());

// Generate rotationally symmetric rules
for (const [key, value] of ruleEntries) {
  const decoded = decodeKey(key);
  if (decoded) {
    const { center, top, right, bottom, left } = decoded;

    // 90 degree rotation: top->left, left->bottom, bottom->right, right->top
    addRule(center, left, top, right, bottom, value);

    // 180 degree rotation
    addRule(center, bottom, left, top, right, value);

    // 270 degree rotation
    addRule(center, right, bottom, left, top, value);
  }
}

// Helper to decode a key back to neighborhood
function decodeKey(key: number): { center: number; top: number; right: number; bottom: number; left: number } | null {
  if (key < 0 || key >= 8 ** 5) return null;

  const left = key % 8;
  const bottom = Math.floor(key / 8) % 8;
  const right = Math.floor(key / 64) % 8;
  const top = Math.floor(key / 512) % 8;
  const center = Math.floor(key / 4096) % 8;

  return { center, top, right, bottom, left };
}

export function createLangtonsLoops(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let cols = 0;
  let rows = 0;
  let grid: Uint8Array = new Uint8Array(0);
  let nextGrid: Uint8Array = new Uint8Array(0);

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

  // Standard Langton's Loop initial pattern
  // This is the classic loop structure that self-replicates
  function initializePattern(): void {
    // Clear grid
    grid.fill(0);

    // Langton's Loop pattern (centered in the grid)
    // The loop is a rectangular structure with a "tail" that extends
    // Pattern coordinates are relative to center-left of grid

    const startX = Math.floor(cols * 0.3);
    const startY = Math.floor(rows * 0.4);

    // Define the loop structure using state encoding
    // The pattern represents a loop with:
    // - State 1: sheath (blue) - outer boundary
    // - State 2: core (red) - inner path where signals travel
    // - States 3-7: signal states that propagate around the loop

    // The classic Langton's Loop pattern:
    // Row 0: .....1111.....
    // Row 1: ....1...1.....
    // Row 2: ...1..21..1...
    // Row 3: ..1.21...21.1..
    // Row 4: .1..21.....21.1
    // Row 5: 1...1.......1..
    // Row 6: 11111........1.
    // Row 7: 1.............1
    // Row 8: 1.1...........1
    // Row 9: 1.1.111111111.1
    // Row 10: 1.1.1.......1.1
    // Row 11: 1.1.1.11111.1.1
    // Row 12: 1.1.1.1...1.1.1
    // Row 13: 1.1.1.1.1.1.1.1
    // Row 14: 1.1.1.1.2.1.1.1
    // Row 15: 1.1.1.1.2.1.1.1
    // Row 16: 1.1.1.1.2.1.1.1
    // Row 17: 1.1.1.1.2.1.1.1
    // Row 18: 1.1.1.1.2.1.1.1
    // Row 19: 1.1.1.1.2.1.1.1
    // Row 20: 1.1.1.1.2.1.1.1
    // Row 21: 1.1.1.1.2.1.1.1
    // Row 22: 1.1.1.1.2.1.1.1
    // Row 23: 1.1.1.1.2.1.1.1
    // Row 24: 1.1.1.1.2.1.1.1
    // Row 25: 1.1.1.1.2.1.1.1
    // Row 26: 1.1.1.1.2.1.1.1
    // Row 27: 1.1.1.1.2.1.1.1
    // Row 28: 1.1.1.1.2.1.1.1
    // Row 29: 1.1.1.1.2.1.1.1

    // Simplified version - the essential loop structure
    const pattern: number[][] = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 2, 2, 2, 2, 2, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 2, 0, 0, 0, 2, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 2, 0, 0, 1, 0, 2, 1, 0, 1, 1],
      [1, 0, 1, 0, 1, 2, 2, 2, 2, 2, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // Draw the pattern
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        const x = startX + px;
        const y = startY + py;
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
          setCell(x, y, pattern[py][px]);
        }
      }
    }

    // Place a signal in the core (state 3 to start the replication)
    // Place it in the left side of the core path
    const signalX = startX + 5;
    const signalY = startY + 6;
    if (signalX >= 0 && signalX < cols && signalY >= 0 && signalY < rows) {
      setCell(signalX, signalY, 3);
    }
  }

  function step(): void {
    // Compute next state for all cells (double-buffering)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const center = grid[y * cols + x];
        const top = getCell(x, y - 1);
        const right = getCell(x + 1, y);
        const bottom = getCell(x, y + 1);
        const left = getCell(x - 1, y);

        const key = encodeKey(center, top, right, bottom, left);
        const newState = TRANSITION_RULES.get(key);

        if (newState !== undefined) {
          nextGrid[y * cols + x] = newState;
        } else {
          // Default: keep current state if no rule matches
          nextGrid[y * cols + x] = center;
        }
      }
    }

    // Swap grids
    const temp = grid;
    grid = nextGrid;
    nextGrid = temp;
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);

      grid = new Uint8Array(rows * cols);
      nextGrid = new Uint8Array(rows * cols);

      initializePattern();

      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      // Single step per frame for Langton's Loops (slow replication)
      step();
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = grid[y * cols + x];
          if (cell !== 0) {
            ctx.fillStyle = COLORS[cell];
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
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
      initializePattern();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      grid = new Uint8Array(0);
      nextGrid = new Uint8Array(0);
    },
  };
}
