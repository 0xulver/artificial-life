import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'daisyworld',
  name: 'Daisyworld',
  description: 'Planetary temperature regulation through life',
  width: 800,
  height: 600,
  targetFPS: 10,
};

const CELL_SIZE = 6;

// Cell states
const EMPTY = 0;
const BLACK_DAISY = 1;
const WHITE_DAISY = 2;

// Temperature parameters
const OPTIMAL_TEMP = 22; // Optimal temperature for daisy growth
const MIN_TEMP = 5; // Minimum temperature for survival
const MAX_TEMP = 40; // Maximum temperature for survival
const SOLAR_LUMINOSITY_START = 0.8;
const SOLAR_LUMINOSITY_END = 1.4;
const LUMINOSITY_INCREMENT = 0.0001;

// Albedo values
const ALBEDO_GROUND = 0.5;
const ALBEDO_BLACK = 0.25;
const ALBEDO_WHITE = 0.75;

// Heat diffusion parameters
const HEAT_DIFFUSION_RATE = 0.1;
const HEAT_LOST_TO_SPACE = 0.02;

// Base temperature calculation constants
const BASE_LOCAL_TEMP = 20;

export function createDaisyworld(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let cols = 0;
  let rows = 0;
  let grid: number[][] = [];
  let temperatures: number[][] = [];
  let ages: number[][] = [];
  let solarLuminosity = SOLAR_LUMINOSITY_START;
  let averageTemperature = BASE_LOCAL_TEMP;

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createEmptyGrid(): number[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(EMPTY));
  }

  function createTemperatureGrid(): number[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(BASE_LOCAL_TEMP));
  }

  function createAgeGrid(): number[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  }

  function initializeGrid(): void {
    grid = createEmptyGrid();
    temperatures = createTemperatureGrid();
    ages = createAgeGrid();
    solarLuminosity = SOLAR_LUMINOSITY_START;

    // Seed with some initial daisies in random locations
    const seedCount = Math.floor((rows * cols) * 0.02);
    for (let i = 0; i < seedCount; i++) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      grid[row][col] = Math.random() > 0.5 ? BLACK_DAISY : WHITE_DAISY;
    }
  }

  function getAlbedo(cellValue: number): number {
    switch (cellValue) {
      case EMPTY:
        return ALBEDO_GROUND;
      case BLACK_DAISY:
        return ALBEDO_BLACK;
      case WHITE_DAISY:
        return ALBEDO_WHITE;
      default:
        return ALBEDO_GROUND;
    }
  }

  function calculateGrowthRate(temp: number): number {
    // Parabolic growth rate centered on optimal temperature
    if (temp < MIN_TEMP || temp > MAX_TEMP) {
      return 0;
    }
    const deviation = temp - OPTIMAL_TEMP;
    const range = MAX_TEMP - OPTIMAL_TEMP;
    return 1 - (deviation * deviation) / (range * range);
  }

  function getNeighborCells(row: number, col: number): { r: number; c: number }[] {
    const neighbors: { r: number; c: number }[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = (row + dr + rows) % rows;
        const c = (col + dc + cols) % cols;
        neighbors.push({ r, c });
      }
    }
    return neighbors;
  }

  function calculateLocalTemperature(row: number, col: number): number {
    // Base heating from solar luminosity
    const localAlbedo = getAlbedo(grid[row][col]);
    const absorbedHeat = solarLuminosity * (1 - localAlbedo) * 15;

    // Heat from neighbors (diffusion)
    let neighborHeat = 0;
    const neighbors = getNeighborCells(row, col);
    for (const n of neighbors) {
      neighborHeat += temperatures[n.r][n.c];
    }
    neighborHeat = (neighborHeat / neighbors.length) * HEAT_DIFFUSION_RATE;

    // Calculate temperature with heat loss to space
    let temp = BASE_LOCAL_TEMP + absorbedHeat + neighborHeat;
    temp = temp * (1 - HEAT_LOST_TO_SPACE);

    return temp;
  }

  function updateTemperatures(): void {
    const newTemps: number[][] = [];

    for (let row = 0; row < rows; row++) {
      const rowTemps: number[] = [];
      for (let col = 0; col < cols; col++) {
        rowTemps.push(calculateLocalTemperature(row, col));
      }
      newTemps.push(rowTemps);
    }

    temperatures = newTemps;

    // Calculate average planetary temperature
    let totalTemp = 0;
    let cellCount = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        totalTemp += temperatures[row][col];
        cellCount++;
      }
    }
    averageTemperature = totalTemp / cellCount;
  }

  function updateDaisies(): void {
    const newGrid = createEmptyGrid();
    let hasChanges = false;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = grid[row][col];
        const temp = temperatures[row][col];
        const age = ages[row][col];
        const growthRate = calculateGrowthRate(temp);

        if (cell === EMPTY) {
          // Empty cell: check if daisies can colonize
          const neighbors = getNeighborCells(row, col);
          let blackNeighbors = 0;
          let whiteNeighbors = 0;

          for (const n of neighbors) {
            if (grid[n.r][n.c] === BLACK_DAISY) blackNeighbors++;
            else if (grid[n.r][n.c] === WHITE_DAISY) whiteNeighbors++;
          }

          // Reproduction probability based on neighbor type and growth rate
          const totalNeighbors = blackNeighbors + whiteNeighbors;
          if (totalNeighbors > 0) {
            // Daisies reproduce to adjacent empty cells
            if (blackNeighbors > 0 && Math.random() < growthRate * 0.1 * blackNeighbors) {
              newGrid[row][col] = BLACK_DAISY;
              hasChanges = true;
            } else if (whiteNeighbors > 0 && Math.random() < growthRate * 0.1 * whiteNeighbors) {
              newGrid[row][col] = WHITE_DAISY;
              hasChanges = true;
            }
          }
        } else {
          // Existing daisy: check survival
          const survivalChance = growthRate * 0.9;
          const ageDeathChance = age > 100 ? 0.02 * (age - 100) : 0;
          const deathChance = 1 - survivalChance - ageDeathChance;

          if (Math.random() > deathChance) {
            newGrid[row][col] = cell;
            hasChanges = true;
          }
        }

        // Update age
        if (newGrid[row][col] !== EMPTY) {
          ages[row][col] = age + 1;
        } else {
          ages[row][col] = 0;
        }
      }
    }

    grid = newGrid;
  }

  function updateLuminosity(): void {
    // Solar luminosity slowly increases over time (simulating sun getting brighter)
    if (solarLuminosity < SOLAR_LUMINOSITY_END) {
      solarLuminosity += LUMINOSITY_INCREMENT;
    }
  }

  function getCellColor(row: number, col: number): string {
    const cell = grid[row][col];
    const temp = temperatures[row][col];

    if (cell === EMPTY) {
      // Ground color with temperature indication
      // Blue = cold, tan = moderate, red = hot
      const normalizedTemp = Math.max(0, Math.min(1, (temp - 10) / 30));
      const r = Math.floor(139 + normalizedTemp * 80);
      const g = Math.floor(115 + normalizedTemp * 60);
      const b = Math.floor(85 - normalizedTemp * 50);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (cell === BLACK_DAISY) {
      return '#333';
    } else {
      return '#fff';
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);

      initializeGrid();
      updateTemperatures();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      updateLuminosity();
      updateTemperatures();
      updateDaisies();

      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, config.width, config.height);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          ctx.fillStyle = getCellColor(row, col);
          ctx.fillRect(
            col * CELL_SIZE,
            row * CELL_SIZE,
            CELL_SIZE - 1,
            CELL_SIZE - 1
          );
        }
      }
    },

    getStats() {
      return [
        { label: 'Avg Temp', value: `${averageTemperature.toFixed(1)}°C` },
        { label: 'Luminosity', value: solarLuminosity.toFixed(3) },
      ];
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      initializeGrid();
      updateTemperatures();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      grid = [];
      temperatures = [];
      ages = [];
    },
  };
}
