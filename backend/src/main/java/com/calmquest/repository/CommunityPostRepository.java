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

    Page<CommunityPost> findAllByOrderByIsPinnedDescCreatedAtDesc(Pageable pageable);

    Page<CommunityPost> findAllByOrderByIsPinnedDescCreatedAtAsc(Pageable pageable);

    Page<CommunityPost> findAllByOrderByIsPinnedDescLikesCountDesc(Pageable pageable);

    Page<CommunityPost> findAllByOrderByIsPinnedDescLikesCountAsc(Pageable pageable);

    Page<CommunityPost> findAllByOrderByIsPinnedDescCommentsCountDesc(Pageable pageable);

    @Query("SELECT p FROM CommunityPost p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.category) LIKE LOWER(CONCAT('%', :q, '%')) OR EXISTS (SELECT h FROM p.hashtags h WHERE LOWER(h) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY p.isPinned DESC, p.createdAt DESC")
    Page<CommunityPost> searchByContent(@Param("q") String query, Pageable pageable);

    Page<CommunityPost> findByCategory(String category, Pageable pageable);

    long count();

    @Query("SELECT DISTINCT p.author.id FROM CommunityPost p")
    List<Long> findDistinctAuthorIds();

    @Query("SELECT h, COUNT(h) as cnt FROM CommunityPost p JOIN p.hashtags h WHERE p.createdAt >= :since GROUP BY h ORDER BY cnt DESC")
    List<Object[]> findTrendingHashtags(@Param("since") java.time.LocalDateTime since, Pageable pageable);
}

