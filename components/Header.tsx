
import React, { useState, useEffect } from 'react';
import { PowerIcon, SettingsIcon } from './Icons';

const Header: React.FC<{ onOpenSettings: () => void; }> = ({ onOpenSettings }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        // Update time every second
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => {
            clearInterval(timerId);
        };
    }, []);
    
    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    let hours = time.getHours();
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const day = String(time.getDate()).padStart(2, '0');
    const month = String(time.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = time.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const dayOfWeek = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    
    const circumference = 2 * Math.PI * 20; // r=20 for a 48x48 box

    return (
        <header className="hud-header holographic-panel flex items-center !p-0">
            {/* Left side: Title */}
            <div className="flex items-center h-full group">
                 <div 
                    className="h-full bg-primary/80 text-background flex items-center transition-all duration-300 group-hover:bg-primary header-title-panel"
                >
                    <h1 
                        className="font-orbitron tracking-widest transition-transform duration-300 group-hover:scale-105"
                        style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)' }}
                    >
                        J.A.R.V.I.S.
                    </h1>
                </div>
                <div 
                    className="h-full bg-primary/80 transition-all duration-300 group-hover:bg-primary header-title-wedge"
                ></div>
            </div>

            {/* Right side: Clock & Controls */}
            <div className="flex items-center h-full text-sm text-text-primary font-mono ml-auto">
                {/* Upgraded System Clock */}
                <div className="pl-4 pr-4 md:pl-6 md:pr-6 flex items-center gap-2 md:gap-4 h-full">
                    <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r="20" className="stroke-primary-t-20" strokeWidth="2" fill="none" />
                            <circle
                                cx="24"
                                cy="24"
                                r="20"
                                className="stroke-primary"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                                transform="rotate(-90 24 24)"
                                style={{
                                    strokeDasharray: circumference,
                                    strokeDashoffset: circumference - (seconds / 60) * circumference,
                                    transition: 'stroke-dashoffset 0.3s linear',
                                    filter: 'drop-shadow(0 0 3px var(--primary-color-hex))',
                                }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-primary text-base md:text-lg font-bold">
                            {seconds.toString().padStart(2, '0')}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-mono text-lg sm:text-xl md:text-2xl text-text-primary tracking-wider flex items-baseline">
                            <span>{hours.toString().padStart(2, '0')}</span>
                            <span className="animate-pulse mx-px">:</span>
                            <span>{minutes.toString().padStart(2, '0')}</span>
                            <span className="text-base ml-2">{ampm}</span>
                        </div>
                        <div className="font-sans text-xs text-text-muted tracking-widest mt-1 hidden sm:block">
                            {dayOfWeek} | {formattedDate}
                        </div>
                    </div>
                </div>
                {/* Controls */}
                <div className="h-full flex items-center pr-4 md:pr-6 pl-4 md:pl-6 border-l-2 border-primary-t-20">
                    <button
                        onClick={onOpenSettings}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-primary/70 hover:bg-primary/20 hover:text-primary border border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-[0_0_15px] hover:shadow-primary/50"
                        aria-label="Open Settings"
                    >
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;