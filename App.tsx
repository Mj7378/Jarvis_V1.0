
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GenerateContentResponse } from '@google/genai';

// Services, Hooks, Utils
import { getAiResponseStream, transcribeAudio } from './services/geminiService';
import { useChatHistory, useReminders } from './hooks/useChatHistory';
import { useSoundEffects, useSpeechSynthesis } from './hooks/useSoundEffects';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { saveVideo, deleteVideo } from './utils/db';

// Types
import { ChatMessage, AppState, AICommand, DeviceControlCommand, AppError, ThemeSettings, VoiceProfile, Source, Reminder } from './types';

// Components
import ChatLog from './components/ChatLog';
import VisionMode from './components/VisionMode';
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


// System Lifecycle States
type SystemState = 'PRE_BOOT' | 'BOOTING' | 'ACTIVE' | 'SHUTTING_DOWN' | 'SNAP_DISINTEGRATION';

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
  primaryColor: '#ff4b4b', // Iron Man Red
  panelColor: '#1a0a0f',   // Dark reddish black
  themeMode: 'dark',
  showGrid: true,
  showScanlines: true,
  showTextFlicker: false,
  hasCustomBootVideo: false,
  bootupAnimation: 'holographic',
  voiceOutputEnabled: true,
  uiSoundsEnabled: true,
  soundProfile: 'default',
  voiceProfiles: [DEFAULT_PROFILE],
  activeVoiceProfileId: DEFAULT_PROFILE.id,
  wakeWord: 'JARVIS',
  aiModel: 'gemini-2.5-flash',
};

const FULL_THEMES = [
    { name: 'Iron Man', primaryColor: '#ff4b4b', panelColor: '#1a0a0f', themeMode: 'dark' as const },
    { name: 'J.A.R.V.I.S.', primaryColor: '#00ffff', panelColor: '#121a2b', themeMode: 'dark' as const },
    { name: 'Arc Reactor', primaryColor: '#00aeff', panelColor: '#0f172a', themeMode: 'dark' as const },
    { name: 'Stealth', primaryColor: '#64748b', panelColor: '#020617', themeMode: 'dark' as const },
    { name: 'Stark Light', primaryColor: '#0ea5e9', panelColor: '#ffffff', themeMode: 'light' as const },
    { name: 'Cosmic', primaryColor: '#9d6eff', panelColor: '#1e1b4b', themeMode: 'dark' as const },
];

type ToastNotification = {
  id: string;
  title: string;
  message: string;
};

const App: React.FC = () => {
  // System Lifecycle
  const [systemState, setSystemState] = useState<SystemState>('PRE_BOOT');

  // Core App State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const { chatHistory, addMessage, appendToLastMessage, updateLastMessage, removeLastMessage } = useChatHistory();
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  
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
  const [isVisionMode, setIsVisionMode] = useState(false);
  const [isDiagnosticsMode, setIsDiagnosticsMode] = useState(false);
  const [designModePrompt, setDesignModePrompt] = useState<string | null>(null);
  const [simulationModePrompt, setSimulationModePrompt] = useState<string | null>(null);
  const [actionModalProps, setActionModalProps] = useState<Omit<ActionModalProps, 'isOpen' | 'onClose'>>({ title: '', inputs: [], onSubmit: () => {} });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
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

  // Load boot video setting on startup
  useEffect(() => {
    const checkBootVideo = async () => {
        const hasVideo = await import('./utils/db').then(db => db.getVideo()).then(file => !!file);
        setThemeSettings(prev => ({ ...prev, hasCustomBootVideo: hasVideo }));
    };
    checkBootVideo();
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
  
  const executeCommand = (cmd: DeviceControlCommand) => {
    sounds.playActivate();
    switch (cmd.command) {
        case 'open_url':
        case 'search':
        case 'navigate':
            let url = '';
            if (cmd.command === 'open_url') url = cmd.params.url;
            else if (cmd.command === 'search') url = cmd.app === 'YouTube' ? `https://www.youtube.com/results?search_query=${encodeURIComponent(cmd.params.query)}` : `https://www.google.com/search?q=${encodeURIComponent(cmd.params.query)}`;
            else if (cmd.command === 'navigate') url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cmd.params.query)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            break;
        case 'set_reminder':
            addReminder(cmd.params.content, cmd.params.time);
            break;
        case 'shutdown':
            setSystemState('SHUTTING_DOWN');
            setTimeout(() => setSystemState('SNAP_DISINTEGRATION'), 4500);
            break;
        case 'app_control':
            handleAppControl(cmd.params.action, cmd.params.value);
            break;
    }
  };

  const handleAppControl = (action: string, value: any) => {
    switch(action) {
        case 'open_settings': setIsSettingsOpen(true); break;
        case 'close_settings': setIsSettingsOpen(false); break;
        case 'vision_mode': setIsVisionMode(true); break;
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
          addMessage({ role: 'user', content: 'Analyze this image.', imageUrl: dataUrl });
          processUserMessage('Analyze this image.', { mimeType: file.type, data: base64 });
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
    saveVideo(file).then(() => {
        setThemeSettings(p => ({ ...p, hasCustomBootVideo: true, bootupAnimation: 'video' }));
        sounds.playSuccess();
    }).catch(err => {
        setCurrentError({ code: 'DB_SAVE_ERROR', title: 'Storage Error', message: 'Could not save the custom boot video.', details: err.message });
        setAppState(AppState.ERROR);
    });
  };
  
  const handleRemoveCustomBootVideo = () => {
      deleteVideo().then(() => {
          setThemeSettings(p => ({ ...p, hasCustomBootVideo: false, bootupAnimation: 'holographic' }));
          sounds.playDeactivate();
      }).catch(err => {
          setCurrentError({ code: 'DB_DELETE_ERROR', title: 'Storage Error', message: 'Could not remove the custom boot video.', details: err.message });
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

  switch (systemState) {
    case 'PRE_BOOT':
        return <PreBootScreen onInitiate={() => { sounds.playActivate(); setSystemState('BOOTING'); }} />;
    case 'BOOTING':
        return <BootingUp onComplete={() => setSystemState('ACTIVE')} useCustomVideo={themeSettings.hasCustomBootVideo} bootupAnimation={themeSettings.bootupAnimation} sounds={sounds} />;
    case 'SHUTTING_DOWN':
        return <Shutdown />;
    case 'SNAP_DISINTEGRATION':
        return <div className="system-terminating w-screen h-screen bg-background"><div className="hud-container"><Header onOpenSettings={() => {}} /><div className="hud-chat-panel"></div><div className="hud-bottom-panel"></div></div></div>;
    case 'ACTIVE':
        return (
            <div className={`w-screen h-screen transition-colors duration-500 ${themeSettings.themeMode}`}>
                <div className="hud-container">
                    <Header onOpenSettings={() => setIsSettingsOpen(true)} />
                    
                    <main className="hud-chat-panel holographic-panel">
                        <ChatLog history={chatHistory} appState={appState} />
                    </main>

                    <footer className="hud-bottom-panel">
                        <Suggestions suggestions={currentSuggestions} onSuggestionClick={(s) => processUserMessage(s)} />
                        <UserInput
                            onSendMessage={processUserMessage}
                            onToggleListening={toggleListening}
                            appState={appState}
                            isListening={isListening}
                            onCameraClick={() => setIsVisionMode(true)}
                            onGalleryClick={() => handleFileUpload('image/*', handleGalleryUpload)}
                            onDocumentClick={() => handleFileUpload('.txt,.md,.json,.js,.ts,.html,.css', handleDocumentUpload)}
                            onAudioClick={() => handleFileUpload('audio/*', handleAudioUpload)}
                            onLocationClick={handleLocationRequest}
                            onDesignModeClick={() => setDesignModePrompt('A futuristic concept car')}
                            onSimulationModeClick={() => setSimulationModePrompt('A spaceship flying through an asteroid field')}
                        />
                    </footer>

                    {isVisionMode && (
                        <VisionMode
                            onCapture={(imageDataUrl) => {
                                const base64 = imageDataUrl.split(',')[1];
                                addMessage({ role: 'user', content: "What do you see?", imageUrl: imageDataUrl });
                                processUserMessage('What do you see?', { mimeType: 'image/jpeg', data: base64 });
                                setIsVisionMode(false);
                            }}
                            onClose={() => setIsVisionMode(false)}
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
                        onCalibrateVoice={() => setIsCalibrationOpen(true)}
                        onCameraClick={() => {setIsSettingsOpen(false); setIsVisionMode(true)}} 
                        onWeather={() => {setIsSettingsOpen(false); processUserMessage("What's the weather like?")}} 
                        onSelfHeal={() => {setIsSettingsOpen(false); setIsDiagnosticsMode(true)}} 
                        onDesignMode={() => {setIsSettingsOpen(false); setDesignModePrompt("A futuristic city skyline")}} 
                        onSimulationMode={() => {setIsSettingsOpen(false); setSimulationModePrompt("A cinematic view of Earth from space")}}
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