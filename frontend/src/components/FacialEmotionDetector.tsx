import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { chatService } from '@/services/chatService';
import { Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FacialEmotionDetectorProps {
    sessionId: number | null;
    isActive: boolean;
}

const MODEL_URL = '/models';
const DETECTION_INTERVAL_MS = 5000; // Analyze every 5 seconds

const FacialEmotionDetector: React.FC<FacialEmotionDetectorProps> = ({ sessionId, isActive }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

    // Load face-api models once
    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
                console.log('Face-api models loaded');
            } catch (error) {
                console.error('Failed to load face-api models:', error);
            }
        };
        loadModels();
    }, []);

    // Start webcam
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
            setCameraPermission('granted');
        } catch (error) {
            console.error('Camera access denied:', error);
            setCameraPermission('denied');
        }
    }, []);

    // Stop webcam
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setCameraActive(false);
    }, []);

    // Detect facial expressions and send to backend
    const detectExpressions = useCallback(async () => {
        if (!videoRef.current || !modelsLoaded || !sessionId || !cameraActive) return;

        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceExpressions();

            if (detection) {
                const expressions = detection.expressions;
                // Find dominant emotion
                const sorted = Object.entries(expressions).sort(
                    ([, a], [, b]) => (b as number) - (a as number)
                );
                const [dominantEmotion, confidence] = sorted[0];

                // Build all scores
                const allScores: Record<string, number> = {};
                for (const [emotion, score] of Object.entries(expressions)) {
                    allScores[emotion] = Math.round((score as number) * 100) / 100;
                }

                // Send to backend (fire and forget)
                chatService.sendFacialEmotion(sessionId, {
                    emotion: dominantEmotion,
                    confidence: confidence as number,
                    allScores,
                }).catch(() => { /* Silently ignore send errors */ });
            }
        } catch {
            // Detection can fail if face isn't visible — that's fine
        }
    }, [modelsLoaded, sessionId, cameraActive]);

    // Start/stop detection interval when camera is active
    useEffect(() => {
        if (cameraActive && isActive && modelsLoaded) {
            intervalRef.current = setInterval(detectExpressions, DETECTION_INTERVAL_MS);
            return () => {
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }
    }, [cameraActive, isActive, modelsLoaded, detectExpressions]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    // Don't render anything if not active
    if (!isActive) return null;

    return (
        <>
            {/* Hidden video element for face detection */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            />

            {/* Camera toggle button — subtle, in the header area */}
            {cameraPermission !== 'denied' && modelsLoaded && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={cameraActive ? stopCamera : startCamera}
                    title={cameraActive ? 'Camera active (click to disable)' : 'Enable camera for better analysis'}
                    className={`${cameraActive ? 'text-green-500' : 'text-muted-foreground'}`}
                >
                    {cameraActive ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                </Button>
            )}
        </>
    );
};

export default FacialEmotionDetector;
