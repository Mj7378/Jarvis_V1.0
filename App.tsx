
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAiResponseStream } from './services/geminiService';
import { useChatHistory } from './hooks/useChatHistory';
import { ChatMessage, AppState, Source, AICommand, DeviceControlCommand, AppError, ThemeSettings } from './types';
import { saveVideo, deleteVideo } from './utils/db';

import ChatLog from './components/ChatLog';
import VisionMode from './components/VisionMode';
import ActionModal, { ActionModalProps } from './components/ActionModal';
import CoreInterface from './components/CoreInterface';
import DesignMode from './components/DesignMode';
import SimulationMode from './components/SimulationMode';
import ErrorModal from './components/ErrorModal';
import DiagnosticsMode from './components/DiagnosticsMode';
import BootingUp from './components/BootingUp';
import Shutdown from './components/Shutdown';
import { useSoundEffects, useSpeechSynthesis } from './hooks/useSoundEffects';
import { PowerIcon, SettingsIcon, MicrophoneIcon } from './components/Icons';
import VoiceCalibrationModal from './components/VoiceCalibrationModal';
import PreBootScreen from './components/PreBootScreen';
import { SettingsModal } from './components/SettingsModal';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

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
  wakeWord: 'wake up Jarvis',
  aiModel: 'gemini-2.5-flash',
};

const App: React.FC = () => {
  const [appStatus, setAppStatus] = useState<'pre-boot' | 'booting' | 'running' | 'shutting_down'>('pre-boot');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<AppError | null>(null);
  const [isVisionMode, setIsVisionMode] = useState(false);
  const [modalConfig, setModalConfig] = useState<Omit<ActionModalProps, 'isOpen' | 'onClose'> | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [modeData, setModeData] = useState<any>(null);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Theme Settings State
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  
  // Clock state (moved from Header)
  const [time, setTime] = useState(new Date());

  const { chatHistory, addMessage, appendToLastMessage, updateLastMessage, removeLastMessage } = useChatHistory();
  const sounds = useSoundEffects(themeSettings.uiSoundsEnabled);
  const { speak, cancel, isSpeaking } = useSpeechSynthesis(themeSettings.voiceProfile);

  const isProcessingRef = useRef(false);
  const isCancelledRef = useRef(false);
  
  // Load theme from local storage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('jarvisTheme');
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        // Ensure new settings have default values if not in localStorage
        setThemeSettings({ ...DEFAULT_THEME, ...parsedTheme });
      } else {
        setThemeSettings(DEFAULT_THEME);
      }
    } catch (e) {
      console.error('Failed to load theme from localStorage', e);
      setThemeSettings(DEFAULT_THEME);
    } finally {
        setIsLoadingTheme(false);
    }
  }, []);
  
  // Clock effect
  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // Sync appState with isSpeaking status from the speech hook
  useEffect(() => {
    if (isSpeaking) {
        setAppState(AppState.SPEAKING);
    } else if (appState === AppState.SPEAKING) {
        // Only transition from SPEAKING to IDLE if speech has finished
        setAppState(AppState.IDLE);
    }
  }, [isSpeaking, appState]);


  // Apply theme and save to local storage on change
  useEffect(() => {
    try {
      // Apply colors
      const primaryRgb = hexToRgb(themeSettings.primaryColor);
      if (primaryRgb) {
        document.documentElement.style.setProperty('--primary-color-hex', themeSettings.primaryColor);
        document.documentElement.style.setProperty('--primary-color-rgb', primaryRgb);
      }
      const panelRgb = hexToRgb(themeSettings.panelColor);
      if (panelRgb) {
        document.documentElement.style.setProperty('--panel-color-rgb', panelRgb);
      }

      // Apply effects
      document.body.classList.toggle('grid-active', themeSettings.showGrid);
      document.body.classList.toggle('scanlines-active', themeSettings.showScanlines);
      document.body.classList.toggle('flicker-active', themeSettings.showTextFlicker);

      // Save to localStorage - Sanitized to prevent circular structure errors
      const themeToSave: ThemeSettings = {
        primaryColor: themeSettings.primaryColor,
        panelColor: themeSettings.panelColor,
        showGrid: themeSettings.showGrid,
        showScanlines: themeSettings.showScanlines,
        showTextFlicker: themeSettings.showTextFlicker,
        hasCustomBootVideo: themeSettings.hasCustomBootVideo,
        bootupAnimation: themeSettings.bootupAnimation,
        voiceOutputEnabled: themeSettings.voiceOutputEnabled,
        uiSoundsEnabled: themeSettings.uiSoundsEnabled,
        voiceProfile: themeSettings.voiceProfile,
        wakeWord: themeSettings.wakeWord,
        aiModel: themeSettings.aiModel,
      };
      localStorage.setItem('jarvisTheme', JSON.stringify(themeToSave));
    } catch (e) {
      console.error('Failed to apply or save theme', e);
    }
  }, [themeSettings]);


  const handleError = useCallback((errorPayload: AppError) => {
    setError(errorPayload);
    sounds.playError();
  }, [sounds]);

  const executeDeviceCommand = (command: DeviceControlCommand) => {
    let url = '';
    switch(command.command) {
        case 'open_url':
            url = command.params.url;
            break;
        case 'search':
            if (command.app === 'YouTube') {
                url = `https://www.youtube.com/results?search_query=${encodeURIComponent(command.params.query)}`;
            } else {
                url = `https://www.google.com/search?q=${encodeURIComponent(command.params.query)}`;
            }
            break;
        case 'navigate':
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(command.params.query)}`;
            break;
        case 'play_music':
            url = `https://music.youtube.com/search?q=${encodeURIComponent(command.params.query)}`;
            addMessage({ role: 'model', content: `🎵 **Action:** Searching for music matching: *"${command.params.query}"*` });
            break;
        case 'set_reminder':
            addMessage({ role: 'model', content: `✅ **Reminder Set:** *"${command.params.content}"* at **${command.params.time}**` });
            return;
        case 'set_alarm':
            addMessage({ role: 'model', content: `🚨 **Alarm Set:** *"${command.params.content}"* for **${command.params.time}**` });
            return;
        case 'unsupported':
        case 'internal_fulfillment':
            return;
    }

    if (url) {
        window.open(url, '_blank');
    }
  };

  const processUserMessage = useCallback(async (userMessageText: string, promptForApi?: string, imageUrl?: string) => {
    if (!userMessageText || !userMessageText.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    isCancelledRef.current = false;
    
    setError(null);
    setInputValue('');

    const userMessage: ChatMessage = { role: 'user', content: userMessageText };
    if (imageUrl) {
        userMessage.imageUrl = imageUrl;
    }
    addMessage(userMessage);
    setAppState(AppState.THINKING);

    addMessage({ role: 'model', content: '' });

    try {
      const image_data = imageUrl ? {
          mimeType: 'image/jpeg',
          data: imageUrl.split(',')[1]
      } : undefined;
      
      const effectivePrompt = promptForApi || userMessageText;
      
      const historyForApi = chatHistory;
      const stream = await getAiResponseStream(effectivePrompt, historyForApi, themeSettings.aiModel, image_data);

      let fullResponse = '';
      let spokenResponse = '';
      let isJsonResponse = false;
      let sources: Source[] = [];
      let firstChunk = true;

      for await (const chunk of stream) {
        if (isCancelledRef.current) break;

        const chunkText = chunk.text;
        if (chunkText) {
            fullResponse += chunkText;
            if (firstChunk) {
                if (fullResponse.trim().startsWith('{')) {
                    isJsonResponse = true;
                }
                firstChunk = false;
            }
            // Update the message in real-time as chunks arrive.
            updateLastMessage({ content: fullResponse });
        }

        const newSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web).filter((s): s is Source => !!s?.uri) || [];
        if (newSources.length > 0) {
            sources.push(...newSources);
        }
      }

      if (isCancelledRef.current) {
        removeLastMessage();
        removeLastMessage();
        isProcessingRef.current = false;
        setAppState(AppState.IDLE);
        cancel();
        return;
      }

      if (isJsonResponse) {
          try {
              const command: AICommand = JSON.parse(fullResponse);
              if (command && command.action) {
                  updateLastMessage({ content: command.spoken_response });
                  spokenResponse = command.spoken_response;
                  if (command.action === 'device_control') {
                      executeDeviceCommand(command);
                  }
              }
          } catch (e) {
              // It looked like JSON but wasn't. Treat as conversational.
              spokenResponse = fullResponse;
              const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
              updateLastMessage({ content: fullResponse, sources: uniqueSources });
          }
      } else {
          spokenResponse = fullResponse;
          const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
          updateLastMessage({ content: fullResponse, sources: uniqueSources });
      }
      
      isProcessingRef.current = false;
      setAppState(AppState.IDLE);

      if (themeSettings.voiceOutputEnabled && spokenResponse) {
          speak(spokenResponse);
      }


    } catch (err) {
      if (isCancelledRef.current) {
        isProcessingRef.current = false;
        setAppState(AppState.IDLE);
        return;
      }
      isProcessingRef.current = false;
      removeLastMessage();
      
      if (err instanceof Error && (err as any).appError) {
        handleError((err as any).appError as AppError);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        handleError({
            code: 'FRONTEND_ERROR',
            title: 'Application Error',
            message: 'An unexpected error occurred within the user interface.',
            details: errorMessage,
            action: "Please try refreshing the application. If the problem persists, it may be a bug."
        });
      }
      setAppState(AppState.ERROR);
    }
  }, [addMessage, updateLastMessage, chatHistory, removeLastMessage, handleError, themeSettings.voiceOutputEnabled, themeSettings.aiModel, speak, cancel]);

  const handleVisionCapture = (imageDataUrl: string) => {
    sounds.playSuccess();
    setIsVisionMode(false);
    processUserMessage("Analyze this image.", undefined, imageDataUrl);
  };
  
  const isBusy = appState === AppState.THINKING || appState === AppState.SPEAKING;

  const handleWeather = () => {
    sounds.playOpen();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        processUserMessage("What's the weather like at my current location?", `What is the weather like at latitude ${latitude} and longitude ${longitude}?`);
      },
      () => {
        setModalConfig({
          title: 'Get Weather',
          inputs: [{ id: 'city', label: 'Enter City', type: 'text', placeholder: 'e.g., London' }],
          submitLabel: 'Get Weather',
          onSubmit: (data) => data.city && processUserMessage(`What's the weather like in ${data.city}?`),
        });
      }
    );
  };

  const handleSelfHeal = () => {
    if (isBusy) return;
    sounds.playActivate();
    setAppState(AppState.THINKING);
    addMessage({ role: 'user', content: 'Initiate self-healing protocol.' });
    setActiveMode('diagnostics');
  };

  const handleDiagnosticsComplete = (summary: string) => {
    sounds.playSuccess();
    setActiveMode(null);
    addMessage({
        role: 'model',
        content: `✅ **Diagnostics Complete:** System integrity restored. All functions operating at 100%.\n\n${summary}`
    });
    setAppState(AppState.IDLE);
    if (themeSettings.voiceOutputEnabled) {
        speak("Diagnostics complete. All systems are now operating at 100%.");
    }
  };
  
  const handleDesignMode = () => {
    sounds.playOpen();
    setModalConfig({
      title: 'Design Mode',
      inputs: [{ id: 'prompt', label: 'Describe your visual concept', type: 'textarea', placeholder: 'e.g., A miniature arc reactor with a glowing blue core.' }],
      submitLabel: 'Generate Image',
      onSubmit: (data) => {
          if (data.prompt) {
              sounds.playActivate();
              setModeData({ prompt: data.prompt });
              setActiveMode('design');
          }
      },
    });
  };

  const handleSimulationMode = () => {
      sounds.playOpen();
      setModalConfig({
          title: 'Simulation Mode',
          inputs: [{ id: 'prompt', label: 'Describe the simulation scenario', type: 'textarea', placeholder: 'e.g., A high-speed flight through a canyon in the Iron Man suit.' }],
          submitLabel: 'Run Simulation',
          onSubmit: (data) => {
              if (data.prompt) {
                  sounds.playActivate();
                  setModeData({ prompt: data.prompt });
                  setActiveMode('simulation');
              }
          },
      });
  };

  const handleDesignComplete = (prompt: string, imageDataUrl: string) => {
      sounds.playSuccess();
      const message = `Design concept for "${prompt}" has been generated.`;
      addMessage({
          role: 'model',
          content: message,
          imageUrl: imageDataUrl,
      });
      setActiveMode(null);
      setModeData(null);
      if (themeSettings.voiceOutputEnabled) speak(message);
  };

  const handleSimulationComplete = (prompt: string) => {
      sounds.playSuccess();
      const message = `Simulation complete. The scenario for "${prompt}" has been rendered and viewed.`;
      addMessage({
          role: 'model',
          content: message,
      });
      setActiveMode(null);
      setModeData(null);
      if (themeSettings.voiceOutputEnabled) speak(message);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => { 
      e.preventDefault();
      sounds.playClick();
      if (appState === AppState.THINKING) {
        isCancelledRef.current = true;
      } else if (appState === AppState.SPEAKING) {
        cancel();
      }
      processUserMessage(inputValue); 
  };
  
  const handleShutdown = () => {
    sounds.playDeactivate();
    cancel();
    setAppStatus('shutting_down');
  };

  const handleCloseModal = () => {
    sounds.playClose();
    setModalConfig(null);
  };

  const handleCancelMode = () => {
      sounds.playDeactivate();
      setActiveMode(null);
  }

  const handleSetCustomBootVideo = async (videoFile: File) => {
    try {
      await saveVideo(videoFile);
      setThemeSettings(prev => ({ ...prev, hasCustomBootVideo: true }));
      // Optionally, provide user feedback
      alert("Custom boot video has been set successfully!");
    } catch (e) {
      console.error("Failed to save boot video:", e);
      handleError({
        code: 'STORAGE_ERROR',
        title: 'Storage Error',
        message: 'Could not save the custom boot video.',
        details: e instanceof Error ? e.message : String(e),
        action: "Please try again with a different video file. Ensure your browser has sufficient storage permissions."
      });
    }
  };

  const handleRemoveCustomBootVideo = async () => {
    try {
      await deleteVideo();
      setThemeSettings(prev => ({ ...prev, hasCustomBootVideo: false, bootupAnimation: 'holographic' }));
      alert("Custom boot video has been removed.");
    } catch (e) {
      console.error("Failed to remove boot video:", e);
      handleError({
        code: 'STORAGE_ERROR',
        title: 'Storage Error',
        message: 'Could not remove the custom boot video.',
        details: e instanceof Error ? e.message : String(e),
        action: "There may be an issue with the browser's storage."
      });
    }
  };

  // --- Speech Recognition ---
  const handleSpeechTranscription = useCallback((transcript: string) => {
      setAppState(AppState.IDLE);
      if (transcript.trim()) {
          sounds.playSuccess();
          processUserMessage(transcript);
      } else {
          sounds.playDeactivate();
      }
  }, [processUserMessage, sounds]);

  const {
      isListening,
      startListening,
      stopListening,
      hasRecognitionSupport,
      error: speechError,
  } = useSpeechRecognition({ onEnd: handleSpeechTranscription });

  useEffect(() => {
    if (speechError) {
        handleError({
            code: 'SPEECH_RECOGNITION_ERROR',
            title: 'Microphone Error',
            message: "There was a problem with the speech recognition service.",
            details: speechError,
            action: "Please check your microphone connection and browser permissions."
        });
        if (isListening) {
           stopListening();
        }
        setAppState(AppState.ERROR);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechError, handleError]);

  const toggleListening = () => {
    if (isBusy) return;

    if (isListening) {
        sounds.playDeactivate();
        stopListening();
        setAppState(AppState.IDLE);
    } else {
        cancel();
        setInputValue('');
        sounds.playActivate();
        setAppState(AppState.LISTENING);
        startListening();
    }
  };

  const isInputBusy = appState === AppState.THINKING || appState === AppState.SPEAKING || appState === AppState.LISTENING;

  const getPlaceholderText = () => {
    switch(appState) {
        case AppState.LISTENING:
            return "Listening... Speak your command.";
        case AppState.THINKING:
            return "J.A.R.V.I.S. is thinking...";
        case AppState.SPEAKING:
            return "J.A.R.V.I.S. is speaking...";
        default:
            return "Enter command...";
    }
  };

  // Clock Formatting Logic (moved from Header)
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  let hours = time.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const day = String(time.getDate()).padStart(2, '0');
  const month = String(time.getMonth() + 1).padStart(2, '0');
  const year = time.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  const dayOfWeek = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const circumference = 2 * Math.PI * 45; // r=45

  if (isLoadingTheme) {
    return (
        <div className="fixed inset-0 bg-jarvis-dark flex items-center justify-center" aria-busy="true" aria-label="Loading settings">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse-dot"></div>
        </div>
    );
  }

  if (appStatus === 'pre-boot') {
    return <PreBootScreen onInitiate={() => setAppStatus('booting')} wakeWord={themeSettings.wakeWord} />;
  }

  if (appStatus === 'booting') {
    return <BootingUp onComplete={() => setAppStatus('running')} useCustomVideo={themeSettings.hasCustomBootVideo} bootupAnimation={themeSettings.bootupAnimation} sounds={sounds} />;
  }

  if (appStatus === 'shutting_down') {
    return <Shutdown />;
  }

  return (
    <div className={`hud-container transition-opacity duration-1000 ${appStatus === 'running' ? 'opacity-100' : 'opacity-0'}`}>
        {isVisionMode && <VisionMode onCapture={handleVisionCapture} onClose={() => { sounds.playDeactivate(); setIsVisionMode(false); }} />}
        {activeMode === 'design' && <DesignMode prompt={modeData.prompt} onComplete={handleDesignComplete} onCancel={handleCancelMode} />}
        {activeMode === 'simulation' && <SimulationMode prompt={modeData.prompt} onComplete={handleSimulationComplete} onCancel={handleCancelMode} />}
        {activeMode === 'diagnostics' && <DiagnosticsMode onComplete={handleDiagnosticsComplete} />}
        
        <ErrorModal isOpen={!!error} onClose={() => { sounds.playClose(); setError(null); }} error={error} />
        <ActionModal isOpen={!!modalConfig} onClose={handleCloseModal} {...modalConfig} onSubmit={(data) => { sounds.playSuccess(); modalConfig?.onSubmit(data); setModalConfig(null); }} />
        <VoiceCalibrationModal 
            isOpen={isCalibrationModalOpen}
            onClose={() => { sounds.playClose(); setIsCalibrationModalOpen(false); }}
            onComplete={(profile) => {
                sounds.playSuccess();
                setThemeSettings(p => ({ ...p, voiceProfile: profile }));
                setIsCalibrationModalOpen(false);
            }}
        />
        <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => { sounds.playClose(); setIsSettingsModalOpen(false); }}
            onCameraClick={() => { sounds.playActivate(); setIsVisionMode(true); }}
            isBusy={isBusy}
            onWeather={handleWeather}
            onSelfHeal={handleSelfHeal}
            onDesignMode={handleDesignMode}
            onSimulationMode={handleSimulationMode}
            onCalibrateVoice={() => { sounds.playOpen(); setIsCalibrationModalOpen(true); }}
            sounds={sounds}
            themeSettings={themeSettings}
            onThemeChange={setThemeSettings}
            onSetCustomBootVideo={handleSetCustomBootVideo}
            onRemoveCustomBootVideo={handleRemoveCustomBootVideo}
        />

        <header className="hud-header">
            <div className="flex items-center h-full">
                <h1 className="font-orbitron text-3xl text-primary text-primary-shadow tracking-widest">
                    J.A.R.V.I.S.
                </h1>
            </div>

            <div className="flex items-center h-full text-sm text-slate-300 font-mono">
                <div className="pl-6 pr-6 flex items-center gap-4 h-full">
                    <div className="relative w-12 h-12 flex-shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" className="stroke-primary-t-20" strokeWidth="4" fill="none" />
                            <circle
                                cx="50" cy="50" r="45"
                                className="stroke-primary" strokeWidth="4" fill="none"
                                strokeLinecap="round" transform="rotate(-90 50 50)"
                                style={{
                                    strokeDasharray: circumference,
                                    strokeDashoffset: circumference - (seconds / 60) * circumference,
                                    transition: 'stroke-dashoffset 0.3s linear',
                                }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold text-primary">
                            {seconds.toString().padStart(2, '0')}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-mono text-2xl text-slate-100 tracking-wider flex items-baseline">
                            <span>{hours.toString().padStart(2, '0')}</span>
                            <span className="animate-pulse mx-px">:</span>
                            <span>{minutes.toString().padStart(2, '0')}</span>
                            <span className="text-base ml-2">{ampm}</span>
                        </div>
                        <div className="font-sans text-xs text-slate-400 tracking-widest mt-1">
                            {dayOfWeek} | {formattedDate}
                        </div>
                    </div>
                </div>
                <div className="h-full flex items-center pr-6 pl-6 border-l-2 border-primary-t-20">
                    <button 
                        onClick={() => { sounds.playOpen(); setIsSettingsModalOpen(true); }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary-t-20 hover:text-primary border border-primary-t-20 hover:border-primary transition-colors mr-4"
                        aria-label="Open Settings"
                    >
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={handleShutdown} 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/50 hover:border-red-400 transition-colors"
                        aria-label="Shutdown System"
                    >
                        <PowerIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>


        <div className="hud-panel hud-left-panel">
            <ChatLog history={chatHistory} appState={appState} />
        </div>
        
        <div className="hud-core-container">
            <CoreInterface appState={appState} />
        </div>
        
        <div className="hud-right-panel-placeholder"></div>

        <div className="hud-bottom-panel !p-0">
             <form onSubmit={handleFormSubmit} className="w-full h-full flex items-center pr-4">
                <input 
                    type="text" 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    placeholder={getPlaceholderText()}
                    disabled={isInputBusy} 
                    className="flex-grow h-full bg-transparent border-none focus:ring-0 px-6 text-slate-200 text-lg placeholder:text-slate-500"
                    aria-label="Command input" 
                />
                <div className="flex items-center space-x-2 flex-shrink-0">
                    {hasRecognitionSupport && (
                        <button
                            type="button"
                            onClick={toggleListening}
                            disabled={isBusy}
                            className={`p-2 rounded-md transition-colors ${
                                appState === AppState.LISTENING
                                    ? 'text-red-500 bg-red-500/20 animate-pulse'
                                    : 'text-primary hover:bg-primary-t-20'
                            } disabled:text-slate-600 disabled:hover:bg-transparent`}
                            aria-label={appState === AppState.LISTENING ? "Stop listening" : "Use voice command"}
                        >
                            <MicrophoneIcon className="w-7 h-7" />
                        </button>
                    )}
                    <button 
                        type="submit" 
                        disabled={!inputValue || appState === AppState.LISTENING} 
                        className="p-2 rounded-md text-primary hover:bg-primary-t-20 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
                        aria-label="Send command"
                    >
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default App;