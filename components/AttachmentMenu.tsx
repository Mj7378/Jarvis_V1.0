import React from 'react';
import { CameraIcon, GenerateImageIcon, GalleryIcon, DocumentIcon, AudioIcon, LocationIcon, DriveIcon, DropboxIcon } from './Icons';

interface AttachmentMenuProps {
  onCameraClick: () => void;
  onGalleryClick: () => void;
  onDocumentClick: () => void;
  onAudioClick: () => void;
  onLocationClick: () => void;
  onGenerativeStudioClick: () => void;
  onStorageWizardClick: () => void;
  onClose: () => void;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ 
    onCameraClick,
    onGalleryClick,
    onDocumentClick,
    onAudioClick,
    onLocationClick,
    onGenerativeStudioClick,
    onStorageWizardClick, 
    onClose
}) => {
    
    const menuRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    const menuItems = [
        {
            label: 'Document',
            icon: <DocumentIcon className="w-7 h-7" />,
            action: () => handleAction(onDocumentClick),
            color: 'text-violet-400',
            bg: 'bg-violet-400/20',
            disabled: false,
        },
        {
            label: 'Camera',
            icon: <CameraIcon className="w-7 h-7" />,
            action: () => handleAction(onCameraClick),
            color: 'text-pink-400',
            bg: 'bg-pink-400/20',
            disabled: false,
        },
        {
            label: 'Gallery',
            icon: <GalleryIcon className="w-7 h-7" />,
            action: () => handleAction(onGalleryClick),
            color: 'text-purple-400',
            bg: 'bg-purple-400/20',
            disabled: false,
        },
        {
            label: 'Audio',
            icon: <AudioIcon className="w-7 h-7" />,
            action: () => handleAction(onAudioClick),
            color: 'text-orange-400',
            bg: 'bg-orange-400/20',
            disabled: false,
        },
        {
            label: 'Location',
            icon: <LocationIcon className="w-7 h-7" />,
            action: () => handleAction(onLocationClick),
            color: 'text-red-400',
            bg: 'bg-red-400/20',
            disabled: false,
        },
        {
            label: 'Generative Studio',
            icon: <GenerateImageIcon className="w-7 h-7" />,
            action: () => handleAction(onGenerativeStudioClick),
            color: 'text-sky-400',
            bg: 'bg-sky-400/20',
            disabled: false,
        },
        {
            label: 'Google Drive',
            icon: <DriveIcon className="w-7 h-7" />,
            action: () => handleAction(onStorageWizardClick),
            color: 'text-blue-400',
            bg: 'bg-blue-400/20',
            disabled: false,
        },
        {
            label: 'Dropbox',
            icon: <DropboxIcon className="w-7 h-7" />,
            action: () => handleAction(onStorageWizardClick),
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/20',
            disabled: false,
        }
    ];

    return (
        <div ref={menuRef} className="absolute bottom-full left-0 mb-2 z-10 animate-pop-in">
            <div className="w-[90vw] max-w-xs p-2 bg-panel border border-primary-t-20 rounded-xl shadow-lg">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center">
                    {menuItems.map(item => (
                        <div key={item.label} className="relative group">
                            <button
                                onClick={item.action}
                                disabled={item.disabled}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg hover:bg-primary-t-20 transition-colors duration-200 space-y-1.5 w-full ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.bg} ${item.color}`}>
                                    {item.icon}
                                </div>
                                <span className="text-xs text-text-secondary">{item.label}</span>
                            </button>
                             {item.disabled && <div className="absolute top-1 right-1 text-xs bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Soon</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AttachmentMenu;
