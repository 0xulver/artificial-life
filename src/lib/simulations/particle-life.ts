import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'particle-life',
  name: 'Particle Life',
  description: 'Emergent ecosystems from simple attraction/repulsion rules between particle types',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const NUM_PARTICLES = 500;
const NUM_TYPES = 6;
const MAX_RADIUS = 80;
const FRICTION = 0.95;
const FORCE_SCALE = 0.5;

const COLORS = [
  '#ff0000',
  '#00ff00',
  '#0088ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
}

export function createParticleLife(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };
  
  let particles: Particle[] = [];
  let attractionMatrix: number[][] = [];
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function randomAttractionMatrix(): number[][] {
    return Array(NUM_TYPES).fill(null).map(() =>
      Array(NUM_TYPES).fill(null).map(() => Math.random() * 2 - 1)
    );
  }

  function initParticles(): void {
    particles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: Math.random() * config.width,
        y: Math.random() * config.height,
        vx: 0,
        vy: 0,
        type: Math.floor(Math.random() * NUM_TYPES),
      });
    }
    attractionMatrix = randomAttractionMatrix();
  }

  function computeForces(): void {
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      let fx = 0;
      let fy = 0;

      for (let j = 0; j < particles.length; j++) {
        if (i === j) continue;
        
        const p2 = particles[j];
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        
        if (dx > config.width / 2) dx -= config.width;
        if (dx < -config.width / 2) dx += config.width;
        if (dy > config.height / 2) dy -= config.height;
        if (dy < -config.height / 2) dy += config.height;
        
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0 && dist < MAX_RADIUS) {
          const attraction = attractionMatrix[p1.type][p2.type];
          const normalizedDist = dist / MAX_RADIUS;
          
          let force: number;
          if (normalizedDist < 0.3) {
            force = normalizedDist / 0.3 - 1;
          } else {
            force = attraction * (1 - Math.abs(2 * normalizedDist - 1 - 0.3) / 0.7);
          }
          
          force *= FORCE_SCALE / dist;
          fx += dx * force;
          fy += dy * force;
        }
      }

      p1.vx = (p1.vx + fx) * FRICTION;
      p1.vy = (p1.vy + fy) * FRICTION;
    }
  }

  function updatePositions(): void {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0) p.x += config.width;
      if (p.x >= config.width) p.x -= config.width;
      if (p.y < 0) p.y += config.height;
      if (p.y >= config.height) p.y -= config.height;
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      initParticles();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;
      
      state.elapsedTime += deltaTime;
      
      computeForces();
      updatePositions();
      
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, config.width, config.height);
      
      for (const p of particles) {
        ctx.fillStyle = COLORS[p.type];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
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
      initParticles();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      particles = [];
      attractionMatrix = [];
    },
  };
}
