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
        const fetchResult = await getUserConfiguration(uid, activeDrone.platformId as DroneCategory);
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#08090a] text-white">
          <div className="flex flex-col items-center gap-3">
            {errorMsg ? (
              <div className="flex flex-col items-center gap-4">
                <p className="font-heading font-bold text-xs uppercase tracking-widest text-rose-500">
                  {errorMsg}
                </p>
                <button
                  onClick={handleExitToDashboard}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded border border-white/20 text-xs font-bold transition-colors"
                >
                  RETURN TO HANGAR
                </button>
              </div>
            ) : (
              <>
                <div className="w-8 h-8 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
                <p className="font-heading font-bold text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-2">
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