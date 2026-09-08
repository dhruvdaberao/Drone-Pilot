"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DroneCard } from "@/components/dashboard/drone-card";
import { Button } from "@/components/ui/button";
import { DRONES, DEFAULT_DRONE_STORAGE_KEY } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { ArrowRight, PlaneTakeoff, Info } from "lucide-react";

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
        if (found) setSelectedDrone(found);
      }
    } catch {
      // Storage unavailable or blocked
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
      <div className="relative min-h-screen flex flex-col justify-between bg-white text-neutral-900 overflow-x-hidden">
        {/* Background Blueprint with Warm Aerospace Tint */}
        <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-white">
          <Image
            src="/Final-Baground.png"
            alt="Technical Drone Flight Blueprint Background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-25 [filter:sepia(100%)_saturate(500%)_hue-rotate(-22deg)]"
          />
        </div>

        {/* Fixed Aerospace Orange Header */}
        <DashboardHeader />

        {/* Main Dashboard / Hangar Selection */}
        <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-16 sm:pt-18 pb-6 flex flex-col justify-center">
          {/* Welcome Area */}
          <div className="text-center max-w-2xl mx-auto mb-3 sm:mb-4 pt-1 sm:pt-2 px-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-50 border border-orange-200/90 text-[11px] font-semibold text-[#FF5500] uppercase tracking-wider mb-1.5">
              <PlaneTakeoff className="h-3 w-3" />
              <span>Pilot Hangar // Stage 1</span>
            </div>

            <h1 className="font-heading text-lg sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 uppercase">
              SELECT YOUR DRONE
            </h1>

            <p className="mt-1 text-[11px] sm:text-xs text-neutral-600 leading-snug max-w-xs sm:max-w-md mx-auto">
              Choose your flight platform to initialize digital telemetry and pre-flight calibrations.
            </p>
          </div>

          {/* Drone Selection Grid */}
          <div
            role="radiogroup"
            aria-label="Drone Selection"
            className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 w-full"
          >
            {DRONES.map((drone) => (
              <DroneCard
                key={drone.id}
                drone={drone}
                isSelected={selectedDrone?.id === drone.id}
                onSelect={handleSelectDrone}
              />
            ))}
          </div>

          {/* Primary CTA Area: LET'S FLY */}
          <div className="mt-4 sm:mt-5 flex flex-col items-center text-center">
            {selectedDrone ? (
              <div className="flex flex-col items-center gap-2 animate-in fade-in duration-200">
                <Button
                  variant="orange"
                  size="md"
                  className="min-w-[220px] sm:min-w-[260px] h-11 sm:h-12 text-xs sm:text-sm font-bold tracking-wider uppercase shadow-[0_6px_20px_rgba(255,85,0,0.4)]"
                  onClick={handleStartFlight}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  LET&apos;S FLY // {selectedDrone.name}
                </Button>

                <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Platform confirmed: {selectedDrone.specs.rotors} rotors ready for calibration</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  disabled
                  className="min-w-[220px] sm:min-w-[260px] h-11 sm:h-12 text-xs sm:text-sm font-semibold tracking-wide uppercase opacity-50 cursor-not-allowed border-neutral-300"
                  rightIcon={<ArrowRight className="h-4 w-4 text-neutral-400" />}
                >
                  SELECT A DRONE TO FLY
                </Button>

                <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Click or tap any drone card above to unlock flight controls</span>
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
