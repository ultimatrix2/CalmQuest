package com.calmquest.service;

import com.calmquest.dto.*;
import com.calmquest.entity.*;
import com.calmquest.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final VoiceAnalysisLogRepository voiceAnalysisLogRepository;
    private final AIReportRepository aiReportRepository;
    private final GeminiService geminiService;
    private final AssessmentService assessmentService;
    private final ObjectMapper objectMapper;

    // Thread-local storage for in-progress assessment answers
    private final Map<Long, List<Integer>> sessionAnswers = new HashMap<>();
    private final Map<Long, AssessmentResult.TestType> sessionCurrentTest = new HashMap<>();

    /**
     * Start a new chat session for the student.
     */
    @Transactional
    public ChatSession startSession(User student) {
        ChatSession session = ChatSession.builder()
                .student(student)
                .messageCount(0)
                .overallSentiment(0f)
                .averageDistressLevel(0f)
                .build();
        return chatSessionRepository.save(session);
    }

    /**
     * Send a message and get AI response.
     */
    @Transactional
    public ChatResponseDTO sendMessage(Long sessionId, User student, String content) {
        ChatSession session = chatSessionRepository.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Save student message
        ChatMessage studentMsg = ChatMessage.builder()
                .session(session)
                .sender(ChatMessage.SenderType.STUDENT)
                .content(content)
                .build();
        studentMsg = chatMessageRepository.save(studentMsg);

        // Analyze message — try Gemini API first, fallback to keyword analysis
        try {
            Map<String, Object> analysis;
            try {
                analysis = geminiService.analyzeMessage(content);
                log.debug("Gemini API analysis used for message in session {}", sessionId);
            } catch (Exception apiEx) {
                log.debug("Gemini API unavailable, using keyword fallback: {}", apiEx.getMessage());
                analysis = geminiService.keywordAnalysisFallback(content);
            }
            studentMsg.setSentimentScore(((Number) analysis.getOrDefault("sentiment", 0)).floatValue());
            studentMsg.setDistressLevel(((Number) analysis.getOrDefault("distressLevel", 0)).intValue());
            studentMsg.setDetectedEmotion((String) analysis.getOrDefault("emotion", "neutral"));
            Object themes = analysis.get("keyThemes");
            if (themes != null) {
                studentMsg.setKeyThemes(objectMapper.writeValueAsString(themes));
            }
            chatMessageRepository.save(studentMsg);
        } catch (Exception e) {
            log.warn("Message analysis failed: {}", e.getMessage());
        }

        // Build recent history for context
        List<ChatMessage> recentMessages = chatMessageRepository.findBySessionOrderByTimestampAsc(session);
        List<Map<String, String>> chatHistory = recentMessages.stream()
                .map(msg -> Map.of("sender", msg.getSender().name(), "content", msg.getContent()))
                .collect(Collectors.toList());

        // Fetch student profile context (recent reports)
        List<AIReport> pastReports = aiReportRepository.findByStudentOrderByCreatedAtDesc(student);
        String studentProfileContext = "";
        if (pastReports != null && !pastReports.isEmpty()) {
            StringBuilder contextBuilder = new StringBuilder("You have access to the student's past assessment reports. You may gently acknowledge them if the user asks or if it relates to their current mood. (Most recent first):\n");
            int count = Math.min(3, pastReports.size());
            for (int i = 0; i < count; i++) {
                AIReport r = pastReports.get(i);
                contextBuilder.append(String.format("- %s: Severity %d/10. Dominant emotion: %s. Action: %s\n",
                        r.getCreatedAt().toLocalDate().toString(),
                        r.getCombinedSeverityScore() != null ? Math.round(r.getCombinedSeverityScore()) : 0,
                        r.getDominantEmotion() != null ? r.getDominantEmotion() : "unknown",
                        r.getActionTaken() != null ? r.getActionTaken().name() : "NONE"));
            }
            studentProfileContext = contextBuilder.toString();
        }

        // Get AI response (using context)
        String aiResponse = geminiService.generateChatResponse(chatHistory, content, studentProfileContext);

        // Save AI message
        ChatMessage aiMsg = ChatMessage.builder()
                .session(session)
                .sender(ChatMessage.SenderType.AI)
                .content(aiResponse)
                .build();
        aiMsg = chatMessageRepository.save(aiMsg);

        // Update session stats
        session.setMessageCount((int) chatMessageRepository.countBySession(session));

        // Calculate average sentiment & distress from student messages
        List<ChatMessage> studentMessages = recentMessages.stream()
                .filter(m -> m.getSender() == ChatMessage.SenderType.STUDENT)
                .collect(Collectors.toList());

        if (!studentMessages.isEmpty()) {
            float avgSentiment = (float) studentMessages.stream()
                    .mapToDouble(m -> m.getSentimentScore() != null ? m.getSentimentScore() : 0)
                    .average().orElse(0);
            float avgDistress = (float) studentMessages.stream()
                    .mapToDouble(m -> m.getDistressLevel() != null ? m.getDistressLevel() : 0)
                    .average().orElse(0);
            session.setOverallSentiment(avgSentiment);
            session.setAverageDistressLevel(avgDistress);
        }
        chatSessionRepository.save(session);

        // --- Auto-trigger assessment when distress detected ---
        boolean shouldAutoTrigger = !session.getAssessmentTriggered()
                && studentMessages.size() >= 2
                && (session.getAverageDistressLevel() >= 2
                    || session.getOverallSentiment() < -0.3f
                    || studentMsg.getDistressLevel() != null && studentMsg.getDistressLevel() >= 4);

        ChatResponseDTO.ChatResponseDTOBuilder responseBuilder = ChatResponseDTO.builder()
                .aiMessage(aiResponse)
                .sessionId(session.getId())
                .messageId(aiMsg.getId());

        if (shouldAutoTrigger) {
            log.info("Auto-triggering assessment for session {} — avgDistress: {}, avgSentiment: {}",
                    session.getId(), session.getAverageDistressLevel(), session.getOverallSentiment());

            // Start assessment
            session.setStatus(ChatSession.SessionStatus.ASSESSMENT_IN_PROGRESS);
            session.setAssessmentTriggered(true);
            chatSessionRepository.save(session);

            AssessmentResult.TestType testType = AssessmentResult.TestType.GHQ12;
            sessionCurrentTest.put(session.getId(), testType);
            sessionAnswers.put(session.getId(), new ArrayList<>());

            AssessmentQuestionDTO firstQ = assessmentService.getQuestion(testType, 0);
            responseBuilder.assessmentTriggered(true);
            responseBuilder.firstQuestion(firstQ);
        }

        return responseBuilder.build();
    }

    /**
     * Get chat history for a session.
     */
    public List<ChatMessageDTO> getHistory(Long sessionId, User student) {
        ChatSession session = chatSessionRepository.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        return chatMessageRepository.findBySessionOrderByTimestampAsc(session).stream()
                .map(m -> ChatMessageDTO.builder()
                        .content(m.getContent())
                        .sender(m.getSender().name())
                        .timestamp(m.getTimestamp().toString())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get all sessions for a student.
     */
    public List<Map<String, Object>> getSessions(User student) {
        return chatSessionRepository.findByStudentOrderByStartTimeDesc(student).stream()
                .map(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", s.getId());
                    map.put("startTime", s.getStartTime().toString());
                    map.put("messageCount", s.getMessageCount());
                    map.put("status", s.getStatus().name());
                    map.put("overallSentiment", s.getOverallSentiment());
                    return map;
                })
                .collect(Collectors.toList());
    }

    /**
     * Start an assessment (GHQ-12 first, then cascade).
     */
    public AssessmentQuestionDTO startAssessment(Long sessionId, User student) {
        ChatSession session = chatSessionRepository.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        session.setStatus(ChatSession.SessionStatus.ASSESSMENT_IN_PROGRESS);
        session.setAssessmentTriggered(true);
        chatSessionRepository.save(session);

        // Start with GHQ-12
        AssessmentResult.TestType testType = AssessmentResult.TestType.GHQ12;
        sessionCurrentTest.put(sessionId, testType);
        sessionAnswers.put(sessionId, new ArrayList<>());

        return assessmentService.getQuestion(testType, 0);
    }

    /**
     * Submit an assessment answer and get next question or result.
     */
    @Transactional
    public Map<String, Object> submitAnswer(Long sessionId, User student, AssessmentAnswerDTO answerDTO) {
        ChatSession session = chatSessionRepository.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        AssessmentResult.TestType testType = AssessmentResult.TestType.valueOf(answerDTO.getTestType());
        sessionCurrentTest.putIfAbsent(sessionId, testType);

        List<Integer> answers = sessionAnswers.computeIfAbsent(sessionId, k -> new ArrayList<>());
        answers.add(answerDTO.getAnswer());

        int totalQuestions = switch (testType) {
            case GHQ12 -> 12;
            case PHQ9 -> 9;
            case GAD7 -> 7;
        };

        // If not done yet, return next question
        if (answers.size() < totalQuestions) {
            AssessmentQuestionDTO next = assessmentService.getQuestion(testType, answers.size());
            Map<String, Object> result = new HashMap<>();
            result.put("questionIndex", next.getQuestionIndex());
            result.put("questionText", next.getQuestionText());
            result.put("options", next.getOptions());
            result.put("testType", next.getTestType());
            result.put("totalQuestions", next.getTotalQuestions());
            return result;
        }

        // Test complete - calculate result
        AssessmentResult assessmentResult = assessmentService.calculateResult(session, student, testType, answers);

        // Clear session tracking
        sessionAnswers.remove(sessionId);
        sessionCurrentTest.remove(sessionId);

        // Check if next test should cascade
        AssessmentResult.TestType nextTest = assessmentService.getNextTest(testType, assessmentResult.getThresholdCrossed());

        Map<String, Object> result = new HashMap<>();
        result.put("testType", testType.name());
        result.put("totalScore", assessmentResult.getTotalScore());
        result.put("maxScore", assessmentResult.getMaxScore());
        result.put("severity", assessmentResult.getSeverity().name());

        if (nextTest != null) {
            result.put("nextTest", nextTest.name());
            // Prepare for next test
            sessionCurrentTest.put(sessionId, nextTest);
            sessionAnswers.put(sessionId, new ArrayList<>());
            // Include first question of next test directly in response
            AssessmentQuestionDTO firstQuestion = assessmentService.getQuestion(nextTest, 0);
            Map<String, Object> nextQuestionMap = new HashMap<>();
            nextQuestionMap.put("questionIndex", firstQuestion.getQuestionIndex());
            nextQuestionMap.put("questionText", firstQuestion.getQuestionText());
            nextQuestionMap.put("options", firstQuestion.getOptions());
            nextQuestionMap.put("testType", firstQuestion.getTestType());
            nextQuestionMap.put("totalQuestions", firstQuestion.getTotalQuestions());
            result.put("nextQuestion", nextQuestionMap);
        } else {
            result.put("nextTest", null);
            // All assessments done - generate report
            AIReport report = assessmentService.generateReport(session, student);
            result.put("reportId", report.getId());

            // Update session status
            session.setStatus(ChatSession.SessionStatus.COMPLETED);
            chatSessionRepository.save(session);
        }

        return result;
    }

    /**
     * End a session.
     */
    @Transactional
    public void endSession(Long sessionId, User student) {
        ChatSession session = chatSessionRepository.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        session.setEndTime(LocalDateTime.now());
        session.setStatus(ChatSession.SessionStatus.COMPLETED);
        chatSessionRepository.save(session);

        // Generate a report from the conversation data ONLY if one doesn't exist for this session
        if (aiReportRepository.findBySession(session).isEmpty()) {
            try {
                assessmentService.generateReport(session, student);
                log.info("Report generated from conversation data for session {}", sessionId);
            } catch (Exception e) {
                log.warn("Could not generate report for session {}: {}", sessionId, e.getMessage());
            }
        } else {
            log.info("Report already exists for session {}", sessionId);
        }
    }

    /**
     * Process voice recording data — analyze transcript for emotion and save voice log.
     */
    @Transactional
    public void processVoiceData(Long sessionId, User student, int durationSeconds, String transcript) {
        ChatSession session = chatSessionRepository.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (transcript == null || transcript.isBlank()) return;

        // Analyze the transcript — try Gemini API first, fallback to keywords
        Map<String, Object> analysis;
        try {
            analysis = geminiService.analyzeMessage(transcript);
        } catch (Exception e) {
            analysis = geminiService.keywordAnalysisFallback(transcript);
        }

        // Calculate speech rate (words per second)
        int wordCount = transcript.split("\\s+").length;
        String speechRate;
        if (durationSeconds > 0) {
            double wps = (double) wordCount / durationSeconds;
            if (wps < 1.5) speechRate = "slow";
            else if (wps < 3.0) speechRate = "normal";
            else speechRate = "fast";
        } else {
            speechRate = "normal";
        }

        float sentimentScore = ((Number) analysis.getOrDefault("sentiment", 0)).floatValue();
        String detectedEmotion = (String) analysis.getOrDefault("emotion", "neutral");

        log.info("Voice analysis — Duration: {}s, Words: {}, Rate: {}, Emotion: {}, Sentiment: {}",
                durationSeconds, wordCount, speechRate, detectedEmotion, sentimentScore);

        // Save dedicated voice analysis log for report scoring
        VoiceAnalysisLog voiceLog = VoiceAnalysisLog.builder()
                .session(session)
                .durationSeconds(durationSeconds)
                .wordCount(wordCount)
                .speechRate(speechRate)
                .sentimentScore(sentimentScore)
                .detectedEmotion(detectedEmotion)
                .transcript(transcript)
                .build();
        voiceAnalysisLogRepository.save(voiceLog);

        // Save the voice transcript as a chat message record too
        ChatMessage voiceMsg = ChatMessage.builder()
                .session(session)
                .sender(ChatMessage.SenderType.STUDENT)
                .content("[Voice: " + speechRate + " pace, " + durationSeconds + "s] " + transcript)
                .sentimentScore(sentimentScore)
                .distressLevel(((Number) analysis.getOrDefault("distressLevel", 0)).intValue())
                .detectedEmotion(detectedEmotion)
                .keyThemes(speechRate)
                .build();
        chatMessageRepository.save(voiceMsg);

        // Update session stats
        session.setMessageCount(chatMessageRepository.countBySession(session));
        chatSessionRepository.save(session);
    }
}
