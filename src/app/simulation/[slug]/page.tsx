'use client';

import { useMemo, useState } from 'react';
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

  const simulation = useMemo(() => {
    if (!entry) return null;
    return entry.factory();
  }, [entry, key]);

  if (!entry || !simulation) {
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
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="mb-2 inline-block text-sm text-zinc-400 hover:text-white"
            >
              ← Back
            </Link>
            <h1 className="text-2xl font-bold">{entry.name}</h1>
            <p className="text-sm text-zinc-400">{entry.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm transition-colors hover:bg-zinc-700"
            >
              {simulation.state.running ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm transition-colors hover:bg-zinc-700"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <SimulationCanvas key={key} simulation={simulation} />
        </div>

        <div className="mt-4 flex gap-4 text-sm text-zinc-500">
          <span>Generation: {simulation.state.generation}</span>
          <span>Time: {simulation.state.elapsedTime.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}
