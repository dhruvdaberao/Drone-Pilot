"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DroneModel } from "@/types/drone";
import { DRONES, getDroneById, DEFAULT_DRONE_STORAGE_KEY } from "@/lib/drones";
import { RegionId, RegionDefinition } from "@/lib/world/world-types";
import { REGIONS, REGION_LIST } from "@/lib/world/region-definitions";
import { HELIPADS } from "@/lib/world/helipad-definitions";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Plane, Map as MapIcon, ArrowRight, ArrowLeft, Cloud, Wind, Thermometer, Box, Battery, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveDigitalTwin } from "@/lib/digital-twin/digital-twin-storage";
import { DroneDigitalTwinConfiguration } from "@/types/drone-digital-twin";

type Step = "SELECT_ENVIRONMENT" | "PREFLIGHT";

export function FlightPrepContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("SELECT_ENVIRONMENT");
  const [selectedDrone, setSelectedDrone] = useState<DroneModel>(DRONES[0]);
  const [digitalTwin, setDigitalTwin] = useState<DroneDigitalTwinConfiguration | null>(null);
  
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId | null>(null);

  useEffect(() => {
    try {
      const urlDrone = searchParams.get("drone");
      let activeDrone = DRONES[0];
      if (urlDrone) {
        const found = getDroneById(urlDrone);
        if (found) activeDrone = found;
      } else {
        const stored = localStorage.getItem(DEFAULT_DRONE_STORAGE_KEY);
        if (stored) {
          const found = getDroneById(stored);
          if (found) activeDrone = found;
        }
      }
      setSelectedDrone(activeDrone);
      setDigitalTwin(getActiveDigitalTwin());
    } catch {
      // Fallback
    }
  }, [searchParams]);

  const handleSelectRegion = (regionId: RegionId) => {
    setSelectedRegionId(regionId);
    setStep("PREFLIGHT");
  };

  const handleBack = () => {
    if (step === "PREFLIGHT") {
      setStep("SELECT_ENVIRONMENT");
      setSelectedRegionId(null);
    } else {
      router.push("/dashboard");
    }
  };

  const handleEnterSimulation = () => {
    if (!selectedRegionId) return;
    const region = REGIONS[selectedRegionId];
    const helipadId = region.primaryHelipadId || "training-alpha";
    const isMock = searchParams.get("mock") === "true";
    
    router.push(
      `/fly?region=${selectedRegionId}&helipad=${helipadId}&drone=${selectedDrone.id}&launch=true${
        isMock ? "&mock=true" : ""
      }`
    );
  };

  return (
    <div className="relative min-h-screen w-full max-w-full flex flex-col bg-[#FAF7F2] text-neutral-900 font-sans">
      <DashboardHeader />

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 pt-24 pb-12 flex flex-col">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:border-black transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{step === "PREFLIGHT" ? "Back to Environments" : "Back to Dashboard"}</span>
          </button>
        </div>

        {step === "SELECT_ENVIRONMENT" && (
          <div className="animate-in fade-in duration-300">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h1 className="font-heading text-3xl font-extrabold tracking-widest text-neutral-950 uppercase mb-2">
                Select Environment
              </h1>
              <p className="text-sm font-medium text-neutral-500">
                Choose a simulation biome for your flight operations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {REGION_LIST.map((region) => (
                <div
                  key={region.id}
                  onClick={() => handleSelectRegion(region.id as RegionId)}
                  className="group relative bg-white border border-neutral-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col h-64"
                >
                  {/* Visual Placeholder for Environment */}
                  <div 
                    className="h-32 w-full relative transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundColor: region.mapColor || "#ccc" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 text-white">
                      <h3 className="font-heading text-lg font-bold tracking-wider uppercase drop-shadow-sm">
                        {region.name}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1 justify-between bg-white z-10">
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                      {region.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-4 border-t border-neutral-100 pt-3">
                      <div className="flex items-center gap-3 text-[10px] font-mono font-semibold uppercase text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Wind className="w-3 h-3 text-[#FF5500]" /> {region.environment.baseWindSpeedMs} m/s
                        </span>
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-[#FF5500]" /> {region.environment.airTemperatureC}°C
                        </span>
                      </div>
                      <span className="text-[10px] font-bold tracking-widest text-[#FF5500] group-hover:text-[#e04b00] uppercase">
                        SELECT
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "PREFLIGHT" && selectedRegionId && digitalTwin && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-xl mx-auto w-full">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              
              <div className="bg-neutral-950 p-6 text-center">
                <h1 className="font-heading text-2xl font-extrabold tracking-widest text-white uppercase mb-1">
                  PREFLIGHT
                </h1>
                <p className="text-xs text-neutral-400 font-mono tracking-widest uppercase">
                  Final Authorization
                </p>
              </div>

              <div className="p-6 space-y-6">
                
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase">AIRCRAFT</h3>
                  <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                    <div className="flex items-center gap-3">
                      <Plane className="w-5 h-5 text-[#FF5500]" />
                      <span className="text-sm font-bold tracking-wider uppercase text-neutral-900">{digitalTwin.identity.name}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase flex items-center gap-1">
                      <Scale className="w-3 h-3" /> MASS
                    </h3>
                    <p className="text-sm font-mono font-medium text-neutral-900">{digitalTwin.massProperties.totalMassKg.toFixed(2)} kg</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase flex items-center gap-1">
                      <Battery className="w-3 h-3" /> BATTERY
                    </h3>
                    <p className="text-sm font-mono font-medium text-neutral-900">{digitalTwin.battery.capacityMah} mAh</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase flex items-center gap-1">
                      <Box className="w-3 h-3" /> PAYLOAD
                    </h3>
                    <p className="text-sm font-mono font-medium text-neutral-900">{digitalTwin.payload.massKg.toFixed(1)} kg</p>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase">ENVIRONMENT</h3>
                    <p className="text-sm font-bold tracking-wider uppercase text-neutral-900">
                      {REGIONS[selectedRegionId].name}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase">WEATHER</h3>
                    <p className="text-sm font-mono font-medium text-neutral-900">
                      {REGIONS[selectedRegionId].environment.baseWindSpeedMs} m/s Wind • {REGIONS[selectedRegionId].environment.airTemperatureC}°C
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase">STARTING LOCATION</h3>
                    <p className="text-sm font-mono font-medium text-neutral-900">
                      {HELIPADS[REGIONS[selectedRegionId].primaryHelipadId || "training-alpha"]?.name || "Main Pad"}
                    </p>
                  </div>
                </div>

              </div>

              <div className="p-6 bg-neutral-50 border-t border-neutral-100">
                <Button
                  variant="black"
                  onClick={handleEnterSimulation}
                  className="w-full h-14 text-sm font-bold tracking-widest uppercase shadow-[0_8px_24px_rgba(255,85,0,0.15)] bg-[#FF5500] hover:bg-[#e04b00] text-white hover:-translate-y-0.5 transition-all"
                >
                  FLY
                </Button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
