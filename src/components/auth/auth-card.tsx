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
    <div className="flex flex-col items-center w-full max-w-[390px] sm:max-w-[400px] mx-auto px-4 py-1">
      {/* ABOVE THE CARD: Heading and Subheading */}
      <div className="flex flex-col items-center text-center mb-2.5 sm:mb-3 space-y-0.5">
        <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-neutral-900">
          {heading}
        </h1>

        {subheading && (
          <p className="text-xs text-neutral-500 font-normal max-w-xs leading-normal">
            {subheading}
          </p>
        )}
      </div>

      {/* LUXURY COMPACT CARD CONTAINER */}
      <div
        className={cn(
          "w-full rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5",
          "shadow-[0_1px_3px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.06),0_16px_36px_-8px_rgba(0,0,0,0.04)]",
          "hover:border-neutral-300 transition-all duration-200",
          className
        )}
      >
        {children}
      </div>

      {/* OUTSIDE / BELOW THE CARD: Google Button, Divider, & Navigation */}
      {belowCard && (
        <div className="w-full mt-3 space-y-2.5">
          {belowCard}
        </div>
      )}
    </div>
  );
}
