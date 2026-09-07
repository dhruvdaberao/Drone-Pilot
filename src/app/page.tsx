"use client";

import React, { useEffect } from "react";
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
    <main className="relative flex min-h-screen flex-col justify-between bg-white text-neutral-900 overflow-x-hidden">
      {/* Sleek Black Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between bg-black px-4 py-3 sm:px-10 sm:py-3.5 text-white shadow-sm">
        <div className="flex items-center gap-2.5">
          <DroneIcon className="h-5 w-5 text-white" />
          <span className="font-heading text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
            DRONE PILOT
          </span>
        </div>
      </header>

      {/* Hero on Clean White Canvas */}
      <div className="my-auto flex flex-col items-center text-center max-w-xl mx-auto px-4 sm:px-6 z-10 py-12 sm:py-20">
        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 uppercase">
          DRONE PILOT
        </h1>

        <p className="mt-3.5 sm:mt-4 text-xs sm:text-base text-neutral-500 leading-relaxed max-w-md px-2">
          Next-generation drone simulation and learning platform. Authenticate to access your pilot credentials.
        </p>

        <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
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

      {/* Clean White Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200/80 bg-white px-4 py-3.5 sm:px-10 text-xs text-neutral-500 gap-2 text-center sm:text-left">
        <div>DRONE PILOT PLATFORM &copy; {new Date().getFullYear()}</div>
        <div className="text-neutral-400">Phase 1 &bull; Authentication Foundation</div>
      </footer>
    </main>
  );
}
