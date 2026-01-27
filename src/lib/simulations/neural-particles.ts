import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'neural-particles',
  name: 'Neural Particle Automata',
  description: 'Self-organizing particles with learned update rules',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const NUM_PARTICLES = 800;
const STATE_SIZE = 6;
const HIDDEN_SIZE = 24;
const NEIGHBOR_RADIUS = 40;
const MAX_SPEED = 2;
const DRAG = 0.98;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: number[];
}

function tanh(x: number): number {
  if (x > 20) return 1;
  if (x < -20) return -1;
  const e2x = Math.exp(2 * x);
  return (e2x - 1) / (e2x + 1);
}

function createRandomWeights(inputSize: number, outputSize: number): number[][] {
  const weights: number[][] = [];
  const scale = Math.sqrt(2.0 / inputSize);
  for (let i = 0; i < outputSize; i++) {
    weights[i] = [];
    for (let j = 0; j < inputSize; j++) {
      weights[i][j] = (Math.random() * 2 - 1) * scale;
    }
  }
  return weights;
}

function matmul(input: number[], weights: number[][]): number[] {
  const output: number[] = [];
  for (let i = 0; i < weights.length; i++) {
    let sum = 0;
    for (let j = 0; j < input.length; j++) {
      sum += input[j] * weights[i][j];
    }
    output.push(sum);
  }
  return output;
}

export function createNeuralParticles(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let particles: Particle[] = [];
  let weights1: number[][] = [];
  let weights2: number[][] = [];
  
  const inputSize = STATE_SIZE + STATE_SIZE + 4;
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function initializeParticles(): void {
    particles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const particleState: number[] = [];
      for (let j = 0; j < STATE_SIZE; j++) {
        particleState.push(Math.random() * 2 - 1);
      }
      particles.push({
        x: Math.random() * config.width,
        y: Math.random() * config.height,
        vx: (Math.random() * 2 - 1) * 0.5,
        vy: (Math.random() * 2 - 1) * 0.5,
        state: particleState,
      });
    }
    
    weights1 = createRandomWeights(inputSize, HIDDEN_SIZE);
    weights2 = createRandomWeights(HIDDEN_SIZE, STATE_SIZE + 2);
  }

  function findNeighbors(particle: Particle): Particle[] {
    const neighbors: Particle[] = [];
    const r2 = NEIGHBOR_RADIUS * NEIGHBOR_RADIUS;
    
    for (const other of particles) {
      if (other === particle) continue;
      const dx = other.x - particle.x;
      const dy = other.y - particle.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < r2) {
        neighbors.push(other);
      }
    }
    return neighbors;
  }

  function computePerception(particle: Particle, neighbors: Particle[]): number[] {
    const avgState: number[] = new Array(STATE_SIZE).fill(0);
    let avgDx = 0;
    let avgDy = 0;
    let density = 0;
    
    if (neighbors.length > 0) {
      for (const n of neighbors) {
        const dx = n.x - particle.x;
        const dy = n.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const weight = 1 - dist / NEIGHBOR_RADIUS;
        
        for (let i = 0; i < STATE_SIZE; i++) {
          avgState[i] += n.state[i] * weight;
        }
        avgDx += dx * weight;
        avgDy += dy * weight;
        density += weight;
      }
      
      for (let i = 0; i < STATE_SIZE; i++) {
        avgState[i] /= density;
      }
      avgDx /= density;
      avgDy /= density;
    }
    
    const normalizedDensity = Math.min(density / 10, 1);
    
    return [
      ...particle.state,
      ...avgState,
      avgDx / NEIGHBOR_RADIUS,
      avgDy / NEIGHBOR_RADIUS,
      normalizedDensity,
      Math.random() * 0.1 - 0.05,
    ];
  }

  function updateParticle(particle: Particle, neighbors: Particle[]): void {
    const input = computePerception(particle, neighbors);
    
    const hidden = matmul(input, weights1).map(x => tanh(x));
    const output = matmul(hidden, weights2).map(x => tanh(x));
    
    for (let i = 0; i < STATE_SIZE; i++) {
      particle.state[i] = particle.state[i] * 0.9 + output[i] * 0.1;
      particle.state[i] = Math.max(-1, Math.min(1, particle.state[i]));
    }
    
    particle.vx += output[STATE_SIZE] * 0.3;
    particle.vy += output[STATE_SIZE + 1] * 0.3;
    
    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    if (speed > MAX_SPEED) {
      particle.vx = (particle.vx / speed) * MAX_SPEED;
      particle.vy = (particle.vy / speed) * MAX_SPEED;
    }
    
    particle.vx *= DRAG;
    particle.vy *= DRAG;
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    if (particle.x < 0) { particle.x = 0; particle.vx *= -0.5; }
    if (particle.x > config.width) { particle.x = config.width; particle.vx *= -0.5; }
    if (particle.y < 0) { particle.y = 0; particle.vy *= -0.5; }
    if (particle.y > config.height) { particle.y = config.height; particle.vy *= -0.5; }
  }

  function stateToColor(s: number[]): { r: number; g: number; b: number } {
    const hue = ((s[0] + 1) / 2) * 360;
    const saturation = 0.7 + ((s[1] + 1) / 2) * 0.3;
    const lightness = 0.4 + ((s[2] + 1) / 2) * 0.3;
    
    const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = lightness - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (hue < 60) { r = c; g = x; }
    else if (hue < 120) { r = x; g = c; }
    else if (hue < 180) { g = c; b = x; }
    else if (hue < 240) { g = x; b = c; }
    else if (hue < 300) { r = x; b = c; }
    else { r = c; b = x; }
    
    return {
      r: Math.floor((r + m) * 255),
      g: Math.floor((g + m) * 255),
      b: Math.floor((b + m) * 255),
    };
  }

  return {
    config,
    state,

    init(ctx: CanvasRenderingContext2D): void {
      initializeParticles();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;
      
      const neighborCache: Map<Particle, Particle[]> = new Map();
      for (const p of particles) {
        neighborCache.set(p, findNeighbors(p));
      }
      
      for (const p of particles) {
        updateParticle(p, neighborCache.get(p) || []);
      }
      
      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, config.width, config.height);
      
      for (const p of particles) {
        const color = stateToColor(p.state);
        const size = 3 + ((p.state[3] + 1) / 2) * 3;
        const alpha = 0.6 + ((p.state[4] + 1) / 2) * 0.4;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
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
      initializeParticles();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      particles = [];
    },
  };
}
