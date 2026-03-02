package com.calmquest.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "voice_analysis_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceAnalysisLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;

    private Integer durationSeconds;

    private Integer wordCount;

    private String speechRate; // "slow", "normal", "fast"

    private Float sentimentScore;

    private String detectedEmotion;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
