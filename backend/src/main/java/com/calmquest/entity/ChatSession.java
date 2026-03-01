package com.calmquest.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "start_time")
    @Builder.Default
    private LocalDateTime startTime = LocalDateTime.now();

    @Column(name = "end_time")
    private LocalDateTime endTime;

    private Integer messageCount;

    private Float overallSentiment;

    private Float averageDistressLevel;

    @Builder.Default
    private Boolean assessmentTriggered = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    public enum SessionStatus {
        ACTIVE, COMPLETED, ASSESSMENT_IN_PROGRESS
    }

    @PrePersist
    protected void onCreate() {
        if (startTime == null) startTime = LocalDateTime.now();
        if (messageCount == null) messageCount = 0;
    }
}
