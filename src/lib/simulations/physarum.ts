import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'physarum',
  name: 'Physarum',
  description: 'Slime mold network formation through trail following',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const CELL_SIZE = 2;
const NUM_AGENTS = 4000;
const SENSOR_DISTANCE = 9;
const SENSOR_ANGLE = Math.PI / 8;
const TURN_SPEED = 0.2;
const MOVE_SPEED = 1;
const DECAY_FACTOR = 0.95;
const DIFFUSE_RATE = 0.9;
const DEPOSIT_AMOUNT = 0.5;

interface Agent {
  x: number;
  y: number;
  angle: number;
}

export function createPhysarum(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let cols = 0;
  let rows = 0;
  let trailMap: Float32Array;
  let nextTrailMap: Float32Array;
  let agents: Agent[] = [];

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function initializeAgents(): void {
    agents = [];
    for (let i = 0; i < NUM_AGENTS; i++) {
      agents.push({
        x: Math.random() * config.width,
        y: Math.random() * config.height,
        angle: Math.random() * Math.PI * 2,
      });
    }
  }

  function sense(trail: Float32Array, x: number, y: number, angle: number): number {
    const senseX = x + Math.cos(angle) * SENSOR_DISTANCE;
    const senseY = y + Math.sin(angle) * SENSOR_DISTANCE;
    const col = Math.floor(senseX / CELL_SIZE);
    const row = Math.floor(senseY / CELL_SIZE);

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      return trail[row * cols + col];
    }
    return 0;
  }

  function updateAgents(): void {
    for (const agent of agents) {
      const col = Math.floor(agent.x / CELL_SIZE);
      const row = Math.floor(agent.y / CELL_SIZE);

      const leftSense = sense(trailMap, agent.x, agent.y, agent.angle - SENSOR_ANGLE);
      const centerSense = sense(trailMap, agent.x, agent.y, agent.angle);
      const rightSense = sense(trailMap, agent.x, agent.y, agent.angle + SENSOR_ANGLE);

      const maxSense = Math.max(leftSense, centerSense, rightSense);

      if (maxSense === centerSense && centerSense > leftSense && centerSense > rightSense) {
        // Continue straight with slight random wobble
        agent.angle += (Math.random() - 0.5) * 0.1;
      } else if (maxSense === leftSense) {
        agent.angle -= TURN_SPEED * (Math.random() * 0.5 + 0.5);
      } else if (maxSense === rightSense) {
        agent.angle += TURN_SPEED * (Math.random() * 0.5 + 0.5);
      } else {
        // Random turn if all equal
        agent.angle += (Math.random() - 0.5) * 0.5;
      }

      agent.x += Math.cos(agent.angle) * MOVE_SPEED;
      agent.y += Math.sin(agent.angle) * MOVE_SPEED;

      if (agent.x < 0) { agent.x = 0; agent.angle = Math.PI - agent.angle; }
      if (agent.x >= config.width) { agent.x = config.width - 1; agent.angle = Math.PI - agent.angle; }
      if (agent.y < 0) { agent.y = 0; agent.angle = -agent.angle; }
      if (agent.y >= config.height) { agent.y = config.height - 1; agent.angle = -agent.angle; }

      const newCol = Math.floor(agent.x / CELL_SIZE);
      const newRow = Math.floor(agent.y / CELL_SIZE);

      if (newCol >= 0 && newCol < cols && newRow >= 0 && newRow < rows) {
        trailMap[newRow * cols + newCol] = Math.min(1, trailMap[newRow * cols + newCol] + DEPOSIT_AMOUNT);
      }
    }
  }

  function diffuseAndDecay(): void {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let sum = 0;
        let count = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = row + dy;
            const nx = col + dx;

            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
              sum += trailMap[ny * cols + nx];
              count++;
            }
          }
        }

        const avg = sum / count;
        nextTrailMap[row * cols + col] = avg * DIFFUSE_RATE + trailMap[row * cols + col] * (1 - DIFFUSE_RATE);
      }
    }

    for (let i = 0; i < trailMap.length; i++) {
      nextTrailMap[i] = Math.min(1, nextTrailMap[i] * DECAY_FACTOR);
    }

    const temp = trailMap;
    trailMap = nextTrailMap;
    nextTrailMap = temp;
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      cols = Math.floor(config.width / CELL_SIZE);
      rows = Math.floor(config.height / CELL_SIZE);

      trailMap = new Float32Array(cols * rows);
      nextTrailMap = new Float32Array(cols * rows);

      initializeAgents();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      updateAgents();
      diffuseAndDecay();

      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, config.width, config.height);

      const imageData = ctx.getImageData(0, 0, config.width, config.height);
      const data = imageData.data;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const value = trailMap[row * cols + col];

          if (value > 0.01) {
            const pixelIndex = ((row * CELL_SIZE) * config.width + (col * CELL_SIZE)) * 4;

            for (let dy = 0; dy < CELL_SIZE; dy++) {
              for (let dx = 0; dx < CELL_SIZE; dx++) {
                const px = col * CELL_SIZE + dx;
                const py = row * CELL_SIZE + dy;

                if (px < config.width && py < config.height) {
                  const idx = (py * config.width + px) * 4;
                  const intensity = Math.min(255, Math.floor(value * 255));

                  data[idx] = intensity;
                  data[idx + 1] = intensity;
                  data[idx + 2] = Math.floor(intensity * 0.8);
                  data[idx + 3] = 255;
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
      for (const agent of agents) {
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, 0.8, 0, Math.PI * 2);
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
      trailMap.fill(0);
      initializeAgents();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      trailMap = new Float32Array(0);
      nextTrailMap = new Float32Array(0);
      agents = [];
    },
  };
}
