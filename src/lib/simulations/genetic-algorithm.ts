import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'genetic-algorithm',
  name: 'Genetic Algorithm',
  description: 'Evolutionary optimization visualization - circles evolve to match a target pattern',
  width: 800,
  height: 400,
  targetFPS: 30,
};

const POPULATION_SIZE = 50;
const CIRCLES_PER_INDIVIDUAL = 20;
const MUTATION_RATE = 0.05;
const TOURNAMENT_SIZE = 3;
const TARGET_CIRCLES_COUNT = 5 + Math.floor(Math.random() * 4); // 5-8 circles

type Circle = {
  x: number;
  y: number;
  radius: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
};

type Genome = Circle[];

// Offscreen canvas for fitness calculation
let targetCanvas: HTMLCanvasElement | null = null;

function createOffscreenCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function generateTargetCircles(count: number): Circle[] {
  const circles: Circle[] = [];
  for (let i = 0; i < count; i++) {
    circles.push({
      x: Math.random() * 400,
      y: Math.random() * 400,
      radius: 20 + Math.random() * 60,
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
      alpha: 0.3 + Math.random() * 0.7,
    });
  }
  return circles;
}

function randomGenome(): Genome {
  const circles: Circle[] = [];
  for (let i = 0; i < CIRCLES_PER_INDIVIDUAL; i++) {
    circles.push({
      x: Math.random() * 400,
      y: Math.random() * 400,
      radius: 10 + Math.random() * 70,
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
      alpha: 0.2 + Math.random() * 0.8,
    });
  }
  return circles;
}

function renderCircles(ctx: CanvasRenderingContext2D, circles: Circle[], width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  for (const circle of circles) {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${circle.r}, ${circle.g}, ${circle.b}, ${circle.alpha})`;
    ctx.fill();
  }
}

function renderTargetToCanvas(targetCircles: Circle[]): void {
  if (!targetCanvas) return;
  const ctx = targetCanvas.getContext('2d');
  if (ctx) {
    renderCircles(ctx, targetCircles, 400, 400);
  }
}

function calculateFitness(genome: Genome): number {
  if (!targetCanvas) return 0;

  const tempCanvas = createOffscreenCanvas(400, 400);
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return 0;

  renderCircles(ctx, genome, 400, 400);

  const targetData = targetCanvas.getContext('2d')?.getImageData(0, 0, 400, 400);
  const genomeData = ctx.getImageData(0, 0, 400, 400);

  if (!targetData || !genomeData) return 0;

  let sumSquaredDiff = 0;

  for (let i = 0; i < targetData.data.length; i += 4) {
    for (let j = 0; j < 3; j++) { // RGB channels only
      const diff = targetData.data[i + j] - genomeData.data[i + j];
      sumSquaredDiff += diff * diff;
    }
  }

  // Higher fitness = lower difference
  // Normalize to a more readable scale
  const maxDiff = 400 * 400 * 3 * 255 * 255;
  return 1 - (sumSquaredDiff / maxDiff);
}

function tournamentSelection(population: { genome: Genome; fitness: number }[]): Genome {
  let best = population[Math.floor(Math.random() * population.length)];

  for (let i = 1; i < TOURNAMENT_SIZE; i++) {
    const candidate = population[Math.floor(Math.random() * population.length)];
    if (candidate.fitness > best.fitness) {
      best = candidate;
    }
  }

  return best.genome.map(c => ({ ...c }));
}

function singlePointCrossover(parent1: Genome, parent2: Genome): [Genome, Genome] {
  const crossoverPoint = Math.floor(Math.random() * CIRCLES_PER_INDIVIDUAL);

  const child1 = [
    ...parent1.slice(0, crossoverPoint),
    ...parent2.slice(crossoverPoint),
  ];

  const child2 = [
    ...parent2.slice(0, crossoverPoint),
    ...parent1.slice(crossoverPoint),
  ];

  return [child1, child2];
}

function mutateGenome(genome: Genome): Genome {
  return genome.map(circle => {
    const mutated = { ...circle };

    if (Math.random() < MUTATION_RATE) {
      mutated.x = Math.max(0, Math.min(400, mutated.x + (Math.random() - 0.5) * 40));
    }
    if (Math.random() < MUTATION_RATE) {
      mutated.y = Math.max(0, Math.min(400, mutated.y + (Math.random() - 0.5) * 40));
    }
    if (Math.random() < MUTATION_RATE) {
      mutated.radius = Math.max(5, Math.min(100, mutated.radius + (Math.random() - 0.5) * 20));
    }
    if (Math.random() < MUTATION_RATE) {
      mutated.r = Math.max(0, Math.min(255, mutated.r + Math.floor((Math.random() - 0.5) * 50)));
    }
    if (Math.random() < MUTATION_RATE) {
      mutated.g = Math.max(0, Math.min(255, mutated.g + Math.floor((Math.random() - 0.5) * 50)));
    }
    if (Math.random() < MUTATION_RATE) {
      mutated.b = Math.max(0, Math.min(255, mutated.b + Math.floor((Math.random() - 0.5) * 50)));
    }
    if (Math.random() < MUTATION_RATE) {
      mutated.alpha = Math.max(0.1, Math.min(1.0, mutated.alpha + (Math.random() - 0.5) * 0.2));
    }

    return mutated;
  });
}

export function createGeneticAlgorithm(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let targetCircles: Circle[] = [];
  let population: { genome: Genome; fitness: number }[] = [];
  let bestGenome: Genome = [];
  let bestFitness = 0;

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function initGA(): void {
    // Initialize target
    targetCircles = generateTargetCircles(TARGET_CIRCLES_COUNT);

    // Initialize offscreen canvas for target
    targetCanvas = createOffscreenCanvas(400, 400);
    renderTargetToCanvas(targetCircles);

    // Initialize population
    population = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const genome = randomGenome();
      const fitness = calculateFitness(genome);
      population.push({ genome, fitness });
    }

    // Find best individual
    population.sort((a, b) => b.fitness - a.fitness);
    bestGenome = population[0].genome.map(c => ({ ...c }));
    bestFitness = population[0].fitness;

    state.generation = 0;
    state.elapsedTime = 0;
  }

  function evolveGeneration(): void {
    // Create new population
    const newPopulation: { genome: Genome; fitness: number }[] = [];

    // Elitism: keep best individual
    newPopulation.push({
      genome: bestGenome.map(c => ({ ...c })),
      fitness: bestFitness,
    });

    // Generate rest of population through selection, crossover, and mutation
    while (newPopulation.length < POPULATION_SIZE) {
      const parent1 = tournamentSelection(population);
      const parent2 = tournamentSelection(population);
      let [child1, child2] = singlePointCrossover(parent1, parent2);

      child1 = mutateGenome(child1);
      child2 = mutateGenome(child2);

      const fitness1 = calculateFitness(child1);
      const fitness2 = calculateFitness(child2);

      newPopulation.push({ genome: child1, fitness: fitness1 });
      if (newPopulation.length < POPULATION_SIZE) {
        newPopulation.push({ genome: child2, fitness: fitness2 });
      }
    }

    population = newPopulation;

    // Update best individual
    population.sort((a, b) => b.fitness - a.fitness);
    bestGenome = population[0].genome.map(c => ({ ...c }));
    bestFitness = population[0].fitness;

    state.generation++;
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      initGA();
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      // Evolve one generation per update
      evolveGeneration();
    },

    render(ctx: CanvasRenderingContext2D): void {
      // Clear canvas
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, config.width, config.height);

      // Draw separator line
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(config.width / 2, 0);
      ctx.lineTo(config.width / 2, config.height);
      ctx.stroke();

      // Left side: Target
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.fillRect(20, 20, 360, 360);
      renderCircles(ctx, targetCircles, 380, 380);
      ctx.translate(20, 20);
      ctx.restore();

      // Right side: Best individual
      ctx.save();
      ctx.translate(config.width / 2, 0);
      ctx.fillStyle = '#fff';
      ctx.fillRect(20, 20, 360, 360);
      renderCircles(ctx, bestGenome, 380, 380);
      ctx.restore();

      // Labels
      ctx.fillStyle = '#eee';
      ctx.font = '16px monospace';
      ctx.fillText('TARGET', 150, 50);
      ctx.fillText(`Generation: ${state.generation}`, config.width / 2 + 100, 50);

      // Fitness score
      ctx.font = '14px monospace';
      const fitnessPercent = (bestFitness * 100).toFixed(2);
      ctx.fillText(`Fitness: ${fitnessPercent}%`, config.width / 2 + 100, 75);

      // Instructions
      ctx.fillStyle = '#888';
      ctx.font = '12px monospace';
      ctx.fillText('← Target pattern', 130, config.height - 30);
      ctx.fillText('Best individual →', config.width / 2 + 110, config.height - 30);
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      initGA();
    },

    destroy(): void {
      targetCircles = [];
      population = [];
      bestGenome = [];
      targetCanvas = null;
    },
  };
}
