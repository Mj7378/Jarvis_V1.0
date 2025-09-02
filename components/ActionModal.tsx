import React, { useState, useEffect, useCallback } from 'react';
import { CloseIcon } from './Icons';

export interface InputConfig {
  id: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder?: string;
}

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  inputs: InputConfig[];
  onSubmit: (formData: Record<string, string>) => void;
  submitLabel?: string;
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, title, inputs, onSubmit, submitLabel = 'Submit' }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset form data when modal opens for new inputs
    if (isOpen) {
      const initialData = inputs.reduce((acc, input) => {
        acc[input.id] = '';
        return acc;
      }, {} as Record<string, string>);
      setFormData(initialData);
    }
  }, [isOpen, inputs]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose(); 
  };
  
  const canSubmit = inputs.every(input => formData[input.id] && formData[input.id].trim() !== '');

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
      <div 
        className="holographic-panel w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <form onSubmit={handleSubmit} className="p-4">
          <h2 id="modal-title" className="panel-title text-secondary">{title}</h2>
          <div className="space-y-4">
            {inputs.map(input => (
              <div key={input.id}>
                <label htmlFor={input.id} className="block text-sm font-medium text-slate-300 mb-1">{input.label}</label>
                {input.type === 'textarea' ? (
                  <textarea
                    id={input.id}
                    value={formData[input.id] || ''}
                    onChange={handleInputChange}
                    placeholder={input.placeholder}
                    className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200"
                    rows={4}
                    required
                  />
                ) : (
                  <input
                    type={input.type}
                    id={input.id}
                    value={formData[input.id] || ''}
                    onChange={handleInputChange}
                    placeholder={input.placeholder}
                    className="w-full bg-slate-800/80 border border-primary-t-20 rounded-md p-2 focus:ring-2 ring-primary focus:outline-none text-slate-200"
                    required
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 transition-all duration-200 transform hover:scale-105 active:scale-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 rounded-md bg-primary-t-80 text-background hover:bg-primary disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-100"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionModal;

interface NotificationToastProps {
  id: string;
  title: string;
  message: string;
  icon?: React.ReactNode;
  onClose: (id: string) => void;
  duration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ id, title, message, icon, onClose, duration = 10000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  }, [id, onClose]);

  useEffect(() => {
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [duration, handleClose]);


  return (
    <div className={`holographic-panel w-full max-w-sm !p-3 pointer-events-auto ${isExiting ? 'animate-pop-out-top-right' : 'animate-pop-in-top-right'}`}>
        <div className="flex items-start gap-3">
            <div className="mt-1 flex-shrink-0">
                {icon || <svg className="w-6 h-6 text-primary animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
            </div>
            <div className="flex-1">
                <p className="font-orbitron text-base text-text-secondary">{title}</p>
                <p className="mt-1 text-sm text-text-primary">{message}</p>
            </div>
            <div className="flex-shrink-0">
                <button onClick={handleClose} className="p-1 rounded-full hover:bg-primary/20 text-text-muted hover:text-primary transition-all duration-200">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
  );
};