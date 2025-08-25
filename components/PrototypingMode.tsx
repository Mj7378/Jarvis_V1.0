
import React, { useState, useEffect } from 'react';
import { generateCodePrototype } from '../services/geminiService';
import type { CodePrototype } from '../types';
import { PrototypingIcon } from './Icons';

interface PrototypingModeProps {
  task: string;
  language: string;
  onComplete: (prototype: CodePrototype) => void;
  onCancel: () => void;
}

const PrototypingMode: React.FC<PrototypingModeProps> = ({ task, language, onComplete, onCancel }) => {
  const [prototype, setPrototype] = useState<CodePrototype | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const getPrototype = async () => {
      try {
        const result = await generateCodePrototype(task, language);
        setPrototype(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    getPrototype();
  }, [task, language]);

  const handleCopy = () => {
    if (prototype?.code) {
      navigator.clipboard.writeText(prototype.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleLogToChat = () => {
      if(prototype) {
          onComplete(prototype);
      }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast">
        <div className="panel w-full max-w-2xl p-6 border-2 border-jarvis-cyan/50 shadow-2xl shadow-jarvis-cyan/20 text-center">
            <h1 className="font-orbitron text-2xl text-jarvis-cyan tracking-widest mb-6">PROTOTYPING ENGINE ONLINE</h1>
            <div className="flex justify-center items-center gap-3 text-yellow-400 font-mono animate-pulse">
                <svg className="w-6 h-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>COMPILING {language.toUpperCase()} MODULE...</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <div className="panel w-full max-w-6xl h-[90vh] flex flex-col p-6 border-2 border-jarvis-cyan/50 shadow-2xl shadow-jarvis-cyan/20">
        <div className="flex justify-between items-center mb-4">
            <h1 className="font-orbitron text-xl text-jarvis-cyan tracking-widest truncate pr-4 flex items-center gap-3">
                <PrototypingIcon className="w-6 h-6" />
                PROTOTYPE: {task}
            </h1>
            <div className="flex items-center gap-3">
                 <button onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 flex-shrink-0">
                    Close
                </button>
                <button onClick={handleLogToChat} className="px-4 py-2 rounded-md bg-jarvis-cyan/80 text-jarvis-dark hover:bg-jarvis-cyan flex-shrink-0">
                    Log to Chat
                </button>
            </div>
        </div>
        
        {error ? <p className="text-red-400 text-center p-4 bg-red-900/50 rounded-md">{error}</p>
        : prototype && (
            <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                <div className="bg-[#0c101d] border border-jarvis-border rounded-lg flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between bg-slate-900/70 p-2 border-b border-jarvis-border flex-shrink-0">
                        <span className="font-mono text-sm text-blue-300">prototype.{prototype.language.toLowerCase()}</span>
                         <button onClick={handleCopy} className="px-3 py-1 text-xs rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200">
                            {isCopied ? 'Copied ✓' : 'Copy Code'}
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto styled-scrollbar p-1">
                        <pre className="p-3"><code className={`language-${prototype.language.toLowerCase()} font-mono text-sm`}>{prototype.code}</code></pre>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-jarvis-border p-4 rounded-lg overflow-y-auto styled-scrollbar">
                    <h2 className="font-orbitron text-lg text-blue-300 mb-2">Explanation</h2>
                    <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{prototype.explanation}</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PrototypingMode;
