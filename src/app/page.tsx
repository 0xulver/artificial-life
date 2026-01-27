import Link from 'next/link';
import { simulationRegistry } from '@/lib/simulations/registry';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Artificial Life Simulations
        </h1>
        <p className="mb-12 text-lg text-zinc-400">
          Explore cellular automata, evolutionary algorithms, and emergent behavior
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {simulationRegistry.map((sim) => (
            <Link
              key={sim.id}
              href={`/simulation/${sim.id}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xl font-semibold group-hover:text-green-400">
                  {sim.name}
                </h2>
                <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                  {sim.complexity}
                </span>
              </div>
              <p className="mb-4 text-sm text-zinc-400">{sim.description}</p>
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {sim.category}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-2 text-lg font-medium">Coming Soon</h3>
          <p className="text-sm text-zinc-400">
            Boids flocking, Particle Life, Langton&apos;s Ant, Lenia, and more...
          </p>
        </div>
      </main>
    </div>
  );
}
