"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DroneCard } from "@/components/dashboard/drone-card";
import { Button } from "@/components/ui/button";
import { DRONES, DEFAULT_DRONE_STORAGE_KEY } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { ArrowRight } from "lucide-react";

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
    router.push("/fly");
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
        <main className="relative z-10 flex-1 w-full max-w-full sm:max-w-6xl mx-auto px-4 sm:px-8 pt-20 sm:pt-24 pb-8 flex flex-col justify-center overflow-x-hidden">
          {/* Hangar Heading */}
          <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-6 px-2 select-none pointer-events-none">
            <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 uppercase">
              SELECT YOUR DRONE
            </h1>

            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
              Choose your flight platform to initialize digital telemetry. Touch or drag any aircraft to inspect in 3D.
            </p>
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

          {/* Primary CTA Area: Black LET'S FLY Button */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-6 sm:mt-8 flex flex-col items-center text-center select-none"
          >
            {selectedDrone ? (
              <div className="flex flex-col items-center gap-2 animate-in fade-in duration-200">
                <Button
                  variant="black"
                  size="md"
                  className="min-w-[220px] sm:min-w-[260px] h-12 text-sm font-bold tracking-widest uppercase shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:bg-black hover:-translate-y-0.5 transition-all"
                  onClick={handleStartFlight}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  LET&apos;S FLY
                </Button>

                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Platform confirmed: {selectedDrone.name} ({selectedDrone.specs.rotors} Rotors Armed)</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="black"
                  size="md"
                  disabled
                  className="min-w-[220px] sm:min-w-[260px] h-12 text-sm font-bold tracking-widest uppercase opacity-40 cursor-not-allowed border border-neutral-300"
                >
                  LET&apos;S FLY
                </Button>

                <p className="text-xs text-neutral-400">
                  Select an aircraft above to initialize flight controls
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
