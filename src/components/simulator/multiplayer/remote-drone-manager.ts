import * as THREE from "three";
import { RemotePlayerState } from "@/lib/multiplayer/multiplayer-types";

interface RemoteDroneInstance {
  group: THREE.Group;
  rotors: THREE.Group[];
  targetPos: THREE.Vector3;
  targetRot: THREE.Euler;
  currentPos: THREE.Vector3;
  currentRot: THREE.Euler;
}

export class RemoteDroneManager {
  public group = new THREE.Group();
  private drones: Map<string, RemoteDroneInstance> = new Map();

  constructor() {}

  public update(remotePlayers: RemotePlayerState[], dt: number) {
    const activeIds = new Set(remotePlayers.map((p) => p.playerId));

    for (const [id, instance] of this.drones.entries()) {
      if (!activeIds.has(id)) {
        this.group.remove(instance.group);
        this.drones.delete(id);
      }
    }

    for (const p of remotePlayers) {
      let instance = this.drones.get(p.playerId);
      if (!instance) {
        instance = this.createRemoteDroneMesh(p.callsign);
        this.drones.set(p.playerId, instance);
        this.group.add(instance.group);
      }

      instance.targetPos.set(p.position.x, p.position.y, p.position.z);
      instance.targetRot.set(p.rotation.pitch, p.rotation.yaw, p.rotation.roll);

      instance.currentPos.lerp(instance.targetPos, Math.min(1.0, dt * 15.0));
      instance.group.position.copy(instance.currentPos);

      instance.currentRot.x += (instance.targetRot.x - instance.currentRot.x) * Math.min(1.0, dt * 15.0);
      instance.currentRot.y += (instance.targetRot.y - instance.currentRot.y) * Math.min(1.0, dt * 15.0);
      instance.currentRot.z += (instance.targetRot.z - instance.currentRot.z) * Math.min(1.0, dt * 15.0);
      instance.group.rotation.copy(instance.currentRot);

      const rpmSpeed = (p.rotorRpmPercent / 100) * 45;
      for (const r of instance.rotors) {
        r.rotation.y += rpmSpeed * dt;
      }
    }
  }

  private createRemoteDroneMesh(callsign: string): RemoteDroneInstance {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.32), bodyMat);
    group.add(body);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8), armMat);
    arm1.rotation.z = Math.PI / 4;
    group.add(arm1);

    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8), armMat);
    arm2.rotation.z = -Math.PI / 4;
    group.add(arm2);

    const rotors: THREE.Group[] = [];
    const rotorOffsets = [
      { x: 0.24, z: 0.24 },
      { x: -0.24, z: 0.24 },
      { x: 0.24, z: -0.24 },
      { x: -0.24, z: -0.24 },
    ];

    const propMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    rotorOffsets.forEach((off) => {
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(off.x, 0.05, off.z);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.005, 0.025), propMat);
      rotorGroup.add(blade);
      group.add(rotorGroup);
      rotors.push(rotorGroup);
    });

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.roundRect(0, 0, 256, 64, 16);
      ctx.fill();
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px monospace";
      ctx.textAlign = "center";
      ctx.fillText(callsign, 128, 42);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, 0.45, 0);
    sprite.scale.set(1.2, 0.3, 1);
    group.add(sprite);

    return {
      group,
      rotors,
      targetPos: new THREE.Vector3(),
      targetRot: new THREE.Euler(),
      currentPos: new THREE.Vector3(),
      currentRot: new THREE.Euler(),
    };
  }
}
