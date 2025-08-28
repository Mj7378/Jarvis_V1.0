import React from 'react';
import { CameraIcon, GenerateImageIcon, GenerateVideoIcon, GalleryIcon, DocumentIcon, AudioIcon, LocationIcon } from './Icons';

interface AttachmentMenuProps {
  onCameraClick: () => void;
  onGalleryClick: () => void;
  onDocumentClick: () => void;
  onAudioClick: () => void;
  onLocationClick: () => void;
  onDesignModeClick: () => void;
  onSimulationModeClick: () => void;
  onClose: () => void;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ 
    onCameraClick,
    onGalleryClick,
    onDocumentClick,
    onAudioClick,
    onLocationClick,
    onDesignModeClick, 
    onSimulationModeClick,
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
            bg: 'bg-violet-400/20'
        },
        {
            label: 'Camera',
            icon: <CameraIcon className="w-7 h-7" />,
            action: () => handleAction(onCameraClick),
            color: 'text-pink-400',
            bg: 'bg-pink-400/20'
        },
        {
            label: 'Gallery',
            icon: <GalleryIcon className="w-7 h-7" />,
            action: () => handleAction(onGalleryClick),
            color: 'text-purple-400',
            bg: 'bg-purple-400/20'
        },
        {
            label: 'Audio',
            icon: <AudioIcon className="w-7 h-7" />,
            action: () => handleAction(onAudioClick),
            color: 'text-orange-400',
            bg: 'bg-orange-400/20'
        },
        {
            label: 'Location',
            icon: <LocationIcon className="w-7 h-7" />,
            action: () => handleAction(onLocationClick),
            color: 'text-red-400',
            bg: 'bg-red-400/20'
        },
        {
            label: 'Design',
            icon: <GenerateImageIcon className="w-7 h-7" />,
            action: () => handleAction(onDesignModeClick),
            color: 'text-sky-400',
            bg: 'bg-sky-400/20'
        },
        {
            label: 'Simulation',
            icon: <GenerateVideoIcon className="w-7 h-7" />,
            action: () => handleAction(onSimulationModeClick),
            color: 'text-green-400',
            bg: 'bg-green-400/20'
        }
    ];

    return (
        <div ref={menuRef} className="absolute bottom-full left-0 mb-2 z-10 animate-pop-in">
            <div className="w-80 p-2 bg-panel border border-primary-t-20 rounded-xl shadow-lg">
                <div className="grid grid-cols-3 gap-2 text-center">
                    {menuItems.map(item => (
                        <button
                            key={item.label}
                            onClick={item.action}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg hover:bg-primary-t-20 transition-colors duration-200 space-y-1.5`}
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.bg} ${item.color}`}>
                                {item.icon}
                            </div>
                            <span className="text-xs text-text-secondary">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AttachmentMenu;