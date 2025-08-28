import React, { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { transcribeAudio } from '../services/geminiService';

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
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
    </svg>
);

const ClarityIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728m2.828 9.9a5 5 0 010-7.072" />
    </svg>
);

const FeedbackCard: React.FC<{ icon: React.ReactNode; title: string; value: string; feedback: string; }> = ({ icon, title, value, feedback }) => (
    <div className="bg-slate-900/50 border border-primary-t-20 rounded-lg p-4 flex items-start gap-4">
        <div className="flex-shrink-0 text-primary mt-1">
            {icon}
        </div>
        <div className="flex-1">
            <p className="font-orbitron text-slate-300">{title}</p>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-sm text-slate-400 mt-1">{feedback}</p>
        </div>
    </div>
);


const VoiceCalibrationModal: React.FC<VoiceCalibrationModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [calibrationState, setCalibrationState] = useState<CalibrationState>('idle');
  const [activeTab, setActiveTab] = useState<CalibrationMode>('record');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    rate: number;
    pitch: number;
    wpm: number;
    clarity: number;
    paceFeedback: string;
    clarityFeedback: string;
  } | null>(null);
  const [profileName, setProfileName] = useState('');

  const startTimeRef = useRef<number>(0);

  const calculateClarity = (transcript: string): number => {
    const targetWords = CALIBRATION_PHRASE.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
    const transcriptWords = transcript.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
    
    const targetWordCount = targetWords.length;
    if (targetWordCount === 0) return 100;

    const targetWordFreq = new Map<string, number>();
    for (const word of targetWords) {
        targetWordFreq.set(word, (targetWordFreq.get(word) || 0) + 1);
    }
    
    let matchedWords = 0;
    for (const word of transcriptWords) {
        if (targetWordFreq.has(word) && targetWordFreq.get(word)! > 0) {
            matchedWords++;
            targetWordFreq.set(word, targetWordFreq.get(word)! - 1);
        }
    }
    
    return (matchedWords / targetWordCount) * 100;
  };

  const analyzeVocalProfile = (transcript: string, durationInSeconds: number) => {
    const clarity = calculateClarity(transcript);
    
    if (clarity < 70) {
        setError("Clarity was too low to create a profile. Please try again, ensuring you are in a quiet environment and speak clearly.");
        setCalibrationState('error');
        return;
    }
    
    let clarityFeedback = "";
    if (clarity >= 95) {
        clarityFeedback = "Excellent clarity. Your enunciation is very precise.";
    } else if (clarity >= 80) {
        clarityFeedback = "Clarity is good. For even better results, try to enunciate each word a little more distinctly.";
    } else {
        clarityFeedback = "Some words were unclear, which may affect accuracy. Speaking more deliberately can improve results.";
    }

    const wordsInTranscript = transcript.trim().split(/\s+/).length;
    const wpm = (wordsInTranscript / durationInSeconds) * 60;
    
    let paceFeedback = "";
    if (wpm < 130) {
        paceFeedback = "Your pace is calm and deliberate. I will adjust to a slightly slower response time.";
    } else if (wpm <= 170) {
        paceFeedback = "Your speaking pace is clear and steady, around the average rate. I will match this cadence.";
    } else {
        paceFeedback = "Your pace is quite fast and efficient. I will accelerate my responses to keep up.";
    }
    
    let rate = (wpm / 150); // Base rate is 1.0 at 150 WPM
    rate = Math.max(0.8, Math.min(1.5, rate));

    setAnalysisResult({
        rate: parseFloat(rate.toFixed(2)),
        pitch: 1.1,
        wpm: Math.round(wpm),
        clarity: Math.round(clarity),
        paceFeedback,
        clarityFeedback,
    });
    setProfileName(`Vocal Profile ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    
    setTimeout(() => {
        setCalibrationState('feedback');
    }, 1500);
  };


  const handleSpeechEnd = (finalTranscript: string) => {
    if (calibrationState !== 'recording') return;

    setCalibrationState('analyzing');
    const endTime = Date.now();
    const durationInSeconds = (endTime - startTimeRef.current) / 1000;

    if (!finalTranscript.trim() || durationInSeconds < 1) {
        setError("No speech was detected. Please try again.");
        setCalibrationState('error');
        return;
    }
    
    analyzeVocalProfile(finalTranscript, durationInSeconds);
  };

  const { isListening, transcript, startListening, stopListening, error: speechError } = useSpeechRecognition({ onEnd: handleSpeechEnd });

  useEffect(() => {
    if (speechError) {
      setError(speechError);
      setCalibrationState('error');
    }
  }, [speechError]);

  const handleStartRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      setCalibrationState('recording');
      startTimeRef.current = Date.now();
      startListening();
    } catch (err) {
      setError("Microphone access was denied. Please grant permission to continue.");
      setCalibrationState('error');
    }
  };

  const handleStopRecording = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    stopListening();
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    setCalibrationState('analyzing');
    setError('');

    try {
      const duration = await getAudioDuration(selectedFile);
      if (duration < 1 || duration > 30) {
        throw new Error("Audio file duration is too short or too long. Please record the phrase clearly.");
      }
      
      const base64Data = await fileToBase64(selectedFile);
      const transcript = await transcribeAudio(base64Data, selectedFile.type);
      
      if (!transcript.trim()) {
          throw new Error("Could not detect any speech in the audio file. Please ensure it contains the calibration phrase spoken clearly.");
      }
      
      analyzeVocalProfile(transcript, duration);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred analyzing the file.";
      setError(errorMessage);
      setCalibrationState('error');
    }
  };

  const handleSaveProfile = () => {
    if (analysisResult && profileName.trim()) {
      onComplete({ name: profileName.trim(), rate: analysisResult.rate, pitch: analysisResult.pitch });
    }
  };

  const handleRecalibrate = () => {
    setCalibrationState('idle');
    setError('');
    setSelectedFile(null);
    setAnalysisResult(null);
  };
  
  const TabButton: React.FC<{ isActive: boolean, onClick: () => void, children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            isActive
                ? 'border-b-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-200'
        }`}
    >
        {children}
    </button>
);

  const getPaceLabel = (wpm: number) => {
    if (wpm < 130) return "Deliberate";
    if (wpm <= 170) return "Average";
    return "Fast";
  };

  const getClarityLabel = (clarity: number) => {
    if (clarity >= 95) return "Excellent";
    if (clarity >= 80) return "Good";
    return "Fair";
  };

  const renderContent = () => {
    switch (calibrationState) {
      case 'idle':
        return (
          <>
            <h2 className="panel-title text-secondary">Voice Calibration</h2>
             <div className="flex border-b border-primary-t-20 mb-4">
                <TabButton isActive={activeTab === 'record'} onClick={() => { setActiveTab('record'); setError(''); }}>
                    Record Voice
                </TabButton>
                <TabButton isActive={activeTab === 'upload'} onClick={() => { setActiveTab('upload'); setError(''); setSelectedFile(null); }}>
                    Upload Audio
                </TabButton>
            </div>
            
            {activeTab === 'record' && (
                <>
                    <p className="text-slate-300 my-4">To calibrate J.A.R.V.I.S. to your vocal patterns, please read the following sentence aloud clearly. This will help match its speaking rate to yours.</p>
                    <p className="text-xl text-center font-mono p-4 bg-slate-900/50 border border-primary-t-20 rounded-md text-primary">
                        "{CALIBRATION_PHRASE}"
                    </p>
                    <div className="mt-6 flex justify-end">
                    <button onClick={handleStartRecording} className="px-6 py-2 rounded-md bg-primary-t-80 text-jarvis-dark hover:bg-primary transition-colors">
                        Start Recording
                    </button>
                    </div>
                </>
            )}

            {activeTab === 'upload' && (
                 <>
                    <p className="text-slate-300 my-4">Upload a clear audio file (.mp3, .wav, .ogg) of you saying the phrase below.</p>
                    <p className="text-xl text-center font-mono p-4 bg-slate-900/50 border border-primary-t-20 rounded-md text-primary">
                        "{CALIBRATION_PHRASE}"
                    </p>
                    <div className="mt-6">
                        <label htmlFor="audio-upload" className="w-full cursor-pointer text-center block p-4 bg-slate-800/80 border-2 border-dashed border-primary-t-20 hover:border-primary rounded-md transition-colors">
                            {selectedFile ? (
                                <span className="text-green-400">{selectedFile.name}</span>
                            ) : (
                                <span className="text-slate-400">Click to Select Audio File</span>
                            )}
                        </label>
                        <input
                            id="audio-upload"
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleAnalyzeFile}
                            disabled={!selectedFile}
                            className="px-6 py-2 rounded-md bg-primary-t-80 text-jarvis-dark hover:bg-primary transition-colors disabled:opacity-50"
                        >
                            Analyze File
                        </button>
                    </div>
                </>
            )}
          </>
        );
      case 'recording':
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <h2 className="font-orbitron text-2xl text-red-500 animate-pulse">RECORDING</h2>
            <p className="text-slate-300 mt-4 text-center">"{transcript || CALIBRATION_PHRASE}"</p>
            <div className="mt-8">
                 <button onClick={handleStopRecording} className="px-6 py-2 rounded-md bg-red-600/80 text-white hover:bg-red-500/80 transition-colors">
                    Stop
                </button>
            </div>
          </div>
        );
      case 'analyzing':
          return (
             <div className="flex flex-col items-center justify-center p-8">
                <svg className="w-12 h-12 animate-spin text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h2 className="font-orbitron text-2xl text-yellow-400 animate-pulse">ANALYZING VOCAL PROFILE...</h2>
            </div>
          );
       case 'feedback':
           if (!analysisResult) return null;
           return (
                <>
                    <h2 className="panel-title text-secondary">Calibration Complete</h2>
                    <p className="text-slate-300 mb-4">Based on your recording, I've created a new vocal profile to better match your cadence.</p>
                    <div className="space-y-3">
                        <FeedbackCard 
                            icon={<PaceIcon />}
                            title="Speaking Pace"
                            value={`${analysisResult.wpm} WPM (${getPaceLabel(analysisResult.wpm)})`}
                            feedback={analysisResult.paceFeedback}
                        />
                         <FeedbackCard 
                            icon={<ClarityIcon />}
                            title="Speech Clarity"
                            value={`${analysisResult.clarity}% (${getClarityLabel(analysisResult.clarity)})`}
                            feedback={analysisResult.clarityFeedback}
                        />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="profile-name" className="block text-sm font-medium text-slate-300 mb-1">Save Profile As:</label>
                        <input
                            id="profile-name"
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200"
                        />
                    </div>
                     <div className="mt-6 flex justify-end space-x-3">
                        <button onClick={handleRecalibrate} className="px-6 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 transition-colors">
                            Recalibrate
                        </button>
                        <button onClick={handleSaveProfile} disabled={!profileName.trim()} className="px-6 py-2 rounded-md bg-primary-t-80 text-jarvis-dark hover:bg-primary transition-colors disabled:opacity-50">
                            Save & Apply Profile
                        </button>
                    </div>
                </>
           );
       case 'error':
           return (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="font-orbitron text-2xl text-red-400">Calibration Failed</h2>
                    <p className="text-slate-300 mt-2">{error}</p>
                     <div className="mt-8">
                        <button onClick={handleRecalibrate} className="px-6 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 transition-colors">
                            Try Again
                        </button>
                    </div>
                </div>
           );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <div className="hud-panel w-full max-w-lg m-4">
        <div className="relative p-2">
            <button onClick={onClose} className="absolute top-0 right-0 p-2 text-slate-500 hover:text-white z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VoiceCalibrationModal;