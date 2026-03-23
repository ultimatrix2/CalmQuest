package com.calmquest.repository;

import com.calmquest.entity.DailyRecommendation;
import com.calmquest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyRecommendationRepository extends JpaRepository<DailyRecommendation, Long> {

    List<DailyRecommendation> findByUserAndGeneratedAtBetween(User user, LocalDateTime start, LocalDateTime end);

    List<DailyRecommendation> findByUserOrderByGeneratedAtDesc(User user);

    Optional<DailyRecommendation> findTopByUserOrderByGeneratedAtDesc(User user);
}
