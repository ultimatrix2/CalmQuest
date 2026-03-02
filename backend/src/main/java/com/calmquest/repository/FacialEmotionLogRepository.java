package com.calmquest.repository;

import com.calmquest.entity.FacialEmotionLog;
import com.calmquest.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacialEmotionLogRepository extends JpaRepository<FacialEmotionLog, Long> {
    List<FacialEmotionLog> findBySessionOrderByTimestampAsc(ChatSession session);
}
