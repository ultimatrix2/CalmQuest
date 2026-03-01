package com.calmquest.service;

import com.calmquest.dto.FacialEmotionDTO;
import com.calmquest.entity.ChatSession;
import com.calmquest.entity.FacialEmotionLog;
import com.calmquest.entity.User;
import com.calmquest.repository.ChatSessionRepository;
import com.calmquest.repository.FacialEmotionLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacialAnalysisService {

    private final ChatSessionRepository chatSessionRepository;
    private final FacialEmotionLogRepository facialEmotionLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Log a facial emotion snapshot from the frontend webcam analysis.
     */
    public void logFacialEmotion(Long sessionId, User student, FacialEmotionDTO dto) {
        ChatSession session = chatSessionRepository.findByIdAndStudent(sessionId, student)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        String allScoresJson;
        try {
            allScoresJson = objectMapper.writeValueAsString(dto.getAllScores());
        } catch (Exception e) {
            allScoresJson = "{}";
        }

        FacialEmotionLog emotionLog = FacialEmotionLog.builder()
                .session(session)
                .dominantEmotion(dto.getEmotion())
                .confidence(dto.getConfidence())
                .allScores(allScoresJson)
                .build();

        facialEmotionLogRepository.save(emotionLog);
        log.debug("Facial emotion logged for session {}: {} (confidence: {})",
                sessionId, dto.getEmotion(), dto.getConfidence());
    }
}
