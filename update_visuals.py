import os

# 1. Fix Rain Transparency
env_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/world/world-environment.ts'
with open(env_path, 'r', encoding='utf-8') as f:
    env_content = f.read()

old_rain_mat = '''      const rainMat = new THREE.PointsMaterial({
        color: 0xcccccc,
        size: 15.0, // Size of the square quad (the streak will be 4/128th of this)
        map: rainTex,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.NormalBlending // Normal blending looks better for rain than additive
      });'''

new_rain_mat = '''      const rainMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 6.0, 
        map: rainTex,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.NormalBlending
      });'''

env_content = env_content.replace(old_rain_mat, new_rain_mat)
with open(env_path, 'w', encoding='utf-8') as f:
    f.write(env_content)


# 2. Fix Drone Propeller Blur & Nesting Traverse
drone_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/modular-drone.ts'
with open(drone_path, 'r', encoding='utf-8') as f:
    drone_content = f.read()

old_traverse = '''      p.bladeGroup.children.forEach((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).material = bladeMaterial;
        }
      });'''

new_traverse = '''      p.bladeGroup.traverse((c) => {
        if ((c as THREE.Mesh).isMesh && c !== blurMesh) {
          (c as THREE.Mesh).material = bladeMaterial;
        }
      });'''

drone_content = drone_content.replace(old_traverse, new_traverse)

old_spin = 'const spinSpeed = (motorThrottle * 120.0 + 15.0) * p.direction;'
new_spin = 'const spinSpeed = (motorThrottle * 1500.0 + 50.0) * p.direction;'
drone_content = drone_content.replace(old_spin, new_spin)

with open(drone_path, 'w', encoding='utf-8') as f:
    f.write(drone_content)

print("Done")
