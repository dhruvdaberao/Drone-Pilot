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
    // Sky color and aerial perspective distance fog
    scene.background = new THREE.Color(0xbfe3f7);
    scene.fog = new THREE.FogExp2(0xcde6f7, 0.0018);

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.90);
    this.group.add(ambientLight);

    // Primary High-Resolution Sun Directional Light with PCFSoft Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffaea, 2.5);
    this.sunLight.position.set(120, 200, 90);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 650;
    this.sunLight.shadow.camera.left = -220;
    this.sunLight.shadow.camera.right = 220;
    this.sunLight.shadow.camera.top = 220;
    this.sunLight.shadow.camera.bottom = -220;
    this.sunLight.shadow.bias = -0.0004;
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

    const cloudClusterConfigs = [
      { x: -280, y: 95, z: -200, scale: 1.4 },
      { x: -160, y: 115, z: -310, scale: 1.2 },
      { x: -60, y: 105, z: -150, scale: 1.0 },
      { x: 80, y: 120, z: -250, scale: 1.6 },
      { x: 220, y: 100, z: -180, scale: 1.3 },
      { x: 340, y: 115, z: -80, scale: 1.5 },
      { x: -320, y: 108, z: 20, scale: 1.3 },
      { x: -190, y: 110, z: 90, scale: 1.1 },
      { x: -40, y: 125, z: 120, scale: 1.5 },
      { x: 110, y: 98, z: 60, scale: 1.2 },
      { x: 260, y: 112, z: 140, scale: 1.4 },
      { x: -260, y: 118, z: 260, scale: 1.3 },
      { x: -110, y: 102, z: 320, scale: 1.5 },
      { x: 50, y: 110, z: 240, scale: 1.1 },
      { x: 190, y: 125, z: 300, scale: 1.6 },
      { x: 310, y: 100, z: 280, scale: 1.3 },
      { x: 0, y: 130, z: -350, scale: 1.7 },
      { x: 0, y: 120, z: 0, scale: 1.2 },
    ];

    const puffOffsets = [
      { x: 0, y: 0, z: 0, r: 10 },
      { x: 8, y: 1.5, z: 2, r: 8.5 },
      { x: -8, y: 1, z: -2, r: 8.5 },
      { x: 3, y: 4.5, z: -1, r: 7.5 },
      { x: -4, y: 4, z: 1, r: 7 },
      { x: 14, y: -1, z: 1, r: 6.5 },
      { x: -13, y: -0.5, z: 2, r: 6.5 },
      { x: 0, y: -2, z: 6, r: 6 },
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
