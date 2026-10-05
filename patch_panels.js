const fs = require('fs');

const path = 'src/components/simulator/glass-panels.tsx';
let content = fs.readFileSync(path, 'utf8');

// The original comment might have strange characters like "SVG Diagram ?"
// Let's use string indexes instead or a more robust replace.

// 1. Insert avgMotorOutput right after `const { motorCount = 4 } = telemetry.def || {};`
content = content.replace(
  'const { motorCount = 4 } = telemetry.def || {};',
  'const { motorCount = 4 } = telemetry.def || {};\n    const avgMotorOutput = telemetry.motorOutputs ? telemetry.motorOutputs.reduce((a,b)=>a+b,0) / Math.max(1, telemetry.motorOutputs.length) : 0;'
);

// 2. SVG Diagram logic
content = content.replace(
`                        let color = '#6b7280'; // Disarmed / Idle (Grey)
                        if (telemetry.isArmed && output > 0.05) {
                          if (output > 0.8) color = '#f59e0b'; // High stress (Yellow/Amber)
                          else if (output < 0.25) color = '#ef4444'; // Dropping / Low (Red)
                          else color = '#10b981'; // Normal Hover Range (Green)
                        }`,
`                        let color = '#6b7280'; // Disarmed / Idle (Grey)
                        if (telemetry.isArmed && output > 0.05) {
                          if (output > avgMotorOutput + 0.03) color = '#f59e0b'; // Increased RPM (Yellow/Amber)
                          else if (output < avgMotorOutput - 0.03) color = '#ef4444'; // Decreased RPM (Red)
                          else color = '#10b981'; // Baseline RPM (Green)
                        }`
);

// 3. Motor Cards logic
content = content.replace(
`                    let outputColorClass = 'text-neutral-500';
                    let barColorClass = 'bg-neutral-600';
                    if (telemetry.isArmed && liveOutput > 0.05) {
                      if (liveOutput > 0.8) {
                        outputColorClass = 'text-amber-400';
                        barColorClass = 'bg-amber-500';
                      } else if (liveOutput < 0.25) {
                        outputColorClass = 'text-rose-400';
                        barColorClass = 'bg-rose-500';
                      } else {
                        outputColorClass = 'text-white/80';
                        barColorClass = 'bg-white/80';
                      }
                    }`,
`                    let outputColorClass = 'text-neutral-500';
                    let barColorClass = 'bg-neutral-600';
                    if (telemetry.isArmed && liveOutput > 0.05) {
                      if (liveOutput > avgMotorOutput + 0.03) {
                        outputColorClass = 'text-amber-400';
                        barColorClass = 'bg-amber-500';
                      } else if (liveOutput < avgMotorOutput - 0.03) {
                        outputColorClass = 'text-rose-400';
                        barColorClass = 'bg-rose-500';
                      } else {
                        outputColorClass = 'text-emerald-400';
                        barColorClass = 'bg-emerald-500';
                      }
                    }`
);

fs.writeFileSync(path, content);
