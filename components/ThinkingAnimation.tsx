import React from 'react';

const ThinkingAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-jarvis-dark/80 z-30 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <div className="relative w-48 h-48">
        {/* Abstract representation of a neural network */}
        <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="rgba(0,255,255,0.2)" strokeWidth="1" fill="none" />
          <circle cx="50" cy="50" r="30" stroke="rgba(0,255,255,0.3)" strokeWidth="1" fill="none" />
          <circle cx="50" cy="50" r="15" stroke="rgba(0,255,255,0.4)" strokeWidth="1" fill="none" />
          {/* Pulsing Core */}
          <circle cx="50" cy="50" r="5" fill="rgba(0,255,255,1)" className="animate-pulse" />
          
          {/* Radiating lines with animation */}
          <g className="thinking-lines">
            <line x1="50" y1="50" x2="50" y2="5" stroke="rgba(0,255,255,0.8)" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="95" y2="50" stroke="rgba(0,255,255,0.8)" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="50" y2="95" stroke="rgba(0,255,255,0.8)" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="5" y2="50" stroke="rgba(0,255,255,0.8)" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="82" y2="18" stroke="rgba(0,255,255,0.8)" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="18" y2="82" stroke="rgba(0,255,255,0.8)" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="82" y2="82" stroke="rgba(0,255,255,0.8)" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="18" y2="18" stroke="rgba(0,255,255,0.8)" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
       <p className="font-orbitron text-2xl text-jarvis-cyan mt-8 tracking-widest animate-pulse">
        THINKING...
      </p>
    </div>
  );
};

export default ThinkingAnimation;
