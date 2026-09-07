"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { DroneIcon } from "@/components/ui/drone-icon";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <main className="relative flex min-h-screen flex-col justify-between bg-[#1a1b1d] text-white overflow-x-hidden">
      {/* Dark Technical Drone Blueprint Background */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-[#1a1b1d]">
        <Image
          src="/123.png"
          alt="Drone Technical Blueprint Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Sleek White Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between bg-white/95 backdrop-blur-md px-4 py-3 sm:px-10 sm:py-3.5 text-neutral-900 shadow-sm border-b border-neutral-200/80">
        <div className="flex items-center gap-2.5">
          <DroneIcon className="h-5 w-5 text-black" />
          <span className="font-heading text-xs sm:text-sm font-bold tracking-wider text-black uppercase">
            DRONE PILOT
          </span>
        </div>
      </header>

      {/* Hero directly on page with seamless feathered blur aura (no card, no borders) */}
      <div className="relative my-auto z-10 w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center text-center">
        {/* Seamless feathered dark radial blur directly behind the text - 100% borderless */}
        <div
          className="absolute inset-x-2 sm:inset-x-0 -top-8 -bottom-4 -z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 90% 85% at 50% 45%, rgba(26, 27, 29, 0.94) 0%, rgba(26, 27, 29, 0.75) 45%, transparent 75%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            maskImage:
              "radial-gradient(ellipse 85% 80% at 50% 45%, black 35%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 80% at 50% 45%, black 35%, transparent 75%)",
          }}
        />

        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
          DRONE PILOT
        </h1>

        <p className="mt-3.5 sm:mt-4 text-xs sm:text-base text-neutral-200 font-normal leading-relaxed max-w-md px-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          Next-generation drone simulation and learning platform. Authenticate to access your pilot credentials.
        </p>

        <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-2 sm:px-0">
          <Button
            variant="secondary"
            size="md"
            className="w-full sm:w-auto min-w-[130px] font-semibold"
            onClick={() => router.push("/login")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>

          <Button
            variant="secondary"
            size="md"
            className="w-full sm:w-auto min-w-[170px] font-semibold"
            onClick={() => router.push("/signup")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Create an account
          </Button>
        </div>
      </div>
    </main>
  );
}
