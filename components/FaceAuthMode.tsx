
import React, { useState, useRef, useEffect } from 'react';
import { verifyFaceMatch, checkForFace } from '../services/geminiService';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { getFaceProfile } from '../utils/db';

type AuthState = 'initializing' | 'scanning' | 'analyzing' | 'success' | 'failure';

interface FaceAuthModeProps {
  onComplete: (success: boolean) => void;
  onClose: () => void;
}

const FaceAuthMode: React.FC<FaceAuthModeProps> = ({ onComplete, onClose }) => {
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [error, setError] = useState<string>('');
  const [profileDataUrl, setProfileDataUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisInProgress = useRef(false);
  const sounds = useSoundEffects(true);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    
    const profile = getFaceProfile();
    if (!profile) {
      setError("Face profile could not be loaded. Please re-enroll.");
      setAuthState('failure');
      return;
    }
    setProfileDataUrl(profile);
    
    const startCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setAuthState('scanning'); 
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please ensure permissions are granted.");
        setAuthState('failure');
      }
    };

    startCamera();
    
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (authState !== 'scanning' || !profileDataUrl) {
      return;
    }

    const detectionInterval = setInterval(async () => {
      if (analysisInProgress.current || !videoRef.current || !canvasRef.current || !videoRef.current.srcObject) {
        return;
      }
      
      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0) {
          return;
      }

      analysisInProgress.current = true;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
        analysisInProgress.current = false;
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const liveDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const liveBase64 = liveDataUrl.split(',')[1];
      
      const faceFound = await checkForFace({ mimeType: 'image/jpeg', data: liveBase64 });

      if (faceFound) {
        clearInterval(detectionInterval);
        sounds.playClick();
        setAuthState('analyzing');
        
        const profileBase64 = profileDataUrl.split(',')[1];
        const isMatch = await verifyFaceMatch(
          { mimeType: 'image/jpeg', data: profileBase64 },
          { mimeType: 'image/jpeg', data: liveBase64 }
        );

        if (isMatch) {
          sounds.playSuccess();
          setAuthState('success');
        } else {
          sounds.playError();
          setError('Face does not match enrolled profile.');
          setAuthState('failure');
        }
      } else {
        analysisInProgress.current = false;
      }
    }, 2000);

    return () => clearInterval(detectionInterval);
  }, [authState, profileDataUrl, sounds]);

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
      case 'initializing': return 'INITIALIZING BIOMETRIC SCANNER...';
      case 'scanning': return 'SCANNING FOR FACE...';
      case 'analyzing': return 'ANALYZING BIOMETRICS...';
      case 'success': return 'AUTHENTICATION SUCCESSFUL';
      case 'failure': return 'AUTHENTICATION FAILED';
    }
  };

  const getSubText = () => {
     if (authState === 'success') return 'Welcome, Mahesh.';
     if (authState === 'failure') return error || 'Subject not recognized.';
     if (authState === 'scanning') return 'Please position your face in the frame.';
     return null;
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-30" />
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
