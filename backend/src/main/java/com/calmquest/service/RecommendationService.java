package com.calmquest.service;

import com.calmquest.entity.AIReport;
import com.calmquest.entity.DailyRecommendation;
import com.calmquest.entity.User;
import com.calmquest.repository.AIReportRepository;
import com.calmquest.repository.DailyRecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final DailyRecommendationRepository recommendationRepository;
    private final AIReportRepository aiReportRepository;
    private final GeminiService geminiService;
    private final EmailService emailService;

    /**
     * Generate a personalized daily recommendation for a user based on their latest
     * AI report.
     */
    @Transactional
    public DailyRecommendation generateDailyRecommendation(User user) {
        // Check if recommendation already generated today
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        List<DailyRecommendation> existingToday = recommendationRepository
                .findByUserAndGeneratedAtBetween(user, startOfDay, endOfDay);

        if (!existingToday.isEmpty()) {
            log.info("Recommendation already generated today for user: {}", user.getEmail());
            return existingToday.get(0);
        }

        // Get the user's latest AI report
        List<AIReport> reports = aiReportRepository.findByStudentOrderByCreatedAtDesc(user);
        if (reports.isEmpty()) {
            log.info("No AI reports found for user: {}, skipping recommendation", user.getEmail());
            return null;
        }

        AIReport latestReport = reports.get(0);
        int severityScore = latestReport.getSeverityScore() != null ? latestReport.getSeverityScore() : 3;

        // Build context from latest report
        String reportContext = buildReportContext(latestReport);

        // Generate personalized recommendation using Gemini AI
        String recommendations = geminiService.generateRecommendation(reportContext, severityScore);

        // Determine category based on severity
        DailyRecommendation.Category category = determineCategory(severityScore, latestReport.getActionTaken());

        // Save recommendation
        DailyRecommendation recommendation = DailyRecommendation.builder()
                .user(user)
                .recommendations(recommendations)
                .category(category)
                .severityScore(severityScore)
                .build();

        recommendation = recommendationRepository.save(recommendation);

        // Send email notification
        try {
            emailService.sendDailyRecommendationEmail(
                    user.getEmail(),
                    user.getFullName(),
                    recommendations,
                    severityScore);
            recommendation.setEmailed(true);
            recommendationRepository.save(recommendation);
        } catch (Exception e) {
            log.error("Failed to send recommendation email to {}: {}", user.getEmail(), e.getMessage());
        }

        log.info("Daily recommendation generated for user: {} (severity: {})", user.getEmail(), severityScore);
        return recommendation;
    }

    /**
     * Get today's recommendation for a user.
     */
    public Optional<DailyRecommendation> getTodayRecommendation(User user) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        List<DailyRecommendation> todayRecs = recommendationRepository
                .findByUserAndGeneratedAtBetween(user, startOfDay, endOfDay);
        return todayRecs.isEmpty() ? Optional.empty() : Optional.of(todayRecs.get(0));
    }

    /**
     * Get recommendation history for a user.
     */
    public List<DailyRecommendation> getRecommendationHistory(User user) {
        return recommendationRepository.findByUserOrderByGeneratedAtDesc(user);
    }

    /**
     * Mark a recommendation as read.
     */
    @Transactional
    public void markAsRead(Long recommendationId, User user) {
        DailyRecommendation rec = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new RuntimeException("Recommendation not found"));
        if (!rec.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        rec.setIsRead(true);
        recommendationRepository.save(rec);
    }

    private String buildReportContext(AIReport report) {
        StringBuilder ctx = new StringBuilder();
        ctx.append("Latest Assessment Report:\n");
        if (report.getGhq12Score() != null)
            ctx.append("- GHQ-12 Score: ").append(report.getGhq12Score()).append("/12\n");
        if (report.getPhq9Score() != null)
            ctx.append("- PHQ-9 Score: ").append(report.getPhq9Score()).append("/27\n");
        if (report.getGad7Score() != null)
            ctx.append("- GAD-7 Score: ").append(report.getGad7Score()).append("/21\n");
        ctx.append("- Combined Severity: ").append(report.getSeverityScore()).append("/10\n");
        if (report.getActionTaken() != null)
            ctx.append("- Action Level: ").append(report.getActionTaken().name()).append("\n");
        if (report.getSummary() != null)
            ctx.append("- Summary: ").append(report.getSummary()).append("\n");
        if (report.getFacialSummary() != null)
            ctx.append("- Facial Analysis: ").append(report.getFacialSummary()).append("\n");
        if (report.getVoiceSummary() != null)
            ctx.append("- Voice Analysis: ").append(report.getVoiceSummary()).append("\n");
        return ctx.toString();
    }

    private DailyRecommendation.Category determineCategory(int severity, AIReport.ActionTaken action) {
        if (action == AIReport.ActionTaken.CRISIS_INTERVENTION || action == AIReport.ActionTaken.URGENT_REFERRAL) {
            return DailyRecommendation.Category.PROFESSIONAL;
        }
        if (severity >= 7)
            return DailyRecommendation.Category.PROFESSIONAL;
        if (severity >= 5)
            return DailyRecommendation.Category.SELF_CARE;
        if (severity >= 3)
            return DailyRecommendation.Category.MINDFULNESS;
        return DailyRecommendation.Category.ACTIVITY;
    }
}
