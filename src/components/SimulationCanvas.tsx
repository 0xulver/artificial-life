'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Simulation } from '@/lib/engine/types';
import { createGameLoop, GameLoop } from '@/lib/engine/loop';

interface SimulationCanvasProps {
  simulation: Simulation;
  className?: string;
}

export function SimulationCanvas({ simulation, className = '' }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const [isClient, setIsClient] = useState(false);

  const initSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = simulation.config.width;
    canvas.height = simulation.config.height;

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
  }, [simulation]);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        style={{ width: simulation.config.width, height: simulation.config.height }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`bg-black ${className}`}
      width={simulation.config.width}
      height={simulation.config.height}
    />
  );
}
