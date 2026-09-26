"use client";

import React, { useState } from "react";
import { Battery, ChevronDown, ChevronUp, Plane, RotateCcw } from "lucide-react";
import { TelemetryState } from "@/lib/simulation/types";

export interface ManipulationEvent { id: string; type: string; title: string; timestamp: number; }

interface Props {
  droneName: string; telemetry: TelemetryState; motorCount: number; motorOverrides: number[];
  motorHealths: number[]; payloadKg: number; maxPayloadKg: number; sensors: { gps: boolean; imu: boolean; baro: boolean; compass: boolean };
  events: ManipulationEvent[]; onMotorOverride: (index: number, percent: number) => void;
  onMotorFailure: (index: number, failed: boolean) => void; onBattery: (percent: number) => void;
  onPayload: (kg: number) => void; onReset: () => void; onExit: () => void;
}

const safe = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;

export function AircraftControlPanel(props: Props) {
  const [open, setOpen] = useState(false);
  let statusText = "FLIGHT READY";
  let statusColor = "text-neutral-300";
  
  const failedMotorIndex = props.motorHealths.findIndex((h) => h <= 0.01);
  const hasFailedMotor = failedMotorIndex !== -1;
  const isOverweight = props.payloadKg > 0;
  const isLowBattery = props.telemetry.batteryLevel < 20;
  const hasOverride = props.motorOverrides.some((o) => o < 0.99);

  if (hasFailedMotor) {
    statusText = "MOTOR FAILURE";
    statusColor = "text-rose-400";
  } else if (isLowBattery) {
    statusText = "LOW BATTERY";
    statusColor = "text-[#FF5500]";
  } else if (hasOverride) {
    statusText = "LIMITED THRUST";
    statusColor = "text-[#FF5500]";
  } else if (isOverweight) {
    statusText = "OVERWEIGHT";
    statusColor = "text-[#FF5500]";
  }

  const explanation = hasFailedMotor
    ? `Motor ${failedMotorIndex + 1} is unavailable. Total thrust and torque authority have changed, reducing stabilization capability.`
    : isLowBattery
      ? "Battery voltage is falling under load, reducing available electrical power and thrust authority."
      : hasOverride
        ? "A reduced motor command creates asymmetric thrust. The flight controller struggles to maintain level attitude."
        : isOverweight
          ? `Total mass increased to ${(safe(props.telemetry.totalMassKg ?? 0)).toFixed(2)} kg. The flight controller now requires greater thrust to maintain altitude.`
          : "All runtime controls match the saved Digital Twin baseline. Use a motor, battery, or payload control to run a temporary experiment.";

  return <>
    <button onClick={() => setOpen(true)} className="lg:hidden fixed top-4 left-4 z-40 bg-neutral-900/90 border border-white/20 p-2 rounded-lg text-[#FF5500]" aria-label="Open aircraft controls"><Plane className="w-5 h-5" /></button>
    {open && <button aria-label="Close aircraft controls" onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 z-30 bg-black/50" />}
    <aside className={`fixed inset-y-0 left-0 z-40 w-80 max-w-[86vw] bg-neutral-950/95 border-r border-white/10 p-4 text-white font-mono overflow-y-auto transition-transform lg:relative lg:inset-auto lg:z-auto lg:w-full lg:max-w-none lg:bg-transparent ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3"><div><p className="text-[10px] tracking-[.2em] text-white/45">AIRCRAFT</p><h2 className="font-bold text-sm">{props.droneName}</h2></div><span className={`text-[10px] font-bold uppercase ${statusColor}`}>● {statusText}</span></div>
      <button onClick={props.onExit} className="mt-3 w-full rounded-lg border border-white/10 py-2 text-[10px] text-white/65 hover:bg-white/5">EXIT TO DASHBOARD</button>
      <Section title="MOTORS">
        {Array.from({ length: props.motorCount }).map((_, index) => { const override = Math.round((props.motorOverrides[index] ?? 1) * 100); const failed = props.motorHealths[index] <= .01; const output = Math.round((props.telemetry.motorOutputs?.[index] ?? 0) * 100); return <div key={index} className="mb-3 rounded-lg bg-black/20 p-2"><div className="flex justify-between text-[10px]"><span>MOTOR {index + 1} <span className={failed ? "text-rose-400" : "text-white/45"}>{failed ? "FAILED" : `OUTPUT ${output}%`}</span></span><span>{override}%</span></div><input aria-label={`Motor ${index + 1} command`} type="range" min="0" max="100" step="5" value={override} disabled={failed} onChange={e => props.onMotorOverride(index, Number(e.target.value))} className="mt-1 w-full accent-[#FF5500] disabled:opacity-40"/><button onClick={() => props.onMotorFailure(index, !failed)} className={`mt-1 text-[9px] ${failed ? "text-neutral-300" : "text-rose-400"}`}>{failed ? "RESTORE MOTOR" : "FAIL MOTOR"}</button></div> })}
      </Section>
      <Section title="BATTERY"><div className="flex items-center justify-between text-xs"><span><Battery className="mr-1 inline h-3 w-3"/>Battery</span><b>{safe(props.telemetry.batteryLevel).toFixed(0)}%</b></div><input aria-label="Battery state" className="mt-2 w-full accent-[#FF5500]" type="range" min="0" max="100" step="5" value={Math.round(safe(props.telemetry.batteryLevel, 100) / 5) * 5} onChange={e => props.onBattery(Number(e.target.value))}/><div className="mt-2 grid grid-cols-3 text-[10px] text-white/55"><span>{safe(props.telemetry.batteryVoltage ?? 0).toFixed(1)} V</span><span>{safe(props.telemetry.batteryCurrentAmps ?? 0).toFixed(1)} A</span><span>{safe(props.telemetry.batteryPowerWatts ?? 0).toFixed(0)} W</span></div></Section>
      <Section title="PAYLOAD"><div className="flex items-center justify-between"><span className="text-xs">Current payload</span><b className="text-xs">{props.payloadKg.toFixed(2)} kg</b></div><input aria-label="Payload mass" className="mt-2 w-full accent-[#FF5500]" type="range" min="0" max={props.maxPayloadKg} step="0.1" value={props.payloadKg} onChange={e => props.onPayload(Number(e.target.value))}/></Section>
      <Section title="SYSTEMS">{(["GPS", "IMU", "COMPASS", "FLIGHT CONTROLLER"] as const).map(label => <div key={label} className="flex justify-between py-0.5 text-[10px]"><span>{label}</span><span className={label === "FLIGHT CONTROLLER" || props.sensors[label.toLowerCase() as keyof typeof props.sensors] ? "text-neutral-300" : "text-rose-400"}>{label === "FLIGHT CONTROLLER" || props.sensors[label.toLowerCase() as keyof typeof props.sensors] ? "ONLINE" : "OFFLINE"}</span></div>)}</Section>
      <Section title="WHAT'S HAPPENING"><p className="text-[10px] leading-relaxed text-white/65">{explanation}</p></Section>
      <Section title="RECENT EVENTS">{props.events.length ? props.events.slice(0, 4).map(event => <div key={event.id} className="mb-1 text-[10px] text-white/60"><span className="mr-2 text-white/35">{new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}</span>{event.title}</div>) : <p className="text-[10px] text-white/35">No experiment events yet.</p>}</Section>
      <button onClick={props.onReset} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 py-2 text-[10px] font-bold hover:bg-white/5"><RotateCcw className="h-3 w-3"/>RESET SIMULATION</button>
    </aside>
  </>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { const [expanded, setExpanded] = useState(true); return <section className="border-b border-white/10 py-3"><button onClick={() => setExpanded(!expanded)} className="flex w-full justify-between text-[10px] font-bold tracking-[.14em] text-white/50">{title}{expanded ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>}</button>{expanded && <div className="mt-2">{children}</div>}</section>; }
