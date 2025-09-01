
import React from 'react';
import CoreInterface from './CoreInterface';
import SystemStatus from './SystemStatus';
import CommandPanel from './CommandPanel';
import { AppState } from '../types';

interface HudProps {
    appState: AppState;
    onSendMessage: (message: string) => void;
}

const Hud: React.FC<HudProps> = ({ appState, onSendMessage }) => {
  return (
    <div className="hud-container">
      <div className="hud-header">
        {/* Header content can go here */}
      </div>

      <div className="hud-left-panel">
        <SystemStatus />
      </div>

      <div className="hud-core-container">
        <CoreInterface appState={appState} />
      </div>

      <div className="hud-bottom-panel">
        <CommandPanel onSendMessage={onSendMessage} appState={appState} />
      </div>
    </div>
  );
};

export default Hud;
