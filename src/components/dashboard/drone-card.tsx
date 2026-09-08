"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DroneModel } from "@/types/drone";
import { cn } from "@/lib/utils";
import { Check, Cpu, ShieldCheck, Gauge } from "lucide-react";

interface DroneCardProps {
  drone: DroneModel;
  isSelected: boolean;
  onSelect: (drone: DroneModel) => void;
}

export function DroneCard({ drone, isSelected, onSelect }: DroneCardProps) {
  const [imageError, setImageError] = useState(false);

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
        "group relative flex flex-col justify-between rounded-2xl cursor-pointer select-none transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500] focus-visible:ring-offset-2",
        "bg-gradient-to-b from-[#FFFFFF] via-[#FFFDFB] to-[#FFF9F4] p-3.5 sm:p-4.5",
        isSelected
          ? "border-2 border-[#FF5500] shadow-[0_12px_28px_-6px_rgba(255,85,0,0.25),0_2px_6px_rgba(0,0,0,0.05)] -translate-y-0.5"
          : "border border-orange-200/90 shadow-[0_4px_16px_rgba(255,85,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] hover:border-orange-400 hover:shadow-[0_8px_20px_rgba(255,85,0,0.12)] hover:-translate-y-0.5"
      )}
    >
      {/* Top Bar: Badge & Selected Radio Indicator */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={cn(
            "text-[9px] sm:text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors",
            isSelected
              ? "bg-[#FF5500] text-white border-[#FF5500]"
              : "bg-orange-50 text-neutral-700 border-orange-200/90"
          )}
        >
          {drone.badge}
        </span>

        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border transition-all",
            isSelected
              ? "bg-[#FF5500] text-white border-[#FF5500] shadow-sm"
              : "bg-white text-neutral-400 border-neutral-200 group-hover:border-orange-300"
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

      {/* Drone Visual Container */}
      <div className="relative w-full h-24 sm:h-28 flex items-center justify-center my-1.5 p-1.5 rounded-xl bg-white/70 border border-orange-100/80 overflow-hidden">
        {!imageError ? (
          <div className="relative w-full h-full">
            <Image
              src={drone.image}
              alt={drone.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={cn(
                "object-contain transition-transform duration-300 ease-out",
                isSelected ? "scale-105" : "group-hover:scale-105"
              )}
              onError={() => setImageError(true)}
              priority
            />
          </div>
        ) : (
          /* Technical Blueprint Silhouette Fallback if image asset is pending in /public */
          <div className="flex flex-col items-center justify-center text-center p-2 text-neutral-500">
            <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-orange-50 border border-orange-200 mb-1">
              <Cpu className="h-5 w-5 text-[#FF5500]" />
              <span className="absolute -bottom-1 text-[8px] font-mono font-bold bg-neutral-900 text-white px-1 py-0.1 rounded">
                {drone.specs.rotors}X
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-600 font-semibold">{drone.image.replace("/", "")}</p>
            <p className="text-[9px] text-neutral-400">Place in /public</p>
          </div>
        )}
      </div>

      {/* Drone Name & Description */}
      <div className="mt-2 space-y-0.5 text-left">
        <div className="flex items-baseline justify-between">
          <h3 className="font-heading text-base sm:text-lg font-bold tracking-tight text-neutral-900 uppercase">
            {drone.name}
          </h3>
          <span className="font-mono text-[11px] font-semibold text-[#FF5500]">
            {drone.specs.rotors} ROTORS
          </span>
        </div>

        <p className="text-[11px] font-medium text-neutral-500 leading-none">
          {drone.tagline}
        </p>

        <p className="text-[11px] text-neutral-600 leading-snug line-clamp-2 pt-1">
          {drone.description}
        </p>
      </div>

      {/* Compact Specifications Grid */}
      <div className="mt-2.5 pt-2 border-t border-orange-200/60 grid grid-cols-3 gap-1 sm:gap-1.5 text-center text-xs">
        <div className="rounded-lg bg-white/90 border border-orange-100 p-1 min-w-0">
          <div className="flex items-center justify-center text-neutral-400 mb-0.5">
            <Gauge className="h-2.5 w-2.5 text-[#FF5500]" />
          </div>
          <p className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-neutral-400 font-medium truncate">Handling</p>
          <p className="font-semibold text-neutral-800 text-[9.5px] sm:text-[10px] truncate">{drone.specs.handling}</p>
        </div>

        <div className="rounded-lg bg-white/90 border border-orange-100 p-1 min-w-0">
          <div className="flex items-center justify-center text-neutral-400 mb-0.5">
            <ShieldCheck className="h-2.5 w-2.5 text-[#FF5500]" />
          </div>
          <p className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-neutral-400 font-medium truncate">Stability</p>
          <p className="font-semibold text-neutral-800 text-[9.5px] sm:text-[10px] truncate">{drone.specs.stability}</p>
        </div>

        <div className="rounded-lg bg-white/90 border border-orange-100 p-1 min-w-0">
          <div className="flex items-center justify-center text-neutral-400 mb-0.5">
            <Cpu className="h-2.5 w-2.5 text-[#FF5500]" />
          </div>
          <p className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-neutral-400 font-medium truncate">Lift Class</p>
          <p className="font-semibold text-neutral-800 text-[9.5px] sm:text-[10px] truncate">{drone.specs.maxLift}</p>
        </div>
      </div>

      {/* Select Button on Card */}
      <div className="mt-2.5 pt-1">
        <div
          className={cn(
            "w-full h-8 sm:h-9 rounded-xl font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all",
            isSelected
              ? "bg-gradient-to-r from-[#FF5500] via-[#FF5F08] to-[#E64800] text-white border border-[#FF5500] shadow-[0_4px_12px_rgba(255,85,0,0.35)]"
              : "bg-white text-neutral-800 border border-orange-200/90 group-hover:border-orange-400 group-hover:bg-[#FFF4EB]"
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
  );
}
