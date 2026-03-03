package com.calmquest.repository;

import com.calmquest.entity.College;
import com.calmquest.entity.CommunityPost;
import com.calmquest.entity.PostReport;
import com.calmquest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostReportRepository extends JpaRepository<PostReport, Long> {

    Optional<PostReport> findByReporterAndPost(User reporter, CommunityPost post);

    boolean existsByReporterAndPost(User reporter, CommunityPost post);

    List<PostReport> findByStatus(PostReport.ReportStatus status);

    List<PostReport> findByPostOrderByCreatedAtDesc(CommunityPost post);

    List<PostReport> findByPostCollegeAndStatusOrderByCreatedAtDesc(College college, PostReport.ReportStatus status);
}
