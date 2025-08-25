
import { useState, useEffect, useRef, useCallback } from 'react';

// For browser compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechRecognition = (options: { continuous?: boolean; interimResults?: boolean; onEnd?: (transcript: string) => void } = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    const recognitionRef = useRef<any>(null);
    const isManuallyStopped = useRef(false);

    // Refs to hold the latest transcript and onEnd callback to avoid stale closures
    const transcriptRef = useRef('');
    const onEndRef = useRef(options.onEnd);
    onEndRef.current = options.onEnd;

    useEffect(() => {
        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = options.continuous || false;
        recognition.interimResults = options.interimResults || false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const fullTranscript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result) => result.transcript)
                .join('');
            
            transcriptRef.current = fullTranscript;
            setTranscript(fullTranscript);
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'aborted') {
                // Ignore common, non-critical errors.
            } else if (event.error === 'audio-capture') {
                setError('Microphone is not available.');
            } else {
                setError(`Speech recognition error: ${event.error}`);
            }
        };
        
        recognition.onend = () => {
             // If continuous mode is on and it wasn't stopped manually, restart it.
             if (recognitionRef.current?.continuous && !isManuallyStopped.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                     // It might have been stopped for a reason (e.g., page hidden)
                     setIsListening(false);
                }
            } else {
                setIsListening(false);
                if (onEndRef.current) {
                    onEndRef.current(transcriptRef.current);
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            isManuallyStopped.current = true;
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    // The dependency array is critical. By removing `isListening`, we ensure the
    // recognition object is created only once per component mount, not on every state change.
    }, [options.continuous, options.interimResults]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                setError('');
                setTranscript('');
                transcriptRef.current = '';
                isManuallyStopped.current = false;
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Could not start recognition", e);
                setError('Could not start speech recognition.');
                setIsListening(false);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            isManuallyStopped.current = true;
            recognitionRef.current.stop();
            // onend will fire and set isListening to false
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        hasRecognitionSupport: !!SpeechRecognition,
        clearTranscript: () => {
            setTranscript('');
            transcriptRef.current = '';
        },
    };
};
