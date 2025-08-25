import React, { useState, useEffect } from 'react';

const SystemStatus: React.FC<{ error: string }> = ({ error }) => {
  const [stats, setStats] = useState({
    cpu: 0,
    memory: 0,
    network: 0,
  });

  useEffect(() => {
    const generateStats = () => {
        setStats({
            cpu: Math.random() * 80 + 10,
            memory: Math.random() * 60 + 20,
            network: Math.random() * 90 + 5,
        });
    };
    generateStats();
    const intervalId = setInterval(generateStats, 2500);
    return () => clearInterval(intervalId);
  }, []);

  const StatBar: React.FC<{ label: string; value: number; unit: string; max: number }> = ({ label, value, unit, max }) => {
      const percentage = (value / max) * 100;
      return (
          <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                  <span className="font-orbitron text-slate-300">{label}</span>
                  <span className="font-mono text-jarvis-cyan">{value.toFixed(1)} {unit}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden border border-jarvis-border/50">
                  <div 
                    className="bg-jarvis-cyan h-full rounded-full"
                    style={{ width: `${percentage}%`, transition: 'width 1s ease-in-out' }}
                  ></div>
              </div>
          </div>
      );
  };

  return (
    <div className="panel p-4 mt-auto">
      <h2 className="panel-title">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3" /></svg>
        <span>System Status</span>
      </h2>
      <div className="space-y-3">
        <StatBar label="CPU Load" value={stats.cpu} unit="%" max={100} />
        <StatBar label="Memory Usage" value={stats.memory} unit="%" max={100} />
        <StatBar label="Network Activity" value={stats.network} unit="Mbps" max={100} />
      </div>
      <div className="mt-3 pt-2 border-t border-jarvis-border">
         <p className="text-center text-xs text-red-400 min-h-[1.25rem]">{error}</p>
      </div>
    </div>
  );
};

export default SystemStatus;
