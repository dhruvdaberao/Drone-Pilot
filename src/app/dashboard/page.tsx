"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ArrowRight, Settings2, PlaneTakeoff, History, GraduationCap } from "lucide-react";
import { DroneDigitalTwinConfiguration } from "@/types/drone-digital-twin";
import { listUserConfigurations, getLastSelectedDrone } from "@/lib/digital-twin/digital-twin-storage";
import { DRONES } from "@/lib/drones";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [configs, setConfigs] = useState<DroneDigitalTwinConfiguration[]>([]);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      listUserConfigurations(user.uid).then(setConfigs);
      getLastSelectedDrone(user.uid).then(setActivePlatform);
    }
  }, [user]);

  const activeConfig = useMemo(() => {
    if (!activePlatform) return null;
    return configs.find(c => c.identity.category === activePlatform) || null;
  }, [activePlatform, configs]);

  const displayName = user?.displayName || user?.email?.split('@')[0] || "Pilot";

  return (
    <ProtectedRoute>
      <div className="relative h-screen w-full flex flex-col bg-[#08090a] text-white overflow-hidden font-sans selection:bg-[#FF5500] selection:text-white">
        
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#101214] to-transparent opacity-80" />
        </div>

        <div className="relative z-20">
          <DashboardHeader />
        </div>

        <main className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto px-6 pt-16 pb-12 flex flex-col overflow-y-auto">
          
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
              COMMAND CENTER
            </h1>
            <p className="text-neutral-400 text-lg">
              Welcome back, <span className="text-white font-medium">{displayName}</span>.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Primary Action Card */}
            <div className="md:col-span-2 bg-white/[0.02] border border-white/10 p-8 flex flex-col justify-between group hover:border-[#FF5500]/30 transition-colors">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5500] mb-2">Active Aircraft</h2>
                <h3 className="text-3xl font-bold uppercase mb-4">
                  {activePlatform ? activePlatform.replace("copter", " Copter") : "No Aircraft Selected"}
                </h3>
                {activeConfig ? (
                  <div className="grid grid-cols-2 gap-4 text-sm text-neutral-400 max-w-xs mb-8">
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-neutral-500">Mass</span>
                      <span className="font-medium text-white">{activeConfig.massProperties.totalMassKg.toFixed(2)} kg</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-neutral-500">Battery</span>
                      <span className="font-medium text-white">{activeConfig.battery.cellCount}S</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-neutral-500">Payload</span>
                      <span className="font-medium text-white">{activeConfig.payload.massKg.toFixed(2)} kg</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-500 text-sm mb-8 max-w-sm">
                    Select and configure an aircraft from the Hanger before initiating a flight session.
                  </p>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => router.push(activePlatform ? "/environment" : "/hanger")}
                  className="bg-[#FF5500] hover:bg-[#ff7733] text-white px-8 py-6 rounded-none font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <PlaneTakeoff size={18} />
                  {activePlatform ? "Enter Flight" : "Go to Hanger"}
                </Button>
                
                {activePlatform && (
                  <Button 
                    onClick={() => router.push(`/configure?drone=${activePlatform}`)}
                    variant="outline" 
                    className="border-white/10 hover:bg-white/5 hover:text-white px-6 py-6 rounded-none uppercase tracking-wider text-neutral-400 flex items-center gap-2"
                  >
                    <Settings2 size={16} />
                    Configuration
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => router.push("/hanger")}
                className="flex-1 bg-white/[0.02] border border-white/10 p-6 flex flex-col justify-center items-start group hover:bg-white/[0.04] transition-colors text-left"
              >
                <Settings2 className="text-neutral-500 group-hover:text-[#FF5500] transition-colors mb-4" size={24} />
                <h3 className="text-lg font-bold uppercase tracking-wider mb-1">Hanger</h3>
                <p className="text-sm text-neutral-500">Manage Digital Twin configurations</p>
              </button>

              <button 
                onClick={() => router.push(activePlatform ? "/environment" : "/hanger")}
                className="flex-1 bg-white/[0.02] border border-white/10 p-6 flex flex-col justify-center items-start group hover:bg-white/[0.04] transition-colors text-left"
              >
                <GraduationCap className="text-neutral-500 group-hover:text-[#FF5500] transition-colors mb-4" size={24} />
                <h3 className="text-lg font-bold uppercase tracking-wider mb-1">Training</h3>
                <p className="text-sm text-neutral-500">Structured scenarios & objectives</p>
              </button>
            </div>

          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
