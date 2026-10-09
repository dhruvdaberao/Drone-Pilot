import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/lib/simulation/flight-physics.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Drag Equation
old_drag = '''    // Streamlined aerodynamic drag curve for higher maximum cruise velocity
    const aeroFactor = 0.5 * airDensity * (this.def.drag.linear * 0.55);
    this.dragForceX = -relVx * Math.abs(relVx) * aeroFactor;
    this.dragForceY = -relVy * Math.abs(relVy) * aeroFactor * 0.5;
    this.dragForceZ = -relVz * Math.abs(relVz) * aeroFactor;

    this.windForceX = windVec.x * Math.abs(windVec.x) * aeroFactor;
    this.windForceY = windVec.y * Math.abs(windVec.y) * aeroFactor;
    this.windForceZ = windVec.z * Math.abs(windVec.z) * aeroFactor;'''

new_drag = '''    // Phase 2: True Aerodynamic Drag based on Tilt Projection
    // When tilted, the large top plate and rotors act like a sail, drastically increasing wind resistance.
    const tiltExposedArea = Math.max(0.15, Math.abs(Math.sin(this.pitch)) + Math.abs(Math.sin(this.roll)));
    const verticalExposedArea = Math.max(0.15, Math.abs(Math.cos(this.pitch)) * Math.abs(Math.cos(this.roll)));
    
    const baseArea = this.def.drag.linear * 0.55;
    const aeroFactorHorizontal = 0.5 * airDensity * (baseArea * (1.0 + 3.5 * tiltExposedArea));
    const aeroFactorVertical = 0.5 * airDensity * (baseArea * (1.0 + 4.5 * verticalExposedArea));

    this.dragForceX = -relVx * Math.abs(relVx) * aeroFactorHorizontal;
    this.dragForceY = -relVy * Math.abs(relVy) * aeroFactorVertical;
    this.dragForceZ = -relVz * Math.abs(relVz) * aeroFactorHorizontal;

    this.windForceX = windVec.x * Math.abs(windVec.x) * aeroFactorHorizontal;
    this.windForceY = windVec.y * Math.abs(windVec.y) * aeroFactorVertical;
    this.windForceZ = windVec.z * Math.abs(windVec.z) * aeroFactorHorizontal;'''

content = content.replace(old_drag, new_drag)

# 2. Update CG / Inertia Sluggishness from Payload
old_rates = '''      let effYaw = this.isAutoLanding ? 0 : input.yaw;
      
      // Integrate rotations (simplified first-order lag model for rates)
      this.pitchRate += (effPitch * maxRate - this.pitchRate) * (clampedDt * 10);
      this.rollRate += (effRoll * maxRate - this.rollRate) * (clampedDt * 10);
      this.yawRate += (effYaw * maxYawRate - this.yawRate) * (clampedDt * 8);'''

new_rates = '''      let effYaw = this.isAutoLanding ? 0 : input.yaw;
      
      // Phase 2: Payload CG & Moment of Inertia Penalty
      // Payload slung underneath increases inertia, making rotational response sluggish and prone to pendulum sway
      const inertiaPenalty = 1.0 + (this.payloadMass / Math.max(0.1, this.def.mass));
      const responseSpeed = 12.0 / inertiaPenalty;
      const yawResponseSpeed = 9.0 / inertiaPenalty;
      
      // Integrate rotations (simplified first-order lag model for rates)
      this.pitchRate += (effPitch * maxRate - this.pitchRate) * (clampedDt * responseSpeed);
      this.rollRate += (effRoll * maxRate - this.rollRate) * (clampedDt * responseSpeed);
      this.yawRate += (effYaw * maxYawRate - this.yawRate) * (clampedDt * yawResponseSpeed);'''

content = content.replace(old_rates, new_rates)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
