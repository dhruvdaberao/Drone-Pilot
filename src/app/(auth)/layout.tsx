import React from "react";
import Link from "next/link";
import Image from "next/image";
import { DroneIcon } from "@/components/ui/drone-icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-white text-neutral-900 overflow-x-hidden">
      {/* Pristine Drone Flight Illustration Background - Faint Ambient Watermark */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-white">
        <Image
          src="/Final-Baground.png"
          alt="Technical Drone Flight Blueprint Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-25"
        />
      </div>

      {/* Sleek Fixed Black Navigation Bar with Aerospace Orange Horizon Line */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-black/95 backdrop-blur-md px-4 py-3 sm:px-10 sm:py-3 text-white shadow-md border-b border-[#FF5500]/40">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
        >
          <DroneIcon className="h-5 w-5 text-[#FF5500] drop-shadow-[0_0_8px_rgba(255,85,0,0.7)] transition-transform group-hover:scale-110" />
          <span className="font-machinic text-sm sm:text-base font-bold tracking-widest text-white uppercase flex items-center gap-1.5">
            DRONE <span className="text-[#FF5500]">PILOT</span>
          </span>
        </Link>

        {/* Telemetry Core Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF5500] animate-pulse" />
          <span>SIM.NET // SECURE</span>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-3.5 py-4 pt-16 sm:pt-16 sm:px-6 sm:py-6 w-full">
        {children}
      </main>
    </div>
  );
}
