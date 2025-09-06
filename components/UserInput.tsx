import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { MicrophoneIcon, SendIcon, PaperclipIcon, StopIcon, SmileyIcon } from './Icons';
import AttachmentMenu from './AttachmentMenu';

// --- EMOJI PICKER COMPONENT (Self-contained) ---
const EMOJI_LIST = [
  '😀', '😂', '😍', '🤔', '👍', '🙏', '🔥', '🚀', '🎉', '❤️',
  '😊', '😎', '😢', '😠', '💡', '💯', '🙌', '💻', '🤖', '✨'
];

const EmojiPicker: React.FC<{
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}> = ({ onEmojiSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={pickerRef} className="absolute bottom-full left-10 mb-2 z-10 animate-pop-in">
      <div className="w-[calc(100vw-2rem)] max-w-xs p-2 bg-panel border border-primary-t-20 rounded-xl shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          {EMOJI_LIST.map(emoji => (
            <button
              key={emoji}
              onClick={() => onEmojiSelect(emoji)}
              className="text-2xl rounded-lg hover:bg-primary-t-20 transition-colors duration-200 p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


interface UserInputProps {
  onSendMessage: (message: string) => void;
  onToggleListening: () => void;
  onCancel: () => void;
  appState: AppState;
  isListening: boolean;
  stagedImage: { dataUrl: string } | null;
  pinnedImage: { dataUrl: string } | null;
  onClearStagedImage: () => void;
  onClearPinnedImage: () => void;
  onCameraClick: () => void;
  onGalleryClick: () => void;
  onDocumentClick: () => void;
  onAudioClick: () => void;
  onLocationClick: () => void;
  onGenerativeStudioClick: () => void;
  onStorageWizardClick: () => void;
  wakeWord: string;
}

const UserInput: React.FC<UserInputProps> = (props) => {
  const { onSendMessage, onToggleListening, onCancel, appState, isListening, stagedImage, pinnedImage, onClearStagedImage, onClearPinnedImage, wakeWord } = props;
  const [textContent, setTextContent] = useState('');
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = appState === AppState.THINKING || appState === AppState.SPEAKING;
  const showSendButton = textContent.trim().length > 0 || !!stagedImage;

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
  
  // Focus textarea when an image is staged
  useEffect(() => {
    if (stagedImage) {
        textareaRef.current?.focus();
    }
  }, [stagedImage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = textContent.trim();
    if (stagedImage || prompt || pinnedImage) {
      onSendMessage(prompt || (stagedImage || pinnedImage ? 'Analyze this image' : ''));
      setTextContent('');
      setIsAttachmentMenuOpen(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setTextContent(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
    textareaRef.current?.focus();
  };
  
  const toggleAttachmentMenu = () => {
      setIsEmojiPickerOpen(false);
      setIsAttachmentMenuOpen(p => !p);
  }

  const toggleEmojiPicker = () => {
    setIsAttachmentMenuOpen(false);
    setIsEmojiPickerOpen(p => !p);
  }

  const getStatusInfo = () => {
    switch (appState) {
        case AppState.LISTENING: return { text: "Listening...", color: 'text-primary' };
        case AppState.AWAITING_WAKE_WORD: return { text: `Say "${wakeWord}"`, color: 'text-primary' };
        case AppState.THINKING: return { text: "Analyzing...", color: 'text-yellow-400' };
        case AppState.SPEAKING: return { text: "Speaking...", color: 'text-purple-400' };
        default: return null;
    }
  };

  const statusInfo = getStatusInfo();
  // Show overlay only when app is busy and user hasn't started typing to interrupt
  const showStatusOverlay = statusInfo && textContent.trim().length === 0;


  return (
    <div className="px-2 pb-2 pt-1 relative">
        {pinnedImage && (
            <div className="absolute bottom-full right-14 mb-2 p-1 bg-panel border-2 border-blue-500 rounded-lg shadow-lg animate-pop-in">
                <div className="absolute -top-2 -left-2 text-xs bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded-full z-10">PINNED</div>
                <img src={pinnedImage.dataUrl} alt="Pinned context" className="h-20 w-20 object-cover rounded" />
                <button
                    type="button"
                    onClick={onClearPinnedImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold leading-none border-2 border-background transform hover:scale-110 active:scale-100 transition-transform"
                    aria-label="Remove pinned image"
                >
                    &times;
                </button>
            </div>
        )}
        {stagedImage && (
            <div className="absolute bottom-full left-14 mb-2 p-1 bg-panel border border-primary-t-20 rounded-lg shadow-lg animate-pop-in">
                <img src={stagedImage.dataUrl} alt="Staged content" className="h-20 w-20 object-cover rounded" />
                <button
                    type="button"
                    onClick={onClearStagedImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold leading-none border-2 border-background transform hover:scale-110 active:scale-100 transition-transform"
                    aria-label="Remove image"
                >
                    &times;
                </button>
            </div>
        )}

        <form 
            onSubmit={handleSubmit} 
            className="w-full flex items-end gap-2 p-1 sm:p-1.5 bg-[rgba(var(--primary-color-rgb),0.05)] backdrop-blur-lg rounded-full border border-primary-t-20 shadow-[0_0_25px_rgba(var(--primary-color-rgb),0.25)] transition-all duration-300"
        >
          <div className="relative flex-shrink-0 flex items-center">
              {/* Attachment Button */}
              <button
                  type="button"
                  onClick={toggleAttachmentMenu}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-primary-t-20 transition-colors"
                  aria-label="Attachments"
              >
                <PaperclipIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              {isAttachmentMenuOpen && <AttachmentMenu {...props} onClose={() => setIsAttachmentMenuOpen(false)} />}
              
               {/* Emoji Picker Button */}
              <button
                  type="button"
                  onClick={toggleEmojiPicker}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-primary-t-20 transition-colors"
                  aria-label="Add emoji"
              >
                <SmileyIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              {isEmojiPickerOpen && <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setIsEmojiPickerOpen(false)} />}
          </div>
          
          {/* Text Input Area Container */}
          <div className="relative flex-grow">
              <textarea
                ref={textareaRef}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={appState === AppState.LISTENING || appState === AppState.AWAITING_WAKE_WORD}
                placeholder={stagedImage || pinnedImage ? "Describe the image..." : "Message J.A.R.V.I.S."}
                className="w-full bg-transparent border-none focus:ring-0 px-2 py-2 text-text-primary placeholder:text-text-muted disabled:opacity-60 transition-opacity resize-none overflow-y-auto styled-scrollbar"
                aria-label="User command input"
                rows={1}
                style={{ minHeight: '40px' }}
              />
              {showStatusOverlay && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className={`font-orbitron animate-text-flicker ${statusInfo.color}`}>
                        {statusInfo.text}
                    </span>
                </div>
              )}
          </div>
          
          {/* Action Button (Mic/Send/Stop) */}
          <button
            type={showSendButton && !isBusy ? 'submit' : 'button'}
            onClick={isBusy ? onCancel : (showSendButton ? undefined : onToggleListening)}
            className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 w-11 h-11 text-white ${isBusy || isListening ? 'bg-red-500 animate-pulse-strong' : 'bg-primary'} hover:scale-110 active:scale-105`}
            aria-label={isBusy ? 'Stop generation' : (showSendButton ? 'Send message' : (isListening ? 'Stop listening' : 'Start listening'))}
          >
            <div className="relative w-7 h-7 flex items-center justify-center overflow-hidden">
                {isBusy ? (
                     <StopIcon className="w-6 h-6" />
                ) : (
                    <>
                        <div className={`absolute transition-all duration-300 ${showSendButton ? 'opacity-0 transform scale-50 -rotate-45' : 'opacity-100 transform scale-100 rotate-0'}`}>
                            <MicrophoneIcon className="w-full h-full" />
                        </div>
                        <div className={`absolute transition-all duration-300 ${showSendButton ? 'opacity-100 transform scale-100 rotate-0' : 'opacity-0 transform scale-50 rotate-45'}`}>
                            <SendIcon className="w-6 h-6" />
                        </div>
                    </>
                )}
            </div>
          </button>
        </form>
    </div>
  );
};

export default UserInput;
