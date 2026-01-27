import { SimulationRegistryEntry } from '@/lib/engine/types';
import { createGameOfLife } from './game-of-life';
import { createLenia } from './lenia';
import { createBoids } from './boids';
import { createLangtonsAnt } from './langtons-ant';
import { createBriansBrain } from './brians-brain';
import { createHighLife, createSeeds, createDayNight } from './life-like';
import { createParticleLife } from './particle-life';
import { createWireworld } from './wireworld';
import { createAntColony } from './ant-colony';
import { createReactionDiffusion } from './reaction-diffusion';
import { createPredatorPrey } from './predator-prey';
import { createNeuralCA } from './neural-ca';
import { createElementaryCA } from './elementary-ca';
import { createSandpile } from './sandpile';
import { createSchelling } from './schelling';
import { createFirefly } from './firefly';
import { createDLA } from './dla';
import { createLSystem } from './lsystem';
import { createBiomorphs } from './biomorphs';
import { createDaisyworld } from './daisyworld';
import { createPhysarum } from './physarum';
import { createSugarscape } from './sugarscape';
import { createLangtonsLoops } from './langtons-loops';
import { createGeneticAlgorithm } from './genetic-algorithm';

export const simulationRegistry: SimulationRegistryEntry[] = [
  {
    id: 'game-of-life',
    name: "Conway's Game of Life",
    description: 'Classic cellular automaton where cells live or die based on neighbor count',
    category: 'cellular-automata',
    complexity: 'easy',
    factory: createGameOfLife,
  },
  {
    id: 'lenia',
    name: 'Lenia',
    description: 'Continuous cellular automaton with lifelike emergent creatures',
    category: 'cellular-automata',
    complexity: 'medium',
    factory: createLenia,
  },
  {
    id: 'boids',
    name: 'Boids Flocking',
    description: 'Emergent flocking behavior from three simple rules',
    category: 'agent-based',
    complexity: 'easy',
    factory: createBoids,
  },
  {
    id: 'langtons-ant',
    name: "Langton's Ant",
    description: 'Simple rules create complex emergent patterns and highways',
    category: 'cellular-automata',
    complexity: 'easy',
    factory: createLangtonsAnt,
  },
  {
    id: 'brians-brain',
    name: "Brian's Brain",
    description: '3-state automaton with Alive, Dying, and Dead creating oscillating patterns',
    category: 'cellular-automata',
    complexity: 'easy',
    factory: createBriansBrain,
  },
  {
    id: 'highlife',
    name: 'HighLife',
    description: 'Life variant that produces replicators (B36/S23)',
    category: 'cellular-automata',
    complexity: 'easy',
    factory: createHighLife,
  },
  {
    id: 'seeds',
    name: 'Seeds',
    description: 'Explosive growth pattern where cells only survive one generation (B2/S)',
    category: 'cellular-automata',
    complexity: 'easy',
    factory: createSeeds,
  },
  {
    id: 'daynight',
    name: 'Day & Night',
    description: 'Symmetric life variant with inverse-stable patterns (B3678/S34678)',
    category: 'cellular-automata',
    complexity: 'easy',
    factory: createDayNight,
  },
  {
    id: 'particle-life',
    name: 'Particle Life',
    description: 'Emergent ecosystems from simple attraction/repulsion rules between particle types',
    category: 'agent-based',
    complexity: 'easy',
    factory: createParticleLife,
  },
  {
    id: 'wireworld',
    name: 'Wireworld',
    description: 'Cellular automaton for simulating electronic circuits and logic gates',
    category: 'cellular-automata',
    complexity: 'easy',
    factory: createWireworld,
  },
  {
    id: 'ant-colony',
    name: 'Ant Colony',
    description: 'Stigmergy simulation with ants leaving and following pheromone trails',
    category: 'agent-based',
    complexity: 'medium',
    factory: createAntColony,
  },
  {
    id: 'reaction-diffusion',
    name: 'Reaction-Diffusion',
    description: 'Gray-Scott model creating organic spots, stripes, and coral patterns',
    category: 'other',
    complexity: 'medium',
    factory: createReactionDiffusion,
  },
  {
    id: 'predator-prey',
    name: 'Predator-Prey',
    description: 'Ecosystem simulation with evolving predators hunting prey on grasslands',
    category: 'evolutionary',
    complexity: 'medium',
    factory: createPredatorPrey,
  },
  {
    id: 'neural-ca',
    name: 'Neural Cellular Automata',
    description: 'Self-organizing neural network that grows and regenerates patterns',
    category: 'cellular-automata',
    complexity: 'hard',
    factory: createNeuralCA,
  },
  {
    id: 'elementary-ca',
    name: 'Elementary CA Explorer',
    description: 'Explore all 256 elementary cellular automata rules including Rule 30, 90, 110',
    category: 'cellular-automata',
    complexity: 'easy',
    factory: createElementaryCA,
  },
  {
    id: 'sandpile',
    name: 'Abelian Sandpile',
    description: 'Self-organized criticality with cascading avalanches',
    category: 'cellular-automata',
    complexity: 'easy',
    factory: createSandpile,
  },
  {
    id: 'schelling',
    name: 'Schelling Segregation',
    description: 'Emergent segregation from mild individual preferences',
    category: 'agent-based',
    complexity: 'easy',
    factory: createSchelling,
  },
  {
    id: 'firefly',
    name: 'Firefly Synchronization',
    description: 'Coupled oscillators achieving spontaneous synchrony',
    category: 'agent-based',
    complexity: 'easy',
    factory: createFirefly,
  },
  {
    id: 'dla',
    name: 'Diffusion-Limited Aggregation',
    description: 'Fractal dendrite growth from random walking particles',
    category: 'other',
    complexity: 'easy',
    factory: createDLA,
  },
  {
    id: 'lsystem',
    name: 'L-System',
    description: 'Procedural plant and fractal generation with turtle graphics',
    category: 'other',
    complexity: 'easy',
    factory: createLSystem,
  },
  {
    id: 'biomorphs',
    name: 'Biomorphs',
    description: 'Interactive evolution through aesthetic selection',
    category: 'evolutionary',
    complexity: 'easy',
    factory: createBiomorphs,
  },
  {
    id: 'daisyworld',
    name: 'Daisyworld',
    description: 'Planetary temperature regulation through life (Gaia hypothesis)',
    category: 'evolutionary',
    complexity: 'medium',
    factory: createDaisyworld,
  },
  {
    id: 'physarum',
    name: 'Physarum',
    description: 'Slime mold network formation through trail following',
    category: 'agent-based',
    complexity: 'medium',
    factory: createPhysarum,
  },
  {
    id: 'sugarscape',
    name: 'Sugarscape',
    description: 'Artificial society with foraging agents',
    category: 'agent-based',
    complexity: 'medium',
    factory: createSugarscape,
  },
  {
    id: 'langtons-loops',
    name: "Langton's Loops",
    description: 'Self-replicating cellular automaton',
    category: 'cellular-automata',
    complexity: 'medium',
    factory: createLangtonsLoops,
  },
  {
    id: 'genetic-algorithm',
    name: 'Genetic Algorithm',
    description: 'Evolutionary optimization visualization',
    category: 'evolutionary',
    complexity: 'medium',
    factory: createGeneticAlgorithm,
  },
];

export function getSimulationById(id: string): SimulationRegistryEntry | undefined {
  return simulationRegistry.find((s) => s.id === id);
}
