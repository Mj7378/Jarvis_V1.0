import React, { useRef, useState } from 'react';
import { SystemControlsIcon, QuickActionsIcon, SelfHealIcon, GenerateImageIcon, GenerateVideoIcon, PaletteIcon, SettingsIcon, CloseIcon, PowerIcon, TrashIcon } from './Icons';
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

const AccordionPanel: React.FC<{
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, children }) => {
    return (
        <div className="bg-panel/50 border border-border-secondary transition-shadow hover:shadow-md hover:shadow-primary/10" style={{clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)'}}>
            <button
                onClick={onToggle}
                className="w-full text-left p-4"
                aria-expanded={isOpen}
            >
                <div className="flex justify-between items-center w-full">
                    <h3 className="panel-title !mb-0 !pb-0 !border-none !p-0">
                        {icon}
                        <span>{title}</span>
                    </h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 text-text-muted ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            <div
                className={`transition-all duration-300 ease-in-out grid ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="pt-2 px-4 pb-4 border-t border-border-secondary">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};


const SystemControls: React.FC<Pick<SettingsModalProps, 'onCameraClick' | 'isBusy' | 'onWeather' | 'onSelfHeal' | 'onShutdown'>> = (props) => {
    const { onCameraClick, isBusy, onWeather, onSelfHeal, onShutdown } = props;
    const controls = [
        { name: 'Camera', icon: '📷', action: onCameraClick, disabled: isBusy },
        { name: 'Weather', icon: '🌦️', action: onWeather, disabled: isBusy },
        { name: 'Self Heal', icon: <SelfHealIcon className="w-6 h-6 inline-block" />, action: onSelfHeal, disabled: isBusy },
    ];
    return (
        <div className="grid grid-cols-2 gap-2">
            {controls.map(control => (
                 <button key={control.name} onClick={control.action} disabled={control.disabled} className="text-center p-2 bg-panel/50 rounded-md border border-border-secondary hover:bg-panel/80 hover:border-primary-t-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center h-20">
                    <span className="text-2xl">{control.icon}</span>
                    <p className="text-xs mt-1 text-text-primary">{control.name}</p>
                </button>
            ))}
            <button
                 key="Shutdown"
                 onClick={onShutdown}
                 disabled={isBusy}
                 className="col-span-2 text-center p-2 bg-red-800/50 rounded-md border border-red-600/50 hover:bg-red-700/50 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 text-red-300 h-16"
            >
                <PowerIcon className="w-6 h-6" />
                <span className="font-orbitron tracking-wider text-base">SHUTDOWN</span>
            </button>
        </div>
    );
};

const QuickActions: React.FC<Pick<SettingsModalProps, 'isBusy' | 'onDesignMode' | 'onSimulationMode'>> = (props) => {
    const { isBusy, onDesignMode, onSimulationMode } = props;
    const actions = [
        { name: 'Design Mode', icon: <GenerateImageIcon className="w-4 h-4 inline-block" />, action: onDesignMode },
        { name: 'Simulation Mode', icon: <GenerateVideoIcon className="w-4 h-4 inline-block" />, action: onSimulationMode },
    ];
    return (
        <div className="space-y-1">
            {actions.map(action => (
                <button 
                    key={action.name} 
                    onClick={action.action}
                    disabled={isBusy}
                    className="w-full text-left flex items-center space-x-3 p-2 rounded-md hover:bg-panel/50 text-text-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="text-lg w-5 text-center">{action.icon}</span>
                    <span>{action.name}</span>
                </button>
            ))}
        </div>
    );
};

const PRESETS = [
    { name: 'J.A.R.V.I.S. Cyan', color: '#00ffff' },
    { name: 'Stark Red', color: '#ff4d4d' },
    { name: 'Arc Reactor Blue', color: '#00aeff' },
    { name: 'Emerald Green', color: '#00ff7f' },
    { name: 'Cosmic Purple', color: '#9d6eff' },
];

const VoiceSettingsPanel: React.FC<Pick<SettingsModalProps, 'themeSettings' | 'onThemeChange' | 'sounds' | 'onCalibrateVoice'>> = ({ themeSettings, onThemeChange, sounds, onCalibrateVoice }) => {
    const handleSettingChange = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
        sounds.playClick();
        onThemeChange(prev => ({ ...prev, [key]: value }));
    };

    const handleDeleteProfile = () => {
        sounds.playClick();
        onThemeChange(prev => {
            const profileIdToDelete = prev.activeVoiceProfileId;
            if (prev.voiceProfiles.length <= 1 || !profileIdToDelete) return prev;

            const updatedProfiles = prev.voiceProfiles.filter(p => p.id !== profileIdToDelete);
            
            const newActiveId = updatedProfiles[0]?.id || null;

            return {
                ...prev,
                voiceProfiles: updatedProfiles,
                activeVoiceProfileId: newActiveId,
            };
        });
    };


    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label htmlFor="voice-toggle" className="text-sm text-text-primary cursor-pointer">J.A.R.V.I.S. Voice</label>
                <div className="relative">
                    <input 
                        type="checkbox" 
                        id="voice-toggle"
                        checked={themeSettings.voiceOutputEnabled}
                        onChange={(e) => handleSettingChange('voiceOutputEnabled', e.target.checked)}
                        className="toggle-checkbox absolute w-full h-full opacity-0"
                    />
                    <label htmlFor="voice-toggle" className="toggle-label">
                        <div className="toggle-dot"></div>
                    </label>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <label htmlFor="sounds-toggle" className="text-sm text-text-primary cursor-pointer">UI Sounds</label>
                <div className="relative">
                    <input 
                        type="checkbox" 
                        id="sounds-toggle"
                        checked={themeSettings.uiSoundsEnabled}
                        onChange={(e) => handleSettingChange('uiSoundsEnabled', e.target.checked)}
                        className="toggle-checkbox absolute w-full h-full opacity-0"
                    />
                    <label htmlFor="sounds-toggle" className="toggle-label">
                        <div className="toggle-dot"></div>
                    </label>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <label htmlFor="wakeword-input" className="text-sm text-text-primary">Wake Word</label>
                <input
                    id="wakeword-input"
                    type="text"
                    value={themeSettings.wakeWord}
                    onChange={(e) => handleSettingChange('wakeWord', e.target.value.toUpperCase())}
                    className="w-36 bg-panel/80 border border-primary-t-20 rounded-md p-1 px-2 focus:ring-2 ring-primary focus:outline-none text-text-primary text-sm"
                />
            </div>
            <div className="flex items-center justify-between">
                <label htmlFor="profile-select" className="text-sm text-text-primary">Active Profile</label>
                <div className="flex items-center gap-1">
                    <select
                        id="profile-select"
                        value={themeSettings.activeVoiceProfileId || ''}
                        onChange={(e) => {
                            sounds.playClick();
                            onThemeChange(prev => ({ ...prev, activeVoiceProfileId: e.target.value }));
                        }}
                        className="w-36 bg-panel/80 border border-primary-t-20 rounded-md p-1 px-2 focus:ring-2 ring-primary focus:outline-none text-text-primary text-sm"
                    >
                        {themeSettings.voiceProfiles.map(profile => (
                            <option key={profile.id} value={profile.id}>
                                {profile.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleDeleteProfile}
                        disabled={themeSettings.voiceProfiles.length <= 1}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        aria-label="Delete selected profile"
                    >
                       <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
             <button 
                onClick={onCalibrateVoice}
                className="w-full text-center py-2 mt-2 text-sm bg-panel/50 rounded-md border border-border-secondary hover:bg-panel/80 transition-colors"
            >
                Create New Profile
            </button>
        </div>
    );
};


const ThemeSettingsPanel: React.FC<Pick<SettingsModalProps, 'themeSettings' | 'onThemeChange' | 'sounds' | 'onSetCustomBootVideo' | 'onRemoveCustomBootVideo'>> = ({ themeSettings, onThemeChange, sounds, onSetCustomBootVideo, onRemoveCustomBootVideo }) => {
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSettingChange = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
        sounds.playClick();
        onThemeChange(prev => ({ ...prev, [key]: value }));
    };

    const handleBootFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onSetCustomBootVideo(file);
        }
    };

    return (
        <div className="space-y-4">
            {/* Color Pickers */}
             <div>
                <p className="block text-xs text-text-muted mb-2">Interface Colors</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="primary-color-picker" className="text-sm text-text-primary">Primary</label>
                        <div className="relative w-10 h-10 rounded-md border border-primary-t-20 bg-panel/80">
                            <input
                                type="color"
                                id="primary-color-picker"
                                value={themeSettings.primaryColor}
                                onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Select custom primary color"
                            />
                            <div 
                                className="w-full h-full rounded-md" 
                                style={{ backgroundColor: themeSettings.primaryColor }}
                            ></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="panel-color-picker" className="text-sm text-text-primary">Panel BG</label>
                        <div className="relative w-10 h-10 rounded-md border border-primary-t-20 bg-panel/80">
                            <input
                                type="color"
                                id="panel-color-picker"
                                value={themeSettings.panelColor}
                                onChange={(e) => handleSettingChange('panelColor', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Select custom panel color"
                            />
                            <div 
                                className="w-full h-full rounded-md" 
                                style={{ backgroundColor: themeSettings.panelColor }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Presets */}
            <div>
                <p className="block text-xs text-text-muted mb-2">Color Presets</p>
                <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => handleSettingChange('primaryColor', preset.color)}
                            className={`h-8 rounded-md border-2 transition-all ${themeSettings.primaryColor === preset.color ? 'border-white' : 'border-transparent opacity-70 hover:opacity-100'}`}
                            style={{ backgroundColor: preset.color }}
                            aria-label={`Select ${preset.name} theme`}
                        ></button>
                    ))}
                </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-border-primary">
                <div className="flex items-center justify-between">
                    <label htmlFor="theme-toggle" className="text-sm text-text-primary cursor-pointer">Light Theme</label>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id="theme-toggle"
                            checked={themeSettings.themeMode === 'light'}
                            onChange={(e) => handleSettingChange('themeMode', e.target.checked ? 'light' : 'dark')}
                            className="toggle-checkbox absolute w-full h-full opacity-0"
                        />
                        <label htmlFor="theme-toggle" className="toggle-label">
                            <div className="toggle-dot"></div>
                        </label>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="grid-toggle" className="text-sm text-text-primary cursor-pointer">Grid Background</label>
                    <div className="relative">
                         <input 
                            type="checkbox" 
                            id="grid-toggle"
                            checked={themeSettings.showGrid}
                            onChange={(e) => handleSettingChange('showGrid', e.target.checked)}
                            className="toggle-checkbox absolute w-full h-full opacity-0"
                        />
                        <label htmlFor="grid-toggle" className="toggle-label">
                            <div className="toggle-dot"></div>
                        </label>
                    </div>
                </div>
                 <div className="flex items-center justify-between">
                    <label htmlFor="scanlines-toggle" className="text-sm text-text-primary cursor-pointer">Scanline Overlay</label>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id="scanlines-toggle"
                            checked={themeSettings.showScanlines}
                            onChange={(e) => handleSettingChange('showScanlines', e.target.checked)}
                            className="toggle-checkbox absolute w-full h-full opacity-0"
                        />
                        <label htmlFor="scanlines-toggle" className="toggle-label">
                            <div className="toggle-dot"></div>
                        </label>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="flicker-toggle" className="text-sm text-text-primary cursor-pointer">Text Flicker Effect</label>
                    <div className="relative">
                         <input 
                            type="checkbox" 
                            id="flicker-toggle"
                            checked={themeSettings.showTextFlicker}
                            onChange={(e) => handleSettingChange('showTextFlicker', e.target.checked)}
                            className="toggle-checkbox absolute w-full h-full opacity-0"
                        />
                        <label htmlFor="flicker-toggle" className="toggle-label">
                            <div className="toggle-dot"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Boot Animation */}
            <div className="space-y-3 pt-2 border-t border-border-primary">
                <p className="text-sm text-text-primary">Boot Animation</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSettingChange('bootupAnimation', 'holographic')}
                        className={`flex-1 text-center py-2 text-sm rounded-md border transition-colors ${
                            themeSettings.bootupAnimation === 'holographic'
                                ? 'bg-primary-t-20 border-primary'
                                : 'bg-panel/50 border-border-secondary hover:bg-panel/80'
                        }`}
                    >
                        Holographic
                    </button>
                    <button
                        onClick={() => handleSettingChange('bootupAnimation', 'video')}
                        disabled={!themeSettings.hasCustomBootVideo}
                        className={`flex-1 text-center py-2 text-sm rounded-md border transition-colors ${
                            themeSettings.bootupAnimation === 'video'
                                ? 'bg-primary-t-20 border-primary'
                                : 'bg-panel/50 border-border-secondary hover:bg-panel/80'
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-panel/50`}
                    >
                        Video
                    </button>
                </div>
            </div>


            {/* Boot Video */}
            <div className="space-y-3 pt-2 border-t border-border-primary">
                 <p className="text-sm text-text-primary">Custom Boot Video</p>
                 <input
                    type="file"
                    accept="video/*"
                    ref={fileInputRef}
                    onChange={handleBootFileSelect}
                    className="hidden"
                />
                <div className="flex gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 text-center py-2 text-sm bg-panel/50 rounded-md border border-border-secondary hover:bg-panel/80 transition-colors"
                    >
                        {themeSettings.hasCustomBootVideo ? 'Change Video' : 'Set Video'}
                    </button>
                    {themeSettings.hasCustomBootVideo && (
                        <button
                            onClick={onRemoveCustomBootVideo}
                            className="py-2 px-3 text-sm bg-red-800/50 rounded-md border border-red-600/50 hover:bg-red-700/80 transition-colors"
                            aria-label="Remove custom boot video"
                        >
                            &#x2715;
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};

export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
    const { isOpen, onClose, ...otherProps } = props;
    const [activePanel, setActivePanel] = useState<'system' | 'actions' | 'voice' | 'theme' | null>('system');

    const handleToggle = (panel: 'system' | 'actions' | 'voice' | 'theme') => {
        otherProps.sounds.playClick();
        setActivePanel(prev => prev === panel ? null : panel);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 z-40 flex justify-end backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
        >
            <div
                className="hud-panel !absolute !top-0 !right-0 !bottom-0 !left-auto w-[360px] m-4 animate-slide-in-right-fast !p-0 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-primary-t-20 flex-shrink-0">
                    <h2 id="settings-title" className="panel-title !mb-0 !pb-0 !border-none text-lg">
                        <SettingsIcon className="w-6 h-6" />
                        <span>System Settings</span>
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-panel/50">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto styled-scrollbar p-4 space-y-4">
                     <AccordionPanel
                        title="System Controls"
                        icon={<SystemControlsIcon className="w-5 h-5" />}
                        isOpen={activePanel === 'system'}
                        onToggle={() => handleToggle('system')}
                    >
                        <SystemControls {...otherProps} />
                    </AccordionPanel>

                    <AccordionPanel
                        title="Quick Actions"
                        icon={<QuickActionsIcon className="w-5 h-5" />}
                        isOpen={activePanel === 'actions'}
                        onToggle={() => handleToggle('actions')}
                    >
                        <QuickActions {...otherProps} />
                    </AccordionPanel>

                    <AccordionPanel
                        title="Voice & Audio"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                        isOpen={activePanel === 'voice'}
                        onToggle={() => handleToggle('voice')}
                    >
                        <VoiceSettingsPanel {...otherProps} />
                    </AccordionPanel>
                    
                    <AccordionPanel
                        title="Theme & Appearance"
                        icon={<PaletteIcon className="w-5 h-5" />}
                        isOpen={activePanel === 'theme'}
                        onToggle={() => handleToggle('theme')}
                    >
                        <ThemeSettingsPanel {...otherProps} />
                    </AccordionPanel>
                </div>
            </div>
            <style>{`
                @keyframes slide-in-right-fast {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right-fast {
                    animation: slide-in-right-fast 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};