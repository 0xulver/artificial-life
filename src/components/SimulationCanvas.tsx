'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Simulation } from '@/lib/engine/types';
import { createGameLoop, GameLoop } from '@/lib/engine/loop';

interface SimulationCanvasProps {
  simulation: Simulation;
  className?: string;
  fullscreen?: boolean;
}

export function SimulationCanvas({ simulation, className = '', fullscreen = false }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [dimensions, setDimensions] = useState({ width: simulation.config.width, height: simulation.config.height });

  useEffect(() => {
    setIsClient(true);
    
    if (fullscreen) {
      const updateDimensions = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [fullscreen]);

  const initSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = fullscreen ? dimensions.width : simulation.config.width;
    const height = fullscreen ? dimensions.height : simulation.config.height;

    canvas.width = width;
    canvas.height = height;

    if (fullscreen) {
      simulation.config.width = width;
      simulation.config.height = height;
    }

    simulation.init(ctx);

    loopRef.current = createGameLoop(
      {
        update: (dt) => simulation.update(dt),
        render: () => {
          const context = canvas.getContext('2d');
          if (context) simulation.render(context);
        },
      },
      simulation.config.targetFPS ?? 60
    );

    if (simulation.state.running) {
      loopRef.current.start();
    }
  }, [simulation, fullscreen, dimensions]);

  useEffect(() => {
    if (!isClient) return;

    initSimulation();

    return () => {
      loopRef.current?.stop();
      simulation.destroy();
    };
  }, [isClient, initSimulation, simulation]);

  useEffect(() => {
    if (!loopRef.current) return;

    if (simulation.state.running) {
      loopRef.current.start();
    } else {
      loopRef.current.stop();
    }
  }, [simulation.state.running]);

  if (!isClient) {
    return (
      <div 
        className={`bg-black ${className}`}
        style={fullscreen ? { width: '100vw', height: '100vh' } : { width: simulation.config.width, height: simulation.config.height }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`bg-black ${className}`}
      style={fullscreen ? { display: 'block' } : undefined}
      width={dimensions.width}
      height={dimensions.height}
    />
  );
}
