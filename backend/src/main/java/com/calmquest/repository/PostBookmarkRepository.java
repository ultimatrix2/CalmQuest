package com.calmquest.repository;

import com.calmquest.entity.CommunityPost;
import com.calmquest.entity.PostBookmark;
import com.calmquest.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface PostBookmarkRepository extends JpaRepository<PostBookmark, Long> {

    Optional<PostBookmark> findByUserAndPost(User user, CommunityPost post);

    boolean existsByUserAndPost(User user, CommunityPost post);

    Page<PostBookmark> findAllByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query("SELECT b.post.id FROM PostBookmark b WHERE b.user = :user AND b.post.id IN :postIds")
    Set<Long> findBookmarkedPostIdsByUserAndPostIdIn(@Param("user") User user, @Param("postIds") List<Long> postIds);
}
