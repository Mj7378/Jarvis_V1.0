import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeFaceForAuth } from '../services/geminiService';
import { useSoundEffects } from '../hooks/useSoundEffects';

type AuthState = 'scanning' | 'capturing' | 'analyzing' | 'success' | 'failure';

interface FaceAuthModeProps {
  onComplete: (success: boolean) => void;
  onClose: () => void;
}

const FaceAuthMode: React.FC<FaceAuthModeProps> = ({ onComplete, onClose }) => {
  const [authState, setAuthState] = useState<AuthState>('scanning');
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sounds = useSoundEffects(true); // Always enable sounds for this component for feedback

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please ensure permissions are granted.");
        setAuthState('failure');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCaptureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || authState !== 'scanning') return;

    sounds.playClick();
    setAuthState('capturing');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const base64Data = dataUrl.split(',')[1];
      
      setAuthState('analyzing');

      const success = await analyzeFaceForAuth({ mimeType: 'image/jpeg', data: base64Data });

      if (success) {
        sounds.playSuccess();
        setAuthState('success');
      } else {
        sounds.playError();
        setAuthState('failure');
      }
    }
  }, [authState, sounds]);

  useEffect(() => {
    if (authState === 'success' || authState === 'failure') {
      const timer = setTimeout(() => {
        onComplete(authState === 'success');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [authState, onComplete]);

  const getOverlayStateClasses = () => {
    switch(authState) {
      case 'analyzing': return 'border-yellow-400/80 animate-pulse';
      case 'success': return 'border-green-500/90 bg-green-500/20';
      case 'failure': return 'border-red-500/90 bg-red-500/20';
      default: return 'border-primary/50';
    }
  };

  const getStatusText = () => {
    switch(authState) {
      case 'scanning': return 'POSITION FACE IN FRAME';
      case 'capturing': return 'CAPTURING IMAGE...';
      case 'analyzing': return 'ANALYZING BIOMETRICS...';
      case 'success': return 'AUTHENTICATION SUCCESSFUL';
      case 'failure': return 'AUTHENTICATION FAILED';
    }
  };

  const getSubText = () => {
     if (authState === 'success') return 'Welcome, Mahesh.';
     if (authState === 'failure') return error || 'Subject not recognized.';
     return null;
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Face Scanning Overlay */}
      <div className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px]">
        <div className={`absolute inset-0 border-4 ${getOverlayStateClasses()} transition-all duration-300`}>
          {authState === 'scanning' || authState === 'analyzing' ? (
              <div className="absolute top-0 left-0 w-full h-2 bg-primary animate-scan-line opacity-50"></div>
          ) : null}
        </div>
        {/* Corner Brackets */}
        <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-white"></div>
        <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-white"></div>
        <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-white"></div>
        <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-white"></div>
      </div>
      
      <div className="text-center mt-8 font-orbitron text-white">
        <p className="text-2xl tracking-widest">{getStatusText()}</p>
        {getSubText() && <p className={`mt-2 text-lg ${authState === 'success' ? 'text-green-400' : 'text-red-400'}`}>{getSubText()}</p>}
      </div>

      <div className="absolute bottom-8 flex space-x-8">
        {authState === 'scanning' && (
          <button
            onClick={handleCaptureAndAnalyze}
            className="px-8 py-3 rounded-md bg-primary-t-80 text-background hover:bg-primary font-orbitron tracking-wider"
            aria-label="Authenticate"
          >
            AUTHENTICATE
          </button>
        )}
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 font-orbitron tracking-wider"
          aria-label="Close Authentication"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

export default FaceAuthMode;
