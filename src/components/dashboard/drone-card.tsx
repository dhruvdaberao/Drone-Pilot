"use client";

import React from "react";
import { DroneModel } from "@/types/drone";
import { cn } from "@/lib/utils";
import { Drone3DViewer } from "./drone-3d-viewer";

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
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(drone);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onSelect(drone);
    }
  };

  return (
    <div
      role="radio"
      data-drone-id={drone.id}
      aria-checked={isSelected}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // Pure Cardless Hangar Stage Item (No boxy cards, no borders, no pill clutter)
        "group relative flex flex-col items-center justify-between cursor-pointer select-none text-center transition-all duration-500 ease-out focus-visible:outline-none",
        isSelected
          ? "-translate-y-2 sm:-translate-y-4 scale-[1.02] sm:scale-105 z-20"
          : "hover:-translate-y-1 hover:scale-[1.01] opacity-85 hover:opacity-100 z-10",
        className
      )}
    >
      {/* Interactive 3D Drone Viewport Directly on the Hangar Stage */}
      <div className="relative w-full h-44 sm:h-56 lg:h-64 flex items-center justify-center">
        {/* Subtle Luxury Floor Spotlight under Selected Drone */}
        {isSelected && (
          <div
            className="absolute inset-x-4 bottom-0 h-16 pointer-events-none -z-10 animate-in fade-in duration-500"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255, 85, 0, 0.18) 0%, rgba(255, 85, 0, 0.05) 50%, transparent 80%)",
            }}
          />
        )}

        <Drone3DViewer
          type={drone.id}
          isSelected={isSelected}
          autoRotate={!isSelected}
          interactive={true}
        />
      </div>

      {/* Clean Technical Metadata Directly on the Canvas (Zero Pill Clutter, Zero //) */}
      <div className="mt-1 sm:mt-2 space-y-1 w-full max-w-xs sm:max-w-sm px-2">
        <h3
          className={cn(
            "font-heading text-base sm:text-xl lg:text-2xl font-bold tracking-wider uppercase transition-colors duration-300",
            isSelected ? "text-neutral-950" : "text-neutral-700 group-hover:text-neutral-900"
          )}
        >
          {drone.name}
        </h3>

        {/* Clean Typographic Hierarchy: Class • Rotors • Weight Class */}
        <p className="text-xs sm:text-sm font-mono font-semibold text-[#FF5500] tracking-wide">
          {drone.badge} • {drone.specs.rotors} Rotors • {drone.specs.weightClass}
        </p>

        {/* Clean Description & Handling */}
        <p className="text-[11px] sm:text-xs text-neutral-500 leading-relaxed line-clamp-2 pt-0.5">
          {drone.tagline} • {drone.specs.handling}
        </p>

        {/* Selected Visual Indicator Line */}
        <div className="pt-2 flex justify-center">
          <div
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              isSelected
                ? "w-16 sm:w-24 bg-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.6)]"
                : "w-0 bg-transparent group-hover:w-8 group-hover:bg-neutral-300"
            )}
          />
        </div>
      </div>
    </div>
  );
}
