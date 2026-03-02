package com.calmquest.repository;

import com.calmquest.entity.AIReport;
import com.calmquest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.calmquest.entity.ChatSession;

import java.util.List;

@Repository
public interface AIReportRepository extends JpaRepository<AIReport, Long> {
    List<AIReport> findByStudentOrderByCreatedAtDesc(User student);
    List<AIReport> findBySession(ChatSession session);
}
