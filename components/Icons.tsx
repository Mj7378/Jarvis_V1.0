
import React from 'react';

interface IconProps {
    className?: string;
    strokeWidth?: string;
}

// A simple base for consistent icon styling
const IconBase: React.FC<{ children: React.ReactNode, className?: string, viewBox?: string }> = ({ children, className, viewBox = "0 0 24 24" }) => (
    <svg 
        className={className} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {children}
    </svg>
);

export const TaskIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="m9 14 2 2 4-4" />
    </IconBase>
);


export const StopIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h12v12H6z" />
    </svg>
);

export const WolframAlphaIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 256 256" fill="currentColor">
        <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm47.78 153.45-31.11-54.38-29.34 51.13a8 8 0 0 1-13.89-8l36.25-63.2-34.22-59.61a8 8 0 0 1 13.89-8L154.63 96l22.25-38.79a8 8 0 1 1 13.89 8l-29.34 51.12 31.11 54.38a8 8 0 0 1-13.89 8Z"/>
    </svg>
);

export const MicrophoneIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);


export const SettingsIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </IconBase>
);

export const PowerIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
    </IconBase>
);

export const CloseIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </IconBase>
);

export const SendIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);


export const TrashIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </IconBase>
);

export const ConversationIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </IconBase>
);

export const GeminiIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

export const SystemControlsIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
    </IconBase>
);

export const QuickActionsIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

export const UniversalTranslatorIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M4 7V5h16v2" />
        <path d="M12 5V3" />
        <path d="M8 11h8" />
        <path d="M10 9l2 2 2-2" />
        <path d="M5 15h14" />
        <text x="6" y="21" fill="currentColor" stroke="none" fontSize="8" fontFamily="sans-serif">A</text>
        <text x="14" y="21" fill="currentColor" stroke="none" fontSize="8" fontFamily="sans-serif">文</text>
    </IconBase>
);

export const WebSearchIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
        <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
    </IconBase>
);

export const GenerateImageIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </IconBase>
);

export const GenerateVideoIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </IconBase>
);

export const DeviceControlIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </IconBase>
);

export const PaletteIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 0-4.4 17.5" />
    </IconBase>
);

export const CameraIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </IconBase>
);

export const PaperclipIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
);

export const DoubleCheckIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export const ChevronIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

export const AppLauncherIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="6" cy="6" r="1.5" />
        <circle cx="12" cy="6" r="1.5" />
        <circle cx="18" cy="6" r="1.5" />
        <circle cx="6" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="18" cy="12" r="1.5" />
        <circle cx="6" cy="18" r="1.5" />
        <circle cx="12" cy="18" r="1.5" />
        <circle cx="18" cy="18" r="1.5" />
    </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </IconBase>
);

export const DriveIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.71 3.25L1.15 14.28l2.3 4.47h17.1l2.3-4.47L16.29 3.25H7.71zM8.41 16.28L4.85 9.75l3.56-6.5h7.18l3.56 6.5-3.56 6.53H8.41z"/>
    </svg>
);

export const DropboxIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="m6.2 5.6-4.4 3 4.4 3 4.4-3-4.4-3zm7.2 0-4.4 3 4.4 3 4.4-3-4.4-3zm-2.2 4-4.4 3 4.4 3 4.4-3-4.4-3zm-5 4-4.4 3 4.4 3 4.4-3-4.4-3zm7.2 0-4.4 3 4.4 3 4.4-3-4.4-3z"/>
    </svg>
);


{/* --- Emoji Picker Icons --- */}
export const SmileyIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
    </IconBase>
);

// --- Vision Intelligence Icons ---
export const SwitchCameraIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </IconBase>
);

export const VQAIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </IconBase>
);

export const ObjectDetectionIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <rect x="7" y="7" width="10" height="10" />
    </IconBase>
);

export const TextRecognitionIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
        <path d="M12 18V6" />
        <path d="M8 6h8" />
        <path d="M8 12h8" />
        <path d="M8 18h8" />
    </IconBase>
);

export const FaceRecognitionIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
        <path d="M20.94 14c.34-.5.62-1.04.82-1.63" />
        <path d="M3.06 14c-.34-.5-.62-1.04-.82-1.63" />
        <path d="M12 4V2" />
        <path d="M12 22v-2" />
    </IconBase>
);

// START: Added missing icons used across the application.

export const HomeIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </IconBase>
);

export const DashboardIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
    </IconBase>
);

export const ChatIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </IconBase>
);

export const GalleryIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </IconBase>
);

export const DocumentIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
    </IconBase>
);

export const AudioIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </IconBase>
);

export const LocationIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </IconBase>
);

export const SunIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </IconBase>
);

export const CloudIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </IconBase>
);

export const RainIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M16 13v8" />
        <path d="M8 13v8" />
        <path d="M12 15v8" />
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
    </IconBase>
);

export const SnowIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
        <line x1="8" y1="16" x2="8.01" y2="16" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
        <line x1="16" y1="16" x2="16.01" y2="16" />
    </IconBase>
);

export const CloudyIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        <path d="M22 10.5a4.5 4.5 0 1 1-8.16-2.08A7 7 0 0 1 9 6.52" />
    </IconBase>
);

export const LockClosedIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </IconBase>
);

export const LockOpenIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </IconBase>
);

export const FanIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5z" />
        <path d="M12 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5z" />
        <path d="M12 12c0-2.8-2.2-5-5-5s-5 2.2-5 5 2.2 5 5 5 5-2.2 5-5z" />
        <path d="M12 12c0 2.8 2.2 5 5 5s5-2.2 5-5-2.2-5-5-5-5 2.2-5 5z" />
    </IconBase>
);

export const SceneIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="m13 2-3 8 3 8 5-16-5-16zM6 2l-3 8 3 8 5-16-5-16z"/>
    </IconBase>
);

export const AirPurifierIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M12 4h-1a2 2 0 0 0-2 2v2" />
        <path d="M15 4h1a2 2 0 0 1 2 2v2" />
        <path d="M4 14h.01" />
        <path d="M4 18h.01" />
        <path d="M8 14h.01" />
        <path d="M8 18h.01" />
        <path d="M16 14h.01" />
        <path d="M16 18h.01" />
        <path d="M20 14h.01" />
        <path d="M20 18h.01" />
        <path d="M3 6h18v6H3z" />
        <path d="M3 12h18v8H3z" />
    </IconBase>
);

export const RefreshCwIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        <path d="M21 3v5h-5" />
    </IconBase>
);

export const LightbulbIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M15 13a3 3 0 1 1-6 0h6Z" />
        <path d="M10 17c.83.83 2.17.83 3 0" />
        <path d="M12 2a7 7 0 0 0-5 2l.3.3a5 5 0 0 1 9.4 0l.3-.3a7 7 0 0 0-5-2Z" />
        <path d="M8 13a4 4 0 0 0 4 4 4 4 0 0 0 4-4H8Z" />
    </IconBase>
);

export const ThermometerIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
    </IconBase>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <path d="m6 9 6 6 6-6" />
    </IconBase>
);
