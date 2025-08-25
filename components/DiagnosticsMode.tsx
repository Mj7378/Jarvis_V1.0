import React, { useState, useEffect } from 'react';

const DIAG_STEPS = [
  { name: 'AI Core', duration: 1500, status: 'NOMINAL' },
  { name: 'Memory Banks', duration: 2000, status: 'OPTIMAL' },
  { name: 'Network Interface', duration: 1800, status: 'STABLE' },
  { name: 'Quantum Processor', duration: 2500, status: 'CALIBRATED' },
  { name: 'Energy Levels', duration: 1200, status: '100%' },
];

const DiagnosticItem: React.FC<{ name: string; status: 'pending' | 'scanning' | 'complete'; finalStatus: string; duration: number }> = ({ name, status, finalStatus, duration }) => {
    const [width, setWidth] = useState('0%');

    useEffect(() => {
        if (status === 'scanning') {
            const timer = setTimeout(() => setWidth('100%'), 50);
            return () => clearTimeout(timer);
        } else if (status === 'complete') {
            setWidth('100%');
        } else {
            setWidth('0%');
        }
    }, [status]);
    
    const getStatusColor = () => {
        if (status === 'complete') return 'text-green-400';
        if (status === 'scanning') return 'text-yellow-400';
        return 'text-slate-500';
    };

    return (
        <div className="flex items-center space-x-4 p-3 bg-slate-900/50 border border-jarvis-border rounded-lg">
            <div className="flex-1">
                <p className="font-orbitron text-slate-300">{name}</p>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-1 overflow-hidden">
                    <div 
                        className="bg-jarvis-cyan h-2 rounded-full"
                        style={{ 
                            width: width,
                            transition: `width ${duration}ms linear`,
                        }}
                    ></div>
                </div>
            </div>
            <div className={`font-orbitron text-sm w-28 text-right ${getStatusColor()}`}>
                {status === 'pending' && 'PENDING'}
                {status === 'scanning' && 'SCANNING...'}
                {status === 'complete' && finalStatus}
            </div>
        </div>
    );
};


const DiagnosticsMode: React.FC<{ onComplete: (summary: string) => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    const runDiagnostics = async () => {
        let summary = 'System Diagnostics Report:\n\n';
        for (let i = 0; i < DIAG_STEPS.length; i++) {
            setCurrentStep(i);
            await new Promise(resolve => setTimeout(resolve, DIAG_STEPS[i].duration));
            summary += `- ${DIAG_STEPS[i].name}: ${DIAG_STEPS[i].status}\n`;
        }
        
        setCurrentStep(DIAG_STEPS.length);

        await new Promise(resolve => setTimeout(resolve, 1500));
        onComplete(summary.trim());
    };
    
    const timer = setTimeout(runDiagnostics, 500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in">
      <div className="panel w-full max-w-2xl p-6 border-2 border-jarvis-cyan/50 shadow-2xl shadow-jarvis-cyan/20">
        <h1 className="font-orbitron text-2xl text-jarvis-cyan text-center tracking-widest mb-6">
          SYSTEM DIAGNOSTICS
        </h1>
        <div className="space-y-3">
            {DIAG_STEPS.map((step, index) => (
                <DiagnosticItem 
                    key={step.name}
                    name={step.name}
                    status={index < currentStep ? 'complete' : index === currentStep ? 'scanning' : 'pending'}
                    finalStatus={step.status}
                    duration={step.duration}
                />
            ))}
        </div>
        <p className="text-center mt-6 text-yellow-400 font-orbitron animate-pulse">
            {currentStep < DIAG_STEPS.length ? 'SCAN IN PROGRESS...' : 'SCAN COMPLETE'}
        </p>
      </div>
       <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
      `}</style>
    </div>
  );
};

export default DiagnosticsMode;
