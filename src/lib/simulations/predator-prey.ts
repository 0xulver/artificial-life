import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'predator-prey',
  name: 'Predator-Prey',
  description: 'Ecosystem simulation with evolving predators and prey',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const INITIAL_PREY = 150;
const INITIAL_PREDATORS = 30;
const PREY_REPRODUCE_ENERGY = 80;
const PREDATOR_REPRODUCE_ENERGY = 120;
const PREY_FOOD_GAIN = 4;
const PREDATOR_FOOD_GAIN = 40;
const GRASS_REGROW_RATE = 0.002;

interface Creature {
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  speed: number;
}

export function createPredatorPrey(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };
  
  let prey: Creature[] = [];
  let predators: Creature[] = [];
  let grass: Float32Array = new Float32Array(0);
  let cols = 0;
  let rows = 0;
  const cellSize = 10;
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createCreature(x: number, y: number, speed: number): Creature {
    const angle = Math.random() * Math.PI * 2;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      energy: 50 + Math.random() * 30,
      speed,
    };
  }

  function initializeWorld(): void {
    cols = Math.floor(config.width / cellSize);
    rows = Math.floor(config.height / cellSize);
    grass = new Float32Array(cols * rows);
    grass.fill(1.0);
    
    prey = [];
    for (let i = 0; i < INITIAL_PREY; i++) {
      prey.push(createCreature(
        Math.random() * config.width,
        Math.random() * config.height,
        1.5 + Math.random() * 0.5
      ));
    }
    
    predators = [];
    for (let i = 0; i < INITIAL_PREDATORS; i++) {
      predators.push(createCreature(
        Math.random() * config.width,
        Math.random() * config.height,
        2.0 + Math.random() * 0.5
      ));
    }
  }

  function wrapPosition(c: Creature): void {
    if (c.x < 0) c.x += config.width;
    if (c.x >= config.width) c.x -= config.width;
    if (c.y < 0) c.y += config.height;
    if (c.y >= config.height) c.y -= config.height;
  }

  function distance(a: Creature, b: Creature): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function findNearest(creature: Creature, targets: Creature[], range: number): Creature | null {
    let nearest: Creature | null = null;
    let minDist = range;
    
    for (const target of targets) {
      const dist = distance(creature, target);
      if (dist < minDist) {
        minDist = dist;
        nearest = target;
      }
    }
    return nearest;
  }

  function updatePrey(): void {
    const newPrey: Creature[] = [];
    
    for (const p of prey) {
      const nearestPredator = findNearest(p, predators, 80);
      
      if (nearestPredator) {
        const dx = p.x - nearestPredator.x;
        const dy = p.y - nearestPredator.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          p.vx += (dx / dist) * 0.3;
          p.vy += (dy / dist) * 0.3;
        }
      }
      
      p.vx += (Math.random() - 0.5) * 0.2;
      p.vy += (Math.random() - 0.5) * 0.2;
      
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > p.speed) {
        p.vx = (p.vx / speed) * p.speed;
        p.vy = (p.vy / speed) * p.speed;
      }
      
      p.x += p.vx;
      p.y += p.vy;
      wrapPosition(p);
      
      const gx = Math.floor(p.x / cellSize);
      const gy = Math.floor(p.y / cellSize);
      if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
        const idx = gy * cols + gx;
        if (grass[idx] > 0.5) {
          p.energy += PREY_FOOD_GAIN;
          grass[idx] = 0;
        }
      }
      
      p.energy -= 0.5;
      
      if (p.energy > PREY_REPRODUCE_ENERGY) {
        p.energy /= 2;
        const child = createCreature(
          p.x + (Math.random() - 0.5) * 20,
          p.y + (Math.random() - 0.5) * 20,
          p.speed + (Math.random() - 0.5) * 0.2
        );
        child.energy = p.energy;
        newPrey.push(child);
      }
    }
    
    prey = prey.filter(p => p.energy > 0);
    prey.push(...newPrey);
  }

  function updatePredators(): void {
    const newPredators: Creature[] = [];
    
    for (const p of predators) {
      const nearestPrey = findNearest(p, prey, 150);
      
      if (nearestPrey) {
        const dx = nearestPrey.x - p.x;
        const dy = nearestPrey.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          p.vx += (dx / dist) * 0.4;
          p.vy += (dy / dist) * 0.4;
        }
        
        if (dist < 10) {
          p.energy += PREDATOR_FOOD_GAIN;
          nearestPrey.energy = 0;
        }
      } else {
        p.vx += (Math.random() - 0.5) * 0.3;
        p.vy += (Math.random() - 0.5) * 0.3;
      }
      
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > p.speed) {
        p.vx = (p.vx / speed) * p.speed;
        p.vy = (p.vy / speed) * p.speed;
      }
      
      p.x += p.vx;
      p.y += p.vy;
      wrapPosition(p);
      
      p.energy -= 0.8;
      
      if (p.energy > PREDATOR_REPRODUCE_ENERGY) {
        p.energy /= 2;
        const child = createCreature(
          p.x + (Math.random() - 0.5) * 20,
          p.y + (Math.random() - 0.5) * 20,
          p.speed + (Math.random() - 0.5) * 0.2
        );
        child.energy = p.energy;
        newPredators.push(child);
      }
    }
    
    predators = predators.filter(p => p.energy > 0);
    predators.push(...newPredators);
  }

  function regrowGrass(): void {
    for (let i = 0; i < grass.length; i++) {
      if (grass[i] < 1.0) {
        grass[i] = Math.min(1.0, grass[i] + GRASS_REGROW_RATE);
      }
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      initializeWorld();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;
      
      state.elapsedTime += deltaTime;
      
      updatePrey();
      updatePredators();
      regrowGrass();
      
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#1a1a0a';
      ctx.fillRect(0, 0, config.width, config.height);
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const g = grass[y * cols + x];
          if (g > 0.1) {
            ctx.fillStyle = `rgb(0, ${Math.floor(g * 100 + 30)}, 0)`;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }
      
      ctx.fillStyle = '#00ff88';
      for (const p of prey) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.fillStyle = '#ff4444';
      for (const p of predators) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(`Prey: ${prey.length}  Predators: ${predators.length}`, 10, 90);
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
      prey = [];
      predators = [];
      grass = new Float32Array(0);
    },
  };
}
