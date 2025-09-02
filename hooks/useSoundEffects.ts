

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


export const useSpeechSynthesis = (profile = { rate: 1.2, pitch: 1.0 }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const voices = useRef<SpeechSynthesisVoice[]>([]);
    const synthRef = useRef(window.speechSynthesis);
    const speechQueueRef = useRef<{ text: string, lang?: string }[]>([]);
    const isBusyRef = useRef(false);

    // Effect for setting up and tearing down the synthesis engine listeners
    useEffect(() => {
        const synth = synthRef.current;
        if (!synth) return;

        const loadVoices = () => {
            voices.current = synth.getVoices();
        };

        // Load voices initially. If they are not ready, `onvoiceschanged` will fire.
        loadVoices();
        synth.onvoiceschanged = loadVoices;

        // This keep-alive interval is a workaround for a bug in some browsers (like Chrome)
        // where the speech synthesis engine can go silent after a period of inactivity.
        const keepAliveInterval = setInterval(() => {
            if (synth && !synth.speaking && !synth.pending) {
                synth.resume();
            }
        }, 10000);

        // Cleanup function
        return () => {
            synth.onvoiceschanged = null;
            // Stop any speaking and clear queue on unmount
            synth.cancel();
            clearInterval(keepAliveInterval);
        };
    }, []);

    const processQueue = useCallback(() => {
        const synth = synthRef.current;
        // Don't process if already speaking, queue is empty, or synth isn't available
        if (isBusyRef.current || speechQueueRef.current.length === 0 || !synth) {
            return;
        }
        
        // A safeguard to ensure voices are loaded. Should rarely be needed with onvoiceschanged.
        if (voices.current.length === 0) {
            voices.current = synth.getVoices();
            if (voices.current.length === 0) {
                console.warn("Speech synthesis voices not ready, retrying...");
                setTimeout(processQueue, 250);
                return;
            }
        }
        
        isBusyRef.current = true;
        setIsSpeaking(true);

        const item = speechQueueRef.current.shift();
        if (!item) {
             isBusyRef.current = false;
             setIsSpeaking(false);
             return;
        }
        
        const { text, lang } = item;
        const utterance = new SpeechSynthesisUtterance(text);
        
        let selectedVoice: SpeechSynthesisVoice | null = null;
        
        if (lang) {
            // Find a voice that matches the language. Prioritize Google voices for quality.
            const langPrefix = lang.split('-')[0];
            selectedVoice = 
                voices.current.find(v => v.lang === lang && v.name.includes('Google') && v.name.includes('Male')) ||
                voices.current.find(v => v.lang === lang && v.name.includes('Google')) ||
                voices.current.find(v => v.lang.startsWith(langPrefix) && v.name.includes('Google')) ||
                voices.current.find(v => v.lang === lang) ||
                voices.current.find(v => v.lang.startsWith(langPrefix));
        }

        // Fallback to Jarvis default voice if no specific language voice is found or if no lang is provided
        if (!selectedVoice) {
            selectedVoice = 
                voices.current.find(v => v.lang === 'en-GB' && v.name.includes('Google') && v.name.includes('Male')) ||
                voices.current.find(v => v.lang === 'en-GB' && v.name.includes('Daniel')) ||
                voices.current.find(v => v.name.includes('Microsoft David')) ||
                voices.current.find(v => v.lang.startsWith('en-GB')) ||
                voices.current.find(v => v.lang === 'en-US' && v.name.includes('Google') && v.name.includes('Male')) ||
                voices.current.find(v => v.lang.startsWith('en') && v.name.includes('David')) ||
                voices.current.find(v => v.lang.startsWith('en'));
        }
        
        utterance.voice = selectedVoice || null;
        if (selectedVoice) {
            // Explicitly set utterance lang for better compatibility
            utterance.lang = selectedVoice.lang;
        }
        
        utterance.rate = profile.rate;
        utterance.pitch = profile.pitch;

        utterance.onend = () => {
            isBusyRef.current = false;
            // If the queue is now empty, update the speaking state
            if (speechQueueRef.current.length === 0) {
                setIsSpeaking(false);
            }
            // Process the next item
            processQueue();
        };

        utterance.onerror = (e) => {
            // 'interrupted' and 'canceled' are expected when the user speaks over J.A.R.V.I.S.
            // This is not a true "error" state, so we log it gently and let the `cancel` function handle state.
            if (e.error === 'interrupted' || e.error === 'canceled') {
                console.log(`Speech utterance was interrupted as expected.`);
                return; // The `cancel` function has already cleaned up state.
            }

            console.error(`An unexpected speech synthesis error occurred: ${e.error}`);
            isBusyRef.current = false;
            // Attempt to recover by processing the next item in the queue.
            if (speechQueueRef.current.length === 0) {
                setIsSpeaking(false);
            }
            processQueue();
        };

        synth.speak(utterance);
    }, [profile]);

    const queueSpeech = useCallback((text: string, lang?: string) => {
        if (!text.trim()) return;
        speechQueueRef.current.push({ text, lang });
        processQueue();
    }, [processQueue]);

    const cancel = useCallback(() => {
        speechQueueRef.current = [];
        if (synthRef.current) {
            // This will trigger the 'interrupted' error on the current utterance, which is handled above.
            synthRef.current.cancel();
        }
        isBusyRef.current = false;
        setIsSpeaking(false);
    }, []);

    return { queueSpeech, cancel, isSpeaking };
};
