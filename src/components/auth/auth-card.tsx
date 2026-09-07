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
    <div className="w-full max-w-[370px] sm:max-w-[395px] mx-auto flex flex-col items-center">
      {/* ABOVE THE CARD: Heading and Subheading directly on canvas with seamless feathered blur aura */}
      <div className="relative flex flex-col items-center text-center mb-3.5 space-y-0.5 w-full">
        {/* Seamless feathered dark radial blur directly behind heading text - no card/borders */}
        <div
          className="absolute -inset-x-6 -inset-y-3 -z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(26, 27, 29, 0.94) 0%, rgba(26, 27, 29, 0.7) 50%, transparent 80%)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            maskImage:
              "radial-gradient(ellipse at center, black 35%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 35%, transparent 80%)",
          }}
        />

        <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          {heading}
        </h1>

        {subheading && (
          <p className="text-xs text-neutral-200 font-normal max-w-xs leading-normal drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {subheading}
          </p>
        )}
      </div>

      {/* LUXURY COMPACT FORM CARD */}
      <div
        className={cn(
          "w-full rounded-2xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-4 sm:p-5",
          "shadow-[0_2px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)]",
          "hover:border-neutral-300 transition-all duration-200",
          className
        )}
      >
        {children}
      </div>

      {/* OUTSIDE / BELOW THE CARD: Google Button, Divider, & Navigation directly on page */}
      {belowCard && (
        <div className="w-full mt-3 space-y-2.5">
          {belowCard}
        </div>
      )}
    </div>
  );
}
