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
  const [showControls, setShowControls] = useState(true);
  const [, forceUpdate] = useState(0);

  const simulation = useMemo(() => {
    if (!entry) return null;
    return entry.factory();
  }, [entry, key]);

  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 100);
    return () => clearInterval(interval);
  }, []);

  if (!entry || !simulation) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Simulation not found</h1>
          <Link href="/" className="text-green-400 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const handleReset = () => setKey((k) => k + 1);

  const handleToggle = () => {
    if (simulation.state.running) {
      simulation.pause();
    } else {
      simulation.start();
    }
    forceUpdate(n => n + 1);
  };

  return (
    <div 
      className="relative h-screen w-screen overflow-hidden bg-black"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <SimulationCanvas key={key} simulation={simulation} fullscreen />

      <Link
        href="/"
        className={`fixed left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/60 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:text-white ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        ←
      </Link>

      <div
        className={`fixed bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/5 px-4 py-2 backdrop-blur-sm transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={handleToggle}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {simulation.state.running ? '⏸' : '▶'}
        </button>
        <div className="h-4 w-px bg-white/20" />
        <button
          onClick={handleReset}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          ↻
        </button>
      </div>

      <div
        className={`fixed bottom-6 right-6 z-10 flex gap-4 font-mono text-xs text-white/40 transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span>GEN {simulation.state.generation}</span>
        <span>{simulation.state.elapsedTime.toFixed(1)}s</span>
      </div>

      <div
        className={`fixed left-4 top-16 z-10 transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h1 className="text-sm font-medium text-white/60">{entry.name}</h1>
      </div>
    </div>
  );
}
