
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
import Shutdown from './components/Shutdown';

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

const App: React.FC = () => {
  // System Lifecycle
  const [systemState, setSystemState] = useState<SystemState>('PRE_BOOT');

  // Core App State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const { chatHistory, addMessage, appendToLastMessage, updateLastMessage, removeLastMessage } = useChatHistory();
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Theme & Settings
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Sound & Speech
  const sounds = useSoundEffects(themeSettings.uiSoundsEnabled);
  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis(themeSettings.voiceProfile);

  // Modes
  const [isVisionMode, setIsVisionMode] = useState(false);
  const [isDiagnosticsMode, setIsDiagnosticsMode] = useState(false);
  const [designModePrompt, setDesignModePrompt] = useState<string | null>(null);
  const [simulationModePrompt, setSimulationModePrompt] = useState<string | null>(null);
  const [actionModalProps, setActionModalProps] = useState<Omit<ActionModalProps, 'isOpen' | 'onClose'>>({ title: '', inputs: [], onSubmit: () => {} });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

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
        root.style.setProperty('--panel-color-rgb', panelRgb);
    }

    document.body.classList.toggle('grid-active', themeSettings.showGrid);
  }, [themeSettings]);


  // Shutdown logic
  const handleShutdown = useCallback(() => {
    sounds.playDeactivate();
    setSystemState('SNAP_DISINTEGRATION');
    setTimeout(() => {
      // Fully reset to pre-boot state
      setSystemState('PRE_BOOT');
      setAppState(AppState.IDLE);
      setIsSettingsOpen(false);
    }, 2000); // Reset after animation
  }, [sounds]);

  const handleDeviceCommand = useCallback((command: DeviceControlCommand) => {
    addMessage({ role: 'model', content: command.spoken_response });
    if(themeSettings.voiceOutputEnabled) speak(command.spoken_response);

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
       case 'shutdown':
        setTimeout(handleShutdown, 1000); // Delay to allow speech to finish
        break;
      // Other cases can be added here (navigate, play_music, etc.)
    }
  }, [addMessage, speak, themeSettings.voiceOutputEnabled, handleShutdown]);


  const processAiResponse = useCallback(async (prompt: string, image?: { mimeType: string; data: string; }) => {
    setAppState(AppState.THINKING);
    if(abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
        const stream = await getAiResponseStream(prompt, chatHistory, themeSettings.aiModel, image);
        let fullResponse = "";
        let isFirstChunk = true;
        let isCommand = false;

        for await (const chunk of stream) {
            if (abortControllerRef.current.signal.aborted) {
                console.log("Stream aborted by user.");
                if(isCommand) removeLastMessage();
                setAppState(AppState.IDLE);
                return;
            }

            const chunkText = chunk.text;
            if (!chunkText) continue;

            if(isFirstChunk) {
                isFirstChunk = false;
                if(chunkText.trim().startsWith('{')) {
                    isCommand = true;
                    addMessage({ role: 'model', content: "" }); // Placeholder for command
                } else {
                    addMessage({ role: 'model', content: chunkText });
                }
                fullResponse = chunkText;
            } else {
                fullResponse += chunkText;
                if(!isCommand) {
                    appendToLastMessage(chunkText);
                }
            }
        }
        
        // After stream ends
        if (isCommand) {
            removeLastMessage();
            try {
                const commandJson: AICommand = JSON.parse(fullResponse);
                handleDeviceCommand(commandJson as DeviceControlCommand);
            } catch (e) {
                console.error("Failed to parse AI command:", e, "Response:", fullResponse);
                addMessage({ role: 'model', content: "I seem to have encountered a syntax error in my own command protocols. My apologies." });
            }
        } else {
            if(themeSettings.voiceOutputEnabled) speak(fullResponse);
        }

    } catch (error: any) {
        const appErr = error.appError || { code: 'UNKNOWN', title: 'Error', message: error.message };
        setCurrentError(appErr);
        setAppState(AppState.ERROR);
    } finally {
        setAppState(AppState.IDLE);
    }
  }, [chatHistory, themeSettings.aiModel, appendToLastMessage, addMessage, handleDeviceCommand, removeLastMessage, speak, themeSettings.voiceOutputEnabled]);

  const handleSendMessage = useCallback((prompt: string, imageUrl?: string) => {
    addMessage({ role: 'user', content: prompt, imageUrl });
    if(imageUrl) {
        const base64Data = imageUrl.split(',')[1];
        processAiResponse(prompt, { mimeType: 'image/jpeg', data: base64Data });
    } else {
        processAiResponse(prompt);
    }
  }, [addMessage, processAiResponse]);

  const handleSelfHeal = () => {
    setIsDiagnosticsMode(true);
  };
  
  const handleDiagnosticsComplete = (summary: string) => {
    setIsDiagnosticsMode(false);
    addMessage({ role: 'model', content: summary });
  }

  const handleOpenDesignMode = () => {
    setActionModalProps({
        title: 'Enter Design Mode',
        inputs: [{ id: 'prompt', label: 'Describe the design concept:', type: 'textarea', placeholder: 'e.g., a futuristic arc reactor HUD' }],
        onSubmit: (data) => setDesignModePrompt(data.prompt),
        submitLabel: 'Generate'
    });
    setIsActionModalOpen(true);
  };

  const handleOpenSimulationMode = () => {
    setActionModalProps({
        title: 'Enter Simulation Mode',
        inputs: [{ id: 'prompt', label: 'Describe the simulation scenario:', type: 'textarea', placeholder: 'e.g., a high-speed chase through a neon city' }],
        onSubmit: (data) => setSimulationModePrompt(data.prompt),
        submitLabel: 'Simulate'
    });
    setIsActionModalOpen(true);
  };
  
  const handleSetCustomBootVideo = async (file: File) => {
    try {
        await saveVideo(file);
        setThemeSettings(prev => ({ ...prev, hasCustomBootVideo: true, bootupAnimation: 'video' }));
    } catch(err) {
        setCurrentError({ code: 'DB_ERROR', title: 'Storage Error', message: 'Could not save the custom boot video.'});
    }
  };

  const handleRemoveCustomBootVideo = async () => {
    try {
        await deleteVideo();
        setThemeSettings(prev => ({ ...prev, hasCustomBootVideo: false, bootupAnimation: 'holographic' }));
    } catch(err) {
        setCurrentError({ code: 'DB_ERROR', title: 'Storage Error', message: 'Could not remove the custom boot video.'});
    }
  };

  // Lifecycle rendering
  if (systemState === 'PRE_BOOT') {
    return <PreBootScreen onInitiate={() => setSystemState('BOOTING')} />;
  }
  if (systemState === 'BOOTING') {
    return <BootingUp onComplete={() => setSystemState('ACTIVE')} useCustomVideo={themeSettings.hasCustomBootVideo} bootupAnimation={themeSettings.bootupAnimation} sounds={sounds} />;
  }
  if(systemState === 'SHUTTING_DOWN') {
      return <Shutdown />;
  }

  // The main app view
  return (
    <div id="jarvis-container" className={`w-screen h-screen bg-jarvis-dark text-slate-200 transition-opacity duration-500 ${systemState === 'ACTIVE' ? 'opacity-100' : 'opacity-0'}`}>
        <main className={`hud-container ${systemState === 'SNAP_DISINTEGRATION' ? 'system-terminating' : ''}`}>
            <Header onOpenSettings={() => setIsSettingsOpen(true)} />
            
            <div className="hud-left-panel hud-panel">
                <LeftColumn appState={appState} />
            </div>

            <div className="hud-core-container">
                <div className="chat-log-container">
                    <ChatLog history={chatHistory} appState={appState} />
                </div>
                <CoreInterface appState={appState} />
            </div>
            
            <div className="hud-bottom-panel hud-panel items-center justify-center !p-2 md:!p-4">
                <input
                    type="text"
                    placeholder="Enter command..."
                    className="w-full bg-transparent border-none focus:ring-0 text-center text-primary"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                            handleSendMessage(e.currentTarget.value);
                            e.currentTarget.value = '';
                        }
                    }}
                />
            </div>
            
            <div className="hud-right-panel-placeholder hud-panel">
                {/* This is a placeholder; the settings modal will overlay it when active */}
            </div>
        </main>
        
        {/* Modals and Overlays */}
        <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onShutdown={handleShutdown}
            onCameraClick={() => setIsVisionMode(true)}
            isBusy={appState !== AppState.IDLE}
            onWeather={() => handleSendMessage("What's the weather like?")}
            onSelfHeal={handleSelfHeal}
            onDesignMode={handleOpenDesignMode}
            onSimulationMode={handleOpenSimulationMode}
            sounds={sounds}
            themeSettings={themeSettings}
            onThemeChange={setThemeSettings}
            onSetCustomBootVideo={handleSetCustomBootVideo}
            onRemoveCustomBootVideo={handleRemoveCustomBootVideo}
        />

        {isVisionMode && <VisionMode onCapture={(img) => { handleSendMessage("Analyze this image.", img); setIsVisionMode(false); }} onClose={() => setIsVisionMode(false)} />}
        {designModePrompt && <DesignMode prompt={designModePrompt} onComplete={(p, img) => { addMessage({ role: 'user', content: `Design concept: ${p}`, imageUrl: img }); setDesignModePrompt(null); }} onCancel={() => setDesignModePrompt(null)} />}
        {simulationModePrompt && <SimulationMode prompt={simulationModePrompt} onComplete={(p) => { addMessage({ role: 'model', content: `Simulation complete for: ${p}. Video is available.` }); setSimulationModePrompt(null); }} onCancel={() => setSimulationModePrompt(null)} />}
        {isDiagnosticsMode && <DiagnosticsMode onComplete={handleDiagnosticsComplete} />}
        <ErrorModal isOpen={!!currentError} onClose={() => setCurrentError(null)} error={currentError} />
        <ActionModal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} {...actionModalProps} />
    </div>
  );
};

export default App;
