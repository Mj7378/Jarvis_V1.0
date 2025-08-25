import React, { useState, useEffect } from 'react';
import { analyzeUrlContent } from '../services/geminiService';
import type { CyberAnalysisResult, KeyEntity } from '../types';

interface CyberAnalystModeProps {
  url: string;
  onComplete: (summary: string) => void;
  onCancel: () => void;
}

const CyberAnalystMode: React.FC<CyberAnalystModeProps> = ({ url, onComplete, onCancel }) => {
  const [analysisResult, setAnalysisResult] = useState<CyberAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const performAnalysis = async () => {
      try {
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 95) {
                    clearInterval(interval);
                    return p;
                }
                return p + Math.random() * 5;
            });
        }, 300);

        const result = await analyzeUrlContent(url);
        clearInterval(interval);
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300)); // Short pause for effect
        setAnalysisResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
      } finally {
        setIsLoading(false);
      }
    };

    performAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const handleComplete = () => {
    if (analysisResult) {
        const summary = `Cyber analysis of ${url} complete.
- **Sentiment:** ${analysisResult.sentiment.label}
- **Reliability:** ${analysisResult.reliabilityScore}/100
- **Summary:** ${analysisResult.summary.substring(0, 100)}...`;
        onComplete(summary);
    } else {
        onCancel();
    }
  };
  
  const StatCard: React.FC<{ label: string; value: string | number; color: string; }> = ({ label, value, color }) => (
      <div className="bg-slate-900/50 border border-jarvis-border p-4 rounded-lg">
          <p className="text-sm text-slate-400 font-orbitron">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
  );
  
  const EntityTag: React.FC<{ entity: KeyEntity }> = ({ entity }) => {
    const typeColor = {
        'PERSON': 'bg-blue-500/30 text-blue-300 border-blue-500/50',
        'ORGANIZATION': 'bg-green-500/30 text-green-300 border-green-500/50',
        'LOCATION': 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
        'DEFAULT': 'bg-slate-500/30 text-slate-300 border-slate-500/50',
    }[entity.type.toUpperCase()] || 'bg-slate-500/30 text-slate-300 border-slate-500/50';
    
    return (
        <div className={`inline-flex items-center gap-2 py-1 px-2 rounded-md border text-sm ${typeColor}`}>
            <span className="font-bold opacity-80">{entity.type}</span>
            <span className="font-medium">{entity.name}</span>
        </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in">
        <div className="panel w-full max-w-2xl p-6 border-2 border-jarvis-cyan/50 shadow-2xl shadow-jarvis-cyan/20 text-center">
            <h1 className="font-orbitron text-2xl text-jarvis-cyan tracking-widest mb-6">CYBER ANALYSIS IN PROGRESS</h1>
            <p className="text-slate-300 mb-4 truncate">TARGET: {url}</p>
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden border border-jarvis-border">
                <div className="bg-jarvis-cyan h-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
            </div>
            <p className="text-yellow-400 mt-4 animate-pulse">BREACHING FIREWALLS... EXTRACTING DATA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in">
      <div className="panel w-full max-w-5xl h-[90vh] flex flex-col p-6 border-2 border-jarvis-cyan/50 shadow-2xl shadow-jarvis-cyan/20">
        <div className="flex justify-between items-center mb-4">
            <h1 className="font-orbitron text-xl text-jarvis-cyan tracking-widest truncate pr-4">ANALYSIS: {analysisResult?.title || url}</h1>
            <button onClick={handleComplete} className="px-4 py-2 rounded-md bg-jarvis-cyan/80 text-jarvis-dark hover:bg-jarvis-cyan flex-shrink-0">
              Close Report
            </button>
        </div>
        
        {error && <p className="text-red-400 text-center p-4 bg-red-900/50 rounded-md">{error}</p>}

        {analysisResult && (
            <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
                <div className="col-span-2 flex flex-col gap-4 overflow-hidden">
                    <div className="bg-slate-900/50 border border-jarvis-border p-4 rounded-lg flex-1 overflow-y-auto styled-scrollbar">
                        <h2 className="font-orbitron text-lg text-blue-300 mb-2">Executive Summary</h2>
                        <p className="text-slate-300 whitespace-pre-wrap">{analysisResult.summary}</p>
                    </div>
                     <div className="bg-slate-900/50 border border-jarvis-border p-4 rounded-lg h-1/3 overflow-y-auto styled-scrollbar">
                        <h2 className="font-orbitron text-lg text-blue-300 mb-2">Key Entities Extracted</h2>
                         <div className="flex flex-wrap gap-2">
                             {analysisResult.keyEntities.map((entity, i) => <EntityTag key={i} entity={entity} />)}
                         </div>
                    </div>
                </div>

                <div className="col-span-1 flex flex-col gap-4">
                    <StatCard label="Sentiment Analysis" value={analysisResult.sentiment.label} color={analysisResult.sentiment.score > 0.2 ? 'text-green-400' : analysisResult.sentiment.score < -0.2 ? 'text-red-400' : 'text-yellow-400'} />
                    <StatCard label="Reliability Score" value={`${analysisResult.reliabilityScore}/100`} color={analysisResult.reliabilityScore > 75 ? 'text-green-400' : analysisResult.reliabilityScore < 40 ? 'text-red-400' : 'text-yellow-400'} />
                </div>
            </div>
        )}
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

export default CyberAnalystMode;
