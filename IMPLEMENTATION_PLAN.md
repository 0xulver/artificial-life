# Artificial Life Simulations - Implementation Plan

## Implemented (15 simulations)

| # | Simulation | Category | Commit |
|---|------------|----------|--------|
| 1 | Conway's Game of Life | Cellular Automata | Initial |
| 2 | Lenia (WebGL) | Cellular Automata | Initial |
| 3 | Boids Flocking | Agent-Based | Initial |
| 4 | Langton's Ant | Cellular Automata | Initial |
| 5 | Brian's Brain | Cellular Automata | 4d66de8 |
| 6 | Rule 110 | Cellular Automata | 4d66de8 |
| 7 | HighLife | Life-like CA | 4d66de8 |
| 8 | Seeds | Life-like CA | 4d66de8 |
| 9 | Day & Night | Life-like CA | 4d66de8 |
| 10 | Particle Life | Agent-Based | 4d66de8 |
| 11 | Wireworld | Cellular Automata | 4d66de8 |
| 12 | Ant Colony | Agent-Based | 4d66de8 |
| 13 | Reaction-Diffusion | Chemical | 4d66de8 |
| 14 | Predator-Prey | Ecosystem | 4d66de8 |
| 15 | Neural Cellular Automata | Neural/ML | 4ed642b |

---

## Implementation Queue (17 remaining)

### Tier 1: Very Easy (~50-150 lines)

#### 16. Wolfram Elementary CA Explorer
- **Description**: All 256 elementary cellular automata rules (1D), not just Rule 110
- **Why**: Rule 110 already exists; this generalizes to any rule with selector
- **Implementation**:
  1. Reuse Rule 110 structure
  2. Add rule number input (0-255)
  3. Generate lookup table from rule number
  4. Highlight interesting rules: 30 (chaos), 90 (Sierpinski), 110 (complex), 184 (traffic)
- **Estimated**: 80 lines (modify existing)

#### 17. Abelian Sandpile Model
- **Description**: Self-organized criticality - add grains, trigger cascading avalanches
- **Rules**:
  - Add sand grain to random/clicked cell
  - If cell >= 4, "topple": subtract 4, add 1 to each neighbor
  - Repeat until stable
- **Visual**: Height → color gradient (0=black, 1=blue, 2=green, 3=yellow, 4+=red flash)
- **Implementation**:
  1. 2D integer grid for heights
  2. Toppling cascade loop
  3. Click to add grains, or auto-drop mode
- **Estimated**: 100 lines

#### 18. Schelling's Segregation Model
- **Description**: Demonstrates emergent segregation from mild individual preferences
- **Rules**:
  - Two agent types (red/blue) on grid with empty spaces
  - Agent is "unhappy" if < X% of neighbors are same type (X = tolerance, e.g., 30%)
  - Unhappy agents move to random empty cell
- **Emergence**: Even mild preferences (30%) lead to strong segregation
- **Implementation**:
  1. Grid with 3 states: empty, type A, type B
  2. Shuffle unhappy agents, move to empty cells
  3. Configurable tolerance slider
- **Estimated**: 120 lines

#### 19. Firefly Synchronization
- **Description**: Coupled oscillators that spontaneously synchronize
- **Rules**:
  - Each firefly has internal phase (0.0 to 1.0)
  - Phase increases each tick; at 1.0, flash and reset to 0
  - When neighbor flashes, nudge your phase forward slightly
- **Emergence**: Global synchrony emerges from local coupling
- **Implementation**:
  1. Grid of phase values (floats)
  2. On flash, increment neighbors' phases by coupling constant
  3. Visual: brightness = phase^4 (mostly dark, bright flash)
- **Estimated**: 100 lines

---

### Tier 2: Easy (~150-400 lines)

#### 20. Diffusion-Limited Aggregation (DLA)
- **Description**: Random walkers stick to seed, forming fractal dendrites
- **Rules**:
  - Start with seed particle in center
  - Spawn walkers at edge, random walk until touching aggregate
  - On contact, freeze walker as part of aggregate
- **Visual**: Fractal tree/crystal structures (frost, coral, lightning)
- **Implementation**:
  1. Binary grid (empty/frozen)
  2. Active walker list with random walk
  3. Boundary spawning, kill if exits bounds
- **Estimated**: 150 lines

#### 21. L-Systems (Lindenmayer Systems)
- **Description**: Recursive string rewriting for plant/fractal growth
- **Examples**:
  - Sierpinski: `F-G-G`, `F→F-G+F+G-F`, `G→GG`
  - Plant: `X`, `X→F+[[X]-X]-F[-FX]+X`, `F→FF`
- **Implementation**:
  1. String rewriter (apply productions N times)
  2. Turtle graphics interpreter (F=forward, +=left, -=right, [=push, ]=pop)
  3. Preset examples + custom rule editor
- **Estimated**: 200 lines

#### 22. Dawkins' Biomorphs
- **Description**: Interactive evolution of stick-figure creatures
- **Mechanics**:
  - 9 genes control branching depth, angles, segment lengths
  - Display parent + 8 mutated offspring
  - User clicks favorite → becomes new parent
- **No fitness function**: Pure aesthetic selection
- **Implementation**:
  1. Gene array → recursive tree drawing
  2. Mutation function (±1 on random genes)
  3. Click-to-select UI with 3x3 grid
- **Estimated**: 250 lines

#### 23. Daisyworld
- **Description**: Planetary homeostasis simulation (Gaia hypothesis)
- **Model**:
  - Planet temperature depends on solar luminosity and albedo
  - Black daisies absorb heat (warm planet), white daisies reflect (cool planet)
  - Daisy growth rate depends on local temperature
- **Emergence**: Planet self-regulates temperature as solar output changes
- **Implementation**:
  1. Grid of black/white/empty daisies
  2. Temperature field (diffusion + solar input - radiation)
  3. Growth/death based on optimal temperature curve
- **Estimated**: 300 lines

---

### Tier 3: Medium (~400-1000 lines)

#### 24. Physarum (Slime Mold)
- **Description**: Multi-agent trail-following for network formation
- **Cycle**:
  1. **Sense**: Sample trail concentration ahead-left, ahead, ahead-right
  2. **Rotate**: Turn toward strongest signal
  3. **Move**: Step forward, deposit trail
  4. **Diffuse/Decay**: Blur and fade trail map
- **Emergence**: Efficient transport networks, maze solving
- **Implementation**:
  1. Particle array (x, y, angle)
  2. Float trail grid with Gaussian blur
  3. Food sources as high-concentration areas
- **Estimated**: 350 lines (CPU) or 500 lines (WebGL)

#### 25. Sugarscape
- **Description**: Artificial society with agents foraging for resources
- **Mechanics**:
  - Grid with sugar (resource) that regrows over time
  - Agents have vision range, metabolism, move toward visible sugar
  - Eat sugar at location, die if sugar reserves depleted
- **Extensions**: Inheritance, trade, pollution, disease
- **Implementation**:
  1. Sugar grid with regrowth
  2. Agent class with position, sugar, metabolism, vision
  3. Movement: greedy toward highest visible sugar
- **Estimated**: 400 lines

#### 26. Langton's Loops
- **Description**: Self-replicating cellular automaton
- **Structure**:
  - 8 states, von Neumann neighborhood
  - "Genetic information" flows through sheathed wire
  - Loop grows arm, arm buds into new loop
- **Complexity**: Large transition table (~219 rules)
- **Implementation**:
  1. State grid (8 colors)
  2. Transition table lookup (can use compressed format)
  3. Initialize with loop pattern from literature
- **Estimated**: 400 lines (mostly transition table)

#### 27. Genetic Algorithm Visualizer
- **Description**: Visual demonstration of evolutionary optimization
- **Examples**:
  - Evolve string toward target phrase
  - Evolve polygon to match target image
  - Evolve walking stick figures
- **Components**:
  - Population array of genomes
  - Fitness function (configurable)
  - Selection, crossover, mutation operators
  - Generation-by-generation visualization
- **Estimated**: 500 lines

---

### Tier 4: Hard (~1000-2000 lines)

#### 28. Smooth Life
- **Description**: Continuous generalization of Game of Life (precursor to Lenia)
- **Difference from Lenia**:
  - Different growth function (smooth step vs. Gaussian)
  - Historically earlier, less parameter exploration
- **Implementation**:
  1. Adapt Lenia WebGL infrastructure
  2. Change kernel and growth function
  3. Different parameter presets
- **Estimated**: 300 lines (modify Lenia) or 800 lines (standalone)
- **Note**: May skip - very similar to existing Lenia

#### 29. BoxCar2D
- **Description**: Evolving 2D vehicles to traverse terrain
- **Genome**: Chassis vertices, wheel positions/sizes
- **Requirements**:
  - 2D physics engine (matter.js or box2d-wasm)
  - Procedural terrain generation
  - Genetic algorithm for evolution
- **Implementation**:
  1. Integrate physics library
  2. Vehicle phenotype decoder
  3. Fitness = distance traveled
  4. Tournament selection, mutation
- **Estimated**: 1000 lines + physics library

#### 30. Neural Particle Automata
- **Description**: Neural CA but with particles instead of grid
- **Architecture**:
  - Smoothed Particle Hydrodynamics (SPH) for perception
  - Neural network for update rule
  - CUDA/WebGL for performance
- **Complexity**: Requires SPH implementation + neural inference
- **Estimated**: 1500 lines (WebGL)

---

### Tier 5: Very Hard (~2000+ lines)

#### 31. Avida
- **Description**: Digital evolution platform with task-based fitness
- **Mechanics**:
  - Self-replicating programs in isolated memory spaces
  - Programs earn CPU cycles by completing logic tasks (AND, OR, XOR, etc.)
  - Mutation during replication
- **Implementation**:
  - Custom VM with ~26 instructions
  - Task detection and reward system
  - Population management
- **Estimated**: 2000 lines
- **Alternative**: Could simplify to "Avida-lite" with fewer instructions

#### 32. Virtual Creatures (Karl Sims)
- **Description**: Evolving 3D morphology and neural control
- **Requirements**:
  - 3D physics engine (cannon.js, ammo.js)
  - Directed graph genome for body structure
  - Neural network for muscle control
  - Genetic algorithm for evolution
- **Tasks**: Swimming, walking, jumping, fighting
- **Estimated**: 3000+ lines
- **Note**: Could start with 2D simplification

---

## Not Planned (Infeasible for Web)

| Simulation | Reason |
|------------|--------|
| ASAL | Requires foundation models (LLMs/VLMs) |
| Tierra (full) | Custom VM complexity, better to do Avida-lite |
| Full 3D Virtual Creatures | Physics engine complexity; 2D version more realistic |

---

## Implementation Priority

### Phase 1: Quick Wins (4 simulations)
```
16. Wolfram Elementary CA Explorer  [~1 hour]
17. Abelian Sandpile               [~1 hour]
18. Schelling's Segregation        [~1 hour]
19. Firefly Synchronization        [~1 hour]
```

### Phase 2: Classic Additions (4 simulations)
```
20. Diffusion-Limited Aggregation  [~2 hours]
21. L-Systems                      [~3 hours]
22. Dawkins' Biomorphs             [~3 hours]
23. Daisyworld                     [~3 hours]
```

### Phase 3: Complex Systems (4 simulations)
```
24. Physarum (Slime Mold)          [~4 hours]
25. Sugarscape                     [~4 hours]
26. Langton's Loops                [~4 hours]
27. Genetic Algorithm Visualizer   [~5 hours]
```

### Phase 4: Advanced (3 simulations)
```
28. Smooth Life (optional)         [~3 hours]
29. BoxCar2D                       [~8 hours]
30. Neural Particle Automata       [~10 hours]
```

### Phase 5: Research-Grade (2 simulations)
```
31. Avida-lite                     [~15 hours]
32. Virtual Creatures (2D)         [~20 hours]
```

---

## Technical Notes

- All simulations implement `Simulation` interface from `src/lib/engine/types.ts`
- Add each to `registry.ts` after implementation
- Run `npm run build` to verify no type errors
- Prefer Canvas 2D for simple ones, WebGL for continuous-state
- For physics: consider `matter.js` (2D) or `cannon-es` (3D)
- L-Systems and Biomorphs may need custom UI beyond canvas

## Estimated Total

- **Tier 1**: ~4 hours (4 simulations)
- **Tier 2**: ~11 hours (4 simulations)
- **Tier 3**: ~17 hours (4 simulations)
- **Tier 4**: ~21 hours (3 simulations)
- **Tier 5**: ~35 hours (2 simulations)

**Grand Total**: 17 new simulations, ~88 hours of implementation

Current count: **15 implemented**
After completion: **32 simulations**
