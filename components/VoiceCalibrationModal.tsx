import React, { useState, useEffect, useRef } from 'react';
import { aiOrchestrator } from '../services/aiOrchestrator';
import { CloseIcon, MicrophoneIcon } from './Icons';

interface VoiceCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: { name: string; rate: number; pitch: number }) => void;
}

type CalibrationState = 'idle' | 'recording' | 'analyzing' | 'feedback' | 'error';
type CalibrationMode = 'record' | 'upload';

const CALIBRATION_PHRASE = "The quick brown fox jumps over the lazy dog.";

// Helper to read file as base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

// Helper to get audio duration
const getAudioDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();
    reader.onload = (e) => {
      audioContext.decodeAudioData(e.target?.result as ArrayBuffer)
        .then(buffer => resolve(buffer.duration))
        .catch(error => reject(new Error("Could not decode audio file. Please use a standard format like MP3 or WAV.")));
    };
    reader.onerror = error => reject(error);
    reader.readAsArrayBuffer(file);
  });
  
const PaceIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.24A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4.36A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
    </svg>
);

const ClarityIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

// Levenshtein distance for accuracy calculation
const calculateAccuracy = (str1: string, str2: string): number => {
    str1 = str1.toLowerCase().replace(/[^\w\s]/gi, '');
    str2 = str2.toLowerCase().replace(/[^\w\s]/gi, '');

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 100;

    const edits = (a: string, b: string) => {
        const costs = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            let lastValue = i;
            for (let j = 1; j <= b.length; j++) {
                const newValue = a[i - 1] === b[j - 1] ? costs[j - 1] : Math.min(costs[j - 1], lastValue, costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
            costs[b.length] = lastValue;
        }
        return costs[b.length];
    };
    
    const distance = edits(longer, shorter);
    return Math.max(0, ((longer.length - distance) / longer.length) * 100);
};

const VoiceCalibrationModal: React.FC<VoiceCalibrationModalProps> = ({ isOpen, onClose, onComplete }) => {
    const [state, setState] = useState<CalibrationState>('idle');
    const [mode, setMode] = useState<CalibrationMode>('record');
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState<{ wpm: number; accuracy: number; rate: number } | null>(null);
    const [profileName, setProfileName] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bug Fix: Ensure stream is always stopped on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);
    
    const resetState = () => {
        setState('idle');
        setError('');
        setAnalysis(null);
        setProfileName('');
        audioChunksRef.current = [];
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
                analyzeAudio(audioFile);
                audioChunksRef.current = [];
            };
            mediaRecorderRef.current.start();
            setState('recording');
        } catch (err) {
            setError('Could not access microphone. Please ensure permissions are granted.');
            setState('error');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setState('analyzing');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setState('analyzing');
            analyzeAudio(file);
        }
    };
    
    const analyzeAudio = async (audioFile: File) => {
        try {
            const [duration, base64Data] = await Promise.all([
                getAudioDuration(audioFile),
                fileToBase64(audioFile),
            ]);
            
            const transcription = await aiOrchestrator.transcribeAudio(base64Data, audioFile.type);
            
            const wordCount = transcription.trim().split(/\s+/).length;
            const wpm = Math.round((wordCount / duration) * 60) || 0;
            
            const accuracy = calculateAccuracy(transcription, CALIBRATION_PHRASE);
            
            // Map WPM (e.g., 120-220) to AI speech rate (e.g., 1.0-1.4)
            const rate = Math.min(1.4, Math.max(1.0, 1.0 + ((wpm - 140) / 80) * 0.4));
            
            setAnalysis({ wpm, accuracy, rate: parseFloat(rate.toFixed(2)) });
            setState('feedback');
        } catch (err: any) {
            setError(err.message || 'Failed to analyze audio.');
            setState('error');
        }
    };
    
    const handleSaveProfile = () => {
        if (analysis && profileName.trim()) {
            onComplete({ name: profileName.trim(), rate: analysis.rate, pitch: 1.0 });
        }
    };
    
    const handleClose = () => {
        if (streamRef.current) {
             streamRef.current.getTracks().forEach(track => track.stop());
             streamRef.current = null;
        }
        resetState();
        onClose();
    };

    if (!isOpen) return null;

    const renderContent = () => {
        switch(state) {
            case 'recording':
                return (
                    <div className="text-center">
                        <p className="font-orbitron text-xl text-red-400 animate-pulse mb-6">RECORDING</p>
                        <p className="text-lg mb-8">"{CALIBRATION_PHRASE}"</p>
                        <button onClick={handleStopRecording} className="px-8 py-3 rounded-md bg-red-600/80 text-white hover:bg-red-500/80 transition-all duration-200 font-bold uppercase tracking-wider transform hover:scale-105 active:scale-100">Stop</button>
                    </div>
                );
            case 'analyzing':
                return (
                    <div className="text-center">
                        <svg className="w-12 h-12 animate-spin text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="font-orbitron text-xl text-yellow-400 animate-pulse">ANALYZING SPEECH...</p>
                    </div>
                );
            case 'feedback':
                return (
                    <div className="text-left">
                        <h3 className="font-orbitron text-xl text-primary mb-4">Analysis Complete</h3>
                        <div className="space-y-4 bg-panel/50 p-4 rounded-lg border border-primary-t-20">
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><PaceIcon /> Speaking Pace:</span> <span className="font-bold text-lg">{analysis?.wpm} WPM</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><ClarityIcon /> Clarity Score:</span> <span className="font-bold text-lg">{analysis?.accuracy.toFixed(1)}%</span></div>
                        </div>
                        <p className="text-sm text-text-muted mt-4">Based on your speech, J.A.R.V.I.S.'s voice rate will be set to <b className="text-text-primary">{analysis?.rate}x</b> for a more natural conversation.</p>
                        <div className="mt-6">
                            <label htmlFor="profileName" className="block text-sm mb-2">Profile Name:</label>
                            <input id="profileName" type="text" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="e.g., My Fast Profile" className="w-full bg-panel/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none"/>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={resetState} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 transform hover:scale-105 active:scale-100 transition-all duration-200">Try Again</button>
                            <button onClick={handleSaveProfile} disabled={!profileName.trim()} className="px-4 py-2 rounded-md bg-primary-t-80 text-background hover:bg-primary disabled:opacity-50 transform hover:scale-105 active:scale-100 transition-all duration-200">Save Profile</button>
                        </div>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center">
                        <p className="font-orbitron text-xl text-red-400 mb-4">Error</p>
                        <p className="mb-6">{error}</p>
                        <button onClick={resetState} className="px-8 py-3 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 transform hover:scale-105 active:scale-100 transition-all duration-200">Try Again</button>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className="text-center">
                        <p className="text-sm text-text-muted mb-2">Read the following phrase aloud:</p>
                        <p className="text-xl mb-6 bg-panel/50 p-3 rounded-lg border border-primary-t-20">"{CALIBRATION_PHRASE}"</p>
                        <div className="flex flex-col items-center gap-4">
                            <button onClick={handleStartRecording} className="w-48 px-4 py-3 flex items-center justify-center gap-3 rounded-md bg-primary-t-80 text-background hover:bg-primary transition-all duration-200 font-bold uppercase tracking-wider transform hover:scale-105 active:scale-100">
                                <MicrophoneIcon className="w-6 h-6"/> Start Recording
                            </button>
                            <span className="text-text-muted">or</span>
                            <button onClick={() => fileInputRef.current?.click()} className="w-48 text-primary hover:underline">Upload an audio file</button>
                            <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast" onClick={handleClose}>
            <div className="holographic-panel w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b border-primary-t-20 mb-4">
                    <h2 className="font-orbitron text-xl text-primary">Voice Calibration</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-panel/50 transform hover:scale-110 active:scale-100 transition-all duration-200"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default VoiceCalibrationModal;
