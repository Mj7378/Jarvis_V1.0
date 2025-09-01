

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GenerateContentResponse } from '@google/genai';

// Services, Hooks, Utils
import { getAiResponseStream, transcribeAudio } from './services/geminiService';
import { HomeAssistantService } from './services/homeAssistantService';
import { useChatHistory, useReminders } from './hooks/useChatHistory';
import { useSoundEffects, useSpeechSynthesis } from './hooks/useSoundEffects';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { saveAsset, getAsset, deleteAsset } from './utils/db';

// Types
import { ChatMessage, AppState, AICommand, DeviceControlCommand, AppError, ThemeSettings, VoiceProfile, Source, Reminder, SmartHomeState, HaEntity } from './types';

// Components
import ChatLog from './components/ChatLog';
import VisionIntelligence from './components/VisionMode';
import ActionModal, { ActionModalProps, NotificationToast } from './components/ActionModal';
import DesignMode from './components/DesignMode';
import SimulationMode from './components/SimulationMode';
import ErrorModal from './components/ErrorModal';
import DiagnosticsMode from './components/DiagnosticsMode';
import BootingUp from './components/BootingUp';
import PreBootScreen from './components/PreBootScreen';
import { SettingsModal } from './components/SettingsModal';
import Header from './components/Header';
import Shutdown from './components/Shutdown';
import VoiceCalibrationModal from './components/VoiceCalibrationModal';
import UserInput from './components/UserInput';
import Suggestions from './components/Suggestions';
import SecurityCameraModal from './components/SecurityCameraModal';
import { HomeIcon } from './components/Icons';
import RealTimeVision from './components/RealTimeVision';
import ControlCenter from './components/ControlCenter';
import TacticalSidebar from './components/TacticalSidebar';


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
  aiModel: 'gemini-2.5-flash',
  hudLayout: 'classic',
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

const App: React.FC = () => {
  // System Lifecycle
  const [systemState, setSystemState] = useState<SystemState>('PRE_BOOT');

  // Core App State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const { chatHistory, addMessage, appendToLastMessage, updateLastMessage, removeLastMessage, clearChatHistory } = useChatHistory();
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'chat' | 'dashboard'>('chat');
  
  // Staged content for multimodal input
  const [stagedImage, setStagedImage] = useState<{ mimeType: string; data: string; dataUrl: string; } | null>(null);
  
  // Smart Home State & Service
  const [smartHomeState, setSmartHomeState] = useState<SmartHomeState>(INITIAL_SMART_HOME_STATE);
  const haServiceRef = useRef<HomeAssistantService | null>(null);
  const [haConnectionStatus, setHaConnectionStatus] = useState<HaConnectionStatus>('disconnected');

  // Theme & Settings
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    try {
        const savedSettings = localStorage.getItem('jarvis_theme_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            // Basic validation to ensure old settings don't break the app
            if (parsed.voiceProfiles && parsed.activeVoiceProfileId) {
                return { ...DEFAULT_THEME, ...parsed };
            }
        }
    } catch (e) {
        console.error("Failed to load settings from local storage", e);
    }
    return DEFAULT_THEME;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  
  // Sound & Speech
  const sounds = useSoundEffects(themeSettings.uiSoundsEnabled, themeSettings.soundProfile);
  const activeProfile = themeSettings.voiceProfiles.find(p => p.id === themeSettings.activeVoiceProfileId) || themeSettings.voiceProfiles[0] || DEFAULT_PROFILE;
  const { queueSpeech, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis(activeProfile);

  // Modes & Modals
  const [isVisionIntelligenceOpen, setIsVisionIntelligenceOpen] = useState(false);
  const [isRealTimeVisionOpen, setIsRealTimeVisionOpen] = useState(false);
  const [isDiagnosticsMode, setIsDiagnosticsMode] = useState(false);
  const [designModePrompt, setDesignModePrompt] = useState<string | null>(null);
  const [simulationModePrompt, setSimulationModePrompt] = useState<string | null>(null);
  const [actionModalProps, setActionModalProps] = useState<Omit<ActionModalProps, 'isOpen' | 'onClose'>>({ title: '', inputs: [], onSubmit: () => {} });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [cameraFeed, setCameraFeed] = useState<{ location: string } | null>(null);
  
  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileHandlerRef = useRef<{ accept: string; handler: (file: File) => void } | null>(null);
  
  // Reminder System
  const handleReminderDue = useCallback((reminder: Reminder) => {
    sounds.playSuccess();
    setToasts(prev => [...prev, {
        id: reminder.id,
        title: 'J.A.R.V.I.S. Reminder',
        message: reminder.content,
    }]);
  }, [sounds]);

  const { addReminder } = useReminders(handleReminderDue);

  // Home Assistant Service Initializer
  useEffect(() => {
    haServiceRef.current = new HomeAssistantService(
        (newEntities) => {
            setSmartHomeState({ entities: newEntities });
        },
        (status) => {
            setHaConnectionStatus(status);
            if(status === 'connected') sounds.playSuccess();
            if(status === 'error') sounds.playError();
        }
    );

    if (themeSettings.homeAssistantUrl && themeSettings.homeAssistantToken) {
        haServiceRef.current.connect(themeSettings.homeAssistantUrl, themeSettings.homeAssistantToken);
    }

    return () => {
        haServiceRef.current?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Apply theme settings to the document
  useEffect(() => {
    const root = document.documentElement;
    const primaryRgb = hexToRgb(themeSettings.primaryColor);
    const panelRgb = hexToRgb(themeSettings.panelColor);
    
    if (primaryRgb) {
      root.style.setProperty('--primary-color-hex', themeSettings.primaryColor);
      root.style.setProperty('--primary-color-rgb', primaryRgb);
    }
    if (panelRgb) {
        document.body.style.setProperty('--panel-rgb', panelRgb);
    }

    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${themeSettings.themeMode}`);
    
    const scanlineOverlay = document.querySelector('.scanline-overlay');
    if(scanlineOverlay instanceof HTMLElement) {
        scanlineOverlay.style.display = themeSettings.showScanlines ? 'block' : 'none';
    }
  }, [themeSettings.primaryColor, themeSettings.panelColor, themeSettings.themeMode, themeSettings.showScanlines]);

  // Load boot video setting on startup and ensure consistency
  useEffect(() => {
    const checkMediaAssets = async () => {
        const [bootVideo, shutdownVideo] = await Promise.all([
            getAsset<File>('bootVideo'),
            getAsset<File>('shutdownVideo')
        ]);
        
        const hasBootVideo = !!bootVideo;
        const hasShutdownVideo = !!shutdownVideo;

        setThemeSettings(prev => {
            const newSettings = { ...prev };
            newSettings.hasCustomBootVideo = hasBootVideo;
            newSettings.hasCustomShutdownVideo = hasShutdownVideo;

            // If user setting is 'video' but no video is found (e.g., cleared cache),
            // reset the setting to holographic to maintain a consistent state.
            if (prev.bootupAnimation === 'video' && !hasBootVideo) {
                newSettings.bootupAnimation = 'holographic';
            }
            
            return newSettings;
        });
    };
    checkMediaAssets();
  }, []);
  
  // Save settings to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('jarvis_theme_settings', JSON.stringify(themeSettings));
  }, [themeSettings]);
  
  // App state change sound effects
  useEffect(() => {
      if (appState === AppState.ERROR) sounds.playError();
  }, [appState, sounds]);
  
  // Function to handle sending a message to the AI
  const processUserMessage = useCallback(async (
    prompt: string,
    image?: { mimeType: string; data: string; }
  ) => {
    cancelSpeech();
    setCurrentSuggestions([]);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    addMessage({ role: 'user', content: prompt, imageUrl: image ? `data:${image.mimeType};base64,${image.data}` : undefined });
    setAppState(AppState.THINKING);

    let fullResponse = '';
    let isJsonCommand = false;
    let spokenResponse = '';
    let command: DeviceControlCommand | null = null;
    let sources: Source[] = [];
    let lastChunk: GenerateContentResponse | undefined;

    try {
        const stream = await getAiResponseStream(prompt, chatHistory, themeSettings.aiModel, image);
        addMessage({ role: 'model', content: '' });

        for await (const chunk of stream) {
            if (abortControllerRef.current.signal.aborted) {
                removeLastMessage();
                setAppState(AppState.IDLE);
                return;
            }
            
            lastChunk = chunk;
            const chunkText = chunk.text;
            fullResponse += chunkText;
            
            if (!isJsonCommand && fullResponse.trim().startsWith('{')) {
                isJsonCommand = true;
            }
            
            appendToLastMessage(chunkText);
        }
        
        if (lastChunk) {
            const lastCandidate = lastChunk.candidates?.[0];
            if (lastCandidate?.groundingMetadata?.groundingChunks) {
                sources = lastCandidate.groundingMetadata.groundingChunks
                    .map((chunk: any) => chunk.web)
                    .filter(Boolean) as Source[];
                updateLastMessage({ sources });
            }
        }

    } catch (e: any) {
        console.error(e);
        setCurrentError(e.appError || {
            code: 'STREAM_ERROR',
            title: 'Communication Error',
            message: 'An error occurred while communicating with the AI. Please try again.',
            details: e.message,
        });
        removeLastMessage();
        setAppState(AppState.ERROR);
        return;
    }

    if (isJsonCommand) {
        try {
            const jsonStartIndex = fullResponse.indexOf('{');
            const jsonEndIndex = fullResponse.lastIndexOf('}');
            const jsonString = fullResponse.substring(jsonStartIndex, jsonEndIndex + 1);
            command = JSON.parse(jsonString) as DeviceControlCommand;
            spokenResponse = command.spoken_response;
            updateLastMessage({ content: spokenResponse });
            
            if (command.suggestions) {
                setCurrentSuggestions(command.suggestions);
            }
        } catch (e) {
            console.error("JSON parsing error:", e, "Raw response:", fullResponse);
            spokenResponse = "I seem to have generated a malformed command. My apologies.";
            updateLastMessage({ content: spokenResponse });
            setCurrentError({
                code: 'JSON_PARSE_ERROR',
                title: 'Command Parsing Error',
                message: "The AI's command response was not valid JSON.",
                details: fullResponse,
            });
        }
    } else {
        const suggestionMatch = fullResponse.match(/> \*Suggestions:\* (.*)/);
        if (suggestionMatch && suggestionMatch[1]) {
            const suggestionsText = suggestionMatch[1];
            setCurrentSuggestions(suggestionsText.split('|').map(s => s.trim().replace(/"/g, '')));
            const cleanResponse = fullResponse.replace(suggestionMatch[0], '').trim();
            updateLastMessage({ content: cleanResponse });
            spokenResponse = stripMarkdown(cleanResponse);
        } else {
            spokenResponse = stripMarkdown(fullResponse);
        }
    }

    if (themeSettings.voiceOutputEnabled && spokenResponse) {
        setAppState(AppState.SPEAKING);
        queueSpeech(spokenResponse);
    } else {
        setAppState(AppState.IDLE);
    }
    
    if (command) {
        executeCommand(command);
    }

  }, [addMessage, appendToLastMessage, cancelSpeech, chatHistory, queueSpeech, themeSettings.voiceOutputEnabled, updateLastMessage, removeLastMessage, themeSettings.aiModel]);
  
  useEffect(() => {
    if (appState === AppState.SPEAKING && !isSpeaking) {
      setAppState(AppState.IDLE);
    }
  }, [isSpeaking, appState]);
  
  const handleSendMessage = (prompt: string) => {
    processUserMessage(prompt, stagedImage ?? undefined);
    setStagedImage(null); // Clear the image after sending
  };

  const handleLogVisionAnalysis = (prompt: string, imageUrl: string, response: string) => {
    addMessage({
        role: 'user',
        content: prompt,
        imageUrl,
    });
    addMessage({
        role: 'model',
        content: response,
    });
    setIsVisionIntelligenceOpen(false);
    sounds.playSuccess();
  };

  const handleActivateRealTimeVision = (feature: string) => {
    setIsVisionIntelligenceOpen(false);
    setIsRealTimeVisionOpen(true);
    // You could pass the feature to the component if needed, e.g., to pre-select a mode
    console.log(`Activating real-time feature: ${feature}`);
  };
  
  const executeCommand = (cmd: DeviceControlCommand) => {
    sounds.playActivate();
    switch (cmd.command) {
        case 'open_url':
        case 'search':
        case 'navigate':
        case 'play_music':
            let url = '';
            if (cmd.command === 'open_url') url = cmd.params.url;
            else if (cmd.command === 'play_music') url = `https://www.youtube.com/results?search_query=${encodeURIComponent(cmd.params.query)}`;
            else if (cmd.command === 'search') url = cmd.app === 'YouTube' ? `https://www.youtube.com/results?search_query=${encodeURIComponent(cmd.params.query)}` : `https://www.google.com/search?q=${encodeURIComponent(cmd.params.query)}`;
            else if (cmd.command === 'navigate') url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cmd.params.query)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            break;
        case 'set_reminder':
            addReminder(cmd.params.content, cmd.params.time);
            break;
        case 'shutdown':
            setSystemState('SHUTTING_DOWN');
            break;
        case 'app_control':
            handleAppControl(cmd.params.action, cmd.params.value);
            break;
        case 'home_automation':
            handleHomeAutomation(cmd);
            break;
    }
  };

  const findEntityId = useCallback((target: { name?: string, area?: string }, domain: string): string | null => {
    const { entities } = smartHomeState;
    if (!entities) return null;

    const targetName = target.name?.toLowerCase();
    
    // Prioritize direct name match
    if(targetName) {
        for (const entityId in entities) {
            if (entityId.startsWith(`${domain}.`)) {
                const friendlyName = entities[entityId].attributes.friendly_name?.toLowerCase();
                if (friendlyName === targetName) {
                    return entityId;
                }
            }
        }
    }
    
    // Fallback to searching within an area
    if(target.area) {
        // This requires area information which isn't directly on the entity.
        // For a simple implementation, we can check if the friendly_name contains the area.
        const targetArea = target.area.toLowerCase();
        for (const entityId in entities) {
             if (entityId.startsWith(`${domain}.`)) {
                const friendlyName = entities[entityId].attributes.friendly_name?.toLowerCase();
                if (friendlyName?.includes(targetArea)) {
                    return entityId; // Return first match in area
                }
            }
        }
    }

    return null;
  }, [smartHomeState]);

  const handleDirectHomeStateChange = useCallback((params: { domain: string, service: string, entity_id: string, [key: string]: any }) => {
    const { domain, service, entity_id, ...service_data } = params;
    haServiceRef.current?.callService(domain, service, { entity_id, ...service_data });
  }, []);

  const handleHomeAutomation = useCallback((cmd: DeviceControlCommand) => {
        // Always provide UI feedback via a toast notification for AI commands.
        setToasts(prev => [...prev, {
            id: `home_auto_${Date.now()}`,
            title: 'Home Automation',
            message: cmd.spoken_response,
            icon: <HomeIcon className="w-6 h-6 text-primary" />,
        }]);

        const { domain, service, target, service_data = {} } = cmd.params;
        
        // Handle camera feed action specifically
        if (domain === 'camera' && service === 'show_feed') {
            setCameraFeed({ location: target.name || 'Unknown Location' });
            return;
        }

        const entityId = findEntityId(target, domain);

        if (entityId) {
            // FIX: The variable is `entityId` (camelCase), but the property must be `entity_id` (snake_case).
             haServiceRef.current?.callService(domain, service, { entity_id: entityId, ...service_data });
        } else {
            // Handle case where entity isn't found
            const errorMsg = `I couldn't find a device named "${target.name || ''}" in the "${target.area || ''}" area.`;
            addMessage({ role: 'model', content: errorMsg });
            if (themeSettings.voiceOutputEnabled) {
                setAppState(AppState.SPEAKING);
                queueSpeech(errorMsg);
            }
        }
  }, [findEntityId, addMessage, queueSpeech, themeSettings.voiceOutputEnabled]);

  const handleAppControl = (action: string, value: any) => {
    switch(action) {
        case 'open_settings': setIsSettingsOpen(true); break;
        case 'close_settings': setIsSettingsOpen(false); break;
        case 'vision_mode': setIsVisionIntelligenceOpen(true); break;
        case 'run_diagnostics': setIsDiagnosticsMode(true); break;
        case 'calibrate_voice': setIsCalibrationOpen(true); break;
        case 'design_mode': setDesignModePrompt(value); break;
        case 'simulation_mode': setSimulationModePrompt(value); break;
        case 'change_theme':
            const theme = FULL_THEMES.find(t => t.name.toLowerCase() === value.toLowerCase());
            if (theme) {
                setThemeSettings(p => ({ ...p, ...theme }));
            }
            break;
        case 'toggle_voice':
            setThemeSettings(p => ({ ...p, voiceOutputEnabled: value === 'on' }));
            break;
        case 'toggle_sounds':
            setThemeSettings(p => ({ ...p, uiSoundsEnabled: value === 'on' }));
            break;
        case 'set_primary_color':
            setThemeSettings(p => ({ ...p, primaryColor: value }));
            break;
    }
  };

  const handleVoiceInput = useCallback((transcript: string) => {
    if (transcript) {
        processUserMessage(transcript);
    } else {
        // When listening ends without a transcript, return to IDLE
        setAppState(currentState => 
            currentState === AppState.LISTENING ? AppState.IDLE : currentState
        );
    }
  }, [processUserMessage]);

  const { isListening, startListening, stopListening } = useSpeechRecognition({ onEnd: handleVoiceInput });

  const toggleListening = () => {
      cancelSpeech();
      if (isListening) {
          stopListening();
      } else {
          // Abort any ongoing AI response generation
          if (abortControllerRef.current) {
              abortControllerRef.current.abort();
          }
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
    if (file && fileHandlerRef.current) {
        fileHandlerRef.current.handler(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDocumentUpload = (file: File) => {
      readFileAsText(file).then(text => {
          processUserMessage(`Please analyze this document: \n\n${text}`);
      });
  };
  
  const handleAudioUpload = async (file: File) => {
      try {
        const base64 = await readFileAsBase64(file);
        const transcription = await transcribeAudio(base64, file.type);
        processUserMessage(transcription);
      } catch (err) {
        setCurrentError({ code: 'AUDIO_TRANSCRIPTION_FAILED', title: 'Transcription Failed', message: 'Could not transcribe the provided audio file.' });
        setAppState(AppState.ERROR);
      }
  };

  const handleGalleryUpload = (file: File) => {
      Promise.all([readFileAsBase64(file), readFileAsDataURL(file)]).then(([base64, dataUrl]) => {
          setStagedImage({
              mimeType: file.type,
              data: base64,
              dataUrl: dataUrl,
          });
      });
  };
  
  const handleLocationRequest = () => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            processUserMessage(`My current location is latitude ${latitude}, longitude ${longitude}. What's nearby?`);
        },
        (error) => {
            setCurrentError({ code: 'LOCATION_ERROR', title: 'Location Error', message: "Could not retrieve your location. Please ensure you've granted permission."});
            setAppState(AppState.ERROR);
        }
    );
  };
  
  const handleSetCustomBootVideo = (file: File) => {
    saveAsset('bootVideo', file).then(() => {
        setThemeSettings(p => ({ ...p, hasCustomBootVideo: true, bootupAnimation: 'video' }));
        sounds.playSuccess();
    }).catch(err => {
        setCurrentError({ code: 'DB_SAVE_ERROR', title: 'Storage Error', message: 'Could not save the custom boot video.', details: err.message });
        setAppState(AppState.ERROR);
    });
  };
  
  const handleRemoveCustomBootVideo = () => {
      deleteAsset('bootVideo').then(() => {
          setThemeSettings(p => ({ ...p, hasCustomBootVideo: false, bootupAnimation: 'holographic' }));
          sounds.playDeactivate();
      }).catch(err => {
          setCurrentError({ code: 'DB_DELETE_ERROR', title: 'Storage Error', message: 'Could not remove the custom boot video.', details: err.message });
          setAppState(AppState.ERROR);
      });
  };
  
  const handleSetCustomShutdownVideo = (file: File) => {
    saveAsset('shutdownVideo', file).then(() => {
        setThemeSettings(p => ({ ...p, hasCustomShutdownVideo: true }));
        sounds.playSuccess();
    }).catch(err => {
        setCurrentError({ code: 'DB_SAVE_ERROR', title: 'Storage Error', message: 'Could not save the custom shutdown video.', details: err.message });
        setAppState(AppState.ERROR);
    });
  };
  
  const handleRemoveCustomShutdownVideo = () => {
      deleteAsset('shutdownVideo').then(() => {
          setThemeSettings(p => ({ ...p, hasCustomShutdownVideo: false }));
          sounds.playDeactivate();
      }).catch(err => {
          setCurrentError({ code: 'DB_DELETE_ERROR', title: 'Storage Error', message: 'Could not remove the custom shutdown video.', details: err.message });
          setAppState(AppState.ERROR);
      });
  };

  const handleSaveVoiceProfile = (profile: { name: string; rate: number; pitch: number }) => {
    const newProfile: VoiceProfile = { ...profile, id: `vp_${Date.now()}` };
    setThemeSettings(p => {
        const newProfiles = [...p.voiceProfiles, newProfile];
        return { ...p, voiceProfiles: newProfiles, activeVoiceProfileId: newProfile.id };
    });
    setIsCalibrationOpen(false);
    sounds.playSuccess();
  };

  const handleChangeActiveVoiceProfile = (profileId: string) => {
    sounds.playClick();
    setThemeSettings(p => ({ ...p, activeVoiceProfileId: profileId }));
  };

  const handleDeleteVoiceProfile = (profileId: string) => {
    setThemeSettings(p => {
        if (p.voiceProfiles.length <= 1 || profileId === 'default') {
            sounds.playError();
            return p;
        }

        const newProfiles = p.voiceProfiles.filter(profile => profile.id !== profileId);
        let newActiveId = p.activeVoiceProfileId;

        if (p.activeVoiceProfileId === profileId) {
            newActiveId = 'default';
        }
        
        sounds.playDeactivate();
        return { ...p, voiceProfiles: newProfiles, activeVoiceProfileId: newActiveId };
    });
  };

  const handleClearChat = () => {
    clearChatHistory();
    setIsSettingsOpen(false);
    sounds.playDeactivate();
    setToasts(prev => [...prev, {
        id: `clear_${Date.now()}`,
        title: 'Conversation Cleared',
        message: 'Your chat history has been reset.',
    }]);
  };

  const handleConnectHA = () => {
    haServiceRef.current?.connect(themeSettings.homeAssistantUrl, themeSettings.homeAssistantToken);
  };
  
  const handleDisconnectHA = () => {
      haServiceRef.current?.disconnect();
  };


  const userInputProps = {
    onSendMessage: handleSendMessage,
    onToggleListening: toggleListening,
    appState: appState,
    isListening: isListening,
    stagedImage: stagedImage ? { dataUrl: stagedImage.dataUrl } : null,
    onClearStagedImage: () => setStagedImage(null),
    onCameraClick: () => setIsVisionIntelligenceOpen(true),
    onGalleryClick: () => handleFileUpload('image/*', handleGalleryUpload),
    onDocumentClick: () => handleFileUpload('.txt,.md,.json,.js,.ts,.html,.css', handleDocumentUpload),
    onAudioClick: () => handleFileUpload('audio/*', handleAudioUpload),
    onLocationClick: handleLocationRequest,
    onDesignModeClick: () => setDesignModePrompt('A futuristic concept car'),
    onSimulationModeClick: () => setSimulationModePrompt('A spaceship flying through an asteroid field'),
  };

  const controlCenterProps = {
    onRunDiagnostics: () => setIsDiagnosticsMode(true),
    onVisionMode: () => setIsVisionIntelligenceOpen(true),
    onRealTimeVision: () => setIsRealTimeVisionOpen(true),
    onClearChat: handleClearChat,
    onGetWeather: () => processUserMessage("What's the weather like?"),
    onDesignMode: (prompt: string) => setDesignModePrompt(prompt),
    onSimulationMode: (prompt: string) => setSimulationModePrompt(prompt),
    onProcessCommand: processUserMessage,
    onDirectHomeStateChange: handleDirectHomeStateChange,
    onOpenSettings: () => setIsSettingsOpen(true),
    onShowCameraFeed: (location: string) => setCameraFeed({ location }),
    smartHomeState: smartHomeState,
  };

  switch (systemState) {
    case 'PRE_BOOT':
        return <PreBootScreen onInitiate={() => { sounds.playActivate(); setSystemState('BOOTING'); }} />;
    case 'BOOTING':
        return <BootingUp onComplete={() => setSystemState('ACTIVE')} useCustomVideo={themeSettings.hasCustomBootVideo} bootupAnimation={themeSettings.bootupAnimation} sounds={sounds} />;
    case 'SHUTTING_DOWN':
        return <Shutdown useCustomVideo={themeSettings.hasCustomShutdownVideo} onComplete={() => setSystemState('SNAP_DISINTEGRATION')} />;
    case 'SNAP_DISINTEGRATION':
        return <div className="system-terminating w-screen h-screen bg-background"><div className="hud-container"><Header onOpenSettings={() => {}} currentView={currentView} onSetView={setCurrentView} /><div className="hud-chat-panel"></div><div className="hud-bottom-panel"></div></div></div>;
    case 'ACTIVE':
        return (
            <div className={`w-screen h-screen transition-colors duration-500 ${themeSettings.themeMode}`}>
                <div className={`hud-container ${themeSettings.hudLayout === 'tactical' ? 'layout-tactical' : ''}`}>
                    
                    <Header onOpenSettings={() => setIsSettingsOpen(true)} currentView={currentView} onSetView={setCurrentView} />

                    {themeSettings.hudLayout === 'classic' ? (
                        <>
                            {currentView === 'chat' ? (
                                <>
                                    <main className="hud-chat-panel holographic-panel view-container">
                                        <ChatLog history={chatHistory} appState={appState} />
                                    </main>

                                    <footer className="hud-bottom-panel view-container" style={{ animationDelay: '100ms' }}>
                                        <Suggestions suggestions={currentSuggestions} onSuggestionClick={(s) => processUserMessage(s)} />
                                        <UserInput {...userInputProps} />
                                    </footer>
                                </>
                            ) : (
                                 <ControlCenter {...controlCenterProps} />
                            )}
                        </>
                    ) : (
                        <>
                           <TacticalSidebar
                                onRunDiagnostics={() => setIsDiagnosticsMode(true)}
                                onVisionMode={() => setIsVisionIntelligenceOpen(true)}
                                onClearChat={handleClearChat}
                           />
                           <div className="hud-main-tactical">
                                {currentView === 'chat' ? (
                                     <>
                                        <main className="holographic-panel view-container flex-1 min-h-0 flex flex-col">
                                            <ChatLog history={chatHistory} appState={appState} />
                                        </main>
                                        <footer className="view-container" style={{ animationDelay: '100ms' }}>
                                            <Suggestions suggestions={currentSuggestions} onSuggestionClick={(s) => processUserMessage(s)} />
                                            <UserInput {...userInputProps} />
                                        </footer>
                                    </>
                                ) : (
                                    <ControlCenter {...controlCenterProps} />
                                )}
                           </div>
                        </>
                    )}

                    {isVisionIntelligenceOpen && (
                        <VisionIntelligence
                           onClose={() => setIsVisionIntelligenceOpen(false)}
                           onLogToChat={handleLogVisionAnalysis}
                           onActivateRealTimeFeature={handleActivateRealTimeVision}
                        />
                    )}
                    
                    {isRealTimeVisionOpen && (
                        <RealTimeVision 
                            onClose={() => setIsRealTimeVisionOpen(false)}
                            onGestureRecognized={(gesture) => {
                                setToasts(prev => [...prev, {
                                    id: `gesture_${Date.now()}`,
                                    title: 'Gesture Detected',
                                    message: `Recognized gesture: ${gesture}`,
                                }]);
                            }}
                        />
                    )}

                    {cameraFeed && (
                        <SecurityCameraModal 
                            location={cameraFeed.location} 
                            onClose={() => setCameraFeed(null)} 
                        />
                    )}

                    {isDiagnosticsMode && (
                        <DiagnosticsMode onComplete={(summary) => {
                            setIsDiagnosticsMode(false);
                            processUserMessage(`I've completed the diagnostics. Here is the summary: ${summary}`);
                        }} />
                    )}

                    {designModePrompt && (
                        <DesignMode
                            prompt={designModePrompt}
                            onCancel={() => setDesignModePrompt(null)}
                            onComplete={(prompt, imageUrl) => {
                                setDesignModePrompt(null);
                                addMessage({ role: 'model', content: `Here is the design for: "${prompt}"`, imageUrl });
                            }}
                        />
                    )}

                    {simulationModePrompt && (
                        <SimulationMode
                            prompt={simulationModePrompt}
                            onCancel={() => setSimulationModePrompt(null)}
                            onComplete={(prompt) => {
                                setSimulationModePrompt(null);
                                addMessage({ role: 'model', content: `Simulation complete for: "${prompt}"\n\n(Video playback in chat is not yet supported, but the simulation ran successfully.)` });
                            }}
                        />
                    )}

                    <SettingsModal
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        onShutdown={() => { setIsSettingsOpen(false); executeCommand({ action: 'device_control', command: 'shutdown', app: 'System', params: {}, spoken_response: '' }); }}
                        isBusy={appState !== AppState.IDLE}
                        sounds={sounds}
                        themeSettings={themeSettings}
                        onThemeChange={setThemeSettings}
                        onSetCustomBootVideo={handleSetCustomBootVideo}
                        onRemoveCustomBootVideo={handleRemoveCustomBootVideo}
                        onSetCustomShutdownVideo={handleSetCustomShutdownVideo}
                        onRemoveCustomShutdownVideo={handleRemoveCustomShutdownVideo}
                        onCalibrateVoice={() => setIsCalibrationOpen(true)}
                        onCameraClick={() => {setIsSettingsOpen(false); setIsVisionIntelligenceOpen(true)}} 
                        onWeather={() => {setIsSettingsOpen(false); processUserMessage("What's the weather like?")}} 
                        onSelfHeal={() => {setIsSettingsOpen(false); setIsDiagnosticsMode(true)}} 
                        onDesignMode={() => {setIsSettingsOpen(false); setDesignModePrompt("A futuristic city skyline")}} 
                        onSimulationMode={() => {setIsSettingsOpen(false); setSimulationModePrompt("A cinematic view of Earth from space")}}
                        onClearChat={handleClearChat}
                        onChangeActiveVoiceProfile={handleChangeActiveVoiceProfile}
                        onDeleteVoiceProfile={handleDeleteVoiceProfile}
                        onConnectHA={handleConnectHA}
                        onDisconnectHA={handleDisconnectHA}
                        haConnectionStatus={haConnectionStatus}
                    />

                    {isActionModalOpen && (
                        <ActionModal
                            isOpen={isActionModalOpen}
                            onClose={() => setIsActionModalOpen(false)}
                            {...actionModalProps}
                        />
                    )}
                    
                    <VoiceCalibrationModal
                        isOpen={isCalibrationOpen}
                        onClose={() => setIsCalibrationOpen(false)}
                        onComplete={handleSaveVoiceProfile}
                    />
                    
                    <ErrorModal
                        isOpen={!!currentError}
                        onClose={() => {
                            setCurrentError(null);
                            setAppState(AppState.IDLE);
                        }}
                        error={currentError}
                    />

                    <div className="fixed top-4 right-4 z-[60] space-y-3 pointer-events-none">
                        {toasts.map(toast => (
                            <NotificationToast key={toast.id} {...toast} onClose={(id) => setToasts(p => p.filter(t => t.id !== id))} />
                        ))}
                    </div>

                    <input type="file" ref={fileInputRef} onChange={onFileSelected} className="hidden" accept={fileHandlerRef.current?.accept} />
                </div>
            </div>
        );
    default:
        return null;
  }
}

export default App;