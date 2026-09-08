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
    <div className="w-full max-w-[420px] sm:max-w-[440px] mx-auto flex flex-col items-center">
      {/* ABOVE THE CARD: Heading and Subheading directly on canvas with seamless feathered blur aura */}
      <div className="relative flex flex-col items-center text-center mb-5 space-y-1 w-full">
        {/* Seamless feathered white radial blur directly behind heading text - no card/borders */}
        <div
          className="absolute -inset-x-8 -inset-y-4 -z-10 pointer-events-none"
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

        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 uppercase">
          {heading}
        </h1>

        {subheading && (
          <p className="text-xs sm:text-sm text-neutral-600 font-normal max-w-sm leading-normal">
            {subheading}
          </p>
        )}
      </div>

      {/* LUXURY FORM CARD WITH PROPER SEPARATION SHADOW */}
      <div
        className={cn(
          "w-full rounded-2xl border border-neutral-200/90 bg-white p-6 sm:p-7",
          "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.14),0_6px_18px_-4px_rgba(0,0,0,0.06)]",
          "hover:border-neutral-300 transition-all duration-300",
          className
        )}
      >
        {children}
      </div>

      {/* OUTSIDE / BELOW THE CARD: Google Button, Divider, & Navigation directly on page */}
      {belowCard && (
        <div className="w-full mt-4 space-y-3.5">
          {belowCard}
        </div>
      )}
    </div>
  );
}
