
import React, { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { streamTranslateText } from '../services/geminiService';
import { UniversalTranslatorIcon } from './Icons';
import AudioVisualizer from './AudioVisualizer';

interface UniversalTranslatorProps {
  onClose: () => void;
  audioStream: MediaStream | null;
}

const UniversalTranslator: React.FC<UniversalTranslatorProps> = ({ onClose, audioStream }) => {
  const { isListening, transcript, startListening, stopListening, clearTranscript } = useSpeechRecognition({ continuous: true, interimResults: true });
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const speechEndTimer = useRef<number | null>(null);

  useEffect(() => {
    // Immediately start listening when component mounts
    startListening();
    
    // Cleanup on unmount
    return () => {
      stopListening();
      if (speechEndTimer.current) clearTimeout(speechEndTimer.current);
      window.speechSynthesis.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State for sentence-by-sentence speech synthesis
  const speakQueue = useRef<string[]>([]);
  const isSpeaking = useRef(false);
  const lastSpokenSentence = useRef("");

  const processSpeakQueue = () => {
    if (isSpeaking.current || speakQueue.current.length === 0) return;

    isSpeaking.current = true;
    const textToSpeak = speakQueue.current.shift();
    if (!textToSpeak) {
        isSpeaking.current = false;
        return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.voice = window.speechSynthesis.getVoices().find(v => v.name.includes('Google') && v.name.includes('Male')) || window.speechSynthesis.getVoices()[0];
    utterance.pitch = 1.1;
    utterance.rate = 1.2;
    utterance.onend = () => {
      isSpeaking.current = false;
      processSpeakQueue();
    };
    utterance.onerror = () => {
      console.error("Speech synthesis error");
      isSpeaking.current = false;
      processSpeakQueue(); // Try next item in queue
    };
    window.speechSynthesis.speak(utterance);
  };

  const streamAndTranslate = async (text: string) => {
    if (!text.trim()) return;
    setIsTranslating(true);
    setTranslatedText('');
    lastSpokenSentence.current = "";

    try {
        const stream = await streamTranslateText(text);
        let currentResponse = "";

        for await (const chunk of stream) {
            currentResponse += chunk.text;
            setTranslatedText(currentResponse);

            // Find the last complete sentence that hasn't been spoken
            const sentenceEnd = currentResponse.lastIndexOf('.');
            if (sentenceEnd > -1) {
                const sentence = currentResponse.substring(0, sentenceEnd + 1);
                const newPart = sentence.replace(lastSpokenSentence.current, "").trim();
                if (newPart) {
                    speakQueue.current.push(newPart);
                    processSpeakQueue();
                    lastSpokenSentence.current = sentence;
                }
            }
        }
        
        // Speak any remaining part after the stream ends
        const remainingText = currentResponse.replace(lastSpokenSentence.current, "").trim();
        if (remainingText) {
            speakQueue.current.push(remainingText);
            processSpeakQueue();
        }

    } catch (error) {
        console.error("Translation failed", error);
        setTranslatedText("Translation Error");
    } finally {
        setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (transcript) {
        if (speechEndTimer.current) clearTimeout(speechEndTimer.current);

        // Set a timer to detect a pause in speech
        speechEndTimer.current = window.setTimeout(() => {
            streamAndTranslate(transcript);
            clearTranscript();
        }, 1200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);


  return (
    <div className="fixed inset-0 bg-jarvis-dark/90 z-40 flex flex-col items-center justify-center backdrop-blur-md animate-fade-in-fast">
      <div className="absolute top-5 right-5">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80">
              Deactivate
          </button>
      </div>
      
      <div className="w-full max-w-4xl text-center">
        <h1 className="font-orbitron text-3xl text-jarvis-cyan tracking-widest mb-4 flex items-center justify-center gap-4">
            <UniversalTranslatorIcon className="w-8 h-8"/>
            UNIVERSAL TRANSLATOR ACTIVE
        </h1>
        <div className="h-16 flex items-center justify-center mb-8">
            {isListening && audioStream ? 
                <div className="w-48 h-full">
                    <AudioVisualizer stream={audioStream} />
                </div>
                : <p className="font-orbitron text-lg text-yellow-400">INITIALIZING AUDIO MATRIX...</p>
            }
        </div>
        
        <div className="grid grid-cols-2 gap-6 text-left">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-jarvis-border min-h-[150px]">
                <h2 className="font-orbitron text-blue-300 mb-2">INCOMING AUDIO (DETECTED)</h2>
                <p className="text-xl text-slate-200">{transcript || 'Awaiting input...'}</p>
            </div>
             <div className="bg-slate-800/50 p-4 rounded-lg border border-jarvis-border min-h-[150px]">
                <h2 className="font-orbitron text-green-400 mb-2">LIVE TRANSLATION (ENGLISH)</h2>
                <p className="text-xl text-slate-100 font-medium">
                    {isTranslating && !translatedText ? <span className="animate-pulse">Translating...</span> : translatedText || '...'}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalTranslator;
