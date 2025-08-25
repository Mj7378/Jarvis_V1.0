import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { AppState } from '../types';
import SourceCitations from './SourceCitations';

interface ChatLogProps {
  history: ChatMessage[];
  appState: AppState;
}

const BlinkingCursor: React.FC = () => {
    return <span className="inline-block w-2 h-5 bg-jarvis-cyan ml-1 animate-pulse" style={{ animationDuration: '1s' }}></span>;
}

const ChatLog: React.FC<ChatLogProps> = ({ history, appState }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, appState]);

  return (
    <div className="flex-1 overflow-y-auto p-1 styled-scrollbar">
      <div className="space-y-4">
        {history.map((message, index) => {
          const isLastMessage = index === history.length - 1;
          const isModel = message.role === 'model';
          const isStreaming = isModel && isLastMessage && (appState === AppState.THINKING || appState === AppState.SPEAKING);
          
          return (
            <div key={index} className={`flex flex-col animate-fade-in-fast ${isModel ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-md p-3 text-slate-200 text-sm md:text-base border ${
                  isModel
                    ? 'bg-slate-800/60 border-jarvis-border'
                    : 'bg-indigo-600/50 border-indigo-500/50'
                }`}
                 style={{
                    clipPath: isModel 
                      ? 'polygon(0 0, 100% 0, 100% 100%, 15px 100%, 0 85%)' 
                      : 'polygon(0 0, 100% 0, 100% 85%, calc(100% - 15px) 100%, 0 100%)'
                 }}
              >
                {message.imageUrl && (
                  <img 
                    src={message.imageUrl} 
                    alt="User upload" 
                    className="rounded-md mb-2 max-h-48"
                  />
                )}
                <div className="whitespace-pre-wrap">
                  {message.content}
                  {isStreaming && !message.content && <BlinkingCursor />}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <SourceCitations sources={message.sources} />
                )}
              </div>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default ChatLog;
