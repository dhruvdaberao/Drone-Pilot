import re

with open("src/components/simulator/glass-panels.tsx", "r") as f:
    text = f.read()

# Replace Tab Navigation
loc_html = """{/* Location Selector */}
        <div className="flex gap-2 bg-black/30 p-1 rounded-2xl shrink-0">
          <select
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none uppercase tracking-widest"
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

        {/* Scrollable Content */}"""

text = re.sub(r'\{\/\* Tab Navigation \*\/\}.+?\{\/\* Scrollable Content \*\/\}', loc_html, text, flags=re.DOTALL)

# Remove the {activeTab === "weather" && ( <> block
text = re.sub(r'\{activeTab === "weather" && \(\s*<>', '', text)

# Add Turbulence below Wind Direction
turb_html = """<div>
                    <div className="flex justify-between text-xs font-bold mb-2 uppercase mt-4">
                      <span className="text-white/60">Turbulence Intensity</span>
                      <span className="text-[#38bdf8]">{environment.turbulence.toFixed(1)}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={environment.turbulence}
                      onChange={(e) => onUpdateEnvironment({ turbulence: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#38bdf8] [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>
                </div>"""

text = re.sub(r'onChange=\{\(e\) => onUpdateEnvironment\(\{ windDirection: parseInt\(e\.target\.value\) \}\)\}\s+className="w-full h-1\.5 bg-black\/50 rounded-lg appearance-none cursor-pointer accent-\[\#38bdf8\]" \/>\s+<\/div>\s+<\/div>', turb_html, text, flags=re.DOTALL)

# Fix the end block
end_html = """{/* WHAT'S HAPPENING */}
              <div className="bg-[#38bdf8]/10 rounded-2xl p-5 border border-[#38bdf8]/30 space-y-2">
                <h3 className="text-xs font-bold text-[#38bdf8] tracking-widest uppercase flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" /> Environmental Impact
                </h3>
                <p className="text-sm text-white/90 leading-relaxed font-medium">
                  {currentInsight ? currentInsight.explanation.what : "Adjust environment sliders to observe real-time aerodynamic and visual effects on the simulation. High winds will induce lateral drift, while temperature affects air density."}
                </p>
              </div>
        </div>

        {/* Reset Environment */}"""

text = re.sub(r'\{\/\* WHAT\'S HAPPENING \*\/\}.+?\{\/\* Reset Environment \*\/\}', end_html, text, flags=re.DOTALL)

with open("src/components/simulator/glass-panels.tsx", "w") as f:
    f.write(text)

