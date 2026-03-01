package com.calmquest.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private ChatSession session;

    // Assessment scores
    private Integer ghq12Score;
    private Integer phq9Score;
    private Integer gad7Score;

    // Emotion analysis
    private String dominantEmotion;

    @Column(columnDefinition = "TEXT")
    private String emotionBreakdown; // JSON

    @Column(columnDefinition = "TEXT")
    private String facialSummary;

    @Column(columnDefinition = "TEXT")
    private String voiceSummary;

    @Column(columnDefinition = "TEXT")
    private String sentimentSummary;

    private Float voiceDistressScore;

    private Float facialDistressScore;

    private Float sentimentDistressScore;

    @Column(columnDefinition = "TEXT")
    private String cognitivePatterns;

    // Combined severity (the 1-10 formula)
    private Float combinedSeverityScore;

    @Column(columnDefinition = "TEXT")
    private String summary;

    private Integer severityScore; // legacy 1-10

    @Column(columnDefinition = "TEXT")
    private String recommendedActions;

    @Enumerated(EnumType.STRING)
    private ActionTaken actionTaken;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ActionTaken {
        SELF_HELP, SUGGEST_DOCTOR, URGENT_REFERRAL, CRISIS_INTERVENTION
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
