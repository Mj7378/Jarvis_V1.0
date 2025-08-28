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

  const animationClass = isThinking || isSpeaking ? 'animate-spin-medium' : 'animate-spin-slow';
  const reverseAnimationClass = isThinking || isSpeaking ? 'animate-spin-fast' : 'animate-spin-medium';
  
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
        <div 
            className="relative w-48 h-48 sm:w-60 sm:h-60 lg:w-72 lg:h-72 cursor-default group" 
            role="img"
            aria-label="J.A.R.V.I.S. Core Interface"
        >
            <svg className="absolute w-full h-full" viewBox="0 0 100 100" style={{transformOrigin: 'center'}}>
                <circle cx="50" cy="50" r="48" className="stroke-primary-t-20" strokeWidth="0.5" fill="none" />
                <circle cx="50" cy="50" r="42" className="stroke-primary-t-20" strokeWidth="0.5" fill="none" />
            </svg>
             <svg className={`absolute w-full h-full ${animationClass}`} viewBox="0 0 100 100" style={{transformOrigin: 'center', animationDirection: 'reverse'}}>
                 <path d="M 50,50 m -45,0 a 45,45 0 1,1 90,0" className="stroke-primary" style={{strokeOpacity: 0.4}} strokeWidth="1" fill="none" strokeDasharray="141.3 141.3" />
            </svg>
             <svg className={`absolute w-[88%] h-[88%] left-[6%] top-[6%] ${reverseAnimationClass}`} viewBox="0 0 100 100" style={{transformOrigin: 'center', animationDirection: 'normal'}}>
                 <path d="M 50,50 m -40,0 a 40,40 0 1,1 80,0" className="stroke-primary" style={{strokeOpacity: 0.6}} strokeWidth="0.75" fill="none" strokeDasharray="10 15" />
            </svg>

            <div 
                className={`absolute inset-0 flex items-center justify-center rounded-full transition-all duration-300
                    ${isThinking ? 'bg-yellow-500/20 shadow-[0_0_30px] shadow-yellow-500' : ''}
                    ${isSpeaking ? 'bg-purple-500/20 shadow-[0_0_45px] shadow-purple-500/80 animate-pulse-speak shadow-primary' : ''}
                    ${!isThinking && !isSpeaking ? 'group-hover:bg-primary-t-20' : ''}
                `}
            >
                <div className={`w-1/3 h-1/3 rounded-full bg-background/50 flex items-center justify-center border border-primary-t-20 transition-all duration-300 group-hover:border-primary-t-70 relative overflow-hidden
                    ${isThinking ? 'border-yellow-500' : ''}
                    ${isSpeaking ? 'border-purple-500' : ''}
                `}>
                     {(isThinking || isSpeaking) && (
                        <div 
                            className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-transparent animate-scan-line"
                            style={{ 
                                '--tw-gradient-via': isThinking ? 'rgba(250, 204, 21, 0.5)' : 'rgba(192, 132, 252, 0.5)',
                             } as React.CSSProperties}
                        ></div>
                     )}
                     <GeminiIcon className="w-1/2 h-1/2 text-text-muted group-hover:text-primary transition-colors" />
                </div>
            </div>
        </div>
        <p className={`font-orbitron text-base md:text-lg mt-4 md:mt-8 uppercase tracking-widest transition-colors duration-300 ${getStatusColor()}`}>
            {getStatusText()}
        </p>
    </div>
  );
};

export default CoreInterface;