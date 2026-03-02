package com.calmquest.repository;

import com.calmquest.entity.ChatSession;
import com.calmquest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByStudentOrderByStartTimeDesc(User student);
    Optional<ChatSession> findByIdAndStudent(Long id, User student);
    Optional<ChatSession> findFirstByStudentAndStatusOrderByStartTimeDesc(User student, ChatSession.SessionStatus status);
}
