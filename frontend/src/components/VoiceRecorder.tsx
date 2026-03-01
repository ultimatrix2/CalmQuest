import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
    onVoiceMessage: (transcript: string, duration: number) => void;
    disabled?: boolean;
    isProcessing?: boolean;
}

// Check for browser support
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onVoiceMessage, disabled, isProcessing }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isSupported] = useState(!!SpeechRecognition);
    const [duration, setDuration] = useState(0);
    const [liveTranscript, setLiveTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    const startTimeRef = useRef<number>(0);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const transcriptRef = useRef<string>('');

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch { /* */ }
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, []);

    const startRecording = useCallback(() => {
        if (!SpeechRecognition || disabled || isProcessing) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        transcriptRef.current = '';
        setLiveTranscript('');

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                transcriptRef.current += finalTranscript;
            }

            setLiveTranscript(transcriptRef.current + interimTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
                stopRecording();
            }
        };

        recognition.onend = () => {
            // Auto-restart if still recording
            if (recognitionRef.current && isRecording) {
                try { recognition.start(); } catch { /* */ }
            }
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setIsRecording(true);
            startTimeRef.current = Date.now();
            setDuration(0);

            durationIntervalRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
        }
    }, [disabled, isProcessing, isRecording]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { /* */ }
            recognitionRef.current = null;
        }

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        const recordingDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setIsRecording(false);

        // Auto-send the transcript as a message
        const finalText = transcriptRef.current.trim();
        if (finalText) {
            onVoiceMessage(finalText, recordingDuration);
        }

        setDuration(0);
        setLiveTranscript('');
        transcriptRef.current = '';
    }, [onVoiceMessage]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isSupported) {
        return (
            <div className="text-center py-6 text-muted-foreground text-sm">
                <p>Speech recognition is not supported in this browser.</p>
                <p className="text-xs mt-1">Please use Chrome or Edge for voice features.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3 py-2">
            {/* Live transcript preview */}
            {liveTranscript && (
                <div className="w-full px-4 py-2 rounded-xl bg-muted/50 dark:bg-slate-800/50 border dark:border-slate-700 text-sm dark:text-slate-300 max-h-[80px] overflow-y-auto">
                    <span className="text-muted-foreground text-xs block mb-1">Listening...</span>
                    {liveTranscript}
                </div>
            )}

            <div className="flex items-center gap-3">
                {/* Duration indicator */}
                {isRecording && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-mono text-red-500">{formatDuration(duration)}</span>
                    </div>
                )}

                {/* Main mic button */}
                <Button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={disabled || isProcessing}
                    className={`rounded-full transition-all duration-300 ${isRecording
                        ? 'h-14 w-14 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                        : isProcessing
                            ? 'h-14 w-14 bg-muted text-muted-foreground cursor-not-allowed'
                            : 'h-14 w-14 bg-gradient-to-br from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40'
                        }`}
                >
                    {isProcessing ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : isRecording ? (
                        <Square className="h-5 w-5" />
                    ) : (
                        <Mic className="h-6 w-6" />
                    )}
                </Button>

                {/* Instruction text */}
                {!isRecording && !isProcessing && (
                    <span className="text-xs text-muted-foreground">
                        Tap to speak
                    </span>
                )}
                {isRecording && (
                    <span className="text-xs text-red-500">
                        Tap to stop
                    </span>
                )}
                {isProcessing && (
                    <span className="text-xs text-muted-foreground">
                        Processing...
                    </span>
                )}
            </div>
        </div>
    );
};

export default VoiceRecorder;
