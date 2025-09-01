import React from 'react';
import SystemStatus from './SystemStatus';
import Logo from './Logo';
import { CameraIcon, SelfHealIcon, TrashIcon } from './Icons';

interface TacticalSidebarProps {
    onRunDiagnostics: () => void;
    onVisionMode: () => void;
    onClearChat: () => void;
}

const TacticalSidebar: React.FC<TacticalSidebarProps> = ({ onRunDiagnostics, onVisionMode, onClearChat }) => {
    
    const actions = [
        { label: "Run Diagnostics", icon: <SelfHealIcon className="w-5 h-5"/>, action: onRunDiagnostics },
        { label: "Vision Mode", icon: <CameraIcon className="w-5 h-5" />, action: onVisionMode },
        { label: "Clear Chat", icon: <TrashIcon className="w-5 h-5" />, action: onClearChat },
    ];

    return (
        <aside className="hud-sidebar">
            <div className="holographic-panel !p-2 flex items-center justify-center">
                <Logo />
            </div>
            <div className="holographic-panel flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col justify-center">
                    <SystemStatus />
                </div>
            </div>
             <div className="holographic-panel">
                <h2 className="panel-title">Quick Actions</h2>
                <div className="space-y-2">
                     {actions.map(action => (
                        <button key={action.label} onClick={action.action} className="w-full text-left flex items-center space-x-3 p-2 rounded-md hover:bg-primary-t-20 text-text-primary text-sm transition-all duration-200 transform hover:scale-[1.03] active:scale-100">
                             <div className="text-primary">{action.icon}</div>
                             <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default TacticalSidebar;