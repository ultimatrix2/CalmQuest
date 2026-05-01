package com.calmquest.repository;

import com.calmquest.entity.PostLike;
import com.calmquest.entity.CommunityPost;
import com.calmquest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByUserAndPost(User user, CommunityPost post);
    boolean existsByUserAndPost(User user, CommunityPost post);

    @Query("SELECT l.post.id FROM PostLike l WHERE l.user = :user AND l.post.id IN :postIds")
    Set<Long> findLikedPostIdsByUserAndPostIdIn(@Param("user") User user, @Param("postIds") List<Long> postIds);
}
