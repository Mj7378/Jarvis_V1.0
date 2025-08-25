
import React from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
}

const ErrorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);


const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, error }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-description"
    >
      <div 
        className="hud-panel w-full max-w-md m-4 text-center"
      >
        <div className="p-6 flex flex-col items-center">
          <ErrorIcon />
          <h2 id="error-modal-title" className="font-orbitron text-2xl text-red-400 mt-4">SYSTEM ANOMALY</h2>
          <p id="error-modal-description" className="text-slate-300 mt-2 mb-6">
            {error}
          </p>
          <button
            onClick={onClose}
            className="px-8 py-2 rounded-md bg-red-600/80 text-white hover:bg-red-500/80 transition-colors font-bold uppercase tracking-wider"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
