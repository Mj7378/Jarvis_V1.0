import React from 'react';

const PreBootScreen: React.FC<{ onInitiate: () => void; }> = ({ onInitiate }) => {
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
                    A.I. ASSISTANT
                </p>
            </div>
            
            <div className="mt-24 h-20">
                <button 
                    onClick={onInitiate}
                    className="px-12 py-4 font-orbitron text-2xl tracking-widest bg-transparent border-2 rounded-md transition-all duration-300 border-primary text-primary hover:bg-primary hover:text-jarvis-dark animate-pulse-glow"
                    aria-label="Initiate J.A.R.V.I.S. system"
                >
                    INITIATE
                </button>
            </div>
        </div>
    );
};

export default PreBootScreen;