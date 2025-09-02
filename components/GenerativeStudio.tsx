import React, { useState, useEffect, useRef } from 'react';
import { aiOrchestrator } from '../services/aiOrchestrator';
import { GenerateImageIcon, GenerateVideoIcon, SendIcon } from './Icons';

const LOADING_MESSAGES = [
    "Engaging quantum simulation core...",
    "Reticulating splines...",
    "Calibrating temporal vectors...",
    "Compiling photonic sequences...",
    "Buffering terabytes of reality...",
    "Finalizing event horizon...",
];

interface GenerativeStudioProps {
  initialPrompt: string;
  initialMode: 'image' | 'video';
  onComplete: (prompt: string, type: 'image' | 'video', dataUrl?: string) => void;
  onCancel: () => void;
}

const GenerativeStudio: React.FC<GenerativeStudioProps> = ({ initialPrompt, initialMode, onComplete, onCancel }) => {
    const [activeMode, setActiveMode] = useState<'image' | 'video'>(initialMode);

    // ----- IMAGE STATE -----
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [imageError, setImageError] = useState('');
    const [editPrompt, setEditPrompt] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const historyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (historyRef.current) {
        historyRef.current.scrollTop = historyRef.current.scrollHeight;
      }
    }, [history]);

    // ----- VIDEO STATE -----
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState('');
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const [videoPrompt, setVideoPrompt] = useState('');
    const operationRef = useRef<any>(null);
    const pollIntervalRef = useRef<number | null>(null);

    // ----- IMAGE LOGIC -----
    const generateInitialImage = async (prompt: string) => {
        setIsImageLoading(true);
        setImageError('');
        try {
            const result = await aiOrchestrator.generateImage(prompt);
            setCurrentImage(result);
        } catch (err: any) {
            setImageError(err.appError?.message || err.message || 'An unknown error occurred.');
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleEditImage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editPrompt.trim() || !currentImage || isEditing || isImageLoading) return;

        setIsEditing(true);
        setImageError('');
        const base64 = currentImage.split(',')[1];

        try {
            const result = await aiOrchestrator.editImage(editPrompt, base64);
            setCurrentImage(result);
            setHistory(prev => [...prev, editPrompt]);
            setEditPrompt('');
        } catch (err: any) {
            setImageError(err.appError?.message || err.message || 'An unknown error occurred.');
        } finally {
            setIsEditing(false);
        }
    };

    // ----- VIDEO LOGIC -----
    const startVideoGeneration = async (prompt: string, imageBase64: string | null = null) => {
        setIsVideoLoading(true);
        setVideoError('');
        setVideoUrl(null);
        setVideoPrompt(prompt);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        try {
            operationRef.current = await aiOrchestrator.generateVideo(prompt, imageBase64 ?? undefined);
            pollIntervalRef.current = window.setInterval(pollVideoStatus, 10000);
        } catch (err) {
            setVideoError(err instanceof Error ? err.message : 'Failed to start simulation.');
            setIsVideoLoading(false);
        }
    };

    const pollVideoStatus = async () => {
        try {
            const status = await aiOrchestrator.getVideoOperationStatus(operationRef.current);
            operationRef.current = status;
            if (status.done) {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                const uri = status.response?.generatedVideos?.[0]?.video?.uri;
                if (uri) {
                    const response = await fetch(`${uri}&key=${process.env.API_KEY}`);
                    const blob = await response.blob();
                    setVideoUrl(URL.createObjectURL(blob));
                } else {
                    setVideoError("Simulation complete but no video was returned.");
                }
                setIsVideoLoading(false);
            }
        } catch (err) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setVideoError(err instanceof Error ? err.message : "An error occurred while polling for video status.");
            setIsVideoLoading(false);
        }
    };

    useEffect(() => {
        if (initialPrompt) {
            if (initialMode === 'image') {
                setHistory([initialPrompt]);
                generateInitialImage(initialPrompt);
            } else {
                startVideoGeneration(initialPrompt);
            }
        }
         // Message cycler for video
        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
            setLoadingMessage(LOADING_MESSAGES[messageIndex]);
        }, 4000);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            clearInterval(messageInterval);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPrompt, initialMode]);

    const handleLogToChat = () => {
        if (activeMode === 'image' && currentImage) {
            onComplete(history.join('; '), 'image', currentImage);
        } else if (activeMode === 'video' && videoUrl) {
            onComplete(videoPrompt, 'video');
        }
    };
    
    const renderImageUI = () => (
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
            <div className="flex-1 md:w-2/3 bg-slate-900/50 border border-primary-t-20 rounded-lg flex items-center justify-center overflow-hidden relative">
                {(isImageLoading || isEditing) && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center h-full text-slate-400 z-10">
                        <svg className="w-12 h-12 animate-spin text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-orbitron">{isImageLoading ? 'VISUALIZING CONCEPT...' : 'APPLYING MODIFICATIONS...'}</p>
                    </div>
                )}
                {imageError && !isEditing && <p className="text-red-400 text-center p-4 bg-red-900/50 rounded-md z-10">{imageError}</p>}
                {currentImage && <img src={currentImage} alt={history.join('; ')} className="max-w-full max-h-full object-contain" />}
            </div>
            <div className="md:w-1/3 flex flex-col gap-4">
                <div ref={historyRef} className="flex-1 bg-panel/50 border border-primary-t-20 rounded-lg p-3 overflow-y-auto styled-scrollbar">
                    <h3 className="font-orbitron text-sm text-text-secondary mb-2 border-b border-primary-t-20 pb-2">Prompt History</h3>
                    <ol className="list-decimal list-inside text-sm space-y-2">
                        {history.map((h, i) => <li key={i} className="text-slate-300">{h}</li>)}
                    </ol>
                </div>
                <form onSubmit={handleEditImage} className="bg-panel/50 border border-primary-t-20 rounded-lg p-3">
                    <label htmlFor="edit-prompt" className="font-orbitron text-sm text-text-secondary mb-2 block">Edit Command</label>
                    <div className="flex gap-2">
                        <input id="edit-prompt" type="text" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="e.g., add a hat" className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200" />
                        <button type="submit" disabled={!editPrompt.trim() || isEditing || isImageLoading} className="p-2 rounded-md bg-primary-t-80 text-background hover:bg-primary disabled:opacity-50"><SendIcon className="w-6 h-6"/></button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderVideoUI = () => (
         <div className="flex-1 flex flex-col gap-4 min-h-0">
             <div className="bg-panel/50 border border-primary-t-20 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} placeholder="Describe the video to generate..." className="flex-1 bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200" />
                    <div className="flex gap-2">
                        <button onClick={() => startVideoGeneration(videoPrompt)} disabled={!videoPrompt.trim() || isVideoLoading} className="flex-1 sm:flex-initial px-4 py-2 text-sm bg-primary-t-50 hover:bg-primary-t-80 rounded-md transition-colors disabled:opacity-50">Generate Video</button>
                        <button onClick={() => startVideoGeneration(videoPrompt, currentImage?.split(',')[1] ?? null)} disabled={!currentImage || !videoPrompt.trim() || isVideoLoading} className="flex-1 sm:flex-initial px-4 py-2 text-sm bg-sky-500/30 hover:bg-sky-500/50 rounded-md transition-colors disabled:opacity-50">Animate Last Image</button>
                    </div>
                </div>
             </div>
             <div className="flex-1 bg-slate-900/50 border border-primary-t-20 rounded-lg flex items-center justify-center overflow-hidden">
                {isVideoLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                       <svg className="w-12 h-12 animate-spin text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="font-orbitron text-lg">SIMULATION RUNNING...</p>
                        <p className="text-sm mt-2 text-yellow-300 transition-opacity duration-500">{loadingMessage}</p>
                        <p className="text-xs mt-4 text-slate-500">(This may take several minutes)</p>
                    </div>
                )}
                {videoError && <p className="text-red-400 text-center p-4 bg-red-900/50 rounded-md">{videoError}</p>}
                {videoUrl && <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain" />}
            </div>
         </div>
    );


    return (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast">
            <div className="holographic-panel w-full max-w-5xl h-[90vh] flex flex-col p-6 border-2 border-primary-t-50 shadow-2xl shadow-primary/20">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="font-orbitron text-xl text-primary tracking-widest truncate pr-4 flex items-center gap-3">
                        <GenerateImageIcon className="w-6 h-6" /> Generative Studio
                    </h1>
                    <div className="flex items-center gap-3">
                        <button onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 flex-shrink-0 transition-all duration-200 transform hover:scale-105 active:scale-100">Close</button>
                        <button onClick={handleLogToChat} disabled={activeMode === 'image' ? !currentImage : !videoUrl} className="px-4 py-2 rounded-md bg-primary-t-80 text-background hover:bg-primary flex-shrink-0 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-100">Log to Chat</button>
                    </div>
                </div>

                 <div className="flex gap-2 mb-4">
                    <button onClick={() => setActiveMode('image')} className={`flex-1 p-2 text-sm rounded-md border transition-colors flex items-center justify-center gap-2 ${activeMode === 'image' ? 'bg-primary-t-20 border-primary' : 'bg-slate-800/50 border-slate-700/50'}`}><GenerateImageIcon className="w-4 h-4"/> Image</button>
                    <button onClick={() => setActiveMode('video')} className={`flex-1 p-2 text-sm rounded-md border transition-colors flex items-center justify-center gap-2 ${activeMode === 'video' ? 'bg-primary-t-20 border-primary' : 'bg-slate-800/50 border-slate-700/50'}`}><GenerateVideoIcon className="w-4 h-4"/> Video</button>
                </div>

                {activeMode === 'image' ? renderImageUI() : renderVideoUI()}
            </div>
        </div>
    );
};

export default GenerativeStudio;
