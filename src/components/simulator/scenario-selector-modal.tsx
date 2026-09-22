"use client";

import React from "react";
import { TRAINING_SCENARIOS, TrainingScenario } from "@/lib/simulation/scenario-presets";
import {
  Sparkles,
  X,
  Wind,
  BatteryCharging,
  AlertTriangle,
  Radio,
  Package,
  Check,
  ChevronRight,
} from "lucide-react";

interface ScenarioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: TrainingScenario) => void;
  activeScenarioId?: string;
}

export function ScenarioSelectorModal({
  isOpen,
  onClose,
  onSelectScenario,
  activeScenarioId,
}: ScenarioSelectorModalProps) {
  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Environmental":
        return <Wind className="h-4 w-4 text-amber-400" />;
      case "Emergency":
        return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      case "Industrial":
        return <Package className="h-4 w-4 text-sky-400" />;
      case "Standard":
      default:
        return <Sparkles className="h-4 w-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono text-xs select-none">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-neutral-950 text-white border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/60">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-wider text-xs uppercase mb-1">
              <Sparkles className="h-4 w-4" />
              <span>AERONAUTICAL TRAINING SCENARIOS</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Select an educational scenario to simulate physical aerodynamic and mechanical consequences.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scenario Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 custom-scrollbar">
          {TRAINING_SCENARIOS.map((sc) => {
            const isActive = sc.id === activeScenarioId;

            return (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:border-neutral-600 ${
                  isActive
                    ? "bg-emerald-950/20 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "bg-neutral-900/50 border-neutral-800 hover:bg-neutral-900/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(sc.category)}
                      <span className="font-bold text-white text-xs">{sc.name}</span>
                    </div>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase"
                      style={{
                        backgroundColor: `${sc.badgeColor}22`,
                        color: sc.badgeColor,
                        border: `1px solid ${sc.badgeColor}44`,
                      }}
                    >
                      {sc.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                    {sc.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800/80 mb-3 space-y-1 text-[10px]">
                    <div className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">
                      LEARNING OUTCOME
                    </div>
                    <div className="text-neutral-300 leading-normal">{sc.learningObjective}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-[10px]">
                  <span className="text-neutral-500">Click to Deploy</span>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span>INITIALIZE</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
