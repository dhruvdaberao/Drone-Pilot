import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/lib/simulation/flight-physics.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_str = '''      // Integrate Positions
      this.posX += this.velX * clampedDt;
      this.posY += this.velY * clampedDt;
      this.posZ += this.velZ * clampedDt;'''

new_str = '''      // Integrate Positions
      this.posX += this.velX * clampedDt;
      this.posY += this.velY * clampedDt;
      this.posZ += this.velZ * clampedDt;

      // Phase 2: Sensor Degradation Zones
      // Urban Canyon GPS Occlusion (City Region)
      const inCity = this.posX > 580 && this.posX < 820 && this.posZ > 200 && this.posZ < 450;
      if (inCity && this.posY < 45.0) {
        this.sensorHealth.gps = false; // GPS multipath/loss between skyscrapers
      } else {
        this.sensorHealth.gps = true;
      }

      // High EMI Compass Interference (Industrial Region)
      const inIndustrial = this.posX > 300 && this.posX < 500 && this.posZ > 700 && this.posZ < 900;
      if (inIndustrial && this.posY < 60.0) {
        this.sensorHealth.compass = false;
        // Introduce compass yaw drift
        this.yawRate += (Math.random() - 0.5) * 0.15;
      } else {
        this.sensorHealth.compass = true;
      }'''

content = content.replace(old_str, new_str)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
