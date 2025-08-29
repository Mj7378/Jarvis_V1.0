
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


// System Lifecycle States
type SystemState = 'PRE_BOOT' | 'BOOTING' | 'ACTIVE' | 'SHUTTING_DOWN' | 'SNAP_DISINTEGRATION';

// Helper function to remove markdown for clean speech.
// This ensures that characters like '#' or '*' are not read aloud by TTS.
const stripMarkdown = (text: string): string => {
    return text
        // Removes title, subtitle, heading, and note prefixes.
        .replace(/^(# |## |### |> )/gm, '')
        // Removes **bold** and *italic*
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        // Removes list item markers like * or -
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
  soundProfile: 'default',
  voiceProfiles: [DEFAULT_PROFILE],
  activeVoiceProfileId: DEFAULT_PROFILE.id,
  wakeWord: 'JARVIS',
  aiModel: 'gemini-2.5-flash',
};

const FULL_THEMES = [
    { name: 'J.A.R.V.I.S.', primaryColor: '#00ffff', panelColor: '#121a2b', themeMode: 'dark' as const },
    { name: 'Code Red', primaryColor: '#ff2d2d', panelColor: '#1a0a0f', themeMode: 'dark' as const },
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
  const { chatHistory, addMessage, appendToLastMessage, updateLastMessage } = useChatHistory();
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
  // FIX: State setters are stable and do not need to be dependencies of useCallback.
  }, [sounds]);

  // Core AI communication logic.
  // This block is ordered to resolve dependencies and uses a ref to break a circular dependency
  // where an app command might need to trigger a new message.
  const handleSendMessageRef = useRef<(prompt: string, imageUrl?: string) => void>();
  const processAiResponseRef = useRef<(prompt: string, image?: { mimeType: string; data: string; }) => void>();


  const handleAppCommand = useCallback((params: { action?: string; value?: any }) => {
    switch (params.action) {
      case 'open_settings':
        setIsSettingsOpen(true);
        break;
      case 'close_settings':
        setIsSettingsOpen(false);
        break;
      case 'vision_mode':
        setIsVisionMode(true);
        break;
      case 'design_mode':
        if (typeof params.value === 'string') {
          setDesignModePrompt(params.value);
        }
        break;
      case 'simulation_mode':
        if (typeof params.value === 'string') {
          setSimulationModePrompt(params.value);
        }
        break;
      case 'run_diagnostics':
        setIsDiagnosticsMode(true);
        break;
      case 'calibrate_voice':
        setIsCalibrationOpen(true);
        break;
      case 'change_theme':
        if (typeof params.value === 'string') {
          const themeName = params.value.toLowerCase();
          const selectedTheme = FULL_THEMES.find(t => t.name.toLowerCase() === themeName);
          if (selectedTheme) {
            setThemeSettings(prev => ({
              ...prev,
              primaryColor: selectedTheme.primaryColor,
              panelColor: selectedTheme.panelColor,
              themeMode: selectedTheme.themeMode,
            }));
          } else {
              addMessage({ role: 'model', content: `I couldn't find a theme named "${params.value}".` });
          }
        }
        break;
      case 'toggle_voice':
        if(params.value === 'on' || params.value === 'off') {
            setThemeSettings(prev => ({
                ...prev,
                voiceOutputEnabled: params.value === 'on',
            }));
        }
        break;
      case 'toggle_sounds':
        if(params.value === 'on' || params.value === 'off') {
            setThemeSettings(prev => ({
                ...prev,
                uiSoundsEnabled: params.value === 'on',
            }));
        }
        break;
      case 'set_primary_color':
        if (typeof params.value === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(params.value)) {
            setThemeSettings(prev => ({ ...prev, primaryColor: params.value }));
        } else {
             addMessage({ role: 'model', content: `"${params.value}" doesn't seem to be a valid hex color code.` });
        }
        break;
      default:
        addMessage({ role: 'model', content: "I'm sorry, I don't recognize that internal command." });
        break;
    }
  // FIX: State setters and stable callbacks do not need to be dependencies.
  }, [addMessage, setThemeSettings]);

  const handleDeviceCommand = useCallback(async (command: DeviceControlCommand) => {
    addMessage({ role: 'model', content: command.spoken_response });
    if(themeSettings.voiceOutputEnabled) queueSpeech(command.spoken_response);

    switch (command.command) {
      case 'open_url':
        window.open(command.params.url, '_blank');
        break;
      case 'search':
        const query = encodeURIComponent(command.params.query);
        let searchUrl: string;

        // Explicitly handle YouTube, default to Google for 'Google' app or any other case
        if (command.app?.toLowerCase() === 'youtube') {
            searchUrl = `https://www.youtube.com/results?search_query=${query}`;
        } else {
            searchUrl = `https://www.google.com/search?q=${query}`;
        }
        window.open(searchUrl, '_blank');
        break;
      case 'app_control':
        handleAppCommand(command.params);
        break;
       case 'shutdown':
        setTimeout(handleShutdown, 1000); // Delay to allow speech to finish
        break;
      case 'set_reminder': {
        const { content, time } = command.params;
        if (content && time) {
            const success = await addReminder(content, time);
            if (!success) {
                const failureMsg = { role: 'model' as const, content: "Sorry, I couldn't parse that time for the reminder. Try something like 'in 10 minutes' or 'at 8 PM'." };
                addMessage(failureMsg);
                if(themeSettings.voiceOutputEnabled) queueSpeech(failureMsg.content);
            }
        }
        break;
      }
      // Other cases can be added here (navigate, play_music, etc.)
    }
  }, [addMessage, queueSpeech, themeSettings.voiceOutputEnabled, handleShutdown, handleAppCommand, addReminder]);

  const processAiResponse = useCallback(async (prompt: string, image?: { mimeType: string; data: string; }) => {
    setAppState(AppState.THINKING);
    cancelSpeech(); // Reset speech state for the new response
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
        const stream = await getAiResponseStream(prompt, chatHistory, themeSettings.aiModel, image);
        let fullResponse = "";
        let isFirstChunk = true;
        let isCommand = false;
        let speechBuffer = "";
        let commandBuffered = false;
        let finalChunk: GenerateContentResponse | null = null;

        for await (const chunk of stream) {
            if (abortControllerRef.current.signal.aborted) {
                console.log("Stream aborted by user.");
                cancelSpeech();
                return;
            }

            const chunkText = chunk.text;
             finalChunk = chunk; // Keep track of the latest chunk
            if (!chunkText) continue;

            fullResponse += chunkText;

            if (isFirstChunk) {
                isFirstChunk = false;
                const trimmedChunk = chunkText.trim();
                // Check if the response is likely a JSON command, even if wrapped in markdown
                if (trimmedChunk.startsWith('{') || trimmedChunk.startsWith('```json')) {
                    isCommand = true;
                    commandBuffered = true; // Buffer the full response without displaying
                } else {
                    // It's a regular message, add an empty bubble to start typing into.
                    addMessage({ role: 'model', content: "" });
                }
            }

            if (!commandBuffered) {
                // This is a regular chat message, so append it to the chat log for the user to see.
                appendToLastMessage(chunkText);
                if (themeSettings.voiceOutputEnabled) {
                    speechBuffer += chunkText;
                    // Use a regex to find complete sentences to send to TTS
                    const sentences = speechBuffer.match(/[^.!?]+[.!?]+/g);
                    if (sentences) {
                        let processedText = "";
                        sentences.forEach(sentence => {
                            queueSpeech(stripMarkdown(sentence));
                            processedText += sentence;
                        });
                        // Update buffer with any remaining partial sentence
                        speechBuffer = speechBuffer.substring(processedText.length);
                    }
                }
            }
            // If it's a command, we do nothing here in the loop, just keep buffering in `fullResponse`.
        }

        // After stream ends, process the complete response
        if (isCommand) {
            // Attempt to extract and parse the JSON from the buffered response.
            // This regex handles JSON that is either raw or wrapped in a markdown code block.
            const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[2]) : null;

            if (jsonString) {
                try {
                    const commandJson: AICommand = JSON.parse(jsonString);
                    await handleDeviceCommand(commandJson as DeviceControlCommand);
                } catch (e) {
                    console.error("Failed to parse AI command:", e, "Response:", jsonString);
                    addMessage({ role: 'model', content: "I encountered an error trying to execute that command. My apologies." });
                }
            } else {
                console.error("Could not extract JSON from a response flagged as a command:", fullResponse);
                addMessage({ role: 'model', content: "My command protocols seem to have malfunctioned. Please try again." });
            }
        } else {
            // For regular messages, speak any remaining text in the buffer.
            if (themeSettings.voiceOutputEnabled && speechBuffer.trim()) {
                queueSpeech(stripMarkdown(speechBuffer.trim()));
            }
        }

        // After all processing, check for and add sources
        if (finalChunk) {
            // Note: The type for grounding chunks is not exported, so we use `any`.
            const chunks = finalChunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks && Array.isArray(chunks)) {
                const sources: Source[] = chunks
                    .filter((chunk: any) => chunk.web && chunk.web.uri)
                    .map((chunk: any) => ({
                        uri: chunk.web.uri,
                        title: chunk.web.title || chunk.web.uri,
                    }));

                if (sources.length > 0) {
                    updateLastMessage({ sources });
                }
            }
        }

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log("AI response stream successfully aborted.");
            return;
        }
        const appErr = error.appError || { code: 'UNKNOWN', title: 'Error', message: error.message };
        setCurrentError(appErr);
        setAppState(AppState.ERROR);
    } finally {
        // Only transition to IDLE if the state is still THINKING.
        // This prevents overriding a new state (like LISTENING) set by a user interruption.
        setAppState(prevState => (prevState === AppState.THINKING ? AppState.IDLE : prevState));
    }
  }, [chatHistory, themeSettings.aiModel, themeSettings.voiceOutputEnabled, appendToLastMessage, addMessage, handleDeviceCommand, queueSpeech, cancelSpeech, updateLastMessage]);

    const handleSendMessage = useCallback((prompt: string, imageUrl?: string) => {
    addMessage({ role: 'user', content: prompt, imageUrl });
    if(imageUrl) {
        const base64Data = imageUrl.split(',')[1];
        processAiResponse(prompt, { mimeType: 'image/jpeg', data: base64Data });
    } else {
        processAiResponse(prompt);
    }
  }, [addMessage, processAiResponse]);

  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
    processAiResponseRef.current = processAiResponse;
  }, [handleSendMessage, processAiResponse]);
  
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
      // Interrupt any ongoing AI activity (both speech and stream generation)
      // to allow the user to speak a new command immediately.
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
      }
      cancelSpeech();
      
      sounds.playClick();
      startListening();
      setAppState(AppState.LISTENING);
    }
  }, [isListening, stopListening, startListening, sounds, cancelSpeech]);
  
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
  
    // --- File Upload Handlers ---
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && fileHandlerRef.current) {
      try {
        await fileHandlerRef.current.handler(file);
      } catch (err) {
        setCurrentError({ code: 'FILE_READ_ERROR', title: 'File Error', message: 'Could not read the selected file.' });
      } finally {
        if(event.target) event.target.value = ''; // Reset file input
        fileHandlerRef.current = null;
      }
    }
  };

  const triggerFileUpload = (accept: string, handler: (file: File) => void) => {
    if (fileInputRef.current) {
      fileHandlerRef.current = { accept, handler };
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleGalleryUpload = () => {
    triggerFileUpload('image/*', async (file) => {
      const imageDataUrl = await readFileAsDataURL(file);
      addMessage({ role: 'user', content: `Analyzing image: ${file.name}`, imageUrl: imageDataUrl });
      processAiResponse(`Analyze this image from my gallery named "${file.name}".`, {
        mimeType: file.type,
        data: imageDataUrl.split(',')[1],
      });
    });
  };

  const handleDocumentUpload = () => {
    triggerFileUpload('.txt,.md,.json,.csv', async (file) => {
      const textContent = await readFileAsText(file);
      const prompt = `I've uploaded a document named "${file.name}". Please analyze its content. Here is the content:\n\n---\n\n${textContent}`;
      handleSendMessage(prompt);
    });
  };

  const handleAudioUpload = () => {
    triggerFileUpload('audio/*', async (file) => {
      addMessage({ role: 'user', content: `Transcribing audio file: ${file.name}` });
      setAppState(AppState.THINKING);
      try {
        const base64Data = await readFileAsBase64(file);
        const transcription = await transcribeAudio(base64Data, file.type);
        addMessage({ role: 'model', content: `Transcription of "${file.name}":\n\n> ${transcription}` });
      } catch (err: any) {
        const appErr = err.appError || { code: 'TRANSCRIPTION_ERROR', title: 'Transcription Failed', message: err.message };
        setCurrentError(appErr);
        setAppState(AppState.ERROR);
      } finally {
        setAppState(AppState.IDLE);
      }
    });
  };
  
  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      setCurrentError({ code: 'GEOLOCATION_UNSUPPORTED', title: 'Geolocation Error', message: 'Geolocation is not supported by your browser.' });
      return;
    }

    addMessage({ role: 'user', content: 'Fetching my current location...' });
    setAppState(AppState.THINKING);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const prompt = `My current location is latitude ${latitude.toFixed(6)} and longitude ${longitude.toFixed(6)}. What can you tell me about this area? Please suggest some interesting local spots.`;
        handleSendMessage(prompt);
      },
      (error) => {
        setCurrentError({ code: 'GEOLOCATION_ERROR', title: 'Geolocation Error', message: `Could not retrieve location: ${error.message}` });
        setAppState(AppState.IDLE);
      }
    );
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
        {themeSettings.showScanlines && <div className="scanline-overlay"></div>}
        <main className={`hud-container ${systemState === 'SNAP_DISINTEGRATION' ? 'system-terminating' : ''}`}>
            <Header onOpenSettings={() => setIsSettingsOpen(true)} />

            <div className="hud-chat-panel">
                <ChatLog history={chatHistory} appState={appState} />
            </div>
            
            <div className="hud-bottom-panel">
                 <UserInput
                    onSendMessage={handleSendMessage}
                    onToggleListening={handleToggleListening}
                    appState={appState}
                    isListening={isListening}
                    onCameraClick={() => setIsVisionMode(true)}
                    onGalleryClick={handleGalleryUpload}
                    onDocumentClick={handleDocumentUpload}
                    onAudioClick={handleAudioUpload}
                    onLocationClick={handleLocationClick}
                    onDesignModeClick={handleOpenDesignMode}
                    onSimulationModeClick={handleOpenSimulationMode}
                />
            </div>

        </main>
        
        {/* Notification Toasts */}
        <div aria-live="assertive" className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3 pointer-events-none">
            {toasts.map((toast) => (
                <NotificationToast
                    key={toast.id}
                    id={toast.id}
                    title={toast.title}
                    message={toast.message}
                    onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
                />
            ))}
        </div>

        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
        />

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
