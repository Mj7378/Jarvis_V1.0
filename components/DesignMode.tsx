import React, { useState, useEffect, useRef } from 'react';
import { aiOrchestrator } from '../services/aiOrchestrator';
import { GenerateImageIcon, SendIcon } from './Icons';

interface DesignModeProps {
  prompt: string;
  onComplete: (prompt: string, imageDataUrl: string) => void;
  onCancel: () => void;
}

const ImageStudio: React.FC<DesignModeProps> = ({ prompt, onComplete, onCancel }) => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [history, setHistory] = useState<string[]>([prompt]);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    const getInitialDesign = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await aiOrchestrator.generateImage(prompt);
        setCurrentImage(result);
      } catch (err: any) {
        setError(err.appError?.message || err.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    getInitialDesign();
  }, [prompt]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || !currentImage || isEditing || isLoading) return;

    setIsEditing(true);
    setError('');
    const base64 = currentImage.split(',')[1];

    try {
      const result = await aiOrchestrator.editImage(editPrompt, base64);
      setCurrentImage(result);
      setHistory(prev => [...prev, editPrompt]);
      setEditPrompt('');
    } catch (err: any) {
      setError(err.appError?.message || err.message || 'An unknown error occurred.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleLogToChat = () => {
    if (currentImage) {
      onComplete(history.join('; '), currentImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <div className="holographic-panel w-full max-w-4xl h-[90vh] flex flex-col p-6 border-2 border-primary-t-50 shadow-2xl shadow-primary/20">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-orbitron text-xl text-primary tracking-widest truncate pr-4 flex items-center gap-3">
            <GenerateImageIcon className="w-6 h-6" />
            Image Studio
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 flex-shrink-0 transition-all duration-200 transform hover:scale-105 active:scale-100">
              Close
            </button>
            <button onClick={handleLogToChat} disabled={!currentImage} className="px-4 py-2 rounded-md bg-primary-t-80 text-background hover:bg-primary flex-shrink-0 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-100">
              Log to Chat
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
          <div className="flex-1 md:w-2/3 bg-slate-900/50 border border-primary-t-20 rounded-lg flex items-center justify-center overflow-hidden relative">
            {(isLoading || isEditing) && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center h-full text-slate-400 z-10">
                <svg className="w-12 h-12 animate-spin text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="font-orbitron">{isLoading ? 'VISUALIZING CONCEPT...' : 'APPLYING MODIFICATIONS...'}</p>
              </div>
            )}
            {error && !isEditing && <p className="text-red-400 text-center p-4 bg-red-900/50 rounded-md z-10">{error}</p>}
            {currentImage && (
              <img src={currentImage} alt={history.join('; ')} className="max-w-full max-h-full object-contain" />
            )}
          </div>

          <div className="md:w-1/3 flex flex-col gap-4">
            <div ref={historyRef} className="flex-1 bg-panel/50 border border-primary-t-20 rounded-lg p-3 overflow-y-auto styled-scrollbar">
              <h3 className="font-orbitron text-sm text-text-secondary mb-2 border-b border-primary-t-20 pb-2">Prompt History</h3>
              <ol className="list-decimal list-inside text-sm space-y-2">
                {history.map((h, i) => (
                  <li key={i} className="text-slate-300">{h}</li>
                ))}
              </ol>
            </div>
            <form onSubmit={handleEdit} className="bg-panel/50 border border-primary-t-20 rounded-lg p-3">
              <label htmlFor="edit-prompt" className="font-orbitron text-sm text-text-secondary mb-2 block">Edit Command</label>
              <div className="flex gap-2">
                <input
                  id="edit-prompt"
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g., add a hat"
                  className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200"
                />
                <button type="submit" disabled={!editPrompt.trim() || isEditing || isLoading} className="p-2 rounded-md bg-primary-t-80 text-background hover:bg-primary disabled:opacity-50">
                  <SendIcon className="w-6 h-6"/>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageStudio;