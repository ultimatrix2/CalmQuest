package com.calmquest.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;

    @Enumerated(EnumType.STRING)
    private TestType testType;

    private Integer totalScore;

    private Integer maxScore;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Column(columnDefinition = "TEXT")
    private String answers; // JSON string of answers

    private Integer q9Score; // PHQ-9 suicidal ideation check

    @Builder.Default
    private Boolean thresholdCrossed = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public enum TestType {
        GHQ12, PHQ9, GAD7
    }

    public enum Severity {
        MINIMAL, MILD, MODERATE, MODERATELY_SEVERE, SEVERE
    }

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
