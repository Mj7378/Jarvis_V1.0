import React from 'react';
import { AppState } from '../types';
import { GeminiIcon } from './Icons';

interface CoreInterfaceProps {
  appState: AppState;
}

const CoreInterface: React.FC<CoreInterfaceProps> = ({ appState }) => {
  const isThinking = appState === AppState.THINKING;
  const isSpeaking = appState === AppState.SPEAKING;

  const getStatusText = () => {
    switch (appState) {
      case AppState.THINKING: return "Analyzing";
      case AppState.SPEAKING: return "Synthesizing";
      case AppState.ERROR: return "Error";
      case AppState.LISTENING: return "Listening";
      case AppState.AWAITING_WAKE_WORD: return "Monitoring";
      default: return "Standby";
    }
  };

  const getStatusColor = () => {
    switch (appState) {
      case AppState.THINKING: return "text-yellow-400";
      case AppState.SPEAKING: return "text-purple-400";
      case AppState.ERROR: return "text-red-400";
      default: return "text-primary";
    }
  };
  
  const coreStateClasses = isThinking 
      ? '[--glow-color:theme(colors.yellow.400)]' 
      : isSpeaking 
          ? '[--glow-color:theme(colors.primary)] animate-core-breathing' 
          : '[--glow-color:theme(colors.primary)]';

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
        <div 
            className="relative w-[40vmin] h-[40vmin] max-w-[20rem] max-h-[20rem] cursor-default group core-container"
            role="img"
            aria-label="J.A.R.V.I.S. Core Interface"
        >
             <svg className="w-full h-full absolute inset-0" viewBox="0 0 200 200">
                <defs>
                    <filter id="core-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <radialGradient id="core-grad">
                        <stop offset="0%" stopColor="var(--glow-color)" stopOpacity="0.8"/>
                        <stop offset="70%" stopColor="var(--glow-color)" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="var(--glow-color)" stopOpacity="0"/>
                    </radialGradient>
                </defs>
                
                {/* Rotating Rings */}
                <g className={`transition-transform duration-500 ${isThinking ? 'scale-105' : 'scale-100'}`}>
                    <g className="animate-spin" style={{ animationDuration: isThinking ? '4s' : '22s' }}>
                        <circle cx="100" cy="100" r="95" stroke="var(--primary)" strokeOpacity="0.3" strokeWidth="0.5" fill="none" strokeDasharray="2 10" />
                    </g>
                    <g className="animate-spin" style={{ animationDirection: 'reverse', animationDuration: isThinking ? '3s' : '18s' }}>
                        <circle cx="100" cy="100" r="80" stroke="var(--primary)" strokeOpacity="0.4" strokeWidth="0.75" fill="none" strokeDasharray="5 15" />
                    </g>
                    <g className="animate-spin" style={{ animationDuration: isThinking ? '6s' : '30s' }}>
                        <circle cx="100" cy="100" r="65" stroke="var(--primary)" strokeOpacity="0.2" strokeWidth="0.5" fill="none" strokeDasharray="1 15" />
                    </g>
                </g>
                
                 {/* Central Element */}
                <g 
                   className={coreStateClasses}
                   filter="url(#core-glow)"
                >
                    <circle cx="100" cy="100" r="55" fill="url(#core-grad)" fillOpacity="0.7" />
                    <circle cx="100" cy="100" r="55" stroke="var(--glow-color)" strokeOpacity="0.8" strokeWidth="0.75" fill="none" />
                    <g transform="translate(75 75) scale(0.25)">
                       <GeminiIcon className="w-full h-full text-primary opacity-75 group-hover:opacity-100 transition-opacity" />
                    </g>
                </g>
            </svg>
        </div>
        <p className={`font-orbitron text-base md:text-lg mt-4 md:mt-8 uppercase tracking-widest transition-colors duration-300 ${getStatusColor()}`}>
            {getStatusText()}
        </p>
    </div>
  );
};

export default CoreInterface;