
import React, { useState, useEffect, useMemo } from 'react';
import { generateStrategicBriefing } from '../services/geminiService';
import type { Source } from '../types';
import { StrategicBriefingIcon } from './Icons';
import SourceCitations from './SourceCitations';

interface StrategicBriefingModeProps {
  topic: string;
  onComplete: (summary: string, sources: Source[]) => void;
  onCancel: () => void;
}

interface BriefingSection {
    title: string;
    content: string;
}

const LoadingScreen: React.FC<{ topic: string }> = ({ topic }) => (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast">
        <div className="panel w-full max-w-2xl p-6 border-2 border-jarvis-cyan/50 shadow-2xl shadow-jarvis-cyan/20 text-center">
            <h1 className="font-orbitron text-2xl text-jarvis-cyan tracking-widest mb-2">INTEL SYNTHESIS ENGINE</h1>
            <p className="text-slate-300 mb-6 font-mono">SUBJECT: {topic}</p>
            <div className="relative w-full h-24 bg-slate-900/50 border border-jarvis-border rounded-md overflow-hidden p-2 font-mono text-xs text-green-400">
                 <p className="animate-pulse">ACCESSING GLOBAL INTELLIGENCE NETWORK...</p>
                 <p style={{animationDelay: '0.5s'}} className="animate-pulse">CROSS-REFERENCING SATELLITE IMAGERY...</p>
                 <p style={{animationDelay: '1s'}} className="animate-pulse">DECRYPTING SECURE CHANNELS...</p>
                 <p style={{animationDelay: '1.5s'}} className="animate-pulse">COMPILING THREAT ASSESSMENT...</p>
            </div>
            <p className="text-yellow-400 mt-4 animate-pulse font-mono">SYNTHESIZING BRIEFING...</p>
        </div>
    </div>
);

const BriefingSectionDisplay: React.FC<{ section: BriefingSection }> = ({ section }) => {
    const [isOpen, setIsOpen] = useState(true);
    // A simple markdown to HTML converter for lists
    const formattedContent = section.content
        .trim()
        .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1 list-disc">$1</li>')
        .replace(/(\r\n|\n|\r)/gm, '<br>') // handle line breaks
        .replace(/<br><li/g, '<li'); // fix line breaks before list items

    return (
        <div className="bg-slate-900/50 border border-jarvis-border rounded-lg mb-3 transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-slate-800/50 rounded-t-lg"
                 aria-expanded={isOpen}
            >
                <h2 className="font-orbitron text-lg text-blue-300">{section.title}</h2>
                <svg className={`w-6 h-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                 <div className="p-4 pt-0 text-slate-300 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedContent }} />
            </div>
        </div>
    );
};

const StrategicBriefingMode: React.FC<StrategicBriefingModeProps> = ({ topic, onComplete, onCancel }) => {
  const [briefing, setBriefing] = useState<string>('');
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const performAnalysis = async () => {
      try {
        const { content, sources } = await generateStrategicBriefing(topic);
        setBriefing(content);
        setSources(sources);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    performAnalysis();
  }, [topic]);

  const parsedSections = useMemo((): BriefingSection[] => {
      if (!briefing) return [];
      const sections = briefing.split('## ').filter(s => s.trim());
      return sections.map(sec => {
          const parts = sec.split('\n');
          const title = parts[0].replace(/##/g, '').trim();
          const content = parts.slice(1).join('\n');
          return { title, content };
      });
  }, [briefing]);

  const handleComplete = () => {
      const summary = `Generated strategic briefing on: ${topic}.`;
      onComplete(briefing, sources);
  };
  
  if (isLoading) {
    return <LoadingScreen topic={topic} />;
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <div className="panel w-full max-w-5xl h-[90vh] flex flex-col p-6 border-2 border-jarvis-cyan/50 shadow-2xl shadow-jarvis-cyan/20">
        <div className="flex justify-between items-center mb-4">
            <h1 className="font-orbitron text-xl text-jarvis-cyan tracking-widest truncate pr-4 flex items-center gap-3">
                <StrategicBriefingIcon className="w-6 h-6"/>
                STRATEGIC BRIEFING: {topic.toUpperCase()}
            </h1>
            <div className="flex gap-2">
                <button onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 flex-shrink-0">
                    Close
                </button>
                <button onClick={handleComplete} className="px-4 py-2 rounded-md bg-jarvis-cyan/80 text-jarvis-dark hover:bg-jarvis-cyan flex-shrink-0">
                    Log Report
                </button>
            </div>
        </div>
        
        {error ? <p className="text-red-400 text-center p-4 bg-red-900/50 rounded-md">{error}</p>
        : (
            <div className="flex-1 overflow-y-auto styled-scrollbar pr-2">
                {parsedSections.length > 0 ? (
                    parsedSections.map((section, index) => (
                        <BriefingSectionDisplay key={index} section={section} />
                    ))
                ) : (
                    <p className="text-slate-400">Could not parse briefing structure. Displaying raw data:</p>
                )}
                <div className="p-3 bg-slate-900/50 border border-jarvis-border rounded-lg">
                    {sources.length > 0 && <SourceCitations sources={sources} />}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StrategicBriefingMode;
