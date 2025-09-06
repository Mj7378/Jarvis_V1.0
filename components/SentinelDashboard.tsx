
import React from 'react';
// FIX: Changed import from 'import type' to a value import for AppState enum.
import { AppState } from '../types';
import ChatLog from './ChatLog';
import UserInput from './UserInput';
import Suggestions from './Suggestions';
import { TaskIcon } from './Icons';

// --- AI Core Visual Component ---
const AICore: React.FC<{ appState: AppState }> = ({ appState }) => {
    let animationClass = 'animate-core-breathing';
    let filterId = '';

    switch (appState) {
        case AppState.AWAITING_WAKE_WORD:
        case AppState.LISTENING:
            animationClass = 'animate-core-listening';
            break;
        case AppState.THINKING:
            animationClass = 'animate-core-thinking';
            filterId = 'url(#thinking-filter)';
            break;
        case AppState.SPEAKING:
            animationClass = 'animate-core-speaking';
            break;
        default:
            animationClass = 'animate-core-breathing';
            break;
    }
    
    return (
        <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 pointer-events-none">
            <svg viewBox="0 0 400 400" className="w-full h-full">
                <defs>
                    <radialGradient id="core-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" style={{ stopColor: 'rgba(var(--primary-color-rgb), 0.8)', stopOpacity: 1 }} />
                        <stop offset="60%" style={{ stopColor: 'rgba(var(--primary-color-rgb), 0.4)', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: 'rgba(var(--primary-color-rgb), 0)', stopOpacity: 1 }} />
                    </radialGradient>
                    <filter id="thinking-filter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" result="turbulence"/>
                        <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G"/>
                    </filter>
                </defs>
                
                {/* Outer Rings */}
                <circle cx="200" cy="200" r="190" stroke="rgba(var(--primary-color-rgb), 0.2)" strokeWidth="1" fill="none" className="animate-spin-slow" />
                <circle cx="200" cy="200" r="160" stroke="rgba(var(--primary-color-rgb), 0.3)" strokeWidth="1.5" fill="none" className="animate-spin-medium" style={{ animationDirection: 'reverse' }} />
                <circle cx="200" cy="200" r="130" stroke="rgba(var(--primary-color-rgb), 0.4)" strokeWidth="1" fill="none" className="animate-spin-fast" />

                {/* Central Core */}
                <g className={animationClass} style={{ transformOrigin: 'center' }}>
                    <circle cx="200" cy="200" r="120" fill="url(#core-glow)" />
                    <circle cx="200" cy="200" r="100" fill="rgba(var(--panel-rgb), 0.7)" filter={filterId} />
                </g>
            </svg>
        </div>
    );
};

// --- Live Transcript Component ---
const LiveTranscript: React.FC<{ transcript: string }> = ({ transcript }) => {
    if (!transcript) return null;
    return (
        <div className="absolute bottom-[25%] md:bottom-1/4 left-4 right-4 text-center pointer-events-none animate-fade-in-fast">
            <p className="font-orbitron text-xl md:text-2xl lg:text-3xl text-text-primary/80 transition-all" style={{ textShadow: '0 0 10px rgba(var(--primary-color-rgb), 0.5)' }}>
                {transcript}
            </p>
        </div>
    );
};


// --- MAIN DASHBOARD COMPONENT ---

interface SentinelDashboardProps {
    tasks: any[];
    operatingSystem: string;
    appState: AppState;
    userInputProps: Omit<React.ComponentProps<typeof UserInput>, 'onSendMessage'>;
    onSendMessage: (prompt: string) => void;
    isListening: boolean;
    transcript: string;
}

const SentinelDashboard: React.FC<SentinelDashboardProps> = (props) => {
    const { appState, userInputProps, onSendMessage, isListening, transcript } = props;
    
    return (
        <div className="sentinel-view">
            <AICore appState={appState} />
            <LiveTranscript transcript={transcript} />
            <div className="absolute bottom-0 left-0 right-0 w-full max-w-3xl mx-auto">
                <UserInput onSendMessage={onSendMessage} isListening={isListening} {...userInputProps} />
            </div>
        </div>
    );
};

export default SentinelDashboard;
