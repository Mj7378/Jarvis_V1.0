
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { checkForFace } from '../services/geminiService';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { saveFaceProfile } from '../utils/db';

type EnrollmentState = 'scanning' | 'capturing' | 'analyzing' | 'success' | 'failure';

interface FaceEnrollmentProps {
  onComplete: (success: boolean) => void;
  onClose: () => void;
}

const FaceEnrollment: React.FC<FaceEnrollmentProps> = ({ onComplete, onClose }) => {
  const [enrollState, setEnrollState] = useState<EnrollmentState>('scanning');
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sounds = useSoundEffects(true);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please ensure permissions are granted.");
        setEnrollState('failure');
      }
    };

    startCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  
    const getOverlayStateClasses = () => {
        switch(enrollState) {
        case 'analyzing': return 'border-yellow-400/80 animate-pulse';
        case 'success': return 'border-green-500/90 bg-green-500/20';
        case 'failure': return 'border-red-500/90 bg-red-500/20';
        default: return 'border-primary/50';
        }
    };

    const getStatusText = () => {
        switch(enrollState) {
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
        return "Position your face in the center of the frame.";
    }


  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in-fast">
      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Face Scanning Overlay */}
      <div className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px]">
        <div className={`absolute inset-0 border-4 ${getOverlayStateClasses()} transition-all duration-300`}>
          {enrollState === 'scanning' || enrollState === 'analyzing' ? (
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
        <p className={`mt-2 text-base ${enrollState === 'failure' ? 'text-red-400' : 'text-slate-300'}`}>{getSubText()}</p>
      </div>

      <div className="absolute bottom-8 flex space-x-8">
        {enrollState === 'scanning' && (
          <button
            onClick={handleCaptureAndAnalyze}
            className="px-8 py-3 rounded-md bg-primary-t-80 text-background hover:bg-primary font-orbitron tracking-wider"
          >
            CAPTURE
          </button>
        )}
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 font-orbitron tracking-wider"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

export default FaceEnrollment;
