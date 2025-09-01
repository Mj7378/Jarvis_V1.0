import React, { useRef, useState, useEffect } from 'react';
import { SystemControlsIcon, QuickActionsIcon, SelfHealIcon, GenerateImageIcon, GenerateVideoIcon, PaletteIcon, CheckIcon, GeminiIcon, ChevronIcon, ConversationIcon, TrashIcon, DashboardIcon } from './Icons';
import { useSoundEffects } from '../hooks/useSoundEffects';
import type { ThemeSettings } from '../types';

export interface RightSidebarProps {
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
    onSetCustomShutdownVideo: (file: File) => void;
    onRemoveCustomShutdownVideo: () => void;
    onSectionVisibilityChange: (isVisible: boolean) => void;
    isHovering: boolean;
    onClearChat: () => void;
    onDeleteVoiceProfile: (profileId: string) => void;
    onChangeActiveVoiceProfile: (profileId: string) => void;
}

const VoiceSettingsPanelContent: React.FC<Pick<RightSidebarProps, 'themeSettings' | 'onThemeChange' | 'sounds' | 'onCalibrateVoice' | 'onDeleteVoiceProfile' | 'onChangeActiveVoiceProfile'>> = ({ themeSettings, onThemeChange, sounds, onCalibrateVoice, onDeleteVoiceProfile, onChangeActiveVoiceProfile }) => {
    const handleSettingChange = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
        sounds.playClick();
        onThemeChange(prev => ({ ...prev, [key]: value }));
    };

    const handleActiveProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        sounds.playClick();
        onChangeActiveVoiceProfile(e.target.value);
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label htmlFor="voice-toggle" className="text-sm text-slate-300 cursor-pointer">J.A.R.V.I.S. Voice</label>
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
                <label htmlFor="sounds-toggle" className="text-sm text-slate-300 cursor-pointer">UI Sounds</label>
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
                <label htmlFor="sound-profile-select" className={`text-sm transition-opacity ${!themeSettings.uiSoundsEnabled ? 'text-text-muted opacity-50' : 'text-slate-300'}`}>
                    Sound Profile
                </label>
                <select
                    id="sound-profile-select"
                    value={themeSettings.soundProfile}
                    onChange={(e) => handleSettingChange('soundProfile', e.target.value as ThemeSettings['soundProfile'])}
                    disabled={!themeSettings.uiSoundsEnabled}
                    className="w-36 bg-slate-800/80 border border-primary-t-20 rounded-md p-1 px-2 focus:ring-2 ring-primary focus:outline-none text-slate-200 text-sm disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed disabled:border-slate-700"
                >
                    <option value="default">Default</option>
                    <option value="futuristic">Futuristic</option>
                    <option value="retro">Retro</option>
                </select>
            </div>

            <div className="pt-4 mt-4 border-t border-primary-t-20 space-y-3">
                <p className="font-orbitron text-sm text-slate-300">Voice Profiles</p>
                <div className="flex items-center justify-between">
                    <label htmlFor="active-voice-profile-select" className={`text-sm transition-opacity ${!themeSettings.voiceOutputEnabled ? 'text-text-muted opacity-50' : 'text-slate-300'}`}>
                        Active Profile
                    </label>
                    <select
                        id="active-voice-profile-select"
                        value={themeSettings.activeVoiceProfileId || ''}
                        onChange={handleActiveProfileChange}
                        disabled={!themeSettings.voiceOutputEnabled}
                        className="w-40 bg-slate-800/80 border border-primary-t-20 rounded-md p-1 px-2 focus:ring-2 ring-primary focus:outline-none text-slate-200 text-sm disabled:bg-disabled-bg disabled:text-disabled-text"
                    >
                        {themeSettings.voiceProfiles.map(profile => (
                            <option key={profile.id} value={profile.id}>{profile.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto styled-scrollbar pr-1">
                    {themeSettings.voiceProfiles.map(profile => (
                        <div key={profile.id} className="flex items-center justify-between p-1.5 pl-3 bg-slate-900/50 rounded-md">
                            <span className="text-sm truncate pr-2">{profile.name} {profile.id === 'default' && <span className="text-xs text-text-muted">(Default)</span>}</span>
                            <button
                                onClick={() => onDeleteVoiceProfile(profile.id)}
                                disabled={profile.id === 'default' || themeSettings.voiceProfiles.length <= 1}
                                className="p-2 text-text-muted hover:text-red-400 rounded-md disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-text-muted transition-colors"
                                aria-label={`Delete profile ${profile.name}`}
                            >
                                <TrashIcon className="w-4 h-4 flex-shrink-0" />
                            </button>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={onCalibrateVoice}
                    className="w-full text-center py-2 mt-2 text-sm bg-slate-700/50 rounded-md border border-slate-600/50 hover:bg-slate-700/80 transition-all duration-200 transform hover:scale-[1.03] active:scale-100"
                >
                    Add New Voice Profile
                </button>
            </div>
            
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-primary-t-20">
                <label htmlFor="wakeword-toggle" className="text-sm text-slate-300 cursor-pointer">Enable Wake Word</label>
                <div className="relative">
                    <input 
                        type="checkbox" 
                        id="wakeword-toggle"
                        checked={themeSettings.wakeWordEnabled}
                        onChange={(e) => handleSettingChange('wakeWordEnabled', e.target.checked)}
                        className="toggle-checkbox absolute w-full h-full opacity-0"
                    />
                    <label htmlFor="wakeword-toggle" className="toggle-label">
                        <div className="toggle-dot"></div>
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <label htmlFor="wakeword-input" className={`text-sm transition-opacity ${!themeSettings.wakeWordEnabled ? 'text-text-muted opacity-50' : 'text-slate-300'}`}>Wake Word</label>
                <input
                    id="wakeword-input"
                    type="text"
                    value={themeSettings.wakeWord}
                    onChange={(e) => handleSettingChange('wakeWord', e.target.value)}
                    disabled={!themeSettings.wakeWordEnabled}
                    className="w-36 bg-slate-800/80 border border-primary-t-20 rounded-md p-1 px-2 focus:ring-2 ring-primary focus:outline-none text-slate-200 text-sm disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed"
                />
            </div>
        </div>
    );
};

const AICoreSettingsPanel: React.FC<Pick<RightSidebarProps, 'themeSettings' | 'onThemeChange' | 'sounds'>> = 
({ themeSettings, onThemeChange, sounds }) => {
    const handlePersonaChange = (persona: 'classic' | 'stark') => {
        sounds.playClick();
        onThemeChange(p => ({ ...p, persona: persona }));
    };

    const personas = [
        { id: 'classic' as const, name: 'Classic J.A.R.V.I.S.' },
        { id: 'stark' as const, name: 'Stark Protocol' },
    ];

    return (
        <div className="space-y-2">
            <p className="text-sm text-text-muted">Select the AI's core personality.</p>
            <div className="flex gap-2">
                {personas.map(persona => (
                    <button 
                        key={persona.id} 
                        onClick={() => handlePersonaChange(persona.id)}
                        className={`flex-1 text-center py-2 text-sm rounded-md border transition-all duration-200 transform hover:scale-[1.03] active:scale-100 ${
                            themeSettings.persona === persona.id
                                ? 'bg-primary-t-20 border-primary'
                                : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/80'
                        }`}
                    >
                        {persona.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

const FULL_THEMES = [
    { name: 'J.A.R.V.I.S.', primaryColor: '#00ffff', panelColor: '#121a2b', themeMode: 'dark' as const },
    { name: 'Code Red', primaryColor: '#ff2d2d', panelColor: '#1a0a0f', themeMode: 'dark' as const },
    { name: 'Arc Reactor', primaryColor: '#00aeff', panelColor: '#0f172a', themeMode: 'dark' as const },
    { name: 'Stealth', primaryColor: '#64748b', panelColor: '#020617', themeMode: 'dark' as const },
    { name: 'Stark Light', primaryColor: '#0ea5e9', panelColor: '#ffffff', themeMode: 'light' as const },
    { name: 'Cosmic', primaryColor: '#9d6eff', panelColor: '#1e1b4b', themeMode: 'dark' as const },
];

const ThemeSettingsPanelContent: React.FC<Pick<RightSidebarProps, 'themeSettings' | 'onThemeChange' | 'sounds' | 'onSetCustomBootVideo' | 'onRemoveCustomBootVideo' | 'onSetCustomShutdownVideo' | 'onRemoveCustomShutdownVideo'>> = ({ themeSettings, onThemeChange, sounds, onSetCustomBootVideo, onRemoveCustomBootVideo, onSetCustomShutdownVideo, onRemoveCustomShutdownVideo }) => {
    
    const bootFileInputRef = useRef<HTMLInputElement>(null);
    const shutdownFileInputRef = useRef<HTMLInputElement>(null);

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
    
    const handleShutdownFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onSetCustomShutdownVideo(file);
        }
    };

    const handleThemeSelect = (theme: typeof FULL_THEMES[0]) => {
        sounds.playClick();
        onThemeChange(prev => ({
            ...prev,
            primaryColor: theme.primaryColor,
            panelColor: theme.panelColor,
            themeMode: theme.themeMode,
        }));
    };
    
    const isThemeActive = (theme: typeof FULL_THEMES[0]) => {
        return theme.primaryColor === themeSettings.primaryColor &&
               theme.panelColor === themeSettings.panelColor &&
               theme.themeMode === themeSettings.themeMode;
    };

    return (
        <div className="space-y-5">
            {/* Theme Presets */}
            <div>
                <p className="block text-sm text-slate-300 mb-2 font-orbitron">Appearance Profiles</p>
                <div className="grid grid-cols-3 gap-3">
                    {FULL_THEMES.map(theme => (
                        <button key={theme.name} onClick={() => handleThemeSelect(theme)} className="group focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-background ring-primary rounded-lg">
                             <div className={`relative w-full aspect-square rounded-lg border-2 transition-all duration-200 ${isThemeActive(theme) ? 'border-white scale-105' : 'border-transparent group-hover:border-primary-t-50'}`}>
                                <div className="absolute inset-0 rounded-md" style={{ backgroundColor: theme.panelColor, border: `3px solid ${theme.primaryColor}` }}></div>
                                {isThemeActive(theme) && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
                                        <CheckIcon className="w-6 h-6 text-white" />
                                    </div>
                                )}
                            </div>
                            <p className={`text-xs text-center mt-1.5 transition-colors ${isThemeActive(theme) ? 'text-text-primary' : 'text-text-muted group-hover:text-text-secondary'}`}>{theme.name}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Customization */}
            <div className="space-y-4 pt-4 border-t border-primary-t-20">
                <p className="block text-sm text-slate-300 font-orbitron">Customize</p>
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="primary-color-picker" className="text-sm text-slate-300">Primary Color</label>
                        <div className="relative w-24 h-8 rounded-md border border-primary-t-20 bg-slate-800/80 flex items-center px-2">
                            <input
                                type="color"
                                id="primary-color-picker"
                                value={themeSettings.primaryColor}
                                onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Select custom primary color"
                            />
                            <div 
                                className="w-6 h-6 rounded-md" 
                                style={{ backgroundColor: themeSettings.primaryColor }}
                            ></div>
                            <span className="ml-2 text-xs font-mono">{themeSettings.primaryColor}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="panel-color-picker" className="text-sm text-slate-300">Panel BG Color</label>
                         <div className="relative w-24 h-8 rounded-md border border-primary-t-20 bg-slate-800/80 flex items-center px-2">
                            <input
                                type="color"
                                id="panel-color-picker"
                                value={themeSettings.panelColor}
                                onChange={(e) => handleSettingChange('panelColor', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Select custom panel color"
                            />
                            <div 
                                className="w-6 h-6 rounded-md" 
                                style={{ backgroundColor: themeSettings.panelColor }}
                            ></div>
                             <span className="ml-2 text-xs font-mono">{themeSettings.panelColor}</span>
                        </div>
                    </div>
                </div>
            </div>


            {/* Toggles */}
            <div className="space-y-3 pt-4 border-t border-primary-t-20">
                <p className="block text-sm text-slate-300 font-orbitron">Visual Effects</p>
                <div className="flex items-center justify-between">
                    <label htmlFor="grid-toggle" className="text-sm text-slate-300 cursor-pointer">Grid Background</label>
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
                    <label htmlFor="scanlines-toggle" className="text-sm text-slate-300 cursor-pointer">Scanline Overlay</label>
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
                    <label htmlFor="flicker-toggle" className="text-sm text-slate-300 cursor-pointer">Text Flicker Effect</label>
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

            {/* Sequences */}
            <div className="space-y-4 pt-4 border-t border-primary-t-20">
                <p className="text-sm text-slate-300 font-orbitron">System Sequences</p>
                
                {/* Boot Animation */}
                <div className="space-y-2">
                    <p className="text-xs text-text-muted">Bootup Animation</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleSettingChange('bootupAnimation', 'holographic')}
                            className={`flex-1 text-center py-2 text-sm rounded-md border transition-all duration-200 transform hover:scale-[1.03] active:scale-100 ${
                                themeSettings.bootupAnimation === 'holographic'
                                    ? 'bg-primary-t-20 border-primary'
                                    : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/80'
                            }`}
                        >
                            Holographic
                        </button>
                        <button
                            onClick={() => handleSettingChange('bootupAnimation', 'video')}
                            disabled={!themeSettings.hasCustomBootVideo}
                            className={`flex-1 text-center py-2 text-sm rounded-md border transition-all duration-200 transform hover:scale-[1.03] active:scale-100 ${
                                themeSettings.bootupAnimation === 'video'
                                    ? 'bg-primary-t-20 border-primary'
                                    : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/80'
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-700/50`}
                        >
                            Video
                        </button>
                    </div>
                    <input type="file" accept="video/*" ref={bootFileInputRef} onChange={handleBootFileSelect} className="hidden" />
                    <div className="flex gap-2">
                        <button 
                            onClick={() => bootFileInputRef.current?.click()}
                            className="flex-1 text-center py-2 text-sm bg-slate-700/50 rounded-md border border-slate-600/50 hover:bg-slate-700/80 transition-all duration-200 transform hover:scale-[1.03] active:scale-100"
                        >
                            {themeSettings.hasCustomBootVideo ? 'Change Boot Video' : 'Set Boot Video'}
                        </button>
                        {themeSettings.hasCustomBootVideo && (
                            <button
                                onClick={onRemoveCustomBootVideo}
                                className="py-2 px-3 text-sm bg-red-800/50 rounded-md border border-red-600/50 hover:bg-red-700/80 transition-all duration-200 transform hover:scale-105 active:scale-100"
                                aria-label="Remove custom boot video"
                            >
                                &#x2715;
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Shutdown Animation */}
                 <div className="space-y-2 pt-2">
                    <p className="text-xs text-text-muted">Shutdown Animation</p>
                    <input type="file" accept="video/*" ref={shutdownFileInputRef} onChange={handleShutdownFileSelect} className="hidden" />
                    <div className="flex gap-2">
                        <button 
                            onClick={() => shutdownFileInputRef.current?.click()}
                            className="flex-1 text-center py-2 text-sm bg-slate-700/50 rounded-md border border-slate-600/50 hover:bg-slate-700/80 transition-all duration-200 transform hover:scale-[1.03] active:scale-100"
                        >
                            {themeSettings.hasCustomShutdownVideo ? 'Change Shutdown Video' : 'Set Shutdown Video'}
                        </button>
                        {themeSettings.hasCustomShutdownVideo && (
                            <button
                                onClick={onRemoveCustomShutdownVideo}
                                className="py-2 px-3 text-sm bg-red-800/50 rounded-md border border-red-600/50 hover:bg-red-700/80 transition-all duration-200 transform hover:scale-105 active:scale-100"
                                aria-label="Remove custom shutdown video"
                            >
                                &#x2715;
                            </button>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
};

const LayoutIcon: React.FC<{ type: 'classic' | 'tactical', className?: string }> = ({ type, className }) => {
    if (type === 'tactical') {
        return (
            <svg viewBox="0 0 24 24" className={className}>
                <rect x="1" y="1" width="7" height="22" rx="1"/>
                <rect x="9" y="1" width="14" height="4" rx="1"/>
                <rect x="9" y="6" width="14" height="17" rx="1"/>
            </svg>
        );
    }
    // classic
    return (
         <svg viewBox="0 0 24 24" className={className}>
            <rect x="1" y="1" width="22" height="4" rx="1"/>
            <rect x="1" y="6" width="22" height="12" rx="1"/>
            <rect x="1" y="19" width="22" height="4" rx="1"/>
        </svg>
    );
};

const LayoutSettingsPanelContent: React.FC<Pick<RightSidebarProps, 'themeSettings' | 'onThemeChange' | 'sounds'>> = ({ themeSettings, onThemeChange, sounds }) => {
    
    const handleLayoutChange = (layout: 'classic' | 'tactical') => {
        sounds.playClick();
        onThemeChange(prev => ({ ...prev, hudLayout: layout }));
    };

    const layouts = [
        { name: 'Classic', type: 'classic' as const },
        { name: 'Tactical', type: 'tactical' as const },
    ];

    return (
        <div>
            <p className="block text-sm text-slate-300 mb-2 font-orbitron">Select Layout</p>
            <div className="grid grid-cols-2 gap-3">
                {layouts.map(layout => (
                    <button key={layout.name} onClick={() => handleLayoutChange(layout.type)} className="group focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-background ring-primary rounded-lg">
                        <div className={`relative w-full aspect-video p-2 rounded-lg border-2 transition-all duration-200 ${themeSettings.hudLayout === layout.type ? 'border-white scale-105' : 'border-transparent group-hover:border-primary-t-50'}`}>
                           <LayoutIcon type={layout.type} className={`w-full h-full ${themeSettings.hudLayout === layout.type ? 'fill-primary' : 'fill-primary-t-50'} group-hover:fill-primary transition-colors`} />
                        </div>
                        <p className={`text-xs text-center mt-1.5 transition-colors ${themeSettings.hudLayout === layout.type ? 'text-text-primary' : 'text-text-muted group-hover:text-text-secondary'}`}>{layout.name}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, icon, children, isOpen, onToggle }) => {
    const id = `collapsible-${title.replace(/\s+/g, '-')}`;

    return (
        <div className="border border-primary-t-20 rounded-lg overflow-hidden transition-all duration-300 bg-panel/20">
            <h3>
                <button
                    type="button"
                    onClick={onToggle}
                    className="w-full flex items-center justify-between p-3 hover:bg-primary-t-20 transition-colors duration-200"
                    aria-expanded={isOpen}
                    aria-controls={id}
                >
                    <div className="flex items-center gap-3">
                        {icon}
                        <span className="font-orbitron text-text-secondary">{title}</span>
                    </div>
                    <ChevronIcon className={`w-5 h-5 transition-transform duration-300 text-text-muted ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
                </button>
            </h3>
            <div
                id={id}
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="p-3 border-t border-primary-t-20">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};


export const RightSidebar: React.FC<RightSidebarProps> = (props) => {
    const { 
        isBusy, 
        onCameraClick, onWeather, onSelfHeal,
        onDesignMode, onSimulationMode, onClearChat,
        onSectionVisibilityChange, isHovering
    } = props;

    const [openSection, setOpenSection] = useState<string | null>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        onSectionVisibilityChange(openSection !== null);
    }, [openSection, onSectionVisibilityChange]);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (openSection !== null && !isHovering) {
            timeoutRef.current = window.setTimeout(() => {
                setOpenSection(null);
            }, 2000);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [openSection, isHovering]);


    const handleToggleSection = (sectionTitle: string) => {
        props.sounds.playClick();
        setOpenSection(prevOpenSection => 
            prevOpenSection === sectionTitle ? null : sectionTitle
        );
    };
    
    const systemControls = [
        { name: 'Camera', icon: '📷', action: onCameraClick, disabled: isBusy },
        { name: 'Weather', icon: '🌦️', action: onWeather, disabled: isBusy },
        { name: 'Self Heal', icon: <SelfHealIcon className="w-6 h-6 inline-block" />, action: onSelfHeal, disabled: isBusy },
    ];
    
    const quickActions = [
        { name: 'Image Studio', icon: <GenerateImageIcon className="w-4 h-4 inline-block" />, action: onDesignMode },
        { name: 'Simulation Mode', icon: <GenerateVideoIcon className="w-4 h-4 inline-block" />, action: onSimulationMode },
    ];
    
    return (
        <aside 
            className="flex flex-col space-y-2"
        >
            <CollapsibleSection
                title="System Controls"
                icon={<SystemControlsIcon className="w-5 h-5 text-primary" />}
                isOpen={openSection === "System Controls"}
                onToggle={() => handleToggleSection("System Controls")}
            >
                <div className="grid grid-cols-2 gap-2">
                    {systemControls.map(control => (
                         <button key={control.name} onClick={control.action} disabled={control.disabled} className="text-center p-2 bg-slate-800/50 rounded-md border border-slate-700/50 hover:bg-slate-700/50 hover:border-primary-t-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center h-20 transform hover:scale-105 active:scale-100">
                            <span className="text-2xl">{control.icon}</span>
                            <p className="text-xs mt-1 text-slate-300">{control.name}</p>
                        </button>
                    ))}
                </div>
            </CollapsibleSection>
            
            <CollapsibleSection
                title="Quick Actions"
                icon={<QuickActionsIcon className="w-5 h-5 text-primary" />}
                isOpen={openSection === "Quick Actions"}
                onToggle={() => handleToggleSection("Quick Actions")}
            >
                <div className="space-y-1">
                    {quickActions.map(action => (
                        <button 
                            key={action.name} 
                            onClick={action.action}
                            disabled={isBusy}
                            className="w-full text-left flex items-center space-x-3 p-2 rounded-md hover:bg-slate-700/50 text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-[1.03] active:scale-100"
                        >
                            <span className="text-lg w-5 text-center">{action.icon}</span>
                            <span>{action.name}</span>
                        </button>
                    ))}
                </div>
            </CollapsibleSection>
            
            <CollapsibleSection
                title="Conversation"
                icon={<ConversationIcon className="w-5 h-5 text-primary" />}
                isOpen={openSection === "Conversation"}
                onToggle={() => handleToggleSection("Conversation")}
            >
                <button
                    onClick={onClearChat}
                    className="w-full flex items-center justify-center gap-3 p-2 rounded-md text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/20 hover:text-yellow-300 transition-all duration-300 group"
                >
                    <TrashIcon className="w-5 h-5" />
                    <span className="font-orbitron tracking-wider text-sm">Clear History</span>
                </button>
            </CollapsibleSection>
            
            <CollapsibleSection
                title="AI Core"
                icon={<GeminiIcon className="w-5 h-5 text-primary" />}
                isOpen={openSection === "AI Core"}
                onToggle={() => handleToggleSection("AI Core")}
            >
                <AICoreSettingsPanel {...props} />
            </CollapsibleSection>

            <CollapsibleSection
                title="Voice & Audio"
                icon={<svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                isOpen={openSection === "Voice & Audio"}
                onToggle={() => handleToggleSection("Voice & Audio")}
            >
                <VoiceSettingsPanelContent {...props} />
            </CollapsibleSection>

            <CollapsibleSection
                title="Theme & Appearance"
                icon={<PaletteIcon className="w-5 h-5 text-primary" />}
                isOpen={openSection === "Theme & Appearance"}
                onToggle={() => handleToggleSection("Theme & Appearance")}
            >
                 <ThemeSettingsPanelContent {...props} />
            </CollapsibleSection>
            
            <CollapsibleSection
                title="HUD Layout"
                icon={<DashboardIcon className="w-5 h-5 text-primary" />}
                isOpen={openSection === "HUD Layout"}
                onToggle={() => handleToggleSection("HUD Layout")}
            >
                <LayoutSettingsPanelContent {...props} />
            </CollapsibleSection>
        </aside>
    );
};