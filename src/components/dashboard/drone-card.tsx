"use client";

import React from "react";
import { DroneModel } from "@/types/drone";
import { cn } from "@/lib/utils";
import { Drone3DViewer } from "./drone-3d-viewer";
import { Check, ShieldCheck, Gauge, Zap, ChevronRight } from "lucide-react";

interface DroneCardProps {
  drone: DroneModel;
  isSelected: boolean;
  onSelect: (drone: DroneModel) => void;
  className?: string;
}

export function DroneCard({
  drone,
  isSelected,
  onSelect,
  className = "",
}: DroneCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(drone);
    }
  };

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={() => onSelect(drone)}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl cursor-pointer select-none transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500] focus-visible:ring-offset-2 w-full max-w-full overflow-hidden",
        // Warm Aerospace Orange Tinted Card Background (Not Pure White)
        "bg-gradient-to-b from-[#FFF6EE] via-[#FFF1E6] to-[#FFE8D6]",
        isSelected
          ? "border-2 border-[#FF5500] shadow-[0_16px_36px_-6px_rgba(255,85,0,0.28),0_4px_12px_rgba(0,0,0,0.06)] -translate-y-1 sm:-translate-y-1.5 z-10"
          : "border border-orange-200/90 shadow-[0_4px_16px_rgba(255,85,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] hover:border-orange-400 hover:shadow-[0_8px_24px_rgba(255,85,0,0.12)] hover:-translate-y-0.5",
        // Mobile compact padding when unselected vs expanded
        isSelected ? "p-3 sm:p-4.5" : "p-2.5 sm:p-4",
        className
      )}
    >
      {/* MOBILE UNSELECTED COMPACT STRIP (Takes only ~56px, zero scrolling!) */}
      {!isSelected && (
        <div className="flex sm:hidden items-center justify-between gap-2 w-full py-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100/90 text-neutral-800 border border-orange-200 shrink-0">
              {drone.badge}
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-xs font-bold text-neutral-900 uppercase truncate">
                {drone.name}
              </h3>
              <p className="text-[9.5px] font-mono font-medium text-[#FF5500] truncate">
                {drone.specs.rotors} ROTORS • {drone.specs.weightClass}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-semibold text-[#FF5500] bg-white/80 border border-orange-200/90 px-2 py-1 rounded-lg shrink-0 group-hover:bg-[#FFF2E6]">
            <span>VIEW 3D</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      )}

      {/* FULL EXPANDED CARD (Always visible on desktop/tablet, visible on mobile when selected) */}
      <div className={cn("w-full flex flex-col justify-between", !isSelected && "hidden sm:flex")}>
        {/* Top Bar: Class Badge & Selection Radio Indicator */}
        <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-[9px] sm:text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors",
                isSelected
                  ? "bg-[#FF5500] text-white border-[#FF5500]"
                  : "bg-orange-100/80 text-neutral-800 border-orange-200"
              )}
            >
              {drone.badge}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF5500]">
              {drone.specs.rotors} ROTORS
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border transition-all",
              isSelected
                ? "bg-[#FF5500] text-white border-[#FF5500] shadow-sm"
                : "bg-white/80 text-neutral-500 border-orange-200/90 group-hover:border-orange-400"
            )}
          >
            <div
              className={cn(
                "h-3 w-3 rounded-full flex items-center justify-center border",
                isSelected
                  ? "bg-white text-[#FF5500] border-white"
                  : "bg-transparent border-neutral-300"
              )}
            >
              {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
            </div>
            <span className="text-[9px] tracking-wide uppercase">
              {isSelected ? "Selected" : "Select"}
            </span>
          </div>
        </div>

        {/* Interactive 3D Drone Model Viewport */}
        <div
          className={cn(
            "relative w-full rounded-xl overflow-hidden bg-gradient-to-b from-[#FFFDF9] to-[#FFF3E8] border transition-all duration-300 my-1",
            isSelected
              ? "h-40 sm:h-48 border-orange-300 shadow-inner"
              : "h-28 sm:h-32 border-orange-200/80 group-hover:border-orange-300"
          )}
        >
          <Drone3DViewer
            type={drone.id}
            autoRotate={!isSelected}
            interactive={true}
          />

          {/* Weight Class Tag in 3D Viewport */}
          <div className="absolute top-2 left-2 pointer-events-none">
            <span
              className={cn(
                "px-2 py-0.5 rounded-md text-[8.5px] font-mono font-bold uppercase tracking-wider border shadow-xs backdrop-blur-xs",
                isSelected
                  ? "bg-[#FF5500] text-white border-[#FF5500]"
                  : "bg-neutral-900/70 text-white border-neutral-700"
              )}
            >
              {drone.specs.weightClass}
            </span>
          </div>
        </div>

        {/* Drone Name & Description */}
        <div className="mt-1 sm:mt-1.5 space-y-0.5 text-left">
          <h3 className="font-heading text-sm sm:text-base lg:text-lg font-bold tracking-tight text-neutral-900 uppercase">
            {drone.name}
          </h3>

          <p className="text-[10px] sm:text-[11px] font-medium text-[#FF5500] leading-none">
            {drone.tagline}
          </p>

          <p
            className={cn(
              "text-[10.5px] text-neutral-600 leading-snug pt-0.5 transition-all",
              isSelected ? "block" : "hidden sm:line-clamp-2"
            )}
          >
            {drone.description}
          </p>
        </div>

        {/* Specifications Grid */}
        <div className="mt-2 pt-1.5 border-t border-orange-200/70 grid grid-cols-3 gap-1 sm:gap-1.5 text-center text-xs">
          <div className="rounded-lg bg-white/80 border border-orange-200/80 p-1 min-w-0 shadow-2xs">
            <div className="flex items-center justify-center text-neutral-400 mb-0.5">
              <Gauge className="h-2.5 w-2.5 text-[#FF5500]" />
            </div>
            <p className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-neutral-400 font-medium truncate">
              Handling
            </p>
            <p className="font-semibold text-neutral-800 text-[9px] sm:text-[10px] truncate">
              {drone.specs.handling}
            </p>
          </div>

          <div className="rounded-lg bg-white/80 border border-orange-200/80 p-1 min-w-0 shadow-2xs">
            <div className="flex items-center justify-center text-neutral-400 mb-0.5">
              <ShieldCheck className="h-2.5 w-2.5 text-[#FF5500]" />
            </div>
            <p className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-neutral-400 font-medium truncate">
              Stability
            </p>
            <p className="font-semibold text-neutral-800 text-[9px] sm:text-[10px] truncate">
              {drone.specs.stability}
            </p>
          </div>

          <div className="rounded-lg bg-white/80 border border-orange-200/80 p-1 min-w-0 shadow-2xs">
            <div className="flex items-center justify-center text-neutral-400 mb-0.5">
              <Zap className="h-2.5 w-2.5 text-[#FF5500]" />
            </div>
            <p className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-neutral-400 font-medium truncate">
              Lift Class
            </p>
            <p className="font-semibold text-neutral-800 text-[9px] sm:text-[10px] truncate">
              {drone.specs.maxLift}
            </p>
          </div>
        </div>

        {/* Select / Active Action Banner */}
        <div className="mt-2 pt-0.5">
          <div
            className={cn(
              "w-full h-7.5 sm:h-8.5 rounded-xl font-semibold text-[10.5px] sm:text-[11px] flex items-center justify-center gap-1.5 transition-all",
              isSelected
                ? "bg-gradient-to-r from-[#FF5500] via-[#FF5F08] to-[#E64800] text-white border border-[#FF5500] shadow-[0_4px_12px_rgba(255,85,0,0.35)]"
                : "bg-white/90 text-neutral-800 border border-orange-200/90 group-hover:border-orange-400 group-hover:bg-[#FFF4EB]"
            )}
          >
            {isSelected ? (
              <>
                <Check className="h-3 w-3 stroke-[2.5]" />
                <span>SELECTED PLATFORM</span>
              </>
            ) : (
              <span>SELECT THIS DRONE</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
