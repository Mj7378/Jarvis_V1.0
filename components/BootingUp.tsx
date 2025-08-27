
import React, { useState, useEffect } from 'react';
import { getVideo } from '../utils/db';
import { useSoundEffects } from '../hooks/useSoundEffects';

const BOOT_SEQUENCE = [
  { text: 'J.A.R.V.I.S. BIOS v1.0 initializing...', delay: 100 },
  { text: 'Checking system memory...', delay: 500 },
  { text: '[OK] 64 ZB RAM', delay: 150 },
  { text: 'Loading AI Core...', delay: 300 },
  { text: 'Mounting neural network...', delay: 800 },
  { text: '[OK] Gemini 2.5 Flash Model loaded.', delay: 150 },
  { text: 'Initializing user interface...', delay: 600 },
  { text: '[OK] HUD ready.', delay: 150 },
  { text: 'Establishing secure connection to Stark Industries network...', delay: 1000 },
  { text: '[OK] Connection verified.', delay: 150 },
  { text: 'Loading HUD assets...', delay: 700 },
  { text: '[COMPLETE] All systems nominal.', delay: 200 },
];

interface BootingUpProps {
  onComplete: () => void;
  useCustomVideo: boolean;
  bootupAnimation: 'holographic' | 'video';
  sounds: ReturnType<typeof useSoundEffects>;
}

const DefaultBootAnimation: React.FC<{ onComplete: () => void, sounds: ReturnType<typeof useSoundEffects> }> = ({ onComplete, sounds }) => {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [sequenceComplete, setSequenceComplete] = useState(false);

  useEffect(() => {
    sounds.playActivate();
    const timers: number[] = [];
    let currentDelay = 0;
    
    BOOT_SEQUENCE.forEach((line, index) => {
      currentDelay += line.delay;
      // FIX: Use window.setTimeout to ensure it returns a number, resolving TypeScript conflicts with Node.js types.
      const timer = window.setTimeout(() => {
        setVisibleLines(prev => prev + 1);
        setProgress(((index + 1) / BOOT_SEQUENCE.length) * 100);
      }, currentDelay);
      timers.push(timer);
    });

    // FIX: Argument of type 'Timeout' is not assignable to parameter of type 'number'.
    const sequenceCompleteTimer = window.setTimeout(() => {
      setSequenceComplete(true);
    }, currentDelay + 500);
    timers.push(sequenceCompleteTimer);

    // FIX: Argument of type 'Timeout' is not assignable to parameter of type 'number'.
    const onCompleteTimer = window.setTimeout(() => {
      onComplete();
    }, currentDelay + 2500);
    timers.push(onCompleteTimer);

    // Cleanup function to clear all timers when the component unmounts
    return () => {
      timers.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className={`holographic-container boot transition-opacity duration-1000 ease-out ${sequenceComplete ? 'opacity-0' : 'opacity-100'}`}>
          <div className="holographic-element h-ring-1"></div>
          <div className="holographic-element h-ring-2"></div>
          <div className="holographic-element h-ring-3"></div>
          <div className="holographic-element h-ring-4"></div>
          <div className="holographic-element h-core"></div>
      </div>
      
      <div className={`absolute bottom-4 left-4 w-full max-w-md text-xs bg-black/30 p-2 border border-primary-t-20/50 rounded transition-opacity duration-1000 ease-out typewriter ${sequenceComplete ? 'opacity-0' : 'opacity-100'}`}>
        {BOOT_SEQUENCE.slice(0, visibleLines).map((line, i) => (
          <p key={i} style={{ animationDuration: `${Math.min(1, line.text.length / 40)}s` }}>
            &gt; {line.text}
          </p>
        ))}
      </div>
      
      <div className={`absolute bottom-4 right-4 w-full max-w-md transition-opacity duration-1000 ease-out ${sequenceComplete ? 'opacity-0' : 'opacity-100'}`}>
          <p className="text-right mb-1 text-sm tracking-widest">SYSTEM BOOT: {Math.round(progress)}%</p>
          <div className="w-full bg-primary-t-20 h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${progress}%`, transition: 'width 0.2s linear', boxShadow: '0 0 8px var(--primary-color-hex)' }}></div>
          </div>
       </div>

      <div className={`absolute transition-opacity duration-1000 ${sequenceComplete ? 'opacity-100' : 'opacity-0'}`}>
        <h1 
          className="font-orbitron text-7xl md:text-8xl lg:text-9xl text-primary glitch"
          data-text="J.A.R.V.I.S."
          style={{ textShadow: '0 0 20px var(--primary-color-hex)' }}
        >
          J.A.R.V.I.S.
        </h1>
        <p className="text-center text-xl md:text-2xl mt-4 tracking-widest animate-pulse">WELCOME, SIR.</p>
      </div>
    </>
  );
};


const BootingUp: React.FC<BootingUpProps> = ({ onComplete, useCustomVideo, bootupAnimation, sounds }) => {
  const [bootMode, setBootMode] = useState<'loading' | 'video' | 'holographic'>('loading');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadCustomVideo = async () => {
      try {
        const videoFile = await getVideo();
        if (videoFile) {
          objectUrl = URL.createObjectURL(videoFile);
          setVideoUrl(objectUrl);
          setBootMode('video');
        } else {
          // This can happen if DB is cleared or has an error after setting.
          console.warn("Custom boot video was selected but not found in storage. Falling back to holographic.");
          setBootMode('holographic');
        }
      } catch (error) {
        console.error("Failed to load custom boot video:", error);
        setBootMode('holographic'); // Fallback on any error
      }
    };

    if (bootupAnimation === 'video') {
      if (useCustomVideo) {
        setBootMode('loading');
        loadCustomVideo();
      } else {
        // This case should be prevented by the UI logic, but as a safeguard:
        console.warn("Video boot animation was selected without a custom video. Defaulting to holographic animation.");
        setBootMode('holographic');
      }
    } else {
      // bootupAnimation is 'holographic'
      setBootMode('holographic');
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [useCustomVideo, bootupAnimation]);


  const renderContent = () => {
    switch (bootMode) {
      case 'video':
        return (
          <video
            key={videoUrl} // Add key to force re-render if URL changes
            src={videoUrl!}
            autoPlay
            playsInline
            onEnded={onComplete}
            onError={(e) => {
              console.error("Boot video failed to play.", e);
              // If the video fails for any reason (e.g., corrupted file), fallback to holographic
              setBootMode('holographic');
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        );
      case 'holographic':
        return <DefaultBootAnimation onComplete={onComplete} sounds={sounds} />;
      case 'loading':
      default:
        return <p className="font-orbitron animate-pulse">LOADING CUSTOM ASSETS...</p>;
    }
  };


  return (
    <div className="fixed inset-0 bg-jarvis-dark text-primary font-mono flex items-center justify-center p-8 overflow-hidden animate-fade-in-fast">
      {renderContent()}
    </div>
  );
};

export default BootingUp;
