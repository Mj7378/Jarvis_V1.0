import React, { useState } from 'react';
import { generateTripPlan } from '../services/geminiService';
import { TripPlannerIcon } from './Icons';

interface MissionControlProps {
  onComplete: (summary: string) => void;
  onCancel: () => void;
}

const MissionControl: React.FC<MissionControlProps> = ({ onComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    travelers: '',
    budget: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const canSubmit = Object.values(formData).every(field => field.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError('');
    setResult('');
    try {
      const plan = await generateTripPlan(formData);
      setResult(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleComplete = () => {
    const summary = `Trip plan generated for ${formData.destination}. Itinerary includes details for ${formData.travelers} traveler(s) from ${formData.startDate} to ${formData.endDate}.`;
    onComplete(summary);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center backdrop-blur-sm animate-fade-in">
      <div className="panel w-full max-w-4xl h-[90vh] flex flex-col p-6 border-2 border-jarvis-cyan/50 shadow-2xl shadow-jarvis-cyan/20">
        <div className="flex justify-between items-center mb-6">
            <h1 className="font-orbitron text-2xl text-jarvis-cyan tracking-widest flex items-center gap-3">
                <TripPlannerIcon className="w-8 h-8"/>
                MISSION CONTROL: TRIP PLANNER
            </h1>
             <button
              type="button"
              onClick={result ? handleComplete : onCancel}
              className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 transition-colors"
            >
              {result ? 'Complete Mission' : 'Cancel'}
            </button>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Left Side: Form */}
            <div className="w-1/3 flex-shrink-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="destination" className="block text-sm font-medium text-slate-300 mb-1">Destination</label>
                        <input type="text" id="destination" value={formData.destination} onChange={handleInputChange} placeholder="e.g., Paris, France" required className="w-full bg-slate-800/80 border border-jarvis-border rounded-md p-2 focus:ring-2 focus:ring-jarvis-cyan focus:outline-none text-slate-200" />
                    </div>
                     <div className="flex gap-4">
                        <div className="w-1/2">
                            <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                            <input type="date" id="startDate" value={formData.startDate} onChange={handleInputChange} required className="w-full bg-slate-800/80 border border-jarvis-border rounded-md p-2 focus:ring-2 focus:ring-jarvis-cyan focus:outline-none text-slate-200" />
                        </div>
                        <div className="w-1/2">
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
                            <input type="date" id="endDate" value={formData.endDate} onChange={handleInputChange} required className="w-full bg-slate-800/80 border border-jarvis-border rounded-md p-2 focus:ring-2 focus:ring-jarvis-cyan focus:outline-none text-slate-200" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="travelers" className="block text-sm font-medium text-slate-300 mb-1">Number of Travelers</label>
                        <input type="number" id="travelers" min="1" value={formData.travelers} onChange={handleInputChange} placeholder="e.g., 2" required className="w-full bg-slate-800/80 border border-jarvis-border rounded-md p-2 focus:ring-2 focus:ring-jarvis-cyan focus:outline-none text-slate-200" />
                    </div>
                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-slate-300 mb-1">Budget (USD)</label>
                        <input type="text" id="budget" value={formData.budget} onChange={handleInputChange} placeholder="e.g., $5000" required className="w-full bg-slate-800/80 border border-jarvis-border rounded-md p-2 focus:ring-2 focus:ring-jarvis-cyan focus:outline-none text-slate-200" />
                    </div>
                    <div className="pt-4">
                        <button type="submit" disabled={!canSubmit || isLoading} className="w-full px-4 py-3 rounded-md bg-jarvis-cyan/80 text-jarvis-dark font-bold hover:bg-jarvis-cyan disabled:opacity-50 transition-colors">
                            {isLoading ? 'Generating Plan...' : 'Generate Itinerary'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Right Side: Result */}
            <div className="flex-1 bg-slate-900/50 border border-jarvis-border rounded-lg overflow-y-auto styled-scrollbar">
                <div className="p-4">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                           <svg className="w-12 h-12 animate-spin text-jarvis-cyan mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="font-orbitron">ANALYSING POSSIBILITIES...</p>
                            <p className="text-sm">Contacting global networks and compiling optimal routes.</p>
                        </div>
                    )}
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {result && (
                        <div className="whitespace-pre-wrap text-slate-200" dangerouslySetInnerHTML={{ __html: result.replace(/### (.*)/g, '<h3 class="font-orbitron text-jarvis-cyan text-lg mt-4 mb-2">$1</h3>') }} />
                    )}
                    {!isLoading && !error && !result && (
                         <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <p className="font-orbitron text-lg">Awaiting Directives</p>
                            <p>Complete the mission parameters to generate an itinerary.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
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

export default MissionControl;
