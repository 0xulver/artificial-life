# Session Documentation - Jan 27, 2026

## Project Overview
**Location:** `/home/ulver/code/ai/artificial-life/`
**GitHub:** https://github.com/0xulver/artificial-life
**Stack:** Next.js 16, TypeScript, Tailwind CSS, WebGL (TWGL.js), Matter.js

---

## What Was Done This Session

### 1. Completed Phase 5 Simulations
Added final two simulations to registry and pushed:
- **Avida-lite** (`avida.ts`) - Digital evolution with custom VM, self-replicating programs
- **Virtual Creatures** (`virtual-creatures.ts`) - Evolving 2D morphology with physics

**Total simulations: 31**

### 2. Fixed Overlay Positioning Issues
Multiple simulations had stats/info overlays that collided with the dropdown menu in the top-left corner.

**Initial approach:** Manually moved each overlay down (y=90) in individual simulations.

**Final solution:** Created unified stats overlay system.

### 3. Unified Stats Overlay System (Major Refactor)

**Problem:** Each simulation drew its own stats overlay on canvas, causing:
- Inconsistent positioning
- Collision with React dropdown component
- Duplicated code

**Solution:** 
1. Added `getStats()` method to `Simulation` interface in `src/lib/engine/types.ts`:
```typescript
export interface SimulationStat {
  label: string;
  value: string | number;
}

export interface Simulation {
  // ... existing methods
  getStats?(): SimulationStat[];
}
```

2. Updated `src/app/simulation/[slug]/page.tsx` to render stats from simulations:
```tsx
{simulation.getStats && simulation.getStats().length > 0 && (
  <div className="pointer-events-auto absolute left-6 top-20 ...">
    {simulation.getStats().map((stat, i) => (
      <span key={i} className="font-mono">
        {stat.label}: {stat.value}
      </span>
    ))}
  </div>
)}
```

3. Updated 6 simulations to use `getStats()` instead of canvas-drawn overlays:
   - `predator-prey.ts`
   - `sugarscape.ts`
   - `daisyworld.ts`
   - `boxcar2d.ts`
   - `avida.ts`
   - `virtual-creatures.ts`

### 4. Centered Simulation Grids
- **Biomorphs** - 3x3 selection grid now centered on canvas (was top-left)
- **Genetic Algorithm** - Both panels (target + best) now centered
- **Avida-lite** - 60x60 grid now centered on canvas

---

## Current State

### Simulations (31 total)

| Category | Simulations |
|----------|-------------|
| Cellular Automata | Game of Life, Lenia, Langton's Ant, Brian's Brain, HighLife, Seeds, Day&Night, Wireworld, Neural CA, Elementary CA, Sandpile, Langton's Loops, Smooth Life |
| Agent-Based | Boids, Particle Life, Ant Colony, Predator-Prey, Physarum, Sugarscape, Schelling, Firefly, Neural Particles |
| Evolutionary | Biomorphs, Daisyworld, Genetic Algorithm, BoxCar2D, Avida-lite, Virtual Creatures |
| Other | Reaction-Diffusion, DLA, L-Systems |

### Key Files
```
src/lib/engine/types.ts              # SimulationStat interface, getStats() method
src/app/simulation/[slug]/page.tsx   # Unified stats overlay rendering
src/lib/simulations/registry.ts      # All 31 simulations registered
```

### Simulations Using getStats()
- predator-prey.ts
- sugarscape.ts
- daisyworld.ts
- boxcar2d.ts
- avida.ts
- virtual-creatures.ts

### Simulations NOT Yet Using getStats()
Many simulations don't have custom overlays, but some still draw on canvas:
- Check other simulations if they need migration to unified system

---

## Potential Next Steps

1. **Migrate remaining simulations to getStats()** - Any simulation with canvas-drawn text could be migrated for consistency

2. **Add color legend support** - Avida-lite had a color legend that was removed. Could extend the stats system to support legends:
```typescript
interface SimulationStat {
  label: string;
  value: string | number;
  color?: string;  // For color-coded stats
}
```

3. **Consider other simulations that might need centering** - Review all simulations for consistent visual layout

4. **Update IMPLEMENTATION_PLAN.md** - Currently outdated, shows 15 implemented but actually 31

---

## Git History (Recent)
```
7047f4d refactor: unified stats overlay system
727f579 fix: add left padding to Avida-lite info box
d50ed37 fix: center Avida-lite grid on canvas
d988312 fix: move overlay text further down (y=90) across simulations
7e1a886 fix: move BoxCar2D info box further down to avoid dropdown
32bbafb fix: adjust overlay positions to avoid dropdown collision
13bbc72 feat: add Phase 5 simulations - Avida-lite, Virtual Creatures
```

---

## Technical Notes

### Stats Overlay Positioning
- Dropdown is at `left-6 top-6` (24px from edges)
- Stats overlay is at `left-6 top-20` (24px left, 80px top)
- This places stats below the dropdown button

### Canvas vs React Overlays
- Simulation visuals: Canvas (for performance)
- UI overlays (stats, controls): React components (for consistency)
- Dropdown, play/pause, reset, fullscreen: React in page.tsx

### Commit Guidelines (from AGENTS.md)
- No `Co-authored-by` trailers
- No promotional footer messages
- Keep commits clean
