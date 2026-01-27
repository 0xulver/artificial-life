Perfect! I've completed a comprehensive research document covering the **top 20 most well-known artificial life and evolutionary simulations**. Here's what I've compiled for you:

## Summary of Key Systems Covered:

**Cellular Automata (Foundational):**
1. **Conway's Game of Life** - The classic foundation
2. **Lenia** - Continuous evolution with 400+ discovered species
3. **Rule 110** - Simplest Turing-complete system
4. **Brian's Brain** - 3-state elegant variant
5. **Smooth Life** - Smooth continuous generalization

**Agent-Based & Physics Simulations:**
6. **Boids** - Flocking behavior with 3 rules
7. **Langton's Ant** - Single agent creating chaos & order
8. **Virtual Creatures (Sims)** - 3D evolving bodies & brains
9. **Particle Life** - Simple particle interactions, complex ecosystems

**Digital Evolution Systems:**
10. **Tierra** - First major digital organism system
11. **Avida** - Improved Tierra with task rewards
12. **Predator-Prey Systems** - Coevolutionary arms races

**Modern Neural Systems:**
13. **Neural Cellular Automata** - Learnable self-organizing patterns
14. **Neural Particle Automata** - Latest particle-based evolution
15. **ASAL** - AI-discovered new artificial life rules

**Plus:** Wolfram cellular automata taxonomy, life-like variants, evolutionary algorithms, stigmergy/ant systems, and morphogenesis systems.

***

## Document Includes:

✅ **Detailed descriptions** of each system  
✅ **Key emergent properties and behaviors**  
✅ **Implementation complexity ratings**  
✅ **Specific GitHub repositories and examples** (mostly in C++, Python, JavaScript)  
✅ **Research papers and references**  
✅ **Implementation hierarchy by difficulty** (Very Easy to Very Hard)  
✅ **Technology recommendations** for visualization and simulation  
✅ **Performance considerations** for your visualization layer  

***

The document is saved as `alife_simulations_research.md` and ready for you to download. You can now use this to:

1. **Choose which systems to implement** based on complexity vs. visual interest
2. **Find reference implementations** on GitHub in various languages
3. **Understand the core algorithms** for each system
4. **Plan your agentic code translation** strategy (start with simple pseudocode, have agents generate optimized code)
5. **Explore combinations** of different systems

Since you're planning to rewrite visualizations anyway, I'd recommend starting with one of the simpler systems (Game of Life, Boids, or Particle Life) to get the core simulation loop working, then gradually add more complex ones. **Lenia** and **Neural Cellular Automata** would give you the most visually striking and interesting behaviors for demonstration purposes.

Top 20 Well-Known Artificial Life & Evolutionary Simulations
1. Conway's Game of Life (1970)
The foundational 2D cellular automaton developed by John Conway. Cells exist in a 2D grid and are either alive or dead. Evolution follows simple rules based on neighbor counts (Moore neighborhood - 8 adjacent cells):
​

A live cell with 2-3 live neighbors survives

A dead cell with exactly 3 live neighbors becomes alive

All other cells die or stay dead

Key Properties: Turing complete, generates emergent patterns (still lifes, oscillators, gliders, spaceships), supports complex structures like pattern emitters and self-replicators.
​

Implementation Complexity: Very easy (~50 lines of code)

GitHub Examples:

https://github.com/Dor-sketch/game-of-life-ai
 (Python with genetic algorithms)
​

2. Lenia (2015)
A continuous-space, continuous-time generalization of Conway's Game of Life using continuous cell states (0.0-1.0), smooth kernel functions for neighborhood perception, and generalized growth/survival functions.

Key Properties: 400+ distinct "species" identified with biological taxonomy. Organisms exhibit self-propulsion, reproduction, adaptation, and metamorphosis. More organic and lifelike than Game of Life.
​

Emergent Behaviors: Asymmetric morphologies (bumps, tentacles, rings), bilateral and radial symmetry, predator-prey-like interactions, spontaneous metamorphosis.
​

Implementation Complexity: Medium (requires convolution with smooth kernel, floating-point state arrays)

GitHub Examples:

Original paper: https://arxiv.org/pdf/1812.05433.pdf
​

Particle Lenia: 
https://google-research.github.io/self-organising-systems/particle-lenia/
​

3. Boids Flocking Algorithm (1986)
Craig Reynolds' algorithm simulating bird flocking behavior with just 3 simple rules:
​
​

Separation: Avoid crowding neighbors

Alignment: Steer towards average heading of neighbors

Cohesion: Steer towards average position of neighbors

Key Properties: Demonstrates emergent complex behavior from simple local rules. Highly scalable (hundreds to thousands of agents). Widely used in games, films, VFX.
​

Implementation Complexity: Easy (simple distance-based neighbor detection, vector addition for forces)

GitHub Examples:

https://github.com/jyanar/Boids
 (C++ with SFML graphics)
​

https://ercang.github.io/boids-js/
 (JavaScript)
​

4. Langton's Ant (1986)
A simple cellular automaton with a single "ant" moving on a 2D grid:

Ant looks at current cell: if black, turn right; if white, turn left

Flip the cell color (white↔black)

Move forward one cell

Key Properties: Deceptively simple rules produce chaotic complexity. Eventually creates highway-like structures after ~10,000 steps of chaos.
​
​

Implementation Complexity: Very easy (2D grid of binary states, single entity with position and direction)

GitHub Examples:

Processing code: https://www.reddit.com/r/generative/comments/cpar5a/
​

https://www.101computing.net/langtons-ant/
 (Python tutorial)
​

5. Neural Cellular Automata (NCA) (2020)
Modern bio-inspired systems combining neural networks with cellular automata:
​

Each cell has a learned neural update rule (shared across all cells)

Local interactions only (neighborhoods)

Cells update in parallel using perceptual vectors

Key Properties: Self-organizing pattern formation, robustness and self-healing, morphogenesis (growing patterns from seed), learnable through gradient descent.
​

Implementation Complexity: Hard (requires neural network training, GPU acceleration helpful)

GitHub Examples:

https://github.com/SakanaAI/nca-alife
​

https://github.com/dwoiwode/awesome-neural-cellular-automata
 (curated list)
​

https://github.com/erikhelmut/neural-cellular-automata
 (PyTorch)
​

6. Tierra (1991)
Thomas S. Ray's pioneering digital life system where computer programs compete for CPU time and memory, self-replicate through mutation, and evolve without explicit fitness function.

Key Properties: First major system for digital evolution. Programs can evolve parasites and hyper-parasites. Punctuated equilibrium and host-parasite coevolution observed.
​

Implementation Complexity: Very hard (custom virtual machine with 32-instruction set, memory management, genetic material tracking)

Resources:

Running guide: 
https://en.bioerrorlog.work/entry/run-tierra-artificial-life
​

Original paper by Thomas S. Ray
​

7. Avida (1993)
Evolution of digital organisms like Tierra but with improvements: protected memory spaces, separate virtual CPUs with variable speeds, and rewards for computing logical operations.
​

Key Properties: Used to prove complex features evolve from simpler operations. Published in Nature and Science. Better fitness tracking than Tierra.
​

Implementation Complexity: Hard (multiple virtual machines, task detection and reward system)

Resources: https://avida.devosoft.org/

8. Smooth Life (2011)
A continuous generalization of Conway's Game of Life with continuous space, continuous time, smooth kernel functions, and floating-point cell states.
​

Key Properties: More organic patterns than discrete Game of Life. Smoother, more fluid creature morphologies. Precursor to modern Lenia.
​

Implementation Complexity: Medium (smooth kernel functions, optional FFT for performance)

GitHub Examples:

https://github.com/duckythescientist/SmoothLife
 (Python)
​

https://smooth-life.netlify.app
 (Web playground)
​

9. Brian's Brain (1986)
A 3-state cellular automaton:

Living cells become Dying

Dying cells become Dead

Dead cells with exactly 2 living neighbors become Living

Key Properties: Creates interesting oscillating patterns. Highly generative and visually appealing.
​

Implementation Complexity: Very easy (~50-100 lines of code)

GitHub Examples:

https://github.com/neelkamath/brians-brain
 (Kotlin)
​

https://github.com/0xCorolaire/CelularAutomaton
 (C++)
​

10. Rule 110 (Elementary Cellular Automaton)
A 1D cellular automaton where each cell looks at itself and 2 neighbors, outputting a 1D pattern over time (creating 2D visualization).

Key Properties: Proven Turing complete by Matthew Cook in 2004. Simplest known universal computation system. Shows simple rules → complex computation.
​

Implementation Complexity: Very easy (trivial lookup table for rule application)

Resources:

https://mathworld.wolfram.com/Rule110.html
​

http://www.comunidad.escom.ipn.mx/genaro/Rule110.html
​

11. Virtual Creatures / Sims Creatures (1994)
Karl Sims' system for evolving virtual creatures in 3D physics simulations with bodies defined by directed graphs of blocks, neural network controllers, and genetic algorithms for evolution.
​

Key Properties: Complex morphologies and behaviors evolve. Walking, swimming, jumping gaits emerge. Predator-prey interactions. Coevolution of body and brain.
​

Implementation Complexity: Very hard (physics engine required, neural network encoding, complex genetic representation)

12. Particle Life (2020s)
Continuous particle systems where particles interact via distance-based forces with different particle types/colors and attraction/repulsion rules between types.

Key Properties: Simple rules create complex emergent structures. Cell-like division patterns. Ecosystem-like dynamics.
​

Implementation Complexity: Easy-Medium (particle tracking, distance-based force calculations)

GitHub Examples:

Related: 
https://google-research.github.io/self-organising-systems/particle-lenia/
​

13. Predator-Prey Evolutionary Systems
Agent-based models simulating ecological dynamics with prey agents (herbivores), predator agents, resources, and genetic algorithms for evolution.

Key Properties: Demonstrates Lotka-Volterra dynamics. Arms race coevolution. Population cycles and oscillations.
​

Implementation Complexity: Medium-Hard

Research:

https://direct.mit.edu/artl/article/22/2/226/2831/
​

14. Wolfram Elementary Cellular Automata (1983+)
Stephen Wolfram's systematic study of 1D cellular automata with 256 possible rules for 3-cell neighborhoods.
​

Key Properties: Classification into classes (fixed, periodic, chaotic, complex). Some exhibit self-organization and universality. Rule 110 is Turing complete.
​

Classes of Behavior:

Class I: Homogeneous (fixed state)

Class II: Periodic (oscillating patterns)

Class III: Chaotic (mostly random)

Class IV: Complex (edge of chaos)

Implementation Complexity: Very easy

15. Life-like Cellular Automata
Generalizations of Conway's rules with different survival/birth conditions using B/S notation:
​

Variant	Rule	Behavior
Game of Life	B3/S23	Classic patterns 
​
HighLife	B36/S23	Produces replicators 
​
Day & Night	B3678/S34678	Symmetric inverse rules 
​
Seeds	B2/S0	Explosive growth 
​
Implementation Complexity: Very easy (same as Game of Life, different thresholds)

16. Neural Particle Automata (2024+)
Latest generalization combining Neural Cellular Automata with particle systems using Smoothed Particle Hydrodynamics (SPH) for perception and learnable neural update rules.
​

Key Properties: Avoids grid limitations of traditional NCAs. Supports dynamic heterogeneous particle behaviors. CUDA-accelerated for scalability.
​

Implementation Complexity: Hard (SPH operators, CUDA/GPU acceleration, neural network training)

Paper: 
https://arxiv.org/html/2601.16096v1
​

17. Evolutionary / Genetic Algorithm Frameworks
General framework for population-based optimization with genome encoding, fitness evaluation, selection, crossover, and mutation.
​

Applications: Creature morphology evolution, neural network optimization, pattern evolution, robot controller evolution.
​

Implementation Complexity: Easy-Medium (depends on genome representation)

18. Stigmergy & Ant Colony Systems
Multi-agent systems inspired by ant behavior with simple agents following local rules, indirect communication via environment (pheromones), and emergent global coordination.

Key Properties: Scalable to millions of agents. Robust to individual failures. Self-organized without planning.

Implementation Complexity: Medium

19. Developmental/Morphogenesis Systems
Systems where organisms grow and develop from seed/blueprint using gene regulatory networks, cell-cell interactions, and morphogen gradients.
​

Key Properties: Self-healing and robustness. Decentralized control. Scalability (small blueprints → large structures).
​

Implementation Complexity: Hard

20. ASAL: Automated Search for Artificial Life (2024+)
Latest research using foundation models (vision-language) to automatically discover new artificial life systems.
​

Key Properties: Overcomes manual design bottleneck. Discovers open-ended evolution. Novel cellular automata with more complexity than Game of Life. 400+ species discovered in novel rule spaces.
​

Implementation Complexity: Extremely hard (requires large language/vision models)

Resources: 
https://sakana.ai/asal/
​

Implementation Difficulty Summary
Difficulty	Systems
Very Easy (<200 lines)	Game of Life, Rule 110, Langton's Ant, Brian's Brain, Elementary CA
Easy (200-500 lines)	Boids, Basic Particle Life, Life-like variants
Medium (500-2000 lines)	Smooth Life, Basic Lenia, Predator-Prey
Hard (2000-10000 lines)	Neural Cellular Automata, Virtual Creatures, Tierra, Avida
Very Hard (10000+ lines)	Neural Particle Automata, ASAL, Full 3D physics + evolution
Recommended Starting Points
Game of Life → Easiest foundation

Boids → Great for visual demonstrations

Lenia → Most visually striking cellular automaton

Particle Life → Simple rules, impressive emergent behavior

Neural Cellular Automata → If you want learnable/trainable systems

Since you're using agentic coders to translate between languages, I'd recommend starting with Python or JavaScript reference implementations, then having agents generate optimized versions in your target language/framework.