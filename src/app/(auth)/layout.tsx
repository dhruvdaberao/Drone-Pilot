import React from "react";
import Link from "next/link";
import Image from "next/image";
import { DroneIcon } from "@/components/ui/drone-icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-white text-neutral-900 overflow-x-hidden">
      {/* Pristine Drone Flight Illustration Background with Aerospace Orange Blueprint Tint */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-white">
        <Image
          src="/Final-Baground.png"
          alt="Technical Drone Flight Blueprint Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30 [filter:sepia(100%)_saturate(500%)_hue-rotate(-22deg)]"
        />
      </div>

      {/* Bold Fixed Aerospace Orange Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-gradient-to-r from-[#FF5500] via-[#FF5F08] to-[#E64800] px-4 py-3 sm:px-10 sm:py-3 text-white shadow-[0_4px_20px_rgba(255,85,0,0.35)] border-b border-[#D43F00]">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
        >
          <DroneIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span className="font-machinic text-base sm:text-lg font-bold tracking-widest text-black uppercase flex items-center gap-1.5">
            DRONE <span className="text-white">PILOT</span>
          </span>
        </Link>
      </header>

      {/* Main Form Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-3.5 py-4 pt-16 sm:pt-16 sm:px-6 sm:py-6 w-full">
        {children}
      </main>
    </div>
  );
}
