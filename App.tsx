



import React, { useState, useEffect, useCallback, useRef } from 'react';

// Services, Hooks, Utils
import { getAiResponseStream, generateImage, generateVideo, getVideoOperationStatus } from './services/geminiService';
import { useChatHistory } from './hooks/useChatHistory';
import { useSoundEffects, useSpeechSynthesis } from './hooks/useSoundEffects';
import { saveVideo, deleteVideo, getVideo } from './utils/db';

// Types
import { ChatMessage, AppState, Source, AICommand, DeviceControlCommand, AppError, ThemeSettings } from './types';

// Components
import ChatLog from './components/ChatLog';
import VisionMode from './components/VisionMode';
import ActionModal, { ActionModalProps } from './components/ActionModal';
import CoreInterface from './components/CoreInterface';
import DesignMode from './components/DesignMode';
import SimulationMode from './components/SimulationMode';
import ErrorModal from './components/ErrorModal';
import DiagnosticsMode from './components/DiagnosticsMode';
import BootingUp from './components/BootingUp';
import PreBootScreen from './components/PreBootScreen';
import { SettingsModal } from './components/SettingsModal';
import { SettingsIcon } from './components/Icons';
import Header from './components/Header';
import { LeftColumn } from './components/LeftColumn';

// System Lifecycle States
type SystemState = 'PRE_BOOT' | 'BOOTING' | 'ACTIVE' | 'SHUTTING_DOWN' | 'SNAP_DISINTEGRATION';

// Helper function to convert hex to an RGB string "r, g, b"
const hexToRgb = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : null;
};

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#00ffff', // J.A.R.V.I.S. Cyan
  panelColor: '#121a2b',
  showGrid: true,
  showScanlines: true,
  showTextFlicker: false,
  hasCustomBootVideo: false,
  bootupAnimation: 'holographic',
  voiceOutputEnabled: true,
  uiSoundsEnabled: true,
  voiceProfile: { rate: 1.1, pitch: 1.1 },
  // FIX: Add default wakeWord to ThemeSettings
  wakeWord: 'JARVIS',
  aiModel: 'gemini-2.5-flash',
};

// Shutdown Sequence Component
const ShutdownSequence: React.FC<{ onComplete: () => void; sounds: ReturnType<typeof useSoundEffects>}> = ({ onComplete, sounds }) => {
    useEffect(() => {
        sounds.playDeactivate();
        const timer = setTimeout(onComplete, 2000); // Wait for disintegration animation
        return () => clearTimeout(timer);
    }, [onComplete, sounds]);

    return null; // The animation is handled by a class on the main container
};

// InputBar Component for text input
const InputBar: React.FC<{
  onSend: (text: string) => void;
  isBusy: boolean;
}> = ({ onSend, isBusy }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isBusy) {
      onSend(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="hud-panel !p-2 flex items-center gap-2 h-full">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter command..."
        disabled={isBusy}
        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 text-base md:text-lg px-2 md:px-4"
        aria-label="User input"
      />
      <button 
        type="submit" 
        disabled={isBusy || !inputValue.trim()}
        className="w-12 h-12 md:w-14 md:h-14 bg-primary-t-20 rounded-md flex items-center justify-center text-primary hover:bg-primary hover:text-jarvis-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
        aria-label="Send command"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </form>
  );
};

const App: React.FC = () => {
    // SYSTEM STATE
    const [systemState, setSystemState] = useState<SystemState>('PRE_BOOT');
    const [appState, setAppState] = useState<AppState>(AppState.IDLE);
    const [error, setError] = useState<AppError | null>(null);
    const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
    
    // MODAL/VIEW STATE
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isVisionMode, setIsVisionMode] = useState(false);
    const [designModeProps, setDesignModeProps] = useState({ active: false, prompt: '' });
    const [simulationModeProps, setSimulationModeProps] = useState({ active: false, prompt: '' });
    const [isDiagnosticsMode, setIsDiagnosticsMode] = useState(false);
    const [actionModalProps, setActionModalProps] = useState<Omit<ActionModalProps, 'isOpen'|'onClose'>>({ title: '', inputs: [], onSubmit: () => {} });
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // HOOKS & REFS
    const { chatHistory, addMessage, appendToLastMessage, updateLastMessage, removeLastMessage } = useChatHistory();
    const sounds = useSoundEffects(themeSettings.uiSoundsEnabled);
    const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis(themeSettings.voiceProfile);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (isSpeaking) {
            setAppState(AppState.SPEAKING);
        } else if (appState === AppState.SPEAKING) {
            setAppState(AppState.IDLE);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSpeaking]);

    // THEME MANAGEMENT
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        root.style.setProperty('--primary-color-hex', themeSettings.primaryColor);
        const rgb = hexToRgb(themeSettings.primaryColor);
        if (rgb) root.style.setProperty('--primary-color-rgb', rgb);
        
        const panelRgb = hexToRgb(themeSettings.panelColor);
        if (panelRgb) root.style.setProperty('--panel-color-rgb', panelRgb);

        body.classList.toggle('grid-active', themeSettings.showGrid);
    }, [themeSettings]);

    useEffect(() => {
        getVideo().then(videoFile => {
            if (videoFile) {
                setThemeSettings(prev => ({...prev, hasCustomBootVideo: true}));
            }
        });
    }, []);

    // UI ACTION HANDLERS
    const handleShutdown = () => {
        setSystemState('SNAP_DISINTEGRATION');
    };

    // DEVICE COMMAND HANDLER
    const handleDeviceCommand = (command: DeviceControlCommand) => {
        switch (command.command) {
            case 'open_url':
                window.open(command.params.url, '_blank');
                break;
            case 'search':
                const searchUrl = command.app === 'YouTube' 
                    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(command.params.query)}`
                    : `https://www.google.com/search?q=${encodeURIComponent(command.params.query)}`;
                window.open(searchUrl, '_blank');
                break;
            case 'navigate':
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(command.params.query)}`, '_blank');
                break;
            case 'shutdown':
                // Add a small delay so the user can read/hear the response before the UI disintegrates.
                setTimeout(handleShutdown, 1500);
                break;
            // Internal fulfillment might trigger modals
            default:
                // For unsupported or internal commands, the spoken_response is sufficient.
                break;
        }
    };

    // MAIN SEND FUNCTION
    const handleSend = useCallback(async (prompt: string, imageUrl?: string) => {
        if (isSpeaking) cancelSpeech();
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            console.log("Previous request aborted.");
        }
        abortControllerRef.current = new AbortController();

        const imagePart = imageUrl ? { mimeType: 'image/jpeg', data: imageUrl.split(',')[1] } : undefined;
        addMessage({ role: 'user', content: prompt, imageUrl });
        setAppState(AppState.THINKING);
        addMessage({ role: 'model', content: '' });

        try {
            const stream = await getAiResponseStream(prompt, chatHistory, themeSettings.aiModel, imagePart);
            let fullResponse = "";
            let commandJson: AICommand | null = null;

            for await (const chunk of stream) {
                fullResponse += chunk.text;
                updateLastMessage({ content: fullResponse });

                if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    const sources: Source[] = chunk.candidates[0].groundingMetadata.groundingChunks.map((c: any) => ({
                        uri: c.web.uri,
                        title: c.web.title
                    }));
                    if(sources.length > 0) updateLastMessage({ sources });
                }
            }

            try {
                commandJson = JSON.parse(fullResponse);
            } catch (e) {
                // Not a valid JSON command, treat as plain text.
            }
            
            if (commandJson?.action === 'device_control') {
                updateLastMessage({ content: commandJson.spoken_response });
                if(themeSettings.voiceOutputEnabled) speak(commandJson.spoken_response);
                handleDeviceCommand(commandJson as DeviceControlCommand);
            } else if (themeSettings.voiceOutputEnabled) {
                speak(fullResponse);
            }

        } catch (error: any) {
            console.error("Gemini Error:", error);
            const appErr: AppError = error.appError || { code: 'UNKNOWN_ERROR', title: 'AI Error', message: String(error.message || 'An unknown error occurred.') };
            setError(appErr);
            removeLastMessage();
        } finally {
            if(appState !== AppState.SPEAKING) setAppState(AppState.IDLE);
        }
    }, [chatHistory, themeSettings.aiModel, themeSettings.voiceOutputEnabled, isSpeaking, addMessage, updateLastMessage, removeLastMessage, speak, cancelSpeech, appState]);
    
    const handleSetCustomBootVideo = async (file: File) => {
        try {
            await saveVideo(file);
            setThemeSettings(prev => ({...prev, hasCustomBootVideo: true, bootupAnimation: 'video' }));
        } catch (e) {
            setError({ code: 'DB_ERROR', title: 'Storage Error', message: 'Could not save the custom boot video.' });
        }
    };

    const handleRemoveCustomBootVideo = async () => {
        try {
            await deleteVideo();
            setThemeSettings(prev => ({...prev, hasCustomBootVideo: false, bootupAnimation: 'holographic' }));
        } catch(e) {
             setError({ code: 'DB_ERROR', title: 'Storage Error', message: 'Could not remove the custom boot video.' });
        }
    };

    const openActionModal = (props: Omit<ActionModalProps, 'isOpen'|'onClose'>) => {
        setActionModalProps(props);
        setIsActionModalOpen(true);
    };

    const handleDesignMode = () => {
        openActionModal({
            title: "Enter Design Prompt",
            inputs: [{ id: 'prompt', label: 'Describe the image to generate', type: 'textarea', placeholder: 'e.g., a holographic blueprint for a new arc reactor' }],
            onSubmit: (data) => setDesignModeProps({ active: true, prompt: data.prompt }),
            submitLabel: "Generate"
        });
    };
    
    const handleSimulationMode = () => {
        openActionModal({
            title: "Enter Simulation Prompt",
            inputs: [{ id: 'prompt', label: 'Describe the video to simulate', type: 'textarea', placeholder: 'e.g., a high-speed flight through a futuristic city' }],
            onSubmit: (data) => setSimulationModeProps({ active: true, prompt: data.prompt }),
            submitLabel: "Simulate"
        });
    };

    // RENDER LOGIC
    if (systemState === 'PRE_BOOT') {
        return <PreBootScreen onInitiate={() => { sounds.playActivate(); setSystemState('BOOTING'); }} />;
    }
    if (systemState === 'BOOTING') {
        return <BootingUp onComplete={() => setSystemState('ACTIVE')} useCustomVideo={themeSettings.hasCustomBootVideo} bootupAnimation={themeSettings.bootupAnimation} sounds={sounds} />;
    }
    
    const isBusy = appState === AppState.THINKING || appState === AppState.SPEAKING;

    return (
        <main className={`hud-container ${systemState === 'SNAP_DISINTEGRATION' ? 'system-terminating' : ''}`}>
          {systemState === 'SNAP_DISINTEGRATION' && <ShutdownSequence onComplete={() => { /* Could navigate away or just show a blank screen */ }} sounds={sounds} />}
          <Header onShutdown={handleShutdown} onOpenSettings={() => { sounds.playOpen(); setIsSettingsOpen(true); }} />
          
          <div className="hud-left-panel hud-panel">
            <LeftColumn appState={appState} />
          </div>

          <div className="hud-core-container">
            <CoreInterface appState={appState} />
            <div className="chat-log-container">
              <ChatLog history={chatHistory} appState={appState} />
            </div>
          </div>
          
          {/* This panel is now just a placeholder for desktop layout */}
          <div className="hud-right-panel-placeholder hud-panel">
          </div>

          <div className="hud-bottom-panel">
             <InputBar onSend={handleSend} isBusy={isBusy} />
          </div>
          
          {/* MODALS & OVERLAYS */}
          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => { sounds.playClose(); setIsSettingsOpen(false); }} 
            isBusy={isBusy}
            themeSettings={themeSettings}
            onThemeChange={setThemeSettings}
            sounds={sounds}
            onSetCustomBootVideo={handleSetCustomBootVideo}
            onRemoveCustomBootVideo={handleRemoveCustomBootVideo}
            onCameraClick={() => { setIsSettingsOpen(false); setIsVisionMode(true); }}
            onSelfHeal={() => { setIsSettingsOpen(false); setIsDiagnosticsMode(true); }}
            onDesignMode={() => { setIsSettingsOpen(false); handleDesignMode(); }}
            onSimulationMode={() => { setIsSettingsOpen(false); handleSimulationMode(); }}
            onWeather={() => handleSend("What's the weather like?")}
          />
          <ErrorModal isOpen={!!error} onClose={() => setError(null)} error={error} />
          <ActionModal 
            isOpen={isActionModalOpen} 
            onClose={() => setIsActionModalOpen(false)} 
            {...actionModalProps} 
          />
          {isVisionMode && (
            <VisionMode 
                onCapture={(dataUrl) => {
                    setIsVisionMode(false);
                    handleSend("Describe what you see in this image.", dataUrl);
                }} 
                onClose={() => setIsVisionMode(false)} 
            />
          )}
          {isDiagnosticsMode && (
              <DiagnosticsMode onComplete={(summary) => {
                  setIsDiagnosticsMode(false);
                  handleSend(`The system diagnostics are complete. Here is the summary:\n${summary}`);
              }} />
          )}
          {designModeProps.active && (
              <DesignMode 
                prompt={designModeProps.prompt}
                onCancel={() => setDesignModeProps({ active: false, prompt: ''})}
                onComplete={(prompt, imageDataUrl) => {
                    setDesignModeProps({ active: false, prompt: ''});
                    addMessage({ role: 'user', content: `Original prompt: "${prompt}"`});
                    addMessage({ role: 'model', content: "Here is the design you requested.", imageUrl: imageDataUrl });
                }}
              />
          )}
          {simulationModeProps.active && (
              <SimulationMode
                prompt={simulationModeProps.prompt}
                onCancel={() => setSimulationModeProps({ active: false, prompt: ''})}
                onComplete={(prompt) => {
                    setSimulationModeProps({ active: false, prompt: ''});
                    handleSend(`Simulation complete for prompt: "${prompt}". Please note that I cannot display the video directly in the chat log yet.`);
                }}
              />
          )}
        </main>
    );
};

export default App;