import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    FilesetResolver,
    HandLandmarker,
    FaceLandmarker,
    DrawingUtils
} from '@mediapipe/tasks-vision';
import { CloseIcon, GestureControlIcon } from './Icons';

interface RealTimeVisionProps {
    onClose: () => void;
    onGestureRecognized: (gesture: string) => void;
}

const RealTimeVision: React.FC<RealTimeVisionProps> = ({ onClose, onGestureRecognized }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastVideoTimeRef = useRef(-1);
    // FIX: Initialize useRef with null to provide an initial value, satisfying TypeScript's requirement and fixing the "Expected 1 arguments, but got 0" error.
    const requestRef = useRef<number | null>(null);

    const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
    const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
    const [loading, setLoading] = useState({ models: true, camera: true });
    const [error, setError] = useState<string | null>(null);
    
    const [lastGesture, setLastGesture] = useState<string>("No gesture detected");

    // Initialize models
    useEffect(() => {
        const createLandmarkers = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
                );
                const newHandLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 2
                });
                setHandLandmarker(newHandLandmarker);
                
                // You can enable FaceLandmarker when you're ready to implement face features
                /*
                const newFaceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                });
                setFaceLandmarker(newFaceLandmarker);
                */

                setLoading(prev => ({ ...prev, models: false }));
            } catch (e) {
                console.error("Error loading MediaPipe models", e);
                setError("Failed to load AI vision models. Please try again.");
                setLoading(prev => ({ ...prev, models: false }));
            }
        };
        createLandmarkers();
    }, []);

    // Initialize camera
    useEffect(() => {
        let stream: MediaStream | null = null;
        const enableCam = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener("loadeddata", () => {
                        setLoading(prev => ({ ...prev, camera: false }));
                    });
                }
            } catch (err) {
                console.error("Camera access error:", err);
                setError("Could not access camera. Please ensure permissions are granted.");
                setLoading(prev => ({ ...prev, camera: false }));
            }
        };
        enableCam();
        
        return () => {
             stream?.getTracks().forEach(track => track.stop());
        }

    }, []);

    const predictWebcam = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !handLandmarker) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext("2d");
        if (!canvasCtx) return;

        // Sync canvas and video dimensions
        if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const handResults = handLandmarker.detectForVideo(video, Date.now());
            // const faceResults = faceLandmarker?.detectForVideo(video, Date.now());

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            const drawingUtils = new DrawingUtils(canvasCtx);
            
            // Draw Hand Landmarks
            if (handResults.landmarks) {
                let gestureText = "No hands detected";
                for (const [index, landmarks] of handResults.landmarks.entries()) {
                    const category = handResults.handedness[index]?.[0]?.categoryName || 'Unknown';
                    gestureText = `${category} hand detected`;

                    drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "rgba(var(--primary-color-rgb), 0.8)", lineWidth: 3 });
                    drawingUtils.drawLandmarks(landmarks, { color: "#FFFFFF", lineWidth: 1, radius: 3 });
                }
                if (gestureText !== lastGesture) {
                    setLastGesture(gestureText);
                    if (!gestureText.includes("No hands")) {
                        onGestureRecognized(gestureText);
                    }
                }
            } else {
                 if (lastGesture !== "No hands detected") {
                     setLastGesture("No hands detected");
                 }
            }

            canvasCtx.restore();
        }

        requestRef.current = requestAnimationFrame(predictWebcam);
    }, [handLandmarker, lastGesture, onGestureRecognized]);

    // Start/Stop prediction loop
    useEffect(() => {
        if (!loading.models && !loading.camera && handLandmarker) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [loading.models, loading.camera, handLandmarker, predictWebcam]);


    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center animate-fade-in-fast">
            <div className="absolute inset-0">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" />
            </div>

            { (loading.models || loading.camera || error) && (
                 <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                        {error ? (
                             <p className="font-orbitron text-2xl text-red-400">{error}</p>
                        ) : (
                             <p className="font-orbitron text-2xl text-primary animate-pulse">
                                {loading.models ? "Loading Vision Core..." : "Initializing Camera..."}
                            </p>
                        )}
                    </div>
                 </div>
            )}
           
            <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-background to-transparent">
                 <div className="flex justify-between items-center">
                    <h2 className="panel-title !mb-0 !border-none flex items-center gap-3">
                        <GestureControlIcon className="w-6 h-6"/>
                        Real-Time Vision Active
                    </h2>
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700/80 text-slate-200 hover:bg-slate-600/80">
                      Deactivate
                    </button>
                 </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                 <div className="holographic-panel !py-2 !px-4 text-center">
                    <p className="font-orbitron text-text-secondary">{lastGesture}</p>
                 </div>
            </div>
            
        </div>
    );
};

export default RealTimeVision;
