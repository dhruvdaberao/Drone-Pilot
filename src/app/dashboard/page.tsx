"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Drone3DViewer } from "@/components/dashboard/drone-3d-viewer";
import { Button } from "@/components/ui/button";
import { DRONES, DEFAULT_DRONE_STORAGE_KEY } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { ArrowRight, Settings, Loader2, Plane, Activity, ShieldCheck } from "lucide-react";
import { listUserConfigurations } from "@/lib/digital-twin/digital-twin-storage";
import { DroneDigitalTwinConfiguration } from "@/types/drone-digital-twin";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["700"] });

export default function DashboardPage() {
  const router = useRouter();
  const [selectedDrone, setSelectedDrone] = useState<DroneModel>(DRONES[0]);
  const [savedConfigs, setSavedConfigs] = useState<DroneDigitalTwinConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfigs() {
      try {
        const configs = await listUserConfigurations();
        setSavedConfigs(configs.filter(c => !c.identity.isPreset)); // Only user's saved ones
      } catch (err) {
        console.error("Failed to load configs", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfigs();

    // Restore previous selection
    try {
      const urlDrone = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("drone") : null;
      if (urlDrone) {
        const found = DRONES.find((d) => d.id === urlDrone);
        if (found) setSelectedDrone(found);
      } else {
        const stored = localStorage.getItem(DEFAULT_DRONE_STORAGE_KEY);
        if (stored) {
          const found = DRONES.find((d) => d.id === stored);
          if (found) setSelectedDrone(found);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectDrone = (drone: DroneModel) => {
    setSelectedDrone(drone);
    try {
      localStorage.setItem(DEFAULT_DRONE_STORAGE_KEY, drone.id);
    } catch {
      // ignore
    }
  };

  const activeConfig = savedConfigs.find(c => c.identity.category === selectedDrone.id);

  const handleConfigureTwin = () => {
    router.push(`/configure?drone=${selectedDrone.id}`);
  };

  const handleContinue = () => {
    router.push(`/fly/select?drone=${selectedDrone.id}`);
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen w-full flex flex-col bg-gradient-to-b from-neutral-900 to-black text-white overflow-hidden font-sans">
        <div className="absolute top-0 w-full z-50">
          <DashboardHeader />
        </div>

        {/* Immersive Full-Screen 3D Viewer */}
        <div className="absolute inset-0 z-0">
          {/* Subtle gradient overlay to ensure text remains readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-10" />
          <Drone3DViewer 
            key={selectedDrone.id} // Re-mounts viewer to reset camera state on change
            type={selectedDrone.id} 
            isSelected={true} 
            autoRotate={true}
            interactive={true} 
            className="w-full h-full"
          />
        </div>

        {/* Overlay UI */}
        <main className="relative z-20 flex-1 w-full h-full pt-28 pb-10 px-6 flex flex-col justify-between pointer-events-none">
          
          {/* Top Title Overlay */}
          <div className="w-full flex justify-center mt-2 lg:mt-6">
            <h1 className={`${spaceGrotesk.className} text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[0.2em] text-white/90 uppercase text-center drop-shadow-2xl`}>
              {selectedDrone.name}
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-8 max-w-[1400px] mx-auto w-full mb-4">
            
            {/* Left Column: Drone Technical Stats */}
            <div className="flex flex-col gap-4 pointer-events-auto">
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 w-64 shadow-2xl">
                <h3 className="text-xs font-bold text-neutral-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#FF5500]" /> 
                  Platform Specs
                </h3>
                <div className="space-y-4 font-mono">
                  <div>
                    <span className="block text-[10px] text-neutral-500 tracking-wider">PROPULSION</span>
                    <span className="text-sm font-semibold">{selectedDrone.specs.rotors} MOTORS</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-500 tracking-wider">WEIGHT CLASS</span>
                    <span className="text-sm font-semibold">{selectedDrone.specs.weightClass}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-500 tracking-wider">CERTIFICATION</span>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {selectedDrone.badge}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drone Selection List */}
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2 w-64 shadow-2xl flex flex-col gap-1">
                {DRONES.map(drone => (
                  <button
                    key={drone.id}
                    onClick={() => handleSelectDrone(drone)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
                      selectedDrone.id === drone.id 
                      ? "bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.5)]" 
                      : "text-neutral-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Plane className={`w-4 h-4 ${selectedDrone.id === drone.id ? "text-white" : "text-neutral-500"}`} />
                    <span className="text-xs font-bold tracking-widest uppercase font-mono">{drone.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column / Bottom Action Area */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl pointer-events-auto flex flex-col items-center text-center">
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#FF5500]" />
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">Syncing telemetry...</span>
                </div>
              ) : activeConfig ? (
                <div className="w-full animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h2 className="text-lg font-bold tracking-widest uppercase mb-2">Ready for Flight</h2>
                    <p className="text-xs text-neutral-400 font-mono">
                      {activeConfig.massProperties.totalMassKg.toFixed(1)} KG MTOW • {activeConfig.battery.cellCount}S LIPO
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <Button
                      className="w-full h-14 bg-[#FF5500] hover:bg-[#ff6a1f] text-white text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(255,85,0,0.4)] hover:-translate-y-1 transition-all"
                      onClick={handleContinue}
                    >
                      INITIALIZE FLIGHT
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <button
                      className="w-full h-14 flex flex-col items-center justify-center gap-1 rounded-xl border border-white/20 hover:bg-white/10 text-neutral-300 transition-all text-[10px] font-bold tracking-widest uppercase font-mono"
                      onClick={handleConfigureTwin}
                    >
                      <Settings className="w-4 h-4" />
                      Configure Digital Twin
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center h-full animate-in fade-in duration-500 py-6">
                  <p className="text-sm text-neutral-400 mb-8 font-mono">No active configuration found. Please initialize the digital twin.</p>
                  <button
                    className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black rounded-xl transition-all text-xs font-bold tracking-widest uppercase font-mono shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-1"
                    onClick={handleConfigureTwin}
                  >
                    <Settings className="w-6 h-6 text-[#FF5500]" />
                    Configure Your Drone
                  </button>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
