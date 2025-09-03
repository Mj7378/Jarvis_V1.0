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
    
    // Get formatted time parts from user's local timezone
    const timeString = time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
    
    const [timePart, ampm] = timeString.split(' ');
    const [hours, minutes, seconds] = timePart.split(':');

    const formattedDate = time.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }); // Produces DD/MM/YYYY

    const [day, month, year] = formattedDate.split('/');

    const dayOfWeek = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

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
                <div className="flex items-center h-full text-sm text-text-primary">
                    {/* Upgraded System Clock */}
                    <div className="system-clock pl-4 pr-4 md:pl-6 md:pr-6 flex items-center gap-2 md:gap-4 h-full">
                        <div className="text-right">
                            <div 
                                className="time-display font-orbitron text-xl sm:text-2xl md:text-3xl text-primary tracking-wider flex items-baseline justify-end"
                                style={{ textShadow: '0 0 8px var(--primary-color-hex), 0 0 15px rgba(var(--primary-color-rgb), 0.7), 0 0 25px rgba(var(--primary-color-rgb), 0.5)' }}
                            >
                                <span>{hours}</span>
                                <span className="animate-pulse mx-0.5">:</span>
                                <span>{minutes}</span>
                                <span className="animate-pulse mx-0.5">:</span>
                                <span>{seconds}</span>
                                <span className="ampm-display font-orbitron text-lg ml-2">{ampm}</span>
                            </div>
                            <div 
                                className="date-display font-orbitron text-sm text-primary opacity-80 tracking-widest mt-1 hidden sm:flex items-baseline justify-end"
                                style={{ textShadow: '0 0 5px rgba(var(--primary-color-rgb), 0.7)' }}
                            >
                                <span>{dayOfWeek}</span>
                                <span className="mx-2">|</span>
                                <span>{day}</span>
                                <span className="mx-0.5">/</span>
                                <span>{month}</span>
                                <span className="mx-0.5">/</span>
                                <span>{year}</span>
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