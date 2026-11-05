"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/route-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useAuth } from "@/context/auth-context";
import { DRONES, getDroneById } from "@/lib/drones";
import {
  listUserConfigurations,
  getActiveDigitalTwin,
  setActiveDigitalTwin,
  setLastSelectedDrone,
} from "@/lib/digital-twin/digital-twin-storage";
import { DIGITAL_TWIN_PRESETS } from "@/lib/digital-twin/digital-twin-presets";
import { DroneDigitalTwinConfiguration, DroneCategory } from "@/types/drone-digital-twin";
import {
  User,
  Mail,
  ShieldCheck,
  Settings2,
  Play,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  KeyRound,
  ExternalLink,
  Cpu,
  Battery,
  Weight,
  Layers,
  Sparkles,
  Info,
  Radio,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    isEmailVerified,
    isFirebaseLive,
    updateProfile,
    updateEmailAddress,
    resetPassword,
    sendVerificationEmail,
  } = useAuth();

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Drones & Digital Twin State
  const [savedConfigs, setSavedConfigs] = useState<DroneDigitalTwinConfiguration[]>([]);
  const [activeCategory, setActiveCategory] = useState<DroneCategory>("quadcopter");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.email?.split("@")[0] || "");
      setEmail(user.email || "");

      // Load user configurations
      listUserConfigurations(user.uid).then((configs) => {
        setSavedConfigs(configs);
      });

      // Load currently active digital twin
      try {
        const active = getActiveDigitalTwin(user.uid);
        if (active?.identity?.category) {
          setActiveCategory(active.identity.category);
        }
      } catch {
        setActiveCategory("quadcopter");
      }
    }
  }, [user]);

  // Handle Callsign / Name Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setFeedback({ type: "error", message: "Call sign / name cannot be blank." });
      return;
    }
    setIsUpdatingProfile(true);
    setFeedback(null);
    try {
      await updateProfile(displayName.trim());
      setFeedback({ type: "success", message: "Pilot call sign updated successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update call sign." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Email Update
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setFeedback({ type: "error", message: "Please provide a valid email address." });
      return;
    }
    if (email.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setFeedback({ type: "info", message: "Email is identical to your current address." });
      return;
    }

    setIsUpdatingEmail(true);
    setFeedback(null);
    try {
      const res = await updateEmailAddress(email.trim());
      setFeedback({
        type: res.verificationEmailSent ? "info" : "success",
        message: res.message,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update email address." });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    setFeedback(null);
    try {
      await resetPassword(user.email);
      setFeedback({
        type: "success",
        message: `Password reset instructions sent to ${user.email}. Check your inbox!`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to dispatch reset link." });
    } finally {
      setIsSendingReset(false);
    }
  };

  // Set Active Drone
  const handleSetActiveDrone = async (category: DroneCategory) => {
    setActiveCategory(category);
    const existing = savedConfigs.find((c) => c.identity.category === category);
    const preset = DIGITAL_TWIN_PRESETS.find((p) => p.identity.category === category) || DIGITAL_TWIN_PRESETS[0];
    const targetConfig = existing || preset;

    setActiveDigitalTwin(user?.uid || null, targetConfig);
    await setLastSelectedDrone(user?.uid || null, category);

    setFeedback({
      type: "success",
      message: `Active aircraft set to ${targetConfig.identity.name} (${category.toUpperCase()}).`,
    });
  };

  // Platforms to showcase
  const droneCategories: Array<{
    category: DroneCategory;
    title: string;
    description: string;
    droneModelId: string;
    badge: string;
  }> = [
    {
      category: "quadcopter",
      title: "Quadcopter X4 Platform",
      description: "Agile 4-rotor tactical aircraft designed for high-precision inspection and basic flight dynamics instruction.",
      droneModelId: "aero-trainer-x4",
      badge: "Class 4A Multirotor",
    },
    {
      category: "hexacopter",
      title: "Hexacopter 6B Platform",
      description: "Radial 6-motor heavy payload layout featuring motor-out redundancy and high-stability aerial surveying.",
      droneModelId: "skymapper-6b",
      badge: "Class 6B Survey",
    },
    {
      category: "octacopter",
      title: "Octacopter 8C Platform",
      description: "Industrial 8-rotor heavy lifter with massive torque authority for logistics and search-and-rescue payloads.",
      droneModelId: "titan-octo-8c",
      badge: "Class 8C Heavy Lift",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="relative min-h-dvh w-full max-w-full flex flex-col justify-between bg-[#08090a] text-white overflow-x-hidden font-sans safe-area-pb">
        {/* Ambient aerospace glow */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-40"
          style={{
            background: "radial-gradient(circle at 50% 20%, rgba(255,85,0,0.05) 0%, transparent 70%)",
          }}
        />

        {/* Global Navigation Header */}
        <DashboardHeader />

        {/* Main Workstation Container */}
        <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] font-mono text-xs font-bold uppercase tracking-wider">
                  Pilot Profile & Fleet
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {isFirebaseLive ? "Cloud Database Synced" : "Local Session Mode"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight uppercase">
                Flight Operations Account
              </h1>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold tracking-wider text-neutral-300 hover:text-white transition-all flex items-center gap-2"
              >
                <span>Hangar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/fly?drone=${activeCategory}`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5500] to-amber-500 hover:from-[#ff6600] hover:to-amber-400 text-black font-mono text-xs font-black tracking-wider transition-all shadow-lg shadow-[#FF5500]/20 flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Simulator</span>
              </Link>
            </div>
          </div>

          {/* Alert feedback banner */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                feedback.type === "success"
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                  : feedback.type === "error"
                  ? "bg-rose-950/60 border-rose-500/40 text-rose-200"
                  : "bg-cyan-950/60 border-cyan-500/40 text-cyan-200"
              }`}
            >
              {feedback.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {feedback.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {feedback.type === "info" && <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}
              <div className="text-xs font-mono font-medium leading-relaxed">
                {feedback.message}
              </div>
            </div>
          )}

          {/* Grid Layout: Left Column = Pilot Profile Credentials, Right Column = Drones Fleet */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Pilot Identity & Credentials */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Pilot Card */}
              <div className="bg-gradient-to-b from-[#111726]/90 to-[#0c101c]/95 border border-white/12 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5500]/5 rounded-full blur-2xl pointer-events-none" />

                {/* Pilot Avatar & Badge */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5500]/20 to-amber-500/10 border border-[#FF5500]/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,85,0,0.2)]">
                    <User className="w-8 h-8 text-[#FF5500]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
                        PILOT CALLSIGN
                      </span>
                      {isEmailVerified ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold">
                          PENDING
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black font-mono text-white uppercase truncate">
                      {displayName || "Unnamed Pilot"}
                    </h2>
                    <p className="text-xs font-mono text-neutral-400 truncate">
                      {user?.email || "No email linked"}
                    </p>
                  </div>
                </div>

                {/* Pilot Call Sign Edit Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Edit Pilot Call Sign
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. SKY-WARRIOR"
                        className="w-full bg-[#070b14] border border-white/15 focus:border-[#FF5500] rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white hover:text-black border border-white/20 text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingProfile ? "Updating Call Sign..." : "Save Call Sign"}
                  </button>
                </form>

                {/* Pilot Email Edit Form */}
                <form onSubmit={handleSaveEmail} className="space-y-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Update Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="pilot@example.com"
                        className="w-full bg-[#070b14] border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingEmail}
                    className="w-full py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 hover:text-black border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingEmail ? "Updating Email..." : "Update Email Address"}
                  </button>
                </form>

                {/* Technical Note on Email OTP vs Firebase Verification */}
                <div className="bg-cyan-950/20 border-l-2 border-l-cyan-400 border border-cyan-500/20 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 uppercase">
                    <Info className="w-3.5 h-3.5" />
                    <span>How Email Verification Works</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Firebase Authentication handles email updates securely via{" "}
                    <code className="text-cyan-200 bg-cyan-950/60 px-1 py-0.5 rounded">
                      verifyBeforeUpdateEmail
                    </code>
                    . A secure verification link is dispatched directly to the new address. Third-party OTP mailers (like Brevo) are not required unless 6-digit numerical SMS/email OTP is specifically desired.
                  </p>
                </div>

                {/* Security Actions */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                    Security & Access
                  </span>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isSendingReset}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-neutral-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isSendingReset ? "Sending Reset Link..." : "Send Password Reset Link"}</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Right Column: Currently Configured Drones & Fleet */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-mono font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#FF5500]" />
                    Configured Fleet
                  </h3>
                  <p className="text-xs font-mono text-neutral-400">
                    Active digital twin engineering presets and custom specifications
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold text-neutral-300">
                  {droneCategories.length} Airframes Ready
                </span>
              </div>

              {/* Aircraft Fleet List */}
              <div className="space-y-4">
                {droneCategories.map((item) => {
                  const droneModel = getDroneById(item.droneModelId) || DRONES[0];
                  const savedConfig = savedConfigs.find((c) => c.identity.category === item.category);
                  const presetConfig = DIGITAL_TWIN_PRESETS.find((p) => p.identity.category === item.category);
                  const effectiveConfig = savedConfig || presetConfig;

                  const isActive = activeCategory === item.category;

                  const totalMassKg = effectiveConfig?.massProperties.totalMassKg ?? droneModel.baseMassKg;
                  const motorCount = item.category === "octacopter" ? 8 : item.category === "hexacopter" ? 6 : 4;
                  const batteryCells = effectiveConfig?.battery?.cellCount ?? droneModel.batteryCells;

                  return (
                    <div
                      key={item.category}
                      className={`rounded-3xl border p-5 transition-all relative overflow-hidden ${
                        isActive
                          ? "bg-gradient-to-b from-[#141b2c]/95 to-[#0d121e]/98 border-[#FF5500]/50 shadow-[0_0_25px_rgba(255,85,0,0.12)]"
                          : "bg-gradient-to-b from-[#111726]/80 to-[#0a0e18]/90 border-white/10 hover:border-white/20"
                      }`}
                    >
                      {/* Active marker */}
                      {isActive && (
                        <div className="absolute top-0 right-0 bg-[#FF5500] text-black font-mono font-black text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE IN SIMULATOR
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 max-w-lg">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono font-bold text-neutral-300 uppercase tracking-wider">
                              {item.badge}
                            </span>
                            <span className="text-xs font-mono text-[#FF5500] font-bold uppercase">
                              {savedConfig ? "Custom Calibrated" : "Factory Specification"}
                            </span>
                          </div>

                          <h4 className="text-lg font-mono font-black text-white uppercase leading-snug">
                            {effectiveConfig?.identity.name || droneModel.name}
                          </h4>

                          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                            {item.description}
                          </p>

                          {/* Engineering Specs Strip */}
                          <div className="grid grid-cols-3 gap-2.5 pt-3">
                            <div className="bg-black/40 border border-white/5 rounded-xl p-2 text-center">
                              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                                Mass
                              </span>
                              <span className="text-sm font-mono font-black text-white">
                                {totalMassKg.toFixed(2)} kg
                              </span>
                            </div>

                            <div className="bg-black/40 border border-white/5 rounded-xl p-2 text-center">
                              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                                Motors
                              </span>
                              <span className="text-sm font-mono font-black text-cyan-400">
                                {motorCount}x Rotors
                              </span>
                            </div>

                            <div className="bg-black/40 border border-white/5 rounded-xl p-2 text-center">
                              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                                Battery
                              </span>
                              <span className="text-sm font-mono font-black text-emerald-400">
                                {batteryCells}S LiPo
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Column */}
                        <div className="flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0 sm:min-w-[150px]">
                          <Link
                            href={`/configure?drone=${item.category}`}
                            className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-white/10 hover:bg-white hover:text-black border border-white/20 text-xs font-mono font-bold text-white uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            <span>Edit Config</span>
                          </Link>

                          <Link
                            href={`/fly?drone=${item.category}`}
                            className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF5500]/20 to-amber-500/20 hover:from-[#FF5500] hover:to-amber-500 border border-[#FF5500]/40 hover:border-[#FF5500] text-xs font-mono font-bold text-amber-300 hover:text-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Fly Aircraft</span>
                          </Link>

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleSetActiveDrone(item.category)}
                              className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-mono font-semibold text-neutral-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Set Active
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
