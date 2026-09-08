"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  heading: string;
  subheading?: string;
  children: React.ReactNode;
  belowCard?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  heading,
  subheading,
  children,
  belowCard,
  className,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-[460px] sm:max-w-[480px] mx-auto flex flex-col items-center">
      {/* ABOVE THE CARD: Machinic Cockpit Heading with telemetry beacon */}
      <div className="relative flex flex-col items-center text-center mb-2.5 space-y-1 w-full">
        <div
          className="absolute -inset-x-8 -inset-y-3 -z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.8) 50%, transparent 80%)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />

        {/* Telemetry Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50/90 border border-orange-200/90 text-[10px] font-mono font-semibold text-[#FF5500] tracking-widest uppercase shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500] animate-pulse" />
          <span>Telemetry Station // Active</span>
        </div>

        <h1 className="font-machinic text-xl sm:text-2xl font-bold tracking-widest text-neutral-900 uppercase">
          {heading}
        </h1>

        {subheading && (
          <p className="text-xs text-neutral-600 font-normal max-w-sm leading-normal">
            {subheading}
          </p>
        )}
      </div>

      {/* LUXURY FORM CARD STRICTLY FOR INPUT FIELDS */}
      <div
        className={cn(
          "w-full rounded-2xl border border-neutral-300 bg-white p-4 sm:p-5",
          "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.14),0_6px_18px_-4px_rgba(0,0,0,0.06)]",
          "hover:border-orange-500/50 transition-all duration-300",
          className
        )}
      >
        {children}
      </div>

      {/* OUTSIDE / BELOW THE CARD: Google Button, Divider, & Navigation directly on canvas */}
      {belowCard && (
        <div className="w-full mt-2.5 space-y-2">
          {belowCard}
        </div>
      )}
    </div>
  );
}
