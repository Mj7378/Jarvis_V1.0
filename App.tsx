import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAiResponseStream } from './services/geminiService';
import { useChatHistory } from './hooks/useChatHistory';
import { ChatMessage, AppState, Source, AICommand, DeviceControlCommand, AppError, ThemeSettings } from './types';
import { saveVideo, deleteVideo } from './utils/db';

import ChatLog from './components/ChatLog';
import VisionMode from './components/VisionMode';
import ActionModal, { ActionModalProps } from './components/ActionModal';
import { RightSidebar } from './components/RightSidebar';
import CoreInterface from './components/CoreInterface';
import DesignMode from './components/DesignMode';
import SimulationMode from './components/SimulationMode';
import ErrorModal from './components/ErrorModal';
import DiagnosticsMode from './components/DiagnosticsMode';
import BootingUp from './components/BootingUp';
import Shutdown from './components/Shutdown';
import { useSoundEffects } from './hooks/useSoundEffects';
import { PowerIcon } from './components/Icons';

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
};

const App: React.FC = () => {
  const [appStatus, setAppStatus] = useState<'booting' | 'running' | 'shutting_down'>('booting');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<AppError | null>(null);
  const [isVisionMode, setIsVisionMode] = useState(false);
  const [modalConfig, setModalConfig] = useState<Omit<ActionModalProps, 'isOpen' | 'onClose'> | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [modeData, setModeData] = useState<any>(null);

  // Theme Settings State
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  
  // Clock state (moved from Header)
  const [time, setTime] = useState(new Date());

  const { chatHistory, addMessage, appendToLastMessage, updateLastMessage, removeLastMessage } = useChatHistory();
  const sounds = useSoundEffects();

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
    }
  }, []);
  
  // Clock effect
  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

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

      // Save to localStorage
      localStorage.setItem('jarvisTheme', JSON.stringify(themeSettings));
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
      const stream = await getAiResponseStream(effectivePrompt, historyForApi, image_data);

      let fullResponse = '';
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
        return;
      }

      if (isJsonResponse) {
          try {
              const command: AICommand = JSON.parse(fullResponse);
              if (command && command.action) {
                  updateLastMessage({ content: command.spoken_response });
                  if (command.action === 'device_control') {
                      executeDeviceCommand(command);
                  }
              }
          } catch (e) {
              // It looked like JSON but wasn't. Treat as conversational.
              const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
              updateLastMessage({ content: fullResponse, sources: uniqueSources });
          }
      } else {
          const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
          updateLastMessage({ content: fullResponse, sources: uniqueSources });
      }
      
      isProcessingRef.current = false;
      setAppState(AppState.IDLE);

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
  }, [addMessage, updateLastMessage, chatHistory, removeLastMessage, handleError]);

  const handleVisionCapture = (imageDataUrl: string) => {
    sounds.playSuccess();
    setIsVisionMode(false);
    processUserMessage("Analyze this image.", undefined, imageDataUrl);
  };
  
  const isBusy = appState === AppState.THINKING;

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
      addMessage({
          role: 'model',
          content: `Design concept for "${prompt}" has been generated.`,
          imageUrl: imageDataUrl,
      });
      setActiveMode(null);
      setModeData(null);
  };

  const handleSimulationComplete = (prompt: string) => {
      sounds.playSuccess();
      addMessage({
          role: 'model',
          content: `✅ **Simulation Complete:** The simulation for "*${prompt}*" has been rendered and viewed.`
      });
      setActiveMode(null);
      setModeData(null);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => { 
      e.preventDefault();
      sounds.playClick();
      if (appState === AppState.THINKING) {
        isCancelledRef.current = true;
      }
      processUserMessage(inputValue); 
  };
  
  const handleShutdown = () => {
    sounds.playDeactivate();
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
      setThemeSettings(prev => ({ ...prev, hasCustomBootVideo: false }));
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

  const isInputBusy = appState === AppState.THINKING;

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

  if (appStatus === 'booting') {
    return <BootingUp onComplete={() => setAppStatus('running')} useCustomVideo={themeSettings.hasCustomBootVideo} />;
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

        {/* --- Integrated Header Elements --- */}
        <div className="absolute top-4 left-4 flex items-center h-[60px] z-10">
            <h1 className="font-orbitron text-3xl text-primary text-primary-shadow tracking-widest">
                J.A.R.V.I.S.
            </h1>
        </div>

        <div className="absolute top-4 right-4 flex items-center h-[60px] text-sm text-slate-300 font-mono z-10">
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
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-primary text-lg font-bold">
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
                    onClick={handleShutdown} 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/50 hover:border-red-400 transition-colors"
                    aria-label="Shutdown System"
                >
                    <PowerIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
        {/* --- End Integrated Header Elements --- */}


        <div className="hud-panel hud-left-panel">
            <ChatLog history={chatHistory} appState={appState} />
        </div>
        
        <CoreInterface appState={appState} />

        <div className="hud-panel hud-right-panel">
             <RightSidebar 
                onCameraClick={() => { sounds.playActivate(); setIsVisionMode(true); }}
                isBusy={isBusy}
                onWeather={handleWeather}
                onSelfHeal={handleSelfHeal}
                onDesignMode={handleDesignMode}
                onSimulationMode={handleSimulationMode}
                sounds={sounds}
                themeSettings={themeSettings}
                onThemeChange={setThemeSettings}
                onSetCustomBootVideo={handleSetCustomBootVideo}
                onRemoveCustomBootVideo={handleRemoveCustomBootVideo}
            />
        </div>

        <div className="hud-bottom-panel !p-0">
             <form onSubmit={handleFormSubmit} className="w-full h-full">
                <div className="relative h-full">
                    <input 
                        type="text" 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        placeholder={isInputBusy ? "J.A.R.V.I.S. is thinking..." : "Enter command..."} 
                        disabled={isInputBusy} 
                        className="w-full h-full bg-transparent border-none focus:ring-0 px-6 text-slate-200 text-lg placeholder:text-slate-500"
                        aria-label="Command input" 
                    />
                    <button 
                        type="submit" 
                        disabled={!inputValue} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-md text-primary hover:bg-primary-t-20 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
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
