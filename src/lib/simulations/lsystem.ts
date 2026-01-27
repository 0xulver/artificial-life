import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

interface LSystemPreset {
  name: string;
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  iterations: number;
  fractal?: boolean;
}

const PRESETS: LSystemPreset[] = [
  {
    name: 'Plant',
    axiom: 'X',
    rules: {
      X: 'F+[[X]-X]-F[-FX]+X',
      F: 'FF'
    },
    angle: 25,
    iterations: 4
  },
  {
    name: 'Sierpinski',
    axiom: 'F-G-G',
    rules: {
      F: 'F-G+F+G-F',
      G: 'GG'
    },
    angle: 120,
    iterations: 5,
    fractal: true
  },
  {
    name: 'Dragon',
    axiom: 'FX',
    rules: {
      X: 'X+YF+',
      Y: '-FX-Y'
    },
    angle: 90,
    iterations: 8
  },
  {
    name: 'Koch',
    axiom: 'F',
    rules: {
      F: 'F+F-F-F+F'
    },
    angle: 90,
    iterations: 4,
    fractal: true
  }
];

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'lsystem',
  name: 'L-System',
  description: 'Procedural plant and fractal generation',
  width: 800,
  height: 600,
  targetFPS: 0
};

interface Point {
  x: number;
  y: number;
}

class LSystem implements Simulation {
  readonly config: SimulationConfig;
  readonly state: SimulationState;
  
  private ctx: CanvasRenderingContext2D | null = null;
  private currentPreset: LSystemPreset | null = null;
  private points: Point[] = [];

  constructor(config?: Partial<SimulationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      running: false,
      generation: 0,
      elapsedTime: 0
    };
  }

  private generateString(axiom: string, rules: Record<string, string>, iterations: number): string {
    let result = axiom;
    for (let i = 0; i < iterations; i++) {
      let next = '';
      for (const char of result) {
        next += rules[char] || char;
      }
      result = next;
    }
    return result;
  }

  private generatePoints(axiom: string, rules: Record<string, string>, angleDeg: number, iterations: number): Point[] {
    const result = this.generateString(axiom, rules, iterations);
    const points: Point[] = [{ x: 0, y: 0 }];
    const stack: { x: number; y: number; angle: number }[] = [];
    let x = 0;
    let y = 0;
    let angle = -90;

    const angleRad = (angleDeg * Math.PI) / 180;

    for (const char of result) {
      if (char === 'F' || char === 'G') {
        const rad = (angle * Math.PI) / 180;
        x += Math.cos(rad) * 10;
        y += Math.sin(rad) * 10;
        points.push({ x, y });
      } else if (char === '+') {
        angle += angleDeg;
      } else if (char === '-') {
        angle -= angleDeg;
      } else if (char === '[') {
        stack.push({ x, y, angle });
      } else if (char === ']') {
        const state = stack.pop();
        if (state) {
          x = state.x;
          y = state.y;
          angle = state.angle;
          points.push({ x, y });
        }
      }
    }

    return points;
  }

  private calculateBounds(points: Point[]): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    return { minX, maxX, minY, maxY };
  }

  init(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
    this.reset();
  }

  start(): void {
    this.state.running = true;
  }

  pause(): void {
    this.state.running = false;
  }

  reset(): void {
    this.state.generation = 0;
    this.state.elapsedTime = 0;
    this.state.running = false;

    const presetIndex = Math.floor(Math.random() * PRESETS.length);
    this.currentPreset = PRESETS[presetIndex];

    this.points = this.generatePoints(
      this.currentPreset.axiom,
      this.currentPreset.rules,
      this.currentPreset.angle,
      this.currentPreset.iterations
    );

    if (this.ctx) {
      this.render(this.ctx);
    }
  }

  update(_deltaTime: number): void {
    // L-Systems are not animated - they regenerate on reset
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.ctx || this.points.length === 0) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    const bounds = this.calculateBounds(this.points);
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;

    const padding = 40;
    const maxWidth = width - padding * 2;
    const maxHeight = height - padding * 2;

    let scaleX = 1;
    let scaleY = 1;

    if (contentWidth > 0) {
      scaleX = maxWidth / contentWidth;
    }
    if (contentHeight > 0) {
      scaleY = maxHeight / contentHeight;
    }

    const scale = Math.min(scaleX, scaleY, 2);
    const lineWidth = Math.max(1, 3 - scale * 0.5);

    const offsetX = (width - contentWidth * scale) / 2 - bounds.minX * scale;
    const offsetY = (height - contentHeight * scale) / 2 - bounds.minY * scale;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const colorStep = this.currentPreset?.fractal ? 360 / (this.points.length / 10) : 0;

    for (let i = 0; i < this.points.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(this.points[i].x * scale + offsetX, this.points[i].y * scale + offsetY);
      ctx.lineTo(this.points[i + 1].x * scale + offsetX, this.points[i + 1].y * scale + offsetY);

      if (this.currentPreset?.fractal) {
        const hue = (i * colorStep) % 360;
        ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
      } else {
        ctx.strokeStyle = '#4a4';
      }

      ctx.stroke();
    }
  }

  destroy(): void {
    this.ctx = null;
  }
}

export function createLSystem(config?: Partial<SimulationConfig>): Simulation {
  return new LSystem(config);
}
