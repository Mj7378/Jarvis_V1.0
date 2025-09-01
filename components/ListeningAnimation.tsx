
import React from 'react';

const ListeningAnimation: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative w-24 h-24">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary opacity-50 animate-ping-slow"
            style={{
              animationDelay: `${i * 0.5}s`,
              animationDuration: '2s'
            }}
          />
        ))}
        <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse-strong" />
      </div>
    </div>
  );
};

export default ListeningAnimation;
