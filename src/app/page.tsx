import { redirect } from 'next/navigation';
import { simulationRegistry } from '@/lib/simulations/registry';

export default function Home() {
  const firstSimulation = simulationRegistry[0];
  
  if (firstSimulation) {
    redirect(`/simulation/${firstSimulation.id}`);
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <p className="text-zinc-400">No simulations available</p>
    </div>
  );
}
