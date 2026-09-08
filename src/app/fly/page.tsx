"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { DEFAULT_DRONE_STORAGE_KEY, getDroneById, DRONES } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { ArrowLeft, CheckCircle2, Cpu, Gauge, ShieldCheck, Sparkles } from "lucide-react";

export default function FlyPage() {
  const router = useRouter();
  const [selectedDrone, setSelectedDrone] = useState<DroneModel | null>(null);
  const [loadingDrone, setLoadingDrone] = useState(true);

  useEffect(() => {
    try {
      const urlDrone = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("drone") : null;
      if (urlDrone) {
        const found = getDroneById(urlDrone);
        if (found) {
          setSelectedDrone(found);
          setLoadingDrone(false);
          return;
        }
      }
      const storedId = localStorage.getItem(DEFAULT_DRONE_STORAGE_KEY);
      if (storedId) {
        const drone = getDroneById(storedId);
        if (drone) {
          setSelectedDrone(drone);
        } else {
          setSelectedDrone(DRONES[0]);
        }
      } else {
        setSelectedDrone(DRONES[0]);
      }
    } catch {
      setSelectedDrone(DRONES[0]);
    } finally {
      setLoadingDrone(false);
    }
  }, []);

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen flex flex-col justify-between bg-white text-neutral-900 overflow-x-hidden">
        {/* Background Blueprint */}
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

        {/* Fixed Header */}
        <DashboardHeader />

        {/* Flight Staging Area */}
        <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 flex flex-col items-center justify-center text-center">
          <div className="w-full rounded-2xl bg-gradient-to-b from-[#FFFFFF] via-[#FFFDFB] to-[#FFF9F4] border border-orange-200/90 p-6 sm:p-10 shadow-[0_20px_50px_-12px_rgba(255,85,0,0.14),0_6px_20px_-4px_rgba(0,0,0,0.06)] space-y-6">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>FLIGHT SYSTEMS INITIALIZED</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-2">
              <h1 className="font-heading text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 uppercase">
                READY FOR FLIGHT
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                Selected Platform: <strong className="text-[#FF5500] font-bold">{selectedDrone?.name || "QUADCOPTER"}</strong>
              </p>
            </div>

            {/* Selected Platform Spec Card */}
            {selectedDrone && (
              <div className="rounded-xl bg-white/90 border border-orange-200/80 p-5 max-w-md mx-auto text-left space-y-3">
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

            {/* Phase 3 Notice */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-50/70 border border-orange-200/70 text-xs text-neutral-700 max-w-md mx-auto">
              <Sparkles className="h-4 w-4 text-[#FF5500] shrink-0" />
              <span>Phase 2 complete! 3D flight physics and interactive engine connect here in Phase 3.</span>
            </div>

            {/* Back to Hangar Action */}
            <div className="pt-2 flex justify-center">
              <Button
                variant="black"
                size="md"
                className="min-w-[180px]"
                onClick={() => router.push("/dashboard")}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back to Hangar
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
