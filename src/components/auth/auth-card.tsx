"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  heading: string;
  subheading?: string;
  children: React.ReactNode;
  belowCard?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  heading,
  subheading,
  children,
  belowCard,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-[420px] sm:max-w-[430px] mx-auto flex flex-col items-center">
      {/* LUXURY UNIFIED FORM CARD */}
      <div
        className={cn(
          "w-full rounded-2xl border border-neutral-300 bg-white p-5 sm:p-6",
          "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.14),0_6px_18px_-4px_rgba(0,0,0,0.06)]",
          "hover:border-neutral-400 transition-all duration-300",
          className
        )}
      >
        {/* CARD HEADER */}
        <div className="text-center mb-4 sm:mb-4.5">
          <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-neutral-900 uppercase">
            {heading}
          </h1>
          {subheading && (
            <p className="text-xs text-neutral-500 font-normal mt-0.5 max-w-xs mx-auto leading-normal">
              {subheading}
            </p>
          )}
        </div>

        {/* CARD BODY */}
        {children}

        {/* INTEGRATED CARD FOOTER */}
        {footer && (
          <div className="mt-4 pt-3.5 border-t border-neutral-100 text-center">
            {footer}
          </div>
        )}
      </div>

      {/* BACKWARD COMPATIBILITY: BELOW CARD (IF PASSED) */}
      {belowCard && (
        <div className="w-full mt-3 space-y-3">
          {belowCard}
        </div>
      )}
    </div>
  );
}
