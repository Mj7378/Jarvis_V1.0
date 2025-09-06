import React, { useEffect, useState } from 'react';
import { CloseIcon } from './Icons';

interface SecurityCameraModalProps {
  location: string;
  onClose: () => void;
}

const SecurityCameraModal: React.FC<SecurityCameraModalProps> = ({ location, onClose }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    
    const formattedDate = time.toLocaleDateString('en-CA', { // YYYY-MM-DD format
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-fade-in-fast p-4">
      <div className="w-full h-full max-w-6xl max-h-[80vh] holographic-panel flex flex-col !p-2 md:!p-4 border-2 border-red-500/80">
        {/* Header */}
        <header className="flex justify-between items-center px-4 py-2 border-b border-red-500/30">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h2 className="font-orbitron text-lg text-red-400 uppercase tracking-widest">
                    LIVE FEED: {location}
                </h2>
            </div>
             <button onClick={onClose} className="p-1 rounded-full text-text-muted hover:text-red-400 hover:bg-red-500/20 transform hover:scale-110 active:scale-100 transition-all duration-200" aria-label="Close camera feed">
                <CloseIcon className="w-7 h-7"/>
            </button>
        </header>

        {/* Video Feed Area */}
        <div className="flex-1 bg-black relative overflow-hidden mt-2 rounded-md">
            {/* Placeholder for actual video/image. Using a noisy background. */}
            <div className="absolute inset-0 bg-slate-800 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
            
            <div className="scanline-overlay !opacity-20"></div>

            {/* OSD (On-Screen Display) */}
            <div className="absolute top-4 left-4 text-white font-mono text-sm">
                <p className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    <span>REC</span>
                </p>
                <p>STATUS: <span className="text-green-400">SECURE CONNECTION</span></p>
            </div>

            <div className="absolute bottom-4 right-4 text-white font-mono text-sm text-right">
                <p>{formattedDate}</p>
                <p className="text-lg">{formattedTime}</p>
            </div>

             <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-orbitron text-5xl text-white/10 select-none">NO SIGNAL</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityCameraModal;
