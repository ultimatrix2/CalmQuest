package com.calmquest.repository;

import com.calmquest.entity.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    Page<CommunityPost> findByCollegeOrderByIsPinnedDescCreatedAtDesc(com.calmquest.entity.College college, Pageable pageable);

    Page<CommunityPost> findByCollegeOrderByIsPinnedDescCreatedAtAsc(com.calmquest.entity.College college, Pageable pageable);

    Page<CommunityPost> findByCollegeOrderByIsPinnedDescLikesCountDesc(com.calmquest.entity.College college, Pageable pageable);

    Page<CommunityPost> findByCollegeOrderByIsPinnedDescLikesCountAsc(com.calmquest.entity.College college, Pageable pageable);

    Page<CommunityPost> findByCollegeOrderByIsPinnedDescCommentsCountDesc(com.calmquest.entity.College college, Pageable pageable);

    @Query("SELECT p FROM CommunityPost p WHERE p.college = :college AND (LOWER(p.content) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.category) LIKE LOWER(CONCAT('%', :q, '%')) OR EXISTS (SELECT h FROM p.hashtags h WHERE LOWER(h) LIKE LOWER(CONCAT('%', :q, '%')))) ORDER BY p.isPinned DESC, p.createdAt DESC")
    Page<CommunityPost> searchByCollegeAndContent(@Param("college") com.calmquest.entity.College college, @Param("q") String query, Pageable pageable);

    Page<CommunityPost> findByCollegeAndCategory(com.calmquest.entity.College college, String category, Pageable pageable);

    long countByCollege(com.calmquest.entity.College college);

    @Query("SELECT DISTINCT p.author.id FROM CommunityPost p WHERE p.college = :college")
    List<Long> findDistinctAuthorIdsByCollege(@Param("college") com.calmquest.entity.College college);

    @Query("SELECT h, COUNT(h) as cnt FROM CommunityPost p JOIN p.hashtags h WHERE p.college = :college AND p.createdAt >= :since GROUP BY h ORDER BY cnt DESC")
    List<Object[]> findTrendingHashtagsByCollege(@Param("college") com.calmquest.entity.College college, @Param("since") java.time.LocalDateTime since, Pageable pageable);
}

