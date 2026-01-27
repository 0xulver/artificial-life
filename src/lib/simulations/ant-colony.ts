import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'ant-colony',
  name: 'Ant Colony',
  description: 'Stigmergy simulation with ants leaving and following pheromone trails',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const CELL_SIZE = 4;
const NUM_ANTS = 100;
const PHEROMONE_DECAY = 0.995;
const PHEROMONE_DEPOSIT = 0.5;
const FOOD_DEPOSIT = 2.0;
const SENSE_DISTANCE = 3;
const SENSE_ANGLE = Math.PI / 4;

interface Ant {
  x: number;
  y: number;
  angle: number;
  hasFood: boolean;
}

export function createAntColony(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };
  
  let cols = 0;
  let rows = 0;
  let homePheromones: number[][] = [];
  let foodPheromones: number[][] = [];
  let food: boolean[][] = [];
  let ants: Ant[] = [];
  let nestX = 0;
  let nestY = 0;
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createEmptyGrid(): number[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  }

  function createBoolGrid(): boolean[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(false));
  }

  function initializeWorld(): void {
    homePheromones = createEmptyGrid();
    foodPheromones = createEmptyGrid();
    food = createBoolGrid();
    
    nestX = Math.floor(cols / 2);
    nestY = Math.floor(rows / 2);
    
    const foodSources = [
      { x: Math.floor(cols * 0.2), y: Math.floor(rows * 0.2) },
      { x: Math.floor(cols * 0.8), y: Math.floor(rows * 0.2) },
      { x: Math.floor(cols * 0.2), y: Math.floor(rows * 0.8) },
      { x: Math.floor(cols * 0.8), y: Math.floor(rows * 0.8) },
    ];
    
    for (const source of foodSources) {
      for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          if (dx * dx + dy * dy <= 25) {
            const fx = source.x + dx;
            const fy = source.y + dy;
            if (fx >= 0 && fx < cols && fy >= 0 && fy < rows) {
              food[fy][fx] = true;
            }
          }
        }
      }
    }
    
    ants = [];
    for (let i = 0; i < NUM_ANTS; i++) {
      ants.push({
        x: nestX * CELL_SIZE + CELL_SIZE / 2,
        y: nestY * CELL_SIZE + CELL_SIZE / 2,
        angle: Math.random() * Math.PI * 2,
        hasFood: false,
      });
    }
  }

  function senseAt(pheromones: number[][], x: number, y: number, angle: number): number {
    const senseX = x + Math.cos(angle) * SENSE_DISTANCE * CELL_SIZE;
    const senseY = y + Math.sin(angle) * SENSE_DISTANCE * CELL_SIZE;
    const col = Math.floor(senseX / CELL_SIZE);
    const row = Math.floor(senseY / CELL_SIZE);
    
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      return pheromones[row][col];
    }
    return 0;
  }

  function updateAnts(): void {
    for (const ant of ants) {
      const col = Math.floor(ant.x / CELL_SIZE);
      const row = Math.floor(ant.y / CELL_SIZE);
      
      const targetPheromones = ant.hasFood ? homePheromones : foodPheromones;
      
      const leftSense = senseAt(targetPheromones, ant.x, ant.y, ant.angle - SENSE_ANGLE);
      const centerSense = senseAt(targetPheromones, ant.x, ant.y, ant.angle);
      const rightSense = senseAt(targetPheromones, ant.x, ant.y, ant.angle + SENSE_ANGLE);
      
      if (centerSense > leftSense && centerSense > rightSense) {
        // noop: continue straight
      } else if (leftSense > rightSense) {
        ant.angle -= SENSE_ANGLE * 0.5;
      } else if (rightSense > leftSense) {
        ant.angle += SENSE_ANGLE * 0.5;
      }
      
      ant.angle += (Math.random() - 0.5) * 0.3;
      
      const speed = 2;
      ant.x += Math.cos(ant.angle) * speed;
      ant.y += Math.sin(ant.angle) * speed;
      
      if (ant.x < 0) { ant.x = 0; ant.angle = Math.PI - ant.angle; }
      if (ant.x >= config.width) { ant.x = config.width - 1; ant.angle = Math.PI - ant.angle; }
      if (ant.y < 0) { ant.y = 0; ant.angle = -ant.angle; }
      if (ant.y >= config.height) { ant.y = config.height - 1; ant.angle = -ant.angle; }
      
      const newCol = Math.floor(ant.x / CELL_SIZE);
      const newRow = Math.floor(ant.y / CELL_SIZE);
      
      if (newCol >= 0 && newCol < cols && newRow >= 0 && newRow < rows) {
        if (ant.hasFood) {
          foodPheromones[newRow][newCol] = Math.min(1, foodPheromones[newRow][newCol] + FOOD_DEPOSIT);
          
          const distToNest = Math.sqrt(
            (newCol - nestX) ** 2 + (newRow - nestY) ** 2
          );
          if (distToNest < 3) {
            ant.hasFood = false;
            ant.angle += Math.PI;
          }
        } else {
          homePheromones[newRow][newCol] = Math.min(1, homePheromones[newRow][newCol] + PHEROMONE_DEPOSIT);
          
          if (food[newRow][newCol]) {
            ant.hasFood = true;
            ant.angle += Math.PI;
            food[newRow][newCol] = Math.random() < 0.95;
          }
        }
      }
    }
  }

  function decayPheromones(): void {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        homePheromones[row][col] *= PHEROMONE_DECAY;
        foodPheromones[row][col] *= PHEROMONE_DECAY;
      }
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);
      
      initializeWorld();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;
      
      state.elapsedTime += deltaTime;
      
      updateAnts();
      decayPheromones();
      
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#1a0a00';
      ctx.fillRect(0, 0, config.width, config.height);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const home = homePheromones[row][col];
          const foodP = foodPheromones[row][col];
          
          if (home > 0.01 || foodP > 0.01) {
            const r = Math.min(255, Math.floor(foodP * 255));
            const b = Math.min(255, Math.floor(home * 255));
            ctx.fillStyle = `rgb(${r}, 0, ${b})`;
            ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
          
          if (food[row][col]) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }
      
      ctx.fillStyle = '#884400';
      ctx.beginPath();
      ctx.arc(nestX * CELL_SIZE + CELL_SIZE / 2, nestY * CELL_SIZE + CELL_SIZE / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      
      for (const ant of ants) {
        ctx.fillStyle = ant.hasFood ? '#ffff00' : '#ffffff';
        ctx.beginPath();
        ctx.arc(ant.x, ant.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      initializeWorld();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      homePheromones = [];
      foodPheromones = [];
      food = [];
      ants = [];
    },
  };
}
