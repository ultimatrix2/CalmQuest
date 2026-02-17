package com.calmquest.repository;

import com.calmquest.entity.PostLike;
import com.calmquest.entity.CommunityPost;
import com.calmquest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByUserAndPost(User user, CommunityPost post);
    boolean existsByUserAndPost(User user, CommunityPost post);
}
