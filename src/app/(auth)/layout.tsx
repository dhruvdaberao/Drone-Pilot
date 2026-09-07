import React from "react";
import Link from "next/link";
import Image from "next/image";
import { DroneIcon } from "@/components/ui/drone-icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#1a1b1d] text-white overflow-x-hidden">
      {/* Dark Technical Drone Blueprint Background */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-[#1a1b1d]">
        <Image
          src="/123.png"
          alt="Technical Drone Blueprint Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Sleek Black Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between bg-black/90 backdrop-blur-md px-4 py-3 sm:px-10 sm:py-3.5 text-white shadow-md shadow-black/10">
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

      {/* Main Form Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-3.5 py-4 sm:px-6 sm:py-6 w-full">
        {children}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-white/10 bg-black/80 backdrop-blur-md px-4 py-2.5 sm:px-10 text-xs text-neutral-400 gap-2 text-center sm:text-left">
        <div>DRONE PILOT &copy; {new Date().getFullYear()}</div>
        <div className="text-neutral-400 font-medium">Precision Flight Training Platform</div>
      </footer>
    </div>
  );
}
