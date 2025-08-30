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
      case AppState.THINKING: return "Thinking";
      case AppState.SPEAKING: return "Speaking";
      case AppState.ERROR: return "Error";
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
  
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
        <div 
            className="relative w-[40vmin] h-[40vmin] max-w-[18rem] max-h-[18rem] cursor-default group core-container"
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
                        <stop offset="0%" stopColor="var(--glow-color)" stopOpacity="1"/>
                        <stop offset="70%" stopColor="var(--glow-color)" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="var(--glow-color)" stopOpacity="0"/>
                    </radialGradient>
                </defs>
                
                {/* Base Rings */}
                <circle cx="100" cy="100" r="98" className="stroke-primary-t-20" strokeWidth="0.5" fill="none" />
                <circle cx="100" cy="100" r="85" className="stroke-primary-t-20" strokeWidth="0.25" fill="none" />
                
                {/* Rotating Rings */}
                <g className="core-ring" style={{ animationDuration: '22s' }}>
                    <circle cx="100" cy="100" r="90" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" fill="none" strokeDasharray="10 15" />
                </g>
                <g className="core-ring-rev" style={{ animationDuration: '18s' }}>
                    <circle cx="100" cy="100" r="78" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.75" fill="none" strokeDasharray="2 8 10 8" />
                </g>
                 <g className="core-ring" style={{ animationDuration: '30s' }}>
                    <circle cx="100" cy="100" r="65" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.5" fill="none" strokeDasharray="1 10" />
                </g>

                {/* State-dependent effects */}
                {isThinking && (
                    <g style={{ '--glow-color': '#fbbf24' } as React.CSSProperties}>
                        <circle cx="100" cy="100" r="95" stroke="url(#core-grad)" strokeWidth="1.5" fill="none" className="animate-pulse-strong" />
                         {/* Data stream effect */}
                        <g>
                           {[...Array(20)].map((_, i) => (
                               <circle key={i} cx="100" cy="100" r={45 + (i % 4) * 12} 
                                   stroke="var(--glow-color)" strokeWidth="1" fill="none" strokeDasharray="1 15" 
                                   strokeDashoffset={i * 20}
                                   className="core-ring-fast"
                                   style={{ animationDuration: `${2 + (i%5)}s`, opacity: 0.1 + (i%3)*0.1 }}
                                />
                           ))}
                        </g>
                    </g>
                )}
                {isSpeaking && (
                     <g style={{ '--glow-color': '#ffffff'} as React.CSSProperties}>
                        <circle cx="100" cy="100" r="95" stroke="url(#core-grad)" strokeWidth="2" fill="none" className="animate-pulse-strong" style={{animationDuration: '1.5s'}}/>
                    </g>
                )}

                 {/* Central Element */}
                <g 
                   className={(isThinking || isSpeaking) ? "animate-pulse-strong" : ""} 
                   style={{ 
                       '--glow-color': isThinking ? '#fbbf24' : isSpeaking ? '#ffffff' : 'var(--primary-color-hex)' 
                   } as React.CSSProperties}
                   filter="url(#core-glow)"
                >
                    <circle cx="100" cy="100" r="50" fill="url(#core-grad)" fillOpacity="0.5" />
                    <circle cx="100" cy="100" r="50" stroke="currentColor" strokeOpacity="0.8" strokeWidth="0.75" fill="none" />
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