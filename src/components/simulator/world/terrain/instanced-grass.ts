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

  constructor(instanceCount = 28000) {
    this.buildGrassMesh(instanceCount);
  }

  /**
   * Generates a 3-blade cross-quad geometry for full 360-degree volumetric thickness
   */
  private createCrossQuadGeometry(): THREE.BufferGeometry {
    const w = 1.7; // Width of tuft
    const h = 1.35; // Height of tuft

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
      ctxD.fillStyle = "#2d4a1d";
      ctxD.fillRect(0, 0, size, size);

      ctxA.fillStyle = "#000000";
      ctxA.fillRect(0, 0, size, size);

      // Draw dense multi-tone lush stylized grass blades
      const bladeColors = ["#4d7c0f", "#65a30d", "#84cc16", "#3f6212", "#a3e635", "#558b1a"];
      const bladeCount = 110;

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

        // Visibly rolling wind wave ripples across meadows
        float wave1 = sin(uTime * 3.2 + instanceWorldPos.x * 0.05 + instanceWorldPos.z * 0.04);
        float wave2 = sin(uTime * 5.2 + instanceWorldPos.x * 0.11 - instanceWorldPos.z * 0.08) * 0.42;
        float gust = cos(uTime * 1.5 + instanceWorldPos.x * 0.025 + instanceWorldPos.z * 0.02) * 0.65;
        float totalWind = (wave1 + wave2 + gust) * 0.48 * heightFactor;

        transformed.x += totalWind * 0.85;
        transformed.z += totalWind * 0.55;

        // Drone downwash deflection when drone is low overhead
        float distToDrone = distance(instanceWorldPos.xyz, uDronePos);
        if (distToDrone < 14.0) {
          float washStrength = (1.0 - distToDrone / 14.0) * heightFactor;
          vec3 pushDir = normalize(instanceWorldPos.xyz - uDronePos);
          transformed.x += pushDir.x * washStrength * 0.85;
          transformed.z += pushDir.z * washStrength * 0.85;
          transformed.y -= washStrength * 0.35;
        }
        `
      );
    };

    this.instancedMesh = new THREE.InstancedMesh(geo, this.customMaterial, count);
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.castShadow = true;

    this.repositionGrassGrid(0, 0);
    this.group.add(this.instancedMesh);
  }

  private lastGridCenter = new THREE.Vector2(9999, 9999);

  /**
   * Repositions dense grass tufts within an 85m radius around the drone
   */
  private repositionGrassGrid(centerX: number, centerZ: number) {
    const dummy = new THREE.Object3D();
    const count = this.instancedMesh.count;
    const gridSide = Math.floor(Math.sqrt(count)); // ~167x167 = 27889
    const spacing = 2.1; // 2.1m spacing covers 350m diameter
    const halfSpan = (gridSide * spacing) / 2;

    let index = 0;
    for (let gx = 0; gx < gridSide && index < count; gx++) {
      for (let gz = 0; gz < gridSide && index < count; gz++) {
        // Jittered grid placement
        const jitterX = (Math.sin(gx * 12.3 + gz * 4.7) * 0.5) * spacing;
        const jitterZ = (Math.cos(gx * 5.1 - gz * 8.9) * 0.5) * spacing;

        const x = centerX - halfSpan + gx * spacing + jitterX;
        const z = centerZ - halfSpan + gz * spacing + jitterZ;

        const distFromCenter = Math.hypot(x - centerX, z - centerZ);
        if (distFromCenter > halfSpan) {
          // Outside circle - hide
          dummy.position.set(0, -999, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(index++, dummy.matrix);
          continue;
        }

        // Avoid runway and helipads
        const distToRunway = Math.hypot(x - 20, z - (-40));
        const distToCenterPad = Math.hypot(x, z);
        if (distToRunway < 18 || distToCenterPad < 8) {
          dummy.position.set(0, -999, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(index++, dummy.matrix);
          continue;
        }

        const sample = evaluateIslandElevation(x, z);

        // Don't spawn on water or cliff rocks
        if (sample.elevation < 0.6 || sample.slope > 0.5) {
          dummy.position.set(0, -999, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(index++, dummy.matrix);
          continue;
        }

        // Distance fade at outer perimeter
        const fade = Math.max(0.3, 1.0 - (distFromCenter / halfSpan) * 0.5);
        const scale = (1.0 + Math.abs(Math.sin(gx * 3.3 + gz)) * 0.5) * fade;

        dummy.position.set(x, sample.elevation, z);
        dummy.rotation.set(
          (Math.sin(gx) * 0.08),
          (gx * 17 + gz * 23) % Math.PI,
          (Math.cos(gz) * 0.08)
        );
        dummy.scale.set(scale, scale * 1.3, scale);
        dummy.updateMatrix();

        this.instancedMesh.setMatrixAt(index++, dummy.matrix);
      }
    }

    // Hide any remaining instances
    while (index < count) {
      dummy.position.set(0, -999, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(index++, dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.lastGridCenter.set(centerX, centerZ);
  }

  /**
   * Update wind swaying and drone downwash displacement every frame,
   * and dynamically shift the dense grass clipmap as the drone flies
   */
  public update(_dt: number, elapsed: number, dronePos?: THREE.Vector3) {
    this.timeUniform.value = elapsed;
    if (dronePos) {
      this.dronePosUniform.value.copy(dronePos);

      // Reposition grass clipmap around the drone when moving > 4.5m
      const distMoved = this.lastGridCenter.distanceTo(new THREE.Vector2(dronePos.x, dronePos.z));
      if (distMoved > 4.5) {
        this.repositionGrassGrid(dronePos.x, dronePos.z);
      }
    }
  }
}
