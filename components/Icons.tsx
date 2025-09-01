
import React from 'react';

interface IconProps {
    className?: string;
    strokeWidth?: string;
}

const sharedDefs = (
    <defs>
        <filter id="icon-3d-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.4"/>
        </filter>
        <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
        </linearGradient>
         <radialGradient id="glass-highlight" cx="30%" cy="30%" r="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id="glow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
        </linearGradient>
    </defs>
);

const IconBase: React.FC<{ children: React.ReactNode, className?: string, viewBox?: string }> = ({ children, className, viewBox = "0 0 64 64" }) => (
    <svg 
        className={className} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox={viewBox} 
    >
        {sharedDefs}
        {children}
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
        <g filter="url(#icon-3d-shadow)">
            <circle cx="32" cy="32" r="26" fill="#4A5568" />
            <circle cx="32" cy="32" r="26" fill="url(#metal-grad)" />

            <path
                d="M32,10 A22,22 0 1 1 10,32"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeOpacity="0.7"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="4 8"
            />
            
            <circle cx="32" cy="32" r="18" fill="#0A0F1A" opacity="0.5"/>
            
            <path
                d="M32 18 V 12 M32 46 V 52 M18 32 H 12 M46 32 H 52"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeOpacity="0.8"
            />

            <circle cx="32" cy="32" r="10" stroke="currentColor" strokeWidth="1" fill="none" />
            <circle cx="32" cy="32" r="6" fill="currentColor" />
            <circle cx="32" cy="32" r="26" fill="url(#glass-highlight)" opacity="0.5" />
        </g>
    </IconBase>
);

export const PowerIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <path d="M32,12V28" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d="M46.7,19.3A16,16,0,1,1,17.3,19.3" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
         <path d="M32,12V28" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
         <path d="M46.7,19.3A16,16,0,1,1,17.3,19.3" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
    </IconBase>
);

export const CloseIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <line x1="16" y1="16" x2="48" y2="48" stroke="#4A5568" strokeWidth="10" strokeLinecap="round" />
            <line x1="16" y1="48" x2="48" y2="16" stroke="#4A5568" strokeWidth="10" strokeLinecap="round" />
            <line x1="16" y1="16" x2="48" y2="48" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <line x1="16" y1="48" x2="48" y2="16" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <line x1="16" y1="16" x2="48" y2="48" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <line x1="16" y1="48" x2="48" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
        </g>
    </IconBase>
);

export const SendIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);


export const TrashIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <path d="M14 18 L50 18 L46 58 L18 58 Z" fill="#4A5568" />
            <path d="M14 18 L50 18 L46 58 L18 58 Z" fill="url(#metal-grad)" />
            <rect x="10" y="10" width="44" height="8" rx="4" fill="#718096" />
            <rect x="24" y="6" width="16" height="4" rx="2" fill="#4A5568" />
             <rect x="10" y="10" width="44" height="8" rx="4" fill="url(#metal-grad)" />
             <path d="M14 18 L50 18 L46 58 L18 58 Z" fill="url(#glass-highlight)" opacity="0.7"/>
        </g>
    </IconBase>
);

export const ConversationIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <path d="M10 10 H 54 V 42 H 36 L 28 50 V 42 H 10 Z" fill="#4A5568" />
            <path d="M10 10 H 54 V 42 H 36 L 28 50 V 42 H 10 Z" fill="url(#metal-grad)" />
            <path d="M10 10 H 54 V 42 H 36 L 28 50 V 42 H 10 Z" fill="url(#glass-highlight)" />
        </g>
    </IconBase>
);

export const GeminiIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)" transform="translate(2 2)">
            <path d="M30 2 L35.5 15.5 L50 17 L38 26.5 L41 40 L30 32 L19 40 L22 26.5 L10 17 L24.5 15.5 Z" fill="#4A5568"/>
            <path d="M30 2 L35.5 15.5 L50 17 L38 26.5 L41 40 L30 32 Z" fill="url(#glow-grad)" />
            <path d="M30 2 L24.5 15.5 L10 17 L22 26.5 L19 40 L30 32 Z" fill="currentColor" />
            <path d="M30 32 L19 40 L22 26.5 L10 17 L24.5 15.5 L30 2 L35.5 15.5 L50 17 L38 26.5 L41 40 Z" fill="url(#glass-highlight)" />
        </g>
    </IconBase>
);

export const SystemControlsIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <rect x="10" y="10" width="44" height="44" rx="8" fill="#2D3748" opacity="0.8" />
            <line x1="18" y1="20" x2="46" y2="20" stroke="#4A5568" strokeWidth="4" strokeLinecap="round" />
            <line x1="18" y1="32" x2="46" y2="32" stroke="#4A5568" strokeWidth="4" strokeLinecap="round" />
            <line x1="18" y1="44" x2="46" y2="44" stroke="#4A5568" strokeWidth="4" strokeLinecap="round" />
            <circle cx="26" cy="20" r="5" fill="currentColor" />
            <circle cx="40" cy="32" r="5" fill="currentColor" />
            <circle cx="22" cy="44" r="5" fill="currentColor" />
            <circle cx="26" cy="20" r="5" fill="url(#glass-highlight)" />
            <circle cx="40" cy="32" r="5" fill="url(#glass-highlight)" />
            <circle cx="22" cy="44" r="5" fill="url(#glass-highlight)" />
        </g>
    </IconBase>
);

export const QuickActionsIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <path d="M30,4 L14,30 L28,30 L26,52 L46,24 L32,24 Z" fill="#4A5568" />
            <path d="M30,4 L14,30 L28,30 L26,52 L46,24 L32,24 Z" fill="url(#glow-grad)" />
            <path d="M30,4 L14,30 L28,30 L26,52 L46,24 L32,24 Z" stroke="white" strokeWidth="1" fill="none" opacity="0.5"/>
        </g>
    </IconBase>
);

export const UniversalTranslatorIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <circle cx="32" cy="32" r="26" fill="#4A5568" />
            <circle cx="32" cy="32" r="26" fill="url(#glow-grad)" />
            <path d="M32 6 A 32 32 0 0 1 32 58" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
            <path d="M32 6 A 32 32 0 0 0 32 58" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
            <circle cx="32" cy="32" r="26" fill="url(#glass-highlight)" />
            <text x="22" y="38" fontFamily="Arial" fontSize="16" fill="white" fontWeight="bold">A</text>
            <text x="38" y="28" fontFamily="sans-serif" fontSize="16" fill="white" fontWeight="bold">文</text>
        </g>
    </IconBase>
);

export const WebSearchIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <circle cx="32" cy="32" r="26" fill="#4A5568" />
            <circle cx="32" cy="32" r="26" fill="url(#glow-grad)" />
            <path d="M6 32 H 58" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
            <path d="M32 6 V 58" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
            <path d="M32 6 A 26 10 0 0 0 32 58" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
            <path d="M32 6 A 26 10 0 0 1 32 58" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
            <circle cx="32" cy="32" r="26" fill="url(#glass-highlight)" />
        </g>
    </IconBase>
);

export const GenerateImageIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <rect x="10" y="10" width="44" height="44" rx="8" fill="#2D3748"/>
            <rect x="10" y="10" width="44" height="44" rx="8" fill="url(#glow-grad)" opacity="0.7"/>
            <path d="M18 46 L32 30 L46 42 V 50 H 18 Z" fill="white" opacity="0.8"/>
            <circle cx="26" cy="24" r="5" fill="white" opacity="0.9"/>
            <rect x="10" y="10" width="44" height="44" rx="8" fill="url(#glass-highlight)"/>
        </g>
    </IconBase>
);

export const SelfHealIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <path d="M32 4 L 10 14 V 32 C 10 46 32 58 32 58 C 32 58 54 46 54 32 V 14 Z" fill="#4A5568" />
            <path d="M32 4 L 10 14 V 32 C 10 46 32 58 32 58 C 32 58 54 46 54 32 V 14 Z" fill="url(#glow-grad)" />
            <path d="M32 4 L 10 14 V 32 C 10 46 32 58 32 58 C 32 58 54 46 54 32 V 14 Z" fill="url(#glass-highlight)" />
            <path d="M30 22 H 34 V 30 H 42 V 34 H 34 V 42 H 30 V 34 H 22 V 30 H 30 Z" fill="white"/>
        </g>
    </IconBase>
);

export const GenerateVideoIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <rect x="10" y="10" width="44" height="44" rx="8" fill="#2D3748"/>
            <rect x="10" y="10" width="44" height="44" rx="8" fill="url(#glow-grad)" opacity="0.7"/>
            <path d="M26 22 L 42 32 L 26 42 Z" fill="white"/>
            <rect x="10" y="10" width="44" height="44" rx="8" fill="url(#glass-highlight)"/>
        </g>
    </IconBase>
);

export const DeviceControlIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <circle cx="32" cy="32" r="20" fill="#2D3748"/>
            <path d="M32,6V10 M32,54V58 M6,32H10 M54,32H58 M15.5,15.5l2.8,2.8 M45.7,45.7l2.8,2.8 M15.5,48.5l2.8-2.8 M45.7,18.3l2.8-2.8" stroke="#4A5568" strokeWidth="4" strokeLinecap="round" />
            <circle cx="32" cy="32" r="12" fill="currentColor"/>
            <circle cx="32" cy="32" r="16" fill="url(#glass-highlight)"/>
        </g>
    </IconBase>
);

export const PaletteIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <path d="M32 4 C 16 4 8 16 8 28 C 8 38 16 52 32 60 C 48 52 56 38 56 28 C 56 16 48 4 32 4 Z" fill="#4A5568" />
            <path d="M32 4 C 16 4 8 16 8 28 C 8 38 16 52 32 60 C 48 52 56 38 56 28 C 56 16 48 4 32 4 Z" fill="url(#metal-grad)" />
            <circle cx="22" cy="24" r="6" fill="#ff4d4d"/>
            <circle cx="42" cy="24" r="6" fill="#00aeff"/>
            <circle cx="32" cy="38" r="7" fill="currentColor"/>
             <path d="M32 4 C 16 4 8 16 8 28 C 8 38 16 52 32 60 C 48 52 56 38 56 28 C 56 16 48 4 32 4 Z" fill="url(#glass-highlight)" />
        </g>
    </IconBase>
);

export const CameraIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <path d="M14 18 H 50 V 50 H 14 Z" fill="#4A5568" rx="4"/>
            <path d="M14 18 H 50 V 50 H 14 Z" fill="url(#metal-grad)" rx="4"/>
            <circle cx="32" cy="34" r="10" fill="black" />
            <circle cx="32" cy="34" r="8" fill="currentColor" />
            <circle cx="32" cy="34" r="4" fill="#2D3748" />
            <rect x="22" y="10" width="20" height="8" rx="4" fill="#718096" />
            <rect x="22" y="10" width="20" height="8" rx="4" fill="url(#metal-grad)" />
            <circle cx="32" cy="34" r="12" fill="url(#glass-highlight)" />
        </g>
    </IconBase>
);

export const SmileyIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
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


// --- Simple Icon Base ---
const SimpleIcon: React.FC<{ children: React.ReactNode, className?: string, viewBox?: string }> = ({ children, className, viewBox="0 0 24 24" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox={viewBox} stroke="currentColor" strokeWidth="1.5">
        {children}
    </svg>
);

// --- Vision Intelligence Icons ---
export const VQAIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </SimpleIcon>
);

export const ObjectDetectionIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01M9 14h6" />
    </SimpleIcon>
);

export const TextRecognitionIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </SimpleIcon>
);

export const FaceRecognitionIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </SimpleIcon>
);

export const EyeTrackingIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </SimpleIcon>
);

export const GestureControlIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11" />
    </SimpleIcon>
);


// --- Emoji Category Icons ---
export const FaceIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            <path d="M32 38 C 22 38 18 46 18 50 L 46 50 C 46 46 42 38 32 38 Z" fill="currentColor" opacity="0.6"/>
            <circle cx="32" cy="26" r="10" fill="currentColor"/>
             <circle cx="32" cy="26" r="10" fill="url(#glass-highlight)"/>
        </g>
    </IconBase>
);

export const LeafIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 15.536A9.003 9.003 0 0112 15c-1.657 0-3.183.67-4.243 1.757m0 0a9.003 9.003 0 01-4.243-4.243m4.243 4.243L12 12m0 0l4.243 4.243m-4.243-4.243a9.003 9.003 0 014.243-4.243m-4.243 4.243L7.757 7.757m4.243 4.243a9.003 9.003 0 01-4.243-4.243" />
    </SimpleIcon>
);
export const FoodIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V3m0 0c-3.314 0-6 2.686-6 6v12M12 3c3.314 0 6 2.686 6 6v12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
    </SimpleIcon>
);
export const ActivityIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </SimpleIcon>
);
export const TravelIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5A10.5 10.5 0 001.5 12h21A10.5 10.5 0 0012 1.5zM1.5 12a10.5 10.5 0 0010.5 10.5v-21A10.5 10.5 0 001.5 12zm10.5 10.5a10.5 10.5 0 0010.5-10.5h-21a10.5 10.5 0 0010.5 10.5z" />
    </SimpleIcon>
);
export const ObjectIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </SimpleIcon>
);
export const SymbolIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </SimpleIcon>
);
export const FlagIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </SimpleIcon>
);

// --- Weather Icons ---
export const SunIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </SimpleIcon>
);

export const CloudIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999A5.002 5.002 0 109.22 5.5 4.001 4.001 0 003 15z" />
    </SimpleIcon>
);

export const RainIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21l-1 2m5-2l-1 2m5-2l-1 2" />
    </SimpleIcon>
);

export const SnowIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m6-9H6m3-6l-3 3 3 3m6 0l3-3-3-3m0 12l3-3-3-3" />
    </SimpleIcon>
);

export const CloudyIcon: React.FC<IconProps> = ({ className }) => ( // for partly cloudy
    <SimpleIcon className={className}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5 7.5-3.358 7.5-7.5S16.142 5.25 12 5.25z"/>
       <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.75A9.375 9.375 0 0112 22.125a9.375 9.375 0 01-9-8.25M12 2.25c4.142 0 7.5 3.358 7.5 7.5s-3.358 7.5-7.5 7.5"/>
    </SimpleIcon>
);

// --- Attachment Icons ---
export const GalleryIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </SimpleIcon>
);
export const DocumentIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </SimpleIcon>
);
export const AudioIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l10-3v13m-10 1a2 2 0 11-4 0 2 2 0 014 0zm10-1a2 2 0 11-4 0 2 2 0 014 0z" />
    </SimpleIcon>
);
export const LocationIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </SimpleIcon>
);
export const HomeIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </SimpleIcon>
);

export const DashboardIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className} viewBox="0 0 24 24" >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </SimpleIcon>
);

export const ChatIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className} viewBox="0 0 24 24" >
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </SimpleIcon>
);

// --- Smart Home Icons ---
export const LockClosedIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </SimpleIcon>
);
export const LockOpenIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </SimpleIcon>
);
export const FanIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l-8-4.5 8-4.5 8 4.5-8 4.5zM12 12v8m0-8L4 7.5M12 12l8-4.5" />
    </SimpleIcon>
);
export const AirPurifierIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
    </SimpleIcon>
);
export const SceneIcon: React.FC<IconProps> = ({ className }) => (
    <SimpleIcon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </SimpleIcon>
);