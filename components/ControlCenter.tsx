import React, { useState, useEffect, useMemo } from 'react';
import { SmartHomeState, HaEntity } from '../types';
import WeatherWidget from './WeatherWidget';
import { CameraIcon, SelfHealIcon, GenerateImageIcon, GenerateVideoIcon, SettingsIcon, LockClosedIcon, LockOpenIcon, FanIcon, SceneIcon, AirPurifierIcon, AppLauncherIcon } from './Icons';

// --- PROPS INTERFACE ---
interface ControlCenterProps {
    onRunDiagnostics: () => void;
    onVisionMode: () => void;
    onRealTimeVision: () => void;
    onClearChat: () => void;
    onGetWeather: () => void;
    onDesignMode: (prompt: string) => void;
    onSimulationMode: (prompt: string) => void;
    onDirectHomeStateChange: (params: { domain: string; service: string; entity_id: string; [key: string]: any }) => void;
    onOpenSettings: () => void;
    onShowCameraFeed: (location: string) => void;
    smartHomeState: SmartHomeState;
    onOpenAppLauncher: () => void;
}


// --- INTERNAL MODULES ---

const WeatherModule: React.FC = () => (
    <div id="weather-panel" className="holographic-panel control-panel flex flex-col items-center justify-center p-4">
        <WeatherWidget />
    </div>
);


const QuickActionsModule: React.FC<Pick<ControlCenterProps, 'onRunDiagnostics' | 'onVisionMode' | 'onOpenSettings' | 'onOpenAppLauncher'>> = ({ onRunDiagnostics, onVisionMode, onOpenSettings, onOpenAppLauncher }) => {
    const actions = [
        { label: "Run Diagnostics", icon: <SelfHealIcon className="w-8 h-8"/>, action: onRunDiagnostics },
        { label: "Vision Mode", icon: <CameraIcon className="w-8 h-8" />, action: onVisionMode },
        { label: "App Launcher", icon: <AppLauncherIcon className="w-8 h-8" />, action: onOpenAppLauncher },
        { label: "Settings", icon: <SettingsIcon className="w-8 h-8" />, action: onOpenSettings },
    ];

    return (
        <div id="actions-panel" className="holographic-panel control-panel">
            <h2 className="panel-title">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 flex-1">
                {actions.map(action => (
                    <button key={action.label} onClick={action.action} className="text-center p-2 bg-slate-800/50 rounded-md border border-slate-700/50 hover:bg-primary-t-20 hover:border-primary-t-50 transition-all flex flex-col items-center justify-center min-h-[5rem] transform hover:scale-105 active:scale-100">
                        <div className="text-primary">{action.icon}</div>
                        <p className="text-xs text-slate-300 mt-2">{action.label}</p>
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
        <div id="generative-panel" className="holographic-panel control-panel">
             <h2 className="panel-title">Generative Tools</h2>
             <div className="flex-1 flex flex-col justify-around">
                <div>
                    <label className="text-xs font-orbitron text-text-muted flex items-center gap-2 mb-1"><GenerateImageIcon className="w-4 h-4" /> Image Studio</label>
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

const SmartHomeDashboard: React.FC<Pick<ControlCenterProps, 'onDirectHomeStateChange' | 'onShowCameraFeed' | 'smartHomeState'>> = ({ onDirectHomeStateChange, onShowCameraFeed, smartHomeState }) => {
    const entities = Object.values(smartHomeState.entities);

    const lights = useMemo(() => entities.filter(e => e.entity_id.startsWith('light.')), [entities]);
    const locks = useMemo(() => entities.filter(e => e.entity_id.startsWith('lock.')), [entities]);
    const fans = useMemo(() => entities.filter(e => e.entity_id.startsWith('fan.')), [entities]);
    const switches = useMemo(() => entities.filter(e => e.entity_id.startsWith('switch.') && e.attributes.device_class !== 'outlet'), [entities]);
    const scenes = useMemo(() => entities.filter(e => e.entity_id.startsWith('scene.')), [entities]);
    const cameras = useMemo(() => entities.filter(e => e.entity_id.startsWith('camera.')), [entities]);
    const climate = useMemo(() => entities.find(e => e.entity_id.startsWith('climate.')), [entities]);
    
    const [temp, setTemp] = useState(climate?.attributes.temperature || 21);

    useEffect(() => {
        if (climate) {
            setTemp(climate.attributes.temperature);
        }
    }, [climate]);

    if (entities.length === 0) {
        return (
            <div id="home-panel" className="holographic-panel control-panel flex-col items-center justify-center text-center">
                 <h2 className="panel-title">Smart Home Dashboard</h2>
                 <div className="text-text-muted">
                    <p>Not connected to Home Assistant.</p>
                    <p className="text-xs mt-2">Please configure the integration in the settings menu.</p>
                 </div>
            </div>
        );
    }

    return (
        <div id="home-panel" className="holographic-panel control-panel">
            <h2 className="panel-title">Smart Home Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto styled-scrollbar pr-2">

                {/* Lighting */}
                {lights.length > 0 && <div>
                    <h3 className="font-orbitron text-sm text-text-secondary mb-2">Lighting</h3>
                    <div className="space-y-2">
                        {lights.map(light => (
                            <div key={light.entity_id} className="flex items-center justify-between bg-panel/50 p-2 rounded-md">
                                <label htmlFor={light.entity_id} className="text-sm cursor-pointer truncate pr-2">{light.attributes.friendly_name}</label>
                                <div className="relative">
                                    <input type="checkbox" id={light.entity_id} checked={light.state === 'on'} onChange={() => onDirectHomeStateChange({ domain: 'light', service: 'toggle', entity_id: light.entity_id })} className="toggle-checkbox absolute w-full h-full opacity-0" />
                                    <label htmlFor={light.entity_id} className="toggle-label !w-11 !h-6"><div className="toggle-dot !w-4 !h-4"></div></label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>}
                
                {/* Climate & Switches */}
                <div className="space-y-4">
                     {climate && <div>
                        <h3 className="font-orbitron text-sm text-text-secondary mb-2">Climate Control</h3>
                         <div className="text-center bg-panel/50 p-3 rounded-md">
                            <label className="text-xs text-text-muted">{climate.attributes.friendly_name}</label>
                            <p className="text-4xl font-orbitron">{temp}°C</p>
                            <input type="range" min={climate.attributes.min_temp || 16} max={climate.attributes.max_temp || 30} value={temp} onChange={e => setTemp(parseInt(e.target.value))} onMouseUp={() => onDirectHomeStateChange({ domain: 'climate', service: 'set_temperature', entity_id: climate.entity_id, temperature: temp })} onTouchEnd={() => onDirectHomeStateChange({ domain: 'climate', service: 'set_temperature', entity_id: climate.entity_id, temperature: temp })} className="w-full h-2 bg-primary-t-20 rounded-lg appearance-none cursor-pointer range-lg accent-primary"/>
                         </div>
                    </div>}
                    <div className="bg-panel/50 p-3 rounded-md space-y-2">
                        {fans.map(fan => (
                            <div key={fan.entity_id} className="flex justify-between items-center">
                                <span className="text-sm flex items-center gap-2 truncate pr-2"><FanIcon className="w-5 h-5"/> {fan.attributes.friendly_name}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => onDirectHomeStateChange({ domain: 'fan', service: 'turn_on', entity_id: fan.entity_id })} className={`px-2 py-0.5 text-xs rounded-full transition-colors ${fan.state === 'on' ? 'bg-primary text-background font-bold' : 'bg-slate-700/80 hover:bg-slate-600/80'}`}>On</button>
                                    <button onClick={() => onDirectHomeStateChange({ domain: 'fan', service: 'turn_off', entity_id: fan.entity_id })} className={`px-2 py-0.5 text-xs rounded-full transition-colors ${fan.state === 'off' ? 'bg-primary text-background font-bold' : 'bg-slate-700/80 hover:bg-slate-600/80'}`}>Off</button>
                                </div>
                            </div>
                        ))}
                         {switches.map(s => (
                             <div key={s.entity_id} className="flex items-center justify-between">
                                <label htmlFor={s.entity_id} className="text-sm cursor-pointer flex items-center gap-2 truncate pr-2"><AirPurifierIcon className="w-5 h-5" /> {s.attributes.friendly_name}</label>
                                 <div className="relative">
                                    <input type="checkbox" id={s.entity_id} checked={s.state === 'on'} onChange={() => onDirectHomeStateChange({ domain: 'switch', service: 'toggle', entity_id: s.entity_id })} className="toggle-checkbox absolute w-full h-full opacity-0" />
                                    <label htmlFor={s.entity_id} className="toggle-label !w-11 !h-6"><div className="toggle-dot !w-4 !h-4"></div></label>
                                 </div>
                            </div>
                         ))}
                    </div>
                </div>

                {/* Scenes */}
                 {scenes.length > 0 && <div>
                    <h3 className="font-orbitron text-sm text-text-secondary mb-2 flex items-center gap-2"><SceneIcon className="w-4 h-4" /> Scenes</h3>
                    <div className="grid grid-cols-1 gap-2">
                       {scenes.slice(0, 5).map(scene => (
                           <button key={scene.entity_id} onClick={() => onDirectHomeStateChange({ domain: 'scene', service: 'turn_on', entity_id: scene.entity_id })} className="w-full text-center p-2 rounded-md hover:bg-primary-t-20 bg-panel/50 text-sm transition-colors text-text-primary truncate">
                               {scene.attributes.friendly_name}
                            </button>
                       ))}
                    </div>
                </div>}
                
                {/* Security */}
                 {(locks.length > 0 || cameras.length > 0) && <div className="space-y-2">
                    <h3 className="font-orbitron text-sm text-text-secondary mb-2">Security</h3>
                    {locks.map(lock => (
                        <button key={lock.entity_id} onClick={() => onDirectHomeStateChange({ domain: 'lock', service: lock.state === 'locked' ? 'unlock' : 'lock', entity_id: lock.entity_id })} className={`w-full flex items-center justify-center gap-3 p-3 rounded-md transition-colors ${lock.state === 'locked' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}>
                            {lock.state === 'locked' ? <LockClosedIcon className="w-6 h-6"/> : <LockOpenIcon className="w-6 h-6"/>}
                            <span className="font-bold truncate">{lock.attributes.friendly_name}</span>
                        </button>
                    ))}
                    {cameras.map(camera => (
                         <button key={camera.entity_id} onClick={() => onShowCameraFeed(camera.attributes.friendly_name || 'Camera')} className="w-full text-left p-2 rounded-md hover:bg-primary-t-20 bg-panel/50 text-sm transition-colors truncate">
                             Show {camera.attributes.friendly_name}
                         </button>
                    ))}
                 </div>}
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const ControlCenter: React.FC<Omit<ControlCenterProps, 'onProcessCommand'>> = (props) => {
    return (
        <div className="control-center-container styled-scrollbar view-container">
            <WeatherModule />
            <QuickActionsModule 
                onRunDiagnostics={props.onRunDiagnostics}
                onVisionMode={props.onVisionMode}
                onOpenSettings={props.onOpenSettings}
                onOpenAppLauncher={props.onOpenAppLauncher}
            />
            <GenerativeToolsModule 
                onDesignMode={props.onDesignMode}
                onSimulationMode={props.onSimulationMode}
            />
            <SmartHomeDashboard
                 onDirectHomeStateChange={props.onDirectHomeStateChange}
                 onShowCameraFeed={props.onShowCameraFeed}
                 smartHomeState={props.smartHomeState}
            />
        </div>
    );
};

export default ControlCenter;