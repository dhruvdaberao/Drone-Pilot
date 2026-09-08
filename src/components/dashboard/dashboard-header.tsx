"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { DroneIcon } from "@/components/ui/drone-icon";
import { LogOut, User } from "lucide-react";

export function DashboardHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Pilot";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-gradient-to-r from-[#FF5500] via-[#FF5F08] to-[#E64800] px-3 py-2.5 sm:px-8 sm:py-3 text-white shadow-[0_4px_20px_rgba(255,85,0,0.35)] border-b border-[#D43F00]">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2 group">
        <DroneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-black transition-transform group-hover:scale-105 shrink-0" />
        <span className="font-machinic text-sm sm:text-lg font-bold tracking-wider sm:tracking-widest text-black uppercase flex items-center gap-1.5 whitespace-nowrap">
          DRONE <span className="text-white">PILOT</span>
        </span>
      </Link>

      {/* User info & Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/15 border border-white/20 text-xs text-white">
          <User className="h-3.5 w-3.5 text-white/90" />
          <span className="font-medium tracking-wide">
            CALL SIGN: <strong className="font-semibold text-white uppercase">{displayName}</strong>
          </span>
        </div>

        <Button
          variant="black"
          size="sm"
          className="h-8 sm:h-9 px-2.5 sm:px-4 text-[11px] sm:text-xs font-semibold shadow-sm"
          onClick={handleSignOut}
          leftIcon={<LogOut className="h-3.5 w-3.5" />}
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
}
