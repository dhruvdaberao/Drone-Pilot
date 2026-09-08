"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { Button } from "@/components/ui/button";
import { DroneIcon } from "@/components/ui/drone-icon";
import { LogOut, CheckCircle2, AlertCircle, User, Mail, Shield } from "lucide-react";

export default function DashboardPage() {
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col justify-between bg-white text-neutral-900 overflow-x-hidden">
        {/* Sleek Fixed White Navigation Bar */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white/95 backdrop-blur-md px-4 py-3 sm:px-10 sm:py-3.5 text-neutral-900 shadow-sm border-b border-neutral-200/80">
          <div className="flex items-center gap-2.5">
            <DroneIcon className="h-5 w-5 text-black" />
            <span className="font-heading text-xs sm:text-sm font-bold tracking-wider text-black uppercase">
              DRONE PILOT
            </span>
          </div>

          <div className="flex items-center">
            <Button
              variant="primary"
              size="md"
              className="h-11 px-5 text-sm font-semibold shadow-md"
              onClick={handleSignOut}
              leftIcon={<LogOut className="h-4 w-4 stroke-[2]" />}
            >
              Log Out
            </Button>
          </div>
        </header>

        {/* Main Content Area on Clean White Canvas */}
        <main className="flex flex-1 items-center justify-center px-3 py-6 pt-20 sm:pt-24 sm:p-8 md:p-12 bg-white">
          <div className="w-full max-w-lg rounded-xl sm:rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.14),0_6px_18px_-4px_rgba(0,0,0,0.06)] space-y-5 sm:space-y-6">
            {/* Status Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Authentication Successful</span>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                Authentication successful — Command Center coming next.
              </h1>

              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                Your pilot session is active. Route guards and session persistence are functioning properly.
              </p>
            </div>

            {/* Pilot Profile Overview */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                <span className="text-xs font-semibold text-neutral-800 font-heading">
                  Pilot Credentials
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-neutral-200">
                  <User className="h-4 w-4 text-neutral-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Call Sign</p>
                    <p className="font-semibold text-neutral-900 truncate">
                      {user?.displayName || "Pilot Cadet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-neutral-200">
                  <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Email</p>
                    <p className="font-semibold text-neutral-900 truncate">
                      {user?.email || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-neutral-200 sm:col-span-2">
                  <Shield className="h-4 w-4 text-neutral-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Pilot ID (UID)</p>
                    <p className="text-xs font-mono text-neutral-700 break-all">
                      {user?.uid || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {!user?.emailVerified && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span>Your flight ID is pending verification. </span>
                    <Link
                      href="/verify-email"
                      className="text-black underline font-medium hover:text-neutral-700 ml-0.5"
                    >
                      Verify email now &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Action */}
            <div className="pt-1 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={handleSignOut}
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
