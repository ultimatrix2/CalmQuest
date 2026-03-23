package com.calmquest.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "daily_recommendations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String recommendations;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private Category category = Category.GENERAL;

    @Column(name = "severity_score")
    private Integer severityScore;

    @Column(name = "generated_at")
    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "emailed")
    @Builder.Default
    private Boolean emailed = false;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null)
            generatedAt = LocalDateTime.now();
    }

    public enum Category {
        MINDFULNESS,
        ACTIVITY,
        SOCIAL,
        PROFESSIONAL,
        SELF_CARE,
        GENERAL
    }
}
