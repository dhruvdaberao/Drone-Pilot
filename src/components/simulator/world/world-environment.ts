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

    // Build Atmospheric Sky Dome with vertical Rayleigh scattering gradient
    this.buildSkyDome();

    // Balanced Ambient Lighting for rich, non-washed-out shadow contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
    this.group.add(ambientLight);

    // Primary High-Resolution Sun Directional Light with Dynamic Follow Shadow Frustum
    this.sunLight = new THREE.DirectionalLight(0xfffae8, 2.4);
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

    // 3D Visual Glowing Sun in Sky Dome
    const sunGroup = new THREE.Group();
    const sunDir = new THREE.Vector3(120, 200, 90).normalize();
    const sunDist = 430;
    sunGroup.position.copy(sunDir.clone().multiplyScalar(sunDist));

    // 1. Sun Core
    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(18, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    sunGroup.add(sunCore);

    // 2. Inner Golden Corona
    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(30, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xffea79,
        transparent: true,
        opacity: 0.55,
        side: THREE.BackSide,
      })
    );
    sunGroup.add(corona);

    // 3. Outer Warm Atmospheric Halo
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(50, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff9900,
        transparent: true,
        opacity: 0.22,
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
   * Sky dome with continuous vertical atmospheric gradient
   */
  private buildSkyDome() {
    const skyGeo = new THREE.SphereGeometry(4600, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x1d64c2) },      // Deep vibrant zenith blue
        midColor: { value: new THREE.Color(0x60a5fa) },      // Soft mid sky blue
        horizonColor: { value: new THREE.Color(0xcbe6fa) },  // Warm horizon haze
        bottomColor: { value: new THREE.Color(0xb0cbe3) },   // Ground haze
        offset: { value: 60.0 },
        exponent: { value: 0.75 },
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
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          vec3 sky;
          if (h > 0.0) {
            float t = pow(h, exponent);
            sky = mix(horizonColor, mix(midColor, topColor, t * 0.7), t);
          } else {
            sky = mix(horizonColor, bottomColor, clamp(-h * 4.0, 0.0, 1.0));
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

    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.02,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });

    // Realistic high-altitude cloud decks (280m - 420m) well above Mount Apex (145m)
    const cloudClusterConfigs = [
      { x: -950, y: 310, z: -800, scale: 2.4 },
      { x: -620, y: 340, z: -1100, scale: 2.8 },
      { x: -280, y: 290, z: -550, scale: 2.1 },
      { x: 150, y: 325, z: -750, scale: 2.5 },
      { x: 680, y: 350, z: -620, scale: 2.2 },
      { x: 1100, y: 300, z: -300, scale: 2.6 },
      { x: -1100, y: 320, z: 100, scale: 2.5 },
      { x: -750, y: 295, z: 420, scale: 2.0 },
      { x: -350, y: 360, z: 250, scale: 2.7 },
      { x: 200, y: 330, z: 180, scale: 2.2 },
      { x: 750, y: 310, z: 450, scale: 2.6 },
      { x: 1200, y: 340, z: 650, scale: 2.9 },
      { x: -500, y: 305, z: 900, scale: 2.3 },
      { x: 0, y: 350, z: 800, scale: 2.8 },
      { x: 450, y: 320, z: 1050, scale: 2.4 },
      { x: -150, y: 380, z: -150, scale: 3.0 },
    ];

    const puffOffsets = [
      { x: 0, y: 0, z: 0, r: 16 },
      { x: 14, y: 3, z: 4, r: 13 },
      { x: -14, y: 2, z: -4, r: 13 },
      { x: 5, y: 8, z: -2, r: 11 },
      { x: -6, y: 7, z: 3, r: 10 },
      { x: 24, y: -2, z: 2, r: 10 },
      { x: -22, y: -1, z: 4, r: 10 },
      { x: 0, y: -3, z: 12, r: 9 },
    ];

    cloudClusterConfigs.forEach((coord) => {
      const cluster = new THREE.Group();
      cluster.position.set(coord.x, coord.y, coord.z);

      puffOffsets.forEach((p) => {
        const puff = new THREE.Mesh(
          new THREE.DodecahedronGeometry(p.r * coord.scale, 1),
          cloudMat
        );
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

    // Atmospheric cloud drift (~2.2 m/s)
    for (let i = 0; i < this.cloudClusters.length; i++) {
      const cluster = this.cloudClusters[i];
      cluster.position.x += dt * 2.2;
      if (cluster.position.x > 460) {
        cluster.position.x = -460;
      }
    }
  }
}
