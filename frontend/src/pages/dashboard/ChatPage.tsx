import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '@/store/store';
import {
    setSession,
    setMessages,
    addMessage,
    setLoading,
    setSending,
    setAssessmentInProgress,
    setCurrentQuestion,
    setAssessmentComplete,
    resetChat,
} from '@/store/chatSlice';
import { chatService, type AssessmentQuestion } from '@/services/chatService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import FacialEmotionDetector from '@/components/FacialEmotionDetector';
import VoiceRecorder from '@/components/VoiceRecorder';
import {
    Loader2,
    Bot,
    User,
    Plus,
    History,
    X,
    CheckCircle2,
    MessageSquare,
    Brain,
    Shield,
    Volume2,
    VolumeX,
    LogOut,
} from 'lucide-react';

// --- Assessment Question Component ---
const AssessmentCard: React.FC<{
    question: AssessmentQuestion;
    onAnswer: (answer: number) => void;
    isSubmitting: boolean;
}> = ({ question, onAnswer, isSubmitting }) => {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    // Reset selected answer when the question changes
    useEffect(() => {
        setSelectedAnswer(null);
    }, [question.questionIndex, question.testType]);

    return (
        <div className="flex justify-start">
            <div className="max-w-[85%] space-y-3">
                <div className="bg-muted/50 dark:bg-slate-800/50 border dark:border-slate-700 rounded-2xl rounded-tl-sm p-4 space-y-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span>Well-being Check • Question {question.questionIndex + 1} of {question.totalQuestions}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{question.questionText}</p>

                    <div className="space-y-2">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedAnswer(index)}
                                disabled={isSubmitting}
                                className={`w-full text-left p-3 rounded-xl text-sm transition-all border ${selectedAnswer === index
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-background dark:bg-slate-800 hover:bg-accent/50 dark:hover:bg-slate-700 border-border dark:border-slate-700'
                                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {selectedAnswer !== null && (
                        <Button
                            size="sm"
                            onClick={() => onAnswer(selectedAnswer)}
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            Submit Answer
                        </Button>
                    )}
                </div>

                {/* Progress bar */}
                <div className="px-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${((question.questionIndex + 1) / question.totalQuestions) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Past Sessions Panel ---
const SessionsPanel: React.FC<{
    onSelectSession: (sessionId: number) => void;
    onNewChat: () => void;
    onClose: () => void;
}> = ({ onSelectSession, onNewChat, onClose }) => {
    const [sessions, setSessions] = useState<Array<{ id: number; startTime: string; messageCount: number; status: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const data = await chatService.getSessions();
                setSessions(data);
            } catch {
                // Sessions will load once backend is ready
                setSessions([]);
            } finally {
                setLoading(false);
            }
        };
        loadSessions();
    }, []);

    return (
        <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Past Conversations
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-auto py-3"
                        onClick={onNewChat}
                    >
                        <Plus className="h-4 w-4" />
                        Start New Conversation
                    </Button>
                    <Separator className="my-3" />
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            No past conversations yet.
                        </p>
                    ) : (
                        sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                className="w-full text-left p-3 rounded-lg border dark:border-slate-700 hover:bg-accent/50 dark:hover:bg-slate-800 transition-colors space-y-1 dark:bg-[#0f172a]"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Session #{session.id}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${session.status === 'ACTIVE'
                                        ? 'bg-green-500/10 text-green-600'
                                        : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {session.status}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(session.startTime).toLocaleDateString()} • {session.messageCount} messages
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

// --- Main Chat Page ---
const ChatPage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentSession, messages, isLoading, isSending, assessmentInProgress, currentQuestion, assessmentComplete } =
        useSelector((state: RootState) => state.chat);

    const [showSessions, setShowSessions] = useState(false);
    const [isAssessmentSubmitting, setIsAssessmentSubmitting] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentQuestion, scrollToBottom]);

    // Start a new session
    const handleNewChat = async () => {
        dispatch(resetChat());
        dispatch(setLoading(true));
        setShowSessions(false);
        try {
            const session = await chatService.startSession();
            dispatch(setSession(session));
            dispatch(addMessage({
                content: "Hi there! 👋 I'm your CalmQuest companion. I'm here to listen and chat — think of me as a friend who's always available. How are you feeling today?",
                sender: 'AI',
                timestamp: new Date().toISOString(),
            }));
        } catch {
            toast.error('Could not start a new session. Please try again.');
            // Still show welcome message for UI preview
            dispatch(addMessage({
                content: "Hi there! 👋 I'm your CalmQuest companion. I'm here to listen and chat — think of me as a friend who's always available. How are you feeling today?",
                sender: 'AI',
                timestamp: new Date().toISOString(),
            }));
        } finally {
            dispatch(setLoading(false));
        }
    };

    // Text-to-speech for AI responses
    const speakText = useCallback((text: string) => {
        if (!ttsEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        // Pick a natural voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
            voices.find(v => v.lang.startsWith('en') && v.localService) ||
            voices[0];
        if (preferred) utterance.voice = preferred;
        window.speechSynthesis.speak(utterance);
    }, [ttsEnabled]);

    // Handle voice message — auto-send transcript + voice analysis
    const handleVoiceMessage = useCallback(async (transcript: string, duration: number) => {
        if (!transcript.trim() || isSending) return;

        dispatch(addMessage({
            content: transcript,
            sender: 'STUDENT',
            timestamp: new Date().toISOString(),
        }));
        dispatch(setSending(true));

        // Send voice metadata to backend (fire and forget)
        if (currentSession) {
            chatService.sendVoiceAnalysis(currentSession.id, { duration, transcript }).catch(() => { });
        }

        try {
            const sessionId = currentSession?.id || 0;
            const response = await chatService.sendMessage(sessionId, transcript);
            const aiMessage = response.aiMessage;
            dispatch(addMessage({
                content: aiMessage,
                sender: 'AI',
                timestamp: new Date().toISOString(),
            }));
            speakText(aiMessage);

            // Check if backend auto-triggered an assessment
            if (response.assessmentTriggered && response.firstQuestion) {
                dispatch(setAssessmentInProgress(true));
                dispatch(addMessage({
                    content: "I'd like to do a quick well-being check with you. It'll help us understand what you're going through better. Here's the first question:",
                    sender: 'AI',
                    timestamp: new Date().toISOString(),
                }));
                speakText("I'd like to do a quick well-being check with you. Let me ask you a few questions.");
                dispatch(setCurrentQuestion(response.firstQuestion as any));
            }
        } catch {
            const fallback = "I hear you. Thank you for sharing that with me. Can you tell me more about how you've been feeling lately?";
            dispatch(addMessage({
                content: fallback,
                sender: 'AI',
                timestamp: new Date().toISOString(),
            }));
            speakText(fallback);
        } finally {
            dispatch(setSending(false));
        }
    }, [dispatch, isSending, currentSession, speakText]);

    // Handle assessment answer
    const handleAssessmentAnswer = async (answer: number) => {
        if (!currentQuestion || !currentSession) return;
        setIsAssessmentSubmitting(true);

        try {
            const result = await chatService.submitAnswer(
                currentSession.id,
                currentQuestion.testType,
                currentQuestion.questionIndex,
                answer
            );

            if ('questionText' in result) {
                // Next question
                dispatch(setCurrentQuestion(result as AssessmentQuestion));
            } else {
                // Assessment result
                const assessResult = result as import('@/services/chatService').AssessmentResult;
                dispatch(addMessage({
                    content: `✅ ${assessResult.testType} completed. Score: ${assessResult.totalScore}/${assessResult.maxScore} (${assessResult.severity}).`,
                    sender: 'AI',
                    timestamp: new Date().toISOString(),
                }));

                if (assessResult.nextTest) {
                    dispatch(addMessage({
                        content: "I'd like to understand a bit more about how you've been doing. Let me ask you a few more questions, if that's okay.",
                        sender: 'AI',
                        timestamp: new Date().toISOString(),
                    }));
                    // Use the first question of next test returned directly from submitAnswer
                    // (avoids calling startAssessment which always resets to GHQ-12)
                    const nextQuestion = (result as any).nextQuestion;
                    if (nextQuestion) {
                        dispatch(setCurrentQuestion(nextQuestion as AssessmentQuestion));
                    } else {
                        // Fallback: start next test explicitly
                        const nextQ = await chatService.startAssessment(currentSession.id);
                        dispatch(setCurrentQuestion(nextQ));
                    }
                } else {
                    // All tests done
                    dispatch(setCurrentQuestion(null));
                    dispatch(setAssessmentInProgress(false));
                    dispatch(setAssessmentComplete(true));
                    dispatch(addMessage({
                        content: "Thank you for completing the well-being check. I've prepared a summary for you. You can view your detailed report in the **Report** tab. Remember, this is just a screening — please reach out to a counselor for professional guidance. 💙",
                        sender: 'AI',
                        timestamp: new Date().toISOString(),
                    }));
                }
            }
        } catch {
            toast.error('Could not submit answer. Please try again.');
        } finally {
            setIsAssessmentSubmitting(false);
        }
    };

    // Start assessment
    const handleStartAssessment = async () => {
        if (!currentSession) return;
        dispatch(setAssessmentInProgress(true));
        dispatch(addMessage({
            content: "I'd be happy to take a well-being check.",
            sender: 'STUDENT',
            timestamp: new Date().toISOString(),
        }));
        dispatch(addMessage({
            content: "Great, let's start with some general questions about your well-being. There are no right or wrong answers — just be honest about how you've been feeling. 🔒 Everything is confidential.",
            sender: 'AI',
            timestamp: new Date().toISOString(),
        }));

        try {
            const question = await chatService.startAssessment(currentSession.id);
            dispatch(setCurrentQuestion(question));
        } catch {
            toast.error('Could not start assessment.');
            dispatch(setAssessmentInProgress(false));
        }
    };

    // Load previous session
    const handleSelectSession = async (sessionId: number) => {
        dispatch(resetChat());
        dispatch(setLoading(true));
        setShowSessions(false);
        try {
            const history = await chatService.getHistory(sessionId);
            dispatch(setSession({ id: sessionId, startTime: '', messageCount: history.length, overallSentiment: 0, status: 'ACTIVE' }));
            dispatch(setMessages(history));
        } catch {
            toast.error('Could not load session history.');
        } finally {
            dispatch(setLoading(false));
        }
    };

    // Stop TTS when unmounting
    useEffect(() => {
        return () => { window.speechSynthesis?.cancel(); };
    }, []);

    // End session and get report
    const handleEndSession = async () => {
        if (!currentSession) return;
        try {
            await chatService.endSession(currentSession.id);
            toast.success('Session ended. Generating your report...');
            dispatch(resetChat());
            navigate('/dashboard/report');
        } catch {
            toast.error('Could not end session.');
        }
    };

    // Format time
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // --- Empty State (no active session) ---
    if (!currentSession && messages.length === 0 && !isLoading) {
        return (
            <div className="container mx-auto py-6 px-4 max-w-4xl h-[calc(100vh-5rem)] flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-6 max-w-md">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center">
                            <Brain className="h-10 w-10 text-teal-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">CalmQuest AI Companion</h2>

                        </div>
                        <div className="flex flex-col gap-3">
                            <Button size="lg" onClick={handleNewChat} className="gap-2">
                                <Plus className="h-5 w-5" />
                                Start a Conversation
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => setShowSessions(true)}
                                className="gap-2"
                            >
                                <History className="h-5 w-5" />
                                View Past Conversations
                            </Button>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
                            <Shield className="h-3 w-3" />
                            <span>Your conversations are private and confidential</span>
                        </div>
                    </div>
                </div>

                {showSessions && (
                    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <Card className="w-full max-w-md h-[500px] relative overflow-hidden shadow-lg bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800">
                            <SessionsPanel
                                onSelectSession={handleSelectSession}
                                onNewChat={handleNewChat}
                                onClose={() => setShowSessions(false)}
                            />
                        </Card>
                    </div>
                )}
            </div>
        );
    }

    // --- Chat Interface ---
    return (
        <div className="container mx-auto px-4 max-w-4xl h-[calc(100vh-5rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold dark:text-slate-100">CalmQuest AI</h2>
                        <p className="text-xs text-muted-foreground">
                            {isSending ? 'Thinking...' : 'Online • Here to listen'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!assessmentInProgress && !assessmentComplete && messages.length >= 4 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStartAssessment}
                            className="gap-1.5 text-xs"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Well-being Check
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSessions(true)}
                        title="Past conversations"
                    >
                        <History className="h-4 w-4" />
                    </Button>
                    <FacialEmotionDetector
                        sessionId={currentSession?.id || null}
                        isActive={!!currentSession}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTtsEnabled(!ttsEnabled)}
                        title={ttsEnabled ? 'Mute AI voice' : 'Enable AI voice'}
                        className={ttsEnabled ? 'text-teal-500' : 'text-muted-foreground'}
                    >
                        {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNewChat}
                        title="New conversation"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    {messages.length >= 2 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEndSession}
                            className="gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            End Chat & Report
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 py-4">
                <div className="space-y-4 px-1">
                    {/* Privacy notice */}
                    <div className="flex justify-center">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                            <Shield className="h-3 w-3" />
                            <span>This conversation is private and confidential</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.sender === 'STUDENT' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'STUDENT' ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'AI'
                                            ? 'bg-gradient-to-br from-teal-500 to-blue-500'
                                            : 'bg-primary'
                                            }`}>
                                            {msg.sender === 'AI' ? (
                                                <Bot className="h-3.5 w-3.5 text-white" />
                                            ) : (
                                                <User className="h-3.5 w-3.5 text-primary-foreground" />
                                            )}
                                        </div>

                                        {/* Message bubble */}
                                        <div className="space-y-1">
                                            <div
                                                className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'STUDENT'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                    : 'bg-muted/50 dark:bg-slate-800/50 border dark:border-slate-700 rounded-tl-sm'
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                            <p className={`text-[10px] text-muted-foreground px-1 ${msg.sender === 'STUDENT' ? 'text-right' : ''
                                                }`}>
                                                {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Assessment question */}
                            {currentQuestion && (
                                <AssessmentCard
                                    question={currentQuestion}
                                    onAnswer={handleAssessmentAnswer}
                                    isSubmitting={isAssessmentSubmitting}
                                />
                            )}

                            {/* Assessment complete banner */}
                            {assessmentComplete && (
                                <div className="flex justify-center">
                                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 px-4 py-2 rounded-full">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span>Well-being check completed • View your report</span>
                                    </div>
                                </div>
                            )}

                            {/* AI typing indicator */}
                            {isSending && (
                                <div className="flex justify-start">
                                    <div className="flex gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                                            <Bot className="h-3.5 w-3.5 text-white" />
                                        </div>
                                        <div className="bg-muted/50 dark:bg-slate-800/50 border dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                                                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                                                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Voice Input Area */}
            {!assessmentInProgress && (
                <div className="border-t py-3">
                    <VoiceRecorder
                        onVoiceMessage={handleVoiceMessage}
                        disabled={false}
                        isProcessing={isSending}
                    />
                </div>
            )}

            {/* Sessions overlay */}
            {showSessions && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-md h-[500px] relative overflow-hidden shadow-lg bg-card dark:bg-[#0f172a] border border-border dark:border-slate-800">
                        <SessionsPanel
                            onSelectSession={handleSelectSession}
                            onNewChat={handleNewChat}
                            onClose={() => setShowSessions(false)}
                        />
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
