package com.calmquest.repository;

import com.calmquest.entity.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    List<PostComment> findByPostIdOrderByCreatedAtDesc(Long postId);

    List<PostComment> findByPostIdAndParentCommentIsNullOrderByCreatedAtDesc(Long postId);

    List<PostComment> findByParentCommentIdOrderByCreatedAtAsc(Long parentCommentId);
}
