// ==========================================================
// DRONE PILOT — DENSE INSTANCED 3D GRASS SYSTEM (PUBG-GRADE)
// 12,000+ cross-quad instances with wind-wave vertex shader animation
// ==========================================================

import * as THREE from "three";
import { evaluateIslandElevation } from "@/lib/world/terrain-math";

export class InstancedGrass {
  public group = new THREE.Group();
  private instancedMesh!: THREE.InstancedMesh;
  private customMaterial!: THREE.MeshStandardMaterial;
  private timeUniform = { value: 0 };
  private dronePosUniform = { value: new THREE.Vector3(0, 100, 0) };

  constructor(instanceCount = 14000) {
    this.buildGrassMesh(instanceCount);
  }

  /**
   * Generates a 3-blade cross-quad geometry for full 360-degree volumetric thickness
   */
  private createCrossQuadGeometry(): THREE.BufferGeometry {
    const w = 1.1; // Width of tuft
    const h = 0.95; // Height of tuft

    // 3 intersecting vertical planes at 0, 60, and 120 degrees
    const positions: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    const angles = [0, Math.PI / 3, (Math.PI * 2) / 3];

    angles.forEach((angle, planeIdx) => {
      const cos = Math.cos(angle) * (w / 2);
      const sin = Math.sin(angle) * (w / 2);

      const baseVertex = planeIdx * 4;

      // 4 vertices per quad: bottom-left, bottom-right, top-right, top-left
      positions.push(-cos, 0, -sin); // BL
      positions.push(cos, 0, sin); // BR
      positions.push(cos, h, sin); // TR
      positions.push(-cos, h, -sin); // TL

      uvs.push(0, 0);
      uvs.push(1, 0);
      uvs.push(1, 1);
      uvs.push(0, 1);

      // Normal pointing outward perpendicular
      const nx = -Math.sin(angle);
      const nz = Math.cos(angle);
      for (let k = 0; k < 4; k++) {
        normals.push(nx, 0.4, nz);
      }

      // Two triangles
      indices.push(baseVertex, baseVertex + 1, baseVertex + 2);
      indices.push(baseVertex, baseVertex + 2, baseVertex + 3);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    return geo;
  }

  /**
   * Generates or loads a high-definition grass tuft texture with alpha silhouette
   */
  private createGrassTexture(): { diffuse: THREE.Texture; alpha: THREE.Texture } {
    const size = 256;

    // Procedural diffuse canvas
    const canvasDiff = document.createElement("canvas");
    canvasDiff.width = size;
    canvasDiff.height = size;
    const ctxD = canvasDiff.getContext("2d");

    // Procedural alpha canvas
    const canvasAlpha = document.createElement("canvas");
    canvasAlpha.width = size;
    canvasAlpha.height = size;
    const ctxA = canvasAlpha.getContext("2d");

    if (ctxD && ctxA) {
      ctxD.fillStyle = "#1e3012";
      ctxD.fillRect(0, 0, size, size);

      ctxA.fillStyle = "#000000";
      ctxA.fillRect(0, 0, size, size);

      // Draw dense multi-tone grass blades
      const bladeColors = ["#4c782b", "#629938", "#385e1e", "#7dbb42", "#2e4a19", "#8bbd4c"];
      const bladeCount = 90;

      for (let b = 0; b < bladeCount; b++) {
        const rootX = (size * 0.1) + Math.random() * (size * 0.8);
        const height = (size * 0.55) + Math.random() * (size * 0.42);
        const curve = (Math.random() - 0.5) * (size * 0.35);
        const tipX = rootX + curve;
        const tipY = size - height;
        const baseWidth = 3 + Math.random() * 5;

        const color = bladeColors[Math.floor(Math.random() * bladeColors.length)];

        // Draw blade on diffuse
        ctxD.beginPath();
        ctxD.moveTo(rootX - baseWidth / 2, size);
        ctxD.quadraticCurveTo(rootX + curve * 0.4, size - height * 0.6, tipX, tipY);
        ctxD.quadraticCurveTo(rootX + curve * 0.6 + baseWidth / 2, size - height * 0.4, rootX + baseWidth / 2, size);
        ctxD.closePath();
        ctxD.fillStyle = color;
        ctxD.fill();

        // Draw blade on alpha mask (white = opaque)
        ctxA.beginPath();
        ctxA.moveTo(rootX - baseWidth / 2, size);
        ctxA.quadraticCurveTo(rootX + curve * 0.4, size - height * 0.6, tipX, tipY);
        ctxA.quadraticCurveTo(rootX + curve * 0.6 + baseWidth / 2, size - height * 0.4, rootX + baseWidth / 2, size);
        ctxA.closePath();
        ctxA.fillStyle = "#ffffff";
        ctxA.fill();
      }
    }

    const diffuse = new THREE.CanvasTexture(canvasDiff);
    diffuse.colorSpace = THREE.SRGBColorSpace;

    const alpha = new THREE.CanvasTexture(canvasAlpha);

    // Also attempt to load the Poly Haven 4K texture asynchronously
    const loader = new THREE.TextureLoader();
    loader.load("/textures/nature/grass_medium_01_diff_4k.jpg", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      this.customMaterial.map = tex;
      this.customMaterial.needsUpdate = true;
    });
    loader.load("/textures/nature/grass_medium_01_alpha_4k.png", (alphaTex) => {
      this.customMaterial.alphaMap = alphaTex;
      this.customMaterial.needsUpdate = true;
    });

    return { diffuse, alpha };
  }

  /**
   * Builds the InstancedMesh with custom wind-sway vertex shader
   */
  private buildGrassMesh(count: number) {
    const geo = this.createCrossQuadGeometry();
    const textures = this.createGrassTexture();

    this.customMaterial = new THREE.MeshStandardMaterial({
      map: textures.diffuse,
      alphaMap: textures.alpha,
      transparent: true,
      alphaTest: 0.35,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
    });

    // Inject wind animation vertex shader
    this.customMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.timeUniform;
      shader.uniforms.uDronePos = this.dronePosUniform;

      shader.vertexShader = `
        uniform float uTime;
        uniform vec3 uDronePos;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>

        // Apply wind sway only to the top vertices (y > 0.05)
        float heightFactor = clamp(position.y / 0.95, 0.0, 1.0);

        // Instance world position
        vec4 instanceWorldPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

        // Wind wave ripple equation
        float windWave = sin(uTime * 2.8 + instanceWorldPos.x * 0.08 + instanceWorldPos.z * 0.06);
        float windGust = cos(uTime * 1.4 + instanceWorldPos.x * 0.03 - instanceWorldPos.z * 0.04) * 0.6;
        float totalWind = (windWave + windGust) * 0.22 * heightFactor;

        transformed.x += totalWind * 0.8;
        transformed.z += totalWind * 0.6;

        // Drone downwash deflection when drone is low overhead
        float distToDrone = distance(instanceWorldPos.xyz, uDronePos);
        if (distToDrone < 12.0) {
          float washStrength = (1.0 - distToDrone / 12.0) * heightFactor;
          vec3 pushDir = normalize(instanceWorldPos.xyz - uDronePos);
          transformed.x += pushDir.x * washStrength * 0.6;
          transformed.z += pushDir.z * washStrength * 0.6;
          transformed.y -= washStrength * 0.2;
        }
        `
      );
    };

    this.instancedMesh = new THREE.InstancedMesh(geo, this.customMaterial, count);
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.castShadow = true;

    // Distribute grass tufts across the island
    const dummy = new THREE.Object3D();
    let placed = 0;

    // Distribute clusters:
    // 1. High density in Central Training Area & Academy Grounds (radius 180m)
    // 2. High density in Forest region & River Valley
    // 3. Medium density across meadows and hills
    while (placed < count) {
      // Pick a random spot across the 1800m island
      let x = 0;
      let z = 0;

      // 40% placed in academy/training fields
      if (Math.random() < 0.4) {
        const rad = 25 + Math.random() * 160;
        const ang = Math.random() * Math.PI * 2;
        x = Math.cos(ang) * rad;
        z = Math.sin(ang) * rad;
      } else {
        x = (Math.random() - 0.5) * 1600;
        z = (Math.random() - 0.5) * 1500;
      }

      // Avoid runway and helipad tarmac
      const distToRunway = Math.hypot(x - 20, z - (-40));
      if (distToRunway < 22) continue; // runway clearing
      const distToCenterPad = Math.hypot(x, z);
      if (distToCenterPad < 9) continue; // helipad clearing

      const sample = evaluateIslandElevation(x, z);

      // Grass only grows between 0.8m and 32m elevation, on gentle slopes, and not under water
      if (sample.elevation < 0.8 || sample.elevation > 38 || sample.slope > 0.45) {
        continue;
      }

      const scale = 0.75 + Math.random() * 0.65;
      dummy.position.set(x, sample.elevation, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.1,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.1
      );
      dummy.scale.set(scale, scale * (0.9 + Math.random() * 0.3), scale);
      dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.instancedMesh);
  }

  /**
   * Update wind swaying and drone downwash displacement every frame
   */
  public update(dt: number, elapsed: number, dronePos?: THREE.Vector3) {
    this.timeUniform.value = elapsed;
    if (dronePos) {
      this.dronePosUniform.value.copy(dronePos);
    }
  }
}
