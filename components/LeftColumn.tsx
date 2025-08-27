import React from 'react';
import { AppState } from '../types';
import { GeminiIcon } from './Icons';

interface LeftColumnProps {
    appState: AppState;
}

const Header: React.FC = () => (
    <header className="text-center p-4">
        <h1 className="font-orbitron text-3xl text-primary tracking-widest">
            J.A.R.V.I.S
        </h1>
        <p className="text-sm text-blue-300">AI Assistant Active</p>
    </header>
);

const SystemInfoPanel: React.FC<{ appState: AppState }> = ({ appState }) => {
    const getStatusText = () => {
        switch (appState) {
            case AppState.THINKING: return "Processing Command...";
            case AppState.SPEAKING: return "Relaying Response...";
            case AppState.ERROR: return "System Anomaly Detected";
            default: return "Awaiting Command Input";
        }
    };

    const getStatusColor = () => {
        switch (appState) {
            case AppState.THINKING: return "text-yellow-400";
            case AppState.SPEAKING: return "text-purple-400";
            case AppState.ERROR: return "text-red-400";
            default: return "text-primary";
        }
    };
    
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100" style={{'--fa-animation-duration': '12s'} as React.CSSProperties}>
                    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" fill="none" />
                    <circle cx="50" cy="50" r="38" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" fill="none" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <GeminiIcon className="w-20 h-20 text-primary opacity-25" />
                </div>
            </div>
            <h3 className="font-orbitron text-2xl text-slate-300">SYSTEM STATUS</h3>
            <p className={`text-lg font-semibold tracking-widest mt-2 ${getStatusColor()} animate-pulse`}>{getStatusText()}</p>
        </div>
    );
};


export const LeftColumn: React.FC<LeftColumnProps> = ({ appState }) => (
    <aside className="flex flex-col h-full space-y-4">
        <Header />
        <SystemInfoPanel appState={appState} />
    </aside>
);