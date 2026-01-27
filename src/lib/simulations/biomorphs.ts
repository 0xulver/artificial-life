import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'biomorphs',
  name: 'Biomorphs',
  description: 'Interactive evolution through aesthetic selection',
  width: 600,
  height: 600,
  targetFPS: 30,
};

type Genome = number[];

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Create a random genome
 */
function randomGenome(): Genome {
  return [
    Math.floor(Math.random() * 7) + 2, // branches: 2-8
    Math.floor(Math.random() * 26) + 5, // branch length: 5-30
    Math.floor(Math.random() * 46) + 15, // branch angle: 15-60
    Math.floor(Math.random() * 5) + 2, // recursion depth: 2-6
    Math.random() * 0.4 + 0.5, // length scaling: 0.5-0.9
    Math.floor(Math.random() * 41) - 20, // angle variation: -20 to +20
    Math.floor(Math.random() * 41) + 20, // trunk length: 20-60
    Math.random() > 0.5 ? 1 : 0, // symmetry: 0 or 1
    Math.floor(Math.random() * 361), // color hue: 0-360
  ];
}

/**
 * Create a mutated copy of a genome
 */
function mutateGenome(parent: Genome): Genome {
  const mutations = Math.floor(Math.random() * 3) + 1; // 1-3 genes mutated
  const result = [...parent];

  for (let i = 0; i < mutations; i++) {
    const geneIndex = Math.floor(Math.random() * 9);

    switch (geneIndex) {
      case 0: // branches: 2-8
        result[geneIndex] = clamp(result[geneIndex] + (Math.random() > 0.5 ? 1 : -1), 2, 8);
        break;
      case 1: // branch length: 5-30
        result[geneIndex] = clamp(result[geneIndex] + (Math.random() > 0.5 ? 1 : -1), 5, 30);
        break;
      case 2: // branch angle: 15-60
        result[geneIndex] = clamp(result[geneIndex] + (Math.random() > 0.5 ? 1 : -1), 15, 60);
        break;
      case 3: // recursion depth: 2-6
        result[geneIndex] = clamp(result[geneIndex] + (Math.random() > 0.5 ? 1 : -1), 2, 6);
        break;
      case 4: // length scaling: 0.5-0.9
        result[geneIndex] = clamp(result[geneIndex] + (Math.random() > 0.5 ? 0.05 : -0.05), 0.5, 0.9);
        break;
      case 5: // angle variation: -20 to +20
        result[geneIndex] = clamp(result[geneIndex] + (Math.random() > 0.5 ? 1 : -1), -20, 20);
        break;
      case 6: // trunk length: 20-60
        result[geneIndex] = clamp(result[geneIndex] + (Math.random() > 0.5 ? 1 : -1), 20, 60);
        break;
      case 7: // symmetry: 0 or 1
        result[geneIndex] = result[geneIndex] === 0 ? 1 : 0;
        break;
      case 8: // color hue: 0-360
        result[geneIndex] = (result[geneIndex] + (Math.random() > 0.5 ? 5 : -5) + 360) % 360;
        break;
    }
  }

  return result;
}

/**
 * Draw a recursive tree/biomorph
 */
function drawBiomorph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  angle: number,
  depth: number,
  maxDepth: number,
  genes: Genome,
  scale: number = 1
): void {
  if (depth > maxDepth || length < 2) return;

  const endX = x + Math.sin(angle) * length * scale;
  const endY = y - Math.cos(angle) * length * scale;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  if (depth < maxDepth) {
    const branches = Math.floor(genes[0]);
    const baseAngle = (genes[2] * Math.PI) / 180;
    const variation = (genes[5] * Math.PI) / 180;
    const lengthScale = genes[4];

    for (let i = 0; i < branches; i++) {
      const spread = baseAngle;
      const offset = (i - (branches - 1) / 2) * spread;
      const angleVar = (Math.random() - 0.5) * variation;

      drawBiomorph(
        ctx,
        endX,
        endY,
        length * lengthScale,
        angle + offset + angleVar,
        depth + 1,
        maxDepth,
        genes,
        scale
      );
    }

    // Symmetric branches if enabled
    if (genes[7] === 1) {
      for (let i = 0; i < branches; i++) {
        const spread = baseAngle;
        const offset = (i - (branches - 1) / 2) * spread;
        const angleVar = (Math.random() - 0.5) * variation;

        drawBiomorph(
          ctx,
          endX,
          endY,
          length * lengthScale,
          -angle + offset + angleVar,
          depth + 1,
          maxDepth,
          genes,
          scale
        );
      }
    }
  }
}

/**
 * Render a single biomorph in a cell
 */
function renderCell(
  ctx: CanvasRenderingContext2D,
  genome: Genome,
  cellX: number,
  cellY: number,
  cellSize: number,
  isParent: boolean
): void {
  // Draw cell background
  ctx.fillStyle = isParent ? '#1a1a2e' : '#111';
  ctx.fillRect(cellX, cellY, cellSize, cellSize);

  // Draw border for parent
  if (isParent) {
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.strokeRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);
  }

  // Set color based on genome hue
  const hue = genome[8];
  ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
  ctx.lineWidth = 1.5;

  // Draw the biomorph
  const centerX = cellX + cellSize / 2;
  const baseY = cellY + cellSize - 20;
  const trunkLength = genome[6];

  drawBiomorph(ctx, centerX, baseY, trunkLength, 0, 1, genome[3], genome, 1);
}

export function createBiomorphs(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let parentGenome: Genome = [];
  let offspringGenomes: Genome[] = [];
  const gridSize = 3;
  const cellSize = config.width / gridSize;

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function initBiomorphs(): void {
    parentGenome = randomGenome();
    offspringGenomes = Array(8)
      .fill(null)
      .map(() => mutateGenome(parentGenome));
  }

  function handleClick(event: MouseEvent): void {
    const rect = event.target as HTMLCanvasElement;
    const rectBounds = rect.getBoundingClientRect();
    const x = event.clientX - rectBounds.left;
    const y = event.clientY - rectBounds.top;

    const gridWidth = gridSize * cellSize;
    const gridHeight = gridSize * cellSize;
    const offsetX = (config.width - gridWidth) / 2;
    const offsetY = (config.height - gridHeight) / 2;

    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);
    if (col < 0 || col >= gridSize || row < 0 || row >= gridSize) return;
    const cellIndex = row * gridSize + col;

    if (cellIndex === 4) {
      // Center cell is parent, regenerate mutants
      offspringGenomes = Array(8)
        .fill(null)
        .map(() => mutateGenome(parentGenome));
      state.generation++;
    } else if (cellIndex >= 0 && cellIndex < 9 && cellIndex !== 4) {
      // Clicked an offspring, make it the new parent
      const offspringIndex = cellIndex < 4 ? cellIndex : cellIndex - 1;
      parentGenome = offspringGenomes[offspringIndex];
      offspringGenomes = Array(8)
        .fill(null)
        .map(() => mutateGenome(parentGenome));
      state.generation++;
    }
  }

  return {
    config,
    state,

    init(ctx: CanvasRenderingContext2D): void {
      initBiomorphs();
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;

      // Add click handler
      const canvas = ctx.canvas;
      canvas.removeEventListener('click', handleClick);
      canvas.addEventListener('click', handleClick);
    },

    update(_deltaTime: number): void {
      // Biomorphs don't update automatically - they change on user interaction
    },

    render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, config.width, config.height);

      const gridWidth = gridSize * cellSize;
      const gridHeight = gridSize * cellSize;
      const offsetX = (config.width - gridWidth) / 2;
      const offsetY = (config.height - gridHeight) / 2;

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const cellX = offsetX + col * cellSize;
          const cellY = offsetY + row * cellSize;
          const cellIndex = row * gridSize + col;

          const isParent = cellIndex === 4;
          const genome = isParent ? parentGenome : offspringGenomes[cellIndex < 4 ? cellIndex : cellIndex - 1];

          renderCell(ctx, genome, cellX, cellY, cellSize, isParent);
        }
      }
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      initBiomorphs();
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      parentGenome = [];
      offspringGenomes = [];
    },
  };
}
