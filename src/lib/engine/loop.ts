/**
 * RequestAnimationFrame-based game loop with delta time
 */

export interface LoopCallbacks {
  update: (deltaTime: number) => void;
  render: () => void;
}

export interface GameLoop {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

/**
 * Creates a game loop with frame-rate independent timing
 * @param callbacks Update and render callbacks
 * @param targetFPS Target frames per second (0 = unlimited)
 */
export function createGameLoop(
  callbacks: LoopCallbacks,
  targetFPS: number = 60
): GameLoop {
  let running = false;
  let animationFrameId: number | null = null;
  let lastTime = 0;
  
  const minFrameTime = targetFPS > 0 ? 1000 / targetFPS : 0;
  let accumulator = 0;
  
  function loop(currentTime: number) {
    if (!running) return;
    
    const deltaTimeSeconds = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    const cappedDelta = Math.min(deltaTimeSeconds, 0.1);
    
    if (targetFPS > 0) {
      accumulator += cappedDelta * 1000;
      
      while (accumulator >= minFrameTime) {
        callbacks.update(minFrameTime / 1000);
        accumulator -= minFrameTime;
      }
    } else {
      callbacks.update(cappedDelta);
    }
    
    callbacks.render();
    
    animationFrameId = requestAnimationFrame(loop);
  }
  
  return {
    start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      accumulator = 0;
      animationFrameId = requestAnimationFrame(loop);
    },
    
    stop() {
      running = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },
    
    isRunning() {
      return running;
    }
  };
}
