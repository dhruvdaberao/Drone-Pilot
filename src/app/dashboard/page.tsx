"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DroneCard } from "@/components/dashboard/drone-card";
import { Button } from "@/components/ui/button";
import { DRONES, DEFAULT_DRONE_STORAGE_KEY } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { ArrowRight, Info } from "lucide-react";

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
      // Default to Quadcopter so user immediately sees a 3D model in action
      setSelectedDrone(DRONES[0]);
    } catch {
      // Storage unavailable or blocked
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

  return (
    <ProtectedRoute>
      {/* Clean Aerospace Hangar Background — No background blueprint image on dashboard */}
      <div className="relative min-h-screen w-full max-w-full flex flex-col justify-between bg-[#FAF7F2] text-neutral-900 overflow-x-hidden">
        {/* Subtle Tech Grid Accent (CSS-only, high contrast, zero blur/doodle clutter) */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255, 85, 0, 0.12) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Fixed Aerospace Orange Header */}
        <DashboardHeader />

        {/* Main Dashboard / Hangar Selection */}
        <main className="relative z-10 flex-1 w-full max-w-full sm:max-w-6xl mx-auto px-3 sm:px-6 pt-16 sm:pt-20 pb-6 flex flex-col justify-center overflow-x-hidden">
          {/* Cockpit Heading */}
          <div className="text-center max-w-2xl mx-auto mb-3 sm:mb-5 pt-1 sm:pt-2 px-1">
            <h1 className="font-heading text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-950 uppercase">
              SELECT YOUR DRONE
            </h1>

            <p className="mt-1 text-[11px] sm:text-xs text-neutral-600 leading-snug max-w-xs sm:max-w-md mx-auto">
              Choose your flight platform to initialize digital telemetry and pre-flight calibrations. Touch or drag any model to rotate in 3D.
            </p>
          </div>

          {/* Drone Selection Grid:
              - Mobile (<640px): 1 column, unselected cards compact, selected card expands
              - Half-screen / Tablet (640px - 1023px): 2 cards in row 1, 1 card centered below them
              - Desktop (1024px+): 3 cards side-by-side in 1 row */}
          <div
            role="radiogroup"
            aria-label="Drone Selection"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 w-full min-w-0 items-start"
          >
            {DRONES.map((drone) => {
              const isSelected = selectedDrone?.id === drone.id;
              return (
                <div
                  key={drone.id}
                  className="w-full min-w-0 sm:last:col-span-2 sm:last:max-w-md sm:last:mx-auto lg:last:col-span-1 lg:last:max-w-none"
                >
                  <DroneCard
                    drone={drone}
                    isSelected={isSelected}
                    onSelect={handleSelectDrone}
                  />
                </div>
              );
            })}
          </div>

          {/* Primary CTA Area: LET'S FLY */}
          <div className="mt-4 sm:mt-6 flex flex-col items-center text-center">
            {selectedDrone ? (
              <div className="flex flex-col items-center gap-1.5 animate-in fade-in duration-200">
                <Button
                  variant="orange"
                  size="md"
                  className="min-w-[240px] sm:min-w-[280px] h-11 sm:h-12 text-xs sm:text-sm font-bold tracking-wider uppercase shadow-[0_6px_22px_rgba(255,85,0,0.4)] transition-transform hover:scale-[1.02]"
                  onClick={handleStartFlight}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  LET&apos;S FLY // {selectedDrone.name}
                </Button>

                <p className="text-[10.5px] text-neutral-500 font-mono flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>3D Platform Calibrated: {selectedDrone.specs.rotors} Rotors Armed</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="md"
                  disabled
                  className="min-w-[240px] sm:min-w-[280px] h-11 sm:h-12 text-xs sm:text-sm font-semibold tracking-wide uppercase opacity-50 cursor-not-allowed border-neutral-300"
                  rightIcon={<ArrowRight className="h-4 w-4 text-neutral-400" />}
                >
                  SELECT A DRONE TO FLY
                </Button>

                <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Click or tap any drone card to inspect in 3D and commence flight</span>
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
