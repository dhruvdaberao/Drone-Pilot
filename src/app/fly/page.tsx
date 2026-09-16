"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { DEFAULT_DRONE_STORAGE_KEY, getDroneById, DRONES } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { FlightSimulator } from "@/components/simulator/flight-simulator";
import { REGIONS } from "@/lib/world/region-definitions";
import { HELIPADS, HELIPAD_LIST } from "@/lib/world/helipad-definitions";
import { ArrowLeft, CheckCircle2, Cpu, Gauge, Play, ShieldCheck, MapPin, Compass } from "lucide-react";

export default function FlyPage() {
  const router = useRouter();
  const [selectedDrone, setSelectedDrone] = useState<DroneModel | null>(null);
  const [targetRegionId, setTargetRegionId] = useState<string>("training");
  const [targetHelipadId, setTargetHelipadId] = useState<string>("training-alpha");
  const [loadingDrone, setLoadingDrone] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    try {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const urlDrone = params?.get("drone");
      const urlRegion = params?.get("region");
      const urlHelipad = params?.get("helipad");
      const autoLaunch = params?.get("launch") === "true";

      let activeDrone = DRONES[0];

      if (urlDrone) {
        const found = getDroneById(urlDrone);
        if (found) {
          activeDrone = found;
        }
      } else {
        const storedId = localStorage.getItem(DEFAULT_DRONE_STORAGE_KEY);
        if (storedId) {
          const drone = getDroneById(storedId);
          if (drone) activeDrone = drone;
        }
      }

      if (urlHelipad && HELIPADS[urlHelipad]) {
        setTargetHelipadId(urlHelipad);
        setTargetRegionId(HELIPADS[urlHelipad].regionId);
      } else if (urlRegion && REGIONS[urlRegion]) {
        setTargetRegionId(urlRegion);
        const regPads = HELIPAD_LIST.filter((h) => h.regionId === urlRegion && h.spawnAllowed);
        if (regPads.length > 0) {
          setTargetHelipadId(regPads[0].id);
        }
      } else {
        // Dynamic random tactical dropzone across the island
        const spawnablePads = HELIPAD_LIST.filter((h) => h.spawnAllowed);
        const randomPad = spawnablePads[Math.floor(Math.random() * spawnablePads.length)] || HELIPAD_LIST[0];
        setTargetHelipadId(randomPad.id);
        setTargetRegionId(randomPad.regionId);
      }

      setSelectedDrone(activeDrone);
      if (autoLaunch) {
        setIsSimulating(true);
      }
    } catch {
      setSelectedDrone(DRONES[0]);
    } finally {
      setLoadingDrone(false);
    }
  }, []);

  // --------------------------------------------------------
  // ACTIVE 3D FLIGHT SIMULATION VIEWPORT
  // --------------------------------------------------------
  if (isSimulating && selectedDrone) {
    return (
      <ProtectedRoute>
        <FlightSimulator
          selectedDrone={selectedDrone}
          onExit={() => setIsSimulating(false)}
        />
      </ProtectedRoute>
    );
  }

  // --------------------------------------------------------
  // PRE-FLIGHT STAGING BRIEFING
  // --------------------------------------------------------
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen flex flex-col justify-between bg-[#FAF7F2] text-neutral-900 overflow-x-hidden">
        {/* Subtle Tech Grid Accent */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255, 85, 0, 0.12) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Fixed Header */}
        <DashboardHeader />

        {/* Flight Staging Area */}
        <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 flex flex-col items-center justify-center text-center">
          <div className="w-full rounded-2xl bg-white border-2 border-black p-6 sm:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12),0_6px_20px_-4px_rgba(0,0,0,0.06)] space-y-6">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>FLIGHT SYSTEMS INITIALIZED • READY FOR TAKEOFF</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-2">
              <h1 className="font-heading text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 uppercase">
                ENTER COCKPIT
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                Platform: <strong className="text-neutral-950 font-bold">{selectedDrone?.name || "QUADCOPTER"}</strong>
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-neutral-100 border border-neutral-300 font-mono text-[11px] text-neutral-700">
                <MapPin className="h-3.5 w-3.5 text-[#FF5500]" />
                <span>ZONE: {REGIONS[targetRegionId]?.shortName.toUpperCase() || "ACADEMY"}</span>
                <span className="text-neutral-400">•</span>
                <span>PAD: {HELIPADS[targetHelipadId]?.name.split(" ")[0].toUpperCase() || "ALPHA"} ({(HELIPADS[targetHelipadId]?.elevation ?? 1.2).toFixed(1)}m)</span>
              </div>
            </div>

            {/* Selected Platform Spec Card */}
            {selectedDrone && (
              <div className="rounded-xl bg-neutral-50/80 border border-black p-5 max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                  <span className="font-heading font-bold text-sm text-neutral-900">
                    {selectedDrone.name}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#FF5500] bg-orange-50 px-2 py-0.5 rounded">
                    {selectedDrone.specs.rotors} ROTORS
                  </span>
                </div>

                <p className="text-xs text-neutral-600">
                  {selectedDrone.description}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-neutral-50 border border-neutral-200">
                    <Gauge className="h-3 w-3 text-[#FF5500] mx-auto mb-0.5" />
                    <span className="text-[10px] text-neutral-500 block">Handling</span>
                    <strong className="text-[11px] text-neutral-800">{selectedDrone.specs.handling}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-neutral-50 border border-neutral-200">
                    <ShieldCheck className="h-3 w-3 text-[#FF5500] mx-auto mb-0.5" />
                    <span className="text-[10px] text-neutral-500 block">Stability</span>
                    <strong className="text-[11px] text-neutral-800">{selectedDrone.specs.stability}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-neutral-50 border border-neutral-200">
                    <Cpu className="h-3 w-3 text-[#FF5500] mx-auto mb-0.5" />
                    <span className="text-[10px] text-neutral-500 block">Class</span>
                    <strong className="text-[11px] text-neutral-800">{selectedDrone.badge}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="black"
                size="lg"
                className="w-full sm:w-auto min-w-[200px] text-sm font-bold tracking-wider"
                onClick={() => setIsSimulating(true)}
                rightIcon={<Play className="h-4 w-4 fill-current text-[#FF5500]" />}
              >
                LAUNCH SIMULATOR
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-w-[160px] border-2 border-black"
                onClick={() => router.push(`/fly/select?drone=${selectedDrone?.id}&region=${targetRegionId}&helipad=${targetHelipadId}`)}
                leftIcon={<Compass className="h-4 w-4 text-[#FF5500]" />}
              >
                Change Region
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto min-w-[130px] border border-neutral-300"
                onClick={() => router.push("/dashboard")}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Hangar
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}