import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'avida',
  name: 'Avida-lite',
  description: 'Digital evolution with self-replicating programs',
  width: 800,
  height: 600,
  targetFPS: 30,
};

const GRID_SIZE = 60;
const CELL_SIZE = 10;
const GENOME_SIZE = 50;
const MAX_CYCLES_PER_UPDATE = 1000;
const MUTATION_RATE = 0.02;

enum Instruction {
  NOP = 0,    // No operation
  MOV_A,      // Move next value to register A
  MOV_B,      // Move next value to register B
  ADD,        // A = A + B
  SUB,        // A = A - B
  MUL,        // A = A * B
  DIV,        // A = A / B (if B != 0)
  MOD,        // A = A % B (if B != 0)
  AND,        // A = A & B
  OR,         // A = A | B
  XOR,        // A = A ^ B
  NOT,        // A = ~A
  SHL,        // A = A << 1
  SHR,        // A = A >> 1
  JMP,        // Jump forward by next value
  JZ,         // Jump if A == 0
  JNZ,        // Jump if A != 0
  INPUT,      // A = next input value
  OUTPUT,     // Output A value
  COPY,       // Copy instruction to offspring
  DIVIDE,     // Complete reproduction
  NUM_INSTRUCTIONS
}

interface Organism {
  genome: number[];
  ip: number;
  regA: number;
  regB: number;
  energy: number;
  age: number;
  offspring: number[];
  copyIndex: number;
  inputs: number[];
  inputIndex: number;
  outputs: number[];
  tasksCompleted: Set<string>;
}

const TASKS: { name: string; check: (inputs: number[], output: number) => boolean; reward: number }[] = [
  { name: 'NOT', check: (i, o) => i.length >= 1 && o === (~i[0] & 0xFF), reward: 2 },
  { name: 'AND', check: (i, o) => i.length >= 2 && o === (i[0] & i[1]), reward: 4 },
  { name: 'OR', check: (i, o) => i.length >= 2 && o === (i[0] | i[1]), reward: 4 },
  { name: 'XOR', check: (i, o) => i.length >= 2 && o === (i[0] ^ i[1]), reward: 8 },
  { name: 'NOR', check: (i, o) => i.length >= 2 && o === (~(i[0] | i[1]) & 0xFF), reward: 8 },
  { name: 'NAND', check: (i, o) => i.length >= 2 && o === (~(i[0] & i[1]) & 0xFF), reward: 8 },
  { name: 'EQU', check: (i, o) => i.length >= 2 && o === (~(i[0] ^ i[1]) & 0xFF), reward: 16 },
];

function createRandomGenome(): number[] {
  const genome: number[] = [];
  for (let i = 0; i < GENOME_SIZE; i++) {
    genome.push(Math.floor(Math.random() * Instruction.NUM_INSTRUCTIONS));
  }
  genome[GENOME_SIZE - 3] = Instruction.COPY;
  genome[GENOME_SIZE - 2] = Instruction.JNZ;
  genome[GENOME_SIZE - 1] = Instruction.DIVIDE;
  return genome;
}

function createOrganism(genome: number[]): Organism {
  return {
    genome: [...genome],
    ip: 0,
    regA: 0,
    regB: 0,
    energy: 100,
    age: 0,
    offspring: [],
    copyIndex: 0,
    inputs: [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)],
    inputIndex: 0,
    outputs: [],
    tasksCompleted: new Set(),
  };
}

function mutateGenome(genome: number[]): number[] {
  const mutated = [...genome];
  for (let i = 0; i < mutated.length; i++) {
    if (Math.random() < MUTATION_RATE) {
      if (Math.random() < 0.7) {
        mutated[i] = Math.floor(Math.random() * Instruction.NUM_INSTRUCTIONS);
      } else if (Math.random() < 0.5 && i < mutated.length - 1) {
        [mutated[i], mutated[i + 1]] = [mutated[i + 1], mutated[i]];
      }
    }
  }
  return mutated;
}

function executeInstruction(org: Organism): boolean {
  if (org.energy <= 0) return false;
  
  const inst = org.genome[org.ip % org.genome.length];
  org.ip++;
  org.energy--;
  org.age++;
  
  const getNext = () => org.genome[org.ip++ % org.genome.length];
  
  switch (inst) {
    case Instruction.NOP:
      break;
    case Instruction.MOV_A:
      org.regA = getNext();
      break;
    case Instruction.MOV_B:
      org.regB = getNext();
      break;
    case Instruction.ADD:
      org.regA = (org.regA + org.regB) & 0xFF;
      break;
    case Instruction.SUB:
      org.regA = (org.regA - org.regB) & 0xFF;
      break;
    case Instruction.MUL:
      org.regA = (org.regA * org.regB) & 0xFF;
      break;
    case Instruction.DIV:
      if (org.regB !== 0) org.regA = Math.floor(org.regA / org.regB) & 0xFF;
      break;
    case Instruction.MOD:
      if (org.regB !== 0) org.regA = (org.regA % org.regB) & 0xFF;
      break;
    case Instruction.AND:
      org.regA = org.regA & org.regB;
      break;
    case Instruction.OR:
      org.regA = org.regA | org.regB;
      break;
    case Instruction.XOR:
      org.regA = org.regA ^ org.regB;
      break;
    case Instruction.NOT:
      org.regA = (~org.regA) & 0xFF;
      break;
    case Instruction.SHL:
      org.regA = (org.regA << 1) & 0xFF;
      break;
    case Instruction.SHR:
      org.regA = org.regA >> 1;
      break;
    case Instruction.JMP:
      org.ip = (org.ip + getNext()) % org.genome.length;
      break;
    case Instruction.JZ:
      const jzOffset = getNext();
      if (org.regA === 0) org.ip = (org.ip + jzOffset) % org.genome.length;
      break;
    case Instruction.JNZ:
      const jnzOffset = getNext();
      if (org.regA !== 0) org.ip = (org.ip + jnzOffset) % org.genome.length;
      break;
    case Instruction.INPUT:
      org.regA = org.inputs[org.inputIndex % org.inputs.length];
      org.inputIndex++;
      break;
    case Instruction.OUTPUT:
      org.outputs.push(org.regA);
      for (const task of TASKS) {
        if (!org.tasksCompleted.has(task.name) && task.check(org.inputs, org.regA)) {
          org.tasksCompleted.add(task.name);
          org.energy += task.reward * 10;
        }
      }
      break;
    case Instruction.COPY:
      if (org.copyIndex < GENOME_SIZE) {
        org.offspring[org.copyIndex] = org.genome[org.copyIndex];
        org.copyIndex++;
      }
      org.regA = org.copyIndex < GENOME_SIZE ? 1 : 0;
      break;
    case Instruction.DIVIDE:
      if (org.offspring.length >= GENOME_SIZE * 0.5) {
        return true;
      }
      break;
  }
  
  return false;
}

export function createAvida(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let grid: (Organism | null)[][] = [];
  let totalOrganisms = 0;
  let totalTasks = 0;
  let generation = 0;
  
  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function initializeGrid(): void {
    grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        if (Math.random() < 0.3) {
          grid[y][x] = createOrganism(createRandomGenome());
        } else {
          grid[y][x] = null;
        }
      }
    }
    totalOrganisms = grid.flat().filter(o => o !== null).length;
    totalTasks = 0;
    generation = 0;
  }

  function findEmptyNeighbor(x: number, y: number): { x: number; y: number } | null {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
    const shuffled = dirs.sort(() => Math.random() - 0.5);
    
    for (const [dx, dy] of shuffled) {
      const nx = (x + dx + GRID_SIZE) % GRID_SIZE;
      const ny = (y + dy + GRID_SIZE) % GRID_SIZE;
      if (grid[ny][nx] === null) {
        return { x: nx, y: ny };
      }
    }
    
    const [dx, dy] = shuffled[0];
    return { x: (x + dx + GRID_SIZE) % GRID_SIZE, y: (y + dy + GRID_SIZE) % GRID_SIZE };
  }

  function runSimulationStep(): void {
    let cyclesUsed = 0;
    const births: { x: number; y: number; genome: number[] }[] = [];
    const deaths: { x: number; y: number }[] = [];
    
    for (let y = 0; y < GRID_SIZE && cyclesUsed < MAX_CYCLES_PER_UPDATE; y++) {
      for (let x = 0; x < GRID_SIZE && cyclesUsed < MAX_CYCLES_PER_UPDATE; x++) {
        const org = grid[y][x];
        if (!org) continue;
        
        const cyclesToRun = Math.min(5 + org.tasksCompleted.size * 2, 20);
        
        for (let c = 0; c < cyclesToRun && cyclesUsed < MAX_CYCLES_PER_UPDATE; c++) {
          cyclesUsed++;
          const shouldDivide = executeInstruction(org);
          
          if (shouldDivide && org.offspring.length >= GENOME_SIZE * 0.5) {
            while (org.offspring.length < GENOME_SIZE) {
              org.offspring.push(Instruction.NOP);
            }
            const childGenome = mutateGenome(org.offspring);
            const neighbor = findEmptyNeighbor(x, y);
            if (neighbor) {
              births.push({ x: neighbor.x, y: neighbor.y, genome: childGenome });
            }
            org.offspring = [];
            org.copyIndex = 0;
            org.energy = Math.max(50, org.energy - 50);
            generation++;
            break;
          }
          
          if (org.energy <= 0 || org.age > 5000) {
            deaths.push({ x, y });
            break;
          }
        }
      }
    }
    
    for (const death of deaths) {
      grid[death.y][death.x] = null;
      totalOrganisms--;
    }
    
    for (const birth of births) {
      if (grid[birth.y][birth.x] === null) {
        grid[birth.y][birth.x] = createOrganism(birth.genome);
        totalOrganisms++;
      } else {
        const existing = grid[birth.y][birth.x]!;
        if (existing.energy < 20) {
          grid[birth.y][birth.x] = createOrganism(birth.genome);
        }
      }
    }
    
    totalTasks = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const org = grid[y][x];
        if (org) {
          totalTasks += org.tasksCompleted.size;
        }
      }
    }
  }

  function getOrganismColor(org: Organism): string {
    const taskCount = org.tasksCompleted.size;
    if (taskCount === 0) return '#444';
    if (taskCount === 1) return '#4a4';
    if (taskCount === 2) return '#4a4';
    if (taskCount === 3) return '#aa4';
    if (taskCount === 4) return '#a84';
    if (taskCount === 5) return '#a44';
    if (taskCount === 6) return '#a4a';
    return '#f4f';
  }

  return {
    config,
    state,

    init(ctx: CanvasRenderingContext2D): void {
      initializeGrid();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running) return;

      state.elapsedTime += deltaTime;
      runSimulationStep();
      state.generation = generation;
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, config.width, config.height);
      
      const gridPixelSize = GRID_SIZE * CELL_SIZE;
      const offsetX = (config.width - gridPixelSize) / 2;
      const offsetY = (config.height - gridPixelSize) / 2;
      
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const org = grid[y][x];
          if (org) {
            ctx.fillStyle = getOrganismColor(org);
            ctx.fillRect(offsetX + x * CELL_SIZE, offsetY + y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
            
            if (org.tasksCompleted.size > 0) {
              const brightness = Math.min(1, org.energy / 100);
              ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
              ctx.fillRect(offsetX + x * CELL_SIZE + 2, offsetY + y * CELL_SIZE + 2, CELL_SIZE - 5, CELL_SIZE - 5);
            }
          }
        }
      }
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(25, 90, 160, 120);
      
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`Organisms: ${totalOrganisms}`, 35, 110);
      ctx.fillText(`Generation: ${generation}`, 35, 130);
      ctx.fillText(`Tasks Done: ${totalTasks}`, 35, 150);
      
      ctx.fillText('Task Colors:', 35, 175);
      ctx.fillStyle = '#444'; ctx.fillRect(35, 180, 10, 10);
      ctx.fillStyle = '#fff'; ctx.fillText('0', 50, 190);
      ctx.fillStyle = '#4a4'; ctx.fillRect(70, 180, 10, 10);
      ctx.fillStyle = '#fff'; ctx.fillText('1-2', 85, 190);
      ctx.fillStyle = '#aa4'; ctx.fillRect(115, 180, 10, 10);
      ctx.fillStyle = '#fff'; ctx.fillText('3+', 130, 190);
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      initializeGrid();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      grid = [];
    },
  };
}
