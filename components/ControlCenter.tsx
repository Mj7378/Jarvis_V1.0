import React, { useState, useEffect } from 'react';
import { SmartHomeState } from '../types';
import SystemStatus from './SystemStatus';
import WeatherWidget from './WeatherWidget';
import { CameraIcon, SelfHealIcon, GenerateImageIcon, GenerateVideoIcon, TrashIcon, SettingsIcon, LockClosedIcon, LockOpenIcon, FanIcon, SceneIcon, AirPurifierIcon } from './Icons';

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
    smartHomeState: SmartHomeState;
}


// --- INTERNAL MODULES ---

const SystemStatusModule: React.FC = () => (
    <div id="status-panel" className="control-panel">
        <SystemStatus />
    </div>
);

const WeatherModule: React.FC = () => (
    <div id="weather-panel" className="holographic-panel control-panel flex flex-col items-center justify-center p-4">
        <WeatherWidget />
    </div>
);


const QuickActionsModule: React.FC<Pick<ControlCenterProps, 'onRunDiagnostics' | 'onVisionMode' | 'onClearChat' | 'onOpenSettings'>> = ({ onRunDiagnostics, onVisionMode, onClearChat, onOpenSettings }) => {
    const actions = [
        { label: "Run Diagnostics", icon: <SelfHealIcon className="w-8 h-8"/>, action: onRunDiagnostics },
        { label: "Vision Mode", icon: <CameraIcon className="w-8 h-8" />, action: onVisionMode },
        { label: "Clear Chat", icon: <TrashIcon className="w-8 h-8" />, action: onClearChat },
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

const SmartHomeDashboard: React.FC<Pick<ControlCenterProps, 'onProcessCommand' | 'onShowCameraFeed' | 'smartHomeState'>> = ({ onProcessCommand, onShowCameraFeed, smartHomeState }) => {
    const { lights, thermostat, security, appliances } = smartHomeState;
    const [temp, setTemp] = useState(thermostat);

    useEffect(() => {
        setTemp(thermostat);
    }, [thermostat]);

    const scenes = [
        { name: "Movie Night", command: "Activate movie night" },
        { name: "Good Morning", command: "Activate good morning routine" },
        { name: "Bedtime", command: "Activate bedtime sequence" },
        { name: "Welcome Home", command: "Activate welcome home sequence" },
        { name: "I'm Leaving", command: "Activate away mode" },
    ];

    return (
        <div id="home-panel" className="holographic-panel control-panel">
            <h2 className="panel-title">Smart Home Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100%-2.75rem)]">

                {/* Column 1: Lighting & Scenes */}
                <div className="space-y-4">
                    <div>
                        <h3 className="font-orbitron text-sm text-text-secondary mb-2">Lighting</h3>
                        <div className="space-y-2">
                             {Object.entries(lights).map(([room, isOn]) => (
                                <div key={room} className="flex items-center justify-between bg-panel/50 p-2 rounded-md">
                                    <label htmlFor={`${room}-light`} className="text-sm cursor-pointer">{room}</label>
                                    <div className="relative">
                                        <input type="checkbox" id={`${room}-light`} checked={isOn} onChange={() => onProcessCommand(`Turn ${isOn ? 'off' : 'on'} the ${room} lights`)} className="toggle-checkbox absolute w-full h-full opacity-0" />
                                        <label htmlFor={`${room}-light`} className="toggle-label !w-11 !h-6"><div className="toggle-dot !w-4 !h-4"></div></label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-orbitron text-sm text-text-secondary mb-2 flex items-center gap-2"><SceneIcon className="w-4 h-4" /> Scenes</h3>
                        <div className="grid grid-cols-1 gap-2">
                           {scenes.map(scene => (
                               <button key={scene.name} onClick={() => onProcessCommand(scene.command)} className="w-full text-center p-2 rounded-md hover:bg-primary-t-20 bg-panel/50 text-sm transition-colors text-text-primary">
                                   {scene.name}
                                </button>
                           ))}
                        </div>
                    </div>
                </div>
                
                {/* Column 2: Climate */}
                <div className="space-y-4">
                     <div>
                        <h3 className="font-orbitron text-sm text-text-secondary mb-2">Climate Control</h3>
                         <div className="text-center bg-panel/50 p-3 rounded-md">
                            <label className="text-xs text-text-muted">Thermostat</label>
                            <p className="text-4xl font-orbitron">{temp}°C</p>
                            <input type="range" min="16" max="28" value={temp} onChange={e => setTemp(parseInt(e.target.value))} onMouseUp={() => onProcessCommand(`Set the thermostat to ${temp} degrees Celsius`)} onTouchEnd={() => onProcessCommand(`Set the thermostat to ${temp} degrees Celsius`)} className="w-full h-2 bg-primary-t-20 rounded-lg appearance-none cursor-pointer range-lg accent-primary"/>
                         </div>
                    </div>
                     <div className="bg-panel/50 p-3 rounded-md space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm flex items-center gap-2"><FanIcon className="w-5 h-5"/> Ceiling Fan</span>
                            <div className="flex gap-1">
                                {(['off', 'low', 'high'] as const).map(speed => (
                                    <button key={speed} onClick={() => onProcessCommand(`Set the fan to ${speed} speed`)} className={`px-2 py-0.5 text-xs rounded-full transition-colors ${appliances.ceilingFan === speed ? 'bg-primary text-background font-bold' : 'bg-slate-700/80 hover:bg-slate-600/80'}`}>
                                        {speed.charAt(0).toUpperCase() + speed.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div className="flex items-center justify-between">
                            <label htmlFor="air-purifier" className="text-sm cursor-pointer flex items-center gap-2"><AirPurifierIcon className="w-5 h-5" /> Air Purifier</label>
                             <div className="relative">
                                <input type="checkbox" id="air-purifier" checked={appliances.airPurifier} onChange={() => onProcessCommand(`Turn ${appliances.airPurifier ? 'off' : 'on'} the air purifier`)} className="toggle-checkbox absolute w-full h-full opacity-0" />
                                <label htmlFor="air-purifier" className="toggle-label !w-11 !h-6"><div className="toggle-dot !w-4 !h-4"></div></label>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: Security */}
                 <div className="space-y-2">
                    <h3 className="font-orbitron text-sm text-text-secondary mb-2">Security</h3>
                    <button onClick={() => onProcessCommand(security.frontDoorLocked ? 'Unlock the front door' : 'Lock the front door')} className={`w-full flex items-center justify-center gap-3 p-3 rounded-md transition-colors ${security.frontDoorLocked ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}>
                        {security.frontDoorLocked ? <LockClosedIcon className="w-6 h-6"/> : <LockOpenIcon className="w-6 h-6"/>}
                        <span className="font-bold">{security.frontDoorLocked ? 'Front Door Locked' : 'Front Door Unlocked'}</span>
                    </button>
                    <button onClick={() => onShowCameraFeed('Main Gate')} className="w-full text-left p-2 rounded-md hover:bg-primary-t-20 bg-panel/50 text-sm transition-colors">Show Main Gate Feed</button>
                    <button onClick={() => onShowCameraFeed('Perimeter')} className="w-full text-left p-2 rounded-md hover:bg-primary-t-20 bg-panel/50 text-sm transition-colors">Show Perimeter Feed</button>
                 </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const ControlCenter: React.FC<ControlCenterProps> = (props) => {
    return (
        <div className="control-center-container styled-scrollbar view-container">
            <SystemStatusModule />
            <WeatherModule />
            <QuickActionsModule 
                onRunDiagnostics={props.onRunDiagnostics}
                onVisionMode={props.onVisionMode}
                onClearChat={props.onClearChat}
                onOpenSettings={props.onOpenSettings}
            />
            <GenerativeToolsModule 
                onDesignMode={props.onDesignMode}
                onSimulationMode={props.onSimulationMode}
            />
            <SmartHomeDashboard
                 onProcessCommand={props.onProcessCommand}
                 onShowCameraFeed={props.onShowCameraFeed}
                 smartHomeState={props.smartHomeState}
            />
        </div>
    );
};

export default ControlCenter;