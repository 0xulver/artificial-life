# Neural Cellular Automata - WebGL2 Optimization Research

## Problem Statement

We have a working Neural Cellular Automata (NCA) implementation using WebGL1 that renders a self-growing lizard pattern. We want to upgrade to WebGL2 with half-float textures (RGBA16F) for better performance, but our attempts have failed with visual corruption (static noise instead of the expected pattern).

## Goal

Migrate from WebGL1 with 8-bit textures + atan/tan value packing to WebGL2 with native 16-bit half-float textures while maintaining identical visual output.

## Current Working Implementation (WebGL1)

### Architecture Overview

The NCA runs a neural network on every pixel of a 2D grid. Each pixel has 16 channels (RGBA × 4 packed textures). The network:

1. **Perception**: Computes Sobel gradients → 48 channels (16 identity + 16 sobel_x + 16 sobel_y)
2. **Dense Layer 1**: 48 → 128 channels (with ReLU activation implied by packing)
3. **Dense Layer 2**: 128 → 16 channels
4. **Dropout**: Stochastic cell update (50% probability)
5. **Update**: Add update to current state

### The Critical Packing System

Because WebGL1 only supports 8-bit textures (RGBA values 0-255), neural network activations (which can be any float) are encoded using `atan/tan`:

```glsl
// ENCODING (setOutput): float → 8-bit
void setOutput(vec4 v) {
    vec2 p = u_output.packScaleBias;
    v = atan(v) / p.x + p.y;  // Maps (-∞, +∞) → (0, 1)
    gl_FragColor = v;
}

// DECODING (_readUV): 8-bit → float  
vec4 _readUV(Tensor tensor, sampler2D tex, vec2 uv) {
    vec4 v = texture2D(tex, uv);
    vec2 p = tensor.packScaleBias;
    v = tan((v - p.y) * p.x);  // Maps (0, 1) → (-∞, +∞)
    return v;
}
```

### Per-Tensor Pack Parameters

Different tensors use different `packScaleBias` values:

```typescript
const MAX_ACTIVATION_VALUE = 10.0;
const C = Math.atan(MAX_ACTIVATION_VALUE);  // ≈ 1.4711

// Default tensors (can be negative):
packScaleBias = [2.0 * C, 127.0 / 255.0];  // [2.9422, 0.498]
// Maps: 0.0 → 127/255, range spans full 0-255

// ReLU tensors (always positive):
packScaleBias = [C, 0.0];  // [1.4711, 0.0]
// Maps: 0.0 → 0, only uses positive range
```

The `hiddenBuf` tensor uses the ReLU packing because it comes after a ReLU activation.

### Complete Working Code

```typescript
import { Simulation, SimulationConfig, SimulationState } from '@/lib/engine/types';
import * as twgl from 'twgl.js';

const DEFAULT_CONFIG: SimulationConfig = {
  id: 'neural-ca',
  name: 'Neural Cellular Automata',
  description: 'Self-organizing neural network that grows and regenerates patterns',
  width: 800,
  height: 600,
  targetFPS: 60,
};

const CHANNEL_N = 16;
const MAX_ACTIVATION_VALUE = 10.0;
const GRID_SIZE = 1024;
const STEPS_PER_FRAME = 16;

const PRETRAINED_MODEL = [
  {
    // Base64-encoded uint8 weights for layer 1: 48 → 128
    data_b64: "...",  // Truncated for brevity
    in_ch: 48,
    out_ch: 128,
    weight_scale: 1.3162267208099365,
    bias_scale: 0.4913739264011383,
    type: "uint8"
  },
  {
    // Base64-encoded uint8 weights for layer 2: 128 → 16
    data_b64: "...",  // Truncated for brevity
    in_ch: 128,
    out_ch: 16,
    weight_scale: 1.15468430519104,
    bias_scale: 0.21424207091331482,
    type: "uint8"
  }
];

const VS_CODE = `
  attribute vec4 position;
  varying vec2 uv;
  void main() {
    uv = position.xy * 0.5 + 0.5;
    gl_Position = position;
  }
`;

function defInput(name: string): string {
  return `
    uniform Tensor ${name};
    uniform sampler2D ${name}_tex;
    vec4 ${name}_read(vec2 pos, float ch) {return _read(${name}, ${name}_tex, pos, ch);}
    vec4 ${name}_readUV(vec2 uv) {return _readUV(${name}, ${name}_tex, uv);}
  `;
}

const PREFIX = `
  precision highp float;
  struct Tensor {
    vec2 size;
    vec2 gridSize;
    float depth, depth4;
    vec2 packScaleBias;
  };
  uniform Tensor u_output;
  
  vec4 _readUV(Tensor tensor, sampler2D tex, vec2 uv) {
    vec4 v = texture2D(tex, uv);
    vec2 p = tensor.packScaleBias;
    v = tan((v - p.y) * p.x);
    return v;
  }

  vec4 _read(Tensor tensor, sampler2D tex, vec2 pos, float ch) {
    vec2 p = fract(pos / tensor.size);
    ch += 0.5;
    float tx = floor(mod(ch, tensor.gridSize.x));
    float ty = floor(ch / tensor.gridSize.x);
    p += vec2(tx, ty);
    return _readUV(tensor, tex, p / tensor.gridSize);
  }

  vec2 getOutputXY() {
    return mod(gl_FragCoord.xy, u_output.size);
  }
  
  float getOutputChannel() {
    vec2 xy = floor(gl_FragCoord.xy / u_output.size);
    return xy.y * u_output.gridSize.x + xy.x;
  }

  void setOutput(vec4 v) {
    vec2 p = u_output.packScaleBias;
    v = atan(v) / p.x + p.y;
    gl_FragColor = v;
  }

  ${defInput('u_input')}
`;

const PROGRAMS: Record<string, string> = {
  paint: `
    uniform vec2 u_pos;
    uniform float u_r;
    uniform float u_brush;
    void main() {
      vec2 diff = abs(getOutputXY() - u_pos + 0.5);
      diff = min(diff, u_output.size - diff);
      if (length(diff) >= u_r) discard;
      vec4 result = vec4(0.0);
      if (u_brush > 0.5) {
        float ch = getOutputChannel();
        result = vec4(vec3(float(ch > 0.5)), 1.0);
      }
      setOutput(result);
    }`,
    
  perception: `
    uniform float u_angle;
    const mat3 sobel = mat3(-1.0, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0) / 8.0;
    void main() {
      vec2 xy = getOutputXY();
      float ch = getOutputChannel();
      float filterBand = floor(ch / u_input.depth4);
      float inputCh = mod(ch, u_input.depth4);
      if (filterBand == 0.0) {
        setOutput(u_input_read(xy, inputCh));
      } else {
        vec4 dx = vec4(0.0), dy = vec4(0.0);
        for (int y = 0; y < 3; ++y)
        for (int x = 0; x < 3; ++x) {
          vec2 p = xy + vec2(float(x - 1), float(y - 1));
          vec4 a = u_input_read(p, inputCh);
          dx += sobel[y][x] * a;
          dy += sobel[x][y] * a;
        }
        float s = sin(u_angle), c = cos(u_angle);
        setOutput(filterBand == 1.0 ? dx * c - dy * s : dx * s + dy * c);
      }
    }`,
    
  dense: `
    uniform sampler2D u_weightTex;
    uniform vec3 u_weightCoefs;
    const float MAX_PACKED_DEPTH = 32.0;
    vec4 readWeight(vec2 p) {
      vec4 w = texture2D(u_weightTex, p);
      return (w - u_weightCoefs.z) * u_weightCoefs.x;
    }
    vec4 readBias(vec2 p) {
      vec4 w = texture2D(u_weightTex, p);
      return (w - u_weightCoefs.z) * u_weightCoefs.y;
    }
    void main() {
      vec2 xy = getOutputXY();
      float ch = getOutputChannel();
      if (ch >= u_output.depth4) return;
      float dy = 1.0 / (u_input.depth + 1.0);
      vec2 p = vec2((ch + 0.5) / u_output.depth4, dy * 0.5);
      vec4 result = vec4(0.0);
      for (float i = 0.0; i < MAX_PACKED_DEPTH; i += 1.0) {
        vec4 inVec = u_input_read(xy, i);
        result += inVec.x * readWeight(p); p.y += dy;
        result += inVec.y * readWeight(p); p.y += dy;
        result += inVec.z * readWeight(p); p.y += dy;
        result += inVec.w * readWeight(p); p.y += dy;
        if (i + 1.5 > u_input.depth4) break;
      }
      result += readBias(p);
      setOutput(result);
    }`,
    
  dropout: `
    uniform float u_seed, u_udpateProbability;
    varying vec2 uv;
    float hash13(vec3 p3) {
      p3 = fract(p3 * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    void main() {
      vec2 xy = getOutputXY();
      vec4 result = u_input_readUV(uv);
      result *= float(hash13(vec3(xy, u_seed)) <= u_udpateProbability);
      setOutput(result);
    }`,
    
  update: `
    ${defInput('u_update')}
    varying vec2 uv;
    void main() {
      vec2 xy = getOutputXY();
      float preMaxAlpha = 0.0, postMaxAlpha = 0.0;
      for (float y = -1.0; y <= 1.0; ++y)
      for (float x = -1.0; x <= 1.0; ++x) {
        vec2 p = xy + vec2(x, y);
        float preAlpha = u_input_read(p, 0.0).a;
        float updateAlpha = u_update_read(p, 0.0).a;
        float postAlpha = preAlpha + updateAlpha;
        preMaxAlpha = max(preAlpha, preMaxAlpha);
        postMaxAlpha = max(postAlpha, postMaxAlpha);
      }
      if (min(preMaxAlpha, postMaxAlpha) < 0.1) {
        setOutput(vec4(0.0));
        return;
      }
      vec4 state = u_input_readUV(uv);
      vec4 update = u_update_readUV(uv);
      setOutput(state + update);
    }`,
    
  vis: `
    varying vec2 uv;
    
    vec4 sampleState(vec2 xy) {
      return u_input_read(xy, 0.0);
    }
    
    vec4 bilinearSample(vec2 xy) {
      vec2 f = fract(xy);
      vec2 i = floor(xy);
      vec4 a = sampleState(i);
      vec4 b = sampleState(i + vec2(1.0, 0.0));
      vec4 c = sampleState(i + vec2(0.0, 1.0));
      vec4 d = sampleState(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    void main() {
      vec2 xy = vec2(uv.x, 1.0 - uv.y) * u_input.size;
      vec4 rgba = bilinearSample(xy);
      vec4 color = 1.0 - rgba.a + rgba;
      
      // Glow effect (optional)
      float glowRadius = 2.0;
      vec4 glow = vec4(0.0);
      float totalWeight = 0.0;
      for (float dy = -2.0; dy <= 2.0; dy += 1.0) {
        for (float dx = -2.0; dx <= 2.0; dx += 1.0) {
          float dist = length(vec2(dx, dy));
          if (dist <= glowRadius) {
            float weight = 1.0 - dist / glowRadius;
            weight = weight * weight;
            vec4 s = bilinearSample(xy + vec2(dx, dy));
            glow += s.a * weight * vec4(s.rgb, 1.0);
            totalWeight += weight;
          }
        }
      }
      glow /= totalWeight;
      
      float alpha = rgba.a;
      vec3 glowColor = glow.rgb * 0.4;
      color.rgb = mix(color.rgb + glowColor * (1.0 - alpha), color.rgb, alpha * 0.8);
      color.rgb = pow(color.rgb, vec3(0.95));
      
      gl_FragColor = vec4(color.rgb, 1.0);
    }`
};

// TypeScript implementation
interface Tensor {
  _type: 'tensor';
  fbi: twgl.FramebufferInfo;
  w: number;
  h: number;
  depth: number;
  gridW: number;
  gridH: number;
  depth4: number;
  tex: WebGLTexture;
  activation?: string;
  packScaleBias: [number, number];
}

function createTensor(gl: WebGLRenderingContext, h: number, w: number, depth: number, activation?: string): Tensor {
  const depth4 = Math.ceil(depth / 4);
  const gridW = Math.ceil(Math.sqrt(depth4));
  const gridH = Math.floor((depth4 + gridW - 1) / gridW);
  const texW = w * gridW;
  const texH = h * gridH;

  const attachments = [{ minMag: gl.NEAREST }];
  const fbi = twgl.createFramebufferInfo(gl, attachments, texW, texH);
  const tex = fbi.attachments[0] as WebGLTexture;
  
  const C = Math.atan(MAX_ACTIVATION_VALUE);
  let packScaleBias: [number, number] = [2.0 * C, 127.0 / 255.0];
  if (activation === 'relu') {
    packScaleBias = [C, 0.0];
  }
  
  return {
    _type: 'tensor',
    fbi, w, h, depth, gridW, gridH, depth4, tex,
    activation, packScaleBias
  };
}
```

## What We Tried (Failed Attempts)

### Attempt 1: Simple WebGL2 Upgrade with RGBA16F

Changed:
- `getContext('webgl')` → `getContext('webgl2')`
- Added `EXT_color_buffer_float` extension
- Changed texture format to `RGBA16F`
- Updated shaders to GLSL ES 3.0 (`#version 300 es`, `in`/`out`, `texture()`)
- Removed atan/tan packing (direct float storage)

**Result**: Static noise (green/purple stripes) - values exploded because the neural network weights were trained WITH the atan/tan nonlinearity as part of the computation.

### Attempt 2: Restored atan/tan with Unified Parameters

Kept WebGL2 + RGBA16F but restored atan/tan packing with a single set of parameters:

```glsl
const float MAX_VAL = 10.0;
const float ATAN_SCALE = 2.0 * atan(MAX_VAL);

vec4 unpack(vec4 v) {
  return tan(v * ATAN_SCALE - atan(MAX_VAL));
}

vec4 pack(vec4 v) {
  return (atan(v) + atan(MAX_VAL)) / ATAN_SCALE;
}
```

**Result**: Same static noise - failed because we lost the per-tensor `packScaleBias` differentiation (ReLU vs non-ReLU tensors).

### Attempt 3: Simple Clamping

```glsl
void setOutput(vec4 v) {
  fragColor = clamp(v, -10.0, 10.0);
}
```

**Result**: Static noise - clamping doesn't replicate the smooth compression of atan.

## Why This Is Difficult

1. **The atan/tan is not just storage encoding** - it's part of the neural network's learned behavior. The weights were trained expecting these nonlinearities.

2. **Per-tensor parameters** - ReLU tensors use different pack parameters than regular tensors, which affects the range mapping.

3. **The transformation is bidirectional** - values are unpacked (tan) when read, processed, then packed (atan) when written. This happens every shader pass.

4. **Precision matters** - the original uses 8-bit storage with specific bias values (127/255 ≈ 0.498) that may not translate directly to 16-bit.

## Optimization Goals

We want WebGL2 for:

1. **RGBA16F textures** - Native 16-bit float storage, ~30-40% memory bandwidth reduction
2. **Eliminate atan/tan overhead** - These are expensive transcendental functions called for every pixel, every channel, every frame
3. **Better precision** - 16-bit floats have more precision than 8-bit encoded values

## Questions for Research

1. **Is it possible to use RGBA16F without atan/tan if we retrain the model?** The current weights assume the nonlinearity.

2. **Can we keep atan/tan but benefit from RGBA16F storage?** Would storing in [0,1] range in 16-bit help at all?

3. **Is there a mathematical transformation to convert the existing weights?** Could we adjust weight_scale/bias_scale to compensate for removing atan/tan?

4. **What's the correct way to handle per-tensor pack parameters in WebGL2?** The ReLU tensor has `packScaleBias = [C, 0.0]` while others have `[2C, 0.498]`.

5. **Are there alternative value compression schemes** that are cheaper than atan/tan but still prevent value explosion?

## Technical Constraints

- Using `twgl.js` library for WebGL utilities
- Pretrained weights are uint8 with scale/bias coefficients
- Must maintain visual fidelity with the original implementation
- Browser compatibility: Chrome, Firefox, Safari (all support WebGL2)

## Reference

- Original Neural CA paper: https://distill.pub/2020/growing-ca/
- twgl.js: https://twgljs.org/
