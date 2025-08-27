import React, { useEffect, useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

// Microphone Icon Component
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

// Function to unlock audio autoplay
const primeAudioContext = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      // Create a silent buffer to play. This is a standard way to unlock autoplay.
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
      console.log("Audio context primed for autoplay.");
      return true;
    } catch (e) {
      console.error("Could not prime audio context:", e);
      return false;
    }
};

const PreBootScreen: React.FC<{ onInitiate: () => void; wakeWord: string; }> = ({ onInitiate, wakeWord }) => {
    const [isPrimed, setIsPrimed] = useState(false);

    const { 
        isListening, 
        transcript, 
        startListening, 
        stopListening, 
        hasRecognitionSupport, 
        error 
    } = useSpeechRecognition({ continuous: true });

    // Start listening only after the system is primed by a user click.
    useEffect(() => {
        if (isPrimed && hasRecognitionSupport && !isListening) {
            startListening();
        }
    }, [isPrimed, hasRecognitionSupport, isListening, startListening]);

    // Monitor the transcript for the wake word.
    useEffect(() => {
        if (isPrimed && wakeWord && transcript.toLowerCase().includes(wakeWord.toLowerCase().trim())) {
            stopListening(); // Stop listening to prevent further actions
            onInitiate(); // Trigger the boot-up sequence
        }
    }, [transcript, onInitiate, stopListening, wakeWord, isPrimed]);

    const handlePrimeSystem = () => {
        if (primeAudioContext()) {
            setIsPrimed(true);
        } else {
            // Fallback: If priming fails for any reason, proceed anyway.
            // The video will likely be muted by the browser, but the app won't be stuck.
            setIsPrimed(true); 
        }
    };

    if (!isPrimed) {
        return (
            <div className="fixed inset-0 bg-jarvis-dark text-primary font-mono flex flex-col items-center justify-center p-8 overflow-hidden animate-fade-in-fast">
                <div className="text-center">
                    <h1 
                        className="font-orbitron text-7xl md:text-8xl lg:text-9xl text-primary glitch"
                        data-text="J.A.R.V.I.S."
                        style={{ textShadow: '0 0 20px var(--primary-color-hex)' }}
                    >
                        J.A.R.V.I.S.
                    </h1>
                    <p className="text-xl md:text-2xl mt-4 tracking-widest text-slate-400">
                        SYSTEM OFFLINE
                    </p>
                </div>
                
                <div className="mt-24 text-center">
                    <button 
                        onClick={handlePrimeSystem}
                        className="font-orbitron text-4xl tracking-widest p-6 border-2 border-primary-t-50 rounded-lg text-primary-t-70 hover:bg-primary hover:text-jarvis-dark hover:shadow-[0_0_30px] hover:shadow-primary transition-all duration-300 animate-pulse-glow"
                        style={{ '--primary-color-hex': 'var(--primary-color-hex)' } as React.CSSProperties}
                        aria-label="Initiate System"
                    >
                        INITIATE
                    </button>
                    <p className="text-slate-500 mt-6 text-sm">Initial interaction required to enable full audio capabilities.</p>
                </div>
            </div>
        );
    }

    // This is the "Standby" screen after the initial click
    return (
        <div className="fixed inset-0 bg-jarvis-dark text-primary font-mono flex flex-col items-center justify-center p-8 overflow-hidden animate-fade-in-fast">
            <div className="text-center">
                <h1 
                    className="font-orbitron text-7xl md:text-8xl lg:text-9xl text-primary"
                    style={{ textShadow: '0 0 20px var(--primary-color-hex)' }}
                >
                    J.A.R.V.I.S.
                </h1>
                <p className="text-xl md:text-2xl mt-4 tracking-widest text-slate-400 animate-pulse">
                    SYSTEM STANDBY
                </p>
            </div>
            
            <div className="mt-24 text-center h-48 flex flex-col items-center justify-center">
                {!hasRecognitionSupport ? (
                    <p className="text-red-500 font-sans text-lg">Speech recognition is not supported in this browser.</p>
                ) : error ? (
                    <p className="text-red-500 font-sans text-lg">Microphone Error: {error}</p>
                ) : (
                    <>
                        <div className={`relative w-32 h-32 flex items-center justify-center transition-colors duration-500 ${isListening ? 'text-primary' : 'text-slate-600'}`}>
                           {isListening && <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse-strong" style={{animationDuration: '2.5s'}}></div>}
                           <MicIcon className="w-16 h-16" />
                        </div>
                        <p className={`mt-4 text-2xl font-orbitron tracking-widest transition-opacity ${isListening ? 'animate-pulse' : 'opacity-50'}`}>
                           Say "{wakeWord}" to begin
                        </p>
                        <p className="mt-2 text-sm text-slate-500 h-6 w-full max-w-md truncate" title={transcript}>
                            {transcript || '...'}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default PreBootScreen;