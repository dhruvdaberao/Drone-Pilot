import os

def replace_in_file(file_path, old_str, new_str):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old_str, new_str)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix modular-drone.ts
f1 = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/modular-drone.ts'
old1 = '''    this.nameTagSprite.position.set(0, 1.4, 0);
    this.nameTagSprite.scale.set(1.1, 0.22, 1);'''
new1 = '''    this.nameTagSprite.position.set(0, 0.65, 0);
    this.nameTagSprite.scale.set(0.65, 0.13, 1);'''
replace_in_file(f1, old1, new1)

# Fix remote-drone-manager.ts
f2 = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/multiplayer/remote-drone-manager.ts'
old2 = '''    sprite.position.set(0, 0.52, 0);
    sprite.scale.set(1.4, 0.35, 1);'''
new2 = '''    sprite.position.set(0, 0.45, 0);
    sprite.scale.set(0.7, 0.175, 1);'''
replace_in_file(f2, old2, new2)

print("Done")
