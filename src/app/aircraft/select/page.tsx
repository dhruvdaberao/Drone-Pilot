"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DRONES, getDroneById } from "@/lib/drones";
import { DroneModel } from "@/types/drone";
import { Button } from "@/components/ui/button";
import { Info, Check, ArrowRight, X } from "lucide-react";

// Platform Categories
const PLATFORMS = ["All", "Multirotor"];
const PLATFORM_INFO: Record<string, { title: string; desc: string; pros: string; cons: string }> = {
  Multirotor: {
    title: "MULTIROTOR",
    desc: "Aircraft supported by multiple rotors. Common configurations include Quadcopters, Hexacopters, and Octacopters.",
    pros: "VTOL capability, stable hover, high maneuverability.",
    cons: "Higher energy consumption, lower endurance, payload constraints compared to fixed-wing.",
  },
};

// Mission Categories
const MISSIONS = ["All", "Training", "Agriculture", "Inspection", "Mapping", "Delivery", "Emergency"];

export default function AircraftSelectionPage() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [selectedMission, setSelectedMission] = useState("All");
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
  const [infoModalDrone, setInfoModalDrone] = useState<DroneModel | null>(null);

  const filteredDrones = useMemo(() => {
    return DRONES.filter((drone) => {
      const platformMatch = selectedPlatform === "All" || drone.platformCategory === selectedPlatform;
      const missionMatch = selectedMission === "All" || drone.missionCategory === selectedMission;
      return platformMatch && missionMatch;
    });
  }, [selectedPlatform, selectedMission]);

  const handleContinue = () => {
    if (selectedDroneId) {
      router.push(`/configure?preset=${selectedDroneId}`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full flex flex-col bg-white text-neutral-900 font-sans">
        <DashboardHeader />

        {/* Step Indicator */}
        <div className="w-full border-b border-neutral-100 bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4 sm:gap-8 overflow-x-auto scrollbar-none text-[11px] font-bold tracking-widest text-neutral-400">
            <span className="text-[#FF5500] shrink-0">01 AIRCRAFT</span>
            <span className="shrink-0 text-neutral-300">/</span>
            <span className="shrink-0">02 CONFIGURE</span>
            <span className="shrink-0 text-neutral-300">/</span>
            <span className="shrink-0">03 ENVIRONMENT</span>
            <span className="shrink-0 text-neutral-300">/</span>
            <span className="shrink-0">04 PREFLIGHT</span>
            <span className="shrink-0 text-neutral-300">/</span>
            <span className="shrink-0">05 FLIGHT</span>
          </div>
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 lg:py-16 flex flex-col lg:flex-row gap-12">
          
          {/* Left Sidebar: Filters */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-10">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 mb-2">
                SELECT YOUR AIRCRAFT
              </h1>
              <p className="text-neutral-500 text-sm">
                Choose the aircraft platform you want to simulate.
              </p>
            </div>

            {/* Platform Filter */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">AIRCRAFT PLATFORM</h3>
              <div className="flex flex-col gap-1">
                {PLATFORMS.map((plat) => (
                  <button
                    key={plat}
                    onClick={() => setSelectedPlatform(plat)}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPlatform === plat
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>
              
              {/* Platform Education */}
              {selectedPlatform !== "All" && PLATFORM_INFO[selectedPlatform] && (
                <div className="mt-4 p-4 bg-[#FAF7F2] rounded-xl border border-neutral-100 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-[11px] font-bold tracking-widest uppercase mb-2">{PLATFORM_INFO[selectedPlatform].title}</h4>
                  <p className="text-xs text-neutral-600 mb-3">{PLATFORM_INFO[selectedPlatform].desc}</p>
                  <div className="text-xs space-y-2">
                    <p><strong className="text-neutral-900 font-semibold block mb-0.5">Advantages:</strong> <span className="text-neutral-600">{PLATFORM_INFO[selectedPlatform].pros}</span></p>
                    <p><strong className="text-neutral-900 font-semibold block mb-0.5">Trade-offs:</strong> <span className="text-neutral-600">{PLATFORM_INFO[selectedPlatform].cons}</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Mission Filter */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">MISSION</h3>
              <div className="flex flex-col gap-1">
                {MISSIONS.map((mission) => (
                  <button
                    key={mission}
                    onClick={() => setSelectedMission(mission)}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedMission === mission
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    {mission}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content: Grid & Actions */}
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDrones.map((drone) => {
                const isSelected = selectedDroneId === drone.id;
                return (
                  <div
                    key={drone.id}
                    onClick={() => setSelectedDroneId(drone.id)}
                    className={`relative group cursor-pointer rounded-2xl border transition-all duration-200 p-5 flex flex-col bg-white ${
                      isSelected
                        ? "border-[#FF5500] shadow-[0_8px_30px_rgba(255,85,0,0.12)] -translate-y-1"
                        : "border-neutral-200 hover:border-neutral-300 hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute top-4 left-4 w-6 h-6 bg-[#FF5500] rounded-full flex items-center justify-center animate-in zoom-in-50 z-10">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                    
                    {/* Info Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoModalDrone(drone);
                      }}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors border border-neutral-100 z-10"
                      aria-label={`View info for ${drone.name}`}
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    {/* Image */}
                    <div className="w-full h-40 relative flex items-center justify-center mb-6">
                      <Image
                        src={drone.image}
                        alt={drone.name}
                        width={200}
                        height={200}
                        className="object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    </div>

                    {/* Info */}
                    <div className="mt-auto">
                      <h3 className="text-lg font-bold text-neutral-900 mb-1">{drone.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                          {drone.platformCategory}
                        </span>
                        <span className="text-neutral-300 text-xs">•</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF5500]">
                          {drone.missionCategory}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredDrones.length === 0 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                  <p className="text-neutral-500 font-medium">No aircraft match your selected filters.</p>
                  <button onClick={() => { setSelectedPlatform("All"); setSelectedMission("All"); }} className="mt-4 text-sm text-[#FF5500] hover:underline font-semibold">
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Floating Action Area */}
            <div className={`mt-12 sticky bottom-6 bg-white/80 backdrop-blur-xl border border-neutral-200 p-4 rounded-2xl shadow-2xl flex items-center justify-between transition-all duration-300 ${
              selectedDroneId ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
            }`}>
              <div className="flex items-center gap-4 px-4">
                <span className="text-sm font-semibold text-neutral-900">
                  {selectedDroneId ? getDroneById(selectedDroneId)?.name : ""} selected
                </span>
              </div>
              <Button
                onClick={handleContinue}
                className="bg-[#FF5500] hover:bg-neutral-900 text-white px-8 py-6 rounded-xl font-bold tracking-widest uppercase text-xs transition-all"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Info Modal */}
      {infoModalDrone && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setInfoModalDrone(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-full animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setInfoModalDrone(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Image Section */}
            <div className="w-full md:w-1/2 bg-[#FAF7F2] p-12 flex flex-col items-center justify-center border-r border-neutral-100 relative">
              <div className="w-full max-w-sm aspect-square relative flex items-center justify-center">
                <Image
                  src={infoModalDrone.image}
                  alt={infoModalDrone.name}
                  fill
                  className="object-contain drop-shadow-2xl"
                  unoptimized
                />
              </div>
              
              <div className="absolute bottom-12 left-12">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
                  {infoModalDrone.platformCategory}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#FF5500]">
                  {infoModalDrone.missionCategory}
                </p>
              </div>
            </div>

            {/* Right Information Section */}
            <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
              <h2 className="text-3xl font-extrabold text-neutral-900 mb-2">{infoModalDrone.name}</h2>
              <p className="text-lg text-neutral-500 mb-10">{infoModalDrone.description}</p>

              <div className="space-y-10">
                {/* Why This Aircraft */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 border-b border-neutral-100 pb-2">Why This Aircraft?</h3>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {infoModalDrone.whyThisAircraft}
                  </p>
                </div>

                {/* Key Data Grid */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 border-b border-neutral-100 pb-2">Key Specifications</h3>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Mass</p>
                      <p className="text-lg font-semibold text-neutral-900">{infoModalDrone.baseMassKg.toFixed(2)} kg</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Motors</p>
                      <p className="text-lg font-semibold text-neutral-900">{infoModalDrone.specs.rotors}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Battery</p>
                      <p className="text-lg font-semibold text-neutral-900">{infoModalDrone.batteryCells}S LiPo</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Payload</p>
                      <p className="text-lg font-semibold text-neutral-900">{infoModalDrone.defaultPayloadKg > 0 ? `${infoModalDrone.defaultPayloadKg.toFixed(1)} kg capacity` : "None default"}</p>
                    </div>
                  </div>
                </div>

                {/* Sensors */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 border-b border-neutral-100 pb-2">Integrated Sensors</h3>
                  <div className="flex flex-wrap gap-2">
                    {infoModalDrone.sensors.map(sensor => (
                      <span key={sensor} className="px-3 py-1.5 bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-700">
                        {sensor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <Button
                  onClick={() => {
                    setSelectedDroneId(infoModalDrone.id);
                    setInfoModalDrone(null);
                  }}
                  className="w-full bg-neutral-900 hover:bg-[#FF5500] text-white py-6 rounded-xl font-bold tracking-widest uppercase text-xs transition-all"
                >
                  Select This Aircraft
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
