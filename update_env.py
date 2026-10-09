import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/lib/simulation/environment-model.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_gust = '''    // Continuous turbulent gust harmonics
    const gustFactor = Math.sin(this.elapsed * 0.7) * 0.6 + Math.cos(this.elapsed * 1.6) * 0.4;
    const currentSpeed = Math.max(0, this.state.windSpeed + this.state.windGust * gustFactor);'''

new_gust = '''    // Phase 2: Chaotic Turbulent Gust Harmonics
    // Multi-octave pseudo-random noise for unpredictable weather buffeting
    const t = this.elapsed;
    const gustFactor = 
      (Math.sin(t * 0.43) * 0.4) + 
      (Math.cos(t * 1.17) * 0.3) + 
      (Math.sin(t * 3.42) * 0.2) + 
      (Math.cos(t * 8.11) * 0.1);
    
    // Low-frequency wind direction shifting
    const dirShiftRad = Math.sin(t * 0.2) * (this.state.windGust * 0.05);
    const finalDirRad = dirRad + dirShiftRad;

    const currentSpeed = Math.max(0, this.state.windSpeed + this.state.windGust * gustFactor);'''

content = content.replace(old_gust, new_gust)
content = content.replace('const windVx = Math.sin(dirRad) * currentSpeed;', 'const windVx = Math.sin(finalDirRad) * currentSpeed;')
content = content.replace('const windVz = Math.cos(dirRad) * currentSpeed;', 'const windVz = Math.cos(finalDirRad) * currentSpeed;')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
