package com.calmquest.repository;

import com.calmquest.entity.EmotionLog;
import com.calmquest.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmotionLogRepository extends JpaRepository<EmotionLog, Long> {
    List<EmotionLog> findByMessage(ChatMessage message);
}
