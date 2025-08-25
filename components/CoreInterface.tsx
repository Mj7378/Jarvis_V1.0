import React from 'react';
import { AppState } from '../types';
import AudioVisualizer from './AudioVisualizer';

interface CoreInterfaceProps {
  appState: AppState;
  onClick: () => void;
  audioStream: MediaStream | null;
}

const CoreInterface: React.FC<CoreInterfaceProps> = ({ appState, onClick, audioStream }) => {
  const isListening = appState === AppState.LISTENING;
  const isThinking = appState === AppState.THINKING;
  const isSpeaking = appState === AppState.SPEAKING;

  const getStatusText = () => {
    switch (appState) {
      case AppState.LISTENING: return "Listening";
      case AppState.THINKING: return "Thinking";
      case AppState.SPEAKING: return "Responding";
      case AppState.ERROR: return "Error";
      default: return "Standby";
    }
  };

  const getStatusColor = () => {
    switch (appState) {
      case AppState.LISTENING: return "text-green-400";
      case AppState.THINKING: return "text-yellow-400";
      case AppState.SPEAKING: return "text-purple-400";
      case AppState.ERROR: return "text-red-400";
      default: return "text-jarvis-cyan";
    }
  };

  const animationClass = isThinking ? 'animate-spin-medium' : 'animate-spin-slow';
  const reverseAnimationClass = isThinking ? 'animate-spin-fast' : 'animate-spin-medium';
  
  return (
    <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-[400px] h-[400px]"
        style={{ top: 'calc(50% - 40px)' }}
    >
        <div 
            className="relative w-72 h-72 cursor-pointer group" 
            onClick={onClick}
            role="button"
            aria-label="Activate J.A.R.V.I.S."
        >
            <svg className="absolute w-full h-full" viewBox="0 0 100 100" style={{transformOrigin: 'center'}}>
                <circle cx="50" cy="50" r="48" stroke="rgba(0,255,255,0.1)" strokeWidth="0.5" fill="none" />
                <circle cx="50" cy="50" r="42" stroke="rgba(0,255,255,0.2)" strokeWidth="0.5" fill="none" />
            </svg>
             <svg className={`absolute w-full h-full ${animationClass}`} viewBox="0 0 100 100" style={{transformOrigin: 'center', animationDirection: 'reverse'}}>
                 <path d="M 50,50 m -45,0 a 45,45 0 1,1 90,0" stroke="rgba(0,255,255,0.4)" strokeWidth="1" fill="none" strokeDasharray="141.3 141.3" />
            </svg>
             <svg className={`absolute w-[88%] h-[88%] left-[6%] top-[6%] ${reverseAnimationClass}`} viewBox="0 0 100 100" style={{transformOrigin: 'center', animationDirection: 'normal'}}>
                 <path d="M 50,50 m -40,0 a 40,40 0 1,1 80,0" stroke="rgba(0,255,255,0.6)" strokeWidth="0.75" fill="none" strokeDasharray="10 15" />
            </svg>

            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isListening ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}>
                {audioStream && <AudioVisualizer stream={audioStream} />}
            </div>

            <div 
                className={`absolute inset-0 flex items-center justify-center rounded-full transition-all duration-300
                    ${isSpeaking ? 'bg-purple-500/20 shadow-[0_0_30px] shadow-purple-500' : ''}
                    ${isThinking ? 'bg-yellow-500/20 shadow-[0_0_30px] shadow-yellow-500' : ''}
                    ${!isSpeaking && !isThinking ? 'group-hover:bg-jarvis-cyan/10' : ''}
                `}
            >
                <div className={`w-24 h-24 rounded-full bg-slate-900/50 flex items-center justify-center border border-jarvis-border transition-all duration-300 group-hover:border-jarvis-cyan/80
                    ${isSpeaking ? 'animate-pulse border-purple-500' : ''}
                    ${isThinking ? 'border-yellow-500' : ''}
                `}>
                     <svg className="w-10 h-10 text-slate-400 group-hover:text-jarvis-cyan transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                </div>
            </div>
        </div>
        <p className={`font-orbitron text-lg mt-8 uppercase tracking-widest transition-colors duration-300 ${getStatusColor()}`}>
            {getStatusText()}
        </p>
    </div>
  );
};

export default CoreInterface;
