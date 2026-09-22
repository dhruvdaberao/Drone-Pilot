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
        "group relative flex flex-col items-center justify-between cursor-pointer select-none text-center transition-all duration-300 ease-out focus-visible:outline-none w-full h-full opacity-100",
        "bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] border",
        isSelected ? "border-[#FF5500] shadow-[0_8px_32px_rgba(255,85,0,0.12)]" : "border-neutral-100",
        isSelected ? "z-20" : "z-10",
        className
      )}
    >
      {/* Selected checkmark indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-[#FF5500] flex items-center justify-center text-white shadow-sm z-30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      )}

      {/* Interactive 3D Drone Viewport */}
      <div className="relative w-full h-56 sm:h-64 flex items-center justify-center pt-4">
        {/* Subtle orange glow inside card if selected */}
        {isSelected && (
          <div
            className="absolute inset-x-4 bottom-4 h-16 pointer-events-none -z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255, 85, 0, 0.1), transparent 70%)",
            }}
          />
        )}
        <Drone3DViewer
          type={drone.id}
          isSelected={isSelected}
          autoRotate={!isSelected}
          interactive={false}
        />
      </div>

      {/* Minimal Technical Metadata */}
      <div className="w-full px-6 pb-6 pt-2 flex flex-col items-center">
        <h3
          className={cn(
            "font-heading text-lg font-extrabold tracking-wide uppercase transition-colors duration-300 mb-1",
            isSelected ? "text-neutral-950" : "text-neutral-900"
          )}
        >
          {drone.name}
        </h3>
        <div className="flex flex-col items-center gap-1 text-[11px] font-mono font-medium text-neutral-500 uppercase tracking-widest">
          <span>{drone.specs.rotors} MOTORS</span>
          <span>{drone.specs.weightClass}</span>
          <span>{drone.badge}</span>
        </div>
        
        {/* Subtle button-like affordance */}
        <div className="mt-4 pt-4 border-t border-neutral-100 w-full flex justify-center">
          <span className={cn(
            "text-xs font-bold tracking-widest uppercase transition-colors",
            isSelected ? "text-[#FF5500]" : "text-neutral-400 group-hover:text-neutral-900"
          )}>
            {isSelected ? "SELECTED" : "SELECT"}
          </span>
        </div>
      </div>
    </div>
  );
}
