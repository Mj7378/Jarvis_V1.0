import React, { useState, useEffect } from 'react';
import { getAsset } from '../utils/db';

const SHUTDOWN_SEQUENCE = [
  { text: 'System shutdown sequence initiated.', delay: 100 },
  { text: 'Closing all active processes...', delay: 800 },
  { text: 'De-allocating system memory...', delay: 600 },
  { text: 'Disconnecting from Stark Industries network...', delay: 1000 },
  { text: 'Powering down AI Core...', delay: 800 },
  { text: 'Goodbye, Sir.', delay: 500 },
];

interface ShutdownProps {
    useCustomVideo: boolean;
    onComplete: () => void;
}

const DefaultShutdownAnimation: React.FC<{ onAnimationEnd: () => void }> = ({ onAnimationEnd }) => {
    const [visibleLines, setVisibleLines] = useState<number>(0);
    const [animationState, setAnimationState] = useState<'deconstructing' | 'fading'>('deconstructing');

    useEffect(() => {
        let currentDelay = 0;
        const timers: number[] = [];
        SHUTDOWN_SEQUENCE.forEach((line) => {
            currentDelay += line.delay;
            // FIX: Explicitly use `window.setTimeout` to get a `number` return type for browser environments.
            const timer = window.setTimeout(() => {
                setVisibleLines(prev => prev + 1);
            }, currentDelay);
            timers.push(timer);
        });

        // FIX: Explicitly use `window.setTimeout` to get a `number` return type for browser environments.
        const fadeTimer = window.setTimeout(() => {
            setAnimationState('fading');
        }, currentDelay + 1000);
        timers.push(fadeTimer);

        // FIX: Explicitly use `window.setTimeout` to get a `number` return type for browser environments.
        const completeTimer = window.setTimeout(() => {
            onAnimationEnd();
        }, currentDelay + 2000);
        timers.push(completeTimer);
        
        return () => {
            timers.forEach(clearTimeout);
        };

    }, [onAnimationEnd]);

    return (
        <div className={`fixed inset-0 bg-jarvis-dark transition-opacity duration-1000 ${animationState === 'fading' ? 'opacity-0' : 'opacity-100'}`}>
            <div className="holographic-container shutdown">
                <div className="holographic-element h-ring-1"></div>
                <div className="holographic-element h-ring-2"></div>
                <div className="holographic-element h-ring-3"></div>
                <div className="holographic-element h-ring-4"></div>
                <div className="holographic-element h-core"></div>
            </div>
            
            <div className="absolute inset-0 text-red-400 font-mono flex items-center justify-center p-8">
                <div className="w-full max-w-4xl">
                    <div className="border border-red-500/50 p-4 bg-black/30 typewriter">
                        {SHUTDOWN_SEQUENCE.slice(0, visibleLines).map((line, i) => (
                        <p key={i} style={{ animationDuration: `${Math.min(1, line.text.length / 40)}s`, borderRightColor: '#ff4d4d' }}>
                            &gt; {line.text}
                        </p>
                        ))}
                    </div>
                    <h1 
                        className="font-orbitron text-5xl md:text-7xl text-red-500 glitch mt-8"
                        data-text="SYSTEM OFFLINE"
                        style={{'--glitch-bg': 'transparent', textShadow: '0 0 20px #ff0000'} as React.CSSProperties}
                    >
                        SYSTEM OFFLINE
                    </h1>
                </div>
            </div>
        </div>
    );
};

const Shutdown: React.FC<ShutdownProps> = ({ useCustomVideo, onComplete }) => {
    const [mode, setMode] = useState<'loading' | 'video' | 'default'>('loading');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        
        const loadVideo = async () => {
            try {
                const videoFile = await getAsset<File>('shutdownVideo');
                if (videoFile) {
                    objectUrl = URL.createObjectURL(videoFile);
                    setVideoUrl(objectUrl);
                    setMode('video');
                } else {
                    console.warn("Custom shutdown video not found, falling back to default.");
                    setMode('default');
                }
            } catch (error) {
                console.error("Error loading shutdown video:", error);
                setMode('default');
            }
        };

        if (useCustomVideo) {
            loadVideo();
        } else {
            setMode('default');
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [useCustomVideo]);

    switch (mode) {
        case 'video':
            return (
                <div className="fixed inset-0 bg-jarvis-dark flex items-center justify-center">
                    {videoUrl && (
                        <video
                            src={videoUrl}
                            autoPlay
                            playsInline
                            onEnded={onComplete}
                            onError={() => setMode('default')} // Fallback if video fails
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}
                </div>
            );
        case 'default':
            return <DefaultShutdownAnimation onAnimationEnd={onComplete} />;
        case 'loading':
        default:
            return (
                <div className="fixed inset-0 bg-jarvis-dark flex items-center justify-center text-primary font-orbitron animate-pulse">
                    <p>INITIATING SHUTDOWN...</p>
                </div>
            );
    }
};

export default Shutdown;
