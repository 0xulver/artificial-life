import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'virtual-creatures',
  name: 'Virtual Creatures',
  description: 'Evolving morphology and neural control',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const POPULATION_SIZE = 12;
const EVAL_TIME = 8000;
const GRAVITY = 0.3;
const GROUND_Y = 500;
const MAX_SEGMENTS = 8;

interface Segment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  angle: number;
  angularVel: number;
}

interface Joint {
  segA: number;
  segB: number;
  localA: { x: number; y: number };
  localB: { x: number; y: number };
  motorSpeed: number;
  motorPhase: number;
}

interface Creature {
  segments: Segment[];
  joints: Joint[];
  genome: number[];
  fitness: number;
  startX: number;
  neuralWeights: number[];
  time: number;
}

function createRandomGenome(): number[] {
  const genome: number[] = [];
  const numSegments = 3 + Math.floor(Math.random() * (MAX_SEGMENTS - 3));
  
  genome.push(numSegments);
  
  for (let i = 0; i < numSegments; i++) {
    genome.push(20 + Math.random() * 40);
    genome.push(10 + Math.random() * 30);
  }
  
  for (let i = 1; i < numSegments; i++) {
    genome.push(Math.random());
    genome.push(Math.random());
    genome.push((Math.random() - 0.5) * 4);
    genome.push(Math.random() * Math.PI * 2);
  }
  
  for (let i = 0; i < 20; i++) {
    genome.push((Math.random() - 0.5) * 2);
  }
  
  return genome;
}

function decodeCreature(genome: number[], startX: number): Creature {
  const numSegments = Math.min(MAX_SEGMENTS, Math.max(2, Math.floor(genome[0])));
  const segments: Segment[] = [];
  const joints: Joint[] = [];
  
  let geneIdx = 1;
  
  let x = startX;
  const y = GROUND_Y - 50;
  
  for (let i = 0; i < numSegments; i++) {
    const width = genome[geneIdx++] || 30;
    const height = genome[geneIdx++] || 20;
    
    segments.push({
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      width: Math.max(15, Math.min(60, width)),
      height: Math.max(10, Math.min(40, height)),
      angle: 0,
      angularVel: 0,
    });
    
    x += width * 0.8;
  }
  
  for (let i = 1; i < numSegments; i++) {
    const localAx = genome[geneIdx++] || 0.5;
    const localBx = genome[geneIdx++] || 0.5;
    const motorSpeed = genome[geneIdx++] || 0;
    const motorPhase = genome[geneIdx++] || 0;
    
    joints.push({
      segA: i - 1,
      segB: i,
      localA: { x: segments[i - 1].width * localAx - segments[i - 1].width / 2, y: 0 },
      localB: { x: -segments[i].width * localBx + segments[i].width / 2, y: 0 },
      motorSpeed: motorSpeed,
      motorPhase: motorPhase,
    });
  }
  
  const neuralWeights: number[] = [];
  for (let i = 0; i < 20; i++) {
    neuralWeights.push(genome[geneIdx++] || 0);
  }
  
  return {
    segments,
    joints,
    genome,
    fitness: 0,
    startX,
    neuralWeights,
    time: 0,
  };
}

function simulateCreature(creature: Creature, dt: number): void {
  creature.time += dt;
  
  for (const segment of creature.segments) {
    segment.vy += GRAVITY;
    
    segment.vx *= 0.99;
    segment.vy *= 0.99;
    segment.angularVel *= 0.95;
    
    segment.x += segment.vx * dt * 0.1;
    segment.y += segment.vy * dt * 0.1;
    segment.angle += segment.angularVel * dt * 0.1;
    
    const bottom = segment.y + segment.height / 2;
    if (bottom > GROUND_Y) {
      segment.y = GROUND_Y - segment.height / 2;
      segment.vy = -segment.vy * 0.3;
      segment.vx *= 0.8;
    }
  }
  
  for (const joint of creature.joints) {
    const segA = creature.segments[joint.segA];
    const segB = creature.segments[joint.segB];
    
    const cosA = Math.cos(segA.angle);
    const sinA = Math.sin(segA.angle);
    const worldAx = segA.x + joint.localA.x * cosA - joint.localA.y * sinA;
    const worldAy = segA.y + joint.localA.x * sinA + joint.localA.y * cosA;
    
    const cosB = Math.cos(segB.angle);
    const sinB = Math.sin(segB.angle);
    const worldBx = segB.x + joint.localB.x * cosB - joint.localB.y * sinB;
    const worldBy = segB.y + joint.localB.x * sinB + joint.localB.y * cosB;
    
    const dx = worldBx - worldAx;
    const dy = worldBy - worldAy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 1) {
      const correction = 0.5;
      const cx = (dx / dist) * dist * correction;
      const cy = (dy / dist) * dist * correction;
      
      segA.x += cx * 0.5;
      segA.y += cy * 0.5;
      segB.x -= cx * 0.5;
      segB.y -= cy * 0.5;
    }
    
    const phase = creature.time * 0.003 + joint.motorPhase;
    const motorForce = Math.sin(phase) * joint.motorSpeed;
    
    segA.angularVel += motorForce * 0.1;
    segB.angularVel -= motorForce * 0.1;
  }
  
  let sumX = 0;
  for (const seg of creature.segments) {
    sumX += seg.x;
  }
  creature.fitness = sumX / creature.segments.length - creature.startX;
}

function mutateGenome(genome: number[]): number[] {
  const mutated = [...genome];
  const numMutations = 1 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < numMutations; i++) {
    const idx = Math.floor(Math.random() * mutated.length);
    if (idx === 0) {
      mutated[0] = Math.max(2, Math.min(MAX_SEGMENTS, mutated[0] + (Math.random() > 0.5 ? 1 : -1)));
    } else {
      mutated[idx] += (Math.random() - 0.5) * 0.5;
    }
  }
  
  return mutated;
}

function crossover(parent1: number[], parent2: number[]): number[] {
  const maxLen = Math.max(parent1.length, parent2.length);
  const child: number[] = [];
  
  for (let i = 0; i < maxLen; i++) {
    if (Math.random() < 0.5 && i < parent1.length) {
      child.push(parent1[i]);
    } else if (i < parent2.length) {
      child.push(parent2[i]);
    } else if (i < parent1.length) {
      child.push(parent1[i]);
    }
  }
  
  return child;
}

export function createVirtualCreatures(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let creatures: Creature[] = [];
  let generation = 0;
  let evalStartTime = 0;
  let bestFitness = 0;
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function initializePopulation(): void {
    creatures = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const genome = createRandomGenome();
      const startX = 100;
      creatures.push(decodeCreature(genome, startX));
    }
    generation = 0;
    bestFitness = 0;
  }

  function evolvePopulation(): void {
    creatures.sort((a, b) => b.fitness - a.fitness);
    bestFitness = Math.max(bestFitness, creatures[0].fitness);
    
    const newGenomes: number[][] = [];
    
    newGenomes.push(creatures[0].genome);
    newGenomes.push(creatures[1].genome);
    
    while (newGenomes.length < POPULATION_SIZE) {
      const parent1 = creatures[Math.floor(Math.random() * 4)].genome;
      const parent2 = creatures[Math.floor(Math.random() * 4)].genome;
      const child = mutateGenome(crossover(parent1, parent2));
      newGenomes.push(child);
    }
    
    creatures = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const startX = 100;
      creatures.push(decodeCreature(newGenomes[i], startX));
    }
    
    generation++;
    evalStartTime = state.elapsedTime;
  }

  return {
    config,
    state,

    init(ctx: CanvasRenderingContext2D): void {
      initializePopulation();
      evalStartTime = 0;
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;
      
      for (const creature of creatures) {
        simulateCreature(creature, deltaTime);
      }
      
      if (state.elapsedTime - evalStartTime > EVAL_TIME) {
        evolvePopulation();
      }
      
      state.generation = generation;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, config.width, config.height);
      
      ctx.fillStyle = '#3d3d5c';
      ctx.fillRect(0, GROUND_Y, config.width, config.height - GROUND_Y);
      
      ctx.strokeStyle = '#5c5c8a';
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(config.width, GROUND_Y);
      ctx.stroke();
      
      const colors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
        '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe',
        '#6c5ce7', '#00b894', '#e17055', '#fdcb6e'
      ];
      
      for (let i = 0; i < creatures.length; i++) {
        const creature = creatures[i];
        const color = colors[i % colors.length];
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        for (const joint of creature.joints) {
          const segA = creature.segments[joint.segA];
          const segB = creature.segments[joint.segB];
          ctx.beginPath();
          ctx.moveTo(segA.x, segA.y);
          ctx.lineTo(segB.x, segB.y);
          ctx.stroke();
        }
        
        ctx.fillStyle = color;
        for (const segment of creature.segments) {
          ctx.save();
          ctx.translate(segment.x, segment.y);
          ctx.rotate(segment.angle);
          ctx.fillRect(-segment.width / 2, -segment.height / 2, segment.width, segment.height);
          ctx.restore();
        }
      }
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(10, 10, 200, 80);
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(`Generation: ${generation}`, 20, 30);
      ctx.fillText(`Best Fitness: ${bestFitness.toFixed(0)}px`, 20, 50);
      const timeLeft = Math.max(0, (EVAL_TIME - (state.elapsedTime - evalStartTime)) / 1000);
      ctx.fillText(`Time Left: ${timeLeft.toFixed(1)}s`, 20, 70);
      
      const currentBest = Math.max(...creatures.map(c => c.fitness));
      ctx.fillText(`Current Best: ${currentBest.toFixed(0)}px`, 20, 90);
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      initializePopulation();
      evalStartTime = 0;
      state.generation = 0;
      state.elapsedTime = 0;
      bestFitness = 0;
    },

    destroy(): void {
      creatures = [];
    },
  };
}
