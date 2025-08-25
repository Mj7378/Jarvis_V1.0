import React from 'react';
import { AppState } from '../types';
import AudioVisualizer from './AudioVisualizer';
import SystemStatus from './SystemStatus';

interface LeftColumnProps {
    appState: AppState;
    error: string;
    audioStream: MediaStream | null;
    startListening: () => void;
}

const Header: React.FC = () => (
    <header className="text-center p-4">
        <h1 className="font-orbitron text-3xl text-jarvis-cyan tracking-widest">
            J.A.R.V.I.S
        </h1>
        <p className="text-sm text-blue-300">AI Assistant Active</p>
    </header>
);

const VoiceInterface: React.FC<Omit<LeftColumnProps, 'error'>> = ({ appState, audioStream, startListening }) => {
    const isListening = appState === AppState.LISTENING;
    const isThinking = appState === AppState.THINKING;
    const isSpeaking = appState === AppState.SPEAKING;
    const isBusy = isThinking || isSpeaking;

    const getStatusText = () => {
        switch (appState) {
            case AppState.LISTENING: return "Listening...";
            case AppState.THINKING: return "Thinking...";
            case AppState.SPEAKING: return "Responding...";
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
            default: return "text-slate-400";
        }
    };

    const renderVisualState = () => {
        switch (appState) {
            case AppState.LISTENING:
                return (
                    <div className="w-40 h-40 relative flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-jarvis-cyan/30 animate-ring-pulse" style={{ animationDelay: '0s' }}></div>
                        <div className="absolute inset-0 rounded-full border-2 border-jarvis-cyan/30 animate-ring-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <div className="absolute inset-0 rounded-full border-2 border-jarvis-cyan/30 animate-ring-pulse" style={{ animationDelay: '1s' }}></div>
                        {audioStream && <AudioVisualizer stream={audioStream} />}
                    </div>
                );
            case AppState.THINKING:
                return (
                    <div className="w-40 h-40 relative flex items-center justify-center">
                        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="48" stroke="rgba(0,255,255,0.2)" strokeWidth="1" fill="none" />
                        </svg>
                        <svg className="absolute w-3/4 h-3/4 animate-arc-rotate" viewBox="0 0 100 100" style={{transformOrigin: 'center'}}>
                             <path d="M 50,50 m -40,0 a 40,40 0 1,1 80,0" stroke="rgba(0,255,255,0.6)" strokeWidth="3" fill="none" strokeDasharray="125.6 125.6" />
                        </svg>
                         <svg className="absolute w-1/2 h-1/2 animate-arc-rotate-reverse" viewBox="0 0 100 100" style={{transformOrigin: 'center'}}>
                             <path d="M 50,50 m 0,-30 a 30,30 0 1,1 0,60" stroke="rgba(0,255,255,0.8)" strokeWidth="2" fill="none" strokeDasharray="47.1 47.1" />
                        </svg>
                        <svg className="w-1/4 h-1/4 text-jarvis-cyan animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.343 3.94c.09-.542.56-1.007 1.11-1.227l.956-.348a1.125 1.125 0 011.085.395l.811 1.216M10.343 3.94a1.125 1.125 0 00-1.085.395l-.81 1.217m0 0a1.125 1.125 0 01-1.848.332l-.515-.386a1.125 1.125 0 00-1.423.23l-2.133 2.844a1.125 1.125 0 00.23 1.423l.386.515a1.125 1.125 0 01-.332 1.848l-1.217.81a1.125 1.125 0 00-.395 1.085l.348.956c.22.55.685 1.018 1.227 1.11l2.844 2.133a1.125 1.125 0 001.423-.23l.515-.386a1.125 1.125 0 011.848-.332l.81 1.217a1.125 1.125 0 001.085.395l.956-.348c.55-.22 1.018-.685 1.11-1.227l2.133-2.844a1.125 1.125 0 00-.23-1.423l-.386-.515a1.125 1.125 0 01.332-1.848l1.217-.81a1.125 1.125 0 00.395-1.085l-.348-.956a1.125 1.125 0 00-1.227-1.11l-2.844-2.133a1.125 1.125 0 00-1.423.23l-.515-.386a1.125 1.125 0 01-1.848.332l-.81-1.217z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
                        </svg>
                    </div>
                );
            case AppState.SPEAKING:
            default: // IDLE, ERROR, VISION
                return (
                     <button 
                        onClick={startListening}
                        disabled={isBusy}
                        className={`w-32 h-32 rounded-full flex items-center justify-center border-2 transition-all duration-300 'border-jarvis-border bg-slate-800/50 hover:border-jarvis-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-jarvis-border`}
                    >
                        <svg className={`w-12 h-12 ${isSpeaking ? 'text-purple-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                    </button>
                );
        }
    };

    return (
        <div className="panel flex-1 flex flex-col p-4">
            <h2 className="panel-title">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                <span>Voice Interface</span>
                <div className="ml-auto flex items-center space-x-2">
                    <span className={`text-sm ${getStatusColor()}`}>{getStatusText()}</span>
                    <span className={`w-3 h-3 rounded-full ${getStatusColor().replace('text', 'bg')}`}></span>
                </div>
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                 <div className="h-40 w-40 flex items-center justify-center">
                    {renderVisualState()}
                </div>
                <p className="text-sm text-slate-400 text-center min-h-[40px]">
                   {isListening ? "Say your command..." : isThinking ? "Processing..." : isSpeaking ? "Responding..." : "Click icon to activate voice"}
                </p>
            </div>
        </div>
    );
};


export const LeftColumn: React.FC<LeftColumnProps> = (props) => (
    <aside className="flex flex-col h-full space-y-4">
        <Header />
        <VoiceInterface {...props} />
        <SystemStatus error={props.error} />
    </aside>
);