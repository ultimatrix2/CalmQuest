import axios from 'axios';

const API_URL = 'http://localhost:8080/api/chat';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// --- Types ---

export interface ChatMessage {
    id?: number;
    content: string;
    sender: 'STUDENT' | 'AI';
    timestamp: string;
    sentimentScore?: number;
    detectedEmotion?: string;
}

export interface ChatSession {
    id: number;
    startTime: string;
    endTime?: string;
    messageCount: number;
    overallSentiment: number;
    status: 'ACTIVE' | 'COMPLETED' | 'ASSESSMENT_IN_PROGRESS';
}

export interface AssessmentQuestion {
    questionIndex: number;
    questionText: string;
    options: string[];
    testType: 'GHQ12' | 'PHQ9' | 'GAD7';
    totalQuestions: number;
}

export interface AssessmentResult {
    testType: 'GHQ12' | 'PHQ9' | 'GAD7';
    totalScore: number;
    maxScore: number;
    severity: string;
    thresholdCrossed: boolean;
    nextTest?: 'PHQ9' | 'GAD7';
}

export interface AIReport {
    id: number;
    sessionId: number;
    ghq12Score?: number;
    phq9Score?: number;
    gad7Score?: number;
    combinedSeverityScore: number;
    severity: string;
    summary?: string;
    recommendedActions?: string;
    dominantEmotion?: string;
    emotionBreakdown?: Record<string, number>;
    facialSummary?: string;
    voiceSummary?: string;
    sentimentSummary?: string;
    cognitivePatterns?: string;
    voiceDistressScore?: number;
    facialDistressScore?: number;
    sentimentDistressScore?: number;
    actionTaken?: 'SELF_HELP' | 'SUGGEST_DOCTOR' | 'URGENT_REFERRAL' | 'CRISIS_INTERVENTION';
    createdAt: string;
}

export interface FacialEmotionPayload {
    emotion: string;
    confidence: number;
    allScores: Record<string, number>;
}

// --- Service ---

export const chatService = {
    // Session management
    startSession: async (): Promise<ChatSession> => {
        const response = await axios.post(`${API_URL}/session/start`, {}, getAuthHeader());
        return response.data;
    },

    endSession: async (sessionId: number): Promise<void> => {
        await axios.post(`${API_URL}/session/${sessionId}/end`, {}, getAuthHeader());
    },

    getSessions: async (): Promise<ChatSession[]> => {
        const response = await axios.get(`${API_URL}/sessions`, getAuthHeader());
        return response.data;
    },

    // Messaging
    sendMessage: async (sessionId: number, content: string): Promise<{ aiMessage: string; sessionId: number; messageId: number; assessmentTriggered?: boolean; firstQuestion?: AssessmentQuestion }> => {
        const response = await axios.post(
            `${API_URL}/session/${sessionId}/message`,
            { content },
            getAuthHeader()
        );
        return response.data;
    },

    getHistory: async (sessionId: number): Promise<ChatMessage[]> => {
        const response = await axios.get(`${API_URL}/session/${sessionId}/history`, getAuthHeader());
        return response.data;
    },


    // Assessment
    startAssessment: async (sessionId: number): Promise<AssessmentQuestion> => {
        const response = await axios.post(
            `${API_URL}/session/${sessionId}/assessment/start`,
            {},
            getAuthHeader()
        );
        return response.data;
    },

    submitAnswer: async (
        sessionId: number,
        testType: string,
        questionIndex: number,
        answer: number
    ): Promise<AssessmentQuestion | AssessmentResult> => {
        const response = await axios.post(
            `${API_URL}/session/${sessionId}/assessment/answer`,
            { testType, questionIndex, answer },
            getAuthHeader()
        );
        return response.data;
    },

    // Facial emotion (from webcam)
    sendFacialEmotion: async (sessionId: number, data: FacialEmotionPayload): Promise<void> => {
        await axios.post(`${API_URL}/session/${sessionId}/facial-emotion`, data, getAuthHeader());
    },

    // Voice analysis
    sendVoiceAnalysis: async (sessionId: number, data: { duration: number; transcript: string }): Promise<void> => {
        await axios.post(`${API_URL}/session/${sessionId}/voice-analysis`, data, getAuthHeader());
    },

    // Reports
    getReport: async (sessionId: number): Promise<AIReport> => {
        const response = await axios.get(`${API_URL}/session/${sessionId}/report`, getAuthHeader());
        return response.data;
    },

    getReports: async (): Promise<AIReport[]> => {
        const response = await axios.get(`${API_URL}/reports`, getAuthHeader());
        return response.data;
    },

    getStudentReports: async (studentId: number): Promise<AIReport[]> => {
        const response = await axios.get(`${API_URL}/reports/student/${studentId}`, getAuthHeader());
        return response.data;
    },
};
