"use client";

import React, { useRef, useEffect } from "react";
import { InputManager } from "@/lib/simulation/input-manager";

interface MobileTouchControlsProps {
  inputManager: InputManager;
}

export function MobileTouchControls({ inputManager }: MobileTouchControlsProps) {
  const leftStickRef = useRef<HTMLDivElement>(null);
  const leftKnobRef = useRef<HTMLDivElement>(null);

  const rightStickRef = useRef<HTMLDivElement>(null);
  const rightKnobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setupJoystick = (
      base: HTMLDivElement | null,
      knob: HTMLDivElement | null,
      onMove: (normX: number, normY: number) => void
    ) => {
      if (!base || !knob) return;

      let touchId: number | null = null;
      const radius = 45; // Max knob displacement

      const handleStart = (e: TouchEvent) => {
        if (touchId !== null) return;
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        updateKnob(touch.clientX, touch.clientY);
      };

      const handleMove = (e: TouchEvent) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            updateKnob(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
            break;
          }
        }
      };

      const handleEnd = (e: TouchEvent) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            touchId = null;
            knob.style.transform = `translate(0px, 0px)`;
            onMove(0, 0);
            break;
          }
        }
      };

      const updateKnob = (clientX: number, clientY: number) => {
        const rect = base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        const clampedDist = Math.min(dist, radius);
        const angle = Math.atan2(deltaY, deltaX);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

        // Normalized outputs (-1 to 1)
        const normX = knobX / radius;
        const normY = -knobY / radius; // Invert Y so up is positive
        onMove(normX, normY);
      };

      base.addEventListener("touchstart", handleStart, { passive: true });
      window.addEventListener("touchmove", handleMove, { passive: true });
      window.addEventListener("touchend", handleEnd);
      window.addEventListener("touchcancel", handleEnd);

      return () => {
        base.removeEventListener("touchstart", handleStart);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleEnd);
        window.removeEventListener("touchcancel", handleEnd);
      };
    };

    // Left Stick: Yaw (X) & Throttle (Y)
    const cleanupLeft = setupJoystick(
      leftStickRef.current,
      leftKnobRef.current,
      (normX, normY) => {
        inputManager.setTouchYaw(normX);
        inputManager.setTouchThrottle(normY);
      }
    );

    // Right Stick: Roll (X) & Pitch (Y)
    const cleanupRight = setupJoystick(
      rightStickRef.current,
      rightKnobRef.current,
      (normX, normY) => {
        inputManager.setTouchRoll(normX);
        inputManager.setTouchPitch(normY);
      }
    );

    return () => {
      cleanupLeft?.();
      cleanupRight?.();
    };
  }, [inputManager]);

  return (
    <div className="absolute inset-x-0 bottom-16 px-6 pointer-events-none z-30 flex justify-between items-end md:hidden">
      {/* Left Stick (Throttle / Yaw) */}
      <div className="flex flex-col items-center pointer-events-auto">
        <div
          ref={leftStickRef}
          className="relative w-28 h-28 rounded-full bg-white/40 backdrop-blur-md border-2 border-black flex items-center justify-center touch-none shadow-md"
        >
          <div
            ref={leftKnobRef}
            className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold shadow-lg pointer-events-none"
          >
            LIFT
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-neutral-800 mt-1 bg-white/70 px-2 py-0.5 rounded">
          ALT / YAW
        </span>
      </div>

      {/* Right Stick (Pitch / Roll) */}
      <div className="flex flex-col items-center pointer-events-auto">
        <div
          ref={rightStickRef}
          className="relative w-28 h-28 rounded-full bg-white/40 backdrop-blur-md border-2 border-black flex items-center justify-center touch-none shadow-md"
        >
          <div
            ref={rightKnobRef}
            className="w-12 h-12 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px] font-bold shadow-lg pointer-events-none"
          >
            PITCH
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-neutral-800 mt-1 bg-white/70 px-2 py-0.5 rounded">
          FLIGHT STICK
        </span>
      </div>
    </div>
  );
}