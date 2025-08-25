
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAiResponseStream } from './services/geminiService';
import { useChatHistory } from './hooks/useChatHistory';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { ChatMessage, AppState, Source, AICommand, DeviceControlCommand } from './types';

import ChatLog from './components/ChatLog';
import VisionMode from './components/VisionMode';
import ActionModal, { ActionModalProps } from './components/ActionModal';
import { RightSidebar } from './components/RightSidebar';
import Header from './components/Header';
import CoreInterface from './components/CoreInterface';
import DesignMode from './components/DesignMode';
import SimulationMode from './components/SimulationMode';
import CyberAnalystMode from './components/CyberAnalystMode';
import ErrorModal from './components/ErrorModal';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string>('');
  const [isVisionMode, setIsVisionMode] = useState(false);
  const [modalConfig, setModalConfig] = useState<Omit<ActionModalProps, 'isOpen' | 'onClose'> | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [modeData, setModeData] = useState<any>(null);

  const { chatHistory, addMessage, appendToLastMessage, updateLastMessage, removeLastMessage } = useChatHistory();

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef(false);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setError('Speech synthesis is not supported.');
      setAppState(AppState.ERROR);
    }
  }, []);
  
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    if (!text || !text.trim()) {
      setAppState(AppState.IDLE);
      isProcessingRef.current = false;
      return;
    }
    
    window.speechSynthesis.cancel();

    setAppState(AppState.SPEAKING);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = window.speechSynthesis.getVoices().find(v => v.name.includes('Google') && v.name.includes('Male')) || window.speechSynthesis.getVoices()[0];
    utterance.pitch = 1.1;
    utterance.rate = 1.1;
    
    utterance.onend = () => {
      setAppState(AppState.IDLE);
      isProcessingRef.current = false;
    };
    utterance.onerror = (e) => {
      setError('Speech synthesis error.');
      setAppState(AppState.ERROR);
      isProcessingRef.current = false;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

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
    
    setError('');
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
      let sources: Source[] = [];
      for await (const chunk of stream) {
        if (isCancelledRef.current) break;

        const chunkText = chunk.text;
        if (chunkText) {
          fullResponse += chunkText;
          appendToLastMessage(chunkText);
        }

        const newSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.map(c => c.web)
          .filter((s): s is Source => !!s?.uri) || [];
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

      try {
        const command: AICommand = JSON.parse(fullResponse);
        if (command && command.action) {
            updateLastMessage({ content: command.spoken_response });
            speak(command.spoken_response);
            
            if (command.action === 'device_control') {
                executeDeviceCommand(command);
            }
            return;
        }
      } catch (e) {
          // Not a JSON command
      }

      const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
      updateLastMessage({ content: fullResponse, sources: uniqueSources });
      speak(fullResponse);

    } catch (err) {
      if (isCancelledRef.current) {
        isProcessingRef.current = false;
        setAppState(AppState.IDLE);
        return;
      }
      isProcessingRef.current = false;
      removeLastMessage();
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setAppState(AppState.ERROR);
    }
  }, [addMessage, appendToLastMessage, updateLastMessage, chatHistory, removeLastMessage, speak]);
  
  const handleSpeechEnd = useCallback((finalTranscript: string) => {
      if (finalTranscript) {
          processUserMessage(finalTranscript);
      }
  }, [processUserMessage]);

  const { isListening, transcript, startListening: startSpeechRecognition, stopListening: stopSpeechRecognition } = useSpeechRecognition({ onEnd: handleSpeechEnd });

  useEffect(() => {
      if (transcript) {
          setInputValue(transcript);
      }
  }, [transcript]);

  useEffect(() => {
    if (isListening) {
      setAppState(AppState.LISTENING);
    } else {
      if (appState === AppState.LISTENING) {
        setAppState(AppState.IDLE);
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);


  const handleVisionCapture = (imageDataUrl: string) => {
    setIsVisionMode(false);
    processUserMessage("Analyze this image.", undefined, imageDataUrl);
  };
  
  const isBusy = appState === AppState.THINKING || appState === AppState.LISTENING || appState === AppState.SPEAKING;

  const handleToggleListening = async () => {
    if (isListening) {
        stopSpeechRecognition();
    } else {
        if (appState === AppState.THINKING || appState === AppState.SPEAKING) {
            isCancelledRef.current = true;
        }
        window.speechSynthesis.cancel();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioStream(stream);
            startSpeechRecognition();
        } catch (err) {
            setError("Microphone access denied. Please grant permission.");
            setAppState(AppState.ERROR);
        }
    }
  };

  const handleWeather = () => {
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

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSelfHeal = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setError('');
    addMessage({ role: 'user', content: 'Initiate self-healing protocol.' });
    setAppState(AppState.THINKING);
    addMessage({ role: 'model', content: '' });
    await sleep(500); appendToLastMessage("Scanning core systems...\n");
    await sleep(1000); appendToLastMessage("Defragmenting memory banks...\n");
    await sleep(1200); appendToLastMessage("Recalibrating AI subroutines...\n\n");
    await sleep(800);
    const finalContent = chatHistory[chatHistory.length - 1].content + "System integrity restored. All functions operating at 100%.";
    updateLastMessage({ content: finalContent });
    speak("Self-repair complete. All systems are now nominal.");
  };

  const handleCreativeWriting = () => setModalConfig({ title: 'Creative Writing Assistant', inputs: [{ id: 'style', label: 'Writing Style', type: 'text' }, { id: 'prompt', label: 'Topic / Prompt', type: 'textarea' }], submitLabel: 'Generate', onSubmit: (data) => data.style && data.prompt && processUserMessage(`Write a ${data.style} about: ${data.prompt}`) });
  
  const handleDesignMode = () => setModalConfig({
    title: 'Design Mode',
    inputs: [{ id: 'prompt', label: 'Describe your visual concept', type: 'textarea', placeholder: 'e.g., A miniature arc reactor with a glowing blue core.' }],
    submitLabel: 'Generate Image',
    onSubmit: (data) => {
        if (data.prompt) {
            setModeData({ prompt: data.prompt });
            setActiveMode('design');
        }
    },
  });

  const handleSimulationMode = () => setModalConfig({
      title: 'Simulation Mode',
      inputs: [{ id: 'prompt', label: 'Describe the simulation scenario', type: 'textarea', placeholder: 'e.g., A high-speed flight through a canyon in the Iron Man suit.' }],
      submitLabel: 'Run Simulation',
      onSubmit: (data) => {
          if (data.prompt) {
              setModeData({ prompt: data.prompt });
              setActiveMode('simulation');
          }
      },
  });

  const handleCyberAnalystMode = () => setModalConfig({
    title: 'Cyber Analyst',
    inputs: [{ id: 'url', label: 'Enter URL to Analyze', type: 'text', placeholder: 'https://www.example.com' }],
    submitLabel: 'Analyze',
    onSubmit: (data) => {
        if (data.url) {
            setModeData({ url: data.url });
            setActiveMode('cyber_analyst');
        }
    },
  });

  const handleDesignComplete = (prompt: string, imageDataUrl: string) => {
      addMessage({
          role: 'model',
          content: `Design concept for "${prompt}" has been generated.`,
          imageUrl: imageDataUrl,
      });
      setActiveMode(null);
      setModeData(null);
  };

  const handleSimulationComplete = (prompt: string) => {
      addMessage({
          role: 'model',
          content: `✅ **Simulation Complete:** The simulation for "*${prompt}*" has been rendered and viewed.`
      });
      setActiveMode(null);
      setModeData(null);
  };

  const handleCyberAnalystComplete = (summary: string) => {
      addMessage({
          role: 'model',
          content: `✅ **Analysis Complete:** ${summary}`
      });
      setActiveMode(null);
      setModeData(null);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => { 
      e.preventDefault(); 
      if (appState === AppState.SPEAKING) {
        isCancelledRef.current = true;
        window.speechSynthesis.cancel();
      }
      processUserMessage(inputValue); 
  };
  
  const isInputBusy = appState === AppState.THINKING || appState === AppState.LISTENING;

  return (
    <div className="hud-container">
        {isVisionMode && <VisionMode onCapture={handleVisionCapture} onClose={() => setIsVisionMode(false)} />}
        {activeMode === 'design' && <DesignMode prompt={modeData.prompt} onComplete={handleDesignComplete} onCancel={() => setActiveMode(null)} />}
        {activeMode === 'simulation' && <SimulationMode prompt={modeData.prompt} onComplete={handleSimulationComplete} onCancel={() => setActiveMode(null)} />}
        {activeMode === 'cyber_analyst' && <CyberAnalystMode url={modeData.url} onComplete={handleCyberAnalystComplete} onCancel={() => setActiveMode(null)} />}

        <ErrorModal isOpen={!!error} onClose={() => setError('')} error={error} />
        <ActionModal isOpen={!!modalConfig} onClose={() => setModalConfig(null)} {...modalConfig} onSubmit={(data) => { modalConfig?.onSubmit(data); setModalConfig(null); }} />

        <Header />

        <div className="hud-panel hud-left-panel">
            <ChatLog history={chatHistory} appState={appState} />
        </div>
        
        <CoreInterface appState={appState} onClick={handleToggleListening} audioStream={audioStream} />

        <div className="hud-panel hud-right-panel">
             <RightSidebar 
                onCameraClick={() => setIsVisionMode(true)}
                isBusy={isBusy}
                onWeather={handleWeather}
                onSelfHeal={handleSelfHeal}
                onCreativeWriting={handleCreativeWriting}
                onDesignMode={handleDesignMode}
                onSimulationMode={handleSimulationMode}
                onCyberAnalystMode={handleCyberAnalystMode}
            />
        </div>

        <div className="hud-bottom-panel !p-0">
             <form onSubmit={handleFormSubmit} className="w-full h-full">
                <div className="relative h-full">
                    <input 
                        type="text" 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        placeholder={appState === AppState.SPEAKING ? "Interrupt with new command..." : isListening ? "Listening..." : "Enter command..."} 
                        disabled={isInputBusy} 
                        className="w-full h-full bg-transparent border-none focus:ring-0 px-6 text-slate-200 text-lg placeholder:text-slate-500"
                        aria-label="Command input" 
                    />
                    <button 
                        type="submit" 
                        disabled={isInputBusy || !inputValue} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-md text-jarvis-cyan hover:bg-jarvis-cyan/20 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
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
