import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'sugarscape',
  name: 'Sugarscape',
  description: 'Artificial society with foraging agents',
  width: 800,
  height: 600,
  targetFPS: 15,
};

const CELL_SIZE = 6;
const INITIAL_AGENTS = 300;
const REPRODUCE_THRESHOLD = 50;

interface Agent {
  x: number;
  y: number;
  sugar: number;
  metabolism: number;
  vision: number;
}

interface GridCell {
  sugar: number;
  maxSugar: number;
  lastRegrowth: number;
}

export function createSugarscape(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let agents: Agent[] = [];
  let grid: GridCell[] = [];
  let cols = 0;
  let rows = 0;

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createSugarMountain(centerX: number, centerY: number, radius: number): void {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = y * cols + x;

        if (dist < radius) {
          const sugar = Math.floor(4 * (1 - dist / radius));
          if (sugar > grid[idx].maxSugar) {
            grid[idx].maxSugar = sugar;
          }
        }
      }
    }
  }

  function initializeWorld(): void {
    cols = Math.floor(config.width / CELL_SIZE);
    rows = Math.floor(config.height / CELL_SIZE);

    grid = [];
    for (let i = 0; i < cols * rows; i++) {
      grid.push({ sugar: 0, maxSugar: 0, lastRegrowth: 0 });
    }

    const centerX1 = Math.floor(cols * 0.75);
    const centerY1 = Math.floor(rows * 0.25);
    const centerX2 = Math.floor(cols * 0.25);
    const centerY2 = Math.floor(rows * 0.75);
    const radius = Math.min(cols, rows) * 0.35;

    createSugarMountain(centerX1, centerY1, radius);
    createSugarMountain(centerX2, centerY2, radius);

    for (let i = 0; i < grid.length; i++) {
      grid[i].sugar = grid[i].maxSugar;
    }

    agents = [];
    for (let i = 0; i < INITIAL_AGENTS; i++) {
      agents.push({
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
        sugar: 5 + Math.floor(Math.random() * 20),
        metabolism: 1 + Math.floor(Math.random() * 4),
        vision: 1 + Math.floor(Math.random() * 6),
      });
    }
  }

  function getCell(x: number, y: number): GridCell | null {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return null;
    return grid[y * cols + x];
  }

  function isOccupied(x: number, y: number, excludeAgent?: Agent): boolean {
    for (const agent of agents) {
      if (agent !== excludeAgent && agent.x === x && agent.y === y) {
        return true;
      }
    }
    return false;
  }

  function look(agent: Agent): { x: number; y: number; sugar: number } | null {
    let bestCell: { x: number; y: number; sugar: number } | null = null;
    let bestSugar = -1;

    for (let dy = -agent.vision; dy <= agent.vision; dy++) {
      for (let dx = -agent.vision; dx <= agent.vision; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (Math.abs(dx) + Math.abs(dy) > agent.vision) continue;

        const nx = agent.x + dx;
        const ny = agent.y + dy;
        const cell = getCell(nx, ny);

        if (cell && !isOccupied(nx, ny, agent)) {
          if (cell.sugar > bestSugar) {
            bestSugar = cell.sugar;
            bestCell = { x: nx, y: ny, sugar: cell.sugar };
          }
        }
      }
    }

    if (bestSugar <= 0) {
      const emptyCells: { x: number; y: number }[] = [];
      for (let dy = -agent.vision; dy <= agent.vision; dy++) {
        for (let dx = -agent.vision; dx <= agent.vision; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (Math.abs(dx) + Math.abs(dy) > agent.vision) continue;

          const nx = agent.x + dx;
          const ny = agent.y + dy;

          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !isOccupied(nx, ny, agent)) {
            emptyCells.push({ x: nx, y: ny });
          }
        }
      }

      if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const cell = getCell(randomCell.x, randomCell.y);
        return { x: randomCell.x, y: randomCell.y, sugar: cell?.sugar ?? 0 };
      }
    }

    return bestCell;
  }

  function move(agent: Agent, targetX: number, targetY: number): void {
    agent.x = targetX;
    agent.y = targetY;
  }

  function eat(agent: Agent): void {
    const cell = getCell(agent.x, agent.y);
    if (cell && cell.sugar > 0) {
      agent.sugar += cell.sugar;
      cell.sugar = 0;
    }
  }

  function metabolize(agent: Agent): void {
    agent.sugar -= agent.metabolism;
  }

  function updateAgents(): void {
    const newAgents: Agent[] = [];

    for (const agent of agents) {
      const target = look(agent);

      if (target) {
        move(agent, target.x, target.y);
      }

      eat(agent);
      metabolize(agent);

      if (agent.sugar > REPRODUCE_THRESHOLD) {
        agent.sugar = Math.floor(agent.sugar / 2);
        const child: Agent = {
          x: agent.x,
          y: agent.y,
          sugar: agent.sugar,
          metabolism: agent.metabolism,
          vision: agent.vision,
        };
        newAgents.push(child);
      }
    }

    agents = agents.filter(a => a.sugar > 0);
    agents.push(...newAgents);
  }

  function regrowSugar(): void {
    for (let i = 0; i < grid.length; i++) {
      const cell = grid[i];
      if (cell.sugar < cell.maxSugar && Math.random() < 0.1) {
        cell.sugar = Math.min(cell.maxSugar, cell.sugar + 1);
      }
    }
  }

  return {
    config,
    state,

    init(_ctx: CanvasRenderingContext2D): void {
      initializeWorld();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;

      updateAgents();
      regrowSugar();

      state.generation++;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#2d1810';
      ctx.fillRect(0, 0, config.width, config.height);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = grid[y * cols + x];
          if (cell.maxSugar > 0) {
            const intensity = cell.sugar / 4;
            const r = Math.floor(255);
            const g = Math.floor(180 + intensity * 75);
            const b = Math.floor(0);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }

      ctx.fillStyle = '#ff3333';
      for (const agent of agents) {
        ctx.beginPath();
        ctx.arc(
          agent.x * CELL_SIZE + CELL_SIZE / 2,
          agent.y * CELL_SIZE + CELL_SIZE / 2,
          2.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(`Agents: ${agents.length}  Gen: ${state.generation}`, 10, 90);
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      initializeWorld();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      agents = [];
      grid = [];
    },
  };
}
