# DRONE PILOT // Interactive Drone Simulation & Digital Twin Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black.svg)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r185-green.svg)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**DRONE PILOT** is an advanced interactive drone simulation, digital twin engineering platform, and aviation training laboratory built with Next.js 15, Three.js, and TypeScript. Rather than a conventional video game, DRONE PILOT provides physics-grounded multirotor dynamics, environmental atmosphere modeling, real-time telemetry streaming, failure mode injection, automated flight coaching, and external flight controller bridge architectures.

---

## System Architecture

```text
+-------------------------------------------------------------------------------+
|                           DRONE PILOT WEB APPLICATION                         |
|                     (Next.js 15 App Router + React 19)                        |
+------------------------------------+------------------------------------------+
                                     |
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
+------------------+                                   +-------------------+
|  OPERATOR UI     |                                   |  3D SIMULATION    |
| - Telemetry HUD  |                                   | - Three.js Engine |
| - Digital Twin   |                                   | - Procedural World|
| - Fault Console  |                                   | - Hydrology Mesh  |
| - Flight Coach   |                                   | - Biome Splatting |
+--------+---------+                                   +---------+---------+
         |                                                       |
         | Real-time Telemetry & State Updates                   |
         v                                                       v
+-------------------------------------------------------------------------------+
|                            SIMULATION CORE ENGINE                             |
|                                                                               |
|  +--------------------+   +---------------------+   +----------------------+  |
|  | Flight Physics     |   | Atmosphere & Wind   |   | Fault Injector       |  |
|  | - Motor dynamics   |   | - Dryden turbulence |   | - Motor loss         |  |
|  | - Blade element    |   | - Rotor wash/ground |   | - Sensor freeze/drift|  |
|  | - Rigid-body ODE   |   | - Thermal downdrafts|   | - Actuator lag       |  |
|  +---------+----------+   +----------+----------+   +----------+-----------+  |
|            |                         |                         |              |
|            +-------------------------+-------------------------+              |
|                                      |                                        |
|                                      v                                        |
|                       +------------------------------+                        |
|                       | Telemetry Buffer & Recorder  |                        |
|                       | - 50 Hz FIFO Rolling Stream  |                        |
|                       | - Blackbox Exporter (JSON/CSV)                        |
|                       +--------------+---------------+                        |
+--------------------------------------|----------------------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
+-------------------------------------+ +-------------------------------------+
|      PEER MULTIPLAYER ENGINE        | |   EXTERNAL SIMULATOR ADAPTERS       |
| - WebRTC / PeerJS P2P Mesh          | | - Architecture-Ready Abstract Layer |
| - Host-Authoritative Position Sync  | | - MAVLink v2 & PX4 HITL Protocol    |
| - Remote Drone Spatial Interpolation| | - Gazebo Transport Bridge Contract  |
+-------------------------------------+ +-------------------------------------+
```

---

## Core Capabilities

### 1. High-Fidelity Drone Digital Twin
- **Dynamic Multirotor Configurations**: Quadcopter X, Hexacopter, Octocopter, and Coaxial X8 configurations.
- **Physical Parameter Customization**: All-up weight (AUW), motor $K_v$ ratings, propeller diameter/pitch, battery cell count ($S$), center-of-gravity offsets, and payload mass.
- **Parametric Visual Mesh**: Live 3D model that reflects chosen airframe dimensions, motor layouts, landing gear, and attached sensor payloads (LiDAR, multispectral cameras, searchlights).

### 2. Aerodynamic & Atmospheric Physics
- **Rigid-Body 6-DOF Dynamics**: Symplectic Euler numerical integration resolving translational accelerations ($F = m a$) and rotational Euler rates ($\tau = I \dot{\omega}$).
- **Dryden Wind Turbulence Model**: Altitude-dependent spectral gusts and turbulent wind shear ($u, v, w$).
- **Aero Interactions**: Ground effect lift cushion ($h < 1.5 \times D$), vortex ring state (VRS) settling-with-power sink rates, and dynamic payload pendulum moments.

### 3. Fault Injection & Stress Testing
- Real-time degradation injection:
  - **Actuator Faults**: Complete motor burnout, partial thrust degradation ($10\%\text{--}90\%$), motor control saturation.
  - **Avionics & Sensors**: IMU gyro drift, barometer altitude bias, GPS lock degradation / satellite dropout.
  - **Power Systems**: Rapid battery voltage sag, cell failure, ESC thermal throttling.
  - **Structural / Control**: Center of mass shifts, stuck control surfaces, control signal latency jitter.

### 4. Flight Coach & Training Scenarios
- **Real-Time Evaluation**: Rule-based aviation coach continuously evaluating attitude deviations, sink rates, battery consumption, and obstacle proximity.
- **Pre-Configured Missions**:
  - *Agricultural Surveying*: Precision payload handling under strong gusting wind shear.
  - *Emergency Motor Loss Recovery*: Asymmetric thrust trim following sudden in-flight rotor failure.
  - *Mountain Search & Rescue*: High-altitude density compensation and GPS-denied terrain following.

### 5. Telemetry, Analytics & Blackbox Recording
- **50 Hz Telemetry Streaming**: Real-time broadcast of attitude (quaternions / roll-pitch-yaw), motor RPMs, battery telemetry, GPS coordinates, altitude AGL/MSL, and power consumption.
- **Blackbox Export**: Standardized export to JSON and CSV formats for external flight data analysis.

### 6. External Simulator & Autopilot Bridge Architecture
- Built-in adapter interfaces for **PX4 Hardware-In-The-Loop (HITL)** via MAVLink v2 and **Gazebo** physics co-simulation.
- *Status*: Adapter architecture, protocol data structures, and parser interfaces are fully defined and tested; live socket connectivity operates in standalone mock mode in browser runtimes.

---

## Technology Stack

- **Framework**: Next.js 15 (App Router, Turbopack, React 19)
- **3D Graphics & WebGL**: Three.js (r185), custom GLSL shaders, procedural instancing
- **Physics**: In-house 6-DOF rigid-body solver + optional Rapier3D integration
- **State Management & UI**: Tailwind CSS, Lucide React, Zustand
- **Networking**: WebRTC (PeerJS) host-authoritative peer simulation
- **Type Safety**: TypeScript 5.x with strict null checking

---

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x LTS
- npm 9.x or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dhruvdaberao/Drone-Pilot.git
   cd Drone-Pilot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   *(Firebase variables are optional; local simulation, telemetry, and digital-twin configuration operate client-side without external dependencies.)*

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**:
   ```bash
   npm run build
   npm run start
   ```

---

## Operational Endpoints & Diagnostics

- **Health Check**: `GET /api/health` returns operational status, timestamp, uptime, and system metadata.
- **Global Error Handling**: Custom App Router error boundaries (`error.tsx`) and fallback routes (`not-found.tsx`).
- **Telemetry Verification**: Run `cmd /c npx tsc --noEmit` to verify type safety across all mathematical and simulation modules.

---

## Documentation Index

- [docs/FINAL_ARCHITECTURE.md](docs/FINAL_ARCHITECTURE.md) — Comprehensive technical architecture, aerodynamic formulations, and data flow.
- [PROJECT_STATUS_FINAL.md](PROJECT_STATUS_FINAL.md) — Authoritative implementation status matrix across all modules.
- [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md) — Step-by-step evaluator presentation guide and flagship scenario walkthrough.
- [FINAL_PROJECT_REPORT.md](FINAL_PROJECT_REPORT.md) — Formal engineering audit report.
- [ASSET_LICENSES.md](ASSET_LICENSES.md) — Full asset provenance, CC0/MIT licensing clearance.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
All external 3D reference assets adhere to Creative Commons Zero (CC0 1.0 Universal) Public Domain dedications.
