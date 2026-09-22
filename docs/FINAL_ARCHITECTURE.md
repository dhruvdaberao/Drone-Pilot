# DRONE PILOT — FINAL SYSTEM ARCHITECTURE SPECIFICATION
**Version:** 1.0.0 Production Release  
**Classification:** Enterprise Engineering Specification  
**Status:** Canonical & Complete

---

## 1. Executive Summary & Product Direction
DRONE PILOT is an interactive drone simulation, digital-twin laboratory, and aeronautical training platform. It is engineered from first principles as an educational testbed for multirotor flight dynamics, avionics sensor degradation, battery thermodynamics, and environmental aerodynamics.

---

## 2. End-to-End System Data Flow
```
USER / OPERATOR
      ↓
WEB INTERFACE & DASHBOARD (Next.js 15 + React 19 + Tailwind CSS)
      ↓
DRONE DIGITAL-TWIN CONFIGURATOR (Airframe, Motors, Battery, Sensors, Payload)
      ↓
CANONICAL RUNTIME MODEL (DroneDigitalTwinRuntimeState)
      ↓
SIMULATION ADAPTER ABSTRACTION (SimulationAdapter Contract)
      │
      ├── LOCAL BROWSER 6-DoF SOLVER (Deterministic Runge-Kutta / Euler)
      ├── PX4 AUTOPILOT ADAPTER (MAVLink 2.0 Contract; Ready, Not Connected)
      ├── GAZEBO MULTI-BODY ADAPTER (ROS2 / rosbridge Contract; Ready, Not Connected)
      └── HARDWARE CONTROLLER ADAPTER (HTML5 Gamepad API Mode 2 RC)
      ↓
CANONICAL SIMULATION CLOCK (Fixed-Timestep Accumulator, dt = 1/60s)
      ↓
TELEMETRY & SIMULATION EVENT BUSES (Multi-Tier Pub-Sub)
      │
      ├── COCKPIT TELEMETRY HUD (20Hz)
      ├── EDUCATIONAL EVENT ENGINE & FLIGHT COACH (20Hz)
      ├── FLIGHT RECORDER & INCIDENT ANALYSIS (60Hz)
      ├── THREE.JS PROCEDURAL 3D WORLD (RAF ~60fps)
      └── MULTIPLAYER AIRSPACE SYNCHRONIZATION (Local BroadcastChannel + Firestore)
      ↓
PERSISTENCE LAYER (Firestore Security Rules & LocalStorage Cache)
```

---

## 3. Physical Architecture & Mathematical Modeling

### A. Aerodynamic & Kinetic Equations
1. **Total Airframe Mass**:
   $$m_{\text{total}} = m_{\text{dry}} + m_{\text{battery}} + m_{\text{payload}}$$
2. **Hover Equilibrium Force**:
   $$F_{\text{hover}} = m_{\text{total}} \cdot g \quad (g = 9.81\,\text{m/s}^2)$$
3. **Aerodynamic Drag**:
   $$\vec{F}_{\text{drag}} = -\frac{1}{2} \rho C_d A \|\vec{v}_{\text{rel}}\| \vec{v}_{\text{rel}}$$
   where $\vec{v}_{\text{rel}} = \vec{v}_{\text{drone}} - \vec{v}_{\text{wind}}$.
4. **Asymmetric Motor Torques**:
   When individual motor healths $h_i \in [0.0, 1.0]$ diverge, differential thrust produces unbalanced rolling and pitching moments:
   $$\tau_{\text{roll}} = \sum_{i=1}^n F_i \cdot x_i, \quad \tau_{\text{pitch}} = \sum_{i=1}^n F_i \cdot z_i$$
   inducing angular list and forcing counter-trim compensation.

### B. Energy & Battery Sag Model
- Terminal voltage under dynamic current draw follows Ohm's Law:
  $$V_{\text{terminal}} = V_{\text{oc}}(\text{SoC}) - I_{\text{total}} \cdot R_{\text{internal}}$$
  where $V_{\text{oc}}$ is the open-circuit cell voltage curve and $I_{\text{total}} = \sum I_{\text{motor}} + I_{\text{avionics}}$.
- Low SoC ($<15\%$) or extreme current surges visibly depress terminal voltage, triggering telemetry warnings and auto-RTL.

---

## 4. World Hydrology & Elevation Architecture
The simulation proving ground is an authoritative $2.4\text{km} \times 2.2\text{km}$ island:
- **Canonical Sea Level**: Established at $Y = 0.0\text{m}$ MSL.
- **Terrestrial Ground Floor**: All inland plains enforce an authoritative base floor $\ge +2.2\text{m}$ MSL. Undulation harmonics are strictly normalized $[0, 1]$, completely preventing any interior land submergence.
- **Hydrology Masking**: All water boundaries, rivers, and coastal queries rely on true polygon distance checks (`getDistanceToCoast(x, z)`).
- **Vertiports**: 20 standardized ICAO helipads leveled precisely ($<0.25\text{m}$ variance) to terrain elevation.

---

## 5. Network & Multiplayer Authority
- **Authority Model**: **Local Client Authoritative for Aerodynamics**. Each client solves its own aircraft physics. The network coordinates airspace presence.
- **Safety**: Inbound packets pass through `sanitizeRemotePlayerState()` clamping coordinates to $[-2500, 2500]\text{m}$ horizontal and $[0, 1500]\text{m}$ vertical.
- **Dead Reckoning**: Position extrapolated along velocity vectors ($\vec{p} + \vec{v} \cdot \Delta t$) up to $400\text{ms}$ to absorb network jitter, with exponential smoothing.
- **Ghost Eviction**: Disconnected pilots are pruned after $6.5\text{s}$ timeout.

---

## 6. External Simulation Adapter Contracts
1. **LocalSimulationAdapter**: Active in-browser solver.
2. **PX4SimulationAdapter**:
   - Status: **ADAPTER ARCHITECTURE READY; LIVE INTEGRATION: NOT CONNECTED**.
   - Contract: MAVLink 2.0 `MANUAL_CONTROL` (#69), `HIL_ACTUATOR_CONTROLS` (#93), `LOCAL_POSITION_NED` (#32).
3. **GazeboSimulationAdapter**:
   - Status: **ADAPTER ARCHITECTURE READY; LIVE INTEGRATION: NOT CONNECTED**.
   - Contract: ROS2 `/drone/cmd_vel`, `/drone/odometry`, `/drone/imu`.
4. **HardwareControllerAdapter**:
   - Status: **NORMALIZED INPUT INTERFACE READY; PHYSICAL HARDWARE: CONNECTED DYNAMICALLY VIA GAMEPAD API (OR AWAITING DEVICE)**.
   - Mode 2 RC stick mapping for USB controllers/radios.

---

## 7. Security Model
- Enforced via [firestore.rules](file:///c:/Users/wbl/Desktop/Drone-Pilot/firestore.rules).
- User configurations, flight histories, and private sessions are isolated to `request.auth.uid == userId`.
- Public airspace documents require sanitized coordinates ($0 \le Y \le 2000$).
- Secrets and API credentials are kept out of version control and browser bundles.
