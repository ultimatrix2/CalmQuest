package com.calmquest.controller;

import com.calmquest.dto.*;
import com.calmquest.entity.AIReport;
import com.calmquest.entity.User;
import com.calmquest.repository.AIReportRepository;
import com.calmquest.repository.UserRepository;
import com.calmquest.service.ChatService;
import com.calmquest.service.FacialAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final FacialAnalysisService facialAnalysisService;
    private final AIReportRepository aiReportRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ─── Session Management ─────────────────────────────────

    @PostMapping("/session/start")
    public ResponseEntity<?> startSession(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        var session = chatService.startSession(user);
        Map<String, Object> response = new HashMap<>();
        response.put("id", session.getId());
        response.put("startTime", session.getStartTime().toString());
        response.put("messageCount", 0);
        response.put("overallSentiment", 0);
        response.put("status", session.getStatus().name());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/session/{sessionId}/end")
    public ResponseEntity<?> endSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        chatService.endSession(sessionId, user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Session ended"));
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(chatService.getSessions(user));
    }

    // ─── Messaging ──────────────────────────────────────────

    @PostMapping("/session/{sessionId}/message")
    public ResponseEntity<ChatResponseDTO> sendMessage(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        User user = getUser(userDetails);
        String content = body.get("content");
        return ResponseEntity.ok(chatService.sendMessage(sessionId, user, content));
    }

    @GetMapping("/session/{sessionId}/history")
    public ResponseEntity<List<ChatMessageDTO>> getHistory(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(chatService.getHistory(sessionId, user));
    }

    // ─── Assessments ────────────────────────────────────────

    @PostMapping("/session/{sessionId}/assessment/start")
    public ResponseEntity<AssessmentQuestionDTO> startAssessment(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(chatService.startAssessment(sessionId, user));
    }

    @PostMapping("/session/{sessionId}/assessment/answer")
    public ResponseEntity<?> submitAnswer(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody AssessmentAnswerDTO answerDTO) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(chatService.submitAnswer(sessionId, user, answerDTO));
    }

    // ─── Facial Emotion Logging ─────────────────────────────

    @PostMapping("/session/{sessionId}/facial-emotion")
    public ResponseEntity<?> logFacialEmotion(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody FacialEmotionDTO dto) {
        User user = getUser(userDetails);
        facialAnalysisService.logFacialEmotion(sessionId, user, dto);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ─── Voice Analysis Logging ──────────────────────────────

    @PostMapping("/session/{sessionId}/voice-analysis")
    public ResponseEntity<?> logVoiceAnalysis(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        User user = getUser(userDetails);
        int duration = body.containsKey("duration") ? ((Number) body.get("duration")).intValue() : 0;
        String transcript = (String) body.getOrDefault("transcript", "");
        chatService.processVoiceData(sessionId, user, duration, transcript);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ─── Reports ────────────────────────────────────────────

    @GetMapping("/reports")
    public ResponseEntity<?> getReports(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        List<AIReport> reports = aiReportRepository.findByStudentOrderByCreatedAtDesc(user);
        List<Map<String, Object>> result = reports.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("ghq12Score", r.getGhq12Score());
            map.put("phq9Score", r.getPhq9Score());
            map.put("gad7Score", r.getGad7Score());
            map.put("combinedSeverityScore", r.getCombinedSeverityScore() != null ? r.getCombinedSeverityScore() : 0);
            map.put("summary", r.getSummary());
            map.put("recommendedActions", r.getRecommendedActions());
            map.put("dominantEmotion", r.getDominantEmotion());
            map.put("facialSummary", r.getFacialSummary());
            map.put("voiceSummary", r.getVoiceSummary());
            map.put("sentimentSummary", r.getSentimentSummary()); // New field
            map.put("cognitivePatterns", r.getCognitivePatterns());
            map.put("actionTaken", r.getActionTaken() != null ? r.getActionTaken().name() : null);
            map.put("createdAt", r.getCreatedAt().toString());
            map.put("voiceDistressScore", r.getVoiceDistressScore()); // New field
            map.put("facialDistressScore", r.getFacialDistressScore()); // New field
            map.put("sentimentDistressScore", r.getSentimentDistressScore()); // New field
            
            // Add facial emotion breakdown
            if (r.getEmotionBreakdown() != null && !r.getEmotionBreakdown().isBlank()) {
                try {
                    Map<String, Double> breakdown = objectMapper.readValue(
                        r.getEmotionBreakdown(),
                        new TypeReference<Map<String, Double>>() {}
                    );
                    map.put("emotionBreakdown", breakdown);
                } catch (Exception e) {
                    map.put("emotionBreakdown", new HashMap<>());
                }
            } else {
                map.put("emotionBreakdown", new HashMap<>());
            }
            
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ─── Helper ─────────────────────────────────────────────

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
