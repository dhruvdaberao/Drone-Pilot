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
      {/* ABOVE THE CARD: Machinic Cockpit Heading directly on blueprint canvas */}
      <div className="relative flex flex-col items-center text-center mb-3 space-y-0.5 w-full">
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

        <h1 className="font-machinic text-2xl sm:text-3xl font-bold tracking-widest text-neutral-950 uppercase">
          {heading}
        </h1>

        {subheading && (
          <p className="text-xs text-neutral-600 font-normal max-w-sm leading-normal">
            {subheading}
          </p>
        )}
      </div>

      {/* LUXURY FORM CARD STRICTLY FOR INPUT FIELDS WITH WARM AEROSPACE TINT */}
      <div
        className={cn(
          "w-full rounded-2xl border border-orange-200/90 bg-gradient-to-b from-[#FFFFFF] via-[#FFFDFB] to-[#FFF9F4] p-4 sm:p-5",
          "shadow-[0_20px_50px_-12px_rgba(255,85,0,0.12),0_8px_24px_-6px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]",
          "hover:border-orange-400/80 transition-all duration-300",
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
