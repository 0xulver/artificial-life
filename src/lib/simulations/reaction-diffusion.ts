import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'reaction-diffusion',
  name: 'Reaction-Diffusion',
  description: 'Gray-Scott model creating spots, stripes, and organic patterns',
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
  uniform float u_feed;
  uniform float u_kill;
  uniform float u_dU;
  uniform float u_dV;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 pixel = 1.0 / u_resolution;
    
    vec4 center = texture2D(u_state, v_texCoord);
    float u = center.r;
    float v = center.g;
    
    vec4 left = texture2D(u_state, v_texCoord + vec2(-pixel.x, 0.0));
    vec4 right = texture2D(u_state, v_texCoord + vec2(pixel.x, 0.0));
    vec4 up = texture2D(u_state, v_texCoord + vec2(0.0, -pixel.y));
    vec4 down = texture2D(u_state, v_texCoord + vec2(0.0, pixel.y));
    
    float lapU = left.r + right.r + up.r + down.r - 4.0 * u;
    float lapV = left.g + right.g + up.g + down.g - 4.0 * v;
    
    float uvv = u * v * v;
    
    float newU = u + u_dU * lapU - uvv + u_feed * (1.0 - u);
    float newV = v + u_dV * lapV + uvv - (u_feed + u_kill) * v;
    
    newU = clamp(newU, 0.0, 1.0);
    newV = clamp(newV, 0.0, 1.0);
    
    gl_FragColor = vec4(newU, newV, 0.0, 1.0);
  }
`;

const RENDER_SHADER = `
  precision highp float;
  
  uniform sampler2D u_state;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 state = texture2D(u_state, v_texCoord);
    float v = state.g;
    
    vec3 color = vec3(
      v * 0.7,
      v * 1.0,
      0.4 + v * 0.6
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

export function createReactionDiffusion(customConfig?: Partial<SimulationConfig>): Simulation {
  const config: SimulationConfig = { ...DEFAULT_CONFIG, ...customConfig };

  let gl: WebGLRenderingContext | null = null;
  let glCanvas: HTMLCanvasElement | null = null;
  let updateProgram: WebGLProgram | null = null;
  let renderProgram: WebGLProgram | null = null;
  let textures: WebGLTexture[] = [];
  let framebuffers: WebGLFramebuffer[] = [];
  let currentTexture = 0;
  let quadBuffer: WebGLBuffer | null = null;
  
  const simSize = 256;
  const feed = 0.055;
  const kill = 0.062;
  const dU = 0.21;
  const dV = 0.105;

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
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    }
    
    return texture;
  }

  function createInitialState(): Float32Array {
    const data = new Float32Array(simSize * simSize * 4);
    
    for (let i = 0; i < simSize * simSize; i++) {
      data[i * 4] = 1.0;
      data[i * 4 + 1] = 0.0;
      data[i * 4 + 2] = 0.0;
      data[i * 4 + 3] = 1.0;
    }
    
    const seedCount = 15;
    for (let s = 0; s < seedCount; s++) {
      const cx = Math.floor(Math.random() * simSize);
      const cy = Math.floor(Math.random() * simSize);
      const radius = 3 + Math.floor(Math.random() * 8);
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            const x = ((cx + dx) % simSize + simSize) % simSize;
            const y = ((cy + dy) % simSize + simSize) % simSize;
            const idx = (y * simSize + x) * 4;
            data[idx] = 0.5 + Math.random() * 0.1;
            data[idx + 1] = 0.25 + Math.random() * 0.1;
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
      glCanvas = document.createElement('canvas');
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
      
      const steps = 8;
      
      for (let step = 0; step < steps; step++) {
        const readTex = textures[currentTexture];
        const writeFb = framebuffers[1 - currentTexture];
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeFb);
        gl.viewport(0, 0, simSize, simSize);
        
        gl.useProgram(updateProgram);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, readTex);
        
        gl.uniform1i(gl.getUniformLocation(updateProgram, 'u_state'), 0);
        gl.uniform2f(gl.getUniformLocation(updateProgram, 'u_resolution'), simSize, simSize);
        gl.uniform1f(gl.getUniformLocation(updateProgram, 'u_feed'), feed);
        gl.uniform1f(gl.getUniformLocation(updateProgram, 'u_kill'), kill);
        gl.uniform1f(gl.getUniformLocation(updateProgram, 'u_dU'), dU);
        gl.uniform1f(gl.getUniformLocation(updateProgram, 'u_dV'), dV);
        
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
      if (!gl || !renderProgram || !glCanvas) return;
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, simSize, simSize);
      
      gl.useProgram(renderProgram);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[currentTexture]);
      
      gl.uniform1i(gl.getUniformLocation(renderProgram, 'u_state'), 0);
      
      const positionLocation = gl.getAttribLocation(renderProgram, 'a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(glCanvas, 0, 0, config.width, config.height);
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
      
      gl.bindTexture(gl.TEXTURE_2D, textures[0]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, simSize, simSize, 0, gl.RGBA, gl.FLOAT, initialData);
      
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
      glCanvas = null;
    },
  };
}
