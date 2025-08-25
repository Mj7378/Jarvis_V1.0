import React from 'react';

const ListeningAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-jarvis-dark/80 z-30 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 rounded-full border-2 border-jarvis-cyan/30 animate-ping-slow"></div>
        <div className="absolute inset-2 rounded-full border-2 border-jarvis-cyan/50 animate-ping-medium"></div>
        <div className="absolute inset-4 rounded-full border-2 border-jarvis-cyan/70 animate-ping-fast"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-jarvis-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
            </svg>
        </div>
      </div>
      <p className="font-orbitron text-2xl text-jarvis-cyan mt-8 tracking-widest animate-pulse">
        LISTENING...
      </p>
    </div>
  );
};

export default ListeningAnimation;
