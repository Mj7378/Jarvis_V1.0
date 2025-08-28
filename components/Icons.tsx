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
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)">
            {/* Base */}
            <path d="M32 56 C38 56 38 62 32 62 C26 62 26 56 32 56 Z" fill="#2D3748" />
            <path d="M32 46 L32 58" stroke="#4A5568" strokeWidth="4" strokeLinecap="round" />
            {/* Body */}
            <rect x="22" y="10" width="20" height="36" rx="10" fill="#4A5568" />
            <rect x="22" y="10" width="20" height="36" rx="10" fill="url(#metal-grad)" />
            {/* Grille */}
            <rect x="20" y="4" width="24" height="24" rx="12" fill="#718096" />
            <rect x="20" y="4" width="24" height="24" rx="12" fill="url(#metal-grad)" />
            <circle cx="32" cy="16" r="12" fill="url(#glass-highlight)" />
        </g>
    </IconBase>
);

export const SettingsIcon: React.FC<IconProps> = ({ className }) => (
    <IconBase className={className}>
        <g filter="url(#icon-3d-shadow)" transform="translate(4 4)">
            <path d="M51.3,31.5l3.2-1.8c0.4-0.2,0.5-0.7,0.3-1.1l-3.2-5.5c-0.2-0.4-0.7-0.5-1.1-0.3l-3.2,1.8 c-0.8-0.6-1.7-1.2-2.6-1.6l-0.5-3.5c-0.1-0.4-0.5-0.8-0.9-0.8h-6.3c-0.4,0-0.8,0.3-0.9,0.8l-0.5,3.5c-0.9,0.4-1.8,1-2.6,1.6 l-3.2-1.8c-0.4-0.2-0.9-0.1-1.1,0.3l-3.2,5.5c-0.2,0.4-0.1,0.9,0.3,1.1l3.2,1.8c-0.2,0.9-0.2,1.8,0,2.7l-3.2,1.8 c-0.4,0.2-0.5,0.7-0.3,1.1l3.2,5.5c0.2,0.4,0.7,0.5,1.1,0.3l3.2-1.8c0.8,0.6,1.7,1.2,2.6,1.6l0.5,3.5c0.1,0.4,0.5,0.8,0.9,0.8 h6.3c0.4,0,0.8-0.3,0.9-0.8l0.5-3.5c0.9-0.4,1.8-1,2.6-1.6l3.2,1.8c0.4,0.2,0.9,0.1,1.1-0.3l3.2-5.5c0.2-0.4,0.1-0.9-0.3-1.1 l-3.2-1.8C51.5,33.3,51.5,32.4,51.3,31.5z M28.8,38.9c-4.9,0-8.8-4-8.8-8.8s4-8.8,8.8-8.8s8.8,4,8.8,8.8S33.7,38.9,28.8,38.9z" fill="#4A5568"/>
            <path d="M51.3,31.5l3.2-1.8c0.4-0.2,0.5-0.7,0.3-1.1l-3.2-5.5c-0.2-0.4-0.7-0.5-1.1-0.3l-3.2,1.8 c-0.8-0.6-1.7-1.2-2.6-1.6l-0.5-3.5c-0.1-0.4-0.5-0.8-0.9-0.8h-6.3c-0.4,0-0.8,0.3-0.9,0.8l-0.5,3.5c-0.9,0.4-1.8,1-2.6,1.6 l-3.2-1.8c-0.4-0.2-0.9-0.1-1.1,0.3l-3.2,5.5c-0.2,0.4-0.1,0.9,0.3,1.1l3.2,1.8c-0.2,0.9-0.2,1.8,0,2.7l-3.2,1.8 c-0.4,0.2-0.5,0.7-0.3,1.1l3.2,5.5c0.2,0.4,0.7,0.5,1.1,0.3l3.2-1.8c0.8,0.6,1.7,1.2,2.6,1.6l0.5,3.5c0.1,0.4,0.5,0.8,0.9,0.8 h6.3c0.4,0,0.8-0.3,0.9-0.8l0.5-3.5c0.9-0.4,1.8-1,2.6-1.6l3.2,1.8c0.4,0.2,0.9,0.1,1.1-0.3l3.2-5.5c0.2-0.4,0.1-0.9-0.3-1.1 l-3.2-1.8C51.5,33.3,51.5,32.4,51.3,31.5z M28.8,38.9c-4.9,0-8.8-4-8.8-8.8s4-8.8,8.8-8.8s8.8,4,8.8,8.8S33.7,38.9,28.8,38.9z" fill="url(#metal-grad)"/>
            <circle cx="28.8" cy="30.1" r="12" fill="url(#glass-highlight)" />
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
