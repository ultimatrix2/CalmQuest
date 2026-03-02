package com.calmquest.repository;

import com.calmquest.entity.CommunityPost;
import com.calmquest.entity.PostReaction;
import com.calmquest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostReactionRepository extends JpaRepository<PostReaction, Long> {

    Optional<PostReaction> findByUserAndPostAndEmoji(User user, CommunityPost post, String emoji);

    List<PostReaction> findAllByPost(CommunityPost post);

    @Query("SELECT r.emoji, COUNT(r) FROM PostReaction r WHERE r.post = :post GROUP BY r.emoji")
    List<Object[]> countByPostGroupByEmoji(@Param("post") CommunityPost post);

    @Query("SELECT r.emoji FROM PostReaction r WHERE r.user = :user AND r.post = :post")
    List<String> findEmojisByUserAndPost(@Param("user") User user, @Param("post") CommunityPost post);

    void deleteByUserAndPostAndEmoji(User user, CommunityPost post, String emoji);
}
