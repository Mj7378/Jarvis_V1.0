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
        return 'bg-disabled-bg text-disabled-text cursor-not-allowed';
    }
    return 'bg-primary-t-50 text-primary hover:bg-primary hover:text-background';
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex items-center gap-2 md:gap-4 px-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={isListening ? "Listening..." : "Enter command or press mic..."}
        disabled={isInputDisabled || isListening}
        className="flex-grow bg-transparent border-none focus:ring-0 p-2 text-text-primary placeholder:text-text-muted disabled:opacity-60 transition-opacity user-input-field"
        aria-label="User command input"
      />
      <button
        type="button"
        onClick={onToggleListening}
        disabled={isInputDisabled}
        className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 user-input-mic-button ${getMicButtonClass()}`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        <MicrophoneIcon />
      </button>
    </form>
  );
};

export default UserInput;