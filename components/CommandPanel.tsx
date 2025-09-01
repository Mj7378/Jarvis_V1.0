
import React, { useState } from 'react';
import { AppState } from '../types';

interface CommandPanelProps {
  onSendMessage: (message: string) => void;
  appState: AppState;
}

const CommandPanel: React.FC<CommandPanelProps> = ({ onSendMessage, appState }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="p-4 holographic-panel">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={appState === AppState.LISTENING ? "Listening..." : "Enter command..."}
          className="w-full bg-transparent border-b-2 border-primary-t-50 focus:border-primary focus:outline-none text-text-primary placeholder-text-muted transition-colors duration-300"
          disabled={appState === AppState.LISTENING || appState === AppState.THINKING}
        />
      </form>
    </div>
  );
};

export default CommandPanel;
