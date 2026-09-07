import React from "react";
import Link from "next/link";
import Image from "next/image";
import { DroneIcon } from "@/components/ui/drone-icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-neutral-100 text-neutral-900 overflow-x-hidden">
      {/* Technical Drone Blueprint Background Image with Feathered Center Blur */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <Image
          src="/login-baground.jpg"
          alt="Technical Drone Blueprint Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Seamless feathered blur specifically behind the center text/card area */}
        <div
          className="absolute inset-0 backdrop-blur-md"
          style={{
            maskImage: "radial-gradient(ellipse 550px 600px at 50% 50%, black 25%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(ellipse 550px 600px at 50% 50%, black 25%, transparent 85%)",
          }}
        />
        {/* Soft radial white wash for maximum contrast and legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 550px 600px at 50% 50%, rgba(255,255,255,0.75) 20%, rgba(255,255,255,0.3) 60%, transparent 85%)",
          }}
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
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200/80 bg-white/85 backdrop-blur-md px-4 py-2.5 sm:px-10 text-xs text-neutral-600 gap-2 text-center sm:text-left">
        <div>DRONE PILOT &copy; {new Date().getFullYear()}</div>
        <div className="text-neutral-500 font-medium">Precision Flight Training Platform</div>
      </footer>
    </div>
  );
}
