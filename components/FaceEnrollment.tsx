
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { checkForFace } from '../services/geminiService';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { saveFaceProfile } from '../utils/db';

type EnrollmentState = 'idle' | 'scanning' | 'capturing' | 'analyzing' | 'success' | 'failure';

interface FaceEnrollmentProps {
  onComplete: (success: boolean) => void;
  onClose: () => void;
  isBootSequence?: boolean;
}

const FaceEnrollment: React.FC<FaceEnrollmentProps> = ({ onComplete, onClose, isBootSequence = false }) => {
  const [enrollState, setEnrollState] = useState<EnrollmentState>('idle');
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sounds = useSoundEffects(true);
  
  const startCamera = useCallback(async () => {
    // If stream already exists, no need to start again
    if (stream) return;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setEnrollState('scanning');
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Could not access camera. Please ensure permissions are granted.");
      setEnrollState('failure');
    }
  }, [stream]);
  
  useEffect(() => {
    // Automatically start the camera if it's the boot sequence
    if (isBootSequence) {
        startCamera();
    }
    // Cleanup stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isBootSequence, startCamera, stream]);

  const handleCaptureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || enrollState !== 'scanning') return;

    sounds.playClick();
    setEnrollState('capturing');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const base64Data = dataUrl.split(',')[1];
      
      setEnrollState('analyzing');

      const hasClearFace = await checkForFace({ mimeType: 'image/jpeg', data: base64Data });

      if (hasClearFace) {
        saveFaceProfile(dataUrl);
        sounds.playSuccess();
        setEnrollState('success');
      } else {
        sounds.playError();
        setError("No clear face detected. Please try again with better lighting.");
        setEnrollState('failure');
      }
    }
  }, [enrollState, sounds]);

  useEffect(() => {
    if (enrollState === 'success') {
      const timer = setTimeout(() => { onComplete(true); }, 2000);
      return () => clearTimeout(timer);
    }
    if (enrollState === 'failure') {
      const timer = setTimeout(() => { setEnrollState('scanning'); }, 2500);
      return () => clearTimeout(timer);
    }
  }, [enrollState, onComplete]);
  
    const getRingColor = () => {
        switch(enrollState) {
        case 'analyzing': return 'border-yellow-400/80';
        case 'success': return 'border-green-500/90';
        case 'failure': return 'border-red-500/90';
        default: return 'border-primary/50';
        }
    };

    const getStatusText = () => {
        switch(enrollState) {
        case 'idle': return 'FACIAL RECOGNITION SETUP';
        case 'scanning': return 'ENROLL FACE PROFILE';
        case 'capturing': return 'CAPTURING IMAGE...';
        case 'analyzing': return 'ANALYZING IMAGE QUALITY...';
        case 'success': return 'PROFILE SAVED';
        case 'failure': return 'ENROLLMENT FAILED';
        }
    };
    
    const getSubText = () => {
        if (enrollState === 'success') return 'You can now use Face ID to log in.';
        if (enrollState === 'failure') return error;
        if (enrollState === 'scanning') return "Position your face in the center of the frame.";
        return "Enroll a facial profile for quick and secure system access.";
    }


  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in-fast p-4">
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
        {enrollState === 'scanning' || enrollState === 'analyzing' ? (
              <div className="absolute top-0 left-[10%] w-[80%] h-full overflow-hidden rounded-full">
                  <div className="absolute top-0 left-0 w-full h-2 bg-primary animate-scan-line opacity-50 shadow-[0_0_15px_var(--primary-color-hex)]"></div>
              </div>
          ) : null}
          
        {/* Success/Failure Icon */}
        {enrollState === 'success' && <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 rounded-full animate-pop-in-center"><svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>}
        {enrollState === 'failure' && <div className="absolute inset-0 flex items-center justify-center bg-red-500/30 rounded-full animate-pop-in-center"><svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>}
      </div>
      
      <div className="text-center mt-8 font-orbitron text-white max-w-md">
        <p className="text-2xl tracking-widest">{getStatusText()}</p>
        <p className={`mt-2 text-base ${enrollState === 'failure' ? 'text-red-400' : 'text-slate-300'}`}>{getSubText()}</p>
      </div>

      <div className="absolute bottom-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
        {enrollState === 'idle' && (
           <button
            onClick={startCamera}
            className="px-8 py-3 rounded-md bg-primary-t-80 text-background hover:bg-primary font-orbitron tracking-wider"
          >
            SETUP FACE ID
          </button>
        )}
        {enrollState === 'scanning' && (
          <button
            onClick={handleCaptureAndAnalyze}
            className="px-8 py-3 rounded-md bg-primary-t-80 text-background hover:bg-primary font-orbitron tracking-wider"
          >
            CAPTURE
          </button>
        )}
        
        {isBootSequence && enrollState !== 'success' && enrollState !== 'capturing' && enrollState !== 'analyzing' &&(
             <button
                onClick={onClose}
                className="px-6 py-3 rounded-md bg-transparent text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 font-orbitron tracking-wider"
              >
                SKIP FOR NOW
            </button>
        )}

        {!isBootSequence && enrollState !== 'success' && (
            <button
                onClick={onClose}
                className="px-6 py-3 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 font-orbitron tracking-wider"
            >
                CANCEL
            </button>
        )}

      </div>
    </div>
  );
};

export default FaceEnrollment;
