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
      {/* ABOVE THE CARD: Heading and Subheading directly on canvas */}
      <div className="flex flex-col items-center text-center mb-3 space-y-0.5 w-full">
        <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-white uppercase drop-shadow-sm">
          {heading}
        </h1>

        {subheading && (
          <p className="text-xs text-neutral-300 font-normal max-w-xs leading-normal">
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
