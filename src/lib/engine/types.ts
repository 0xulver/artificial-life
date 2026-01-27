/**
 * Core simulation engine types
 */

export interface SimulationConfig {
  /** Unique identifier for the simulation */
  id: string;
  /** Display name */
  name: string;
  /** Brief description */
  description: string;
  /** Default canvas width */
  width: number;
  /** Default canvas height */
  height: number;
  /** Target frames per second (0 = unlimited) */
  targetFPS?: number;
}

export interface SimulationState {
  /** Whether simulation is running */
  running: boolean;
  /** Current generation/tick count */
  generation: number;
  /** Time elapsed in seconds */
  elapsedTime: number;
}

export interface SimulationStat {
  label: string;
  value: string | number;
}

export interface Simulation {
  readonly config: SimulationConfig;
  readonly state: SimulationState;
  
  init(ctx: CanvasRenderingContext2D): void;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  start(): void;
  pause(): void;
  reset(): void;
  destroy(): void;
  
  getStats?(): SimulationStat[];
}

/**
 * Factory function type for creating simulations
 */
export type SimulationFactory = (config?: Partial<SimulationConfig>) => Simulation;

/**
 * Registry entry for a simulation
 */
export interface SimulationRegistryEntry {
  id: string;
  name: string;
  description: string;
  category: 'cellular-automata' | 'agent-based' | 'evolutionary' | 'physics' | 'other';
  complexity: 'easy' | 'medium' | 'hard';
  factory: SimulationFactory;
}
