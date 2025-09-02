
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RightSidebar, RightSidebarProps } from './RightSidebar';
import { PowerIcon, SettingsIcon, CloseIcon, HomeIcon, CheckIcon, GeminiIcon, ConversationIcon, TrashIcon } from './Icons';
import { useSoundEffects } from '../hooks/useSoundEffects';
import type { ThemeSettings } from '../types';

interface SettingsModalProps extends Omit<RightSidebarProps, 'onSectionVisibilityChange' | 'isHovering'> {
    isOpen: boolean;
    onClose: () => void;
    onShutdown: () => void;
    onClearChat: () => void;
    onConnectHA: () => void;
    onDisconnectHA: () => void;
    haConnectionStatus: string;
}

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
        { id: 'automatic' as const, name: 'Automatic Selection' },
        { id: 'google_gemini' as const, name: 'Google Gemini (Primary)' },
        { id: 'pica_ai' as const, name: 'Pica AI (Secondary)' },
    ];

    return (
        <div className="space-y-2">
            <p className="text-sm text-text-muted">Select the primary AI engine. "Automatic" allows J.A.R.V.I.S. to choose the best model for the task.</p>
            <div className="space-y-2">
                {providers.map(provider => (
                    <button 
                        key={provider.id} 
                        onClick={() => handleProviderChange(provider.id)}
                        className={`w-full text-left p-2 rounded-md border transition-all duration-200 flex items-center justify-between ${themeSettings.aiProvider === provider.id ? 'bg-primary-t-20 border-primary' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/80'}`}
                    >
                        <span>{provider.name} {provider.id === 'pica_ai' && <span className="text-xs text-yellow-400">(Simulated)</span>}</span>
                        {themeSettings.aiProvider === provider.id && <CheckIcon className="w-5 h-5 text-primary"/>}
                    </button>
                ))}
            </div>
        </div>
    );
};


export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
    const { 
        isOpen, onClose, onShutdown, sounds, onClearChat,
    } = props;

    const [isHovering, setIsHovering] = useState(false);
    const [isSectionVisible, setIsSectionVisible] = useState(false);
    const [openSection, setOpenSection] = useState<string | null>(null);
    const closeTimeoutRef = useRef<number | null>(null);

    const handleClose = useCallback(() => {
        sounds.playClose();
        onClose();
    }, [sounds, onClose]);

    useEffect(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        // If modal is open, user is not hovering, and no section is open, start timer to close modal.
        if (isOpen && !isHovering && !isSectionVisible) {
            closeTimeoutRef.current = window.setTimeout(() => {
                handleClose();
            }, 2000);
        }
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [isOpen, isHovering, isSectionVisible, handleClose]);

    const handleShutdown = () => {
        onShutdown();
    };

    const handleToggleSection = (sectionTitle: string) => {
        props.sounds.playClick();
        setOpenSection(prevOpenSection => 
            prevOpenSection === sectionTitle ? null : sectionTitle
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
            className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent pointer-events-none opacity-0'}`}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
        >
            <div
                className={`absolute top-4 right-4 left-4 sm:left-auto sm:top-20 sm:w-96 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-6rem)] bg-background shadow-2xl shadow-primary/20 border-2 border-primary-t-20 rounded-xl flex flex-col origin-top-right ${isOpen ? 'animate-pop-in-top-right' : 'opacity-0 pointer-events-none'}`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-primary-t-20 flex-shrink-0 holographic-panel !py-3 !px-4">
                    <div className="flex items-center gap-3">
                        <SettingsIcon className="w-6 h-6 text-primary" />
                        <h2 id="settings-title" className="font-orbitron text-xl text-primary">System Settings</h2>
                    </div>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-primary/20 text-text-muted hover:text-primary transition-all duration-200 hover:scale-110 active:scale-100" aria-label="Close settings">
                        <CloseIcon className="w-7 h-7" />
                    </button>
                </header>
                
                {/* Content - The RightSidebar */}
                <div className="flex-1 overflow-y-auto p-4 styled-scrollbar">
                     <div className="flex flex-col space-y-2">
                        <RightSidebar
                            {...props}
                            onSectionVisibilityChange={setIsSectionVisible}
                            isHovering={isHovering}
                        />
                        <CollapsibleSection
                            title="AI Engine Configuration"
                            icon={<GeminiIcon className="w-5 h-5 text-primary" />}
                            isOpen={openSection === "AI Engine Configuration"}
                            onToggle={() => handleToggleSection("AI Engine Configuration")}
                        >
                            <AIEngineSettingsPanel {...props} />
                        </CollapsibleSection>
                         <CollapsibleSection
                            title="Smart Home Integration"
                            icon={<HomeIcon className="w-5 h-5 text-primary" />}
                            isOpen={openSection === "Smart Home Integration"}
                            onToggle={() => handleToggleSection("Smart Home Integration")}
                        >
                            <HomeAssistantSettingsPanel {...props} />
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
                    </div>
                </div>

                {/* Footer */}
                <footer className="p-4 border-t border-primary-t-20 flex-shrink-0 holographic-panel !py-3 !px-4">
                    <button
                        onClick={handleShutdown}
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
