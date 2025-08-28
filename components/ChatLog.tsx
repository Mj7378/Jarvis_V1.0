import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';
import { AppState } from '../types';
import SourceCitations from './SourceCitations';

interface ChatLogProps {
  history: ChatMessage[];
  appState: AppState;
  speechRate: number;
}

const TypewriterEffect: React.FC<{ text: string; speechRate: number; }> = ({ text, speechRate }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (displayedText.length < text.length) {
      // A base speed of 25ms at a rate of 1.0.
      // Higher rate = faster speech = faster typing = smaller delay.
      const typingSpeed = Math.max(10, 25 / speechRate); // Set a floor of 10ms to prevent it being too fast to see.

      const timeoutId = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, typingSpeed);
      return () => clearTimeout(timeoutId);
    }
  }, [displayedText, text, speechRate]);

  const showCursor = displayedText.length < text.length;

  return (
    <>
      {displayedText}
      {showCursor && <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse" style={{ animationDuration: '1s' }}></span>}
    </>
  );
};


const ThinkingBubble: React.FC = () => (
    <div className="flex items-center space-x-1.5 h-full">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0s', animationDuration: '1.2s' }}></div>
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s', animationDuration: '1.2s' }}></div>
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s', animationDuration: '1.2s' }}></div>
    </div>
);

const ChatLog: React.FC<ChatLogProps> = ({ history, appState, speechRate }) => {
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
          const isLastModelMessage = isModel && isLastMessage;
          
          return (
            <div key={index} className={`flex flex-col animate-fade-in-fast ${isModel ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-md p-3 text-sm md:text-base border transition-all duration-300 ${
                  isModel
                    ? 'bg-model-bubble border-primary-t-20 text-text-primary'
                    : 'bg-user-bubble border-transparent text-white'
                } ${isLastModelMessage && appState === AppState.THINKING ? '!border-yellow-400/80 shadow-[0_0_15px] shadow-yellow-400/20' : ''}`}
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
                <div className="whitespace-pre-wrap min-h-[1.5rem] flex items-center">
                   {isLastModelMessage ? (
                        <TypewriterEffect text={message.content} speechRate={speechRate} />
                    ) : (
                        message.content
                    )}
                  {appState === AppState.THINKING && isLastModelMessage && !message.content && <ThinkingBubble />}
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