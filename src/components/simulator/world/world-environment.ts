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
    // Atmospheric sky color and natural aerial perspective distance fog (700m to 5200m)
    scene.background = new THREE.Color(0xbbe4f9);
    scene.fog = new THREE.Fog(0xcfe7f8, 700, 5200);

    // Balanced Ambient Lighting for realistic shadow contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.group.add(ambientLight);

    // Primary High-Resolution Sun Directional Light with PCFSoft Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffaee, 2.6);
    this.sunLight.position.set(220, 360, 160);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 850;
    this.sunLight.shadow.camera.left = -320;
    this.sunLight.shadow.camera.right = 320;
    this.sunLight.shadow.camera.top = 320;
    this.sunLight.shadow.camera.bottom = -320;
    this.sunLight.shadow.bias = -0.0003;
    this.group.add(this.sunLight);

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

    // Hemisphere Light (Sky Blue to Ground Slate)
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x334155, 0.65);
    this.group.add(this.hemiLight);
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

  public update(dt: number, _elapsed: number) {
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
