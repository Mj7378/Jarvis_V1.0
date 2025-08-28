import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { AppState } from '../types';
import SourceCitations from './SourceCitations';
import { DoubleCheckIcon } from './Icons';

interface ChatLogProps {
  history: ChatMessage[];
  appState: AppState;
}

const FormattedMessage: React.FC<{ text: string }> = React.memo(({ text }) => {
  const sanitize = (htmlString: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = htmlString;
    temp.querySelectorAll('script, style, link, meta').forEach(el => el.remove());
    return temp.innerHTML;
  };

  return (
    <>
      {text.split('\n').map((line, index, arr) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-xl font-orbitron text-primary font-bold mt-3 mb-1 pb-1 border-b border-primary-t-20">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-lg font-orbitron text-primary mt-2 mb-1">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-base font-orbitron text-text-secondary mt-2 mb-1">{line.substring(4)}</h3>;
        }
        if (line.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-2 border-primary-t-50 pl-3 my-1 bg-black/10 italic text-text-muted">
              {line.substring(2)}
            </blockquote>
          );
        }
        // Don't add a break if it's the last line and it's empty
        if (line.trim() === '' && index === arr.length - 1) {
            return null;
        }
        return <div key={index} dangerouslySetInnerHTML={{ __html: sanitize(line) || ' ' }} />;
      })}
    </>
  );
});

const TypingIndicator: React.FC = () => (
    <div className="flex justify-start animate-fade-in-fast">
        <div className="p-2 px-4 rounded-2xl rounded-bl-md bg-panel">
            <div className="flex items-center gap-1 h-5">
                <span className="w-2 h-2 bg-text-muted rounded-full animate-pulse-dot [animation-delay:0s]"></span>
                <span className="w-2 h-2 bg-text-muted rounded-full animate-pulse-dot [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-text-muted rounded-full animate-pulse-dot [animation-delay:0.4s]"></span>
            </div>
        </div>
    </div>
);


const ChatLog: React.FC<ChatLogProps> = ({ history, appState }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, appState]);

  return (
    <div className="flex-1 overflow-y-auto p-4 styled-scrollbar">
      <div className="space-y-2">
        {history.map((message, index) => {
          const isModel = message.role === 'model';
          return (
            <div key={index} className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-md lg:max-w-2xl p-2 px-3 rounded-2xl animate-fade-in-fast ${
                  isModel
                    ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-text-primary rounded-bl-md shadow-lg shadow-black/20 border border-slate-700'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white rounded-br-md shadow-lg shadow-indigo-500/20'
                }`}
              >
                {message.imageUrl && (
                  <img 
                    src={message.imageUrl} 
                    alt="User content" 
                    className="rounded-lg mb-1 max-h-48"
                  />
                )}
                <div className="whitespace-pre-wrap break-words min-h-[1.25rem]">
                  <FormattedMessage text={message.content} />
                   {isModel && appState === AppState.THINKING && index === history.length - 1 && message.content && (
                       <span className="inline-block w-2 h-4 bg-primary align-bottom ml-1 animate-pulse" style={{ animationDuration: '1s' }}></span>
                   )}
                </div>
                 {message.sources && message.sources.length > 0 && (
                  <SourceCitations sources={message.sources} />
                )}
                <div className={`text-right text-xs mt-1 flex justify-end items-center gap-1.5 ${
                    isModel ? 'text-text-muted' : 'text-indigo-200'
                }`}>
                    <span>{message.timestamp}</span>
                    {!isModel && (
                        <DoubleCheckIcon className="w-4 h-4" />
                    )}
                </div>
              </div>
            </div>
          );
        })}
        {appState === AppState.THINKING && (!history.length || history[history.length - 1].role === 'user' || (history[history.length - 1].role === 'model' && history[history.length-1].content)) && <TypingIndicator />}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default ChatLog;