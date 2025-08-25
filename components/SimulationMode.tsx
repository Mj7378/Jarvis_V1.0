import React, { useState, useEffect, useRef } from 'react';
import { generateVideo, getVideoOperationStatus } from '../services/geminiService';
import { GenerateVideoIcon } from './Icons';

const LOADING_MESSAGES = [
    "Engaging quantum simulation core...",
    "Reticulating splines...",
    "Calibrating temporal vectors...",
    "Compiling photonic sequences...",
    "Buffering terabytes of reality...",
    "Finalizing event horizon...",
];

interface SimulationModeProps {
  prompt: string;
  onComplete: (prompt: string) => void;
  onCancel: () => void;
}

const SimulationMode: React.FC<SimulationModeProps> = ({ prompt, onComplete, onCancel }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  
  const operationRef = useRef<any>(null);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const startVideoGeneration = async () => {
      try {
        operationRef.current = await generateVideo(prompt);
        pollIntervalRef.current = window.setInterval(pollStatus, 10000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start simulation.');
        setIsLoading(false);
      }
    };
    
    const pollStatus = async () => {
        try {
            const status = await getVideoOperationStatus(operationRef.current);
            operationRef.current = status;
            if (status.done) {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                const uri = status.response?.generatedVideos?.[0]?.video?.uri;
                if (uri) {
                    const response = await fetch(`${uri}&key=${process.env.API_KEY}`);
                    const blob = await response.blob();
                    setVideoUrl(URL.createObjectURL(blob));
                } else {
                     setError("Simulation complete but no video was returned.");
                }
                setIsLoading(false);
            }
        } catch(err) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setError(err instanceof Error ? err.message : "An error occurred while polling for video status.");
            setIsLoading(false);
        }
    };

    startVideoGeneration();
    
    // Message cycler
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 4000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      clearInterval(messageInterval);
    };
  }, [prompt]);

  const handleLogToChat = () => {
      if(videoUrl) {
          onComplete(prompt);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <div className="panel w-full max-w-4xl h-[90vh] flex flex-col p-6 border-2 border-jarvis-cyan/50 shadow-2xl shadow-jarvis-cyan/20">
        <div className="flex justify-between items-center mb-4">
            <h1 className="font-orbitron text-xl text-jarvis-cyan tracking-widest truncate pr-4 flex items-center gap-3">
                <GenerateVideoIcon className="w-6 h-6" />
                SIMULATION MODE: {prompt}
            </h1>
            <div className="flex items-center gap-3">
                 <button onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 flex-shrink-0">
                    {isLoading ? 'Abort' : 'Close'}
                </button>
                <button onClick={handleLogToChat} disabled={!videoUrl} className="px-4 py-2 rounded-md bg-jarvis-cyan/80 text-jarvis-dark hover:bg-jarvis-cyan flex-shrink-0 disabled:opacity-50">
                    Log to Chat
                </button>
            </div>
        </div>
        
        <div className="flex-1 bg-slate-900/50 border border-jarvis-border rounded-lg flex items-center justify-center overflow-hidden">
            {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                   <svg className="w-12 h-12 animate-spin text-jarvis-cyan mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-orbitron text-lg">SIMULATION RUNNING...</p>
                    <p className="text-sm mt-2 text-yellow-300 transition-opacity duration-500">{loadingMessage}</p>
                    <p className="text-xs mt-4 text-slate-500">(This may take several minutes)</p>
                </div>
            )}
            {error && <p className="text-red-400 text-center p-4 bg-red-900/50 rounded-md">{error}</p>}
            {videoUrl && (
                <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain" />
            )}
        </div>
      </div>
    </div>
  );
};

export default SimulationMode;
