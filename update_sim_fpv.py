import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/components/simulator/flight-simulator.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add FPVStaticOverlay component at the top
overlay_code = """
const FPVStaticOverlay = ({ distance }: { distance: number }) => {
  // Phase 2: Analog Video Feed Degradation
  // Clear signal up to 250m, starts snowing, and gets severe near 1000m+
  const maxRange = 1000;
  const degradation = Math.max(0, Math.min(1.0, (distance - 250) / (maxRange - 250)));
  
  if (degradation <= 0) return null;

  // Add random horizontal tearing / scanlines for high degradation
  const tearOpacity = degradation > 0.6 ? Math.random() * 0.35 : 0;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-[15] overflow-hidden mix-blend-screen">
      {/* Base TV Static SVG */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: degradation * 0.65,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          animation: 'fpv-static 0.15s steps(4) infinite',
        } as React.CSSProperties}
      />
      {/* V-Sync Loss / Rolling Band on extreme range */}
      {degradation > 0.5 && (
        <div 
          className="absolute w-full h-[15vh] bg-white/20 mix-blend-overlay blur-md"
          style={{
            top: `${(Date.now() / 15) % 120}%`,
            opacity: tearOpacity,
          }}
        />
      )}
      {/* OSD Warning */}
      {degradation > 0.8 && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 text-[#FF2200] font-mono font-black text-2xl animate-pulse tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          LOW VTX SIGNAL
        </div>
      )}
      <style>{`
        @keyframes fpv-static {
          0% { background-position: 0 0; }
          25% { background-position: -50px 75px; }
          50% { background-position: 80px -40px; }
          75% { background-position: -120px 100px; }
          100% { background-position: 90px -150px; }
        }
      `}</style>
    </div>
  );
};
"""

if 'FPVStaticOverlay' not in content:
    idx = content.find('export function FlightSimulator')
    content = content[:idx] + overlay_code + '\n' + content[idx:]

# Inject inside render
old_render = '''      <div className="flex-1 w-full relative overflow-hidden bg-[#08090a]">
        {/* Center 3D World */}
        <div ref={containerRef} className="absolute inset-0 cursor-crosshair" />'''

new_render = '''      <div className="flex-1 w-full relative overflow-hidden bg-[#08090a]">
        {/* Center 3D World */}
        <div ref={containerRef} className="absolute inset-0 cursor-crosshair" />
        
        {/* Phase 2: Analog FPV VTX Static */}
        {cameraMode === "fpv" && (
          <FPVStaticOverlay distance={Math.hypot(telemetry.position.x - spawnConfigRef.current.x, telemetry.position.z - spawnConfigRef.current.z)} />
        )}'''

content = content.replace(old_render, new_render)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
