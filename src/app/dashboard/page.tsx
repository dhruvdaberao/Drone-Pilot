"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DRONES, getDroneById } from "@/lib/drones";
import { Drone3DViewer } from "@/components/dashboard/drone-3d-viewer";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["700", "500"] });

import { useAuth } from "@/context/auth-context";

export default function AircraftHangarPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("aero-trainer-x4");

  const { user } = useAuth();
  
  // Load last selected drone category
  React.useEffect(() => {
    import("@/lib/digital-twin/digital-twin-storage").then((mod) => {
      mod.getLastSelectedDrone(user?.uid || null).then((cat) => {
        // Map category back to DRONES showcase ID
        const matchingDrone = DRONES.find(d => d.platformId === cat);
        if (matchingDrone) {
          setSelectedId(matchingDrone.id);
        }
      });
    });
  }, [user]);

  const [savedConfigs, setSavedConfigs] = useState<import("@/types/drone-digital-twin").DroneDigitalTwinConfiguration[]>([]);
  
  React.useEffect(() => {
    import("@/lib/digital-twin/digital-twin-storage").then((mod) => {
      mod.listUserConfigurations(user?.uid || null).then((res) => {
        setSavedConfigs(res);
      });
    });
  }, [user]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const drone = DRONES.find(d => d.id === id);
    if (drone) {
      import("@/lib/digital-twin/digital-twin-storage").then((mod) => {
        mod.setLastSelectedDrone(user?.uid || null, drone.platformId as import("@/types/drone-digital-twin").DroneCategory);
      });
    }
  };

  // Filter one main platform of each type for the selection list
  const showcaseDrones = useMemo(() => {
    const quad = DRONES.find((d) => d.platformId === "quadcopter");
    const hexa = DRONES.find((d) => d.platformId === "hexacopter");
    const octa = DRONES.find((d) => d.platformId === "octacopter");
    return [quad, hexa, octa].filter(Boolean) as typeof DRONES;
  }, []);

  const activeDrone = useMemo(() => getDroneById(selectedId), [selectedId]);

  const handleConfigure = () => {
    if (activeDrone) {
      router.push(`/configure?drone=${activeDrone.platformId}`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative h-screen w-full flex flex-col bg-[#08090a] text-white overflow-hidden font-sans selection:bg-[#FF5500] selection:text-white">
        
        {/* Deep Graphite Ambient Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#181a1f] via-[#08090a] to-[#040405] opacity-90" />
        </div>

        <div className="relative z-20">
          <DashboardHeader />
        </div>

        <main className="relative z-10 flex-1 w-full flex flex-col landscape:flex-row items-center justify-between px-4 sm:px-8 xl:px-24 py-4 md:py-8 min-h-0 safe-area-pb">
          
          {/* Left: Refined Navigator */}
          <div className="w-full landscape:w-48 md:w-64 shrink-0 flex flex-row landscape:flex-col gap-2 md:gap-8 z-10 animate-in slide-in-from-left-8 fade-in duration-700 delay-300 mt-16 landscape:mt-0 overflow-x-auto landscape:overflow-visible">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-500 pl-4 hidden landscape:block">Select Drone</h3>
            <div className="flex flex-row landscape:flex-col gap-2">
              {showcaseDrones.map((drone) => {
                const isActive = drone.id === selectedId;
                return (
                  <button
                    key={drone.id}
                    onClick={() => handleSelect(drone.id)}
                    className={`group text-left py-3 landscape:py-4 px-4 rounded-lg landscape:rounded-r-full transition-all duration-300 relative overflow-hidden whitespace-nowrap landscape:whitespace-normal ${
                      isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Minimal Orange Indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-[#FF5500] transition-all duration-300 ${
                      isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 group-hover:opacity-50 group-hover:scale-y-100"
                    }`} />
                    
                    <span className={`block text-xs md:text-base font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
                      isActive ? "text-white landscape:translate-x-4" : "text-neutral-500 group-hover:text-neutral-300 landscape:group-hover:translate-x-2"
                    }`}>
                      {drone.platformId}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center 3D Hero */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pt-24 landscape:pt-10 pointer-events-none">
             <div className="w-full h-full max-w-[1200px] max-h-[800px] pointer-events-auto">
               {activeDrone && (
                 <Drone3DViewer 
                   type={activeDrone.platformId}
                   interactive={true}
                   autoRotate={true}
                   isSelected={true}
                 />
               )}
             </div>
          </div>

          {/* Right: Premium Information Block */}
          <div className="w-full landscape:w-72 md:w-80 xl:w-96 shrink-0 flex flex-col items-center landscape:items-end text-center landscape:text-right z-10 mt-auto landscape:mt-0 mb-4 landscape:mb-0">
            
            {/* Massive Title Block */}
            <div className="mb-4 md:mb-12">
              <h1 className={`${spaceGrotesk.className} text-3xl landscape:text-4xl md:text-6xl xl:text-7xl font-extrabold tracking-tighter text-white mb-1 md:mb-2 leading-none`}>
                {activeDrone?.platformId.toUpperCase()}
              </h1>
              <p className="text-[9px] md:text-xs font-bold uppercase tracking-[0.4em] text-[#FF5500]/90">
                {activeDrone?.missionCategory} PLATFORM
              </p>
            </div>

            {/* Horizontal Divider */}
            <div className="w-full h-px bg-white/10 mb-4 md:mb-8 hidden landscape:block" />

            {/* High-Value Primary Stats */}
            {activeDrone && (() => {
              const savedConfig = savedConfigs.find(c => c.identity.id === activeDrone.id);
              const totalMass = savedConfig ? savedConfig.massProperties.totalMassKg : activeDrone.baseMassKg;
              const payloadMass = savedConfig ? savedConfig.payload.massKg : 0;
              const battery = savedConfig ? savedConfig.battery.cellCount + "S" : activeDrone.batteryCells + "S";
              const motors = savedConfig ? savedConfig.airframe.motorCount : (activeDrone.platformId === 'quadcopter' ? 4 : activeDrone.platformId === 'hexacopter' ? 6 : 8);

              return (
                <div className="flex landscape:flex-col items-center gap-4 landscape:gap-4 md:gap-8 mb-4 landscape:mb-6 w-full justify-center landscape:justify-end">
                  <div className="flex flex-col items-center landscape:items-end">
                    <span className="block text-xl landscape:text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {totalMass.toFixed(2)} <span className="text-xs md:text-sm text-neutral-500 font-normal ml-0.5">kg</span>
                    </span>
                    <span className="block text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 mt-0.5 md:mt-1">Total Mass</span>
                  </div>
                  <div className="flex flex-col items-center landscape:items-end">
                    <span className="block text-xl landscape:text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {motors} <span className="text-xs md:text-sm text-neutral-500 font-normal ml-1.5">× MOTOR</span>
                    </span>
                    <span className="block text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 mt-0.5 md:mt-1">Propulsion</span>
                  </div>
                  <div className="flex flex-col items-center landscape:items-end">
                    <span className="block text-xl landscape:text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {payloadMass.toFixed(2)} <span className="text-xs md:text-sm text-neutral-500 font-normal ml-0.5">kg</span>
                    </span>
                    <span className="block text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF5500] mt-0.5 md:mt-1">Payload Mass</span>
                  </div>
                </div>
              );
            })()}

            {/* Secondary Badges Row */}
            <div className="flex flex-wrap items-center justify-center landscape:justify-end gap-x-3 gap-y-1 text-[9px] md:text-[10px] font-bold tracking-wider text-neutral-400 mb-6 md:mb-12">
              <span>GPS HOLD</span>
              <span className="w-1 h-1 rounded-full bg-neutral-700" />
              <span>RTK GNSS</span>
              <span className="w-1 h-1 rounded-full bg-neutral-700" />
              <span>{activeDrone?.batteryCells}S</span>
            </div>

            {/* Premium Configure CTA */}
            <Button 
              onClick={handleConfigure}
              variant="primary"
              size="md"
              className="w-full landscape:w-auto mt-2 px-6 md:px-10 landscape:min-w-[200px]"
              leftIcon={<Settings2 className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-500" />}
            >
              CONFIGURE AIRCRAFT
            </Button>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
