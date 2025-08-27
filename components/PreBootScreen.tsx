
import React, { useState, useEffect } from 'react';

const PreBootScreen: React.FC<{ onInitiate: () => void; }> = ({ onInitiate }) => {
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowButton(true);
        }, 1500); // Delay for dramatic effect
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 bg-jarvis-dark text-jarvis-cyan font-mono flex flex-col items-center justify-center p-8 overflow-hidden animate-fade-in-fast">
            <div className="text-center">
                <h1 
                    className="font-orbitron text-7xl md:text-8xl lg:text-9xl text-jarvis-cyan glitch"
                    data-text="J.A.R.V.I.S."
                    style={{ textShadow: '0 0 20px #00ffff' }}
                >
                    J.A.R.V.I.S.
                </h1>
                <p className="text-xl md:text-2xl mt-4 tracking-widest text-slate-400">
                    A.I. ASSISTANT - OFFLINE
                </p>
            </div>
            <div className={`mt-20 transition-opacity duration-1000 ${showButton ? 'opacity-100' : 'opacity-0'}`}>
                <button 
                    onClick={onInitiate}
                    className="px-12 py-4 font-orbitron text-2xl tracking-widest bg-transparent border-2 border-jarvis-cyan text-jarvis-cyan rounded-md hover:bg-jarvis-cyan hover:text-jarvis-dark hover:shadow-[0_0_25px] hover:shadow-jarvis-cyan transition-all duration-300"
                >
                    INITIATE
                </button>
            </div>
        </div>
    );
};

export default PreBootScreen;
