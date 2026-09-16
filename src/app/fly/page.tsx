"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DEFAULT_DRONE_STORAGE_KEY, getDroneById, DRONES } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { FlightSimulator } from "@/components/simulator/flight-simulator";
import { Loader2 } from "lucide-react";

export default function FlyPage() {
  const router = useRouter();
  const [selectedDrone, setSelectedDrone] = useState<DroneModel | null>(null);

  useEffect(() => {
    try {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const urlDrone = params?.get("drone");

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

      setSelectedDrone(activeDrone);
    } catch {
      setSelectedDrone(DRONES[0]);
    }
  }, []);

  const handleExitToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <ProtectedRoute>
      {selectedDrone ? (
        <FlightSimulator
          selectedDrone={selectedDrone}
          onExit={handleExitToDashboard}
        />
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] text-neutral-900">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-[#FF5500] animate-spin" />
            <p className="font-heading font-bold text-xs uppercase tracking-widest text-neutral-600">
              INITIALIZING FLIGHT SIMULATION...
            </p>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}