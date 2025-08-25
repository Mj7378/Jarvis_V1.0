
import React from 'react';

interface HudProps {
  children: React.ReactNode;
}

const Hud: React.FC<HudProps> = ({ children }) => {
  return (
    <div className="w-full max-w-4xl h-[95vh] max-h-[800px] bg-slate-900/70 backdrop-blur-sm border-2 border-cyan-400/50 rounded-lg shadow-2xl shadow-cyan-500/10 overflow-hidden relative">
      {/* Corner brackets for aesthetic */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-300 rounded-tl-lg"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-300 rounded-tr-lg"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-300 rounded-bl-lg"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-300 rounded-br-lg"></div>
      
      {children}
    </div>
  );
};

export default Hud;
