package com.calmquest.repository;

import com.calmquest.entity.PostMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {

    List<PostMedia> findByPostIdOrderByDisplayOrderAsc(Long postId);

    @Query("SELECT m FROM PostMedia m WHERE m.post.id IN :postIds ORDER BY m.post.id ASC, m.displayOrder ASC")
    List<PostMedia> findByPostIdInOrderByPostIdAscDisplayOrderAsc(@Param("postIds") List<Long> postIds);
}
