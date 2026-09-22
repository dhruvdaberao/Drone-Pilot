"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DroneDigitalTwinConfiguration, DigitalTwinValidationResult } from "@/types/drone-digital-twin";
import { 
  getActiveDigitalTwin, 
  setActiveDigitalTwin, 
  saveUserConfiguration, 
  duplicateConfiguration 
} from "@/lib/digital-twin/digital-twin-storage";
import { validateDroneDigitalTwin } from "@/lib/digital-twin/digital-twin-validator";
import { DRONES, getDroneById } from "@/lib/drones";
import { Drone3DViewer } from "@/components/dashboard/drone-3d-viewer";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, ArrowRight, Save, Info, Settings, Settings2, Download } from "lucide-react";

// Import existing form sections
import { ConfigAirframeTab } from "./tabs/config-airframe-tab";
import { ConfigPropulsionTab } from "./tabs/config-propulsion-tab";
import { ConfigBatteryTab } from "./tabs/config-battery-tab";
import { ConfigAvionicsTab } from "./tabs/config-avionics-tab";
import { ConfigPayloadTab } from "./tabs/config-payload-tab";
import { ConfigPerformanceTab } from "./tabs/config-performance-tab";

// Simple Accordion Component
const Accordion = ({ 
  title, 
  children, 
  defaultExpanded = false 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultExpanded?: boolean 
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="border-b border-neutral-200 last:border-0">
      <button 
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-5 px-6 hover:bg-neutral-50 transition-colors"
      >
        <span className="text-sm font-bold tracking-widest uppercase text-neutral-900">{title}</span>
        {expanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
      </button>
      {expanded && (
        <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

export function DigitalTwinConfigurator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<DroneDigitalTwinConfiguration | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [showTechnicalManifest, setShowTechnicalManifest] = useState(false);

  useEffect(() => {
    const presetId = searchParams?.get("preset");
    if (presetId) {
      // Create a new config from a preset
      const presetDrone = getDroneById(presetId);
      if (presetDrone) {
        // Build a baseline digital twin config for a new drone based on preset
        const newConfig: DroneDigitalTwinConfiguration = {
          identity: {
            id: crypto.randomUUID(),
            name: `${presetDrone.name} (Custom)`,
            category: presetDrone.platformId,
            manufacturer: "Drone Pilot Lab",
            isPreset: false,
            version: "1.0.0",
          },
          metadata: {
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            author: "User",
          },
          massProperties: {
            dryMassKg: presetDrone.baseMassKg,
            totalMassKg: presetDrone.baseMassKg + presetDrone.defaultPayloadKg,
            centerOfGravity: [0, 0, 0],
            momentsOfInertia: [0.05, 0.05, 0.1],
          },
          aerodynamics: {
            dragCoefficient: 0.8,
            frontalAreaM2: 0.05,
            topAreaM2: 0.15,
          },
          propulsion: {
            motorCount: presetDrone.specs.rotors,
            motorKv: 900,
            maxRpm: 12000,
            propellerDiameterInches: 10,
            propellerPitchInches: 4.5,
          },
          battery: {
            capacityMah: 5000,
            cellCount: presetDrone.batteryCells,
            voltageNominal: presetDrone.batteryCells * 3.7,
            voltageMax: presetDrone.batteryCells * 4.2,
            maxDischargeRateC: 50,
          },
          avionics: {
            flightControllerType: "PX4",
            imuCount: 2,
            hasGps: presetDrone.sensors.includes("GPS") || presetDrone.sensors.includes("RTK GPS"),
            hasRtk: presetDrone.sensors.includes("RTK GPS"),
            hasObstacleAvoidance: presetDrone.sensors.includes("Stereo Vision"),
            telemetryRangeKm: 5,
          },
          payload: {
            capacityKg: presetDrone.defaultPayloadKg,
            currentPayloadKg: 0,
            type: "None",
          },
        };
        setConfig(newConfig);
      }
    } else {
      // Edit an existing config
      const active = getActiveDigitalTwin();
      setConfig(active);
    }
  }, [searchParams]);

  const validationResult: DigitalTwinValidationResult = useMemo(() => {
    if (!config) return { valid: false, errors: [], warnings: [], infos: [] };
    return validateDroneDigitalTwin(config);
  }, [config]);

  const handleConfigChange = useCallback((updated: DroneDigitalTwinConfiguration) => {
    setConfig(updated);
  }, []);

  const handleSave = useCallback(async () => {
    if (!config) return;
    const toSave = {
      ...config,
      metadata: { ...config.metadata, lastModified: new Date().toISOString() }
    };
    await saveUserConfiguration(toSave);
    setActiveDigitalTwin(toSave);
    setSaveFeedback("✓ Aircraft saved");
    setTimeout(() => setSaveFeedback(null), 3000);
  }, [config]);

  const handleContinue = () => {
    if (!config) return;
    setActiveDigitalTwin(config);
    router.push(`/fly/select?drone=${config.identity.category}&dt=${config.identity.id}`);
  };

  if (!config) return null;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[85vh] bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden mt-6 relative">
      
      {/* Save Notification Overlay */}
      {saveFeedback && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg font-bold text-xs uppercase tracking-widest animate-in slide-in-from-top-4 fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {saveFeedback}
        </div>
      )}

      {/* Left: 3D Preview (Sticky on desktop) */}
      <div className="w-full lg:w-[45%] xl:w-1/2 bg-[#FAF7F2] border-r border-neutral-200 relative flex flex-col">
        <div className="absolute top-6 left-6 z-20">
          <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">{config.identity.name}</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF5500] mt-1">{config.identity.category}</p>
        </div>
        
        <div className="flex-1 min-h-[400px] lg:min-h-0 relative">
          <Drone3DViewer 
            type={config.identity.category as any}
            autoRotate={true}
            interactive={true}
            isSelected={true}
            className="w-full h-full"
          />
        </div>

        {/* Essential High-Level Specs Panel (Bottom of 3D view) */}
        <div className="p-6 bg-white/60 backdrop-blur-md border-t border-neutral-200 z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
           <div>
             <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Total Mass</span>
             <span className="text-lg font-bold text-neutral-900">{config.massProperties.totalMassKg.toFixed(2)} kg</span>
           </div>
           <div>
             <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Battery</span>
             <span className="text-lg font-bold text-neutral-900">{config.battery.cellCount}S</span>
           </div>
           <div>
             <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Motors</span>
             <span className="text-lg font-bold text-neutral-900">{config.propulsion.motorCount}</span>
           </div>
           <div>
             <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Payload</span>
             <span className="text-lg font-bold text-neutral-900">{config.payload.capacityKg} kg</span>
           </div>
        </div>
      </div>

      {/* Right: Progressive Configuration Accordion */}
      <div className="w-full lg:w-[55%] xl:w-1/2 flex flex-col bg-white h-[85vh] overflow-hidden">
        
        {/* Header / Actions */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <Settings2 className="w-5 h-5 text-[#FF5500]" />
             <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Configure Aircraft</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSave} 
              variant="outline" 
              className="border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg text-xs font-semibold tracking-wider uppercase h-10 px-4"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button 
              onClick={handleContinue}
              className="bg-[#FF5500] hover:bg-neutral-900 text-white rounded-lg text-xs font-bold tracking-widest uppercase h-10 px-6 shadow-md transition-all"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Validation Warning Inline */}
        {!validationResult.valid && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-start gap-3 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">⚠ Configuration Warning</p>
              <p className="text-xs text-amber-800 mt-1">{validationResult.errors[0]?.message || "Please review configuration parameters."}</p>
            </div>
          </div>
        )}

        {/* Scrollable Accordions */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200">
          {!showTechnicalManifest ? (
            <div className="divide-y divide-neutral-100">
              <Accordion title="Airframe & Mass" defaultExpanded={true}>
                <ConfigAirframeTab config={config} onChange={handleConfigChange} />
              </Accordion>
              <Accordion title="Propulsion">
                <ConfigPropulsionTab config={config} onChange={handleConfigChange} />
              </Accordion>
              <Accordion title="Battery System">
                <ConfigBatteryTab config={config} onChange={handleConfigChange} />
              </Accordion>
              <Accordion title="Payload">
                <ConfigPayloadTab config={config} onChange={handleConfigChange} />
              </Accordion>
              <Accordion title="Sensors & Avionics">
                <ConfigAvionicsTab config={config} onChange={handleConfigChange} />
              </Accordion>
              
              {/* Performance Summary */}
              <div className="p-6 bg-[#FAF7F2]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Calculated Performance</h3>
                  <span className="text-[10px] font-mono bg-neutral-200 text-neutral-600 px-2 py-1 rounded">CALCULATED</span>
                </div>
                <ConfigPerformanceTab config={config} onChange={handleConfigChange} />
                
                <button 
                  onClick={() => setShowTechnicalManifest(true)}
                  className="mt-6 text-xs font-bold uppercase tracking-widest text-[#FF5500] hover:text-neutral-900 transition-colors flex items-center gap-1"
                >
                  View Digital Twin Manifest <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-neutral-900 text-neutral-300 min-h-full font-mono text-xs">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Digital Twin Manifest</h3>
                <button 
                  onClick={() => setShowTechnicalManifest(false)}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors"
                >
                  Close Technical View
                </button>
              </div>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
