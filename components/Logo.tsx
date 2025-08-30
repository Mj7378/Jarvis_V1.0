import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="w-48 h-12 text-primary">
      <svg viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>
            {`
              @keyframes draw-line {
                to {
                  stroke-dashoffset: 0;
                }
              }
              .draw-anim {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
                animation: draw-line 2s ease-out forwards;
              }
            `}
          </style>
        </defs>

        {/* HUD Elements */}
        <g stroke="currentColor" strokeWidth="0.75" fill="none" className="opacity-80">
          {/* Top and bottom lines */}
          <path d="M 5 5 L 195 5" className="draw-anim" style={{ animationDelay: '0s' }} />
          <path d="M 5 45 L 195 45" className="draw-anim" style={{ animationDelay: '0.2s' }} />

          {/* Left bracket */}
          <path d="M 15 5 L 5 15 V 35 L 15 45" className="draw-anim" style={{ animationDelay: '0.4s' }} />

          {/* Right bracket */}
          <path d="M 185 5 L 195 15 V 35 L 185 45" className="draw-anim" style={{ animationDelay: '0.4s' }} />
        </g>

        {/* Text */}
        <text
          x="50%"
          y="50%"
          dy=".3em"
          fontFamily="Orbitron, sans-serif"
          fontSize="24"
          fill="currentColor"
          textAnchor="middle"
          letterSpacing="2"
          filter="url(#neon-glow)"
          className="animate-text-flicker"
          style={{ textShadow: '0 0 5px currentColor, 0 0 10px currentColor' }}
        >
          J.A.R.V.I.S.
        </text>
      </svg>
    </div>
  );
};

export default Logo;
