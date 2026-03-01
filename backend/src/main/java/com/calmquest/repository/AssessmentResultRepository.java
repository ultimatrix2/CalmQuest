package com.calmquest.repository;

import com.calmquest.entity.AssessmentResult;
import com.calmquest.entity.ChatSession;
import com.calmquest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentResultRepository extends JpaRepository<AssessmentResult, Long> {
    List<AssessmentResult> findByStudentOrderByTimestampDesc(User student);
    List<AssessmentResult> findBySession(ChatSession session);
    Optional<AssessmentResult> findBySessionAndTestType(ChatSession session, AssessmentResult.TestType testType);
}
