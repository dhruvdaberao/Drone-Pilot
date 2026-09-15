// ==========================================================
// DRONE PILOT — 3D HELIPAD MESH GENERATOR (PUBG-GRADE)
// Realistic concrete/steel landing slab with high-contrast PBR target texture & perimeter LEDs
// ==========================================================

import * as THREE from "three";
import { Helipad } from "@/lib/world/world-types";
import { TerrainTextures } from "./terrain/terrain-textures";

export function createHelipadMesh(helipad: Helipad): THREE.Group {
  const group = new THREE.Group();
  group.position.set(helipad.position.x, 0, helipad.position.z);
  group.rotation.y = (helipad.headingDeg * Math.PI) / 180;

  const radius = helipad.dimensions.radius || helipad.dimensions.width / 2;
  const padHeight = 0.28; // 28cm thick reinforced foundation slab
  const surfaceY = helipad.elevation;
  const centerY = surfaceY - padHeight / 2;

  // 1. Platform Base Cylinder Slab
  const colorBySurface: Record<string, number> = {
    concrete: 0x1f242b,
    steel: 0x334155,
    wood: 0x4a3525,
    turf: 0x2e4a1f,
    rooftop: 0x1e293b,
  };

  const slabMat = new THREE.MeshStandardMaterial({
    color: colorBySurface[helipad.surfaceType] || 0x1f242b,
    roughness: helipad.surfaceType === "steel" ? 0.35 : 0.85,
    metalness: helipad.surfaceType === "steel" ? 0.75 : 0.1,
  });

  const slabGeo = new THREE.CylinderGeometry(radius, radius * 1.04, padHeight, 32);
  const slabMesh = new THREE.Mesh(slabGeo, slabMat);
  slabMesh.position.y = centerY;
  slabMesh.receiveShadow = true;
  group.add(slabMesh);

  // 2. High-Contrast PBR Helipad Surface Disc with "H", yellow caution circle & red safety ring
  const helipadTex = TerrainTextures.getHelipadTexture();
  const surfaceMat = new THREE.MeshStandardMaterial({
    map: helipadTex,
    roughness: 0.75,
    metalness: 0.12,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const surfaceGeo = new THREE.CircleGeometry(radius * 0.99, 32);
  surfaceGeo.rotateX(-Math.PI / 2);
  const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
  surfaceMesh.position.y = surfaceY + 0.005;
  surfaceMesh.receiveShadow = true;
  group.add(surfaceMesh);

  // 3. Perimeter LED Inset Lights (8 cardinal and diagonal markers)
  const lightGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.25, 8);
  const lightHousingMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });

  const bulbColor = helipad.regionId === "training" ? 0x22c55e : 0xf59e0b;
  const bulbMat = new THREE.MeshStandardMaterial({
    color: bulbColor,
    emissive: bulbColor,
    emissiveIntensity: 2.2,
  });

  const numLights = 8;
  for (let i = 0; i < numLights; i++) {
    const angle = (i / numLights) * Math.PI * 2;
    const lx = Math.cos(angle) * (radius * 0.92);
    const lz = Math.sin(angle) * (radius * 0.92);

    const fixture = new THREE.Mesh(lightGeo, lightHousingMat);
    fixture.position.set(lx, surfaceY + 0.12, lz);
    group.add(fixture);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), bulbMat);
    bulb.position.set(lx, surfaceY + 0.25, lz);
    group.add(bulb);
  }

  return group;
}
