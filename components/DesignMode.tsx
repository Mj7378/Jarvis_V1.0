import React, { useState, useEffect } from 'react';
import { generateImage } from '../services/geminiService';
import { GenerateImageIcon } from './Icons';

interface DesignModeProps {
  prompt: string;
  onComplete: (prompt: string, imageDataUrl: string) => void;
  onCancel: () => void;
}

const DesignMode: React.FC<DesignModeProps> = ({ prompt, onComplete, onCancel }) => {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getDesign = async () => {
      try {
        const result = await generateImage(prompt);
        setImageDataUrl(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    getDesign();
  }, [prompt]);

  const handleLogToChat = () => {
      if(imageDataUrl) {
          onComplete(prompt, imageDataUrl);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <div className="panel w-full max-w-4xl h-[90vh] flex flex-col p-6 border-2 border-jarvis-cyan/50 shadow-2xl shadow-jarvis-cyan/20">
        <div className="flex justify-between items-center mb-4">
            <h1 className="font-orbitron text-xl text-jarvis-cyan tracking-widest truncate pr-4 flex items-center gap-3">
                <GenerateImageIcon className="w-6 h-6" />
                DESIGN MODE: {prompt}
            </h1>
            <div className="flex items-center gap-3">
                 <button onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 flex-shrink-0">
                    Close
                </button>
                <button onClick={handleLogToChat} disabled={!imageDataUrl} className="px-4 py-2 rounded-md bg-jarvis-cyan/80 text-jarvis-dark hover:bg-jarvis-cyan flex-shrink-0 disabled:opacity-50">
                    Log to Chat
                </button>
            </div>
        </div>
        
        <div className="flex-1 bg-slate-900/50 border border-jarvis-border rounded-lg flex items-center justify-center overflow-hidden">
            {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                   <svg className="w-12 h-12 animate-spin text-jarvis-cyan mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-orbitron">VISUALIZING CONCEPT...</p>
                    <p className="text-sm">Engaging neural render farm.</p>
                </div>
            )}
            {error && <p className="text-red-400 text-center p-4 bg-red-900/50 rounded-md">{error}</p>}
            {imageDataUrl && (
                <img src={imageDataUrl} alt={prompt} className="max-w-full max-h-full object-contain" />
            )}
        </div>
      </div>
    </div>
  );
};

export default DesignMode;
