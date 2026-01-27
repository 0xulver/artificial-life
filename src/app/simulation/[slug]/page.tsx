'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { SimulationCanvas } from '@/components/SimulationCanvas';
import { getSimulationById } from '@/lib/simulations/registry';
import { use } from 'react';

interface SimulationPageProps {
  params: Promise<{ slug: string }>;
}

export default function SimulationPage({ params }: SimulationPageProps) {
  const { slug } = use(params);
  const entry = getSimulationById(slug);
  const [key, setKey] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const simulation = useMemo(() => {
    if (!entry || !dimensions) return null;
    return entry.factory({
      width: dimensions.width,
      height: dimensions.height,
    });
  }, [entry, key, dimensions]);

  // Force re-render for stats update
  useEffect(() => {
    if (!simulation?.state.running) return;
    let frameId: number;
    let lastTime = 0;
    const loop = (time: number) => {
      if (time - lastTime > 100) { // Throttle to 10fps for UI updates
        setTick((t) => t + 1);
        lastTime = time;
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [simulation, simulation?.state.running]);

  if (!entry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Simulation not found</h1>
          <Link href="/" className="text-green-400 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return <div className="min-h-screen w-screen bg-black" />;
  }

  const handleReset = () => {
    setKey((k) => k + 1);
  };

  const handleToggle = () => {
    if (simulation.state.running) {
      simulation.pause();
    } else {
      simulation.start();
    }
  };

  return (
    <div className="group relative h-screen w-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <SimulationCanvas key={key} simulation={simulation} className="block" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="pointer-events-auto flex items-start justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <span>←</span>
            <span className="sr-only">Back</span>
          </Link>

          <div className="rounded-xl bg-black/60 px-4 py-2 backdrop-blur-md">
            <h1 className="text-sm font-medium text-white">{entry.name}</h1>
          </div>
        </div>

        <div className="pointer-events-auto flex items-end justify-between">
          <div className="flex flex-col gap-1 rounded-xl bg-black/60 p-3 text-xs text-white/90 backdrop-blur-md">
            <span className="font-mono">GEN: {simulation.state.generation}</span>
            <span className="font-mono">
              TIME: {simulation.state.elapsedTime.toFixed(1)}s
            </span>
          </div>

          <div className="flex gap-2 rounded-xl bg-black/60 p-2 backdrop-blur-md">
            <button
              onClick={handleToggle}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
              title={simulation.state.running ? 'Pause' : 'Play'}
            >
              {simulation.state.running ? (
                <span className="h-3 w-3 bg-white" />
              ) : (
                <span className="ml-0.5 h-0 w-0 border-b-[6px] border-l-[10px] border-t-[6px] border-b-transparent border-l-white border-t-transparent" />
              )}
            </button>
            <button
              onClick={handleReset}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
              title="Reset"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
                <path d="M3 3v9h9" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
