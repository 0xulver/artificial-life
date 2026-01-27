import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'boids',
  name: 'Boids Flocking',
  description: 'Emergent flocking behavior from three simple rules',
  width: 800,
  height: 600,
  targetFPS: 60,
};

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NUM_BOIDS = 300;
const MAX_SPEED = 4;
const MIN_SPEED = 2;
const PERCEPTION_RADIUS = 50;
const SEPARATION_RADIUS = 25;

const SEPARATION_WEIGHT = 1.5;
const ALIGNMENT_WEIGHT = 1.0;
const COHESION_WEIGHT = 1.0;

export function createBoids(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let boids: Boid[] = [];
  let width = config.width;
  let height = config.height;

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function initBoids(): void {
    boids = [];
    for (let i = 0; i < NUM_BOIDS; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
      boids.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
  }

  function limit(vx: number, vy: number, max: number): [number, number] {
    const mag = Math.sqrt(vx * vx + vy * vy);
    if (mag > max) {
      return [(vx / mag) * max, (vy / mag) * max];
    }
    return [vx, vy];
  }

  function ensureMinSpeed(vx: number, vy: number, min: number): [number, number] {
    const mag = Math.sqrt(vx * vx + vy * vy);
    if (mag < min && mag > 0) {
      return [(vx / mag) * min, (vy / mag) * min];
    }
    return [vx, vy];
  }

  function updateBoid(boid: Boid): void {
    let separationX = 0, separationY = 0, separationCount = 0;
    let alignmentX = 0, alignmentY = 0, alignmentCount = 0;
    let cohesionX = 0, cohesionY = 0, cohesionCount = 0;

    for (const other of boids) {
      if (other === boid) continue;

      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < SEPARATION_RADIUS && dist > 0) {
        separationX -= dx / dist;
        separationY -= dy / dist;
        separationCount++;
      }

      if (dist < PERCEPTION_RADIUS) {
        alignmentX += other.vx;
        alignmentY += other.vy;
        alignmentCount++;

        cohesionX += other.x;
        cohesionY += other.y;
        cohesionCount++;
      }
    }

    let steerX = 0, steerY = 0;

    if (separationCount > 0) {
      steerX += (separationX / separationCount) * SEPARATION_WEIGHT;
      steerY += (separationY / separationCount) * SEPARATION_WEIGHT;
    }

    if (alignmentCount > 0) {
      const avgVx = alignmentX / alignmentCount;
      const avgVy = alignmentY / alignmentCount;
      steerX += (avgVx - boid.vx) * ALIGNMENT_WEIGHT * 0.05;
      steerY += (avgVy - boid.vy) * ALIGNMENT_WEIGHT * 0.05;
    }

    if (cohesionCount > 0) {
      const avgX = cohesionX / cohesionCount;
      const avgY = cohesionY / cohesionCount;
      const towardX = avgX - boid.x;
      const towardY = avgY - boid.y;
      steerX += towardX * COHESION_WEIGHT * 0.005;
      steerY += towardY * COHESION_WEIGHT * 0.005;
    }

    boid.vx += steerX;
    boid.vy += steerY;

    [boid.vx, boid.vy] = limit(boid.vx, boid.vy, MAX_SPEED);
    [boid.vx, boid.vy] = ensureMinSpeed(boid.vx, boid.vy, MIN_SPEED);

    boid.x += boid.vx;
    boid.y += boid.vy;

    if (boid.x < 0) boid.x += width;
    if (boid.x > width) boid.x -= width;
    if (boid.y < 0) boid.y += height;
    if (boid.y > height) boid.y -= height;
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      width = config.width;
      height = config.height;
      initBoids();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      for (const boid of boids) {
        updateBoid(boid);
      }

      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, config.width, config.height);

      ctx.fillStyle = '#4ade80';

      for (const boid of boids) {
        const angle = Math.atan2(boid.vy, boid.vx);
        const size = 6;

        ctx.save();
        ctx.translate(boid.x, boid.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size * 0.5, size * 0.4);
        ctx.lineTo(-size * 0.5, -size * 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      initBoids();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      boids = [];
    },
  };
}
