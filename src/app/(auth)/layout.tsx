import React from "react";
import Link from "next/link";
import { DroneIcon } from "@/components/ui/drone-icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#f8fafc] text-neutral-900 overflow-x-hidden">
      {/* Sleek Black Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between bg-black px-4 py-3.5 sm:px-10 text-white shadow-md shadow-black/10">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
        >
          <DroneIcon className="h-5 w-5 text-white transition-transform group-hover:scale-105" />
          <span className="font-heading text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
            DRONE PILOT
          </span>
        </Link>
      </header>

      {/* Main Form Container on Subtle Off-White Canvas for Crisp Card Elevation */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-3 sm:py-5">
        {children}
      </main>

      {/* Clean Minimalist White Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 bg-white px-4 py-2.5 sm:px-10 text-xs text-neutral-500 gap-2 text-center sm:text-left">
        <div>DRONE PILOT &copy; {new Date().getFullYear()}</div>
        <div className="text-neutral-500 font-medium">Precision Flight Training Platform</div>
      </footer>
    </div>
  );
}
