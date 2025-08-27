import React, { useRef } from 'react';
import { SystemControlsIcon, QuickActionsIcon, SelfHealIcon, GenerateImageIcon, GenerateVideoIcon, DeviceControlIcon, PaletteIcon } from './Icons';
import { useSoundEffects } from '../hooks/useSoundEffects';
import type { ThemeSettings } from '../types';

interface RightSidebarProps {
    onCameraClick: () => void;
    isBusy: boolean;
    onWeather: () => void;
    onSelfHeal: () => void;
    onDesignMode: () => void;
    onSimulationMode: () => void;
    sounds: ReturnType<typeof useSoundEffects>;
    themeSettings: ThemeSettings;
    onThemeChange: (settings: ThemeSettings) => void;
    onSetCustomBootVideo: (file: File) => void;
    onRemoveCustomBootVideo: () => void;
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
            <h2 className="panel-title text-secondary"><SystemControlsIcon className="w-5 h-5" /><span>System Controls</span></h2>
            <div className="grid grid-cols-2 gap-2">
                {controls.map(control => (
                     <button key={control.name} onClick={control.action} disabled={control.disabled} className="text-center p-2 bg-slate-800/50 rounded-md border border-slate-700/50 hover:bg-slate-700/50 hover:border-primary-t-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center h-20">
                        <span className="text-2xl">{control.icon}</span>
                        <p className="text-xs mt-1 text-slate-300">{control.name}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const QuickActions: React.FC<Pick<RightSidebarProps, 'isBusy' | 'onDesignMode' | 'onSimulationMode'>> = (props) => {
    const { isBusy, onDesignMode, onSimulationMode } = props;
    const actions = [
        { name: 'Design Mode', icon: <GenerateImageIcon className="w-4 h-4 inline-block" />, action: onDesignMode },
        { name: 'Simulation Mode', icon: <GenerateVideoIcon className="w-4 h-4 inline-block" />, action: onSimulationMode },
    ];
    return (
        <div className="bg-black/20 p-4" style={{clipPath: 'polygon(15px 0, 100% 15px, 100% 100%, 0 100%, 0 0)'}}>
            <h2 className="panel-title text-secondary"><QuickActionsIcon className="w-5 h-5" /><span>Quick Actions</span></h2>
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

const PRESETS = [
    { name: 'J.A.R.V.I.S. Cyan', color: '#00ffff' },
    { name: 'Stark Red', color: '#ff4d4d' },
    { name: 'Arc Reactor Blue', color: '#00aeff' },
    { name: 'Emerald Green', color: '#00ff7f' },
    { name: 'Cosmic Purple', color: '#9d6eff' },
];

const ThemeSettingsPanel: React.FC<Pick<RightSidebarProps, 'themeSettings' | 'onThemeChange' | 'sounds' | 'onSetCustomBootVideo' | 'onRemoveCustomBootVideo'>> = ({ themeSettings, onThemeChange, sounds, onSetCustomBootVideo, onRemoveCustomBootVideo }) => {
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSettingChange = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
        sounds.playClick();
        onThemeChange({ ...themeSettings, [key]: value });
    };

    const handleBootFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onSetCustomBootVideo(file);
        }
    };

    return (
         <div className="bg-black/20 p-4">
            <h2 className="panel-title text-secondary"><PaletteIcon className="w-5 h-5" /><span>Theme & Appearance</span></h2>
            <div className="space-y-4">
                {/* Color Pickers */}
                 <div>
                    <p className="block text-xs text-slate-400 mb-2">Interface Colors</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="primary-color-picker" className="text-sm text-slate-300">Primary</label>
                            <div className="relative w-10 h-10 rounded-md border border-primary-t-20 bg-slate-800/80">
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
                            <label htmlFor="panel-color-picker" className="text-sm text-slate-300">Panel BG</label>
                            <div className="relative w-10 h-10 rounded-md border border-primary-t-20 bg-slate-800/80">
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
                    <p className="block text-xs text-slate-400 mb-2">Color Presets</p>
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
                <div className="space-y-3 pt-2 border-t border-primary-t-20">
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

                {/* Default Boot Animation */}
                {!themeSettings.hasCustomBootVideo && (
                    <div className="space-y-3 pt-2 border-t border-primary-t-20">
                        <p className="text-sm text-slate-300">Default Boot Animation</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSettingChange('bootupAnimation', 'holographic')}
                                className={`flex-1 text-center py-2 text-sm rounded-md border transition-colors ${
                                    themeSettings.bootupAnimation === 'holographic'
                                        ? 'bg-primary-t-20 border-primary'
                                        : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/80'
                                }`}
                            >
                                Holographic
                            </button>
                            <button
                                onClick={() => handleSettingChange('bootupAnimation', 'video')}
                                className={`flex-1 text-center py-2 text-sm rounded-md border transition-colors ${
                                    themeSettings.bootupAnimation === 'video'
                                        ? 'bg-primary-t-20 border-primary'
                                        : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/80'
                                }`}
                            >
                                Video
                            </button>
                        </div>
                    </div>
                )}


                {/* Boot Video */}
                <div className="space-y-3 pt-2 border-t border-primary-t-20">
                     <p className="text-sm text-slate-300">Custom Boot Video</p>
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
                            className="flex-1 text-center py-2 text-sm bg-slate-700/50 rounded-md border border-slate-600/50 hover:bg-slate-700/80 transition-colors"
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
        </div>
    );
};

export const RightSidebar: React.FC<RightSidebarProps> = (props) => {
    return (
        <aside className="flex flex-col h-full space-y-4 overflow-y-auto styled-scrollbar pr-1 -mr-4 -my-5 py-5">
            <SystemControls {...props} />
            <QuickActions {...props} />
            <ThemeSettingsPanel {...props} />
        </aside>
    );
};
