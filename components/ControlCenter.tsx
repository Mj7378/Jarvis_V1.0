

import React, { useState, useEffect, useMemo } from 'react';
import { SmartHomeState, HaEntity } from '../types';
import WeatherWidget from './WeatherWidget';
import { CameraIcon, GenerateImageIcon, GenerateVideoIcon, SettingsIcon, LockClosedIcon, LockOpenIcon, FanIcon, SceneIcon, AirPurifierIcon, AppLauncherIcon, CloseIcon, DashboardIcon, TaskIcon, TrashIcon, RefreshCwIcon, LightbulbIcon, ThermometerIcon, ChevronDownIcon } from './Icons';

// --- PROPS INTERFACE ---
export interface ControlCenterProps {
    onClose: () => void;
    onVisionMode: () => void;
    onClearChat: () => void;
    onGetWeather: () => void;
    onDesignMode: (prompt: string) => void;
    onSimulationMode: (prompt: string) => void;
    onDirectHomeStateChange: (params: { domain: string; service: string; entity_id: string; [key: string]: any }) => void;
    onOpenSettings: () => void;
    onShowCameraFeed: (location: string) => void;
    smartHomeState: SmartHomeState;
    onOpenAppLauncher: () => void;
    onOpenTaskManager: () => void;
}


// --- INTERNAL MODULES ---

const WeatherModule: React.FC<{ onGetWeather: () => void }> = ({ onGetWeather }) => (
    <div id="weather-panel" className="holographic-panel control-panel flex flex-col items-center justify-center p-4 relative">
        <WeatherWidget />
         <button 
            onClick={onGetWeather} 
            className="absolute bottom-2 right-2 p-1.5 bg-slate-800/80 rounded-full text-text-muted hover:text-primary transition-colors"
            aria-label="Get spoken weather update"
            title="Get spoken weather update"
        >
            <RefreshCwIcon className="w-4 h-4" />
        </button>
    </div>
);


const QuickActionsModule: React.FC<Pick<ControlCenterProps, 'onVisionMode' | 'onOpenSettings' | 'onOpenAppLauncher' | 'onOpenTaskManager' | 'onClearChat'>> = ({ onVisionMode, onOpenSettings, onOpenAppLauncher, onOpenTaskManager, onClearChat }) => {
    const actions = [
        { label: "Vision Mode", icon: <CameraIcon className="w-8 h-8" />, action: onVisionMode },
        { label: "App Launcher", icon: <AppLauncherIcon className="w-8 h-8" />, action: onOpenAppLauncher },
        { label: "Task Manager", icon: <TaskIcon className="w-8 h-8" />, action: onOpenTaskManager },
        { label: "Settings", icon: <SettingsIcon className="w-8 h-8" />, action: onOpenSettings },
    ];

    return (
        <div id="actions-panel" className="holographic-panel control-panel">
            <h2 className="panel-title">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
                {actions.map(action => (
                    <button key={action.label} onClick={action.action} className="text-center p-2 bg-slate-800/50 rounded-md border border-slate-700/50 hover:bg-primary-t-20 hover:border-primary-t-50 transition-all flex flex-col items-center justify-center min-h-[5rem] transform hover:scale-105 active:scale-100">
                        <div className="text-primary">{action.icon}</div>
                        <p className="text-xs text-slate-300 mt-2">{action.label}</p>
                    </button>
                ))}
            </div>
             <button onClick={onClearChat} className="w-full mt-3 p-2 text-sm bg-yellow-900/50 text-yellow-300 rounded-md border border-yellow-700/50 hover:bg-yellow-800/50 transition-colors flex items-center justify-center gap-2">
                <TrashIcon className="w-4 h-4" /> Clear Chat History
            </button>
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
                    <label htmlFor="design-prompt-input" className="text-xs font-orbitron text-text-muted flex items-center gap-2 mb-1"><GenerateImageIcon className="w-4 h-4" /> Image Studio</label>
                    <input id="design-prompt-input" type="text" value={designPrompt} onChange={e => setDesignPrompt(e.target.value)} className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-1.5 px-2 text-sm focus:ring-2 ring-primary focus:outline-none"/>
                    <button onClick={() => onDesignMode(designPrompt)} className="w-full mt-2 py-1.5 text-sm bg-primary-t-50 hover:bg-primary-t-80 rounded-md transition-colors">Generate</button>
                </div>
                 <div>
                    <label htmlFor="sim-prompt-input" className="text-xs font-orbitron text-text-muted flex items-center gap-2 mb-1"><GenerateVideoIcon className="w-4 h-4" /> Simulation Mode</label>
                    <input id="sim-prompt-input" type="text" value={simPrompt} onChange={e => setSimPrompt(e.target.value)} className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-1.5 px-2 text-sm focus:ring-2 ring-primary focus:outline-none"/>
                    <button onClick={() => onSimulationMode(simPrompt)} className="w-full mt-2 py-1.5 text-sm bg-primary-t-50 hover:bg-primary-t-80 rounded-md transition-colors">Simulate</button>
                </div>
             </div>
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; count: number; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, count, icon, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (count === 0) return null;

    return (
        <div className="bg-panel/50 rounded-lg border border-primary-t-20 overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-3 text-left hover:bg-primary-t-20 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <h3 className="font-orbitron text-sm text-text-secondary">{title} ({count})</h3>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                 <div className="overflow-hidden">
                    <div className="p-3 border-t border-primary-t-20">
                        {children}
                    </div>
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
            <div id="home-panel" className="holographic-panel control-panel flex flex-col items-center justify-center text-center">
                 <h2 className="panel-title">Smart Home</h2>
                 <div className="text-text-muted">
                    <p>Not connected to Home Assistant.</p>
                    <p className="text-xs mt-2">Configure in settings.</p>
                 </div>
            </div>
        );
    }

    return (
        <div id="home-panel" className="holographic-panel control-panel flex flex-col">
            <h2 className="panel-title">Smart Home Dashboard</h2>
            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto styled-scrollbar -mr-2 pr-2">

                <CollapsibleSection title="Climate" count={climate ? 1 : 0} icon={<ThermometerIcon className="w-5 h-5 text-primary"/>}>
                    {climate && (
                        <div className={climate.state === 'unavailable' ? 'opacity-50' : ''} title={climate.state === 'unavailable' ? 'Device Unavailable' : ''}>
                           <div className="text-center bg-panel/50 p-3 rounded-md">
                               <label className="text-xs text-text-muted">{climate.attributes.friendly_name}</label>
                               <p className="text-4xl font-orbitron">{climate.state === 'unavailable' ? '--' : temp}°C</p>
                               <input type="range" min={climate.attributes.min_temp || 16} max={climate.attributes.max_temp || 30} value={temp} onChange={e => setTemp(parseInt(e.target.value))} onMouseUp={() => onDirectHomeStateChange({ domain: 'climate', service: 'set_temperature', entity_id: climate.entity_id, temperature: temp })} onTouchEnd={() => onDirectHomeStateChange({ domain: 'climate', service: 'set_temperature', entity_id: climate.entity_id, temperature: temp })} className="w-full h-2 bg-primary-t-20 rounded-lg appearance-none cursor-pointer" />
                           </div>
                        </div>
                    )}
                </CollapsibleSection>
                
                <CollapsibleSection title="Lights" count={lights.length} icon={<LightbulbIcon className="w-5 h-5 text-primary"/>}>
                    <div className="grid grid-cols-2 gap-2">
                        {lights.map(light => (
                            <button key={light.entity_id} onClick={() => onDirectHomeStateChange({ domain: 'light', service: 'toggle', entity_id: light.entity_id })} className={`p-2 rounded-md text-left text-sm transition-colors ${light.state === 'on' ? 'bg-primary-t-20' : 'bg-slate-800/50'} ${light.state === 'unavailable' ? 'opacity-50' : ''}`} disabled={light.state === 'unavailable'}>
                                {light.attributes.friendly_name}
                                <span className={`block text-xs ${light.state === 'on' ? 'text-primary' : 'text-text-muted'}`}>{light.state === 'unavailable' ? 'Unavailable' : light.state}</span>
                            </button>
                        ))}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Scenes" count={scenes.length} icon={<SceneIcon className="w-5 h-5 text-primary"/>} defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-2">
                        {scenes.map(scene => (
                            <button key={scene.entity_id} onClick={() => onDirectHomeStateChange({ domain: 'scene', service: 'turn_on', entity_id: scene.entity_id })} className="p-2 rounded-md text-left text-sm bg-slate-800/50 hover:bg-primary-t-20 transition-colors">
                                {scene.attributes.friendly_name}
                            </button>
                        ))}
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Locks" count={locks.length} icon={<LockClosedIcon className="w-5 h-5 text-primary"/>} defaultOpen={false}>
                    <div className="space-y-2">
                        {locks.map(lock => (
                            <button key={lock.entity_id} onClick={() => onDirectHomeStateChange({ domain: 'lock', service: lock.state === 'locked' ? 'unlock' : 'lock', entity_id: lock.entity_id })} className={`flex items-center justify-between p-2 rounded-md w-full transition-colors ${lock.state === 'unavailable' ? 'opacity-50' : ''} ${lock.state === 'locked' ? 'bg-slate-800/50' : 'bg-primary-t-20'}`} disabled={lock.state === 'unavailable'}>
                                <span>{lock.attributes.friendly_name}</span>
                                {lock.state === 'locked' ? <LockClosedIcon className="w-5 h-5"/> : <LockOpenIcon className="w-5 h-5"/>}
                            </button>
                        ))}
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Fans" count={fans.length} icon={<FanIcon className="w-5 h-5 text-primary"/>} defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-2">
                         {fans.map(fan => (
                            <button key={fan.entity_id} onClick={() => onDirectHomeStateChange({ domain: 'fan', service: 'toggle', entity_id: fan.entity_id })} className={`p-2 rounded-md text-left text-sm transition-colors ${fan.state === 'on' ? 'bg-primary-t-20' : 'bg-slate-800/50'} ${fan.state === 'unavailable' ? 'opacity-50' : ''}`} disabled={fan.state === 'unavailable'}>
                                {fan.attributes.friendly_name}
                                <span className={`block text-xs ${fan.state === 'on' ? 'text-primary' : 'text-text-muted'}`}>{fan.state === 'unavailable' ? 'Unavailable' : fan.state}</span>
                            </button>
                        ))}
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="Cameras" count={cameras.length} icon={<CameraIcon className="w-5 h-5 text-primary"/>} defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-2">
                         {cameras.map(camera => (
                            <button key={camera.entity_id} onClick={() => onShowCameraFeed(camera.attributes.friendly_name || 'Camera')} className="p-2 rounded-md text-left text-sm bg-slate-800/50 hover:bg-primary-t-20 transition-colors">
                                {camera.attributes.friendly_name}
                            </button>
                        ))}
                    </div>
                </CollapsibleSection>
            </div>
        </div>
    );
};

const ControlCenter: React.FC<ControlCenterProps> = (props) => {
    return (
        <div className="holographic-panel flex flex-col h-full animate-slide-in-right">
            <div className="flex justify-between items-center panel-title !mb-2">
                <div className="flex items-center gap-3">
                    <DashboardIcon className="w-6 h-6 text-primary"/>
                    <h2 className="!m-0 !p-0 !border-none">Control Center</h2>
                </div>
                 <button onClick={props.onClose} className="p-1 rounded-full hover:bg-primary/20 text-text-muted hover:text-primary transition-all duration-200">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto styled-scrollbar -mr-2 pr-2">
                <div className="md:col-span-2">
                    <WeatherModule onGetWeather={props.onGetWeather} />
                </div>
                <QuickActionsModule {...props} />
                <GenerativeToolsModule onDesignMode={props.onDesignMode} onSimulationMode={props.onSimulationMode} />
                <div className="md:col-span-2">
                    <SmartHomeDashboard {...props} />
                </div>
            </div>
        </div>
    );
};

export default ControlCenter;
