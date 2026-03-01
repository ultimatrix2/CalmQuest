package com.calmquest.repository;

import com.calmquest.entity.ChatMessage;
import com.calmquest.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findBySessionOrderByTimestampAsc(ChatSession session);
    int countBySession(ChatSession session);
}
