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

export interface Simulation {
  /** Configuration */
  readonly config: SimulationConfig;
  
  /** Current state */
  readonly state: SimulationState;
  
  /**
   * Initialize/reset the simulation
   * @param ctx Canvas 2D rendering context
   */
  init(ctx: CanvasRenderingContext2D): void;
  
  /**
   * Update simulation state
   * @param deltaTime Time since last update in seconds
   */
  update(deltaTime: number): void;
  
  /**
   * Render current state to canvas
   * @param ctx Canvas 2D rendering context
   */
  render(ctx: CanvasRenderingContext2D): void;
  
  /**
   * Start the simulation
   */
  start(): void;
  
  /**
   * Pause the simulation
   */
  pause(): void;
  
  /**
   * Reset to initial state
   */
  reset(): void;
  
  /**
   * Clean up resources
   */
  destroy(): void;
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
