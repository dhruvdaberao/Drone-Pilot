// ==========================================================
// DRONE PILOT — UNIFIED INPUT MANAGER
// Merges Desktop Keyboard and Mobile Touch into a single
// normalized FlightInput stream.
// ==========================================================

import { FlightInput } from "./types";

export class InputManager {
  // Keyboard State
  private keys: Record<string, boolean> = {};

  // Touch Virtual Stick State (-1.0 to 1.0)
  private touchThrottle = 0;
  private touchYaw = 0;
  private touchPitch = 0;
  private touchRoll = 0;

  // Discrete action triggers
  private triggerReset = false;
  private triggerCameraToggle = false;
  private hoverAssistActive = true;

  // Double-tap movement lock state
  private lockedPitch = 0;  // -1, 0, or 1
  private lockedRoll = 0;   // -1, 0, or 1
  private lastKeyTime: Record<string, number> = {};
  private readonly DOUBLE_TAP_MS = 350;

  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;

  constructor() {
    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);
  }

  public attach() {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", this.onKeyDownBound);
    window.addEventListener("keyup", this.onKeyUpBound);
  }

  public detach() {
    if (typeof window === "undefined") return;
    window.removeEventListener("keydown", this.onKeyDownBound);
    window.removeEventListener("keyup", this.onKeyUpBound);
    this.keys = {};
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Avoid triggering controls when typing in input fields
    if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") {
      return;
    }

    const code = e.code;

    // Double-tap detection for movement lock (W/A/S/D)
    if (["KeyW", "KeyS", "KeyA", "KeyD"].includes(code) && !e.repeat) {
      const now = Date.now();
      const lastTime = this.lastKeyTime[code] || 0;
      if (now - lastTime < this.DOUBLE_TAP_MS) {
        // Double-tap detected — toggle lock for this direction
        if (code === "KeyW") {
          this.lockedPitch = this.lockedPitch === 1 ? 0 : 1;
          this.lockedRoll = 0;
        } else if (code === "KeyS") {
          this.lockedPitch = this.lockedPitch === -1 ? 0 : -1;
          this.lockedRoll = 0;
        } else if (code === "KeyD") {
          this.lockedRoll = this.lockedRoll === 1 ? 0 : 1;
          this.lockedPitch = 0;
        } else if (code === "KeyA") {
          this.lockedRoll = this.lockedRoll === -1 ? 0 : -1;
          this.lockedPitch = 0;
        }
      } else {
        // Single tap — clear any existing lock when pressing a different direction
        if ((code === "KeyW" || code === "KeyS") && this.lockedRoll !== 0) {
          this.lockedRoll = 0;
        }
        if ((code === "KeyA" || code === "KeyD") && this.lockedPitch !== 0) {
          this.lockedPitch = 0;
        }
      }
      this.lastKeyTime[code] = now;
    }

    this.keys[code] = true;

    if (code === "KeyR") {
      this.triggerReset = true;
    }
    if (code === "KeyH") {
      this.hoverAssistActive = !this.hoverAssistActive;
    }
    if (code === "KeyV") {
      this.triggerCameraToggle = true;
    }

    // Prevent default scroll on Space/Arrows during flight
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) {
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false;
  }

  public setTouchThrottle(val: number) {
    this.touchThrottle = Math.max(-1, Math.min(1, val));
  }
  public setTouchYaw(val: number) {
    this.touchYaw = Math.max(-1, Math.min(1, val));
  }
  public setTouchPitch(val: number) {
    this.touchPitch = Math.max(-1, Math.min(1, val));
  }
  public setTouchRoll(val: number) {
    this.touchRoll = Math.max(-1, Math.min(1, val));
  }

  // Unified on-screen widget control methods
  public setDirection(pitch: number, roll: number) {
    this.touchPitch = Math.max(-1, Math.min(1, pitch));
    this.touchRoll = Math.max(-1, Math.min(1, roll));
  }
  public setThrottle(val: number) {
    this.touchThrottle = Math.max(-1, Math.min(1, val));
  }
  public setYaw(val: number) {
    this.touchYaw = Math.max(-1, Math.min(1, val));
  }
  public triggerResetAction() {
    this.triggerReset = true;
  }
  public triggerCameraAction() {
    this.triggerCameraToggle = true;
  }
  public toggleHoverAssist() {
    this.hoverAssistActive = !this.hoverAssistActive;
  }
  public isHoverAssist(): boolean {
    return this.hoverAssistActive;
  }

  /** Returns true if a movement direction is currently locked via double-tap */
  public isMovementLocked(): boolean {
    return this.lockedPitch !== 0 || this.lockedRoll !== 0;
  }

  /** Returns locked direction label for HUD indicator */
  public getLockedDirection(): string {
    if (this.lockedPitch === 1) return "FWD";
    if (this.lockedPitch === -1) return "BWD";
    if (this.lockedRoll === 1) return "RIGHT";
    if (this.lockedRoll === -1) return "LEFT";
    return "";
  }

  /**
   * Evaluates combined input state for the current frame
   */
  public getInput(): FlightInput {
    // Keyboard inputs
    let kbThrottle = 0;
    if (this.keys["Space"]) kbThrottle += 1;
    if (this.keys["ShiftLeft"] || this.keys["ShiftRight"] || this.keys["KeyC"]) kbThrottle -= 1;

    let kbPitch = 0;
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) kbPitch += 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) kbPitch -= 1;

    let kbRoll = 0;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) kbRoll += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) kbRoll -= 1;

    let kbYaw = 0;
    if (this.keys["KeyE"]) kbYaw += 1;
    if (this.keys["KeyQ"]) kbYaw -= 1;

    // Apply movement lock (double-tap): locked direction stays active even without key held
    if (this.lockedPitch !== 0 && kbPitch === 0) kbPitch = this.lockedPitch;
    if (this.lockedRoll !== 0 && kbRoll === 0) kbRoll = this.lockedRoll;

    // Combine Keyboard + Touch with priority clamp
    const throttle = Math.max(-1, Math.min(1, kbThrottle + this.touchThrottle));
    const pitch = Math.max(-1, Math.min(1, kbPitch + this.touchPitch));
    const roll = Math.max(-1, Math.min(1, kbRoll + this.touchRoll));
    const yaw = Math.max(-1, Math.min(1, kbYaw + this.touchYaw));

    const reset = this.triggerReset;
    this.triggerReset = false;

    const cameraToggle = this.triggerCameraToggle;
    this.triggerCameraToggle = false;

    return {
      throttle,
      pitch,
      roll,
      yaw,
      hoverHold: this.hoverAssistActive,
      reset,
      cameraToggle,
    };
  }
}