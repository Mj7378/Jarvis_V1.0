

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PowerIcon, SettingsIcon, CloseIcon, HomeIcon, CheckIcon, GeminiIcon, ConversationIcon, TrashIcon, PaletteIcon, PlusIcon, DriveIcon } from './Icons';
import { useSoundEffects } from '../hooks/useSoundEffects';
import type { ThemeSettings } from '../types';


interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShutdown: () => void;
    onClearChat: () => void;
    onConnectHA: () => void;
    onDisconnectHA: () => void;
    haConnectionStatus: string;
    themeSettings: ThemeSettings;
    onThemeChange: (value: React.SetStateAction<ThemeSettings>) => void;
    sounds: ReturnType<typeof useSoundEffects>;
    onSetCustomBootVideo: (file: File) => void;
    onRemoveCustomBootVideo: () => void;
    onSetCustomShutdownVideo: (file: File) => void;
    onRemoveCustomShutdownVideo: () => void;
    onCalibrateVoice: () => void;
    onChangeActiveVoiceProfile: (profileId: string) => void;
    onDeleteVoiceProfile: (profileId: string) => void;
    initialSection?: string;
}


const ToggleSwitch: React.FC<{ id: string; label: string; checked: boolean; onChange: (checked: boolean) => void; }> = 
({ id, label, checked, onChange }) => (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-800/50">
        <label htmlFor={id} className="text-sm text-slate-300 cursor-pointer">{label}</label>
        <div className="relative">
            <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} className="toggle-checkbox absolute w-full h-full opacity-0 cursor-pointer" />
            <div className="toggle-label"><span className="toggle-dot"></span></div>
        </div>
    </div>
);

const FULL_THEMES = [
    { name: 'J.A.R.V.I.S.', primaryColor: '#00ffff', panelColor: '#121a2b', themeMode: 'dark' as const },
    { name: 'Code Red', primaryColor: '#ff2d2d', panelColor: '#1a0a0f', themeMode: 'dark' as const },
    { name: 'Arc Reactor', primaryColor: '#00aeff', panelColor: '#0f172a', themeMode: 'dark' as const },
    { name: 'Stealth', primaryColor: '#64748b', panelColor: '#020617', themeMode: 'dark' as const },
    { name: 'Stark Light', primaryColor: '#0ea5e9', panelColor: '#ffffff', themeMode: 'light' as const },
    { name: 'Cosmic', primaryColor: '#9d6eff', panelColor: '#1e1b4b', themeMode: 'dark' as const },
];


const ThemeAppearancePanel: React.FC<Pick<SettingsModalProps, 'themeSettings' | 'onThemeChange' | 'sounds'>> = 
({ themeSettings, onThemeChange, sounds }) => {

    const handleThemePreset = (theme: typeof FULL_THEMES[0]) => {
        sounds.playClick();
        onThemeChange(p => ({ ...p, primaryColor: theme.primaryColor, panelColor: theme.panelColor, themeMode: theme.themeMode }));
    };

    const handleSettingChange = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
        onThemeChange(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-4">
            <div>
                <h4 className="text-sm font-orbitron text-text-muted mb-2">Theme Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                    {FULL_THEMES.map(theme => (
                        <button key={theme.name} onClick={() => handleThemePreset(theme)} className="p-2 text-sm rounded-md border text-center transition-colors" style={{ borderColor: theme.primaryColor, color: theme.primaryColor, backgroundColor: theme.panelColor }}>{theme.name}</button>
                    ))}
                </div>
            </div>
             <div>
                <h4 className="text-sm font-orbitron text-text-muted mb-2">Custom Colors</h4>
                <div className="flex items-center justify-between">
                    <label htmlFor="primaryColor" className="text-sm">Primary Color</label>
                    <input type="color" id="primaryColor" value={themeSettings.primaryColor} onChange={e => handleSettingChange('primaryColor', e.target.value)} className="w-8 h-8 p-0 border-none rounded-md bg-transparent" />
                </div>
                 <div className="flex items-center justify-between mt-2">
                    <label htmlFor="panelColor" className="text-sm">Panel Background</label>
                    <input type="color" id="panelColor" value={themeSettings.panelColor} onChange={e => handleSettingChange('panelColor', e.target.value)} className="w-8 h-8 p-0 border-none rounded-md bg-transparent" />
                </div>
            </div>
            <div>
                <h4 className="text-sm font-orbitron text-text-muted mb-1">Visual Effects</h4>
                <ToggleSwitch id="show-grid" label="Show Background Grid" checked={themeSettings.showGrid} onChange={v => handleSettingChange('showGrid', v)} />
                <ToggleSwitch id="show-scanlines" label="Show Scanline Overlay" checked={themeSettings.showScanlines} onChange={v => handleSettingChange('showScanlines', v)} />
                <ToggleSwitch id="show-flicker" label="Text Flicker Effect" checked={themeSettings.showTextFlicker} onChange={v => handleSettingChange('showTextFlicker', v)} />
            </div>
        </div>
    );
};

const VoiceAudioPanel: React.FC<Pick<SettingsModalProps, 'themeSettings' | 'onThemeChange' | 'sounds' | 'onCalibrateVoice' | 'onChangeActiveVoiceProfile' | 'onDeleteVoiceProfile'>> =
({ themeSettings, onThemeChange, sounds, onCalibrateVoice, onChangeActiveVoiceProfile, onDeleteVoiceProfile }) => {

     const handleSettingChange = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
        onThemeChange(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-4">
            <div>
                <ToggleSwitch id="voice-output" label="Voice Output" checked={themeSettings.voiceOutputEnabled} onChange={v => handleSettingChange('voiceOutputEnabled', v)} />
                <ToggleSwitch id="ui-sounds" label="UI Sounds" checked={themeSettings.uiSoundsEnabled} onChange={v => handleSettingChange('uiSoundsEnabled', v)} />
            </div>
            <div>
                 <label htmlFor="sound-profile" className="block text-sm text-slate-300 mb-1 px-2">Sound Profile</label>
                 <select id="sound-profile" value={themeSettings.soundProfile} onChange={e => handleSettingChange('soundProfile', e.target.value as ThemeSettings['soundProfile'])} className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200 text-sm">
                     <option value="default">Default</option>
                     <option value="futuristic">Futuristic</option>
                     <option value="retro">Retro</option>
                 </select>
            </div>
            <div>
                <h4 className="text-sm font-orbitron text-text-muted mb-2">Voice Profiles</h4>
                <div className="space-y-2">
                    {themeSettings.voiceProfiles.map(profile => (
                        <div key={profile.id} className={`flex items-center justify-between p-2 rounded-md transition-colors ${themeSettings.activeVoiceProfileId === profile.id ? 'bg-primary-t-20' : 'bg-slate-800/50'}`}>
                            <button onClick={() => onChangeActiveVoiceProfile(profile.id)} className="flex-1 text-left text-sm">{profile.name}</button>
                            {themeSettings.activeVoiceProfileId === profile.id && <CheckIcon className="w-5 h-5 text-primary"/>}
                            {profile.id !== 'default' && <button onClick={() => onDeleteVoiceProfile(profile.id)} className="ml-2 p-1 text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>}
                        </div>
                    ))}
                    <button onClick={onCalibrateVoice} className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-primary border border-primary/50 hover:bg-primary/20 transition-all duration-300 group mt-2">
                        <PlusIcon className="w-5 h-5"/>
                        <span className="text-sm">Calibrate New Voice</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const PersonaPanel: React.FC<Pick<SettingsModalProps, 'themeSettings' | 'onThemeChange'>> = ({ themeSettings, onThemeChange }) => {
    const personas: { id: 'stark' | 'classic', name: string, desc: string }[] = [
        { id: 'stark', name: 'Stark Protocol', desc: 'Witty, sarcastic, and brilliant.' },
        { id: 'classic', name: 'J.A.R.V.I.S. Classic', desc: 'Polite, efficient, and formal.' },
    ];
    return (
        <div className="space-y-2">
            {personas.map(p => (
                 <button 
                    key={p.id} 
                    onClick={() => onThemeChange(prev => ({...prev, persona: p.id}))}
                    className={`w-full text-left p-2 rounded-md border transition-all duration-200 ${themeSettings.persona === p.id ? 'bg-primary-t-20 border-primary' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/80'}`}
                >
                    <div className="flex justify-between items-center">
                        <span className="font-bold">{p.name}</span>
                        {themeSettings.persona === p.id && <CheckIcon className="w-5 h-5 text-primary"/>}
                    </div>
                    <p className="text-xs text-text-muted mt-1">{p.desc}</p>
                </button>
            ))}
        </div>
    );
};

const SystemStartupPanel: React.FC<Pick<SettingsModalProps, 'themeSettings' | 'onThemeChange' | 'onSetCustomBootVideo' | 'onRemoveCustomBootVideo' | 'onSetCustomShutdownVideo' | 'onRemoveCustomShutdownVideo'>> = 
(props) => {
    const { themeSettings, onThemeChange, onSetCustomBootVideo, onRemoveCustomBootVideo, onSetCustomShutdownVideo, onRemoveCustomShutdownVideo } = props;
    const bootInputRef = useRef<HTMLInputElement>(null);
    const shutdownInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-4">
             <div>
                <h4 className="text-sm font-orbitron text-text-muted mb-2">Boot Sequence</h4>
                <div className="flex gap-2">
                    <button onClick={() => onThemeChange(p => ({...p, bootupAnimation: 'holographic'}))} className={`flex-1 p-2 text-sm rounded-md border transition-colors ${themeSettings.bootupAnimation === 'holographic' ? 'bg-primary-t-20 border-primary' : 'bg-slate-800/50 border-slate-700/50'}`}>Holographic</button>
                    <button onClick={() => onThemeChange(p => ({...p, bootupAnimation: 'video'}))} className={`flex-1 p-2 text-sm rounded-md border transition-colors ${themeSettings.bootupAnimation === 'video' ? 'bg-primary-t-20 border-primary' : 'bg-slate-800/50 border-slate-700/50'}`}>Custom Video</button>
                </div>
                {themeSettings.bootupAnimation === 'video' && (
                    <div className="mt-2 flex gap-2">
                        <input type="file" accept="video/*" ref={bootInputRef} onChange={e => e.target.files?.[0] && onSetCustomBootVideo(e.target.files[0])} className="hidden"/>
                        <button onClick={() => bootInputRef.current?.click()} className="flex-1 p-2 text-xs text-center bg-slate-700/80 rounded-md">Upload</button>
                        <button onClick={onRemoveCustomBootVideo} disabled={!themeSettings.hasCustomBootVideo} className="flex-1 p-2 text-xs text-center bg-slate-700/80 rounded-md disabled:opacity-50">Remove</button>
                    </div>
                )}
            </div>
             <div>
                <h4 className="text-sm font-orbitron text-text-muted mb-2">Shutdown Sequence</h4>
                <div className="flex gap-2">
                     <input type="file" accept="video/*" ref={shutdownInputRef} onChange={e => e.target.files?.[0] && onSetCustomShutdownVideo(e.target.files[0])} className="hidden"/>
                     <button onClick={() => shutdownInputRef.current?.click()} className="flex-1 p-2 text-xs text-center bg-slate-700/80 rounded-md">Upload Custom Video</button>
                     <button onClick={onRemoveCustomShutdownVideo} disabled={!themeSettings.hasCustomShutdownVideo} className="flex-1 p-2 text-xs text-center bg-slate-700/80 rounded-md disabled:opacity-50">Remove Custom Video</button>
                </div>
            </div>
        </div>
    );
};


const HomeAssistantSettingsPanel: React.FC<Pick<SettingsModalProps, 'themeSettings' | 'onThemeChange' | 'sounds' | 'onConnectHA' | 'onDisconnectHA' | 'haConnectionStatus'>> = 
({ themeSettings, onThemeChange, sounds, onConnectHA, onDisconnectHA, haConnectionStatus }) => {

    const handleSettingChange = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
        onThemeChange(prev => ({ ...prev, [key]: value }));
    };

    const getStatusIndicator = () => {
        switch (haConnectionStatus) {
            case 'connected': return <span className="text-green-400">Connected</span>;
            case 'connecting':
            case 'authenticating':
                return <span className="text-yellow-400 animate-pulse">Connecting...</span>;
            case 'error': return <span className="text-red-400">Connection Failed</span>;
            case 'disconnected':
            default:
                return <span className="text-text-muted">Disconnected</span>;
        }
    };
    
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="ha-url" className="block text-sm text-slate-300 mb-1">Instance URL</label>
                <input
                    type="text"
                    id="ha-url"
                    value={themeSettings.homeAssistantUrl}
                    onChange={(e) => handleSettingChange('homeAssistantUrl', e.target.value)}
                    placeholder="ws://homeassistant.local:8123/api/websocket"
                    className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200 text-sm"
                />
            </div>
             <div>
                <label htmlFor="ha-token" className="block text-sm text-slate-300 mb-1">Long-Lived Access Token</label>
                <input
                    type="password"
                    id="ha-token"
                    value={themeSettings.homeAssistantToken}
                    onChange={(e) => handleSettingChange('homeAssistantToken', e.target.value)}
                    placeholder="Enter your token"
                    className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200 text-sm"
                />
            </div>
            <div className="flex items-center justify-between pt-2">
                <div className="text-sm">Status: {getStatusIndicator()}</div>
                <div className="flex gap-2">
                    <button onClick={onDisconnectHA} disabled={haConnectionStatus === 'disconnected'} className="px-3 py-1.5 text-sm bg-red-800/50 rounded-md border border-red-600/50 hover:bg-red-700/80 disabled:opacity-50 disabled:cursor-not-allowed">Disconnect</button>
                    <button onClick={onConnectHA} disabled={haConnectionStatus === 'connected' || haConnectionStatus === 'connecting'} className="px-3 py-1.5 text-sm bg-primary-t-50 rounded-md border border-primary-t-80 hover:bg-primary-t-80 disabled:opacity-50 disabled:cursor-not-allowed">Connect</button>
                </div>
            </div>
        </div>
    );
};


const AIEngineSettingsPanel: React.FC<Pick<SettingsModalProps, 'themeSettings' | 'onThemeChange' | 'sounds'>> = 
({ themeSettings, onThemeChange, sounds }) => {
    const handleProviderChange = (provider: ThemeSettings['aiProvider']) => {
        sounds.playClick();
        onThemeChange(p => ({ ...p, aiProvider: provider }));
    };

    const providers = [
        { id: 'automatic' as const, name: 'Automatic Selection', desc: 'Allows J.A.R.V.I.S. to dynamically select the best AI for the task, balancing speed, cost, and capability. Recommended for optimal performance.' },
        { id: 'google_gemini' as const, name: 'Google Gemini (Primary)', desc: 'Forces all requests to use the primary, high-performance Gemini model. Use for tasks requiring maximum intelligence.' },
        { id: 'pica_ai' as const, name: 'Pica AI (Secondary Fallback)', desc: 'Simulates switching to a secondary, lower-cost model. Demonstrates the system\'s ability to fall back if the primary AI is unavailable.' },
    ];

    return (
        <div className="space-y-2">
            <p className="text-sm text-text-muted">
                J.A.R.V.I.S. employs a hybrid AI strategy, switching between models to ensure resilience and efficiency. This aligns with your suggestions for combining multiple services and implementing fallback logic.
            </p>
            <div className="space-y-2 pt-2">
                {providers.map(provider => (
                    <button 
                        key={provider.id} 
                        onClick={() => handleProviderChange(provider.id)}
                        className={`w-full text-left p-3 rounded-md border transition-all duration-200 ${themeSettings.aiProvider === provider.id ? 'bg-primary-t-20 border-primary' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/80'}`}
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-bold">{provider.name} {provider.id === 'pica_ai' && <span className="text-xs text-yellow-400">(Simulated)</span>}</span>
                            {themeSettings.aiProvider === provider.id && <CheckIcon className="w-5 h-5 text-primary"/>}
                        </div>
                        <p className="text-xs text-text-muted mt-1 pr-4">{provider.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const IntegrationsPanel: React.FC<Pick<SettingsModalProps, 'themeSettings' | 'onThemeChange'>> = 
({ themeSettings, onThemeChange }) => {
    const handleSettingChange = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
        onThemeChange(prev => ({ ...prev, [key]: value }));
    };
    
    return (
        <div className="space-y-4">
            <div>
                <h4 className="text-sm font-orbitron text-text-muted mb-2">Dropbox</h4>
                <label htmlFor="dropbox-client-id" className="block text-sm text-slate-300 mb-1">App Client ID</label>
                <input
                    type="text"
                    id="dropbox-client-id"
                    value={themeSettings.dropboxClientId}
                    onChange={(e) => handleSettingChange('dropboxClientId', e.target.value)}
                    placeholder="Enter your Dropbox Client ID"
                    className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200 text-sm"
                />
            </div>
            <div>
                <h4 className="text-sm font-orbitron text-text-muted mb-2">Google Drive</h4>
                <label htmlFor="google-api-key" className="block text-sm text-slate-300 mb-1">API Key</label>
                <input
                    type="text"
                    id="google-api-key"
                    value={themeSettings.googleApiKey}
                    onChange={(e) => handleSettingChange('googleApiKey', e.target.value)}
                    placeholder="Enter your Google API Key"
                    className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200 text-sm"
                />
            </div>
            <div>
                <label htmlFor="google-client-id" className="block text-sm text-slate-300 mb-1">Client ID</label>
                <input
                    type="text"
                    id="google-client-id"
                    value={themeSettings.googleClientId}
                    onChange={(e) => handleSettingChange('googleClientId', e.target.value)}
                    placeholder="Enter your Google Client ID"
                    className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200 text-sm"
                />
            </div>
             <p className="text-xs text-text-muted">API keys are stored locally in your browser and are required for cloud storage access.</p>
        </div>
    );
};


export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
    const { 
        isOpen, onClose, onShutdown, sounds, onClearChat, initialSection
    } = props;
    
    const [openSection, setOpenSection] = useState<string>(initialSection || 'Theme & Appearance');

    const handleToggleSection = (sectionTitle: string) => {
        props.sounds.playClick();
        setOpenSection(prevOpenSection => 
            prevOpenSection === sectionTitle ? '' : sectionTitle
        );
    };

    const CollapsibleSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, icon, children, isOpen, onToggle }) => {
        const id = `collapsible-${title.replace(/\s+/g, '-')}`;
        return (
            <div className="border border-primary-t-20 rounded-lg overflow-hidden transition-all duration-300 bg-panel/20">
                <h3>
                    <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-3 hover:bg-primary-t-20 transition-colors duration-200" aria-expanded={isOpen} aria-controls={id}>
                        <div className="flex items-center gap-3">{icon}<span className="font-orbitron text-text-secondary">{title}</span></div>
                        <svg className={`w-5 h-5 transition-transform duration-300 text-text-muted ${isOpen ? 'rotate-90' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </h3>
                <div id={id} className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden"><div className="p-3 border-t border-primary-t-20">{children}</div></div>
                </div>
            </div>
        );
    };
    
    return (
        <div
            className={`h-full ${isOpen ? '' : 'pointer-events-none'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
        >
            <div
                className={`h-full bg-panel shadow-2xl shadow-primary/20 flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-primary-t-20 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SettingsIcon className="w-6 h-6 text-primary" />
                        <h2 id="settings-title" className="font-orbitron text-xl text-primary">System Settings</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-primary/20 text-text-muted hover:text-primary transition-all duration-200 hover:scale-110 active:scale-100" aria-label="Close settings">
                        <CloseIcon className="w-7 h-7" />
                    </button>
                </header>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 styled-scrollbar space-y-2">
                    <CollapsibleSection title="Theme & Appearance" icon={<PaletteIcon className="w-5 h-5 text-primary"/>} isOpen={openSection === 'Theme & Appearance'} onToggle={() => handleToggleSection('Theme & Appearance')}>
                        <ThemeAppearancePanel {...props} />
                    </CollapsibleSection>
                    <CollapsibleSection title="Voice & Audio" icon={<SettingsIcon className="w-5 h-5 text-primary"/>} isOpen={openSection === 'Voice & Audio'} onToggle={() => handleToggleSection('Voice & Audio')}>
                        <VoiceAudioPanel {...props} />
                    </CollapsibleSection>
                     <CollapsibleSection title="Persona" icon={<GeminiIcon className="w-5 h-5 text-primary"/>} isOpen={openSection === 'Persona'} onToggle={() => handleToggleSection('Persona')}>
                        <PersonaPanel {...props} />
                    </CollapsibleSection>
                     <CollapsibleSection title="System Startup" icon={<PowerIcon className="w-5 h-5 text-primary"/>} isOpen={openSection === 'System Startup'} onToggle={() => handleToggleSection('System Startup')}>
                        <SystemStartupPanel {...props} />
                    </CollapsibleSection>
                    <CollapsibleSection title="AI Engine" icon={<GeminiIcon className="w-5 h-5 text-primary" />} isOpen={openSection === "AI Engine"} onToggle={() => handleToggleSection("AI Engine")}>
                        <AIEngineSettingsPanel {...props} />
                    </CollapsibleSection>
                    <CollapsibleSection title="Smart Home" icon={<HomeIcon className="w-5 h-5 text-primary" />} isOpen={openSection === "Smart Home"} onToggle={() => handleToggleSection("Smart Home")}>
                        <HomeAssistantSettingsPanel {...props} />
                    </CollapsibleSection>
                     <CollapsibleSection title="Integrations" icon={<DriveIcon className="w-5 h-5 text-primary" />} isOpen={openSection === "Integrations"} onToggle={() => handleToggleSection("Integrations")}>
                        <IntegrationsPanel {...props} />
                    </CollapsibleSection>
                    <CollapsibleSection title="Conversation" icon={<ConversationIcon className="w-5 h-5 text-primary" />} isOpen={openSection === "Conversation"} onToggle={() => handleToggleSection("Conversation")}>
                        <button onClick={onClearChat} className="w-full flex items-center justify-center gap-3 p-2 rounded-md text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/20 hover:text-yellow-300 transition-all duration-300 group">
                            <TrashIcon className="w-5 h-5" />
                            <span className="font-orbitron tracking-wider text-sm">Clear History</span>
                        </button>
                    </CollapsibleSection>
                </div>

                {/* Footer */}
                <footer className="p-4 border-t border-primary-t-20 flex-shrink-0">
                    <button
                        onClick={onShutdown}
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