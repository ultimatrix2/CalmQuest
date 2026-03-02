package com.calmquest.repository;

import com.calmquest.entity.ChatSession;
import com.calmquest.entity.VoiceAnalysisLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoiceAnalysisLogRepository extends JpaRepository<VoiceAnalysisLog, Long> {
    List<VoiceAnalysisLog> findBySessionOrderByTimestampAsc(ChatSession session);
}
