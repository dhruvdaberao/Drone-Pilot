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

        {/* Main Workstation Container */}
        <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12">
          <DigitalTwinConfigurator />
        </main>
      </div>
    </ProtectedRoute>
  );
}
