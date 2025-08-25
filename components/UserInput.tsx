
import React from 'react';
import { AppState } from '../types';

interface UserInputProps {
  onClick: () => void;
  appState: AppState;
}

const UserInput: React.FC<UserInputProps> = ({ onClick, appState }) => {
  const getOrbStateClasses = () => {
    switch (appState) {
      case AppState.LISTENING:
        return 'bg-green-500/50 shadow-green-400 animate-pulse-strong';
      case AppState.THINKING:
        return 'bg-yellow-500/50 shadow-yellow-400 animate-spin-slow';
      case AppState.SPEAKING:
          return 'bg-purple-500/50 shadow-purple-400 animate-pulse';
      case AppState.ERROR:
        return 'bg-red-500/50 shadow-red-400';
      case AppState.IDLE:
      default:
        return 'bg-cyan-500/50 shadow-cyan-400 hover:bg-cyan-400/60 hover:shadow-cyan-300';
    }
  };

  const Icon = () => {
    switch (appState) {
      case AppState.THINKING:
        return (
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.343 3.94c.09-.542.56-1.007 1.11-1.227l.956-.348a1.125 1.125 0 011.085.395l.811 1.216M10.343 3.94a1.125 1.125 0 00-1.085.395l-.81 1.217m0 0a1.125 1.125 0 01-1.848.332l-.515-.386a1.125 1.125 0 00-1.423.23l-2.133 2.844a1.125 1.125 0 00.23 1.423l.386.515a1.125 1.125 0 01-.332 1.848l-1.217.81a1.125 1.125 0 00-.395 1.085l.348.956c.22.55.685 1.018 1.227 1.11l2.844 2.133a1.125 1.125 0 001.423-.23l.515-.386a1.125 1.125 0 011.848-.332l.81 1.217a1.125 1.125 0 001.085.395l.956-.348c.55-.22 1.018-.685 1.11-1.227l2.133-2.844a1.125 1.125 0 00-.23-1.423l-.386-.515a1.125 1.125 0 01.332-1.848l1.217-.81a1.125 1.125 0 00.395-1.085l-.348-.956a1.125 1.125 0 00-1.227-1.11l-2.844-2.133a1.125 1.125 0 00-1.423.23l-.515.386a1.125 1.125 0 01-1.848.332l-.81-1.217z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={appState === AppState.THINKING || appState === AppState.SPEAKING}
      className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out border-2 border-cyan-300/50 disabled:cursor-not-allowed
      ${getOrbStateClasses()}`}
      style={{
          boxShadow: `0 0 25px var(--tw-shadow-color)`
      }}
    >
        <div className="absolute inset-0 rounded-full bg-black/20"></div>
        <div className="text-cyan-100 z-10">
            <Icon />
        </div>
    </button>
  );
};

export default UserInput;
