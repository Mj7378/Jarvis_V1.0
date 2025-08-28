import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { AppState } from '../types';
import SourceCitations from './SourceCitations';

interface ChatLogProps {
  history: ChatMessage[];
  appState: AppState;
}

const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  return (
    <>
      {text.split('\n').map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-orbitron text-primary font-bold mt-5 mb-2 pb-2 border-b border-primary-t-20">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-orbitron text-primary mt-4 mb-2">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-orbitron text-text-secondary mt-3 mb-1">{line.substring(4)}</h3>;
        }
        if (line.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-4 border-primary-t-50 pl-4 py-2 my-2 bg-panel/50 italic text-text-muted">
              {line.substring(2)}
            </blockquote>
          );
        }
        if (line.trim() !== '') {
            return <p key={index}>{line}</p>;
        }
        return null;
      })}
    </>
  );
};

const ThinkingBubble: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-2 text-yellow-400">
        <div className="w-full h-1 bg-yellow-400/20 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-yellow-400 rounded-full animate-scan-line"></div>
        </div>
        <p className="text-xs font-mono">ANALYZING...</p>
    </div>
);

const ChatLog: React.FC<ChatLogProps> = ({ history, appState }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, appState]);

  return (
    <div className="flex-1 overflow-y-auto p-3 styled-scrollbar">
      <div className="space-y-4">
        {history.map((message, index) => {
          const isLastMessage = index === history.length - 1;
          const isModel = message.role === 'model';
          const isLastModelMessage = isModel && isLastMessage;
          
          return (
            <div key={index} className={`flex flex-col animate-fade-in-fast ${isModel ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-md p-3 text-sm transition-all duration-300 ${
                  isModel
                    ? 'bg-gradient-to-br from-panel/80 to-panel/50 border-primary-t-20 text-text-primary'
                    : 'bg-gradient-to-br from-user-bubble/90 to-user-bubble/70 border-transparent text-white'
                } ${isLastModelMessage && appState === AppState.THINKING ? '!border-yellow-400/80 shadow-[0_0_15px] shadow-yellow-400/20' : ''}`}
                 style={{
                    clipPath: isModel 
                      ? 'polygon(0 var(--corner-clip-size), var(--corner-clip-size) 0, 100% 0, 100% 100%, 0 100%)' 
                      : 'polygon(0 0, calc(100% - var(--corner-clip-size)) 0, 100% var(--corner-clip-size), 100% 100%, 0 100%)'
                 }}
              >
                {message.imageUrl && (
                  <img 
                    src={message.imageUrl} 
                    alt="User upload" 
                    className="rounded-md mb-2 max-h-48"
                  />
                )}
                <div className="min-h-[1.5rem]">
                   {isModel ? (
                        <>
                            <FormattedMessage text={message.content} />
                            {isLastModelMessage && appState === AppState.THINKING && message.content && (
                                <span className="inline-block w-2 h-5 bg-primary align-bottom ml-1 animate-pulse" style={{ animationDuration: '1s' }}></span>
                            )}
                            {appState === AppState.THINKING && isLastModelMessage && !message.content && <ThinkingBubble />}
                        </>
                    ) : (
                       <p>{message.content}</p>
                    )}
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