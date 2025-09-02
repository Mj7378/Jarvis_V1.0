import React, { useState, useEffect } from 'react';
import { PowerIcon, SettingsIcon, DashboardIcon, ChatIcon } from './Icons';
import Logo from './Logo';
import WeatherWidget from './WeatherWidget';

const Header: React.FC<{ 
    onToggleControlCenter: () => void;
    onOpenSettings: () => void;
}> = ({ onToggleControlCenter, onOpenSettings }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        // Update time every second
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => {
            clearInterval(timerId);
        };
    }, []);
    
    // Set the timezone to India Standard Time
    const timeZone = 'Asia/Kolkata';

    // Get formatted time parts from IST
    const timeString = time.toLocaleTimeString('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
    
    const [timePart, ampm] = timeString.split(' ');
    const [hours, minutes, seconds] = timePart.split(':');

    const formattedDate = time.toLocaleDateString('en-GB', {
        timeZone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    const dayOfWeek = time.toLocaleDateString('en-US', { timeZone, weekday: 'short' }).toUpperCase();
    
    const circumference = 2 * Math.PI * 20; // r=20 for a 48x48 box

    return (
        <header className="hud-header flex items-center justify-between relative">
            {/* Left side: Logo */}
            <div className="flex justify-start">
                <Logo />
            </div>

            {/* Center: Weather Widget (hidden on smaller screens) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden xl:flex">
                <WeatherWidget />
            </div>
            
            {/* Right side: Clock & Controls */}
            <div className="flex justify-end">
                <div className="flex items-center h-full text-sm text-text-primary font-mono">
                    {/* Upgraded System Clock */}
                    <div className="system-clock pl-4 pr-4 md:pl-6 md:pr-6 flex items-center gap-2 md:gap-4 h-full">
                        <div className="seconds-dial relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
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
                                        strokeDashoffset: circumference - (parseInt(seconds, 10) / 60) * circumference,
                                        transition: 'stroke-dashoffset 0.3s linear',
                                        filter: 'drop-shadow(0 0 5px var(--primary-color-hex))',
                                    }}
                                />
                            </svg>
                            <div className="seconds-text absolute inset-0 flex items-center justify-center font-mono text-primary text-base md:text-lg font-bold">
                                {seconds}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="time-display font-mono text-lg sm:text-xl md:text-2xl text-text-primary tracking-wider flex items-baseline">
                                <span>{hours}</span>
                                <span className="animate-pulse mx-px">:</span>
                                <span>{minutes}</span>
                                <span className="ampm-display text-base ml-2">{ampm}</span>
                            </div>
                            <div className="date-display font-sans text-xs text-text-muted tracking-widest mt-1 hidden sm:block">
                                {dayOfWeek} | {formattedDate}
                            </div>
                        </div>
                    </div>
                    {/* Controls */}
                    <div className="header-controls h-full flex items-center pr-4 md:pr-6 pl-4 md:pl-6 border-l-2 border-primary-t-20 gap-2 md:gap-4">
                        <button
                            onClick={onToggleControlCenter}
                            className="header-control-button w-10 h-10 rounded-full flex items-center justify-center text-primary/70 hover:bg-primary/20 hover:text-primary border border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-[0_0_15px] hover:shadow-primary/50 transform hover:scale-110 active:scale-100"
                            aria-label={'Toggle Control Center'}
                        >
                           <DashboardIcon className="w-6 h-6" />
                        </button>
                        <button
                            onClick={onOpenSettings}
                            className="header-control-button w-10 h-10 rounded-full flex items-center justify-center text-primary/70 hover:bg-primary/20 hover:text-primary border border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-[0_0_15px] hover:shadow-primary/50 transform hover:scale-110 active:scale-100"
                            aria-label="Open Settings"
                        >
                            <SettingsIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;