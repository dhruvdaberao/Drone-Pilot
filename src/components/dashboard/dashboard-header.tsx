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
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-black/40 backdrop-blur-md px-4 sm:px-10 py-4 sm:py-5 border-b border-white/5 safe-area-padding">
      {/* Subtle Orange Accent Line at the top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF5500] to-transparent opacity-50" />

      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-3 group">
        <DroneIcon invert={true} className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-105 shrink-0" />
        <span className="font-machinic text-base sm:text-xl font-bold tracking-widest text-white uppercase flex items-center gap-2 whitespace-nowrap">
          DRONE <span className="text-[#FF5500] font-medium">PILOT</span>
        </span>
      </Link>

      {/* Navigation */} 
      <nav className="hidden md:flex items-center gap-6 mr-4"> 
        <Link href="/dashboard" className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors">Command Center</Link> 
        <Link href="/hanger" className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors">Hanger</Link> 
      </nav> 

      {/* User info & Logout */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
          <User className="h-4 w-4 text-[#FF5500]" />
          <span className="font-medium tracking-widest">
            CALL SIGN: <strong className="font-bold text-white uppercase ml-1">{displayName}</strong>
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm font-semibold tracking-wider text-neutral-300 hover:text-white hover:bg-white/10 transition-colors rounded-full"
          onClick={handleSignOut}
          leftIcon={<LogOut className="h-4 w-4" />}
        >
          SIGN OUT
        </Button>
      </div>
    </header>
  );
}
