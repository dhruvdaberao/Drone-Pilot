"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { DroneIcon } from "@/components/ui/drone-icon";
import { LogOut, User } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "HANGAR" },
];

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
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
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-black/50 backdrop-blur-lg px-4 sm:px-10 py-3 sm:py-4 border-b border-white/[0.06]">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5500]/60 to-transparent" />

      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-3 group shrink-0">
        <DroneIcon invert={true} className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-105 shrink-0" />
        <span className="font-machinic text-sm sm:text-lg font-bold tracking-[0.2em] text-white uppercase flex items-center gap-2 whitespace-nowrap">
          DRONE <span className="text-[#FF5500]">PILOT</span>
        </span>
      </Link>

      {/* Nav — only HANGAR; active gets orange underline */}
      <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative py-1 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors ${
                isActive ? "text-white" : "text-neutral-500 hover:text-neutral-200"
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF5500]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right: pilot name + sign out */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-neutral-400 font-mono tracking-wider">
          <User className="h-3.5 w-3.5 text-[#FF5500] shrink-0" />
          <span>
            <span className="text-neutral-500">CALL SIGN </span>
            <strong className="font-bold text-white uppercase">{displayName}</strong>
          </span>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06] cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">SIGN OUT</span>
        </button>
      </div>
    </header>
  );
}
