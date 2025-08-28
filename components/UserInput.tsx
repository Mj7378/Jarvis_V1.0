import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { MicrophoneIcon, SendIcon, SmileyIcon, PaperclipIcon } from './Icons';
import EmojiPicker from './EmojiPicker';
import AttachmentMenu from './AttachmentMenu';

interface UserInputProps {
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

const UserInput: React.FC<UserInputProps> = (props) => {
  const { onSendMessage, onToggleListening, appState, isListening } = props;
  const [textContent, setTextContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isInputDisabled = appState === AppState.THINKING || appState === AppState.SPEAKING;
  const showSendButton = textContent.trim().length > 0;

  // Auto-sizing textarea logic
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to calculate new scrollHeight
      const scrollHeight = textarea.scrollHeight;
      // Max height of 128px (corresponds to Tailwind's max-h-32)
      const newHeight = Math.min(128, scrollHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [textContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showSendButton && !isInputDisabled) {
      onSendMessage(textContent.trim());
      setTextContent('');
      setShowEmojiPicker(false);
      setIsAttachmentMenuOpen(false);
    }
  };
  
  const handleEmojiSelect = (emoji: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = textContent.substring(0, start) + emoji + textContent.substring(end);
      setTextContent(newText);
      
      // Focus and set cursor position after emoji
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
      if (showSendButton) {
        // Form's onSubmit will trigger
      } else {
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
    <div className="px-2 pb-2 pt-1">
        <form 
            onSubmit={handleSubmit} 
            className="w-full flex items-end gap-2 p-1.5 bg-panel border border-transparent rounded-full focus-within:border-primary-t-50 transition-all duration-300"
        >
          <div className="relative flex-shrink-0 flex items-center">
              {/* Emoji Button */}
              <button
                  type="button"
                  onClick={toggleEmojiPicker}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-primary-t-20 transition-colors"
                  aria-label="Emoji"
              >
                <SmileyIcon className="w-6 h-6" />
              </button>
              {showEmojiPicker && <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />}

              {/* Attachment Button */}
              <button
                  type="button"
                  onClick={toggleAttachmentMenu}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-primary-t-20 transition-colors"
                  aria-label="Attachments"
              >
                <PaperclipIcon className="w-6 h-6" />
              </button>
              {isAttachmentMenuOpen && <AttachmentMenu {...props} onClose={() => setIsAttachmentMenuOpen(false)} />}
          </div>
          
          {/* Text Input Area */}
          <textarea
            ref={textareaRef}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isInputDisabled || isListening}
            placeholder={isListening ? "Listening..." : "Message"}
            className="flex-grow bg-transparent border-none focus:ring-0 px-2 py-2 text-text-primary placeholder:text-text-muted disabled:opacity-60 transition-opacity resize-none overflow-y-auto styled-scrollbar"
            aria-label="User command input"
            rows={1}
            style={{ minHeight: '40px' }}
          />
          
          {/* Action Button (Mic/Send) */}
          <button
            type={showSendButton ? 'submit' : 'button'}
            onClick={handleActionClick}
            disabled={isInputDisabled}
            className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 w-11 h-11 text-white ${isListening ? 'bg-red-500 animate-pulse-strong' : 'bg-primary'} hover:scale-110 active:scale-105`}
            aria-label={showSendButton ? 'Send message' : (isListening ? 'Stop listening' : 'Start listening')}
          >
            <div className="relative w-7 h-7 flex items-center justify-center overflow-hidden">
              {/* Microphone Icon with Transition */}
              <div className={`absolute transition-all duration-300 ${showSendButton ? 'opacity-0 transform scale-50 -rotate-45' : 'opacity-100 transform scale-100 rotate-0'}`}>
                <MicrophoneIcon className="w-full h-full" />
              </div>
              
              {/* Send Icon with Transition */}
              <div className={`absolute transition-all duration-300 ${showSendButton ? 'opacity-100 transform scale-100 rotate-0' : 'opacity-0 transform scale-50 rotate-45'}`}>
                 <SendIcon className="w-6 h-6" />
              </div>
            </div>
          </button>
        </form>
    </div>
  );
};

export default UserInput;