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
    <main className="relative flex min-h-screen flex-col justify-between bg-neutral-100 text-neutral-900 overflow-x-hidden">
      {/* Technical Drone Blueprint Background Image with Feathered Center Blur */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <Image
          src="/login-baground.jpg"
          alt="Drone Technical Blueprint Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Seamless feathered blur behind the center text */}
        <div
          className="absolute inset-0 backdrop-blur-md"
          style={{
            maskImage: "radial-gradient(ellipse 550px 500px at 50% 50%, black 30%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(ellipse 550px 500px at 50% 50%, black 30%, transparent 90%)",
          }}
        />
        {/* Soft radial white wash for contrast */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 550px 500px at 50% 50%, rgba(255,255,255,0.72) 20%, rgba(255,255,255,0.3) 60%, transparent 90%)",
          }}
        />
      </div>

      {/* Sleek Black Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between bg-black/90 backdrop-blur-md px-4 py-3 sm:px-10 sm:py-3.5 text-white shadow-sm">
        <div className="flex items-center gap-2.5">
          <DroneIcon className="h-5 w-5 text-white" />
          <span className="font-heading text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
            DRONE PILOT
          </span>
        </div>
      </header>

      {/* Hero directly on page - No background card */}
      <div className="my-auto z-10 w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center text-center">
        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 uppercase">
          DRONE PILOT
        </h1>

        <p className="mt-3.5 sm:mt-4 text-xs sm:text-base text-neutral-600 leading-relaxed max-w-md px-2">
          Next-generation drone simulation and learning platform. Authenticate to access your pilot credentials.
        </p>

        <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-2 sm:px-0">
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto min-w-[130px] font-semibold"
            onClick={() => router.push("/login")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>

          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto min-w-[170px] font-semibold"
            onClick={() => router.push("/signup")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Create an account
          </Button>
        </div>
      </div>

      {/* Clean Minimalist Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200/80 bg-white/85 backdrop-blur-md px-4 py-3.5 sm:px-10 text-xs text-neutral-600 gap-2 text-center sm:text-left">
        <div>DRONE PILOT PLATFORM &copy; {new Date().getFullYear()}</div>
        <div className="text-neutral-500">Phase 1 &bull; Authentication Foundation</div>
      </footer>
    </main>
  );
}
