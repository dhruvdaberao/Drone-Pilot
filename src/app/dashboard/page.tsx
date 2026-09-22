"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DroneCard } from "@/components/dashboard/drone-card";
import { Button } from "@/components/ui/button";
import { DRONES, DEFAULT_DRONE_STORAGE_KEY } from "@/lib/drones";
import { HELIPAD_LIST } from "@/lib/world/helipad-definitions";
import { DroneModel } from "@/types/drone";
import { ArrowRight, Sliders, Target, Compass, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [selectedDrone, setSelectedDrone] = useState<DroneModel | null>(null);

  // Restore previous selection if exists or via URL param
  useEffect(() => {
    try {
      const urlDrone = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("drone") : null;
      if (urlDrone) {
        const found = DRONES.find((d) => d.id === urlDrone);
        if (found) {
          setSelectedDrone(found);
          return;
        }
      }
      const stored = localStorage.getItem(DEFAULT_DRONE_STORAGE_KEY);
      if (stored) {
        const found = DRONES.find((d) => d.id === stored);
        if (found) {
          setSelectedDrone(found);
          return;
        }
      }
      // Initial default to Quadcopter
      setSelectedDrone(DRONES[0]);
    } catch {
      setSelectedDrone(DRONES[0]);
    }
  }, []);

  const handleSelectDrone = (drone: DroneModel) => {
    setSelectedDrone(drone);
    try {
      localStorage.setItem(DEFAULT_DRONE_STORAGE_KEY, drone.id);
    } catch {
      // Storage error ignored
    }
  };

  const handleStartFlight = () => {
    if (!selectedDrone) return;
    try {
      localStorage.setItem(DEFAULT_DRONE_STORAGE_KEY, selectedDrone.id);
    } catch {
      // Storage error ignored
    }
    const isMock = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mock") === "true";

    router.push(
      `/fly/select?drone=${selectedDrone.id}${isMock ? "&mock=true" : ""}`
    );
  };

  const handleConfigureTwin = () => {
    if (!selectedDrone) return;
    try {
      localStorage.setItem(DEFAULT_DRONE_STORAGE_KEY, selectedDrone.id);
    } catch {
      // Storage error ignored
    }
    router.push(`/configure?drone=${selectedDrone.id}`);
  };

  const handleBackgroundClick = () => {
    // Clicking the background stage deselects the current drone
    setSelectedDrone(null);
  };

  return (
    <ProtectedRoute>
      {/* Clean Aerospace Hangar Stage — Clicking background clears drone selection */}
      <div
        onClick={handleBackgroundClick}
        className="relative min-h-screen w-full max-w-full flex flex-col justify-between bg-[#FAF7F2] text-neutral-900 overflow-x-hidden cursor-default"
      >
        {/* Subtle Tech Grid Accent */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Fixed Aerospace Orange Header */}
        <DashboardHeader />

        {/* Main Hangar Stage */}
        <main className="relative z-10 flex-1 w-full max-w-full sm:max-w-6xl mx-auto px-4 sm:px-8 pt-18 sm:pt-20 pb-8 flex flex-col justify-center overflow-x-hidden">
          {/* Platform Heading (Requirement 36) */}
          <div className="text-center max-w-3xl mx-auto mb-3 sm:mb-4 px-2 select-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white font-mono text-[10px] font-bold tracking-widest uppercase mb-2 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-ping" />
              <span>AERONAUTICAL DIGITAL-TWIN LABORATORY</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 uppercase">
              DRONE PILOT
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-neutral-600 max-w-lg mx-auto leading-relaxed">
              Interactive Drone Simulation & Digital Twin Platform. Configure real airframe parameters, inject faults, manipulate aerodynamics, and evaluate telemetry.
            </p>

            {/* Quick-Access Platform Feature Modules */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-left font-mono">
              <button
                type="button"
                onClick={() => router.push("/configure")}
                className="p-2.5 rounded-xl bg-white border border-neutral-200/90 hover:border-black transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 group-hover:text-[#FF5500]">
                  <Sliders className="h-3.5 w-3.5 text-[#FF5500]" />
                  <span>DIGITAL TWIN</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 leading-tight line-clamp-2">
                  Configure mass, motors, battery & payload.
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/fly/select")}
                className="p-2.5 rounded-xl bg-white border border-neutral-200/90 hover:border-black transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 group-hover:text-emerald-600">
                  <Target className="h-3.5 w-3.5 text-emerald-600" />
                  <span>SCENARIOS</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 leading-tight line-clamp-2">
                  Emergency RTL, wind gusts & motor degradation.
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/fly/select")}
                className="p-2.5 rounded-xl bg-white border border-neutral-200/90 hover:border-black transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 group-hover:text-cyan-600">
                  <Compass className="h-3.5 w-3.5 text-cyan-600" />
                  <span>SIMULATION</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 leading-tight line-clamp-2">
                  20 island vertiports across 2.4km proving ground.
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/fly/select")}
                className="p-2.5 rounded-xl bg-white border border-neutral-200/90 hover:border-black transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 group-hover:text-purple-600">
                  <BarChart3 className="h-3.5 w-3.5 text-purple-600" />
                  <span>ANALYSIS</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 leading-tight line-clamp-2">
                  Flight forensics, blackbox debrief & 3D replay.
                </p>
              </button>
            </div>
          </div>


          {/* Cardless Hangar 3D Stage Grid:
              - Desktop (1024px+): 3 drones in 1 horizontal line
              - Half-screen (640px - 1023px): 2 drones in row 1, 1 drone centered below
              - Mobile (<640px): Stacked cleanly */}
          <div
            role="radiogroup"
            aria-label="Drone Selection"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 w-full min-w-0 items-stretch my-auto"
          >
            {DRONES.map((drone) => {
              const isSelected = selectedDrone?.id === drone.id;
              return (
                <div
                  key={drone.id}
                  className="w-full min-w-0 flex justify-center sm:last:col-span-2 lg:last:col-span-1 h-full"
                >
                  <div className="w-full max-w-[340px] lg:max-w-none h-full">
                    <DroneCard
                      drone={drone}
                      isSelected={isSelected}
                      onSelect={handleSelectDrone}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Action Area */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-6 sm:mt-8 flex flex-col items-center text-center select-none"
          >
            {selectedDrone ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 animate-in fade-in duration-200">
                <Button
                  variant="black"
                  size="md"
                  className="min-w-[200px] sm:min-w-[240px] h-12 text-sm font-bold tracking-widest uppercase shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:bg-black hover:-translate-y-0.5 transition-all"
                  onClick={handleStartFlight}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  PRE-FLIGHT BRIEFING
                </Button>

                <button
                  type="button"
                  onClick={handleConfigureTwin}
                  className="min-w-[200px] sm:min-w-[240px] h-12 px-4 rounded-xl border-2 border-neutral-900 bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-xs"
                >
                  ⚙ CONFIGURE DIGITAL TWIN
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="black"
                  size="md"
                  disabled
                  className="min-w-[220px] sm:min-w-[260px] h-12 text-sm font-bold tracking-widest uppercase opacity-40 cursor-not-allowed border border-neutral-300"
                >
                  SELECT AIRCRAFT
                </Button>

                <p className="text-xs text-neutral-400">
                  Select an aircraft above to continue
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
