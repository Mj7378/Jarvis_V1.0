import React, { useState, useEffect, useCallback, useRef } from 'react';

// Services, Hooks, Utils
import { getAiResponseStream } from './services/geminiService';
import { useChatHistory } from './hooks/useChatHistory';
import { useSoundEffects, useSpeechSynthesis } from './hooks/useSoundEffects';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { saveVideo, deleteVideo } from './utils/db';

// Types
import { ChatMessage, AppState, AICommand, DeviceControlCommand, AppError, ThemeSettings, VoiceProfile } from './types';

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
import Header from './components/Header';
import Shutdown from './components/Shutdown';
import UserInput from './components/UserInput';
import VoiceCalibrationModal from './components/VoiceCalibrationModal';


// System Lifecycle States
type SystemState = 'PRE_BOOT' | 'BOOTING' | 'ACTIVE' | 'SHUTTING_DOWN' | 'SNAP_DISINTEGRATION';

// Helper function to convert hex to an RGB string "r, g, b"
const hexToRgb = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : null;
};

const DEFAULT_PROFILE: VoiceProfile = { id: 'default', name: 'J.A.R.V.I.S. Default', rate: 1.1, pitch: 1.1 };
const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#00ffff', // J.A.R.V.I.S. Cyan
  panelColor: '#121a2b',
  themeMode: 'dark',
  showGrid: true,
  showScanlines: true,
  showTextFlicker: false,
  hasCustomBootVideo: false,
  bootupAnimation: 'holographic',
  voiceOutputEnabled: true,
  uiSoundsEnabled: true,
  voiceProfiles: [DEFAULT_PROFILE],
  activeVoiceProfileId: DEFAULT_PROFILE.id,
  wakeWord: 'JARVIS',
  aiModel: 'gemini-2.5-flash',
};

const App: React.FC = () => {
  // System Lifecycle
  const [systemState, setSystemState] = useState<SystemState>('PRE_BOOT');

  // Core App State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const { chatHistory, addMessage, appendToLastMessage, removeLastMessage } = useChatHistory();
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Theme & Settings
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    try {
        const savedSettings = localStorage.getItem('jarvis_theme_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            // Basic validation to ensure old settings don't break the app
            if (parsed.voiceProfiles && parsed.activeVoiceProfileId) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Failed to load settings from local storage", e);
    }
    return DEFAULT_THEME;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Sound & Speech
  const sounds = useSoundEffects(themeSettings.uiSoundsEnabled);
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

  // Voice Recognition
  const handleSpeechResult = (transcript: string) => {
    if (transcript.trim()) {
      handleSendMessage(transcript);
    }
    setAppState(AppState.IDLE);
  };
  const { transcript, isListening, startListening, stopListening, error: speechError } = useSpeechRecognition({ onEnd: handleSpeechResult });

  useEffect(() => {
    if (speechError) {
      setCurrentError({ code: 'SPEECH_ERROR', title: 'Speech Recognition Error', message: speechError });
      setAppState(AppState.ERROR);
    }
  }, [speechError]);
  
  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      setAppState(AppState.IDLE);
    } else {
      sounds.playClick();
      startListening();
      setAppState(AppState.LISTENING);
    }
  }, [isListening, stopListening, startListening, sounds]);


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

    if (themeSettings.themeMode === 'light') {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
    } else {
        document.body.classList.remove('theme-light');
        document.body.classList.add('theme-dark');
    }

    document.body.classList.toggle('grid-active', themeSettings.showGrid);
    document.body.classList.toggle('text-flicker-active', themeSettings.showTextFlicker);

     // Save settings to local storage whenever they change
    try {
        localStorage.setItem('jarvis_theme_settings', JSON.stringify(themeSettings));
    } catch (e) {
        console.error("Failed to save settings to local storage", e);
    }
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
    if(themeSettings.voiceOutputEnabled) queueSpeech(command.spoken_response);

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
  }, [addMessage, queueSpeech, themeSettings.voiceOutputEnabled, handleShutdown]);


  const processAiResponse = useCallback(async (prompt: string, image?: { mimeType: string; data: string; }) => {
    setAppState(AppState.THINKING);
    cancelSpeech(); // Reset speech state for the new response
    if(abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
        const stream = await getAiResponseStream(prompt, chatHistory, themeSettings.aiModel, image);
        let fullResponse = "";
        let isFirstChunk = true;
        let isCommand = false;
        let speechBuffer = "";

        for await (const chunk of stream) {
            if (abortControllerRef.current.signal.aborted) {
                console.log("Stream aborted by user.");
                if(isCommand) removeLastMessage();
                cancelSpeech();
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
                    addMessage({ role: 'model', content: "" }); // Start with empty bubble for coder effect
                }
            }
            
            fullResponse += chunkText;

            if (isCommand) {
                // Command is buffered and processed at the end
            } else {
                appendToLastMessage(chunkText);
                 if (themeSettings.voiceOutputEnabled) {
                    speechBuffer += chunkText;
                    // Use a regex to find complete sentences
                    const sentences = speechBuffer.match(/[^.!?]+[.!?]+/g);
                    if (sentences) {
                        let processedText = "";
                        sentences.forEach(sentence => {
                            queueSpeech(sentence);
                            processedText += sentence;
                        });
                        // Update buffer with remaining partial sentence
                        speechBuffer = speechBuffer.substring(processedText.length);
                    }
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
             if (themeSettings.voiceOutputEnabled && speechBuffer.trim()) {
                queueSpeech(speechBuffer.trim());
            }
        }

    } catch (error: any) {
        const appErr = error.appError || { code: 'UNKNOWN', title: 'Error', message: error.message };
        setCurrentError(appErr);
        setAppState(AppState.ERROR);
    } finally {
        setAppState(AppState.IDLE);
    }
  }, [chatHistory, themeSettings.aiModel, appendToLastMessage, addMessage, handleDeviceCommand, removeLastMessage, queueSpeech, themeSettings.voiceOutputEnabled, cancelSpeech]);

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

  const handleCalibrationComplete = (profileData: { name: string; rate: number; pitch: number }) => {
    const newProfile: VoiceProfile = {
        id: `vp_${Date.now()}`,
        name: profileData.name,
        rate: profileData.rate,
        pitch: profileData.pitch,
    };
    setThemeSettings(prev => {
        const updatedProfiles = [...prev.voiceProfiles, newProfile];
        return {
            ...prev,
            voiceProfiles: updatedProfiles,
            activeVoiceProfileId: newProfile.id, // Make the new profile active
        };
    });
    setIsCalibrationOpen(false);
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
    <div id="jarvis-container" className={`w-screen h-screen bg-background text-text-primary transition-opacity duration-500 ${systemState === 'ACTIVE' ? 'opacity-100' : 'opacity-0'}`}>
        <main className={`hud-container ${systemState === 'SNAP_DISINTEGRATION' ? 'system-terminating' : ''}`}>
            <Header onOpenSettings={() => setIsSettingsOpen(true)} />
            
            <div className="hud-core-container">
                <CoreInterface appState={appState} />
            </div>

            <div className="hud-chat-panel hud-panel">
                <ChatLog history={chatHistory} appState={appState} speechRate={activeProfile.rate} />
            </div>
            
            <div className="hud-bottom-panel hud-panel items-center justify-center !p-2 md:!p-4">
                <UserInput 
                    onSendMessage={handleSendMessage}
                    onToggleListening={handleToggleListening}
                    appState={appState}
                    isListening={isListening}
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
            onCalibrateVoice={() => setIsCalibrationOpen(true)}
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
        {isCalibrationOpen && <VoiceCalibrationModal isOpen={isCalibrationOpen} onClose={() => setIsCalibrationOpen(false)} onComplete={handleCalibrationComplete} />}

        <ErrorModal isOpen={!!currentError} onClose={() => setCurrentError(null)} error={currentError} />
        <ActionModal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} {...actionModalProps} />
    </div>
  );
};

export default App;
