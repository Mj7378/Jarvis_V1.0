import React from 'react';
import type { AppError } from '../types';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: AppError | null;
}

const ErrorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);


const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, error }) => {
  if (!isOpen || !error) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-description"
    >
      <div 
        className="hud-panel w-full max-w-lg m-4 text-left"
        style={{'--primary-color-hex': '#ff4d4d', '--primary-color-rgb': '255, 77, 77'} as React.CSSProperties}
      >
        <div className="p-6">
            <div className="flex items-start gap-5">
                <div className="flex-shrink-0 mt-1">
                    <ErrorIcon />
                </div>
                <div className="flex-1">
                    <h2 id="error-modal-title" className="font-orbitron text-2xl text-red-400">
                        {error.title}
                    </h2>
                    <p id="error-modal-description" className="text-slate-300 mt-2 text-base leading-relaxed">
                        {error.message}
                    </p>
                    
                    {error.action && (
                    <div className="mt-5 p-3 bg-slate-900/50 border border-primary-t-20 rounded-lg">
                        <p className="font-orbitron text-sm text-yellow-300">Suggested Action</p>
                        <p className="text-slate-400 text-sm mt-1">{error.action}</p>
                    </div>
                    )}

                    {error.details && (
                    <details className="mt-4 text-xs">
                        <summary className="cursor-pointer text-slate-500 hover:text-slate-300 font-mono">SHOW TECHNICAL DETAILS</summary>
                        <div className="mt-2 p-3 bg-black/50 rounded font-mono text-slate-400 break-words max-h-32 overflow-y-auto styled-scrollbar">
                           <p><span className="font-bold text-slate-300">CODE:</span> {error.code}</p>
                           <p className="mt-1"><span className="font-bold text-slate-300">DETAILS:</span> {error.details}</p>
                        </div>
                    </details>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-8 py-2 rounded-md bg-red-600/80 text-white hover:bg-red-500/80 transition-colors font-bold uppercase tracking-wider"
                >
                    Dismiss
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;