import { SimulationRegistryEntry } from '@/lib/engine/types';
import { createGameOfLife } from './game-of-life';
import { createLenia } from './lenia';
import { createBoids } from './boids';
import { createLangtonsAnt } from './langtons-ant';

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
];

export function getSimulationById(id: string): SimulationRegistryEntry | undefined {
  return simulationRegistry.find((s) => s.id === id);
}
