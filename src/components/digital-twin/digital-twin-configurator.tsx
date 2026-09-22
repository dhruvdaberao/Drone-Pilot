"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DroneDigitalTwinConfiguration,
  DigitalTwinValidationResult,
} from "@/types/drone-digital-twin";
import {
  getActiveDigitalTwin,
  setActiveDigitalTwin,
  saveUserConfiguration,
  duplicateConfiguration,
} from "@/lib/digital-twin/digital-twin-storage";
import { validateDroneDigitalTwin } from "@/lib/digital-twin/digital-twin-validator";
import { PresetSelector } from "./preset-selector";
import { ConfigSummaryCard } from "./config-summary-card";
import { ConfigIdentityTab } from "./tabs/config-identity-tab";
import { ConfigAirframeTab } from "./tabs/config-airframe-tab";
import { ConfigPropulsionTab } from "./tabs/config-propulsion-tab";
import { ConfigBatteryTab } from "./tabs/config-battery-tab";
import { ConfigAvionicsTab } from "./tabs/config-avionics-tab";
import { ConfigPayloadTab } from "./tabs/config-payload-tab";
import { ConfigPerformanceTab } from "./tabs/config-performance-tab";
import {
  Plane,
  Box,
  RotateCw,
  Battery,
  Cpu,
  Package,
  Gauge,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

type TabId =
  | "identity"
  | "airframe"
  | "propulsion"
  | "battery"
  | "avionics"
  | "payload"
  | "performance";

interface TabDefinition {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: TabDefinition[] = [
  { id: "identity", label: "Identity", icon: Plane },
  { id: "airframe", label: "Airframe", icon: Box },
  { id: "propulsion", label: "Propulsion", icon: RotateCw },
  { id: "battery", label: "Battery", icon: Battery },
  { id: "avionics", label: "Avionics", icon: Cpu },
  { id: "payload", label: "Payload", icon: Package },
  { id: "performance", label: "Performance", icon: Gauge },
];

export function DigitalTwinConfigurator() {
  const router = useRouter();
  const [config, setConfig] = useState<DroneDigitalTwinConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("identity");
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Initialize active digital twin from storage or defaults
  useEffect(() => {
    const initial = getActiveDigitalTwin();
    setConfig(initial);
  }, []);

  // Compute live validation result on every configuration state change
  const validationResult: DigitalTwinValidationResult = useMemo(() => {
    if (!config) {
      return { valid: false, errors: [], warnings: [], infos: [] };
    }
    return validateDroneDigitalTwin(config);
  }, [config]);

  const handleConfigChange = useCallback((updated: DroneDigitalTwinConfiguration) => {
    setConfig(updated);
    setActiveDigitalTwin(updated);
  }, []);

  const handleSelectPreset = useCallback((preset: DroneDigitalTwinConfiguration) => {
    setConfig(preset);
    setActiveDigitalTwin(preset);
    setSaveFeedback(`Loaded ${preset.identity.name}`);
    setTimeout(() => setSaveFeedback(null), 3000);
  }, []);

  const handleCloneToCustom = useCallback(() => {
    if (!config) return;
    const cloned = duplicateConfiguration(config);
    setConfig(cloned);
    setActiveDigitalTwin(cloned);
    setSaveFeedback(`Created custom copy: ${cloned.identity.name}`);
    setTimeout(() => setSaveFeedback(null), 3000);
  }, [config]);

  const handleSave = useCallback(async () => {
    if (!config) return;
    await saveUserConfiguration(config);
    setSaveFeedback("Configuration saved successfully");
    setTimeout(() => setSaveFeedback(null), 3000);
  }, [config]);

  const handleEnterSimulation = useCallback(() => {
    if (!config || !validationResult.valid) return;
    setActiveDigitalTwin(config);
    // Transition to flight preparation with configured aircraft
    router.push(`/fly/select?drone=${config.identity.category}&dt=${config.identity.id}`);
  }, [config, validationResult, router]);

  if (!config) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
          INITIALIZING DIGITAL TWIN WORKSTATION...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:border-black transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Hangar Dashboard</span>
          </button>
          <span className="text-neutral-400 font-mono text-xs">/</span>
          <span className="text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider">
            AIRCRAFT DIGITAL TWIN LABORATORY
          </span>
        </div>

        {saveFeedback && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>{saveFeedback}</span>
          </div>
        )}
      </div>

      {/* Preset Selector Banner */}
      <PresetSelector
        currentConfig={config}
        onSelectPreset={handleSelectPreset}
        onCloneToCustom={handleCloneToCustom}
      />

      {/* Main Engineering Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Multi-Tab Configuration Panels (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Responsive Tab Bar */}
          <div className="bg-white rounded-2xl border border-neutral-300 p-1.5 shadow-2xs overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 min-w-max">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#FF5500]" : ""}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Content Card */}
          <div className="bg-white rounded-2xl border border-neutral-300 p-5 sm:p-6 shadow-xs">
            {activeTab === "identity" && (
              <ConfigIdentityTab config={config} onChange={handleConfigChange} />
            )}
            {activeTab === "airframe" && (
              <ConfigAirframeTab config={config} onChange={handleConfigChange} />
            )}
            {activeTab === "propulsion" && (
              <ConfigPropulsionTab config={config} onChange={handleConfigChange} />
            )}
            {activeTab === "battery" && (
              <ConfigBatteryTab config={config} onChange={handleConfigChange} />
            )}
            {activeTab === "avionics" && (
              <ConfigAvionicsTab config={config} onChange={handleConfigChange} />
            )}
            {activeTab === "payload" && (
              <ConfigPayloadTab config={config} onChange={handleConfigChange} />
            )}
            {activeTab === "performance" && (
              <ConfigPerformanceTab config={config} onChange={handleConfigChange} />
            )}
          </div>
        </div>

        {/* Right Column: Pre-Flight Manifest & Validation Card (4 cols) */}
        <div className="lg:col-span-4">
          <ConfigSummaryCard
            config={config}
            validation={validationResult}
            onEnterSimulation={handleEnterSimulation}
            onSaveConfig={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
