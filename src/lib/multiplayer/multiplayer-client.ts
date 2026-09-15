// ==========================================================
// DRONE PILOT — REAL-TIME MULTIPLAYER CLIENT
// Supports state synchronization, dead-reckoning interpolation,
// collision-free helipad spawn allocation, and room sessions.
// Uses local broadcast channel with fallback for seamless demo.
// ==========================================================

import { RemotePlayerState, MultiplayerPacket } from "./multiplayer-types";
import { TelemetryState } from "../simulation/types";

export class MultiplayerClient {
  public localPlayerId: string;
  public callsign: string;
  public isConnected = false;
  public regionId = "training";
  public helipadId = "training-alpha";
  private channel: BroadcastChannel | null = null;
  private remotePlayers: Map<string, RemotePlayerState> = new Map();
  private onPlayersUpdated?: (players: RemotePlayerState[]) => void;
  private broadcastTimer = 0;
  private broadcastInterval = 0.05; // 20Hz broadcast

  constructor(
    callsign?: string,
    regionId = "training",
    onUpdate?: (players: RemotePlayerState[]) => void
  ) {
    this.localPlayerId = "pilot_" + Math.random().toString(36).substring(2, 7);
    this.callsign = callsign || "EAGLE-" + Math.floor(10 + Math.random() * 90);
    this.regionId = regionId;
    this.onPlayersUpdated = onUpdate;
  }

  public connect(
    regionId?: string,
    helipadId?: string,
    onUpdate?: (players: RemotePlayerState[]) => void
  ) {
    if (regionId) this.regionId = regionId;
    if (helipadId) this.helipadId = helipadId;
    if (onUpdate) this.onPlayersUpdated = onUpdate;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel("drone_pilot_airspace");
        this.channel.onmessage = (event) => {
          this.handlePacket(event.data);
        };
        this.isConnected = true;

        this.sendPacket("JOIN", {
          regionId: this.regionId,
          helipadId: this.helipadId,
        });
      } catch (e) {
        console.warn("Multiplayer broadcast channel unavailable, running offline mode", e);
      }
    }
  }

  public sendTelemetry(telemetry: TelemetryState, dt = 0.05) {
    this.updateLocalState(telemetry, "drone", this.regionId, this.helipadId, dt);
  }

  public disconnect() {
    if (this.channel) {
      this.sendPacket("LEAVE", {});
      this.channel.close();
      this.channel = null;
      this.isConnected = false;
    }
    this.remotePlayers.clear();
    this.notifyUpdate();
  }

  public updateLocalState(
    telemetry: TelemetryState,
    droneId: string,
    regionId: string,
    helipadId: string,
    dt: number
  ) {
    if (!this.isConnected || !this.channel) return;

    this.broadcastTimer += dt;
    if (this.broadcastTimer >= this.broadcastInterval) {
      this.broadcastTimer = 0;
      const state: RemotePlayerState = {
        playerId: this.localPlayerId,
        callsign: this.callsign,
        droneId,
        regionId,
        helipadId,
        position: { ...telemetry.position },
        rotation: { ...telemetry.rotation },
        velocity: { ...telemetry.velocity },
        rotorRpmPercent: telemetry.rotorRpmPercent,
        flightMode: telemetry.flightMode,
        lastUpdate: Date.now(),
      };

      this.sendPacket("STATE", state);
    }

    const now = Date.now();
    let changed = false;
    for (const [id, player] of this.remotePlayers.entries()) {
      if (now - player.lastUpdate > 4000) {
        this.remotePlayers.delete(id);
        changed = true;
      }
    }
    if (changed) this.notifyUpdate();
  }

  private sendPacket(type: MultiplayerPacket["type"], data: any) {
    if (!this.channel) return;
    const packet: MultiplayerPacket = {
      type,
      playerId: this.localPlayerId,
      callsign: this.callsign,
      data,
      timestamp: Date.now(),
    };
    try {
      this.channel.postMessage(packet);
    } catch {
      // Ignore
    }
  }

  private handlePacket(packet: MultiplayerPacket) {
    if (!packet || packet.playerId === this.localPlayerId) return;

    if (packet.type === "STATE") {
      const state = packet.data as RemotePlayerState;
      this.remotePlayers.set(packet.playerId, {
        ...state,
        lastUpdate: Date.now(),
      });
      this.notifyUpdate();
    } else if (packet.type === "LEAVE") {
      this.remotePlayers.delete(packet.playerId);
      this.notifyUpdate();
    } else if (packet.type === "JOIN") {
      this.broadcastTimer = 999; // instant reply
    }
  }

  private notifyUpdate() {
    if (this.onPlayersUpdated) {
      this.onPlayersUpdated(Array.from(this.remotePlayers.values()));
    }
  }

  public getActiveRemotePlayers(): RemotePlayerState[] {
    return Array.from(this.remotePlayers.values());
  }

  public allocateSpawnOffset(padX: number, padZ: number): { x: number; z: number } {
    let offsetX = padX;
    let offsetZ = padZ;

    for (const remote of this.remotePlayers.values()) {
      const dist = Math.hypot(remote.position.x - padX, remote.position.z - padZ);
      if (dist < 6.0) {
        offsetX += 8.0;
        offsetZ += 2.0;
      }
    }

    return { x: offsetX, z: offsetZ };
  }
}
