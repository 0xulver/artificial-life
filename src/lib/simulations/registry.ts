import { SimulationRegistryEntry } from '@/lib/engine/types';
import { createGameOfLife } from './game-of-life';
import { createLenia } from './lenia';
import { createBoids } from './boids';
import { createLangtonsAnt } from './langtons-ant';
import { createBriansBrain } from './brians-brain';
import { createRule110 } from './rule-110';
import { createHighLife, createSeeds, createDayNight } from './life-like';
import { createParticleLife } from './particle-life';
import { createWireworld } from './wireworld';
import { createAntColony } from './ant-colony';
import { createReactionDiffusion } from './reaction-diffusion';
import { createPredatorPrey } from './predator-prey';

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
    id: 'rule-110',
    name: 'Rule 110',
    description: 'Turing-complete 1D cellular automaton creating complex patterns over time',
    category: 'cellular-automata',
    complexity: 'easy',
    factory: createRule110,
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
];

export function getSimulationById(id: string): SimulationRegistryEntry | undefined {
  return simulationRegistry.find((s) => s.id === id);
}
