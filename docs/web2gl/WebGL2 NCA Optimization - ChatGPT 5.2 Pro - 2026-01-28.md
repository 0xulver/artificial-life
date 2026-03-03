## Root cause of the “static noise” in RGBA16F

Your WebGL1 implementation relies on a behavior that disappears when you switch your simulation buffers from **fixed‑point RGBA8** to **floating‑point RGBA16F**:

* **In RGBA8 (fixed‑point) render targets, fragment outputs are clamped to [0,1] and quantized.**
* **In RGBA16F (floating‑point) render targets, fragment outputs are *not* clamped to [0,1].** ([Khronos Registry][1])

That one change breaks two things your model depends on:

1. **The “activation functions” are implicit in your packing.**

   * For the ReLU tensor (`packScaleBias = [C, 0]`), negative values only become zero because the packed value would be <0 and then gets clamped to 0 by the *RGBA8 write*. With RGBA16F, that clamp is gone, so negative values survive and the implicit ReLU disappears. ([Khronos Registry][1])
2. **Your packing intentionally allows values beyond [0,1] for |x| > MAX_ACTIVATION_VALUE.**
   Because you used `C = atan(10)` rather than `π/2`, very large activations encode slightly outside [0,1]. In RGBA8 that saturates harmlessly; in RGBA16F it gets stored as-is. Then your `tan()` unpack sees arguments closer to ±π/2 and explodes (→ huge values / NaNs), producing the “green/purple stripe noise”.

So the first thing to do is **reintroduce the missing clamp/quantization explicitly** (or replace it with equivalent explicit activations).

---

## 1) Make WebGL2 + RGBA16F produce the *same* output as WebGL1 (fidelity-first)

### A. Keep your per-tensor packScaleBias **and add the missing clamp**

In WebGL2 RGBA16F targets, you must do what RGBA8 was doing for you:

```glsl
vec4 packToUNorm(vec4 v, vec2 sb) {
  // original packing
  v = atan(v) / sb.x + sb.y;

  // CRITICAL: emulate fixed-point render target clamp
  v = clamp(v, 0.0, 1.0);

  return v;
}

vec4 unpackFromUNorm(vec4 v, vec2 sb) {
  return tan((v - sb.y) * sb.x);
}
```

Then:

* `_readUV` becomes `unpackFromUNorm(texture(tex, uv), tensor.packScaleBias)`
* `setOutput` writes `packToUNorm(v, u_output.packScaleBias)` into your `outColor`

This alone usually fixes the “noise” because it restores:

* saturation behavior (values outside the representable pack range clamp)
* the implicit ReLU for tensors with `bias=0` (negative packed values clamp to 0)

This matches the spec-level behavior difference: float color buffers do not clamp outputs, fixed-point ones do. ([Khronos Registry][1])

### B. If you need “identical”, also emulate the 8-bit quantization

RGBA8 didn’t just clamp; it also **quantized to 8-bit**. If you want *as close as possible* to identical output (especially if the system is chaotic/sensitive), quantize the packed value yourself:

```glsl
vec4 quantizeUNorm8(vec4 v) {
  // emulate 8-bit UNORM (round to nearest)
  return floor(v * 255.0 + 0.5) / 255.0;
}

vec4 packLikeWebGL1(vec4 v, vec2 sb) {
  v = atan(v) / sb.x + sb.y;
  v = clamp(v, 0.0, 1.0);
  v = quantizeUNorm8(v);
  return v;
}
```

Use `packLikeWebGL1` in `setOutput`.

Notes:

* This restores the two key properties you trained with: **clamp + 8-bit discretization**.
* If you still see small differences, also disable dithering consistently (`gl.disable(gl.DITHER)`) in both versions; dithering can perturb low bits on RGBA8 targets.

### C. Make sure you’re enabling the right render-to-float extension(s)

For portability, check both:

* `EXT_color_buffer_half_float` (16-bit float render targets) ([MDN Web Docs][2])
* `EXT_color_buffer_float` (float render targets; often covers 16F and 32F depending on platform) ([Google Groups][3])

If neither is present, you must fall back to RGBA8.

---

## 2) Why your Attempt 2 failed even though atan/tan came back

Attempt 2 restored atan/tan but:

* removed per-tensor parameters **and**
* (most importantly) did **not** recreate the RGBA8 clamp behavior.

In RGBA16F, `pack(v)` can become >1 or <0 for large |v|, and that value is stored without saturation. Then `unpack()` computes `tan()` on arguments beyond what the original ever produced after clamping, and the state blows up. ([Khronos Registry][1])

So: **pack/unpack must include clamp when the render target is float.**

---

## 3) The fastest path to WebGL2 speed: remove tan/atan by replacing them with explicit activations

Here’s the key observation:

In your WebGL1 pipeline, downstream never sees the raw `v` you wrote; it sees:

[
v' = \tan\left( \left(\mathrm{clamp}\left(\frac{\arctan(v)}{s} + b, 0, 1\right) - b\right) s \right)
]

Because `tan` is monotone on the relevant interval, that’s exactly a **hard clamp in value-space** (ignoring 8-bit quantization):

[
v' = \mathrm{clamp}\left(v,\ \tan((0-b)s),\ \tan((1-b)s)\right)
]

So you can eliminate both `atan()` and `tan()` entirely by doing:

* **Signed tensors:** `v = clamp(v, lo, hi)`
* **ReLU tensors:** `v = clamp(max(v, 0), 0, hi)`

### Compute the correct clip ranges from your existing packScaleBias

Let `s = packScaleBias.x`, `b = packScaleBias.y`.

Then:

* `lo = tan((0 - b) * s)`
* `hi = tan((1 - b) * s)`

For your exact constants (`MAX_ACTIVATION_VALUE=10`, `C=atan(10)`):

* **Default tensors** (`s=2C`, `b=127/255`):
  `lo ≈ -9.4490944`
  `hi ≈  10.6183630`

* **ReLU tensor** (`s=C`, `b=0`):
  `lo = 0`
  `hi = 10`

This also explains why your Attempt 3 (“clamp to [-10,10]”) didn’t match: the actual trained saturations are **asymmetric** for the default tensors, and the hidden tensor needs **ReLU**, not symmetric clamp.

### What this buys you

* No transcendental ops per sample/read.
* Store state **directly as float16** in RGBA16F.
* Reads become simple `texture()` calls with no unpack.

### What you lose (unless you emulate it)

* The **8-bit quantization** effect in the packed domain.
  If the lizard pattern is sensitive to that discretization, you’ll see differences.

If you need closer matching without trig:

* you can add a small noise term (dither-like) or a coarse quantization in value-space,
* or do proper retraining (next section).

---

## 4) Answers to your research questions

### 1. Is it possible to use RGBA16F without atan/tan if we retrain the model?

Yes, and it’s the cleanest way to get the performance you actually want.

What to retrain with:

* **Explicit activations** that match your desired runtime:

  * `ReLU` after dense1
  * **state clipping** (or a smooth alternative like `tanh`/softsign) to prevent explosion
* Optionally **simulate float16** (or inject noise / quantization) during training so the learned dynamics are stable under reduced precision.

This avoids relying on WebGL1’s fixed-point clamping and avoids trig entirely.

### 2. Can we keep atan/tan but benefit from RGBA16F storage?

You can keep it, but it generally won’t help performance on its own:

* RGBA16F is **2× the bandwidth of RGBA8** per texel.
* If you’re still doing tan/atan everywhere, you’ve kept the expensive part and increased memory traffic.

The only reason to do “packed-in-float16” is as a stepping stone for correctness or if you want other WebGL2 features (better shader features, stricter control, etc.). The big performance win comes from removing tan/atan and/or reducing passes.

### 3. Is there a mathematical transformation to convert the existing weights?

Not an exact one.

Reason: the behavior you trained with is not just a linear transform; it includes:

* saturation/clamping
* ReLU via clamping
* quantization (8-bit discretization)

Those are non-linear and state-dependent. You can’t fold them into a single linear weight/bias rescale and preserve dynamics.

What you *can* do:

* **fine-tuning / distillation:** run the original WebGL1 implementation as a “teacher”, record state transitions, train a new network that reproduces them under float16 + explicit activations.
* **heuristic stabilization:** scale down `weight_scale` or the update magnitude to prevent blowup. This may restore “a pattern”, but not identical.

### 4. What’s the correct way to handle per-tensor pack parameters in WebGL2?

Two correct options:

**Option A (identical behavior):**

* Keep per-tensor `packScaleBias`
* In `setOutput`, do:

  * `atan` pack
  * **explicit clamp to [0,1]**
  * optionally **quantize to 8-bit**
* In `_readUV`, do `tan` unpack.

This reproduces WebGL1’s fixed-point behavior which float targets don’t provide. ([Khronos Registry][1])

**Option B (fast runtime, near-equivalent):**

* Stop packing entirely.
* Replace packing with explicit per-tensor activation:

  * default: `clamp(v, lo, hi)` using `lo/hi` computed from `(s,b)`
  * relu: `clamp(max(v,0), 0, 10)`
* Store floats directly in RGBA16F.

### 5. Alternatives cheaper than atan/tan

If you’re retraining anyway, these are common and cheap to implement:

* **Hard clip:** `clamp(x, -L, L)`
  Fastest, but non-smooth.
* **Softsign:** `x / (1 + abs(x))` (then scale by L)
  Smooth saturation, cheap.
* **Rational soft clip:** `x * L / (L + abs(x))`
  Similar to softsign.
* **x / sqrt(1 + (x/L)^2)**
  Smooth, one `sqrt` (often cheaper than tan/atan).

Without retraining, changing the compression/activation will generally change the dynamics.

---

## Recommended migration plan

1. **Port to WebGL2 first with RGBA8** (no float) and verify identical output.
   This isolates GLSL 300es / twgl / coordinate issues.

2. Switch sim textures to **RGBA16F**, but keep packing/unpacking and add:

   * `clamp(packed, 0, 1)` in `setOutput`
   * optionally `round-to-8-bit` in `setOutput`

   This should eliminate the noise and restore the lizard.

3. For performance:

   * Replace pack/unpack with **explicit clip + ReLU** (no trig).
   * If visuals diverge too much, retrain/fine-tune with float16 + explicit activations (or quantization-aware training).

4. Only after correctness: consider bigger WebGL2 wins (MRT, texelFetch, texture arrays, etc.). The half-float switch alone is not automatically a win; it’s the removal of trig and/or fewer passes that tends to pay off.

If you want, I can produce a concrete “drop-in” replacement for your `PREFIX` that supports both modes:

* **compat mode:** pack/unpack + clamp(+quantize) for identical output
* **fast mode:** direct float16 + per-tensor clamp/ReLU for speed

[1]: https://registry.khronos.org/webgl/extensions/EXT_color_buffer_half_float/?utm_source=chatgpt.com "WebGL EXT_color_buffer_half_float Extension Specification"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_half_float?utm_source=chatgpt.com "EXT_color_buffer_half_float extension - Web APIs | MDN"
[3]: https://groups.google.com/g/webgl-dev-list/c/cOM55i9Nj5Q?utm_source=chatgpt.com "HALF_FLOAT textures on Android"
