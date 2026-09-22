// ==========================================================
// DRONE PILOT — WORLD ENVIRONMENT
// Sky, atmosphere, sun, lighting, shadows, and procedural clouds
// ==========================================================

import * as THREE from "three";

export class WorldEnvironment {
  public group = new THREE.Group();
  private cloudClusters: THREE.Group[] = [];
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  constructor(scene: THREE.Scene) {
    this.buildAtmosphere(scene);
    this.buildSkyClouds();
    scene.add(this.group);
  }

  private buildAtmosphere(scene: THREE.Scene) {
    // Atmospheric sky color and natural aerial perspective distance fog (400m to 4800m)
    scene.background = new THREE.Color(0xb8d9f5);
    scene.fog = new THREE.Fog(0xc5dff7, 400, 4800);

    // Build Atmospheric Sky Dome with Rayleigh gradient and Mie solar scattering
    const sunDir = new THREE.Vector3(120, 200, 90).normalize();
    this.buildSkyDome(sunDir);

    // Balanced Ambient Lighting for rich, non-washed-out shadow contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
    this.group.add(ambientLight);

    // Primary High-Resolution Sun Directional Light with Dynamic Follow Shadow Frustum
    this.sunLight = new THREE.DirectionalLight(0xfffae8, 2.5);
    this.sunLight.position.set(220, 360, 160);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 900;
    this.sunLight.shadow.camera.left = -260;
    this.sunLight.shadow.camera.right = 260;
    this.sunLight.shadow.camera.top = 260;
    this.sunLight.shadow.camera.bottom = -260;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.04;
    this.group.add(this.sunLight);
    this.group.add(this.sunLight.target);

    // Radiant Visual Sun with Core Disk and Atmospheric Corona Glow
    const sunGroup = new THREE.Group();
    const sunDist = 3200;
    sunGroup.position.copy(sunDir.clone().multiplyScalar(sunDist));

    // 1. Blinding Sun Core Disk
    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(65, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    sunGroup.add(sunCore);

    // 2. Radiant Inner Solar Corona
    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(120, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfff5cc,
        transparent: true,
        opacity: 0.45,
        side: THREE.BackSide,
      })
    );
    sunGroup.add(corona);

    // 3. Expansive Golden Atmospheric Halo
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(240, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffb74d,
        transparent: true,
        opacity: 0.18,
        side: THREE.BackSide,
      })
    );
    sunGroup.add(halo);

    this.group.add(sunGroup);

    // Hemisphere Light (Sky Warm Azure to Ground Earth Slate)
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x475569, 0.58);
    this.group.add(this.hemiLight);
  }

  /**
   * Sky dome with continuous vertical atmospheric gradient and directional Mie sun scattering
   */
  private buildSkyDome(sunDir: THREE.Vector3) {
    const skyGeo = new THREE.SphereGeometry(4600, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x1a66cc) },      // Deep rich zenith blue
        midColor: { value: new THREE.Color(0x60a5fa) },      // Vibrant sky blue
        horizonColor: { value: new THREE.Color(0xcde3fa) },  // Soft horizon haze
        bottomColor: { value: new THREE.Color(0x94b8db) },   // Ground reflection
        sunDir: { value: sunDir },
        sunGlowColor: { value: new THREE.Color(0xfff3d0) },  // Warm golden sun flare
        offset: { value: 60.0 },
        exponent: { value: 0.72 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        uniform vec3 sunDir;
        uniform vec3 sunGlowColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;

        void main() {
          vec3 viewDir = normalize(vWorldPosition);
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          vec3 sky;
          if (h > 0.0) {
            float t = pow(h, exponent);
            sky = mix(horizonColor, mix(midColor, topColor, t * 0.75), t);
          } else {
            sky = mix(horizonColor, bottomColor, clamp(-h * 4.0, 0.0, 1.0));
          }

          // Forward Mie scattering bloom around sun position
          float cosTheta = dot(viewDir, sunDir);
          if (cosTheta > 0.0) {
            float mie = pow(cosTheta, 64.0) * 0.35 + pow(cosTheta, 256.0) * 0.6 + pow(cosTheta, 1024.0) * 0.8;
            sky += sunGlowColor * mie;
          }

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    });

    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(skyMesh);
  }

  private buildSkyClouds() {
    const cloudsContainer = new THREE.Group();

    // Soft billowy cumulus cloud material with sunlit ambient luminescence
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.06,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    });

    // Realistic high-altitude cloud decks (300m - 460m) well above Mount Apex (145m)
    const cloudClusterConfigs = [
      { x: -950, y: 340, z: -800, scale: 2.5 },
      { x: -620, y: 380, z: -1100, scale: 2.9 },
      { x: -280, y: 310, z: -550, scale: 2.3 },
      { x: 150, y: 355, z: -750, scale: 2.6 },
      { x: 680, y: 390, z: -620, scale: 2.4 },
      { x: 1100, y: 320, z: -300, scale: 2.8 },
      { x: -1100, y: 340, z: 100, scale: 2.7 },
      { x: -750, y: 325, z: 420, scale: 2.2 },
      { x: -350, y: 390, z: 250, scale: 2.9 },
      { x: 200, y: 360, z: 180, scale: 2.4 },
      { x: 750, y: 330, z: 450, scale: 2.8 },
      { x: 1200, y: 370, z: 650, scale: 3.0 },
      { x: -500, y: 335, z: 900, scale: 2.5 },
      { x: 0, y: 380, z: 800, scale: 2.9 },
      { x: 450, y: 340, z: 1050, scale: 2.6 },
      { x: -150, y: 410, z: -150, scale: 3.1 },
    ];

    // Cumulus puff layout with flattened base and billowing domes
    const puffOffsets = [
      { x: 0, y: 0, z: 0, rx: 22, ry: 12, rz: 20 },
      { x: 16, y: 4, z: 6, rx: 18, ry: 13, rz: 16 },
      { x: -16, y: 3, z: -5, rx: 18, ry: 12, rz: 17 },
      { x: 6, y: 10, z: -2, rx: 15, ry: 14, rz: 14 },
      { x: -7, y: 9, z: 4, rx: 14, ry: 13, rz: 13 },
      { x: 28, y: -1, z: 3, rx: 14, ry: 9, rz: 12 },
      { x: -26, y: -1, z: 5, rx: 14, ry: 9, rz: 13 },
      { x: 2, y: -2, z: 16, rx: 13, ry: 8, rz: 12 },
      { x: -2, y: -2, z: -16, rx: 13, ry: 8, rz: 12 },
    ];

    cloudClusterConfigs.forEach((coord) => {
      const cluster = new THREE.Group();
      cluster.position.set(coord.x, coord.y, coord.z);

      puffOffsets.forEach((p) => {
        // Smooth spherical cumulus puff flattened slightly on Y
        const puffGeo = new THREE.SphereGeometry(1, 14, 10);
        puffGeo.scale(p.rx * coord.scale, p.ry * coord.scale, p.rz * coord.scale);

        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(p.x * coord.scale, p.y * coord.scale, p.z * coord.scale);
        cluster.add(puff);
      });

      this.cloudClusters.push(cluster);
      cloudsContainer.add(cluster);
    });

    this.group.add(cloudsContainer);
  }

  public update(dt: number, _elapsed: number, dronePos?: THREE.Vector3) {
    // Dynamic follow-shadow: Keep shadow frustum centered around active drone anywhere on the island
    if (dronePos) {
      const sunOffsetX = 220;
      const sunOffsetY = 360;
      const sunOffsetZ = 160;
      this.sunLight.position.set(
        dronePos.x + sunOffsetX,
        dronePos.y + sunOffsetY,
        dronePos.z + sunOffsetZ
      );
      this.sunLight.target.position.set(dronePos.x, dronePos.y, dronePos.z);
      this.sunLight.target.updateMatrixWorld();
    }

    // Atmospheric cloud drift (~2.2 m/s) across whole 2800m island sky
    for (let i = 0; i < this.cloudClusters.length; i++) {
      const cluster = this.cloudClusters[i];
      cluster.position.x += dt * 2.2;
      if (cluster.position.x > 1400) {
        cluster.position.x = -1400;
      }
    }
  }
}
