import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GenerateContentResponse } from '@google/genai';

// Services, Hooks, Utils
import { aiOrchestrator } from './services/aiOrchestrator';
import { HomeAssistantService } from './services/homeAssistantService';
import * as driveService from './services/googleDriveService';
import * as dropboxService from './services/dropboxService';
import { useSoundEffects, useSpeechSynthesis } from './hooks/useSoundEffects';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { saveAsset, getAsset, deleteAsset, getOperatingSystem, getCustomApps, saveCustomApp, deleteCustomApp, parseTimeString } from './utils/db';

// Types
import { ChatMessage, AppState, AICommand, DeviceControlCommand, AppError, ThemeSettings, VoiceProfile, Source, Task, SmartHomeState, HaEntity, CustomAppDefinition, ConversationalResponse, ChartVisualizationCommand, MultiToolUseCommand, DriveUser, DropboxUser, SyncedData } from './types';

// Components
import ChatLog from './components/ChatLog';
import VisionIntelligence from './components/VisionMode';
import ActionModal, { ActionModalProps, NotificationToast } from './components/ActionModal';
import GenerativeStudio from './components/GenerativeStudio';
import ErrorModal from './components/ErrorModal';
import BootingUp from './components/BootingUp';
import PreBootScreen from './components/PreBootScreen';
import { SettingsModal } from './components/SettingsModal';
import Header from './components/Header';
import Shutdown from './components/Shutdown';
import VoiceCalibrationModal from './components/VoiceCalibrationModal';
import UserInput from './components/UserInput';
import Suggestions from './components/Suggestions';
import SecurityCameraModal from './components/SecurityCameraModal';
import { HomeIcon, AppLauncherIcon, PlusIcon, CloseIcon, WolframAlphaIcon, DriveIcon, DropboxIcon } from './components/Icons';
import ControlCenter from './components/ControlCenter';
import TacticalSidebar, { PanelType } from './components/TacticalSidebar';
import CreativeBackground from './components/CreativeBackground';
import TaskManager from './components/TaskManager';


// --- A simple debounce hook ---
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


// --- App Launcher Component ---

interface AppDefinition {
  name: string;
  url: string;
  icon: React.FC<{ className?: string }>;
  bgColor: string;
  textColor: string;
}

const YouTubeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 28 28" fill="currentColor"><path d="M27.5 7.2s-.3-2.1-1.2-3C25.2 3 22.1 3 14 3s-11.2 0-12.3.2C.8 4.2.5 6.2.5 7.2s0 4.2.2 5.2.5 3 1.2 3c1.2.2 12.3.2 12.3.2s11.2 0 12.3-.2c.7-.2 1.2-1.2 1.2-3s.2-2.1.2-3.1-.2-2-.2-3zm-17 9.2V8.2l8 4.1-8 4.1z"/></svg>);
const GmailIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/></svg>);
const GitHubIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>);
const TradingViewIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 28 28" fill="currentColor"><path d="M12.936.573c-.473-.257-1.03-.257-1.503 0L.577 6.868a1.002 1.002 0 00-.577 1.002v12.25c0 .416.257.79.664.945l10.983 4.228c.49.189.945.189 1.436 0l11.097-4.228c.407-.155.664-.53.664-.945V7.87a1.002 1.002 0 00-.577-1.002L12.936.573zM2.002 8.39l10.158-5.51 10.158 5.51L12.16 13.9 2.002 8.39zm1.503 11.23V9.89l8.655 4.708v9.76l-8.655-3.128zm19.837 0l-8.655 3.128v-9.76l8.655-4.708v9.76z"/></svg>);
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>);
const ReplitIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H7v-2h4v2zm0-4H7v-2h4v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>);
const WikipediaIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 .29C5.52.29.29 5.52.29 12s5.23 11.71 11.71 11.71 11.71-5.23 11.71-11.71S18.48.29 12 .29zm-.18 4.25h.35c.68 0 1.25.59 1.25 1.26v6.62c0 .67-.57 1.26-1.25 1.26h-.35c-.68 0-1.25-.59-1.25-1.26V5.8c0-.67.57-1.26 1.25-1.26zm-4.32 0h.35c.68 0 1.25.59 1.25 1.26v6.62c0 .67-.57 1.26-1.25 1.26h-.35c-.68 0-1.25-.59-1.25-1.26V5.8c0-.67.57-1.26 1.25-1.26zm8.99 0h.35c.68 0 1.25.59 1.25 1.26v6.62c0 .67-.57 1.26-1.25 1.26h-.35c-.68 0-1.25-.59-1.25-1.26V5.8c0-.67.57-1.26 1.25-1.26zm-13.62 9.53l.38 1.15h1.22l-2.43 6.4h-.35l-2.43-6.4h1.2l.39 1.15h1.62zm9.11 0l2.36 6.4h-1.32l-.46-1.26h-2.1l-.47 1.26H9.13l2.36-6.4h1.3zm-.68 1.5l-.6 1.63h1.2l-.6-1.63z"/></svg>);


const APPS_REGISTRY: AppDefinition[] = [
  { name: 'YouTube', url: 'https://www.youtube.com', icon: YouTubeIcon, bgColor: 'bg-red-500/20', textColor: 'text-red-400' },
  { name: 'Gmail', url: 'https://mail.google.com', icon: GmailIcon, bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
  { name: 'Google Drive', url: 'https://drive.google.com', icon: DriveIcon, bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
  { name: 'GitHub', url: 'https://github.com', icon: GitHubIcon, bgColor: 'bg-gray-400/20', textColor: 'text-gray-300' },
  { name: 'TradingView', url: 'https://www.tradingview.com', icon: TradingViewIcon, bgColor: 'bg-sky-500/20', textColor: 'text-sky-400' },
  { name: 'WhatsApp', url: 'https://web.whatsapp.com', icon: WhatsAppIcon, bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400' },
  { name: 'Replit', url: 'https://replit.com', icon: ReplitIcon, bgColor: 'bg-orange-500/20', textColor: 'text-orange-400' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: WikipediaIcon, bgColor: 'bg-slate-300/20', textColor: 'text-slate-200' },
];

const COLOR_PAIRS = [
  { bgColor: 'bg-teal-500/20', textColor: 'text-teal-400' },
  { bgColor: 'bg-fuchsia-500/20', textColor: 'text-fuchsia-400' },
  { bgColor: 'bg-lime-500/20', textColor: 'text-lime-400' },
  { bgColor: 'bg-indigo-500/20', textColor: 'text-indigo-400' },
  { bgColor: 'bg-rose-500/20', textColor: 'text-rose-400' },
  { bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400' },
];

const AddAppModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAppAdded: () => void;
  existingAppCount: number;
}> = ({ isOpen, onClose, onAppAdded, existingAppCount }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !url.trim()) {
            setError('Name and URL cannot be empty.');
            return;
        }
        
        let formattedUrl = url.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = `https://${formattedUrl}`;
        }

        try {
            new URL(formattedUrl);
        } catch (_) {
            setError('Please enter a valid URL.');
            return;
        }
        
        setError('');

        const colorPair = COLOR_PAIRS[existingAppCount % COLOR_PAIRS.length];

        const newApp: CustomAppDefinition = {
            id: `custom_${Date.now()}`,
            name: name.trim(),
            url: formattedUrl,
            iconType: 'text',
            iconValue: name.trim().charAt(0).toUpperCase(),
            ...colorPair,
        };

        await saveCustomApp(newApp);
        onAppAdded();
    };
    
    useEffect(() => {
        if (isOpen) {
            setName('');
            setUrl('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[51] flex items-center justify-center backdrop-blur-sm animate-fade-in-fast" onClick={onClose}>
            <div className="holographic-panel w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-4">
                    <h2 id="modal-title" className="panel-title">Add Custom Application</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="appName" className="block text-sm font-medium text-slate-300 mb-1">App Name</label>
                            <input
                                id="appName" type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder="e.g., Google Calendar"
                                className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200"
                                required autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="appUrl" className="block text-sm font-medium text-slate-300 mb-1">URL</label>
                            <input
                                id="appUrl" type="text" value={url} onChange={e => setUrl(e.target.value)}
                                placeholder="e.g., calendar.google.com"
                                className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200"
                                required
                            />
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 transition-all duration-200 transform hover:scale-105 active:scale-100">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary-t-80 text-background hover:bg-primary disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-100">Add App</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AppLauncher: React.FC<{
  onClose: () => void;
  onAppSelect: (url: string, appName: string) => void;
}> = ({ onClose, onAppSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customApps, setCustomApps] = useState<CustomAppDefinition[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadCustomApps = useCallback(async () => {
    const apps = await getCustomApps();
    setCustomApps(apps);
  }, []);

  useEffect(() => {
    loadCustomApps();
  }, [loadCustomApps]);
  
  const allApps: (AppDefinition | CustomAppDefinition)[] = [...APPS_REGISTRY, ...customApps];
  const filteredApps = allApps.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAppAdded = () => {
    setIsAddModalOpen(false);
    loadCustomApps();
  };

  const handleDeleteApp = async (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    await deleteCustomApp(appId);
    loadCustomApps();
  };


  return (
    <div className="holographic-panel flex flex-col h-full animate-slide-in-right">
        <div className="flex justify-between items-center panel-title !mb-2">
            <div className="flex items-center gap-3 w-full">
                <AppLauncherIcon className="w-6 h-6 text-primary"/>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search applications..."
                    autoFocus
                    className="w-full bg-transparent text-lg text-text-primary placeholder:text-text-muted focus:outline-none"
                />
            </div>
             <button onClick={onClose} className="p-1 rounded-full hover:bg-primary/20 text-text-muted hover:text-primary transition-all duration-200">
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto styled-scrollbar -mr-2 pr-2">
            {filteredApps.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="group flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-primary-t-20 hover:border-primary hover:bg-primary-t-20 transition-all duration-200"
                    >
                        <PlusIcon className="w-12 h-12 text-primary-t-80 group-hover:text-primary transition-colors" />
                        <p className="mt-2 text-sm text-text-muted font-semibold">Add App</p>
                    </button>
                    {filteredApps.map(app => {
                        const isCustom = 'iconValue' in app;
                        return (
                            <button
                                key={isCustom ? app.id : app.name}
                                onClick={() => onAppSelect(app.url, app.name)}
                                className={`group relative flex flex-col items-center justify-center p-4 rounded-lg border border-primary-t-20 hover:border-primary hover:bg-primary-t-20 transition-all duration-200 transform hover:scale-105 active:scale-100 ${app.bgColor}`}
                            >
                                {'icon' in app ? (
                                    <app.icon className={`w-12 h-12 transition-colors duration-200 ${app.textColor}`} />
                                ) : (
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-orbitron text-3xl ${app.textColor}`}>
                                        {app.iconValue}
                                    </div>
                                )}
                                <p className="mt-2 text-sm text-text-primary font-semibold truncate w-full">{app.name}</p>
                                {isCustom && (
                                    <button
                                        onClick={(e) => handleDeleteApp(e, app.id)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold leading-none border-2 border-background opacity-0 group-hover:opacity-100 transform hover:scale-110 active:scale-100 transition-all"
                                        aria-label={`Delete ${app.name}`}
                                    >
                                        &times;
                                    </button>
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center text-text-muted pt-8">
                    <p>No applications found for "{searchTerm}"</p>
                </div>
            )}
        </div>
      <AddAppModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAppAdded={handleAppAdded}
        existingAppCount={customApps.length}
      />
    </div>
  );
};


// System Lifecycle States
type SystemState = 'PRE_BOOT' | 'BOOTING' | 'ACTIVE' | 'SHUTTING_DOWN' | 'SNAP_DISINTEGRATION';
type HaConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'authenticating';

// Helper function to remove markdown for clean speech.
const stripMarkdown = (text: string): string => {
    return text
        .replace(/^(# |## |### |> )/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^\s*[-*]\s+/gm, '');
};

// Helper function to convert hex to an RGB string "r, g, b"
const hexToRgb = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : null;
};

// File Reader Utilities
const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
  
const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

const getGreeting = (): ChatMessage => {
  const currentHour = new Date().getHours();
  let content: string;
  if (currentHour < 12) {
    content = "Good morning, sir. I am JARVIS. How may I assist you today?";
  } else if (currentHour < 18) {
    content = "Good afternoon, sir. I am JARVIS. How may I assist you today?";
  } else {
    content = "Good evening, sir. I am JARVIS. How may I assist you today?";
  }
  return {
    role: 'model',
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '')
  };
};
  
const DEFAULT_PROFILE: VoiceProfile = { id: 'default', name: 'J.A.R.V.I.S. Enhanced', rate: 1.2, pitch: 1.0 };
const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#ff2d2d',
  panelColor: '#1a0a0f',
  themeMode: 'dark',
  showGrid: true,
  showScanlines: true,
  showTextFlicker: false,
  hasCustomBootVideo: false,
  hasCustomShutdownVideo: false,
  bootupAnimation: 'holographic',
  voiceOutputEnabled: true,
  uiSoundsEnabled: true,
  soundProfile: 'default',
  voiceProfiles: [DEFAULT_PROFILE],
  activeVoiceProfileId: DEFAULT_PROFILE.id,
  wakeWord: 'JARVIS',
  wakeWordEnabled: false,
  aiProvider: 'automatic',
  persona: 'stark',
  homeAssistantUrl: '',
  homeAssistantToken: '',
};

const FULL_THEMES = [
    { name: 'J.A.R.V.I.S.', primaryColor: '#00ffff', panelColor: '#121a2b', themeMode: 'dark' as const },
    { name: 'Code Red', primaryColor: '#ff2d2d', panelColor: '#1a0a0f', themeMode: 'dark' as const },
    { name: 'Arc Reactor', primaryColor: '#00aeff', panelColor: '#0f172a', themeMode: 'dark' as const },
    { name: 'Stealth', primaryColor: '#64748b', panelColor: '#020617', themeMode: 'dark' as const },
    { name: 'Stark Light', primaryColor: '#0ea5e9', panelColor: '#ffffff', themeMode: 'light' as const },
    { name: 'Cosmic', primaryColor: '#9d6eff', panelColor: '#1e1b4b', themeMode: 'dark' as const },
];

const INITIAL_SMART_HOME_STATE: SmartHomeState = {
    entities: {}
};


type ToastNotification = {
  id: string;
  title: string;
  message: string;
  icon?: React.ReactNode;
};

// Storage Keys
const CHAT_HISTORY_STORAGE_KEY = 'jarvis_chat_history';
const TASKS_STORAGE_KEY = 'jarvis_tasks';
const SETTINGS_STORAGE_KEY = 'jarvis_theme_settings';
const DROPBOX_TOKEN_KEY = 'jarvis_dropbox_token';

const App: React.FC = () => {
  // System Lifecycle
  const [systemState, setSystemState] = useState<SystemState>('PRE_BOOT');

  // Core App State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [operatingSystem, setOperatingSystem] = useState<string>('Unknown');
  
  // --- Centralized State Management (Replaces useChatHistory and useTasks hooks) ---
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
        const saved = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
        if(saved) {
            const parsed = JSON.parse(saved);
            if(Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) { console.error(e); }
    return [getGreeting()];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
     try {
        const saved = localStorage.getItem(TASKS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
     } catch(e) { console.error(e); }
     return [];
  });
  
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.voiceProfiles && parsed.activeVoiceProfileId) return { ...DEFAULT_THEME, ...parsed };
        }
    } catch (e) { console.error(e); }
    return DEFAULT_THEME;
  });

  // Staged & Pinned content for multimodal input
  const [stagedImage, setStagedImage] = useState<{ mimeType: string; data: string; dataUrl: string; } | null>(null);
  const [pinnedImage, setPinnedImage] = useState<{ mimeType: string; data: string; dataUrl: string; } | null>(null);
  
  // Smart Home State & Service
  const [smartHomeState, setSmartHomeState] = useState<SmartHomeState>(INITIAL_SMART_HOME_STATE);
  const haServiceRef = useRef<HomeAssistantService | null>(null);
  const [haConnectionStatus, setHaConnectionStatus] = useState<HaConnectionStatus>('disconnected');

  // New panel-based UI state
  const [activePanels, setActivePanels] = useState<Set<PanelType>>(new Set());
  const [generativeStudioConfig, setGenerativeStudioConfig] = useState<{ prompt: string; mode: 'image' | 'video' } | null>(null);

  // --- Cloud Sync State ---
  const [isDriveReady, setIsDriveReady] = useState(false);
  const [driveUser, setDriveUser] = useState<DriveUser | null>(null);
  const [dropboxUser, setDropboxUser] = useState<DropboxUser | null>(null);
  const [dropboxToken, setDropboxToken] = useState<string | null>(() => localStorage.getItem(DROPBOX_TOKEN_KEY));
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Combine data for syncing and debounce it to prevent rapid writes
  const syncableData: SyncedData = { chatHistory, tasks, themeSettings };
  const debouncedSyncableData = useDebounce(syncableData, 2000); // 2 second debounce
  

  // --- Core Action Callbacks (replaces hook methods) ---
  const addMessage = useCallback((message: Omit<ChatMessage, 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '')
    };
    setChatHistory(prev => [...prev, newMessage]);
  }, []);

  const appendToLastMessage = useCallback((contentChunk: string) => {
    setChatHistory(prev => {
        if (prev.length === 0 || prev[prev.length - 1].role !== 'model') return prev;
        const newHistory = [...prev];
        const lastMessage = { ...newHistory[newHistory.length - 1] };
        lastMessage.content = lastMessage.content + contentChunk;
        newHistory[newHistory.length - 1] = lastMessage;
        return newHistory;
    });
  }, []);

  const updateLastMessage = useCallback((update: Partial<Omit<ChatMessage, 'timestamp'>>) => {
    setChatHistory(prev => {
        if (prev.length === 0 || prev[prev.length - 1].role !== 'model') return prev;
        const newHistory = [...prev];
        const lastMessage = newHistory[newHistory.length - 1];
        newHistory[newHistory.length - 1] = { ...lastMessage, ...update };
        return newHistory;
    });
  }, []);

  const removeLastMessage = useCallback(() => setChatHistory(prev => prev.slice(0, -1)), []);
  const clearChatHistory = useCallback(() => setChatHistory([getGreeting()]), []);

  const addTask = useCallback(async (content: string, timeString: string, recurrence: Task['recurrence'] = null) => {
    const dueDate = parseTimeString(timeString);
    if (!dueDate) return false;
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    const newTask: Task = { id: `task_${Date.now()}`, content, initialDueDate: dueDate, nextDueDate: dueDate, recurrence, completed: false };
    setTasks(prev => [...prev, newTask].sort((a,b) => a.nextDueDate - b.nextDueDate));
    return true;
  }, []);

  const deleteTask = useCallback((taskId: string) => setTasks(prev => prev.filter(task => task.id !== taskId)), []);
  const toggleTask = useCallback((taskId: string) => {
      setTasks(prev => prev.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
  }, []);


  // --- Effects ---

  // Set AI provider whenever theme settings change
  useEffect(() => { aiOrchestrator.setProvider(themeSettings.aiProvider); }, [themeSettings.aiProvider]);
  useEffect(() => { setOperatingSystem(getOperatingSystem()); }, []);
  
  // Sound & Speech
  const sounds = useSoundEffects(themeSettings.uiSoundsEnabled, themeSettings.soundProfile);
  const activeProfile = themeSettings.voiceProfiles.find(p => p.id === themeSettings.activeVoiceProfileId) || themeSettings.voiceProfiles[0] || DEFAULT_PROFILE;
  const { queueSpeech, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis(activeProfile);
  
  // UI Panel Management
  const togglePanel = useCallback((panel: PanelType) => {
      sounds.playClick();
      setActivePanels(prev => {
          const newPanels = new Set(prev);
          if (newPanels.has(panel)) {
              newPanels.delete(panel);
              if (panel === 'GENERATIVE_STUDIO') setGenerativeStudioConfig(null);
              sounds.playClose();
          } else {
              newPanels.clear(); 
              newPanels.add(panel);
              sounds.playOpen();
          }
          return newPanels;
      });
  }, [sounds]);

  // Modals & Popups
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalProps, setActionModalProps] = useState<Omit<ActionModalProps, 'isOpen' | 'onClose'>>({ title: '', inputs: [], onSubmit: () => {} });
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [cameraFeed, setCameraFeed] = useState<{ location: string } | null>(null);
  
  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileHandlerRef = useRef<{ accept: string; handler: (file: File) => void } | null>(null);
  
  // Task Due Effect
  const handleTaskDue = useCallback((task: Task) => {
    sounds.playSuccess();
    setToasts(prev => [...prev, { id: task.id, title: 'J.A.R.V.I.S. Reminder', message: task.content }]);
    if (Notification.permission === 'granted') {
        new Notification('J.A.R.V.I.S. Reminder', { body: task.content });
    }
  }, [sounds]);

  useEffect(() => {
    const notifiedThisSession = new Set<string>();
    const interval = setInterval(() => {
      const now = Date.now();
      setTasks(prevTasks => {
        const updatedTasks = [...prevTasks];
        let wasChanged = false;
        updatedTasks.forEach((task, index) => {
            if (task.recurrence && task.completed && now >= new Date(task.nextDueDate).getTime()) {
                const nextCycleStart = new Date(task.nextDueDate);
                while(nextCycleStart.getTime() <= now) {
                    switch (task.recurrence) {
                        case 'daily': nextCycleStart.setDate(nextCycleStart.getDate() + 1); break;
                        case 'weekly': nextCycleStart.setDate(nextCycleStart.getDate() + 7); break;
                        case 'weekdays': do { nextCycleStart.setDate(nextCycleStart.getDate() + 1); } while (nextCycleStart.getDay() === 0 || nextCycleStart.getDay() === 6); break;
                        case 'weekends': do { nextCycleStart.setDate(nextCycleStart.getDate() + 1); } while (nextCycleStart.getDay() > 0 && nextCycleStart.getDay() < 6); break;
                    }
                }
                updatedTasks[index] = { ...task, completed: false, nextDueDate: nextCycleStart.getTime() };
                wasChanged = true;
            }
        });
        updatedTasks.forEach(task => {
          if (!task.completed && task.nextDueDate <= now && !notifiedThisSession.has(task.id)) {
              handleTaskDue(task);
              notifiedThisSession.add(task.id);
          }
        });
        return wasChanged ? updatedTasks : prevTasks;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [handleTaskDue]);


  // Home Assistant Service Initializer
  useEffect(() => {
    haServiceRef.current = new HomeAssistantService(
        (newEntities) => setSmartHomeState({ entities: newEntities }),
        (status) => {
            setHaConnectionStatus(status);
            if(status === 'connected') sounds.playSuccess();
            if(status === 'error') sounds.playError();
        }
    );
    if (themeSettings.homeAssistantUrl && themeSettings.homeAssistantToken) {
        haServiceRef.current.connect(themeSettings.homeAssistantUrl, themeSettings.homeAssistantToken);
    }
    return () => { haServiceRef.current?.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme settings to the document
  useEffect(() => {
    const root = document.documentElement;
    const primaryRgb = hexToRgb(themeSettings.primaryColor);
    const panelRgb = hexToRgb(themeSettings.panelColor);
    if (primaryRgb) {
      root.style.setProperty('--primary-color-hex', themeSettings.primaryColor);
      root.style.setProperty('--primary-color-rgb', primaryRgb);
    }
    if (panelRgb) { document.body.style.setProperty('--panel-rgb', panelRgb); }
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${themeSettings.themeMode}`);
    const scanlineOverlay = document.querySelector('.scanline-overlay');
    if(scanlineOverlay instanceof HTMLElement) { scanlineOverlay.style.display = themeSettings.showScanlines ? 'block' : 'none'; }
  }, [themeSettings.primaryColor, themeSettings.panelColor, themeSettings.themeMode, themeSettings.showScanlines]);

  // Check for custom media assets
  useEffect(() => {
    const checkMediaAssets = async () => {
        const [bootVideo, shutdownVideo] = await Promise.all([getAsset<File>('bootVideo'), getAsset<File>('shutdownVideo')]);
        setThemeSettings(prev => ({ ...prev, hasCustomBootVideo: !!bootVideo, hasCustomShutdownVideo: !!shutdownVideo }));
    };
    checkMediaAssets();
  }, []);
  
  // Save all state to localStorage (as a cache/fallback)
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(themeSettings));
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [themeSettings, chatHistory, tasks]);
  
  // App state change sound effects
  useEffect(() => { if (appState === AppState.ERROR) sounds.playError(); }, [appState, sounds]);
  
  // --- Cloud Sync Effects ---
  useEffect(() => {
    // Initialize Google Drive client
    if (process.env.GOOGLE_CLIENT_ID) {
        driveService.initGoogleClient(() => setIsDriveReady(true));
    }
    // This effect runs on mount and checks if the window is a Dropbox OAuth callback.
    if (window.location.hash.includes('access_token') && window.opener) {
        dropboxService.handleOAuthRedirect();
    }
  }, []);

  // Restore Dropbox session on page load if a token exists
  useEffect(() => {
      const restoreSession = async () => {
          if (dropboxToken && !dropboxUser) {
              setIsSyncing(true);
              try {
                  const profile = await dropboxService.getUserProfile(dropboxToken);
                  setDropboxUser(profile);
              } catch (e: any) {
                  if (e.message === 'DROPBOX_TOKEN_EXPIRED') {
                      console.log("Dropbox token expired.");
                      localStorage.removeItem(DROPBOX_TOKEN_KEY);
                      setDropboxToken(null);
                  } else {
                      console.error("Failed to restore Dropbox session", e);
                  }
              } finally {
                  setIsSyncing(false);
              }
          }
      };
      restoreSession();
  }, [dropboxToken, dropboxUser]);

  // Debounced effect to save data to the active cloud provider
  useEffect(() => {
    const saveData = async () => {
        if (isSyncing) return;

        if (driveUser && isDriveReady) {
            setIsSyncing(true);
            try {
                await driveService.saveSyncedData(debouncedSyncableData);
            } catch (e) { console.error("Drive save failed:", e); }
            finally { setIsSyncing(false); }
        } else if (dropboxUser && dropboxToken) {
            setIsSyncing(true);
            try {
                await dropboxService.saveSyncedData(dropboxToken, debouncedSyncableData);
            } catch (e) { console.error("Dropbox save failed:", e); }
            finally { setIsSyncing(false); }
        }
    };
    saveData();
  }, [debouncedSyncableData, driveUser, isDriveReady, dropboxUser, dropboxToken, isSyncing]);


  const handleConnectDrive = async () => {
    if (!isDriveReady || driveUser || dropboxUser) return;
    setIsSyncing(true);
    try {
        await driveService.signIn();
        const [profile, syncedData] = await Promise.all([driveService.getUserProfile(), driveService.getSyncedData()]);
        setDriveUser(profile);

        if (syncedData) {
            const { chatHistory: cloudChat, tasks: cloudTasks, themeSettings: cloudSettings } = syncedData as SyncedData;
            setChatHistory(cloudChat);
            setTasks(cloudTasks);
            setThemeSettings(cloudSettings);
            setToasts(p => [...p, { id: `d_load_${Date.now()}`, title: 'Sync Complete', message: `Welcome back, ${profile.name}. Your data has been loaded.`, icon: <DriveIcon className="w-6 h-6 text-green-400" />}]);
        } else {
            await driveService.saveSyncedData(syncableData);
            setToasts(p => [...p, { id: `d_init_${Date.now()}`, title: 'Sync Enabled', message: `J.A.R.V.I.S. is now connected to your Google Drive.`, icon: <DriveIcon className="w-6 h-6 text-green-400" />}]);
        }
    } catch (error: any) {
        console.error("Google Drive sign-in error:", error);
        if (error.error !== "popup_closed_by_user" && error.error !== "immediate_failed") {
            setCurrentError({ code: 'DRIVE_AUTH_ERROR', title: 'Google Drive Error', message: 'Could not connect. Please try again.', details: error.details || error.error });
        }
        driveService.signOut();
        setDriveUser(null);
    } finally {
        setIsSyncing(false);
    }
  };
  
  const handleDisconnectDrive = () => {
    driveService.signOut();
    setDriveUser(null);
    setToasts(p => [...p, { id: `d_off_${Date.now()}`, title: 'Sync Disabled', message: 'Disconnected from Google Drive.' }]);
  };
  
  const handleConnectDropbox = () => {
    if (driveUser || dropboxUser || !process.env.DROPBOX_CLIENT_ID) return;

    const handleAuthMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        const { type, accessToken, error } = event.data;

        if (type === 'dropbox-auth-token') {
            window.removeEventListener('message', handleAuthMessage); // Clean up immediately

            if (accessToken) {
                setIsSyncing(true);
                try {
                    localStorage.setItem(DROPBOX_TOKEN_KEY, accessToken);
                    setDropboxToken(accessToken);
                    const [profile, syncedData] = await Promise.all([dropboxService.getUserProfile(accessToken), dropboxService.getSyncedData(accessToken)]);
                    setDropboxUser(profile);
                    if (syncedData) {
                        setChatHistory(syncedData.chatHistory);
                        setTasks(syncedData.tasks);
                        setThemeSettings(syncedData.themeSettings);
                        setToasts(p => [...p, { id: `db_load_${Date.now()}`, title: 'Sync Complete', message: `Welcome, ${profile.name}. Your Dropbox data is loaded.`, icon: <DropboxIcon className="w-6 h-6 text-blue-400" />}]);
                    } else {
                        await dropboxService.saveSyncedData(accessToken, syncableData);
                        setToasts(p => [...p, { id: `db_init_${Date.now()}`, title: 'Sync Enabled', message: `J.A.R.V.I.S. is now connected to Dropbox.`, icon: <DropboxIcon className="w-6 h-6 text-blue-400" />}]);
                    }
                } catch (e: any) {
                     setCurrentError({ code: 'DROPBOX_AUTH_ERROR', title: 'Dropbox Error', message: 'Could not connect. Please try again.', details: e.message });
                     handleDisconnectDropbox(); // Ensure clean state on error
                } finally {
                    setIsSyncing(false);
                }
            } else if (error) {
                console.error("Dropbox auth error:", error);
            }
        }
    };

    window.addEventListener('message', handleAuthMessage);
    try {
        dropboxService.authorize();
    } catch (e: any) {
        // If the popup is blocked, the message listener will never fire. Clean it up.
        window.removeEventListener('message', handleAuthMessage);
        
        if (e.message === "POPUP_BLOCKED") {
            setCurrentError({
                code: 'POPUP_BLOCKED',
                title: 'Popup Blocked',
                message: "The authentication popup was blocked. Please disable your popup blocker for this site and try again.",
                details: "window.open() failed, likely due to a browser popup blocker."
            });
        } else {
            // Handle other potential errors from authorize, like Client ID not configured.
            setCurrentError({ code: 'DROPBOX_INIT_ERROR', title: 'Dropbox Error', message: 'Could not start the connection process.', details: e.message });
        }
    }
  };

  const handleDisconnectDropbox = () => {
      if (dropboxToken) {
        dropboxService.revokeToken(dropboxToken);
      }
      localStorage.removeItem(DROPBOX_TOKEN_KEY);
      setDropboxToken(null);
      setDropboxUser(null);
      setToasts(p => [...p, { id: `db_off_${Date.now()}`, title: 'Sync Disabled', message: 'Disconnected from Dropbox.' }]);
  };


  // --- Command Execution Logic ---
  
  const findEntityId = useCallback((target: { name?: string, area?: string }, domain: string): string | null => {
    const { entities } = smartHomeState;
    if (!entities) return null;
    const targetName = target.name?.toLowerCase();
    if(targetName) {
        for (const entityId in entities) {
            if (entityId.startsWith(`${domain}.`) && entities[entityId].attributes.friendly_name?.toLowerCase() === targetName) {
                return entityId;
            }
        }
    }
    if(target.area) {
        const targetArea = target.area.toLowerCase();
        for (const entityId in entities) {
             if (entityId.startsWith(`${domain}.`) && entities[entityId].attributes.friendly_name?.toLowerCase()?.includes(targetArea)) {
                return entityId;
            }
        }
    }
    return null;
  }, [smartHomeState]);

  const handleHomeAutomation = useCallback((cmd: DeviceControlCommand) => {
        setToasts(prev => [...prev, { id: `ha_${Date.now()}`, title: 'Home Automation', message: cmd.spoken_response, icon: <HomeIcon className="w-6 h-6 text-primary" /> }]);
        const { domain, service, target, service_data = {} } = cmd.params;
        if (domain === 'camera' && service === 'show_feed') {
            setCameraFeed({ location: target.name || 'Unknown Location' });
            return;
        }
        const entityId = findEntityId(target, domain);
        if (entityId) {
             haServiceRef.current?.callService(domain, service, { entity_id: entityId, ...service_data });
        } else {
            const errorMsg = `I couldn't find a device named "${target.name || ''}" in the "${target.area || ''}" area.`;
            addMessage({ role: 'model', content: errorMsg });
            if (themeSettings.voiceOutputEnabled) {
                setAppState(AppState.SPEAKING);
                queueSpeech(errorMsg);
            }
        }
  }, [findEntityId, addMessage, queueSpeech, themeSettings.voiceOutputEnabled]);

  const handleOpenGenerativeStudio = useCallback((prompt: string, mode: 'image' | 'video') => {
    setGenerativeStudioConfig({ prompt, mode });
    togglePanel('GENERATIVE_STUDIO');
  }, [togglePanel]);

  const handleAppControl = useCallback((action: string, value: any) => {
    const closePanel = (panel: PanelType) => { if(activePanels.has(panel)) { togglePanel(panel); } };
    const openPanel = (panel: PanelType) => { if(!activePanels.has(panel)) { togglePanel(panel); } };
    switch(action) {
        case 'open_settings': openPanel('SETTINGS'); break;
        case 'close_settings': closePanel('SETTINGS'); break;
        case 'vision_mode': togglePanel('VISION'); break;
        case 'open_task_manager': openPanel('TASK_MANAGER'); break;
        case 'close_task_manager': closePanel('TASK_MANAGER'); break;
        case 'open_control_center': openPanel('CONTROL_CENTER'); break;
        case 'close_control_center': closePanel('CONTROL_CENTER'); break;
        case 'clear_chat':
            clearChatHistory();
            sounds.playDeactivate();
            setToasts(prev => [...prev, { id: `clear_${Date.now()}`, title: 'Conversation Cleared', message: 'Your chat history has been reset.' }]);
            break;
        case 'calibrate_voice': setIsCalibrationOpen(true); break;
        case 'design_mode': handleOpenGenerativeStudio('A futuristic concept car', 'image'); break;
        case 'simulation_mode': handleOpenGenerativeStudio('A spaceship in a nebula', 'video'); break;
        case 'show_app_launcher': openPanel('APP_LAUNCHER'); break;
        case 'close_app_launcher': closePanel('APP_LAUNCHER'); break;
        case 'change_theme':
            const theme = FULL_THEMES.find(t => t.name.toLowerCase() === value.toLowerCase());
            if (theme) setThemeSettings(p => ({ ...p, ...theme }));
            break;
        case 'toggle_voice': setThemeSettings(p => ({ ...p, voiceOutputEnabled: value === 'on' })); break;
        case 'toggle_sounds': setThemeSettings(p => ({ ...p, uiSoundsEnabled: value === 'on' })); break;
        case 'set_primary_color': setThemeSettings(p => ({ ...p, primaryColor: value })); break;
    }
  }, [clearChatHistory, sounds, togglePanel, handleOpenGenerativeStudio, activePanels]);
  
  const handleWolframQuery = useCallback(async (cmd: DeviceControlCommand) => {
    setToasts(prev => [...prev, { id: `wolfram_${Date.now()}`, title: 'Computational Engine', message: `Querying Wolfram Alpha for: "${cmd.params.query}"`, icon: <WolframAlphaIcon className="w-6 h-6 text-[#F96932]" /> }]);
    try {
        const detailedContent = await aiOrchestrator.fetchWolframResult(cmd.params.query);
        updateLastMessage({ content: detailedContent });
        if (themeSettings.voiceOutputEnabled && cmd.spoken_response) {
            setAppState(AppState.SPEAKING);
            queueSpeech(cmd.spoken_response, cmd.lang);
        }
    } catch (e: any) {
        const errorMsg = "My apologies, I'm having trouble connecting to the computational knowledge engine.";
        updateLastMessage({ content: errorMsg });
        if (themeSettings.voiceOutputEnabled) {
            setAppState(AppState.SPEAKING);
            queueSpeech(errorMsg);
        }
    }
  }, [queueSpeech, themeSettings.voiceOutputEnabled, updateLastMessage]);

  const executeCommand = useCallback((cmd: DeviceControlCommand) => {
    sounds.playActivate();
    if (cmd.command !== 'home_automation' && cmd.command !== 'shutdown' && cmd.command !== 'wolfram_alpha_query') {
        let toastMessage = `Executing: ${cmd.command}`;
        switch(cmd.command) {
            case 'open_url': toastMessage = `Opening ${cmd.app}...`; break;
            case 'search': toastMessage = `Searching for "${cmd.params.query}"...`; break;
            case 'set_reminder': toastMessage = `Reminder set for "${cmd.params.content}"`; break;
            case 'app_control': toastMessage = `Executing action: ${cmd.params.action}`; break;
        }
        setToasts(prev => [...prev, { id: `cmd_${Date.now()}_${Math.random()}`, title: 'J.A.R.V.I.S. Command', message: toastMessage }]);
    }
    switch (cmd.command) {
        case 'open_url': case 'search': case 'navigate': case 'play_music':
            let url = '';
            if (cmd.command === 'open_url') url = cmd.params.url;
            else if (cmd.command === 'play_music') url = `https://www.youtube.com/results?search_query=${encodeURIComponent(cmd.params.query)}`;
            else if (cmd.command === 'search') url = cmd.app === 'YouTube' ? `https://www.youtube.com/results?search_query=${encodeURIComponent(cmd.params.query)}` : `https://www.google.com/search?q=${encodeURIComponent(cmd.params.query)}`;
            else if (cmd.command === 'navigate') url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cmd.params.query)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            break;
        case 'set_reminder': addTask(cmd.params.content, cmd.params.time, cmd.params.recurrence); break;
        case 'shutdown': setSystemState('SHUTTING_DOWN'); break;
        case 'app_control': handleAppControl(cmd.params.action, cmd.params.value); break;
        case 'home_automation': handleHomeAutomation(cmd); break;
        case 'wolfram_alpha_query': handleWolframQuery(cmd); break;
    }
  }, [addTask, handleAppControl, handleHomeAutomation, handleWolframQuery, sounds]);
  
  const executeCommandsSequentially = useCallback((commands: DeviceControlCommand[]) => {
      commands.forEach((cmd, i) => setTimeout(() => executeCommand(cmd), i * 750));
  }, [executeCommand]);

  const executeToolChain = useCallback(async (steps: DeviceControlCommand[]) => {
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setToasts(prev => [...prev, { id: `tool_${Date.now()}_${i+1}`, title: `Step ${i+1}/${steps.length}`, message: step.spoken_response || `Executing: ${step.command}` }]);
        executeCommand(step);
        if (i < steps.length - 1) await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }, [executeCommand]);

  const processUserMessage = useCallback(async (
    prompt: string,
    image?: { mimeType: string; data: string; }
  ) => {
    const startStreamingFlow = async (promptForAi: string, imagesForAi: { mimeType: string; data: string; }[]) => {
      let fullResponse = '', spokenResponse = '', spokenLang: string | undefined, sources: Source[] = [], lastChunk: GenerateContentResponse | undefined;
      try {
          const stream = await aiOrchestrator.getAiResponseStream(promptForAi, chatHistory, imagesForAi, operatingSystem, themeSettings.persona);
          addMessage({ role: 'model', content: '' });
          for await (const chunk of stream) {
              if (abortControllerRef.current!.signal.aborted) {
                  removeLastMessage();
                  setAppState(AppState.IDLE);
                  return;
              }
              lastChunk = chunk;
              fullResponse += chunk.text;
              appendToLastMessage(chunk.text);
          }
          if (lastChunk) {
              const lastCandidate = lastChunk.candidates?.[0];
              if (lastCandidate?.groundingMetadata?.groundingChunks) {
                  sources = lastCandidate.groundingMetadata.groundingChunks.map((chunk: any) => chunk.web).filter(Boolean) as Source[];
                  updateLastMessage({ sources });
              }
          }
      } catch (e: any) {
          console.error(e);
          setCurrentError(e.appError || { code: 'STREAM_ERROR', title: 'Communication Error', message: 'An error occurred while communicating with the AI.', details: e.message });
          removeLastMessage();
          setAppState(AppState.ERROR);
          return;
      }

      const extractJsonString = (text: string): string | null => {
          const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (markdownMatch?.[1]) return markdownMatch[1].trim();
          const firstBrace = text.indexOf('{'), firstBracket = text.indexOf('[');
          if (firstBrace === -1 && firstBracket === -1) return null;
          let startIndex = (firstBrace === -1) ? firstBracket : (firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket));
          return text.substring(startIndex);
      };

      const jsonString = extractJsonString(fullResponse);
      let commandProcessed = false;
      if (jsonString) {
          try {
              const parsedJson = JSON.parse(jsonString);
              const commandArray = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
              const firstItem = commandArray[0];

              if (firstItem && typeof firstItem === 'object' && firstItem !== null && firstItem.action) {
                  if (firstItem.action === 'device_control') {
                      const commands = commandArray as DeviceControlCommand[];
                      spokenResponse = commands[0].spoken_response; spokenLang = commands[0].lang;
                      updateLastMessage({ content: spokenResponse });
                      if (commands[0].suggestions) setCurrentSuggestions(commands[0].suggestions);
                      executeCommandsSequentially(commands);
                      commandProcessed = true;
                  } else if (firstItem.action === 'multi_tool_use' && !Array.isArray(parsedJson)) {
                      const cmd = parsedJson as MultiToolUseCommand;
                      spokenResponse = cmd.spoken_response; spokenLang = cmd.lang;
                      updateLastMessage({ content: spokenResponse });
                      if (cmd.suggestions) setCurrentSuggestions(cmd.suggestions);
                      executeToolChain(cmd.steps);
                      commandProcessed = true;
                  } else if (firstItem.action === 'chart_visualization' && !Array.isArray(parsedJson)) {
                      const cmd = parsedJson as ChartVisualizationCommand;
                      spokenResponse = cmd.spoken_response; spokenLang = cmd.lang;
                      updateLastMessage({ content: cmd.summary_text, chartData: cmd.chart_data });
                      if (cmd.suggestions) setCurrentSuggestions(cmd.suggestions);
                      commandProcessed = true;
                  } else if (firstItem.action === 'conversational_response' && !Array.isArray(parsedJson)) {
                      const cmd = parsedJson as ConversationalResponse;
                      spokenResponse = cmd.spoken_text; spokenLang = cmd.lang;
                      updateLastMessage({ content: cmd.text });
                      if (cmd.suggestions) setCurrentSuggestions(cmd.suggestions);
                      commandProcessed = true;
                  }
              }
          } catch (e) { console.warn("JSON parsing failed, falling back to text.", e); }
      }
      if (!commandProcessed) {
          spokenResponse = stripMarkdown(fullResponse);
          updateLastMessage({ content: fullResponse });
      }
      if (themeSettings.voiceOutputEnabled && spokenResponse) {
          setAppState(AppState.SPEAKING);
          queueSpeech(spokenResponse, spokenLang);
      } else {
          setAppState(AppState.IDLE);
      }
    };
    cancelSpeech();
    setCurrentSuggestions([]);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    addMessage({ role: 'user', content: prompt, imageUrl: image ? `data:${image.mimeType};base64,${image.data}` : undefined });
    setAppState(AppState.THINKING);
    const imagesForAi = [];
    if (pinnedImage) imagesForAi.push({ mimeType: pinnedImage.mimeType, data: pinnedImage.data });
    if (image) imagesForAi.push({ mimeType: image.mimeType, data: image.data });
    const isWeatherQuery = /\bweather\b/i.test(prompt) && imagesForAi.length === 0;
    if (isWeatherQuery) {
        addMessage({ role: 'model', content: 'Checking the weather for your location...' });
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const weatherData = await aiOrchestrator.getWeatherInfo(latitude, longitude);
                    const weatherPrompt = `The user asked for the weather. Use the provided data for their current location, ${weatherData.city}, to give them a conversational update. Data: ${JSON.stringify(weatherData)}. After presenting the current weather, you MUST ask a relevant follow-up question, such as asking about the weekly forecast or weather in another city.`;
                    removeLastMessage();
                    await startStreamingFlow(weatherPrompt, []);
                } catch (e: any) {
                    updateLastMessage({ content: "My apologies, I was unable to retrieve the current weather data." });
                    setAppState(AppState.IDLE);
                }
            },
            () => {
                updateLastMessage({ content: "I'm sorry, I couldn't access your location. To get the weather, please ensure location permissions are enabled." });
                setAppState(AppState.IDLE);
            }
        );
    } else {
        await startStreamingFlow(prompt, imagesForAi);
    }
  }, [addMessage, appendToLastMessage, cancelSpeech, chatHistory, queueSpeech, themeSettings.voiceOutputEnabled, themeSettings.persona, updateLastMessage, removeLastMessage, executeCommandsSequentially, operatingSystem, pinnedImage, executeToolChain]);
  
  useEffect(() => {
    if (appState === AppState.SPEAKING && !isSpeaking) {
      setAppState(AppState.IDLE);
    }
  }, [isSpeaking, appState]);
  
  const handleSendMessage = (prompt: string) => {
    processUserMessage(prompt, stagedImage ?? undefined);
    if (stagedImage) setPinnedImage(stagedImage);
    setStagedImage(null);
  };

  const handleCancel = () => {
    cancelSpeech();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setAppState(AppState.IDLE);
  };

  const handleLogVisionAnalysis = (prompt: string, imageUrl: string, response: string) => {
    addMessage({ role: 'user', content: prompt, imageUrl });
    addMessage({ role: 'model', content: response });
    togglePanel('VISION');
    sounds.playSuccess();
  };
  
  const handleDirectHomeStateChange = useCallback((params: { domain: string, service: string, entity_id: string, [key: string]: any }) => {
    const { domain, service, entity_id, ...service_data } = params;
    haServiceRef.current?.callService(domain, service, { entity_id, ...service_data });
  }, []);

  const handleRecognitionEnd = useCallback((transcript: string) => {
      if (appState === AppState.AWAITING_WAKE_WORD) return;
      if (appState === AppState.LISTENING) {
        if (transcript) processUserMessage(transcript);
        else setAppState(AppState.IDLE); 
      }
  }, [appState, processUserMessage]);
  
  const onTranscriptChangeHandlerRef = useRef<((transcript: string) => void) | null>(null);
  
  const { isListening, startListening, stopListening } = useSpeechRecognition({
      continuous: appState === AppState.AWAITING_WAKE_WORD,
      interimResults: true,
      onEnd: handleRecognitionEnd,
      onTranscriptChange: (transcript) => onTranscriptChangeHandlerRef.current?.(transcript),
  });
  
  useEffect(() => {
    onTranscriptChangeHandlerRef.current = (transcript: string) => {
        if (appState === AppState.AWAITING_WAKE_WORD && themeSettings.wakeWordEnabled && transcript.toLowerCase().includes(themeSettings.wakeWord.toLowerCase())) {
            stopListening(); 
            setAppState(AppState.LISTENING);
            sounds.playActivate();
        }
    };
  }, [appState, themeSettings.wakeWord, themeSettings.wakeWordEnabled, stopListening, sounds]);

  useEffect(() => {
    const shouldBeListening = themeSettings.wakeWordEnabled && appState === AppState.IDLE;
    if (shouldBeListening && !isListening) {
        setAppState(AppState.AWAITING_WAKE_WORD);
        startListening();
    }
    if (!themeSettings.wakeWordEnabled && isListening) {
        stopListening();
        if (appState === AppState.AWAITING_WAKE_WORD) setAppState(AppState.IDLE);
    }
  }, [themeSettings.wakeWordEnabled, appState, isListening, startListening, stopListening]);

  const toggleListening = () => {
      cancelSpeech();
      if (isListening) stopListening();
      else {
          if (abortControllerRef.current) abortControllerRef.current.abort();
          setAppState(AppState.LISTENING);
          sounds.playActivate();
          startListening();
      }
  };
  
  const handleFileUpload = (accept: string, handler: (file: File) => void) => {
    fileHandlerRef.current = { accept, handler };
    fileInputRef.current?.click();
  };

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && fileHandlerRef.current) fileHandlerRef.current.handler(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDocumentUpload = (file: File) => {
      readFileAsText(file).then(text => processUserMessage(`Please analyze this document: \n\n${text}`));
  };
  
  const handleAudioUpload = async (file: File) => {
      try {
        const base64 = await readFileAsBase64(file);
        const transcription = await aiOrchestrator.transcribeAudio(base64, file.type);
        processUserMessage(transcription);
      } catch (err) {
        setCurrentError({ code: 'AUDIO_TRANSCRIPTION_FAILED', title: 'Transcription Failed', message: 'Could not transcribe the provided audio file.' });
        setAppState(AppState.ERROR);
      }
  };

  const handleGalleryUpload = (file: File) => {
      Promise.all([readFileAsBase64(file), readFileAsDataURL(file)]).then(([base64, dataUrl]) => {
          setStagedImage({ mimeType: file.type, data: base64, dataUrl: dataUrl });
      });
  };
  
  const handleLocationRequest = () => {
    navigator.geolocation.getCurrentPosition(
        (position) => processUserMessage(`My current location is latitude ${position.coords.latitude}, longitude ${position.coords.longitude}. What's nearby?`),
        () => {
            setCurrentError({ code: 'LOCATION_ERROR', title: 'Location Error', message: "Could not retrieve your location. Please grant permission."});
            setAppState(AppState.ERROR);
        }
    );
  };
  
  const handleSetCustomBootVideo = (file: File) => saveAsset('bootVideo', file).then(() => setThemeSettings(p => ({ ...p, hasCustomBootVideo: true, bootupAnimation: 'video' })));
  const handleRemoveCustomBootVideo = () => deleteAsset('bootVideo').then(() => setThemeSettings(p => ({ ...p, hasCustomBootVideo: false, bootupAnimation: 'holographic' })));
  const handleSetCustomShutdownVideo = (file: File) => saveAsset('shutdownVideo', file).then(() => setThemeSettings(p => ({ ...p, hasCustomShutdownVideo: true })));
  const handleRemoveCustomShutdownVideo = () => deleteAsset('shutdownVideo').then(() => setThemeSettings(p => ({ ...p, hasCustomShutdownVideo: false })));

  const handleSaveVoiceProfile = (profile: { name: string; rate: number; pitch: number }) => {
    const newProfile: VoiceProfile = { ...profile, id: `vp_${Date.now()}` };
    setThemeSettings(p => ({ ...p, voiceProfiles: [...p.voiceProfiles, newProfile], activeVoiceProfileId: newProfile.id }));
    setIsCalibrationOpen(false);
  };

  const handleChangeActiveVoiceProfile = (profileId: string) => setThemeSettings(p => ({ ...p, activeVoiceProfileId: profileId }));
  const handleDeleteVoiceProfile = (profileId: string) => {
    setThemeSettings(p => {
        if (p.voiceProfiles.length <= 1 || profileId === 'default') return p;
        const newProfiles = p.voiceProfiles.filter(profile => profile.id !== profileId);
        return { ...p, voiceProfiles: newProfiles, activeVoiceProfileId: p.activeVoiceProfileId === profileId ? 'default' : p.activeVoiceProfileId };
    });
  };

  const handleClearChat = () => {
    clearChatHistory();
    togglePanel('SETTINGS');
    sounds.playDeactivate();
    setToasts(prev => [...prev, { id: `clear_${Date.now()}`, title: 'Conversation Cleared', message: 'Your chat history has been reset.' }]);
  };

  const handleConnectHA = () => haServiceRef.current?.connect(themeSettings.homeAssistantUrl, themeSettings.homeAssistantToken);
  const handleDisconnectHA = () => haServiceRef.current?.disconnect();

  const handleAppSelect = (url: string, appName: string) => {
    executeCommand({ action: 'device_control', command: 'open_url', app: 'Browser', params: { url }, spoken_response: `Opening ${appName}.` });
    togglePanel('APP_LAUNCHER');
  };
  
  const renderCurrentState = () => {
      switch (systemState) {
        case 'PRE_BOOT': return <PreBootScreen onInitiate={() => { sounds.playActivate(); setSystemState('BOOTING'); }} />;
        case 'BOOTING': return <BootingUp onComplete={() => setSystemState('ACTIVE')} useCustomVideo={themeSettings.hasCustomBootVideo} bootupAnimation={themeSettings.bootupAnimation} sounds={sounds} />;
        case 'SHUTTING_DOWN': return <Shutdown useCustomVideo={themeSettings.hasCustomShutdownVideo} onComplete={() => setSystemState('SNAP_DISINTEGRATION')} />;
        case 'SNAP_DISINTEGRATION': return <div className="system-terminating w-full h-screen bg-background" />;
        case 'ACTIVE':
            return (
                <div className={`w-full h-screen transition-colors duration-500 ${themeSettings.themeMode}`}>
                    <div className="hud-grid-container">
                        <Header onOpenSettings={() => togglePanel('SETTINGS')} onToggleControlCenter={() => togglePanel('CONTROL_CENTER')} />
                        <TacticalSidebar onTogglePanel={togglePanel} activePanels={activePanels} />
                        
                        <main className="hud-main-content">
                            <div className={`hud-center-stage ${activePanels.size > 0 ? 'panels-open' : ''}`}>
                                <div className="chat-log-area holographic-panel">
                                    <ChatLog history={chatHistory} appState={appState} />
                                </div>
                                {activePanels.size > 0 && (
                                    <div className="panels-area">
                                        {activePanels.has('APP_LAUNCHER') && <AppLauncher onClose={() => togglePanel('APP_LAUNCHER')} onAppSelect={handleAppSelect} />}
                                        {activePanels.has('TASK_MANAGER') && <TaskManager tasks={tasks} onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} onClose={() => togglePanel('TASK_MANAGER')} />}
                                        {activePanels.has('VISION') && <VisionIntelligence onClose={() => togglePanel('VISION')} onLogToChat={handleLogVisionAnalysis} />}
                                        {activePanels.has('SETTINGS') && <SettingsModal isOpen={true} onClose={() => togglePanel('SETTINGS')} onShutdown={() => { togglePanel('SETTINGS'); executeCommand({ action: 'device_control', command: 'shutdown', app: 'System', params: {}, spoken_response: '' }); }} sounds={sounds} themeSettings={themeSettings} onThemeChange={setThemeSettings} onSetCustomBootVideo={handleSetCustomBootVideo} onRemoveCustomBootVideo={handleRemoveCustomBootVideo} onSetCustomShutdownVideo={handleSetCustomShutdownVideo} onRemoveCustomShutdownVideo={handleRemoveCustomShutdownVideo} onCalibrateVoice={() => setIsCalibrationOpen(true)} onClearChat={handleClearChat} onChangeActiveVoiceProfile={handleChangeActiveVoiceProfile} onDeleteVoiceProfile={handleDeleteVoiceProfile} onConnectHA={handleConnectHA} onDisconnectHA={handleDisconnectHA} haConnectionStatus={haConnectionStatus} isDriveReady={isDriveReady} isSyncing={isSyncing} driveUser={driveUser} onConnectDrive={handleConnectDrive} onDisconnectDrive={handleDisconnectDrive} dropboxUser={dropboxUser} onConnectDropbox={handleConnectDropbox} onDisconnectDropbox={handleDisconnectDropbox} />}
                                        {activePanels.has('CONTROL_CENTER') && <ControlCenter onClose={() => togglePanel('CONTROL_CENTER')} onVisionMode={() => togglePanel('VISION')} onClearChat={handleClearChat} onGetWeather={() => processUserMessage("What's the weather like?")} onDesignMode={(p) => handleOpenGenerativeStudio(p, 'image')} onSimulationMode={(p) => handleOpenGenerativeStudio(p, 'video')} onDirectHomeStateChange={handleDirectHomeStateChange} onOpenSettings={() => togglePanel('SETTINGS')} onShowCameraFeed={(loc) => setCameraFeed({ location: loc })} smartHomeState={smartHomeState} onOpenAppLauncher={() => togglePanel('APP_LAUNCHER')} onOpenTaskManager={() => togglePanel('TASK_MANAGER')} />}
                                        {activePanels.has('GENERATIVE_STUDIO') && generativeStudioConfig && (
                                            <GenerativeStudio initialPrompt={generativeStudioConfig.prompt} initialMode={generativeStudioConfig.mode} onCancel={() => togglePanel('GENERATIVE_STUDIO')} onComplete={(prompt, type, dataUrl) => {
                                                    togglePanel('GENERATIVE_STUDIO');
                                                    if (type === 'image' && dataUrl) addMessage({ role: 'model', content: `Generative Studio result.`, imageUrl: dataUrl });
                                                    else addMessage({ role: 'model', content: `Simulation complete for: "${prompt}"` });
                                                }} />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="user-input-area holographic-panel !overflow-visible">
                                <Suggestions suggestions={currentSuggestions} onSuggestionClick={(s) => processUserMessage(s)} />
                                <UserInput onSendMessage={handleSendMessage} onToggleListening={toggleListening} onCancel={handleCancel} appState={appState} isListening={isListening} stagedImage={stagedImage ? { dataUrl: stagedImage.dataUrl } : null} pinnedImage={pinnedImage ? { dataUrl: pinnedImage.dataUrl } : null} onClearStagedImage={() => setStagedImage(null)} onClearPinnedImage={() => setPinnedImage(null)} onCameraClick={() => togglePanel('VISION')} onGalleryClick={() => handleFileUpload('image/*', handleGalleryUpload)} onDocumentClick={() => handleFileUpload('.txt,.md,.json,.js,.ts,.html,.css', handleDocumentUpload)} onAudioClick={() => handleFileUpload('audio/*', handleAudioUpload)} onLocationClick={handleLocationRequest} onGenerativeStudioClick={() => handleOpenGenerativeStudio('A beautiful landscape', 'image')} wakeWord={themeSettings.wakeWord} />
                            </div>
                        </main>
                    </div>
                    
                    {cameraFeed && <SecurityCameraModal location={cameraFeed.location} onClose={() => setCameraFeed(null)} />}
                    {isActionModalOpen && <ActionModal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} {...actionModalProps} />}
                    <VoiceCalibrationModal isOpen={isCalibrationOpen} onClose={() => setIsCalibrationOpen(false)} onComplete={handleSaveVoiceProfile} />
                    <ErrorModal isOpen={!!currentError} onClose={() => { setCurrentError(null); setAppState(AppState.IDLE); }} error={currentError} />
                    
                    <div className="fixed top-4 right-4 z-[60] space-y-3 pointer-events-none">
                        {toasts.map(toast => <NotificationToast key={toast.id} {...toast} onClose={(id) => setToasts(p => p.filter(t => t.id !== id))} />)}
                    </div>

                    <input type="file" ref={fileInputRef} onChange={onFileSelected} className="hidden" accept={fileHandlerRef.current?.accept} />
                </div>
            );
        default: return null;
      }
  }

  return (
    <>
        {(systemState === 'PRE_BOOT' || systemState === 'BOOTING' || systemState === 'ACTIVE') && <CreativeBackground />}
        {renderCurrentState()}
    </>
  );
}

export default App;