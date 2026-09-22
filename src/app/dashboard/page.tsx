"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DroneCard } from "@/components/dashboard/drone-card";
import { Button } from "@/components/ui/button";
import { DRONES, DEFAULT_DRONE_STORAGE_KEY } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { ArrowRight, Settings, Loader2 } from "lucide-react";
import { listUserConfigurations } from "@/lib/digital-twin/digital-twin-storage";
import { DroneDigitalTwinConfiguration } from "@/types/drone-digital-twin";

export default function DashboardPage() {
  const router = useRouter();
  const [selectedDrone, setSelectedDrone] = useState<DroneModel | null>(null);
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

  const activeConfig = selectedDrone 
    ? savedConfigs.find(c => c.identity.category === selectedDrone.id)
    : null;

  const handleConfigureTwin = () => {
    if (!selectedDrone) return;
    router.push(`/configure?drone=${selectedDrone.id}`);
  };

  const handleContinue = () => {
    if (!selectedDrone) return;
    router.push(`/fly/select?drone=${selectedDrone.id}`);
  };

  const handleBackgroundClick = () => {
    setSelectedDrone(null);
  };

  return (
    <ProtectedRoute>
      <div
        onClick={handleBackgroundClick}
        className="relative min-h-screen w-full max-w-full flex flex-col bg-[#FAF7F2] text-neutral-900 overflow-x-hidden font-sans"
      >
        <DashboardHeader />

        <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 pt-24 pb-12 flex flex-col items-center">
          
          <div className="text-center max-w-xl mx-auto mb-10 select-none">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-widest text-neutral-950 uppercase mb-2">
              Select Your Drone
            </h1>
            <p className="text-sm font-medium text-neutral-500">
              Choose the aircraft you want to simulate.
            </p>
          </div>

          {/* Drone Selection Grid */}
          <div
            role="radiogroup"
            aria-label="Drone Selection"
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full"
          >
            {DRONES.map((drone) => {
              const isSelected = selectedDrone?.id === drone.id;
              return (
                <div key={drone.id} className="w-full h-full">
                  <DroneCard
                    drone={drone}
                    isSelected={isSelected}
                    onSelect={handleSelectDrone}
                  />
                </div>
              );
            })}
          </div>

          {/* Bottom Action Area */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-12 flex flex-col items-center w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 min-h-[160px]"
          >
            {!selectedDrone ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-2">
                <span className="text-sm">Select an aircraft above to begin.</span>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-[#FF5500]" />
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">Loading configurations...</span>
              </div>
            ) : activeConfig ? (
              <div className="w-full animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center mb-6">
                  <h2 className="text-sm font-bold tracking-widest uppercase mb-1">Saved Configuration Found</h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    {activeConfig.massProperties.totalMassKg.toFixed(1)} KG MTOW • {activeConfig.battery.cellCount}S LIPO • {activeConfig.motors.length} MOTORS
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto min-w-[200px] h-12 text-xs font-bold tracking-widest uppercase border-neutral-200 hover:bg-neutral-50"
                    onClick={handleConfigureTwin}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    EDIT CONFIGURATION
                  </Button>
                  <Button
                    variant="black"
                    className="w-full sm:w-auto min-w-[200px] h-12 text-xs font-bold tracking-widest uppercase shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all"
                    onClick={handleContinue}
                  >
                    CONTINUE TO ENVIRONMENT
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center h-full animate-in fade-in duration-300">
                <p className="text-sm text-neutral-500 mb-6">First time flying this aircraft? Let's configure it.</p>
                <Button
                  variant="black"
                  className="w-full sm:w-auto min-w-[240px] h-12 text-xs font-bold tracking-widest uppercase shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all"
                  onClick={handleConfigureTwin}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  CONFIGURE YOUR DRONE
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
