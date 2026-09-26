"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DRONES, getDroneById } from "@/lib/drones";
import { Drone3DViewer } from "@/components/dashboard/drone-3d-viewer";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
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

        <main className="relative z-10 flex-1 w-full max-w-[1920px] mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-10 lg:py-12 min-h-0 flex flex-col lg:flex-row lg:items-center justify-between gap-y-6 lg:gap-0 overflow-y-auto lg:overflow-hidden">
          
          {/* Left Selector (Mobile: Order 4, Desktop: Order 1) */}
          <div className="order-4 lg:order-none w-full lg:w-[18%] lg:w-[20%] shrink-0 flex flex-col gap-3 lg:gap-6 z-10">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-500 pl-4 mb-2 hidden lg:block">Select Drone</h3>
            <div className="flex flex-row justify-center lg:justify-start lg:flex-col gap-2 overflow-x-auto lg:overflow-visible px-2 lg:px-0">
              {showcaseDrones.map((drone) => {
                const isActive = drone.id === selectedId;
                return (
                  <button
                    key={drone.id}
                    onClick={() => handleSelect(drone.id)}
                    className={`group shrink-0 text-left py-3 px-5 lg:px-6 rounded-lg lg:rounded-r-full transition-all duration-300 relative overflow-hidden ${
                      isActive ? "bg-[#101214] border border-[#FF5500]/20 lg:border-none" : "bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    {/* Orange Indicator (Vertical on Desktop, Hidden on mobile) */}
                    <div className={`hidden lg:block absolute left-0 top-0 bottom-0 w-[3px] bg-[#FF5500] transition-all duration-300 ${
                      isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 group-hover:opacity-50 group-hover:scale-y-100"
                    }`} />
                    
                    <span className={`block text-[14px] lg:text-[16px] font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                      isActive ? "text-white lg:translate-x-2" : "text-neutral-500 group-hover:text-neutral-300 lg:group-hover:translate-x-1"
                    }`}>
                      {drone.platformId}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center 3D Hero (Absolute full-bleed everywhere to allow drone to overlap text) */}
          <div className="absolute inset-0 z-0 flex items-center justify-center lg:-mx-4 lg:mx-0 pointer-events-none lg:pointer-events-auto">
             <div className="w-full h-full max-w-[1200px] lg:max-w-none pointer-events-auto">
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
          
          {/* Mobile Spacer (Takes up the flex space in the middle to push specs to the bottom) */}
          <div className="order-2 lg:hidden flex-1 w-full pointer-events-none min-h-[30vh]" />

          {/* Right Info Panel (Uses display: contents on mobile to let children use flex order, real column on desktop) */}
          <div className="contents lg:flex lg:flex-col lg:w-[28%] lg:w-[26%] shrink-0 text-center lg:text-left z-10">
            
            {/* Title & Platform (Mobile: Order 1, Desktop: Order 1) */}
            <div className="order-1 lg:order-none relative z-10 w-full flex flex-col items-center lg:items-start mb-2 lg:mb-8">
              <h1 className={`font-sans text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight text-white mb-1 lg:mb-2 leading-none uppercase`}>
                {activeDrone?.platformId}
              </h1>
              <p className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.25em] text-[#FF5500]">
                {activeDrone?.missionCategory} PLATFORM
              </p>
            </div>

            {/* Specifications (Mobile: Order 3, Desktop: Order 2) */}
            <div className="order-3 lg:order-none relative z-10 w-full mb-6 lg:mb-10 mt-2 lg:mt-0">
              {/* Desktop Divider */}
              <div className="w-full h-px bg-white/10 mb-8 hidden lg:block" />
              
              {activeDrone && (() => {
                const savedConfig = savedConfigs.find(c => c.identity.category === activeDrone.platformId);
                const totalMass = savedConfig ? savedConfig.massProperties.totalMassKg : activeDrone.baseMassKg;
                const payloadMass = savedConfig ? savedConfig.payload.massKg : 0;
                const battery = savedConfig ? savedConfig.battery.cellCount + "S" : activeDrone.batteryCells + "S";
                const motors = savedConfig ? savedConfig.airframe.motorCount : (activeDrone.platformId === 'quadcopter' ? 4 : activeDrone.platformId === 'hexacopter' ? 6 : 8);

                return (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:gap-x-8 lg:gap-y-8 w-full max-w-[300px] lg:max-w-none mx-auto lg:mx-0">
                    <div className="flex flex-col items-center lg:items-start">
                      <span className="block text-[28px] lg:text-[32px] font-bold text-white tracking-tight leading-none mb-1">
                        {totalMass.toFixed(2)} <span className="text-[14px] text-neutral-500 font-normal ml-0.5">kg</span>
                      </span>
                      <span className="block text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500">Total Mass</span>
                    </div>
                    <div className="flex flex-col items-center lg:items-start">
                      <span className="block text-[28px] lg:text-[32px] font-bold text-white tracking-tight leading-none mb-1">
                        {motors} <span className="text-[14px] text-neutral-500 font-normal ml-1">MOTORS</span>
                      </span>
                      <span className="block text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500">Propulsion</span>
                    </div>
                    <div className="flex flex-col items-center lg:items-start">
                      <span className="block text-[28px] lg:text-[32px] font-bold text-white tracking-tight leading-none mb-1">
                        {payloadMass.toFixed(2)} <span className="text-[14px] text-neutral-500 font-normal ml-0.5">kg</span>
                      </span>
                      <span className="block text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500">Payload</span>
                    </div>
                    <div className="flex flex-col items-center lg:items-start">
                      <span className="block text-[28px] lg:text-[32px] font-bold text-white tracking-tight leading-none mb-1">
                        {battery}
                      </span>
                      <span className="block text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500">Battery</span>
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-2 text-[10px] lg:text-[11px] font-bold tracking-[0.1em] text-neutral-400 mt-8 lg:mt-12 w-full uppercase">
                <span>GPS HOLD</span>
                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                <span>RTK GNSS</span>
                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                <span>{activeDrone?.batteryCells}S</span>
              </div>
            </div>

            {/* Configure Button (Mobile: Order 5, Desktop: Order 3) */}
            <div className="order-5 lg:order-none relative z-10 w-full flex justify-center lg:justify-start px-2 lg:px-0 mt-auto lg:mt-0 pb-12 lg:pb-0">
              <Button 
                onClick={handleConfigure}
                variant="primary"
                className="w-full max-w-[280px] lg:max-w-none lg:w-[240px] h-[52px] lg:h-[56px] text-[14px] font-bold flex items-center justify-center gap-[10px]"
                leftIcon={<Settings2 className="w-[18px] h-[18px]" />}
              >
                CONFIGURE AIRCRAFT
              </Button>
            </div>

          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
