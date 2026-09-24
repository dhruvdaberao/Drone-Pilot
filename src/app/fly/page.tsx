"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DEFAULT_DRONE_STORAGE_KEY, getDroneById, DRONES } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { FlightSimulator } from "@/components/simulator/flight-simulator";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getUserConfiguration } from "@/lib/digital-twin/digital-twin-storage";
import { DroneDigitalTwinConfiguration, DroneCategory } from "@/types/drone-digital-twin";

export default function FlyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDrone, setSelectedDrone] = useState<DroneModel | null>(null);
  const [initialConfig, setInitialConfig] = useState<DroneDigitalTwinConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
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

        if (!isMounted) return;
        setSelectedDrone(activeDrone);
        
        // Fetch specific config
        const uid = user ? user.uid : null;
        const fetchResult = await getUserConfiguration(uid, activeDrone.id as DroneCategory);
        if (!isMounted) return;
        
        if (fetchResult.status === "SUCCESS" && fetchResult.data) {
          setInitialConfig(fetchResult.data);
        } else if (fetchResult.status === "ERROR") {
          setErrorMsg("Unable to load aircraft configuration.");
        }
        
      } catch (err) {
        console.error(err);
        if (isMounted) setErrorMsg("Unable to load aircraft configuration.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [user]);

  const handleExitToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <ProtectedRoute>
      {!loading && !errorMsg && selectedDrone ? (
        <FlightSimulator
          selectedDrone={selectedDrone}
          initialDigitalTwin={initialConfig || undefined}
          onExit={handleExitToDashboard}
        />
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] text-neutral-900">
          <div className="flex flex-col items-center gap-3">
            {errorMsg ? (
              <div className="flex flex-col items-center gap-4">
                <p className="font-heading font-bold text-xs uppercase tracking-widest text-red-600">
                  {errorMsg}
                </p>
                <button
                  onClick={handleExitToDashboard}
                  className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 rounded text-xs font-bold transition-colors"
                >
                  RETURN TO GARAGE
                </button>
              </div>
            ) : (
              <>
                <Loader2 className="h-8 w-8 text-[#FF5500] animate-spin" />
                <p className="font-heading font-bold text-xs uppercase tracking-widest text-neutral-600">
                  INITIALIZING FLIGHT SIMULATION...
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}