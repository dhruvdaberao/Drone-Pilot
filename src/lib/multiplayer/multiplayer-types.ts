// ==========================================================
// DRONE PILOT — MULTIPLAYER NETWORK PROTOCOL TYPES
// ==========================================================

export interface RemotePlayerState {
  playerId: string;
  callsign: string;
  droneId: string;
  regionId: string;
  helipadId: string;
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; roll: number; yaw: number };
  velocity: { x: number; y: number; z: number };
  rotorRpmPercent: number;
  flightMode: string;
  lastUpdate: number;
}

export interface MultiplayerPacket {
  type: "JOIN" | "STATE" | "LEAVE" | "CHAT" | "SPAWN_RESERVE";
  playerId: string;
  callsign: string;
  data: any;
  timestamp: number;
}
