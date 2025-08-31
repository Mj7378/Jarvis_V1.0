import React, { useState } from 'react';
import { AppState } from '../types';
import SystemStatus from './SystemStatus';
import { CameraIcon, SelfHealIcon, GenerateImageIcon, GenerateVideoIcon, TrashIcon, SettingsIcon } from './Icons';

// --- PROPS INTERFACE ---
interface ControlCenterProps {
    onRunDiagnostics: () => void;
    onVisionMode: () => void;
    onRealTimeVision: () => void;
    onClearChat: () => void;
    onGetWeather: () => void;
    onDesignMode: (prompt: string) => void;
    onSimulationMode: (prompt: string) => void;
    onProcessCommand: (prompt: string) => void;
    onOpenSettings: () => void;
    onShowCameraFeed: (location: string) => void;
}


// --- INTERNAL MODULES ---

const QuickActionsModule: React.FC<Pick<ControlCenterProps, 'onRunDiagnostics' | 'onVisionMode' | 'onGetWeather' | 'onOpenSettings'>> = ({ onRunDiagnostics, onVisionMode, onGetWeather, onOpenSettings }) => {
    const actions = [
        { label: "Run Diagnostics", icon: <SelfHealIcon className="w-8 h-8"/>, action: onRunDiagnostics },
        { label: "Vision Mode", icon: <CameraIcon className="w-8 h-8" />, action: onVisionMode },
        { label: "Weather", icon: <span className="text-4xl">🌦️</span>, action: onGetWeather },
        { label: "Settings", icon: <SettingsIcon className="w-8 h-8" />, action: onOpenSettings },
    ];

    return (
        <div id="actions-panel" className="holographic-panel control-panel">
            <h2 className="panel-title">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 h-[calc(100%-2.75rem)]">
                {actions.map(action => (
                    <button key={action.label} onClick={action.action} className="text-center p-2 bg-slate-800/50 rounded-md border border-slate-700/50 hover:bg-primary-t-20 hover:border-primary-t-50 transition-all flex flex-col items-center justify-center space-y-2 transform hover:scale-105 active:scale-100">
                        <div className="text-primary">{action.icon}</div>
                        <p className="text-xs text-slate-300">{action.label}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const GenerativeToolsModule: React.FC<Pick<ControlCenterProps, 'onDesignMode' | 'onSimulationMode'>> = ({ onDesignMode, onSimulationMode }) => {
    const [designPrompt, setDesignPrompt] = useState('A futuristic city skyline');
    const [simPrompt, setSimPrompt] = useState('A spaceship flying through an asteroid field');
    
    return (
        <div id="generative-panel" className="holographic-panel control-panel flex flex-col">
             <h2 className="panel-title">Generative Tools</h2>
             <div className="flex-1 flex flex-col justify-around">
                <div>
                    <label className="text-xs font-orbitron text-text-muted flex items-center gap-2 mb-1"><GenerateImageIcon className="w-4 h-4" /> Design Mode</label>
                    <input type="text" value={designPrompt} onChange={e => setDesignPrompt(e.target.value)} className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-1.5 px-2 text-sm focus:ring-2 ring-primary focus:outline-none"/>
                    <button onClick={() => onDesignMode(designPrompt)} className="w-full mt-2 py-1.5 text-sm bg-primary-t-50 hover:bg-primary-t-80 rounded-md transition-colors">Generate</button>
                </div>
                 <div>
                    <label className="text-xs font-orbitron text-text-muted flex items-center gap-2 mb-1"><GenerateVideoIcon className="w-4 h-4" /> Simulation Mode</label>
                    <input type="text" value={simPrompt} onChange={e => setSimPrompt(e.target.value)} className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-1.5 px-2 text-sm focus:ring-2 ring-primary focus:outline-none"/>
                    <button onClick={() => onSimulationMode(simPrompt)} className="w-full mt-2 py-1.5 text-sm bg-primary-t-50 hover:bg-primary-t-80 rounded-md transition-colors">Simulate</button>
                </div>
             </div>
        </div>
    );
};

const HomeAutomationModule: React.FC<Pick<ControlCenterProps, 'onProcessCommand' | 'onShowCameraFeed'>> = ({ onProcessCommand, onShowCameraFeed }) => {
    const [lights, setLights] = useState({ 'Living Room': false, 'Bedroom': false, 'Kitchen': false });
    const [thermostat, setThermostat] = useState(22);

    const handleLightToggle = (room: keyof typeof lights) => {
        const newState = !lights[room];
        setLights(prev => ({ ...prev, [room]: newState }));
        onProcessCommand(`Turn ${newState ? 'on' : 'off'} the ${room} lights`);
    };
    
    return (
        <div id="home-panel" className="holographic-panel control-panel">
            <h2 className="panel-title">Home Automation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lights */}
                <div className="space-y-2">
                    <h3 className="font-orbitron text-sm text-text-secondary">Lights</h3>
                    {Object.entries(lights).map(([room, isOn]) => (
                        <div key={room} className="flex items-center justify-between bg-panel/50 p-2 rounded-md">
                            <label htmlFor={`${room}-light`} className="text-sm cursor-pointer">{room}</label>
                            <input type="checkbox" id={`${room}-light`} checked={isOn} onChange={() => handleLightToggle(room as keyof typeof lights)} className="toggle-checkbox absolute w-full h-full opacity-0" />
                            <label htmlFor={`${room}-light`} className="toggle-label !w-11 !h-6"><div className="toggle-dot !w-4 !h-4"></div></label>
                        </div>
                    ))}
                </div>
                {/* Thermostat */}
                <div className="space-y-2">
                     <h3 className="font-orbitron text-sm text-text-secondary">Thermostat</h3>
                     <div className="text-center bg-panel/50 p-2 rounded-md">
                        <p className="text-3xl font-orbitron">{thermostat}°C</p>
                        <input type="range" min="16" max="28" value={thermostat} onChange={e => setThermostat(parseInt(e.target.value))} onMouseUp={() => onProcessCommand(`Set the thermostat to ${thermostat} degrees Celsius`)} className="w-full h-1 bg-primary-t-20 rounded-lg appearance-none cursor-pointer range-sm"/>
                     </div>
                </div>
                {/* Security */}
                <div className="space-y-2">
                    <h3 className="font-orbitron text-sm text-text-secondary">Security</h3>
                     <button onClick={() => onShowCameraFeed('Main Gate')} className="w-full text-left p-2 rounded-md hover:bg-primary-t-20 bg-panel/50 text-sm transition-colors">Show Main Gate Feed</button>
                     <button onClick={() => onShowCameraFeed('Perimeter')} className="w-full text-left p-2 rounded-md hover:bg-primary-t-20 bg-panel/50 text-sm transition-colors">Show Perimeter Feed</button>
                     <button onClick={() => onProcessCommand('Lock the front door')} className="w-full text-left p-2 rounded-md hover:bg-primary-t-20 bg-panel/50 text-sm transition-colors">Lock Front Door</button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const ControlCenter: React.FC<ControlCenterProps> = (props) => {
    return (
        <div className="control-center-container styled-scrollbar view-container">
            <QuickActionsModule 
                onRunDiagnostics={props.onRunDiagnostics}
                onVisionMode={props.onVisionMode}
                onGetWeather={props.onGetWeather}
                onOpenSettings={props.onOpenSettings}
            />
            <GenerativeToolsModule 
                onDesignMode={props.onDesignMode}
                onSimulationMode={props.onSimulationMode}
            />
            <HomeAutomationModule
                 onProcessCommand={props.onProcessCommand}
                 onShowCameraFeed={props.onShowCameraFeed}
            />
        </div>
    );
};

export default ControlCenter;