package com.calmquest.config;

import com.calmquest.entity.User;
import com.calmquest.repository.UserRepository;
import com.calmquest.repository.AIReportRepository;
import com.calmquest.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecommendationScheduler {

    private final UserRepository userRepository;
    private final AIReportRepository aiReportRepository;
    private final RecommendationService recommendationService;

    /**
     * Runs daily at 8:00 AM to generate and email personalized recommendations
     * for all active, verified users who have at least one AI report.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void generateDailyRecommendations() {
        log.info("=== Starting Daily Recommendation Generation ===");

        // Get all active, verified users with STUDENT role
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        int successCount = 0;
        int skipCount = 0;
        int errorCount = 0;

        for (User user : students) {
            if (!Boolean.TRUE.equals(user.getIsVerified()) || !Boolean.TRUE.equals(user.getIsActive())) {
                skipCount++;
                continue;
            }

            // Only generate for users who have completed at least one assessment
            if (aiReportRepository.findByStudentOrderByCreatedAtDesc(user).isEmpty()) {
                skipCount++;
                continue;
            }

            try {
                recommendationService.generateDailyRecommendation(user);
                successCount++;
            } catch (Exception e) {
                errorCount++;
                log.error("Failed to generate recommendation for user {}: {}", user.getEmail(), e.getMessage());
            }
        }

        log.info("=== Daily Recommendation Complete: {} success, {} skipped, {} errors ===",
                successCount, skipCount, errorCount);
    }
}
