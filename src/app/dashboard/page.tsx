"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Drone3DViewer } from "@/components/dashboard/drone-3d-viewer";
import { Button } from "@/components/ui/button";
import { DRONES, DEFAULT_DRONE_STORAGE_KEY } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { ArrowRight, Settings, Loader2, Target, Activity, ShieldCheck, Crosshair } from "lucide-react";
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
            <div className="relative inline-block animate-in slide-in-from-top-10 fade-in duration-700">
              <h1 className={`${spaceGrotesk.className} text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-[0.2em] text-white uppercase text-center drop-shadow-[0_0_20px_rgba(255,85,0,0.4)]`}>
                {selectedDrone.name}
              </h1>
              {/* Glowing Underline Accent */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-[3px] bg-gradient-to-r from-transparent via-[#FF5500] to-transparent shadow-[0_0_15px_#FF5500]" />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-8 max-w-[1400px] mx-auto w-full mb-4">
            
            {/* Left Column: Drone Technical Stats */}
            <div className="flex flex-col gap-6 pointer-events-auto w-64">
              {/* Platform Specs - HUD Style */}
              <div key={`specs-${selectedDrone.id}`} className="animate-in slide-in-from-left-8 fade-in duration-500 delay-100 flex flex-col">
                <h3 className="text-xs font-bold text-[#FF5500] tracking-widest uppercase mb-4 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,85,0,0.8)]">
                  <Activity className="w-4 h-4" /> 
                  Platform Specs
                </h3>
                <div className="space-y-4 font-mono border-l-2 border-[#FF5500]/40 pl-4">
                  <div>
                    <span className="block text-[10px] text-neutral-400 tracking-wider">PROPULSION</span>
                    <span className="text-sm font-semibold text-white drop-shadow-md">{selectedDrone.specs.rotors} MOTORS</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-400 tracking-wider">WEIGHT CLASS</span>
                    <span className="text-sm font-semibold text-white drop-shadow-md">{selectedDrone.specs.weightClass}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-400 tracking-wider">CERTIFICATION</span>
                    <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {selectedDrone.badge}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drone Selection List - HUD Style */}
              <div className="flex flex-col gap-2 mt-4">
                {DRONES.map(drone => (
                  <button
                    key={drone.id}
                    onClick={() => handleSelectDrone(drone)}
                    className={`flex items-center gap-3 px-3 py-2 transition-all cursor-pointer text-left border-l-2 ${
                      selectedDrone.id === drone.id 
                      ? "border-[#FF5500] text-white" 
                      : "border-transparent text-neutral-500 hover:text-white hover:border-white/30"
                    }`}
                  >
                    <Crosshair className={`w-4 h-4 ${selectedDrone.id === drone.id ? "text-[#FF5500] drop-shadow-[0_0_5px_#FF5500]" : "text-neutral-500"}`} />
                    <span className="text-xs font-bold tracking-[0.15em] uppercase font-mono">{drone.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column / Bottom Action Area */}
            <div className="w-full max-w-sm pointer-events-auto flex flex-col items-end text-right">
              
              {isLoading ? (
                <div className="flex items-center justify-end gap-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">Syncing telemetry...</span>
                  <Loader2 className="h-5 w-5 animate-spin text-[#FF5500]" />
                </div>
              ) : activeConfig ? (
                <div key={`config-${selectedDrone.id}`} className="w-full flex flex-col items-end animate-in slide-in-from-right-8 fade-in duration-500 delay-200">
                  <div className="flex flex-col items-end mb-6">
                    <h2 className="text-lg font-bold tracking-widest uppercase mb-1 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]">
                      Ready for Flight
                    </h2>
                    <p className="text-xs text-neutral-300 font-mono">
                      {activeConfig.massProperties.totalMassKg.toFixed(1)} KG MTOW • {activeConfig.battery.cellCount}S LIPO
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 w-full">
                    <Button
                      className="w-full h-14 bg-[#FF5500] hover:bg-white hover:text-black text-white text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(255,85,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.8)] transition-all duration-300 rounded-none border border-[#FF5500] hover:border-white skew-x-[-10deg]"
                      onClick={handleContinue}
                    >
                      <div className="skew-x-[10deg] flex items-center">
                        INITIALIZE FLIGHT
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </div>
                    </Button>
                    
                    <button
                      className="w-full flex items-center justify-end gap-2 text-neutral-400 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase font-mono py-2"
                      onClick={handleConfigureTwin}
                    >
                      CONFIGURE DIGITAL TWIN <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div key={`noconfig-${selectedDrone.id}`} className="w-full flex flex-col items-end animate-in slide-in-from-right-8 fade-in duration-500 delay-200">
                  <p className="text-xs text-[#FF5500] mb-4 font-mono font-bold tracking-widest uppercase drop-shadow-[0_0_5px_#FF5500]">Action Required</p>
                  
                  <Button
                    className="w-full h-14 bg-white/5 hover:bg-[#FF5500] text-white border border-white/20 hover:border-[#FF5500] text-sm font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,85,0,0.6)] backdrop-blur-sm transition-all duration-300 rounded-none skew-x-[-10deg]"
                    onClick={handleConfigureTwin}
                  >
                    <div className="skew-x-[10deg] flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      CONFIGURE YOUR DRONE
                    </div>
                  </Button>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
