import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RightSidebar } from './RightSidebar';
import { PowerIcon, SettingsIcon, CloseIcon } from './Icons';
import { useSoundEffects } from '../hooks/useSoundEffects';
import type { ThemeSettings } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShutdown: () => void;
    onCameraClick: () => void;
    isBusy: boolean;
    onWeather: () => void;
    onSelfHeal: () => void;
    onDesignMode: () => void;
    onSimulationMode: () => void;
    onCalibrateVoice: () => void;
    sounds: ReturnType<typeof useSoundEffects>;
    themeSettings: ThemeSettings;
    onThemeChange: (settings: ThemeSettings | ((prev: ThemeSettings) => ThemeSettings)) => void;
    onSetCustomBootVideo: (file: File) => void;
    onRemoveCustomBootVideo: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
    const { isOpen, onClose, onShutdown, sounds } = props;

    const [isHovering, setIsHovering] = useState(false);
    const closeTimeoutRef = useRef<number | null>(null);

    const handleClose = useCallback(() => {
        sounds.playClose();
        onClose();
    }, [sounds, onClose]);

    useEffect(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        if (isOpen && !isHovering) {
            closeTimeoutRef.current = window.setTimeout(() => {
                handleClose();
            }, 2000);
        }
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [isOpen, isHovering, handleClose]);

    const handleShutdown = () => {
        onShutdown();
    };
    
    return (
        <div
            className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent pointer-events-none opacity-0'}`}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
        >
            <div
                className={`absolute top-20 right-4 w-96 max-h-[calc(100dvh-6rem)] bg-background shadow-2xl shadow-primary/20 border-2 border-primary-t-20 rounded-xl flex flex-col origin-top-right ${isOpen ? 'animate-pop-in-top-right' : 'opacity-0 pointer-events-none'}`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-primary-t-20 flex-shrink-0 holographic-panel !py-3 !px-4">
                    <div className="flex items-center gap-3">
                        <SettingsIcon className="w-6 h-6 text-primary" />
                        <h2 id="settings-title" className="font-orbitron text-xl text-primary">System Settings</h2>
                    </div>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-primary/20 text-text-muted hover:text-primary transition-all duration-200 hover:scale-110 active:scale-100" aria-label="Close settings">
                        <CloseIcon className="w-7 h-7" />
                    </button>
                </header>
                
                {/* Content - The RightSidebar */}
                <div className="flex-1 overflow-y-auto p-4 styled-scrollbar">
                    <RightSidebar {...props} />
                </div>

                {/* Footer */}
                <footer className="p-4 border-t border-primary-t-20 flex-shrink-0 holographic-panel !py-3 !px-4">
                    <button
                        onClick={handleShutdown}
                        className="w-full flex items-center justify-center gap-3 p-3 rounded-md text-red-400 border border-red-500/50 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 group hover:scale-[1.02] active:scale-100"
                    >
                        <PowerIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
                        <span className="font-orbitron tracking-wider">SHUTDOWN SYSTEM</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};