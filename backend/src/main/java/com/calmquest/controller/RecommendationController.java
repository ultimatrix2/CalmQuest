package com.calmquest.controller;

import com.calmquest.entity.DailyRecommendation;
import com.calmquest.entity.User;
import com.calmquest.repository.UserRepository;
import com.calmquest.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    /**
     * Get today's recommendation for the authenticated user.
     */
    @GetMapping("/today")
    public ResponseEntity<?> getTodayRecommendation(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        Optional<DailyRecommendation> recommendation = recommendationService.getTodayRecommendation(user);
        if (recommendation.isPresent()) {
            return ResponseEntity.ok(recommendation.get());
        }
        return ResponseEntity.ok(Map.of("message",
                "No recommendation available for today yet. Complete an assessment to get personalized recommendations!"));
    }

    /**
     * Get recommendation history for the authenticated user.
     */
    @GetMapping("/history")
    public ResponseEntity<List<DailyRecommendation>> getHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(recommendationService.getRecommendationHistory(user));
    }

    /**
     * Mark a recommendation as read.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        recommendationService.markAsRead(id, user);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    /**
     * Manually trigger recommendation generation for the current user (useful for
     * testing).
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateManually(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        DailyRecommendation rec = recommendationService.generateDailyRecommendation(user);
        if (rec == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "No AI reports found. Complete an assessment first."));
        }
        return ResponseEntity.ok(rec);
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
