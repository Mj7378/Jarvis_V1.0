import React, { useState } from 'react';
import { AppState } from '../types';
import { MicrophoneIcon } from './Icons';

interface UserInputProps {
  onSendMessage: (message: string) => void;
  onToggleListening: () => void;
  appState: AppState;
  isListening: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onSendMessage, onToggleListening, appState, isListening }) => {
  const [inputValue, setInputValue] = useState('');

  const isInputDisabled = appState === AppState.THINKING || appState === AppState.SPEAKING;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };
  
  const getMicButtonClass = () => {
    if (isListening) {
        return 'bg-red-500/80 text-white animate-pulse';
    }
    if (isInputDisabled) {
        return 'bg-slate-700/50 text-slate-500 cursor-not-allowed';
    }
    return 'bg-primary-t-50 text-primary hover:bg-primary hover:text-jarvis-dark';
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex items-center gap-2 md:gap-4 px-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={isListening ? "Listening..." : "Enter command or press mic..."}
        disabled={isInputDisabled || isListening}
        className="flex-grow bg-transparent border-none focus:ring-0 p-2 text-base md:text-lg text-slate-200 placeholder:text-slate-500 disabled:opacity-60 transition-opacity"
        aria-label="User command input"
      />
      <button
        type="button"
        onClick={onToggleListening}
        disabled={isInputDisabled}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 ${getMicButtonClass()}`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        <MicrophoneIcon className="w-6 h-6 md:w-7 md:h-7" />
      </button>
    </form>
  );
};

export default UserInput;