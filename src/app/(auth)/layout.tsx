import React from "react";
import Link from "next/link";
import Image from "next/image";
import { DroneIcon } from "@/components/ui/drone-icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-white text-neutral-900 overflow-x-hidden">
      {/* Pristine Drone Flight Illustration Background */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-white">
        <Image
          src="/Final-Baground.png"
          alt="Technical Drone Flight Blueprint Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Sleek Black Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between bg-black px-4 py-3 sm:px-10 sm:py-3.5 text-white shadow-md">
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
    </div>
  );
}
