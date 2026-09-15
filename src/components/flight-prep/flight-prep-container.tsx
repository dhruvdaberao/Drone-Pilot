"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DroneModel } from "@/types/drone";
import { DRONES, getDroneById, DEFAULT_DRONE_STORAGE_KEY } from "@/lib/drones";
import { RegionId, RegionDefinition, Helipad } from "@/lib/world/world-types";
import { REGIONS, REGION_LIST } from "@/lib/world/region-definitions";
import { HELIPADS, HELIPAD_LIST } from "@/lib/world/helipad-definitions";
import { WeatherPreset } from "@/lib/simulation/types";
import { WorldMapSelector } from "./world-map-selector";
import { RegionCardGrid } from "./region-card-grid";
import { RegionPreviewPanel } from "./region-preview-panel";
import { HelipadSelector } from "./helipad-selector";
import { FlightConfigSummary } from "./flight-config-summary";
import { LaunchCountdownModal } from "./launch-countdown-modal";
import { Plane, Compass, ArrowLeft } from "lucide-react";

export function FlightPrepContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Resolve initial Aircraft
  const [selectedDrone, setSelectedDrone] = useState<DroneModel>(DRONES[0]);

  // 2. Resolve initial Region & Helipad from URL or defaults
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>("training");
  const [selectedHelipadId, setSelectedHelipadId] = useState<string>("training-alpha");

  // 3. Payload & Weather Configuration
  const [payloadKg, setPayloadKg] = useState<number>(0.0);
  const [weatherPreset, setWeatherPreset] = useState<WeatherPreset>("normal");

  // 4. Launch state
  const [isLaunching, setIsLaunching] = useState(false);

  // Initialize state from URL and localStorage
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

      // Check requested region
      const urlRegion = searchParams.get("region");
      if (urlRegion && REGIONS[urlRegion]) {
        setSelectedRegionId(urlRegion as RegionId);
      }

      // Check requested helipad
      const urlHelipad = searchParams.get("helipad") || searchParams.get("spawn");
      if (urlHelipad && HELIPADS[urlHelipad]) {
        setSelectedHelipadId(urlHelipad);
        setSelectedRegionId(HELIPADS[urlHelipad].regionId);
      } else if (urlRegion && REGIONS[urlRegion]) {
        setSelectedHelipadId(REGIONS[urlRegion].primaryHelipadId);
      }

      // Check requested payload
      const urlPayload = parseFloat(searchParams.get("payload") || "0");
      if (!isNaN(urlPayload) && urlPayload >= 0) {
        setPayloadKg(urlPayload);
      }

      // Check requested weather
      const urlWeather = searchParams.get("weather") as WeatherPreset;
      if (urlWeather) {
        setWeatherPreset(urlWeather);
      }
    } catch {
      // Fallback
    }
  }, [searchParams]);

  // Sync URL search params when selection changes
  const updateUrlParams = useCallback(
    (newRegionId: RegionId, newHelipadId: string) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      params.set("region", newRegionId);
      params.set("helipad", newHelipadId);
      if (selectedDrone) params.set("drone", selectedDrone.id);
      if (searchParams.get("mock") === "true") params.set("mock", "true");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    },
    [selectedDrone, searchParams]
  );

  // Handlers
  const handleSelectRegion = useCallback(
    (regionId: RegionId) => {
      setSelectedRegionId(regionId);
      const region = REGIONS[regionId];
      if (region && region.primaryHelipadId) {
        setSelectedHelipadId(region.primaryHelipadId);
        updateUrlParams(regionId, region.primaryHelipadId);
      } else {
        updateUrlParams(regionId, selectedHelipadId);
      }
    },
    [selectedHelipadId, updateUrlParams]
  );

  const handleSelectHelipad = useCallback(
    (helipadId: string) => {
      setSelectedHelipadId(helipadId);
      const helipad = HELIPADS[helipadId];
      if (helipad) {
        setSelectedRegionId(helipad.regionId);
        updateUrlParams(helipad.regionId, helipadId);
      }
    },
    [updateUrlParams]
  );

  const handleResetToAcademy = useCallback(() => {
    setSelectedRegionId("training");
    setSelectedHelipadId("training-alpha");
    setPayloadKg(0.0);
    setWeatherPreset("normal");
    updateUrlParams("training", "training-alpha");
  }, [updateUrlParams]);

  const handleStartFlight = useCallback(() => {
    setIsLaunching(true);
  }, []);

  const handleLaunchComplete = useCallback(() => {
    const isMock = searchParams.get("mock") === "true";
    router.push(
      `/fly?region=${selectedRegionId}&helipad=${selectedHelipadId}&drone=${selectedDrone.id}&payload=${payloadKg}&weather=${weatherPreset}&launch=true${
        isMock ? "&mock=true" : ""
      }`
    );
  }, [router, selectedRegionId, selectedHelipadId, selectedDrone, payloadKg, weatherPreset, searchParams]);

  const activeRegion = REGIONS[selectedRegionId] || REGIONS["training"];
  const activeHelipad = HELIPADS[selectedHelipadId] || HELIPADS["training-alpha"];
  const availableHelipadsForRegion = useMemo(() => {
    return HELIPAD_LIST.filter((h) => h.regionId === selectedRegionId);
  }, [selectedRegionId]);

  return (
    <div className="relative min-h-screen w-full max-w-full flex flex-col justify-between bg-[#FAF7F2] text-neutral-900 overflow-x-hidden font-sans">
      {/* Subtle Tech Grid Accent */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12">
        {/* Breadcrumb Navigation & Platform Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:border-black transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Hangar</span>
            </button>

            <span className="text-neutral-400 font-mono text-xs">/</span>

            <span className="font-mono text-xs font-bold text-neutral-800 uppercase tracking-wider">
              FLIGHT DEPLOYMENT PREPARATION
            </span>
          </div>

          {/* Active Drone Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-black shadow-xs">
            <Plane className="h-3.5 w-3.5 text-[#FF5500]" />
            <span className="text-xs font-heading font-bold text-neutral-950 uppercase">
              {selectedDrone.name}
            </span>
            <span className="font-mono text-[10px] bg-orange-50 text-[#FF5500] px-1.5 py-0.5 rounded border border-orange-200">
              {selectedDrone.specs.rotors}R
            </span>
          </div>
        </div>

        {/* Section Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 uppercase">
            CHOOSE FLIGHT REGION & LAUNCH SITE
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600 max-w-2xl leading-relaxed">
            Select a designated sector on the tactical map to deploy your aircraft. Review terrain elevation, meteorological conditions, and precision helipads before takeoff.
          </p>
        </div>

        {/* Responsive Grid: Map + Briefing Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Map (Desktop 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <WorldMapSelector
              selectedRegionId={selectedRegionId}
              selectedHelipadId={selectedHelipadId}
              onSelectRegion={handleSelectRegion}
              onSelectHelipad={handleSelectHelipad}
            />

            {/* Region Card Grid Below Map */}
            <RegionCardGrid
              selectedRegionId={selectedRegionId}
              onSelectRegion={handleSelectRegion}
            />
          </div>

          {/* Right Column: Manifest, Helipads & Region Preview (Desktop 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Flight Configuration Manifest & START FLIGHT CTA */}
            <FlightConfigSummary
              selectedDrone={selectedDrone}
              selectedRegion={activeRegion}
              selectedHelipad={activeHelipad}
              payloadKg={payloadKg}
              onChangePayload={setPayloadKg}
              weatherPreset={weatherPreset}
              onChangeWeather={setWeatherPreset}
              onStartFlight={handleStartFlight}
              onChangeAircraft={() => router.push("/dashboard")}
              onResetToAcademy={handleResetToAcademy}
            />

            {/* 2. Region Preview Panel (Weather & Elevation) */}
            <RegionPreviewPanel
              region={activeRegion}
              availableHelipads={availableHelipadsForRegion}
              onSelectHelipad={handleSelectHelipad}
              selectedHelipadId={selectedHelipadId}
            />

            {/* 3. Helipad Launch Site Selector */}
            <HelipadSelector
              selectedRegionId={selectedRegionId}
              selectedHelipadId={selectedHelipadId}
              onSelectHelipad={handleSelectHelipad}
            />
          </div>
        </div>
      </main>

      {/* Launch Countdown Pre-Flight Checklist Modal */}
      <LaunchCountdownModal
        isOpen={isLaunching}
        drone={selectedDrone}
        region={activeRegion}
        helipad={activeHelipad}
        onComplete={handleLaunchComplete}
      />
    </div>
  );
}
