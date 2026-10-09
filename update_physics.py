import os
import re

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/lib/simulation/flight-physics.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Post-Crash Physics
old_crash_freeze = '''    // Freeze motion if in crashed state
    if (this.crashState?.isCrashed) {
      return this.generateTelemetry();
    }'''

new_crash_physics = '''    // Post-Crash Tumbling Physics
    if (this.crashState?.isCrashed) {
      // Still apply gravity and momentum
      this.velY -= 9.81 * clampedDt;
      this.posX += this.velX * clampedDt;
      this.posY += this.velY * clampedDt;
      this.posZ += this.velZ * clampedDt;
      
      this.pitch += this.pitchRate * clampedDt;
      this.roll += this.rollRate * clampedDt;
      this.yaw += this.yawRate * clampedDt;
      
      // Dynamic ground elevation query for tumbling
      let surfaceElevation = 0.0;
      if (this.elevationQueryFn) {
        surfaceElevation = Math.max(0.0, this.elevationQueryFn(this.posX, this.posZ));
      }
      this.groundLevel = surfaceElevation + 0.245;

      if (this.posY <= this.groundLevel) {
        this.posY = this.groundLevel;
        if (this.velY < -0.5) {
          // Bounce
          this.velY = Math.abs(this.velY) * 0.4;
          this.velX *= 0.7;
          this.velZ *= 0.7;
          this.pitchRate *= 0.6;
          this.rollRate *= 0.6;
          this.yawRate *= 0.6;
        } else {
          // Settle
          this.velY = 0;
          this.velX *= 0.8;
          this.velZ *= 0.8;
          this.pitchRate *= 0.8;
          this.rollRate *= 0.8;
          this.yawRate *= 0.8;
        }
      }
      return this.generateTelemetry();
    }'''

content = content.replace(old_crash_freeze, new_crash_physics)

# 2. Add Ground Effect
old_thrust_sum = '''    // Sum collective thrust
    let sumThrustFactor = 0;
    for (let i = 0; i < this.motorOutputs.length; i++) {
      sumThrustFactor += this.motorOutputs[i];
    }
    const avgThrottle = this.motorOutputs.length > 0 ? sumThrustFactor / this.motorOutputs.length : 0;
    this.totalThrust = avgThrottle * this.def.maximumThrust;'''

new_thrust_sum = '''    // Sum collective thrust
    let sumThrustFactor = 0;
    for (let i = 0; i < this.motorOutputs.length; i++) {
      sumThrustFactor += this.motorOutputs[i];
    }
    const avgThrottle = this.motorOutputs.length > 0 ? sumThrustFactor / this.motorOutputs.length : 0;
    
    // Phase 1 Polish: Ground Effect Simulation
    const agl = Math.max(0, this.posY - this.groundLevel);
    let geMultiplier = 1.0;
    if (agl < 1.2 && !this.crashState) {
       // Ground effect boosts thrust by up to 25% when very close to the ground
       geMultiplier = 1.0 + (0.25 * Math.pow(1.0 - (agl / 1.2), 2));
    }
    
    this.totalThrust = avgThrottle * this.def.maximumThrust * geMultiplier;'''

content = content.replace(old_thrust_sum, new_thrust_sum)

# 3. Enhance initial crash impact
old_impact = '''        if (impactSpeed > 6.2 || (impactSpeed > 3.0 && tiltAngleDeg > 42)) {
          const kineticEnergy = 0.5 * totalMass * impactSpeed * impactSpeed;
          let cause = "Hard landing impact exceeded structural limits.";
          if (tiltAngleDeg > 42) {
            cause = "Prop strike / severe tilt near ground.";
          }

          this.crashState = {
            isCrashed: true,
            impactSpeedKmh: Math.round(impactSpeed * 3.6 * 10) / 10,
            impactSpeedMs: Math.round(impactSpeed * 10) / 10,
            impactLocation: { x: this.posX, y: this.groundLevel, z: this.posZ },
            kineticEnergyJoules: Math.round(kineticEnergy),
            primaryCause: cause,
            impactNormal: { x: 0, y: 1, z: 0 },
            timestamp: Date.now(),
          };

          this.velX = 0;
        }'''

new_impact = '''        if (impactSpeed > 6.2 || (impactSpeed > 3.0 && tiltAngleDeg > 42)) {
          const kineticEnergy = 0.5 * totalMass * impactSpeed * impactSpeed;
          let cause = "Hard landing impact exceeded structural limits.";
          if (tiltAngleDeg > 42) {
            cause = "Prop strike / severe tilt near ground.";
          }

          this.crashState = {
            isCrashed: true,
            impactSpeedKmh: Math.round(impactSpeed * 3.6 * 10) / 10,
            impactSpeedMs: Math.round(impactSpeed * 10) / 10,
            impactLocation: { x: this.posX, y: this.groundLevel, z: this.posZ },
            kineticEnergyJoules: Math.round(kineticEnergy),
            primaryCause: cause,
            impactNormal: { x: 0, y: 1, z: 0 },
            timestamp: Date.now(),
          };

          // Realistic Crash Bounce and Tumble
          this.velY = Math.abs(this.velY) * 0.45;
          this.velX *= 0.6;
          this.velZ *= 0.6;
          this.pitchRate += (Math.random() - 0.5) * 25.0;
          this.rollRate += (Math.random() - 0.5) * 25.0;
          this.yawRate += (Math.random() - 0.5) * 15.0;
        }'''

content = content.replace(old_impact, new_impact)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
