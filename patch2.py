import re
with open("src/components/simulator/glass-panels.tsx", "r") as f:
    text = f.read()

# Cut off RightGlassPanel Props and definition
idx = text.find("interface RightGlassPanelProps")
if idx != -1:
    text = text[:idx]

new_panel = """interface RightGlassPanelProps {
  environment: EnvironmentState;
  onUpdateEnvironment: (updates: Partial<EnvironmentState>) => void;
  telemetry: TelemetryState;
  activeWaypoint: NavigationWaypoint | null;
  onToggleMap: () => void;
  onResetEnvironment: () => void;
  currentInsight: FlightCoachInsight | null;
}

export function RightGlassPanel({
  environment,
  onUpdateEnvironment,
  telemetry,
  activeWaypoint,
  onToggleMap,
  onResetEnvironment,
  currentInsight
}: RightGlassPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-20 right-4 z-40 bg-neutral-900/80 backdrop-blur border border-white/5 p-3 rounded-2xl text-white shadow-xl"
      >
        <CloudSun className="w-6 h-6 text-[#38bdf8]" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Premium Glassmorphism Card */}
      <div className={`fixed top-20 bottom-4 right-4 md:w-[380px] w-[calc(100vw-32px)] rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/5 p-6 flex flex-col gap-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-40 text-white font-sans pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${isOpen ? "translate-x-0" : "translate-x-[120%] md:translate-x-0"}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="space-y-1">
            <h2 className="font-bold text-xl uppercase tracking-wider flex items-center gap-2">
              <CloudSun className="w-6 h-6 text-[#38bdf8]" />
              Environment
            </h2>
            <p className="text-xs text-white/60 tracking-widest uppercase">Atmospheric Digital Twin</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 bg-white/10 rounded-full hover:bg-white/20"><CloudSun className="w-5 h-5 text-white" /></button>
        </div>

        {/* Location Selector */}
        <div className="bg-black/30 p-3 rounded-2xl shrink-0">
          <h3 className="text-[10px] font-bold text-white/60 tracking-widest uppercase mb-2">Location / Region</h3>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none uppercase tracking-widest"
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("region", e.target.value);
              window.location.href = url.toString();
            }}
            defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("region") || "training" : "training"}
          >
            <option value="training">Training Center</option>
            <option value="city">Urban City</option>
            <option value="mountain">Mountain Range</option>
            <option value="forest">Forest Valley</option>
            <option value="river">River & Lake</option>
            <option value="coast">Coastal Area</option>
            <option value="industrial">Industrial Harbor</option>
          </select>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
            
          {/* WIND */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-5">
            <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase flex items-center gap-2">
              <Wind className="w-4 h-4 text-[#38bdf8]" /> Wind Physics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                  <span className="text-white/60">Speed</span>
                  <span className="text-[#38bdf8]">{environment.windSpeed.toFixed(1)} m/s</span>
                </div>
                <input type="range" min="0" max="25" step="0.5" value={environment.windSpeed}
                  onChange={(e) => onUpdateEnvironment({ windSpeed: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#38bdf8]" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                  <span className="text-white/60">Direction</span>
                  <span className="text-[#38bdf8]">{environment.windDirection}</span>
                </div>
                <input type="range" min="0" max="359" step="5" value={environment.windDirection}
                  onChange={(e) => onUpdateEnvironment({ windDirection: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#38bdf8]" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase mt-4">
                  <span className="text-white/60">Turbulence Intensity</span>
                  <span className="text-[#38bdf8]">{environment.turbulence.toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={environment.turbulence}
                  onChange={(e) => onUpdateEnvironment({ turbulence: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#38bdf8] [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>
          </div>

          {/* ATMOSPHERE */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-5">
            <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-rose-400" /> Atmosphere
            </h3>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase">
                  <span className="text-white/60">Temperature</span>
                  <span className="text-rose-400">{environment.temperature}</span>
                </div>
                <input type="range" min="-15" max="45" step="1" value={environment.temperature}
                  onChange={(e) => onUpdateEnvironment({ temperature: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-rose-400" />
              </div>
            </div>
          </div>

          {/* WHAT'S HAPPENING */}
          <div className="bg-[#38bdf8]/10 rounded-2xl p-5 border border-[#38bdf8]/30 space-y-2">
            <h3 className="text-xs font-bold text-[#38bdf8] tracking-widest uppercase flex items-center gap-2 mb-2">
              <Info className="w-4 h-4" /> Environmental Impact
            </h3>
            <p className="text-sm text-white/90 leading-relaxed font-medium">
              {currentInsight ? currentInsight.explanation.what : "Adjust environment sliders to observe real-time aerodynamic and visual effects on the simulation. High winds will induce lateral drift, while temperature affects air density."}
            </p>
          </div>
        </div>

        {/* Reset Environment */}
        <button onClick={onResetEnvironment} className="w-full mt-auto shrink-0 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold uppercase transition-all text-white">
          <RotateCcw className="w-4 h-4" />
          <span>Reset Environment</span>
        </button>

      </div>
    </>
  );
}
"""

with open("src/components/simulator/glass-panels.tsx", "w") as f:
    f.write(text + "\n" + new_panel)
