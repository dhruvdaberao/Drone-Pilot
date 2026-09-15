# DRONE PILOT — Asset & Material Licensing Declaration

This document records the licensing, provenance, and legal clearance for all 3D assets, textures, materials, and procedural shaders used in **DRONE PILOT**.

---

## 1. World & Terrain Assets (Step 1 – Step 3)

### Procedural Terrain Heightfield & Biome Splatting
* **Files**:
  * `src/lib/world/terrain-math.ts`
  * `src/components/simulator/world/terrain/terrain-system.ts`
* **Source**: Custom procedural mathematical models created specifically for the DRONE PILOT simulator.
* **License**: MIT License (included in project repository).
* **Usage**: Deterministic multi-harmonic coastline, regional elevation profiles, slope calculations, and PBR vertex color splatting.

### Ocean & Freshwater Meshes
* **Files**:
  * `src/components/simulator/world/water/ocean-mesh.ts`
  * `src/components/simulator/world/water/freshwater-mesh.ts`
  * `src/components/simulator/world/water/water-system.ts`
* **Source**: Custom procedural Three.js water geometries with dynamic sine/cosine vertex wave displacements.
* **License**: MIT License.
* **Usage**: $4000\text{m} \times 4000\text{m}$ ocean plane, turquoise shallow shelf, Crystal Mountain Lake, and Valley River corridor.

### Physical Helipads & Markings
* **Files**:
  * `src/components/simulator/world/helipad-mesh.ts`
  * `src/lib/world/helipad-definitions.ts`
* **Source**: Procedural Three.js geometry generators matching standard ICAO / FAA heliport markings.
* **License**: MIT License.
* **Usage**: Concrete launch platforms, perimeter threshold LED lights, and high-visibility aviation markings.

---

## 2. External 3D Models & Future Assets Policy
In accordance with project standards:
* Any future external 3D models or textures must strictly originate from legally permitted free sources:
  1. **Poly Haven** (CC0 Public Domain)
  2. **Quaternius** (CC0 Public Domain)
  3. **Kenney** (CC0 Public Domain)
* **Strictly Prohibited**:
  * Ripped game assets (GTA, PUBG, Flight Simulator, etc.)
  * Copyrighted models with non-commercial or unclear licenses
  * Random unverified images from search engines