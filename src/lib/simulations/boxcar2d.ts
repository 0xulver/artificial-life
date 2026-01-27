import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';
import Matter from 'matter-js';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'boxcar2d',
  name: 'BoxCar2D',
  description: 'Evolving vehicles with genetic algorithms',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const POPULATION_SIZE = 8;
const GENERATION_TIME = 12000;
const GENOME_SIZE = 16;

interface Vehicle {
  genome: number[];
  body: Matter.Body | null;
  wheels: Matter.Body[];
  constraints: Matter.Constraint[];
  fitness: number;
  startX: number;
}

function createGenome(): number[] {
  const genome: number[] = [];
  for (let i = 0; i < GENOME_SIZE; i++) {
    genome.push(Math.random());
  }
  return genome;
}

function mutateGenome(genome: number[]): number[] {
  const mutated = [...genome];
  const mutations = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < mutations; i++) {
    const idx = Math.floor(Math.random() * GENOME_SIZE);
    mutated[idx] += (Math.random() - 0.5) * 0.3;
    mutated[idx] = Math.max(0, Math.min(1, mutated[idx]));
  }
  return mutated;
}

function crossover(parent1: number[], parent2: number[]): number[] {
  const crossPoint = Math.floor(Math.random() * GENOME_SIZE);
  const child: number[] = [];
  for (let i = 0; i < GENOME_SIZE; i++) {
    child.push(i < crossPoint ? parent1[i] : parent2[i]);
  }
  return child;
}

export function createBoxCar2D(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let engine: Matter.Engine | null = null;
  let world: Matter.World | null = null;
  let vehicles: Vehicle[] = [];
  let ground: Matter.Body[] = [];
  let generationStartTime = 0;
  let generation = 0;
  let cameraX = 0;
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function generateTerrain(): void {
    if (!world) return;
    
    ground = [];
    const segmentWidth = 60;
    const numSegments = 200;
    let x = -200;
    let y = config.height - 100;
    
    for (let i = 0; i < numSegments; i++) {
      const nextY = y + (Math.random() - 0.4) * 30;
      const clampedNextY = Math.max(config.height - 250, Math.min(config.height - 50, nextY));
      
      const midX = x + segmentWidth / 2;
      const midY = (y + clampedNextY) / 2;
      const angle = Math.atan2(clampedNextY - y, segmentWidth);
      const length = Math.sqrt(segmentWidth * segmentWidth + (clampedNextY - y) * (clampedNextY - y));
      
      const segment = Matter.Bodies.rectangle(midX, midY, length, 20, {
        isStatic: true,
        angle: angle,
        friction: 0.8,
        render: { fillStyle: '#4a3728' },
      });
      
      ground.push(segment);
      Matter.World.add(world, segment);
      
      x += segmentWidth;
      y = clampedNextY;
    }
  }

  function createVehicleFromGenome(genome: number[], startX: number): Vehicle {
    if (!world) return { genome, body: null, wheels: [], constraints: [], fitness: 0, startX };
    
    const chassisVertices: Matter.Vector[] = [];
    const numVertices = 8;
    const baseRadius = 20 + genome[0] * 30;
    
    for (let i = 0; i < numVertices; i++) {
      const angle = (i / numVertices) * Math.PI * 2;
      const radiusVariation = genome[i % GENOME_SIZE] * 0.5 + 0.5;
      const r = baseRadius * radiusVariation;
      chassisVertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    
    const chassisY = config.height - 200;
    const chassis = Matter.Bodies.fromVertices(startX, chassisY, [chassisVertices], {
      friction: 0.5,
      restitution: 0.2,
      density: 0.001,
    });
    
    if (!chassis) {
      const fallbackChassis = Matter.Bodies.rectangle(startX, chassisY, 50, 30, {
        friction: 0.5,
        restitution: 0.2,
        density: 0.001,
      });
      Matter.World.add(world, fallbackChassis);
      return { genome, body: fallbackChassis, wheels: [], constraints: [], fitness: 0, startX };
    }
    
    Matter.World.add(world, chassis);
    
    const wheels: Matter.Body[] = [];
    const constraints: Matter.Constraint[] = [];
    
    const wheel1Vertex = Math.floor(genome[8] * numVertices);
    const wheel2Vertex = Math.floor(genome[9] * numVertices);
    const wheel1Radius = 10 + genome[10] * 25;
    const wheel2Radius = 10 + genome[11] * 25;
    
    const angle1 = (wheel1Vertex / numVertices) * Math.PI * 2;
    const angle2 = (wheel2Vertex / numVertices) * Math.PI * 2;
    const r1 = baseRadius * (genome[wheel1Vertex % GENOME_SIZE] * 0.5 + 0.5);
    const r2 = baseRadius * (genome[wheel2Vertex % GENOME_SIZE] * 0.5 + 0.5);
    
    const wheel1X = startX + Math.cos(angle1) * r1;
    const wheel1Y = chassisY + Math.sin(angle1) * r1;
    const wheel2X = startX + Math.cos(angle2) * r2;
    const wheel2Y = chassisY + Math.sin(angle2) * r2;
    
    const wheel1 = Matter.Bodies.circle(wheel1X, wheel1Y, wheel1Radius, {
      friction: 0.9,
      restitution: 0.1,
      density: 0.002,
    });
    
    const wheel2 = Matter.Bodies.circle(wheel2X, wheel2Y, wheel2Radius, {
      friction: 0.9,
      restitution: 0.1,
      density: 0.002,
    });
    
    Matter.World.add(world, [wheel1, wheel2]);
    wheels.push(wheel1, wheel2);
    
    const constraint1 = Matter.Constraint.create({
      bodyA: chassis,
      bodyB: wheel1,
      pointA: { x: Math.cos(angle1) * r1 * 0.8, y: Math.sin(angle1) * r1 * 0.8 },
      length: 0,
      stiffness: 0.5,
      damping: 0.3,
    });
    
    const constraint2 = Matter.Constraint.create({
      bodyA: chassis,
      bodyB: wheel2,
      pointA: { x: Math.cos(angle2) * r2 * 0.8, y: Math.sin(angle2) * r2 * 0.8 },
      length: 0,
      stiffness: 0.5,
      damping: 0.3,
    });
    
    Matter.World.add(world, [constraint1, constraint2]);
    constraints.push(constraint1, constraint2);
    
    return { genome, body: chassis, wheels, constraints, fitness: 0, startX };
  }

  function createInitialPopulation(): void {
    vehicles = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const genome = createGenome();
      const startX = 100 + i * 20;
      vehicles.push(createVehicleFromGenome(genome, startX));
    }
  }

  function removeVehicle(vehicle: Vehicle): void {
    if (!world) return;
    if (vehicle.body) Matter.World.remove(world, vehicle.body);
    vehicle.wheels.forEach(w => Matter.World.remove(world!, w));
    vehicle.constraints.forEach(c => Matter.World.remove(world!, c));
  }

  function evolvePopulation(): void {
    vehicles.forEach(v => {
      if (v.body) {
        v.fitness = v.body.position.x - v.startX;
      }
    });
    
    vehicles.sort((a, b) => b.fitness - a.fitness);
    
    const newGenomes: number[][] = [];
    
    newGenomes.push(vehicles[0].genome);
    newGenomes.push(vehicles[1].genome);
    
    while (newGenomes.length < POPULATION_SIZE) {
      const parent1 = vehicles[Math.floor(Math.random() * 4)].genome;
      const parent2 = vehicles[Math.floor(Math.random() * 4)].genome;
      const child = mutateGenome(crossover(parent1, parent2));
      newGenomes.push(child);
    }
    
    vehicles.forEach(v => removeVehicle(v));
    vehicles = [];
    
    ground.forEach(g => Matter.World.remove(world!, g));
    generateTerrain();
    
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const startX = 100 + i * 20;
      vehicles.push(createVehicleFromGenome(newGenomes[i], startX));
    }
    
    generation++;
    generationStartTime = state.elapsedTime;
  }

  return {
    config,
    state,

    init(ctx: CanvasRenderingContext2D): void {
      engine = Matter.Engine.create();
      world = engine.world;
      world.gravity.y = 1;
      
      generateTerrain();
      createInitialPopulation();
      
      generationStartTime = 0;
      generation = 0;
      cameraX = 0;
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running || !engine) return;

      state.elapsedTime += deltaTime;
      
      Matter.Engine.update(engine, 16.67);
      
      let maxX = 0;
      vehicles.forEach(v => {
        if (v.body && v.body.position.x > maxX) {
          maxX = v.body.position.x;
        }
      });
      cameraX += (maxX - 300 - cameraX) * 0.05;
      
      if (state.elapsedTime - generationStartTime > GENERATION_TIME) {
        evolvePopulation();
      }
      
      state.generation = generation;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, config.width, config.height);
      
      ctx.save();
      ctx.translate(-cameraX, 0);
      
      ctx.fillStyle = '#4a3728';
      ground.forEach(segment => {
        const vertices = segment.vertices;
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
      });
      
      vehicles.forEach((vehicle, idx) => {
        if (!vehicle.body) return;
        
        const hue = (idx / POPULATION_SIZE) * 360;
        
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        const chassisVerts = vehicle.body.vertices;
        ctx.beginPath();
        ctx.moveTo(chassisVerts[0].x, chassisVerts[0].y);
        for (let i = 1; i < chassisVerts.length; i++) {
          ctx.lineTo(chassisVerts[i].x, chassisVerts[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = `hsl(${hue}, 50%, 30%)`;
        vehicle.wheels.forEach(wheel => {
          ctx.beginPath();
          ctx.arc(wheel.position.x, wheel.position.y, wheel.circleRadius || 15, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      
      ctx.restore();
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 55, 200, 75);
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(`Generation: ${generation}`, 20, 75);
      const bestFitness = Math.max(...vehicles.map(v => v.body ? v.body.position.x - v.startX : 0));
      ctx.fillText(`Best Distance: ${bestFitness.toFixed(0)}px`, 20, 95);
      const timeLeft = Math.max(0, (GENERATION_TIME - (state.elapsedTime - generationStartTime)) / 1000);
      ctx.fillText(`Time Left: ${timeLeft.toFixed(1)}s`, 20, 115);
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      if (!world) return;
      
      vehicles.forEach(v => removeVehicle(v));
      ground.forEach(g => Matter.World.remove(world!, g));
      
      generateTerrain();
      createInitialPopulation();
      
      generationStartTime = 0;
      generation = 0;
      cameraX = 0;
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      if (engine) {
        Matter.Engine.clear(engine);
        engine = null;
        world = null;
      }
      vehicles = [];
      ground = [];
    },
  };
}
