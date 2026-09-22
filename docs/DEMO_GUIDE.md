# DRONE PILOT — REVIEWER & STAKEHOLDER DEMONSTRATION GUIDE
**Purpose:** Standard Operating Procedure for Live Evaluator Demonstrations (CDAC / Academic / Industry Review)  
**Estimated Run Time:** 5 to 7 Minutes

---

## Preparation Checklist
- [ ] Ensure modern browser (Google Chrome, Microsoft Edge, or Firefox) is open.
- [ ] Run `npm run start` (Production mode) or `npm run dev`.
- [ ] Audio enabled (speakers or headphones).

---

## Step-by-Step Demonstration Script

### 1. The Core Vision (0:00 – 0:45)
- **Action**: Open `http://localhost:3000/dashboard`.
- **Talking Point**:
  > "DRONE PILOT is not a video game. It is a browser-accessible aeronautical digital-twin laboratory and interactive training system designed to teach multirotor physics, cause-and-effect aerodynamics, and emergency procedures without equipment loss."
- **Visual**: Show the 3D aircraft inspection turntable and the 4 module cards (*Digital Twin*, *Scenarios*, *Simulation*, *Analysis*).

### 2. Digital Twin Engineering Configurator (0:45 – 2:00)
- **Action**: Click **CONFIGURE DIGITAL TWIN** (or navigate to `/configure`).
- **Talking Point**:
  > "Notice that our aircraft isn't a fixed visual mesh with arbitrary speed numbers. Every parameter is backed by real engineering physics: frame diagonal, dry mass, motor KV rating, blade chord thrust factor, battery cell count, and payload capacity."
- **Demonstration**:
  1. Click **Propulsion**: Show individual motor configs ($M_1 \dots M_4$) with clockwise/counter-clockwise directional assignments.
  2. Click **Battery**: Show nominal voltage ($14.8\text{V}$ for $4S$, $22.2\text{V}$ for $6S$) and internal resistance ($18\,\text{m}\Omega$).
  3. Click **Export .drone.json**: Demonstrate that the complete aircraft definition can be exported, shared, and validated for reproducible experiments.

### 3. Entering the Simulation Proving Ground (2:00 – 3:00)
- **Action**: Click **PRE-FLIGHT BRIEFING** $\to$ Select Dropzone (e.g. `Academy Flightline` or `Crystal Lake Vertiport`) $\to$ **COMMENCE FLIGHT**.
- **Talking Point**:
  > "We are now inside our $2.4\text{km} \times 2.2\text{km}$ proving ground island. Sea level is strictly grounded at 0.0m with zero submerged terrain, and the physics solver runs on a dedicated fixed-timestep simulation clock decoupled from rendering frame drops."
- **Demonstration**:
  - Press `Space` to take off.
  - Show stable GPS hover hold.
  - Press `C` to cycle camera modes (Chase $\to$ Cockpit FPV $\to$ Orbit).

### 4. Flagship Aerodynamic & Payload Stress Demo (3:00 – 4:30)
- **Action**: Click **DEMO MODE** on the top floating toolbar (or open **TRAINING SCENARIOS** $\to$ select `Flagship Demo: Agricultural Wind + Payload`).
- **Talking Point**:
  > "Let's observe what happens when we inject a 12 m/s crosswind with high atmospheric turbulence and load a 3.5 kg agricultural crop-spray payload tank."
- **Demonstration**:
  1. Click **DIGITAL TWIN** HUD button:
     - Point out **Hover Throttle Estimate**: It jumps from nominal ~40% to ~68%.
     - Point out **Total Mass**: Shows aircraft mass + payload mass ($5.9\text{kg}$).
  2. Point out **Battery Terminal Voltage**:
     - Under high collective throttle, current draws exceed $38\text{A}$, causing visible Ohm's law voltage sag on the artificial horizon telemetry bar.
  3. Look at the aircraft attitude:
     - The flight controller visibly banks into the 120° wind vector to cancel aerodynamic drift.

### 5. Avionics & Motor Fault Injection (4:30 – 5:30)
- **Action**: Open the **FAULTS** drawer.
- **Demonstration**:
  1. Toggle **GPS Signal Loss**:
     - The HUD warns **ATTI MODE ACTIVE**.
     - Center the flight controls: The drone no longer auto-brakes; it drifts freely downwind at ambient wind speed.
  2. Degrade **Motor 3** to $45\%$:
     - Point to the **Educational Advisory Banner** at the top: It explains the **WHAT**, **WHY**, **PHYSICAL CONSEQUENCE**, and **PILOT ACTION**.
     - Show the aircraft physical list/tilt due to asymmetric motor torques.

### 6. Incident Forensics, Blackbox Debrief & Replay (5:30 – 6:30)
- **Action**: Land the drone (or intentionally touch down fast to trigger an incident) $\to$ Open **FLIGHT ANALYSIS**.
- **Talking Point**:
  > "At the conclusion of every flight, the telemetry bus feeds directly into our incident forensics engine. We receive a full blackbox debrief: impact velocity, vertical descent rate, motor workload breakdown, battery consumption curve, and pilot safety score."
- **Demonstration**:
  - Review the Event Timeline.
  - Click **REPLAY**: Scrub the timeline slider backwards to rewatch the flight maneuver from any camera angle.

### 7. External Simulator & Hardware Readiness (6:30 – 7:00)
- **Action**: Click **DIAGNOSTICS** on the floating toolbar.
- **Talking Point**:
  > "Finally, DRONE PILOT is built with a decoupled adapter layer. The system includes pre-built MAVLink contracts for PX4 and ROS2 contracts for Gazebo, ready for external HITL/SITL hardware connections without rewriting the simulation frontend."
