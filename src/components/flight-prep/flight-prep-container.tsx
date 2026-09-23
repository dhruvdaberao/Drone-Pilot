"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DroneModel } from "@/types/drone";
import { DRONES, getDroneById, DEFAULT_DRONE_STORAGE_KEY } from "@/lib/drones";
import { RegionId, RegionDefinition } from "@/lib/world/world-types";
import { REGIONS, REGION_LIST } from "@/lib/world/region-definitions";
import { ArrowLeft, ArrowRight, CheckCircle2, Wind, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveDigitalTwin } from "@/lib/digital-twin/digital-twin-storage";
import { DroneDigitalTwinConfiguration, DroneCategory } from "@/types/drone-digital-twin";

export function FlightPrepContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const activeCategory = searchParams?.get("drone") as DroneCategory | null;

  const [digitalTwin, setDigitalTwin] = useState<DroneDigitalTwinConfiguration | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId | null>("city");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const twin = getActiveDigitalTwin(null); // Assuming this retrieves it correctly
      setDigitalTwin(twin);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleEnterSimulation = () => {
    if (!selectedRegionId) return;
    router.push(`/fly?drone=${activeCategory || "quadcopter"}&region=${selectedRegionId}`);
  };

  const handleBack = () => {
    if (activeCategory) {
      router.push(`/configure?drone=${activeCategory}`);
    } else {
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Loading Environment...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#08090a] text-white overflow-hidden pb-24">
      {/* Step Indicator */}
      <div className="w-full border-b border-white/5 bg-[#08090a]/80 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4 sm:gap-8 overflow-x-auto scrollbar-none text-[11px] font-bold tracking-widest text-neutral-500">
          <span className="shrink-0 text-white">01 AIRCRAFT</span>
          <span className="shrink-0 text-neutral-700">/</span>
          <span className="shrink-0 text-white">02 CONFIGURE</span>
          <span className="shrink-0 text-neutral-700">/</span>
          <span className="text-[#FF5500] shrink-0">03 ENVIRONMENT</span>
          <span className="shrink-0 text-neutral-700">/</span>
          <span className="shrink-0 text-neutral-500">04 FLIGHT</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase mb-3">
            SELECT ENVIRONMENT
          </h1>
          <p className="text-sm text-neutral-400 font-medium">
            Choose the environment in which your configured aircraft will operate.
          </p>
        </div>

        {/* Environment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {REGION_LIST.map((region) => {
            const isSelected = selectedRegionId === region.id;
            
            return (
              <div
                key={region.id}
                onClick={() => setSelectedRegionId(region.id as RegionId)}
                className={`group relative flex flex-col h-72 rounded-lg cursor-pointer overflow-hidden transition-all duration-300 ${
                  isSelected 
                    ? "border border-[#FF5500] shadow-[0_4px_24px_rgba(255,85,0,0.15)] -translate-y-1" 
                    : "border border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                {/* Image Area */}
                <div 
                  className="h-36 w-full relative overflow-hidden bg-neutral-900"
                >
                  <div 
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.02]"
                    style={{ backgroundColor: region.mapColor || "#1f1f1f" }}
                  />
                  <div className={`absolute inset-0 transition-opacity duration-300 ${isSelected ? 'bg-black/20' : 'bg-black/40 group-hover:bg-black/30'}`} />
                  
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-[#FF5500] text-white rounded-full p-1 shadow-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col p-5 bg-[#0c0d0e] z-10">
                  <h3 className="text-lg font-bold tracking-widest text-white uppercase mb-1 flex items-center justify-between">
                    {region.name}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 mb-4">
                    {region.description}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-white/5 flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                    <span className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-neutral-400" />
                      {region.environment.baseWindSpeedMs} m/s
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-neutral-400" />
                      {region.environment.airTemperatureC}°C
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[#08090a] via-[#08090a]/95 to-transparent z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pointer-events-auto">
          
          <Button
            onClick={handleBack}
            className="inline-flex items-center justify-center gap-3 bg-transparent hover:bg-white/5 border border-neutral-700 text-white rounded-[4px] px-8 h-[52px] text-xs font-bold tracking-widest uppercase transition-all duration-300 w-full sm:w-auto"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            BACK TO CONFIGURATION
          </Button>
          
          <Button
            onClick={handleEnterSimulation}
            disabled={!selectedRegionId}
            className="inline-flex items-center justify-center gap-3 bg-[#FF5500] hover:bg-[#ff6a1a] hover:brightness-105 active:scale-[0.98] hover:-translate-y-[1px] shadow-[0_4px_14px_0_rgba(255,85,0,0.2)] hover:shadow-[0_6px_20px_rgba(255,85,0,0.3)] text-white rounded-[4px] px-10 h-[52px] text-xs font-extrabold tracking-widest uppercase transition-all duration-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            ENTER SIMULATOR
            <ArrowRight className="w-[18px] h-[18px]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
