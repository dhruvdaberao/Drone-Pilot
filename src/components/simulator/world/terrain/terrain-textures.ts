// ==========================================================
// DRONE PILOT — REALISTIC TERRAIN TEXTURE & MATERIAL SYSTEM
// Provides high-resolution procedural PBR textures & Poly Haven texture loaders
// ==========================================================

import * as THREE from "three";

export class TerrainTextures {
  private static grassTexture: THREE.CanvasTexture | null = null;
  private static rockTexture: THREE.CanvasTexture | null = null;
  private static sandTexture: THREE.CanvasTexture | null = null;
  private static tarmacTexture: THREE.CanvasTexture | null = null;
  private static helipadTexture: THREE.CanvasTexture | null = null;
  private static normalTexture: THREE.CanvasTexture | null = null;

  /**
   * Generates a tactile micro-surface albedo texture with natural organic grain.
   * Modulates luminance so that vertex color splatting accurately displays rock, sand, scree, and grass.
   */
  public static getGrassTexture(): THREE.CanvasTexture {
    if (this.grassTexture) return this.grassTexture;

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Lush, organic meadow green base with depth
      ctx.fillStyle = "#385e25";
      ctx.fillRect(0, 0, size, size);

      // Multi-tone organic grass blade fibers & turf texture
      const grassShades = [
        "#2e4f1e",
        "#436e2d",
        "#4e7f35",
        "#3a6227",
        "#578d3b",
        "#274218",
        "#629b43",
        "#6fa94b",
      ];
      for (let i = 0; i < 45000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = 1 + Math.random() * 2.0;
        const h = 2.5 + Math.random() * 5.0;
        ctx.fillStyle = grassShades[Math.floor(Math.random() * grassShades.length)];
        ctx.fillRect(x, y, w, h);
      }

      // Earthy humus & fine loam soil specks
      ctx.fillStyle = "rgba(45, 35, 20, 0.15)";
      for (let i = 0; i < 1800; i++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const r = 1.0 + Math.random() * 3.0;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(120, 120);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.grassTexture = tex;
    return tex;
  }

  /**
   * Weathered granite rock cliff texture with stratified geological layers
   */
  public static getRockTexture(): THREE.CanvasTexture {
    if (this.rockTexture) return this.rockTexture;

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Base dark granite gray
      ctx.fillStyle = "#4a4947";
      ctx.fillRect(0, 0, size, size);

      // Horizontal geological strata
      for (let y = 0; y < size; y += 4) {
        const shade = 60 + Math.sin(y * 0.08) * 18 + (Math.random() * 20 - 10);
        ctx.fillStyle = `rgb(${Math.round(shade)}, ${Math.round(shade * 0.96)}, ${Math.round(shade * 0.92)})`;
        ctx.fillRect(0, y, size, 4);
      }

      // High frequency rock roughness & fracture fissures
      for (let i = 0; i < 9000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const val = Math.random() > 0.5 ? 200 : 30;
        ctx.fillStyle = `rgba(${val}, ${val}, ${val}, 0.18)`;
        ctx.fillRect(x, y, 2 + Math.random() * 4, 1 + Math.random() * 2);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(40, 40);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.rockTexture = tex;
    return tex;
  }

  /**
   * Warm coastal beach sand texture with subtle moisture gradient
   */
  public static getSandTexture(): THREE.CanvasTexture {
    if (this.sandTexture) return this.sandTexture;

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Golden dune sand base
      ctx.fillStyle = "#d8be8a";
      ctx.fillRect(0, 0, size, size);

      // Fine sand grain noise
      const tones = ["#cbb07c", "#e2c997", "#bfa46e", "#e8d3a3", "#a88e5b"];
      for (let i = 0; i < 35000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(60, 60);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.sandTexture = tex;
    return tex;
  }

  /**
   * Runway asphalt tarmac with painted aviation striping
   */
  public static getTarmacTexture(): THREE.CanvasTexture {
    if (this.tarmacTexture) return this.tarmacTexture;

    const width = 512;
    const height = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Dark asphalt pavement
      ctx.fillStyle = "#1e2226";
      ctx.fillRect(0, 0, width, height);

      // Asphalt aggregate grain noise
      for (let i = 0; i < 20000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const c = 25 + Math.random() * 25;
        ctx.fillStyle = `rgb(${c}, ${c}, ${c})`;
        ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }

      // Runway white side boundary lines (continuous)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(24, 0, 10, height);
      ctx.fillRect(width - 34, 0, 10, height);

      // Runway centerline dashed stripes (FAA standard)
      ctx.fillStyle = "#ffffff";
      const dashLen = 140;
      const gapLen = 100;
      for (let y = 30; y < height; y += dashLen + gapLen) {
        ctx.fillRect(width / 2 - 8, y, 16, dashLen);
      }

      // Yellow taxiway guideline
      ctx.fillStyle = "#d4a017";
      ctx.fillRect(width / 4 - 3, 0, 6, height);
      ctx.fillRect((width * 3) / 4 - 3, 0, 6, height);

      // Touchdown zone threshold bars (piano keys)
      ctx.fillStyle = "#ffffff";
      for (let bar = 0; bar < 6; bar++) {
        ctx.fillRect(45 + bar * 24, 40, 14, 120);
        ctx.fillRect(width - 170 + bar * 24, 40, 14, 120);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 10);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.tarmacTexture = tex;
    return tex;
  }

  /**
   * Clean circular helipad with crisp H, yellow caution ring, and red perimeter ring
   */
  public static getHelipadTexture(): THREE.CanvasTexture {
    if (this.helipadTexture) return this.helipadTexture;

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Dark tarmac circular base
      ctx.fillStyle = "#22262a";
      ctx.fillRect(0, 0, size, size);

      // Aggregate texture
      for (let i = 0; i < 15000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const c = 28 + Math.random() * 20;
        ctx.fillStyle = `rgb(${c}, ${c}, ${c})`;
        ctx.fillRect(x, y, 2, 2);
      }

      const cx = size / 2;
      const cy = size / 2;

      // Red outer safety ring
      ctx.strokeStyle = "#c82333";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(cx, cy, 230, 0, Math.PI * 2);
      ctx.stroke();

      // Yellow caution ring
      ctx.strokeStyle = "#ffc107";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 200, 0, Math.PI * 2);
      ctx.stroke();

      // Inner white ring
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, 150, 0, Math.PI * 2);
      ctx.stroke();

      // Bold white central "H"
      ctx.fillStyle = "#ffffff";
      // Left vertical
      ctx.fillRect(cx - 70, cy - 80, 26, 160);
      // Right vertical
      ctx.fillRect(cx + 44, cy - 80, 26, 160);
      // Crossbar
      ctx.fillRect(cx - 70, cy - 14, 140, 28);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.helipadTexture = tex;
    return tex;
  }

  /**
   * High-frequency micro-relief normal map for tactile specular lighting
   */
  public static getTerrainNormalMap(): THREE.CanvasTexture {
    if (this.normalTexture) return this.normalTexture;

    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Default flat tangent-space normal (pointing +Z: [128, 128, 255])
      ctx.fillStyle = "#8080ff";
      ctx.fillRect(0, 0, size, size);

      // Micro-bumps & fine surface perturbations
      for (let i = 0; i < 9000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const nx = 128 + (Math.random() * 40 - 20);
        const ny = 128 + (Math.random() * 40 - 20);
        ctx.fillStyle = `rgb(${Math.round(nx)}, ${Math.round(ny)}, 255)`;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(80, 80);
    this.normalTexture = tex;
    return tex;
  }
}
