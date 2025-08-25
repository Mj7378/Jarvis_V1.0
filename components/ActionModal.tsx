import React, { useState, useEffect } from 'react';

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
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
      <div 
        className="panel w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <form onSubmit={handleSubmit} className="p-4">
          <h2 id="modal-title" className="panel-title">{title}</h2>
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
                    className="w-full bg-slate-800/80 border border-jarvis-border rounded-md p-2 focus:ring-2 focus:ring-jarvis-cyan focus:outline-none text-slate-200"
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
                    className="w-full bg-slate-800/80 border border-jarvis-border rounded-md p-2 focus:ring-2 focus:ring-jarvis-cyan focus:outline-none text-slate-200"
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
              className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 rounded-md bg-jarvis-cyan/80 text-jarvis-dark hover:bg-jarvis-cyan disabled:opacity-50 transition-colors"
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
