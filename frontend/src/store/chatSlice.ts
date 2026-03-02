import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage, ChatSession, AssessmentQuestion } from '@/services/chatService';

interface ChatState {
    currentSession: ChatSession | null;
    messages: ChatMessage[];
    isLoading: boolean;
    isSending: boolean;
    assessmentInProgress: boolean;
    currentQuestion: AssessmentQuestion | null;
    assessmentComplete: boolean;
    error: string | null;
}

const initialState: ChatState = {
    currentSession: null,
    messages: [],
    isLoading: false,
    isSending: false,
    assessmentInProgress: false,
    currentQuestion: null,
    assessmentComplete: false,
    error: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setSession: (state, action: PayloadAction<ChatSession | null>) => {
            state.currentSession = action.payload;
        },
        setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
            state.messages = action.payload;
        },
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.messages.push(action.payload);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setSending: (state, action: PayloadAction<boolean>) => {
            state.isSending = action.payload;
        },
        setAssessmentInProgress: (state, action: PayloadAction<boolean>) => {
            state.assessmentInProgress = action.payload;
        },
        setCurrentQuestion: (state, action: PayloadAction<AssessmentQuestion | null>) => {
            state.currentQuestion = action.payload;
        },
        setAssessmentComplete: (state, action: PayloadAction<boolean>) => {
            state.assessmentComplete = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        resetChat: () => initialState,
    },
});

export const {
    setSession,
    setMessages,
    addMessage,
    setLoading,
    setSending,
    setAssessmentInProgress,
    setCurrentQuestion,
    setAssessmentComplete,
    setError,
    resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
