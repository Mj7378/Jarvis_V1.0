import { useMemo, useCallback, useState, useEffect, useRef } from 'react';

const playWebAudioSound = (config: {
    type?: OscillatorType,
    frequency: number,
    duration: number,
    volume?: number,
    rampTo?: number
}) => {
    try {
        const { type = 'sine', frequency, duration, volume = 0.5, rampTo = 0.0001 } = config;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(rampTo, audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.error("Could not play sound", e);
    }
};

export const useSoundEffects = (enabled: boolean = true) => {
    const playSound = useCallback((config: any) => {
        if (enabled) {
            playWebAudioSound(config);
        }
    }, [enabled]);

    return useMemo(() => ({
        playClick: () => playSound({ frequency: 880, duration: 0.05, volume: 0.1 }),
        playActivate: () => playSound({ type: 'sawtooth', frequency: 523.25, duration: 0.2, volume: 0.2, rampTo: 0.1 }),
        playDeactivate: () => playSound({ type: 'sawtooth', frequency: 523.25, duration: 0.2, volume: 0.2, rampTo: 1.0 }),
        playError: () => playSound({ type: 'square', frequency: 110, duration: 0.4, volume: 0.2 }),
        playSuccess: () => playSound({ frequency: 659.25, duration: 0.2, volume: 0.2 }),
        playOpen: () => playSound({ type: 'triangle', frequency: 392.00, duration: 0.15, volume: 0.15 }),
        playClose: () => playSound({ type: 'triangle', frequency: 440.00, duration: 0.15, volume: 0.15 }),
    }), [playSound]);
};


export const useSpeechSynthesis = (profile = { rate: 1.1, pitch: 1.1 }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const synthRef = useRef(window.speechSynthesis);

    const populateVoiceList = useCallback(() => {
        const newVoices = synthRef.current.getVoices();
        setVoices(newVoices);
    }, []);

    useEffect(() => {
        populateVoiceList();
        if (synthRef.current.onvoiceschanged !== undefined) {
            synthRef.current.onvoiceschanged = populateVoiceList;
        }
    }, [populateVoiceList]);

    const speak = useCallback((text: string) => {
        if (!text || isSpeaking || !synthRef.current) return;

        synthRef.current.cancel(); // Cancel any previous speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        // Try to find a J.A.R.V.I.S.-like voice (e.g., UK English Male)
        // Fix: The 'gender' property is non-standard. Cast to 'any' to prevent TypeScript errors.
        const jarvisVoice = voices.find(v => v.lang === 'en-GB' && v.name.includes('Google') && (v as any).gender === 'male') 
            || voices.find(v => v.lang === 'en-US' && v.name.includes('Google') && (v as any).gender === 'male') 
            || voices.find(v => v.lang.startsWith('en') && v.name.includes('David')) 
            || voices.find(v => v.lang.startsWith('en-GB'));
        
        utterance.voice = jarvisVoice || voices.find(v => v.lang.startsWith('en')) || null;
        
        utterance.rate = profile.rate;
        utterance.pitch = profile.pitch;

        synthRef.current.speak(utterance);
    }, [isSpeaking, voices, profile]);

    const cancel = useCallback(() => {
        if(synthRef.current) {
            synthRef.current.cancel();
        }
        setIsSpeaking(false);
    }, []);

    return { speak, cancel, isSpeaking };
};