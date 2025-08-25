import React, { useState, useEffect } from 'react';

// A more abstract, sci-fi signal icon
const NetworkIcon: React.FC = () => (
  <svg className="w-5 h-5 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 12.55a8 8 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a4 4 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const StatusBar: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const [latency, setLatency] = useState(12);
    const [appName, setAppName] = useState('J.A.R.V.I.S V1.0');

    useEffect(() => {
        // Fetch app name from metadata.json
        fetch('/metadata.json')
            .then(res => res.json())
            .then(data => {
                if (data.name) {
                    setAppName(data.name);
                }
            })
            .catch(console.error);

        // Update time every second
        const timerId = setInterval(() => setTime(new Date()), 1000);
        // Update latency periodically
        const latencyId = setInterval(() => {
            setLatency(Math.floor(Math.random() * (25 - 8 + 1) + 8));
        }, 2500);

        return () => {
            clearInterval(timerId);
            clearInterval(latencyId);
        };
    }, []);
    
    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();

    const formattedDate = time.toLocaleDateString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/-/g, '.');

    const dayOfWeek = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    
    const circumference = 2 * Math.PI * 45; // r=45

    return (
        <div className="flex items-center h-full text-sm text-slate-300 font-mono">
            {/* Operator Info */}
            <div className="info-block">
                <div className="info-label">OPERATOR</div>
                <div className="info-value">TONY STARK</div>
            </div>
            {/* Version Info */}
            <div className="info-block">
                <div className="info-label">SYSTEM ID</div>
                <div className="info-value">{appName}</div>
            </div>

            {/* Status Indicators */}
            <div className="info-block">
                 <div className="info-label">STATUS</div>
                <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px] shadow-green-400/70 animate-pulse"></span>
                    <span className="text-green-400">NOMINAL</span>
                </div>
            </div>
            <div className="info-block !border-r-0">
                <div className="info-label">NETWORK</div>
                <div className="flex items-center space-x-2">
                    <NetworkIcon />
                    <span className="text-blue-300">{latency}ms</span>
                </div>
            </div>

            {/* Upgraded System Clock */}
            <div className="pl-6 pr-6 flex items-center gap-4 h-full">
                <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle cx="50" cy="50" r="45" stroke="rgba(0, 255, 255, 0.15)" strokeWidth="4" fill="none" />
                        {/* Seconds arc */}
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="#00ffff"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: circumference - (seconds / 60) * circumference,
                                transition: 'stroke-dashoffset 0.3s linear',
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-jarvis-cyan text-lg font-bold">
                        {seconds.toString().padStart(2, '0')}
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-2xl text-slate-100 tracking-wider">
                        <span>{hours.toString().padStart(2, '0')}</span>
                        <span className="animate-pulse mx-px">:</span>
                        <span>{minutes.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="font-sans text-xs text-slate-400 tracking-widest mt-1">
                        {dayOfWeek} | {formattedDate}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Header: React.FC = () => {
    return (
        <header className="hud-header hud-panel flex items-center justify-between !py-0 !px-0">
            {/* Left side: Title */}
            <div className="flex items-center h-full">
                <div className="title-container">
                    <h1 
                        className="font-orbitron text-3xl text-jarvis-cyan tracking-widest"
                        style={{ textShadow: '0 0 10px #00ffff' }}
                    >
                        J.A.R.V.I.S.
                    </h1>
                </div>
                {/* Decorative element */}
                <div className="title-wing"></div>
            </div>

            {/* Right side: Status Bar */}
            <StatusBar />
        </header>
    );
};

export default Header;