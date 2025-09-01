
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { aiOrchestrator } from '../services/aiOrchestrator';
import { FormattedMessage } from './ChatLog'; // Re-use the message formatter
import {
    CloseIcon, MicrophoneIcon, ObjectDetectionIcon, TextRecognitionIcon,
    FaceRecognitionIcon, GestureControlIcon, EyeTrackingIcon, VQAIcon, CameraIcon
} from './Icons';

interface VisionIntelligenceProps {
  onLogToChat: (prompt: string, imageUrl: string, response: string) => void;
  onActivateRealTimeFeature: (feature: string) => void;
  onClose: () => void;
}

type AnalysisMode = 'vqa' | 'object' | 'text' | 'face';
type CaptureState = 'idle' | 'analyzing' | 'result' | 'error';

const VisionIntelligence: React.FC<VisionIntelligenceProps> = ({ onLogToChat, onActivateRealTimeFeature, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [error, setError] = useState<string>('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('vqa');

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  
  const [isHolding, setIsHolding] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  const handleTranscript = (transcript: string) => {
    if (transcript && isHolding) {
      captureAndAnalyze(transcript);
    }
    setIsHolding(false);
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
          videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
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
      stopListening();
      if(longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prompts = useMemo(() => ({
      vqa: 'Analyze this image.',
      object: 'Identify all distinct objects in this image and provide a list.',
      text: 'Read all text in this image, including handwritten text, and provide an accurate transcription.',
      face: 'Analyze the faces in this image. How many are there, and what are their apparent emotional expressions?'
  }), []);

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return null;
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
  
  const captureAndAnalyze = async (spokenPrompt?: string) => {
      const frame = captureFrame();
      if (!frame) {
          setError("Failed to capture frame.");
          return;
      }

      setCapturedImage(frame);
      setCaptureState('analyzing');
      setAnalysisResult('');
      
      const prompt = spokenPrompt || prompts[analysisMode];
      setCurrentPrompt(prompt);
      const base64 = frame.split(',')[1];
      const image = { mimeType: 'image/jpeg', data: base64 };
      
      try {
        const stream = await aiOrchestrator.getAiResponseStream(prompt, [], image);
        for await (const chunk of stream) {
            setAnalysisResult(prev => prev + chunk.text);
        }
        setCaptureState('result');
      } catch (err) {
        console.error(err);
        setError("Failed to get analysis from AI.");
        setCaptureState('error');
      }
  };
  
  const handleButtonPress = () => {
    longPressTimer.current = window.setTimeout(() => {
        setIsHolding(true);
        setAnalysisMode('vqa'); // Holding always defaults to VQA
        startListening();
    }, 250);
  };
  
  const handleButtonRelease = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
    if (isHolding) {
        stopListening();
    } else {
        captureAndAnalyze();
    }
  };
  
  const handleLog = () => {
    if(capturedImage && analysisResult) {
        onLogToChat(currentPrompt, capturedImage, analysisResult);
    }
  };

  const handleNewScan = () => {
      setCaptureState('idle');
      setCapturedImage(null);
      setAnalysisResult('');
      setCurrentPrompt('');
      setError('');
  };

  const SidebarButton: React.FC<{ label: string, mode: AnalysisMode, icon: React.ReactNode }> = ({ label, mode, icon }) => (
      <button
          onClick={() => setAnalysisMode(mode)}
          className={`flex items-center w-full p-3 gap-3 rounded-lg transition-all duration-200 text-left ${analysisMode === mode ? 'bg-primary text-background' : 'text-text-primary hover:bg-primary-t-20'}`}
          aria-pressed={analysisMode === mode}
      >
          {icon}
          <span className="font-orbitron text-sm">{label}</span>
      </button>
  );

  const RealTimeFeatureButton: React.FC<{ label: string, feature: string, icon: React.ReactNode }> = ({ label, feature, icon }) => (
      <div className="relative group">
          <button
              onClick={() => onActivateRealTimeFeature(feature)}
              className="flex items-center w-full p-3 gap-3 rounded-lg transition-colors duration-200 text-left text-text-primary hover:bg-primary-t-20 cursor-pointer"
          >
              {icon}
              <span className="font-orbitron text-sm">{label}</span>
          </button>
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max px-2 py-1 bg-background border border-primary-t-20 rounded-md text-xs text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Activate Real-Time Mode...
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center animate-fade-in-fast">
      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Content */}
      <div className="relative w-full h-full flex">
          {/* Sidebar */}
          <aside className="w-64 h-full bg-panel/80 backdrop-blur-sm p-4 flex flex-col space-y-2 border-r border-primary-t-20">
              <h2 className="panel-title !mb-2"><CameraIcon className="w-5 h-5"/> Vision Intelligence</h2>
              <SidebarButton label="General Inquiry" mode="vqa" icon={<VQAIcon className="w-6 h-6"/>} />
              <SidebarButton label="Object Detection" mode="object" icon={<ObjectDetectionIcon className="w-6 h-6"/>} />
              <SidebarButton label="Text Reader (OCR)" mode="text" icon={<TextRecognitionIcon className="w-6 h-6"/>} />
              <SidebarButton label="Face Analysis" mode="face" icon={<FaceRecognitionIcon className="w-6 h-6"/>} />
              <div className="!mt-auto pt-4 border-t border-primary-t-20 space-y-2">
                 <h3 className="text-xs font-orbitron text-text-muted px-2">REAL-TIME SYSTEMS</h3>
                 <RealTimeFeatureButton label="Identity Scan" feature="Face Recognition" icon={<FaceRecognitionIcon className="w-6 h-6"/>} />
                 <RealTimeFeatureButton label="Gaze Tracking" feature="Eye Tracking" icon={<EyeTrackingIcon className="w-6 h-6"/>} />
                 <RealTimeFeatureButton label="Gesture Control" feature="Hand Gesture Recognition" icon={<GestureControlIcon className="w-6 h-6"/>} />
              </div>
          </aside>

          {/* Main View */}
          <main className="flex-1 flex flex-col items-center justify-center p-8">
              {captureState === 'idle' && (
                  <div className="text-center">
                    <div className="relative">
                        <button
                          onMouseDown={handleButtonPress} onMouseUp={handleButtonRelease}
                          onTouchStart={handleButtonPress} onTouchEnd={handleButtonRelease}
                          className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center text-white transform hover:scale-110 active:scale-105 transition-all duration-200 ${isListening ? 'bg-red-500 animate-pulse-strong' : 'bg-primary-t-80'}`}
                          aria-label="Tap to analyze, hold to speak and analyze" disabled={!!error || !isCameraReady}
                        >
                            {isListening ? <MicrophoneIcon className="w-12 h-12" /> : <div className="w-16 h-16 rounded-full bg-white"></div>}
                        </button>
                        {!isListening && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-max text-center text-white text-xs font-sans bg-black/40 px-2 py-1 rounded-md pointer-events-none">
                                <p>Tap to {prompts[analysisMode].split(' ')[0]}</p>
                                <p className="font-bold">Hold to Ask</p>
                            </div>
                        )}
                    </div>
                    {isListening && <p className="font-orbitron text-2xl text-white drop-shadow-lg animate-text-flicker mt-8">Listening...</p>}
                  </div>
              )}
              
              {(captureState === 'analyzing' || captureState === 'result' || captureState === 'error') && (
                  <div className="w-full h-full max-h-[80vh] grid grid-cols-2 gap-4 animate-fade-in-fast">
                      <div className="bg-panel rounded-lg border border-primary-t-20 flex items-center justify-center overflow-hidden">
                          {capturedImage && <img src={capturedImage} alt="Captured frame" className="max-w-full max-h-full object-contain" />}
                      </div>
                      <div className="bg-panel rounded-lg border border-primary-t-20 flex flex-col">
                          <h3 className="font-orbitron text-primary p-3 border-b border-primary-t-20 truncate">{currentPrompt}</h3>
                          <div className="flex-1 p-3 overflow-y-auto styled-scrollbar">
                              {captureState === 'analyzing' && <p className="text-text-muted animate-pulse">Analyzing...</p>}
                              {captureState === 'error' && <p className="text-red-400">{error}</p>}
                              {captureState === 'result' && <FormattedMessage text={analysisResult} />}
                          </div>
                          <div className="p-3 border-t border-primary-t-20 flex justify-end gap-3">
                              <button onClick={handleNewScan} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80">New Scan</button>
                              <button onClick={handleLog} disabled={captureState !== 'result'} className="px-4 py-2 rounded-md bg-primary-t-80 text-background hover:bg-primary disabled:opacity-50">Log to Chat</button>
                          </div>
                      </div>
                  </div>
              )}
          </main>
      </div>

      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-text-muted hover:text-primary hover:bg-panel/50 transform hover:scale-110 active:scale-100 transition-all duration-200">
          <CloseIcon className="w-8 h-8" />
      </button>

      {error && !captureState && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-800/80 text-white p-4 rounded-md">{error}</div>}
    </div>
  );
};

export default VisionIntelligence;