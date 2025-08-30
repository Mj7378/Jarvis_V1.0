
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

  const getRingColor = () => {
    switch(authState) {
      case 'analyzing': return 'border-yellow-400/80';
      case 'success': return 'border-green-500/90';
      case 'failure': return 'border-red-500/90';
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
     if (authState === 'success') return 'Welcome, Sir.';
     if (authState === 'failure') return error || 'Subject not recognized.';
     if (authState === 'scanning') return 'Please position your face in the frame.';
     return null;
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <canvas ref={canvasRef} className="hidden" />

      {/* Face Scanning Overlay */}
      <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex items-center justify-center">
        {/* Animated rings */}
        <div className={`absolute inset-0 rounded-full border-2 ${getRingColor()} transition-all duration-500 animate-spin-slow`}></div>
        <div className={`absolute inset-[10%] rounded-full border-2 ${getRingColor()} transition-all duration-500 animate-spin-medium opacity-75`}></div>
        <div className={`absolute inset-[20%] rounded-full border ${getRingColor()} transition-all duration-500 animate-spin-fast opacity-50`}></div>

        {/* Video Feed */}
        <div className="w-[80%] h-[80%] rounded-full overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-2 border-black/50">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-[1.5]" />
        </div>
        
        {/* Scan Line */}
        {authState === 'scanning' || authState === 'analyzing' ? (
              <div className="absolute top-0 left-[10%] w-[80%] h-full overflow-hidden rounded-full">
                  <div className="absolute top-0 left-0 w-full h-2 bg-primary animate-scan-line opacity-50 shadow-[0_0_15px_var(--primary-color-hex)]"></div>
              </div>
          ) : null}
          
        {/* Success/Failure Icon */}
        {authState === 'success' && <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 rounded-full animate-pop-in-center"><svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>}
        {authState === 'failure' && <div className="absolute inset-0 flex items-center justify-center bg-red-500/30 rounded-full animate-pop-in-center"><svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>}
      </div>
      
      <div className="text-center mt-8 font-orbitron text-white">
        <p className="text-2xl tracking-widest">{getStatusText()}</p>
        {getSubText() && <p className={`mt-2 text-lg ${authState === 'success' ? 'text-green-400' : authState === 'failure' ? 'text-red-400' : 'text-slate-300'}`}>{getSubText()}</p>}
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
