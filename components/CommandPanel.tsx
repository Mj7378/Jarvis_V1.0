import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { MicrophoneIcon, SendIcon, SmileyIcon, PaperclipIcon } from './Icons';
import EmojiPicker from './EmojiPicker';
import AttachmentMenu from './AttachmentMenu';

interface CommandPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  onToggleListening: () => void;
  appState: AppState;
  isListening: boolean;
  onCameraClick: () => void;
  onGalleryClick: () => void;
  onDocumentClick: () => void;
  onAudioClick: () => void;
  onLocationClick: () => void;
  onDesignModeClick: () => void;
  onSimulationModeClick: () => void;
}

const CommandPanel: React.FC<CommandPanelProps> = (props) => {
  const { isOpen, onClose, onSendMessage, onToggleListening, appState, isListening } = props;
  const [textContent, setTextContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isInputDisabled = appState === AppState.THINKING || appState === AppState.SPEAKING;
  const showSendButton = textContent.trim().length > 0;

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
        setTimeout(() => textareaRef.current?.focus(), 100); // Small delay for animation
    } else {
        // Reset state when closing
        setTextContent('');
        setShowEmojiPicker(false);
        setIsAttachmentMenuOpen(false);
    }
  }, [isOpen]);

  // Auto-sizing textarea logic
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to calculate new scrollHeight
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(128, scrollHeight); // Max height of 128px
      textarea.style.height = `${newHeight}px`;
    }
  }, [textContent]);
  
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showSendButton && !isInputDisabled) {
      onSendMessage(textContent.trim());
      onClose(); // Close panel after sending
    }
  };
  
  const handleEmojiSelect = (emoji: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = textContent.substring(0, start) + emoji + textContent.substring(end);
      setTextContent(newText);
      
      textarea.focus();
      setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      }, 0);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  };

  const handleActionClick = () => {
      if (!showSendButton) {
        onToggleListening();
      }
  };
  
  const toggleEmojiPicker = () => {
      setShowEmojiPicker(p => !p);
      setIsAttachmentMenuOpen(false);
  }

  const toggleAttachmentMenu = () => {
      setIsAttachmentMenuOpen(p => !p);
      setShowEmojiPicker(false);
  }

  return (
    <div
        className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
    >
        <div
            className="w-full max-w-2xl mx-4 animate-pop-in-center"
            onClick={(e) => e.stopPropagation()}
        >
            <form 
                onSubmit={handleSubmit} 
                className="w-full flex items-end gap-2 p-2 bg-panel border-2 border-primary-t-20 rounded-2xl shadow-2xl shadow-primary/20"
            >
              <div className="relative flex-shrink-0 flex items-center">
                  <button
                      type="button"
                      onClick={toggleEmojiPicker}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-text-muted hover:bg-primary-t-20 transition-colors"
                      aria-label="Emoji"
                  >
                    <SmileyIcon className="w-6 h-6" />
                  </button>
                  {showEmojiPicker && <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />}

                  <button
                      type="button"
                      onClick={toggleAttachmentMenu}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-text-muted hover:bg-primary-t-20 transition-colors"
                      aria-label="Attachments"
                  >
                    <PaperclipIcon className="w-6 h-6" />
                  </button>
                  {isAttachmentMenuOpen && <AttachmentMenu {...props} onClose={() => setIsAttachmentMenuOpen(false)} />}
              </div>
              
              <textarea
                ref={textareaRef}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isInputDisabled || isListening}
                placeholder={isListening ? "Listening..." : "Message J.A.R.V.I.S."}
                className="flex-grow bg-transparent border-none focus:ring-0 px-2 py-2.5 text-text-primary placeholder:text-text-muted disabled:opacity-60 transition-opacity resize-none overflow-y-auto styled-scrollbar"
                aria-label="User command input"
                rows={1}
                style={{ minHeight: '48px' }}
              />
              
              <button
                type={showSendButton ? 'submit' : 'button'}
                onClick={handleActionClick}
                disabled={isInputDisabled}
                className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 w-12 h-12 text-white ${isListening ? 'bg-red-500 animate-pulse-strong' : 'bg-primary'} hover:scale-110 active:scale-105`}
                aria-label={showSendButton ? 'Send message' : (isListening ? 'Stop listening' : 'Start listening')}
              >
                <div className="relative w-7 h-7 flex items-center justify-center overflow-hidden">
                  <div className={`absolute transition-all duration-300 ${showSendButton ? 'opacity-0 transform scale-50 -rotate-45' : 'opacity-100 transform scale-100 rotate-0'}`}>
                    <MicrophoneIcon className="w-full h-full" />
                  </div>
                  <div className={`absolute transition-all duration-300 ${showSendButton ? 'opacity-100 transform scale-100 rotate-0' : 'opacity-0 transform scale-50 rotate-45'}`}>
                     <SendIcon className="w-6 h-6" />
                  </div>
                </div>
              </button>
            </form>
        </div>
    </div>
  );
};

export default CommandPanel;