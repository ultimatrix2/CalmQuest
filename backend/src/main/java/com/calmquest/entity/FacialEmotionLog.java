package com.calmquest.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "facial_emotion_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacialEmotionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;

    private String dominantEmotion;

    private Float confidence;

    @Column(columnDefinition = "TEXT")
    private String allScores; // JSON: {"sad":0.65, "neutral":0.12, ...}

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
