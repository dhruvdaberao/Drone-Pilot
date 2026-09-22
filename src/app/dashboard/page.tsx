"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { listUserConfigurations, setActiveDigitalTwin } from "@/lib/digital-twin/digital-twin-storage";
import { DroneDigitalTwinConfiguration } from "@/types/drone-digital-twin";
import { Space_Grotesk } from "next/font/google";
import { Plane, Plus, Settings, Play, Calendar, Activity } from "lucide-react";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] });

export default function DashboardPage() {
  const router = useRouter();
  const [savedConfigs, setSavedConfigs] = useState<DroneDigitalTwinConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfigs() {
      try {
        const configs = await listUserConfigurations();
        setSavedConfigs(configs.filter(c => !c.identity.isPreset)); // Only user's saved ones
      } catch (err) {
        console.error("Failed to load configs", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfigs();
  }, []);

  const handleCreateNew = () => {
    router.push("/aircraft/select");
  };

  const handleEdit = (config: DroneDigitalTwinConfiguration) => {
    setActiveDigitalTwin(config);
    router.push(`/configure?drone=${config.identity.category}`);
  };

  const handleFly = (config: DroneDigitalTwinConfiguration) => {
    setActiveDigitalTwin(config);
    router.push(`/fly/select?drone=${config.identity.category}&dt=${config.identity.id}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full flex flex-col bg-[#FAF7F2] text-neutral-900 overflow-x-hidden font-sans">
        <DashboardHeader />

        <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 lg:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className={`${spaceGrotesk.className} text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 mb-2`}>
                MY AIRCRAFT
              </h1>
              <p className="text-neutral-500 text-sm md:text-base max-w-xl">
                Manage your saved digital twin configurations. Select an aircraft to enter the simulation environment or modify its engineering parameters.
              </p>
            </div>
            <Button 
              onClick={handleCreateNew}
              className="bg-[#FF5500] hover:bg-neutral-900 text-white rounded-none px-6 py-6 font-bold tracking-widest text-xs uppercase transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Aircraft
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Activity className="w-8 h-8 animate-pulse text-neutral-300" />
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">Loading Fleet Data...</p>
            </div>
          ) : savedConfigs.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                <Plane className="w-8 h-8 text-neutral-300" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">No Aircraft Found</h3>
              <p className="text-neutral-500 text-sm max-w-sm mb-6">
                You haven't saved any digital twin configurations yet. Create your first aircraft to begin simulation.
              </p>
              <Button 
                onClick={handleCreateNew}
                variant="outline"
                className="border-neutral-300 hover:border-[#FF5500] hover:text-[#FF5500] rounded-none font-mono text-xs uppercase tracking-widest"
              >
                Create Aircraft
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedConfigs.map(config => (
                <div 
                  key={config.identity.id}
                  className="bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 shrink-0 group-hover:border-[#FF5500]/20 transition-colors">
                      <Plane className="w-6 h-6 text-neutral-400 group-hover:text-[#FF5500] transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 text-lg flex items-center gap-3">
                        {config.identity.name}
                        {config.identity.version && (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded uppercase tracking-wider">
                            v{config.identity.version}
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-neutral-500">
                        <span className="font-mono">{config.identity.category.toUpperCase()}</span>
                        <span className="text-neutral-300">•</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          Updated {new Date(config.metadata.lastModified).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <Button 
                      variant="outline"
                      onClick={() => handleEdit(config)}
                      className="flex-1 sm:flex-none border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-900 rounded-lg bg-transparent text-xs font-semibold"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleFly(config)}
                      className="flex-1 sm:flex-none bg-[#FF5500] hover:bg-[#e04a00] text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Fly
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
