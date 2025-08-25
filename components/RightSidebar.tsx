
import React from 'react';
import { SystemControlsIcon, QuickActionsIcon, SelfHealIcon, CreativeWritingIcon, GenerateImageIcon, GenerateVideoIcon, CyberAnalystIcon } from './Icons';

interface RightSidebarProps {
    onCameraClick: () => void;
    isBusy: boolean;
    onWeather: () => void;
    onSelfHeal: () => void;
    onCreativeWriting: () => void;
    onDesignMode: () => void;
    onSimulationMode: () => void;
    onCyberAnalystMode: () => void;
}

const SystemControls: React.FC<Pick<RightSidebarProps, 'onCameraClick' | 'isBusy' | 'onWeather' | 'onSelfHeal'>> = (props) => {
    const { onCameraClick, isBusy, onWeather, onSelfHeal } = props;
    const controls = [
        { name: 'Camera', icon: '📷', action: onCameraClick, disabled: isBusy },
        { name: 'Weather', icon: '🌦️', action: onWeather, disabled: isBusy },
        { name: 'Self Heal', icon: <SelfHealIcon className="w-6 h-6 inline-block" />, action: onSelfHeal, disabled: isBusy },
    ];
    return (
        <div className="bg-black/20 p-4" style={{clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)'}}>
            <h2 className="panel-title"><SystemControlsIcon className="w-5 h-5" /><span>System Controls</span></h2>
            <div className="grid grid-cols-2 gap-2">
                {controls.map(control => (
                     <button key={control.name} onClick={control.action} disabled={control.disabled} className="text-center p-2 bg-slate-800/50 rounded-md border border-slate-700/50 hover:bg-slate-700/50 hover:border-jarvis-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center h-20">
                        <span className="text-2xl">{control.icon}</span>
                        <p className="text-xs mt-1 text-slate-300">{control.name}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const QuickActions: React.FC<Pick<RightSidebarProps, 'onCreativeWriting' | 'isBusy' | 'onDesignMode' | 'onSimulationMode' | 'onCyberAnalystMode'>> = (props) => {
    const { onCreativeWriting, isBusy, onDesignMode, onSimulationMode, onCyberAnalystMode } = props;
    const actions = [
        { name: 'Creative Writing', icon: <CreativeWritingIcon className="w-4 h-4 inline-block" />, action: onCreativeWriting },
        { name: 'Design Mode', icon: <GenerateImageIcon className="w-4 h-4 inline-block" />, action: onDesignMode },
        { name: 'Simulation Mode', icon: <GenerateVideoIcon className="w-4 h-4 inline-block" />, action: onSimulationMode },
        { name: 'Cyber Analyst', icon: <CyberAnalystIcon className="w-4 h-4 inline-block" />, action: onCyberAnalystMode },
    ];
    return (
        <div className="flex-grow bg-black/20 p-4" style={{clipPath: 'polygon(15px 0, 100% 15px, 100% 100%, 0 100%, 0 0)'}}>
            <h2 className="panel-title"><QuickActionsIcon className="w-5 h-5" /><span>Quick Actions</span></h2>
             <div className="space-y-1">
                {actions.map(action => (
                    <button 
                        key={action.name} 
                        onClick={action.action}
                        disabled={isBusy}
                        className="w-full text-left flex items-center space-x-3 p-2 rounded-md hover:bg-slate-700/50 text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="text-lg w-5 text-center">{action.icon}</span>
                        <span>{action.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};


export const RightSidebar: React.FC<RightSidebarProps> = (props) => {
    return (
        <aside className="flex flex-col h-full space-y-4 overflow-y-auto styled-scrollbar pr-1 -mr-4 -my-5 py-5">
            <SystemControls {...props} />
            <QuickActions {...props} />
        </aside>
    );
};
