# Artificial Life Simulations - Implementation Plan

## Already Implemented (4/14)

| # | Simulation | Category | Status |
|---|------------|----------|--------|
| 1 | Conway's Game of Life | Cellular Automata | Done |
| 2 | Lenia (WebGL) | Cellular Automata | Done |
| 3 | Boids Flocking | Agent-Based | Done |
| 4 | Langton's Ant | Cellular Automata | Done |

---

## Implementation Queue (Ordered by Difficulty)

### Tier 1: Very Easy (~50-100 lines each)

#### 5. Brian's Brain
- **Description**: 3-state cellular automaton (Alive → Dying → Dead → Alive)
- **Rules**:
  - Living cells become Dying
  - Dying cells become Dead
  - Dead cells with exactly 2 living neighbors become Living
- **Implementation**:
  1. Copy game-of-life.ts structure
  2. Add 3 states (DEAD=0, ALIVE=1, DYING=2)
  3. Update logic for 3-state transitions
  4. Color: Dead=black, Alive=white, Dying=blue
- **Estimated**: 80 lines

#### 6. Rule 110 (Elementary Cellular Automaton)
- **Description**: 1D CA proven Turing complete. Each row is next generation.
- **Rules**: 8-bit lookup table for 3-cell neighborhood → output
- **Implementation**:
  1. 1D array representing current row
  2. Each frame: compute next row, scroll display up
  3. Rule 110 pattern: `01101110` binary
- **Estimated**: 60 lines

#### 7. Life-like Variants (HighLife, Seeds, Day&Night)
- **Description**: Same as Game of Life but different B/S rules
- **Variants**:
  - HighLife (B36/S23): Produces replicators
  - Seeds (B2/S): Explosive growth
  - Day & Night (B3678/S34678): Symmetric
- **Implementation**:
  1. Parameterized Game of Life with birth/survival arrays
  2. Add dropdown or parameter for rule selection
- **Estimated**: 100 lines (refactor of GoL)

---

### Tier 2: Easy (~200-400 lines each)

#### 8. Particle Life
- **Description**: Colored particles with attraction/repulsion forces between types
- **Rules**:
  - N particle types (colors)
  - NxN attraction matrix (positive=attract, negative=repel)
  - Distance-based force falloff
- **Implementation**:
  1. Particle array with x, y, vx, vy, type
  2. Force calculation between all pairs (O(n²) or spatial hash)
  3. Random attraction matrix on init
- **Estimated**: 200 lines

#### 9. Wireworld
- **Description**: 4-state CA for simulating electronic circuits
- **States**: Empty, Wire, Electron Head, Electron Tail
- **Rules**:
  - Empty → Empty
  - Electron Head → Electron Tail
  - Electron Tail → Wire
  - Wire → Electron Head if 1-2 neighbors are Heads
- **Implementation**:
  1. 4-state grid
  2. Preset patterns (oscillators, logic gates)
- **Estimated**: 100 lines

---

### Tier 3: Medium (~500-1000 lines each)

#### 10. Smooth Life
- **Description**: Continuous-space Game of Life (precursor to Lenia)
- **Difference from Lenia**: Different growth function, historically earlier
- **Implementation**:
  1. Float grid, smooth kernel convolution
  2. Different sigmoid for growth
  3. Can reuse Lenia WebGL infrastructure
- **Estimated**: 400 lines (or modify Lenia)

#### 11. Ant Colony (Stigmergy)
- **Description**: Multiple ants leaving/following pheromone trails
- **Mechanics**:
  - Ants wander, deposit pheromones
  - Pheromones evaporate over time
  - Ants attracted to stronger pheromones
  - Food sources and nest
- **Implementation**:
  1. Pheromone grid (floats, decay each frame)
  2. Ant agents with sensing
  3. Food spawning, return-to-nest behavior
- **Estimated**: 400 lines

#### 12. Reaction-Diffusion (Gray-Scott)
- **Description**: Chemical reaction simulation creating spots/stripes
- **Equations**: Two chemicals (U, V) with diffusion + reaction
- **Implementation**:
  1. Two float grids for U and V concentrations
  2. Laplacian for diffusion
  3. Reaction: U + 2V → 3V
  4. WebGL recommended for performance
- **Estimated**: 300 lines (CPU) or 500 lines (WebGL)

---

### Tier 4: Hard (~1000+ lines)

#### 13. Predator-Prey Ecosystem
- **Description**: Evolving populations of predators and prey
- **Mechanics**:
  - Prey: eat grass, reproduce, flee predators
  - Predators: hunt prey, starve without food
  - Optional: genetic traits, neural brains
- **Implementation**:
  1. Agent classes with energy, age, genes
  2. Spatial grid for collision detection
  3. Population graphs overlay
- **Estimated**: 600 lines

#### 14. Neural Cellular Automata (Optional/Future)
- **Description**: Learned update rules via neural networks
- **Complexity**: Requires pre-trained weights or training pipeline
- **Status**: Defer to future phase

---

## Implementation Order

```
Phase 1 (Quick wins):
  5. Brian's Brain
  6. Rule 110
  7. Life-like Variants

Phase 2 (Core additions):
  8. Particle Life
  9. Wireworld

Phase 3 (Advanced):
  10. Smooth Life (or skip - similar to Lenia)
  11. Ant Colony
  12. Reaction-Diffusion

Phase 4 (Complex):
  13. Predator-Prey

Future:
  14. Neural Cellular Automata
```

---

## Technical Notes

- All simulations implement `Simulation` interface from `src/lib/engine/types.ts`
- Add each to `registry.ts` after implementation
- Run `npm run build` to verify no type errors
- Prefer Canvas 2D for simple ones, WebGL for continuous-state (like Lenia)
- Cell size: 4-8px for grid-based, scale dynamically for fullscreen
