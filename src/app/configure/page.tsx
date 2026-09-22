"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DigitalTwinConfigurator } from "@/components/digital-twin/digital-twin-configurator";

export default function ConfigurePage() {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen w-full max-w-full flex flex-col justify-between bg-[#FAF7F2] text-neutral-900 overflow-x-hidden font-sans">
        {/* Subtle Tech Grid Accent */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Dashboard Header */}
        <DashboardHeader />

        {/* Step Indicator */}
        <div className="w-full border-b border-neutral-100 bg-[#FAF7F2] relative z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4 sm:gap-8 overflow-x-auto scrollbar-none text-[11px] font-bold tracking-widest text-neutral-400">
            <span className="shrink-0">01 AIRCRAFT</span>
            <span className="shrink-0 text-neutral-300">/</span>
            <span className="text-[#FF5500] shrink-0">02 CONFIGURE</span>
            <span className="shrink-0 text-neutral-300">/</span>
            <span className="shrink-0">03 ENVIRONMENT</span>
            <span className="shrink-0 text-neutral-300">/</span>
            <span className="shrink-0">04 PREFLIGHT</span>
            <span className="shrink-0 text-neutral-300">/</span>
            <span className="shrink-0">05 FLIGHT</span>
          </div>
        </div>

        {/* Main Workstation Container */}
        <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <DigitalTwinConfigurator />
        </main>
      </div>
    </ProtectedRoute>
  );
}
