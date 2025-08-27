import React, { useState, useEffect } from 'react';

const SHUTDOWN_SEQUENCE = [
  { text: 'System shutdown sequence initiated.', delay: 100 },
  { text: 'Closing all active processes...', delay: 800 },
  { text: 'De-allocating system memory...', delay: 600 },
  { text: 'Disconnecting from Stark Industries network...', delay: 1000 },
  { text: 'Powering down AI Core...', delay: 800 },
  { text: 'Goodbye, Sir.', delay: 500 },
];

const Shutdown: React.FC = () => {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [animationState, setAnimationState] = useState<'deconstructing' | 'fading'>('deconstructing');

  useEffect(() => {
    let currentDelay = 0;
    SHUTDOWN_SEQUENCE.forEach((line) => {
      currentDelay += line.delay;
      setTimeout(() => {
        setVisibleLines(prev => prev + 1);
      }, currentDelay);
    });

    setTimeout(() => {
      setAnimationState('fading');
    }, currentDelay + 2000);
  }, []);

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
            // Use an inline style to make the glitch background transparent, so it doesn't block the view
            style={{'--jarvis-dark': 'transparent', textShadow: '0 0 20px #ff0000'} as React.CSSProperties}
          >
              SYSTEM OFFLINE
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Shutdown;