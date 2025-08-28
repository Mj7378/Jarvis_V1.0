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

const soundProfiles = {
    default: {
        playClick: () => playWebAudioSound({ frequency: 880, duration: 0.05, volume: 0.1 }),
        playActivate: () => playWebAudioSound({ type: 'sawtooth', frequency: 523.25, duration: 0.2, volume: 0.2, rampTo: 0.1 }),
        playDeactivate: () => playWebAudioSound({ type: 'sawtooth', frequency: 523.25, duration: 0.2, volume: 0.2, rampTo: 1.0 }),
        playError: () => playWebAudioSound({ type: 'square', frequency: 110, duration: 0.4, volume: 0.2 }),
        playSuccess: () => playWebAudioSound({ frequency: 659.25, duration: 0.2, volume: 0.2 }),
        playOpen: () => playWebAudioSound({ type: 'triangle', frequency: 392.00, duration: 0.15, volume: 0.15 }),
        playClose: () => playWebAudioSound({ type: 'triangle', frequency: 440.00, duration: 0.15, volume: 0.15 }),
    },
    futuristic: {
        playClick: () => playWebAudioSound({ type: 'sine', frequency: 1200, duration: 0.08, volume: 0.08, rampTo: 0.01 }),
        playActivate: () => playWebAudioSound({ type: 'sine', frequency: 600, duration: 0.4, volume: 0.15 }),
        playDeactivate: () => playWebAudioSound({ type: 'sine', frequency: 600, duration: 0.4, volume: 0.15, rampTo: 1.0 }),
        playError: () => playWebAudioSound({ type: 'sawtooth', frequency: 200, duration: 0.5, volume: 0.2, rampTo: 0.05 }),
        playSuccess: () => playWebAudioSound({ type: 'triangle', frequency: 1000, duration: 0.3, volume: 0.15 }),
        playOpen: () => playWebAudioSound({ type: 'sine', frequency: 700, duration: 0.2, volume: 0.1 }),
        playClose: () => playWebAudioSound({ type: 'sine', frequency: 800, duration: 0.2, volume: 0.1 }),
    },
    retro: {
        playClick: () => playWebAudioSound({ type: 'square', frequency: 1500, duration: 0.04, volume: 0.05 }),
        playActivate: () => playWebAudioSound({ type: 'square', frequency: 440, duration: 0.1, volume: 0.1 }),
        playDeactivate: () => playWebAudioSound({ type: 'square', frequency: 330, duration: 0.1, volume: 0.1 }),
        playError: () => playWebAudioSound({ type: 'square', frequency: 150, duration: 0.6, volume: 0.15 }),
        playSuccess: () => playWebAudioSound({ type: 'square', frequency: 880, duration: 0.2, volume: 0.1 }),
        playOpen: () => playWebAudioSound({ type: 'square', frequency: 660, duration: 0.08, volume: 0.08 }),
        playClose: () => playWebAudioSound({ type: 'square', frequency: 770, duration: 0.08, volume: 0.08 }),
    }
};

export const useSoundEffects = (enabled: boolean = true, profile: 'default' | 'futuristic' | 'retro' = 'default') => {
    const activeProfile = soundProfiles[profile] || soundProfiles.default;

    const playSound = useCallback((soundFunction: () => void) => {
        if (enabled) {
            soundFunction();
        }
    }, [enabled]);

    return useMemo(() => ({
        playClick: () => playSound(activeProfile.playClick),
        playActivate: () => playSound(activeProfile.playActivate),
        playDeactivate: () => playSound(activeProfile.playDeactivate),
        playError: () => playSound(activeProfile.playError),
        playSuccess: () => playSound(activeProfile.playSuccess),
        playOpen: () => playSound(activeProfile.playOpen),
        playClose: () => playSound(activeProfile.playClose),
    }), [playSound, activeProfile]);
};


export const useSpeechSynthesis = (profile = { rate: 1.1, pitch: 1.1 }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const voices = useRef<SpeechSynthesisVoice[]>([]);
    const synthRef = useRef(window.speechSynthesis);
    const speechQueueRef = useRef<string[]>([]);
    const isBusyRef = useRef(false);

    const populateVoiceList = useCallback(() => {
        voices.current = synthRef.current.getVoices();
    }, []);

    useEffect(() => {
        populateVoiceList();
        if (synthRef.current.onvoiceschanged !== undefined) {
            synthRef.current.onvoiceschanged = populateVoiceList;
        }
    }, [populateVoiceList]);

    const processQueue = useCallback(() => {
        if (isBusyRef.current || speechQueueRef.current.length === 0 || !synthRef.current) {
            return;
        }
        isBusyRef.current = true;
        setIsSpeaking(true);

        const text = speechQueueRef.current.shift();
        if (!text) {
             isBusyRef.current = false;
             setIsSpeaking(false);
             return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        const jarvisVoice = voices.current.find(v => v.lang === 'en-GB' && v.name.includes('Google') && (v as any).gender === 'male') 
            || voices.current.find(v => v.lang === 'en-US' && v.name.includes('Google') && (v as any).gender === 'male') 
            || voices.current.find(v => v.lang.startsWith('en') && v.name.includes('David')) 
            || voices.current.find(v => v.lang.startsWith('en-GB'));
        
        utterance.voice = jarvisVoice || voices.current.find(v => v.lang.startsWith('en')) || null;
        utterance.rate = profile.rate;
        utterance.pitch = profile.pitch;

        utterance.onend = () => {
            isBusyRef.current = false;
            if (speechQueueRef.current.length === 0) {
                setIsSpeaking(false);
            }
            processQueue();
        };
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            isBusyRef.current = false;
            if (speechQueueRef.current.length === 0) {
                setIsSpeaking(false);
            }
            processQueue();
        };

        synthRef.current.speak(utterance);
    }, [profile]);

    const queueSpeech = useCallback((text: string) => {
        if (!text.trim()) return;
        speechQueueRef.current.push(text);
        processQueue();
    }, [processQueue]);

    const cancel = useCallback(() => {
        speechQueueRef.current = [];
        isBusyRef.current = false;
        if(synthRef.current) {
            synthRef.current.cancel();
        }
        setIsSpeaking(false);
    }, []);

    return { queueSpeech, cancel, isSpeaking };
};