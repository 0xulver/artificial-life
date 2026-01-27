import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'lenia',
  name: 'Lenia',
  description: 'Continuous cellular automaton with lifelike emergent creatures',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const UPDATE_SHADER = `
  precision highp float;
  
  uniform sampler2D u_state;
  uniform vec2 u_resolution;
  uniform float u_mu;
  uniform float u_sigma;
  uniform float u_dt;
  
  varying vec2 v_texCoord;
  
  const float R = 12.0;
  
  float bell(float x, float m, float s) {
    float d = x - m;
    return exp(-(d * d) / (2.0 * s * s));
  }
  
  float kernelWeight(float r) {
    return bell(r, 0.5, 0.15);
  }
  
  void main() {
    vec2 pixel = 1.0 / u_resolution;
    float sum = 0.0;
    float kernelSum = 0.0;
    
    for (int dy = -12; dy <= 12; dy++) {
      for (int dx = -12; dx <= 12; dx++) {
        float fdx = float(dx);
        float fdy = float(dy);
        float dist = sqrt(fdx * fdx + fdy * fdy);
        
        if (dist <= R && dist > 0.0) {
          float r = dist / R;
          float weight = kernelWeight(r);
          vec2 offset = vec2(fdx, fdy) * pixel;
          float state = texture2D(u_state, v_texCoord + offset).r;
          sum += state * weight;
          kernelSum += weight;
        }
      }
    }
    
    if (kernelSum > 0.0) {
      sum /= kernelSum;
    }
    
    float growth = 2.0 * bell(sum, u_mu, u_sigma) - 1.0;
    float current = texture2D(u_state, v_texCoord).r;
    float next = current + u_dt * growth;
    next = clamp(next, 0.0, 1.0);
    
    gl_FragColor = vec4(next, next, next, 1.0);
  }
`;

const RENDER_SHADER = `
  precision highp float;
  
  uniform sampler2D u_state;
  varying vec2 v_texCoord;
  
  void main() {
    float value = texture2D(u_state, v_texCoord).r;
    float intensity = pow(value, 0.6);
    
    vec3 color = vec3(
      intensity * 0.2,
      intensity * 1.0,
      intensity * 0.6
    );
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  
  if (!vertexShader || !fragmentShader) return null;
  
  const program = gl.createProgram();
  if (!program) return null;
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
}

export function createLenia(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let gl: WebGLRenderingContext | null = null;
  let updateProgram: WebGLProgram | null = null;
  let renderProgram: WebGLProgram | null = null;
  let textures: WebGLTexture[] = [];
  let framebuffers: WebGLFramebuffer[] = [];
  let currentTexture = 0;
  let quadBuffer: WebGLBuffer | null = null;
  
  const simSize = 512;
  const R = 12;
  const mu = 0.15;
  const sigma = 0.016;
  const T = 10;

  const state: SimulationState = {
    running: false,
    generation: 0,
    elapsedTime: 0,
  };

  function createTexture(gl: WebGLRenderingContext, width: number, height: number, data: Float32Array | null): WebGLTexture | null {
    const texture = gl.createTexture();
    if (!texture) return null;
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    if (data) {
      const rgba = new Float32Array(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        rgba[i * 4] = data[i];
        rgba[i * 4 + 1] = data[i];
        rgba[i * 4 + 2] = data[i];
        rgba[i * 4 + 3] = 1.0;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, rgba);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    }
    
    return texture;
  }

  function bell(x: number, m: number, s: number): number {
    return Math.exp(-((x - m) * (x - m)) / (2 * s * s));
  }

  function createInitialState(): Float32Array {
    const data = new Float32Array(simSize * simSize);
    
    const numCreatures = 5 + Math.floor(Math.random() * 5);
    for (let c = 0; c < numCreatures; c++) {
      const cx = Math.floor(Math.random() * simSize);
      const cy = Math.floor(Math.random() * simSize);
      const radius = 10 + Math.floor(Math.random() * 15);
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const x = ((cx + dx) % simSize + simSize) % simSize;
            const y = ((cy + dy) % simSize + simSize) % simSize;
            const r = dist / radius;
            const value = bell(r, 0.5, 0.25) * (0.7 + Math.random() * 0.3);
            const idx = y * simSize + x;
            data[idx] = Math.max(data[idx], value);
          }
        }
      }
    }
    
    return data;
  }

  return {
    config,
    state,

    init(ctx: CanvasRenderingContext2D): void {
      const canvas = ctx.canvas;
      
      const glCanvas = document.createElement('canvas');
      glCanvas.width = simSize;
      glCanvas.height = simSize;
      
      gl = glCanvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        preserveDrawingBuffer: true,
      });
      
      if (!gl) {
        console.error('WebGL not supported');
        return;
      }
      
      const ext = gl.getExtension('OES_texture_float');
      if (!ext) {
        console.error('OES_texture_float not supported');
        return;
      }
      
      gl.getExtension('OES_texture_float_linear');
      
      updateProgram = createProgram(gl, VERTEX_SHADER, UPDATE_SHADER);
      renderProgram = createProgram(gl, VERTEX_SHADER, RENDER_SHADER);
      
      if (!updateProgram || !renderProgram) {
        console.error('Failed to create shader programs');
        return;
      }
      
      const initialData = createInitialState();
      
      for (let i = 0; i < 2; i++) {
        const texture = createTexture(gl, simSize, simSize, i === 0 ? initialData : null);
        if (!texture) continue;
        textures.push(texture);
        
        const fb = gl.createFramebuffer();
        if (!fb) continue;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        framebuffers.push(fb);
      }
      
      quadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1,  -1, 1,
        -1,  1,  1, -1,   1, 1,
      ]), gl.STATIC_DRAW);
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      
      state.generation = 0;
      state.elapsedTime = 0;
      state.running = true;
    },

    update(deltaTime: number): void {
      if (!state.running || !gl || !updateProgram) return;

      state.elapsedTime += deltaTime;
      
      const steps = 3;
      
      for (let step = 0; step < steps; step++) {
        const readTex = textures[currentTexture];
        const writeFb = framebuffers[1 - currentTexture];
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeFb);
        gl.viewport(0, 0, simSize, simSize);
        
        gl.useProgram(updateProgram);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, readTex);
        
        const stateLocation = gl.getUniformLocation(updateProgram, 'u_state');
        const resolutionLocation = gl.getUniformLocation(updateProgram, 'u_resolution');
        const muLocation = gl.getUniformLocation(updateProgram, 'u_mu');
        const sigmaLocation = gl.getUniformLocation(updateProgram, 'u_sigma');
        const dtLocation = gl.getUniformLocation(updateProgram, 'u_dt');
        
        gl.uniform1i(stateLocation, 0);
        gl.uniform2f(resolutionLocation, simSize, simSize);
        gl.uniform1f(muLocation, mu);
        gl.uniform1f(sigmaLocation, sigma);
        gl.uniform1f(dtLocation, 1.0 / T);
        
        const positionLocation = gl.getAttribLocation(updateProgram, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        currentTexture = 1 - currentTexture;
      }
      
      state.generation += steps;
    },

    render(ctx: CanvasRenderingContext2D): void {
      if (!gl || !renderProgram) return;
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, simSize, simSize);
      
      gl.useProgram(renderProgram);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[currentTexture]);
      
      const stateLocation = gl.getUniformLocation(renderProgram, 'u_state');
      gl.uniform1i(stateLocation, 0);
      
      const positionLocation = gl.getAttribLocation(renderProgram, 'a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      ctx.drawImage(gl.canvas, 0, 0, config.width, config.height);
    },

    start(): void {
      state.running = true;
    },

    pause(): void {
      state.running = false;
    },

    reset(): void {
      if (!gl) return;
      
      const initialData = createInitialState();
      const rgba = new Float32Array(simSize * simSize * 4);
      for (let i = 0; i < simSize * simSize; i++) {
        rgba[i * 4] = initialData[i];
        rgba[i * 4 + 1] = initialData[i];
        rgba[i * 4 + 2] = initialData[i];
        rgba[i * 4 + 3] = 1.0;
      }
      
      gl.bindTexture(gl.TEXTURE_2D, textures[0]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, simSize, simSize, 0, gl.RGBA, gl.FLOAT, rgba);
      
      currentTexture = 0;
      state.generation = 0;
      state.elapsedTime = 0;
    },

    destroy(): void {
      if (!gl) return;
      
      textures.forEach(t => gl!.deleteTexture(t));
      framebuffers.forEach(fb => gl!.deleteFramebuffer(fb));
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      if (updateProgram) gl.deleteProgram(updateProgram);
      if (renderProgram) gl.deleteProgram(renderProgram);
      
      textures = [];
      framebuffers = [];
      gl = null;
    },
  };
}
