
import React from 'react';

const ThinkingAnimation: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="relative w-24 h-24 text-yellow-400 animate-pulse-brain">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Brain outline */}
                    <path 
                        d="M50 10 C 20 10, 20 40, 50 40 S 80 10, 50 10 Z" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                    />
                    <path 
                        d="M50 40 C 20 40, 20 70, 50 70 S 80 40, 50 40 Z" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                    />
                    <path 
                        d="M50 70 C 20 70, 20 100, 50 100 S 80 70, 50 70 Z" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className="opacity-50"
                    />
                    {/* Neural pathways */}
                    {[...Array(8)].map((_, i) => (
                        <circle 
                            key={i}
                            cx={50 + 30 * Math.cos(i * Math.PI / 4)} 
                            cy={55 + 30 * Math.sin(i * Math.PI / 4)} 
                            r="2" 
                            fill="currentColor"
                            className="animate-pulse-dot"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </svg>
            </div>
        </div>
    );
};

export default ThinkingAnimation;
