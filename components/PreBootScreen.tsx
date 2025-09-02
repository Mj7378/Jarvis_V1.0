
import React from 'react';

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

const PreBootScreen: React.FC<{ onInitiate: () => void; }> = ({ onInitiate }) => {

    const handleInitiateSystem = () => {
        primeAudioContext();
        onInitiate();
    };

    return (
        <div className="fixed inset-0 bg-transparent text-primary font-mono flex flex-col items-center justify-center p-8 overflow-hidden animate-fade-in-fast">
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
                    onClick={handleInitiateSystem}
                    className="font-orbitron text-4xl tracking-widest p-6 border-2 border-primary-t-50 rounded-lg text-primary bg-white/5 backdrop-blur-md shadow-lg shadow-primary/20 hover:bg-white/10 hover:border-primary hover:shadow-primary/40 transition-all duration-300 animate-pulse-glow transform hover:scale-105 active:scale-100"
                    style={{ '--primary-color-hex': 'var(--primary-color-hex)' } as React.CSSProperties}
                    aria-label="Initiate System"
                >
                    INITIATE
                </button>
                <p className="text-slate-500 mt-6 text-sm">Initial interaction required to enable full audio capabilities.</p>
            </div>
        </div>
    );
};

export default PreBootScreen;
