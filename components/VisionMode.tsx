
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { aiOrchestrator } from '../services/aiOrchestrator';
import { FormattedMessage } from './ChatLog';
import { CloseIcon, MicrophoneIcon, StopIcon, SwitchCameraIcon, TaskIcon } from './Icons';
import type { ChatMessage } from '../types';

// Type for a message in the vision history
interface VisionMessage {
    id: number;
    role: 'user' | 'model';
    content: string;
    imageUrl?: string; // Only for the first user message
}

// Props from App.tsx
interface VisionIntelligenceProps {
  onLogToChat: (prompt: string, imageUrl: string, response: string) => void;
  onClose: () => void;
}

const VisionIntelligence: React.FC<VisionIntelligenceProps> = ({ onLogToChat, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const bottomOfChatRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState('');
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [visionHistory, setVisionHistory] = useState<VisionMessage[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const analyze = async (prompt: string, currentHistory: VisionMessage[], image?: { mimeType: string; data: string; }) => {
        setIsAnalyzing(true);
        clearTranscript();

        const modelMessageId = Date.now();
        setVisionHistory(prev => [...prev, { id: modelMessageId, role: 'model', content: '' }]);

        const historyForAI: ChatMessage[] = currentHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
            imageUrl: msg.imageUrl,
            timestamp: new Date().toISOString(), // a timestamp is required by the type
            sources: [],
        }));

        try {
            const stream = await aiOrchestrator.getAiResponseStream(prompt, historyForAI, image ? [image] : undefined);
            
            for await (const chunk of stream) {
                setVisionHistory(prev => prev.map(msg => 
                    msg.id === modelMessageId 
                        ? { ...msg, content: msg.content + chunk.text } 
                        : msg
                ));
            }

        } catch (err) {
            console.error(err);
            const errorContent = "My apologies, I encountered an error during the analysis.";
             setVisionHistory(prev => prev.map(msg => 
                msg.id === modelMessageId 
                    ? { ...msg, content: errorContent } 
                    : msg
            ));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSpeechEnd = (prompt: string) => {
        const isFirstUserMessage = !visionHistory.some(m => m.role === 'user');

        if (isFirstUserMessage) {
            const frame = captureFrame();
            if (!frame) {
                setError("Could not capture frame.");
                setIsAnalyzing(false);
                return;
            }
            const imageData = {
                mimeType: 'image/jpeg',
                data: frame.split(',')[1],
                dataUrl: frame
            };
            
            const newUserMessage: VisionMessage = {
                id: Date.now(),
                role: 'user',
                content: prompt,
                imageUrl: imageData.dataUrl
            };
            
            setVisionHistory(prev => [...prev, newUserMessage]);
            analyze(prompt, [], imageData);
        } else {
            const newUserMessage: VisionMessage = {
                id: Date.now(),
                role: 'user',
                content: prompt
            };

            setVisionHistory(prev => [...prev, newUserMessage]);
            analyze(prompt, visionHistory);
        }
    };

    const { isListening, transcript, startListening, stopListening, clearTranscript } = useSpeechRecognition({
        onEnd: (finalTranscript) => {
            if (finalTranscript.trim() && !isAnalyzing) {
                handleSpeechEnd(finalTranscript.trim());
            } else {
                // If transcript is empty or we were analyzing, just stop.
                setIsAnalyzing(false); 
            }
        },
        interimResults: true
    });

    const captureFrame = (): string | null => {
        if (!videoRef.current || !isCameraReady) return null;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            return canvas.toDataURL('image/jpeg', 0.9);
        }
        return null;
    };

    const startCamera = useCallback(async () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setError('');
        setIsCameraReady(false);

        const resolutions = [
            { width: 3840, height: 2160 }, // 4K
            { width: 2560, height: 1440 }, // 2K (QHD)
            { width: 1920, height: 1080 }, // Full HD
            { width: 1280, height: 720 },  // HD
            { width: 640, height: 480 },   // SD
        ];

        for (const res of resolutions) {
            try {
                const constraints: MediaStreamConstraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: res.width },
                        height: { ideal: res.height },
                    }
                };
                const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log(`Successfully acquired camera at ${res.width}x${res.height}`);
                streamRef.current = newStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                    videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
                }
                // If successful, exit the function
                return;
            } catch (err: any) {
                if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                    console.warn(`Resolution ${res.width}x${res.height} not supported, trying next.`);
                } else {
                    console.error("Unexpected camera access error:", err);
                    setError("Could not access camera. Please ensure permissions are granted.");
                    // Break the loop on unexpected errors like permission denial
                    return;
                }
            }
        }
        
        // If the loop completes without returning, no resolutions were supported
        console.error("All attempted camera resolutions failed.");
        setError("Could not access camera. No supported resolution found.");
    }, [facingMode]);

    useEffect(() => {
        startCamera();
        return () => {
            stopListening();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) videoRef.current.srcObject = null;
        };
    }, [startCamera, stopListening]);


    useEffect(() => {
        bottomOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [visionHistory]);

    const handleLogAndExit = () => {
        if (visionHistory.length > 1) {
            const firstUserMessage = visionHistory.find(m => m.role === 'user');
            if (firstUserMessage && firstUserMessage.imageUrl) {
                const conversation = visionHistory
                    .map(m => `**${m.role === 'user' ? 'Operator' : 'J.A.R.V.I.S.'}:** ${m.content}`)
                    .join('\n\n---\n\n');
                
                onLogToChat(
                    `Vision Analysis: "${firstUserMessage.content}"`,
                    firstUserMessage.imageUrl,
                    `**Vision Mode Session Log**\n\n${conversation}`
                );
            } else {
                 onClose();
            }
        } else {
            onClose();
        }
    };
    
    const getStatusText = () => {
        if (error) return <span className="text-red-400">{error}</span>;
        if (isAnalyzing) return <span className="text-yellow-400 animate-pulse">ANALYZING...</span>;
        if (isListening) return transcript ? <span className="text-primary">{transcript}</span> : <span className="text-primary">LISTENING...</span>;
        if (!isCameraReady) return <span className="text-text-muted">INITIALIZING CAMERA...</span>;
        return <span className="text-text-muted">Tap the mic and ask a question.</span>
    }
    
    const handleMicClick = () => {
        if (isAnalyzing || !isCameraReady) return;
        
        if (isListening) {
            stopListening(); // This will trigger onEnd and analysis
        } else {
            startListening();
        }
    };

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in-fast">
            <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} />
            
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <button onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')} className="p-2 rounded-full text-white bg-black/40 hover:bg-black/60 transform hover:scale-110 active:scale-100 transition-all duration-200" aria-label="Switch Camera">
                    <SwitchCameraIcon className="w-6 h-6"/>
                </button>
                <button onClick={handleLogAndExit} className="p-2 rounded-full text-white bg-black/40 hover:bg-black/60 transform hover:scale-110 active:scale-100 transition-all duration-200" aria-label="Log Session to Chat">
                    <TaskIcon className="w-6 h-6"/>
                </button>
                <button onClick={onClose} className="p-2 rounded-full text-white bg-black/40 hover:bg-black/60 transform hover:scale-110 active:scale-100 transition-all duration-200" aria-label="Close Vision Mode">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-2/3 md:h-1/2 p-4 pt-24 bg-gradient-to-t from-background via-background/90 to-transparent flex flex-col pointer-events-none">
                <div className="flex-1 overflow-y-auto styled-scrollbar pr-2 space-y-4 pointer-events-auto">
                    {visionHistory.map(msg => (
                        <div key={msg.id} className={`flex items-start gap-3 animate-fade-in-fast ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0" style={{ boxShadow: '0 0 10px var(--primary-color-hex)' }}></div>}
                            <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-t-20 text-text-primary' : 'bg-panel'}`}>
                                {msg.imageUrl && <img src={msg.imageUrl} alt="User analysis content" className="rounded-md mb-2 max-h-32"/>}
                                <FormattedMessage text={msg.content || ' '} />
                            </div>
                        </div>
                    ))}
                     <div ref={bottomOfChatRef} />
                </div>
                
                <div className="flex-shrink-0 mt-4 p-2 holographic-panel !bg-panel/90 flex items-center gap-4 pointer-events-auto">
                    <div className="flex-1 font-orbitron text-lg text-left pl-2">
                        {getStatusText()}
                    </div>
                    <button 
                        onClick={handleMicClick} 
                        disabled={isAnalyzing || !isCameraReady}
                        className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed
                            ${isListening ? 'bg-red-500 animate-pulse-strong text-white' : 'bg-primary text-background'}`}
                        aria-label={isListening ? 'Stop Listening' : 'Start Listening'}
                    >
                        {isAnalyzing ? (
                             <svg className="w-6 h-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            isListening ? <StopIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-7 h-7" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VisionIntelligence;
