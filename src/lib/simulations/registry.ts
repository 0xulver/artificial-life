import { SimulationRegistryEntry } from '@/lib/engine/types';
import { createGameOfLife } from './game-of-life';
import { createLenia } from './lenia';

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
];

export function getSimulationById(id: string): SimulationRegistryEntry | undefined {
  return simulationRegistry.find((s) => s.id === id);
}
