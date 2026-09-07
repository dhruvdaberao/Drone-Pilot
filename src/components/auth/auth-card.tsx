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
    <div className="w-full max-w-[370px] sm:max-w-[400px] mx-auto">
      {/* Frosted Glass Shield / Blur Aura encompassing text, card, and actions */}
      <div className="w-full rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-3 sm:p-5 flex flex-col items-center">
        {/* ABOVE THE CARD: Heading and Subheading */}
        <div className="flex flex-col items-center text-center mb-2.5 sm:mb-3 space-y-0.5 w-full">
          <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-neutral-900 uppercase">
            {heading}
          </h1>

          {subheading && (
            <p className="text-xs text-neutral-600 font-normal max-w-xs leading-normal">
              {subheading}
            </p>
          )}
        </div>

        {/* LUXURY COMPACT CARD CONTAINER */}
        <div
          className={cn(
            "w-full rounded-2xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-3.5 sm:p-5",
            "shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]",
            "hover:border-neutral-300 transition-all duration-200",
            className
          )}
        >
          {children}
        </div>

        {/* OUTSIDE / BELOW THE CARD: Google Button, Divider, & Navigation */}
        {belowCard && (
          <div className="w-full mt-2.5 space-y-2">
            {belowCard}
          </div>
        )}
      </div>
    </div>
  );
}
