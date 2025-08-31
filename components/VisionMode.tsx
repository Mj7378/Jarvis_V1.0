
import React, { useRef, useEffect, useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { MicrophoneIcon } from './Icons';

interface VisionModeProps {
  onCapture: (imageDataUrl: string) => void;
  onCaptureWithPrompt: (imageDataUrl: string, prompt: string) => void;
  onClose: () => void;
}

const VisionMode: React.FC<VisionModeProps> = ({ onCapture, onCaptureWithPrompt, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [isHolding, setIsHolding] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  const handleTranscript = (transcript: string) => {
    // Only process transcript if it was from a long-press action and is not empty
    if (transcript && isHolding) {
      captureAndSendWithPrompt(transcript);
    }
    setIsHolding(false); // Reset hold state regardless
  };
  
  const { isListening, startListening, stopListening } = useSpeechRecognition({ onEnd: handleTranscript });

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please ensure permissions are granted.");
      }
    };

    startCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      // Ensure listening stops if component is closed while listening
      stopListening();
      if(longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      return canvas.toDataURL('image/jpeg', 0.9);
    }
    return null;
  };

  const handleSimpleCapture = () => {
    const dataUrl = captureFrame();
    if (dataUrl) {
      onCapture(dataUrl);
    }
  };

  const captureAndSendWithPrompt = (prompt: string) => {
    const dataUrl = captureFrame();
    if (dataUrl) {
      onCaptureWithPrompt(dataUrl, prompt);
    }
  };
  
  const handleButtonPress = () => {
    // Set a timer to detect a long press
    longPressTimer.current = window.setTimeout(() => {
        setIsHolding(true);
        startListening();
    }, 250); // 250ms qualifies as a long press
  };
  
  const handleButtonRelease = () => {
    // Clear the long press timer
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }

    if (isHolding) { // If it was a long press, stop listening
        stopListening();
    } else { // If it was a short tap, perform a simple capture
        handleSimpleCapture();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-fade-in-fast">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
      <canvas ref={canvasRef} className="hidden" />
      
      {error && (
        <div className="absolute top-4 bg-red-800/80 text-white p-4 rounded-md">{error}</div>
      )}

      {isListening && (
        <div className="absolute inset-0 border-8 border-primary rounded-2xl animate-pulse-glow pointer-events-none">
            <div className="absolute bottom-40 left-1/2 -translate-x-1/2 text-center">
                <p className="font-orbitron text-2xl text-white drop-shadow-lg animate-text-flicker">Listening...</p>
            </div>
        </div>
      )}

      <div className="absolute bottom-8 flex items-center justify-center w-full gap-8">
        <button
          onClick={onClose}
          className="w-16 h-16 rounded-full bg-slate-500/80 border-4 border-white flex items-center justify-center text-white transform hover:scale-110 active:scale-105 transition-transform duration-200"
          aria-label="Close Vision Mode"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <div className="relative">
             <button
              onMouseDown={handleButtonPress}
              onMouseUp={handleButtonRelease}
              onTouchStart={handleButtonPress}
              onTouchEnd={handleButtonRelease}
              className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center text-white transform hover:scale-110 active:scale-105 transition-all duration-200 ${isListening ? 'bg-red-500 animate-pulse-strong' : 'bg-primary-t-80'}`}
              aria-label="Tap to capture, hold to speak and analyze"
              disabled={!!error}
            >
                {isListening ? (
                    <MicrophoneIcon className="w-12 h-12" />
                ) : (
                    <div className="w-16 h-16 flex items-center justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                )}
            </button>
            {!isListening && (
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-max text-center text-white text-xs font-sans bg-black/40 px-2 py-1 rounded-md pointer-events-none">
                    <p>Tap to Capture</p>
                    <p className="font-bold">Hold to Speak</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VisionMode;
