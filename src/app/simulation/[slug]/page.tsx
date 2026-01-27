'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SimulationCanvas } from '@/components/SimulationCanvas';
import { simulationRegistry, getSimulationById } from '@/lib/simulations/registry';
import { use } from 'react';

interface SimulationPageProps {
  params: Promise<{ slug: string }>;
}

export default function SimulationPage({ params }: SimulationPageProps) {
  const router = useRouter();
  const { slug } = use(params);
  const entry = getSimulationById(slug);
  const [key, setKey] = useState(0);
  const [, setTick] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const simulation = useMemo(() => {
    if (!entry) return null;
    return entry.factory();
  }, [entry, key]);

  const hasMultipleSimulations = simulationRegistry.length > 1;

  useEffect(() => {
    if (!simulation?.state.running) return;
    let frameId: number;
    let lastTime = 0;
    const loop = (time: number) => {
      if (time - lastTime > 100) {
        setTick((t) => t + 1);
        lastTime = time;
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [simulation, simulation?.state.running]);

  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(false);
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      sessionStorage.setItem('simulation-fullscreen', isNowFullscreen ? 'true' : 'false');
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const shouldBeFullscreen = sessionStorage.getItem('simulation-fullscreen') === 'true';
    if (shouldBeFullscreen && containerRef.current && !document.fullscreenElement) {
      const timer = setTimeout(() => {
        containerRef.current?.requestFullscreen().catch(() => {});
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [slug]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      sessionStorage.setItem('simulation-fullscreen', 'true');
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      sessionStorage.setItem('simulation-fullscreen', 'false');
      document.exitFullscreen();
    }
  }, []);

  if (!entry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Simulation not found</h1>
          <button 
            onClick={() => router.push(`/simulation/${simulationRegistry[0]?.id}`)}
            className="text-green-400 hover:underline"
          >
            Go to first simulation
          </button>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return <div className="min-h-screen w-screen bg-black" />;
  }

  const handleReset = () => setKey((k) => k + 1);

  const handleToggle = () => {
    if (simulation.state.running) {
      simulation.pause();
    } else {
      simulation.start();
    }
  };

  const handleSimulationChange = (id: string) => {
    setDropdownOpen(false);
    router.push(`/simulation/${id}`);
  };

  return (
    <div ref={containerRef} className="group relative h-screen w-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <SimulationCanvas key={key} simulation={simulation} fullscreen />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="pointer-events-auto flex items-start justify-between">
          {hasMultipleSimulations ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <span>{entry.name}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-2 min-w-[200px] rounded-xl bg-black/80 p-2 backdrop-blur-md">
                  {simulationRegistry.map((sim) => (
                    <button
                      key={sim.id}
                      onClick={() => handleSimulationChange(sim.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                        sim.id === slug ? 'bg-white/10 text-white' : 'text-white/70'
                      }`}
                    >
                      <span className="flex-1">{sim.name}</span>
                      {sim.id === slug && (
                        <span className="h-2 w-2 rounded-full bg-green-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-black/60 px-4 py-2 backdrop-blur-md">
              <h1 className="text-sm font-medium text-white">{entry.name}</h1>
            </div>
          )}

          <div className="rounded-xl bg-black/60 px-4 py-2 backdrop-blur-md">
            <span className="text-xs font-medium uppercase tracking-wider text-white/60">
              {entry.category}
            </span>
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
            <button
              onClick={toggleFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
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
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
              ) : (
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
                  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
