package com.calmquest.service;

import com.calmquest.entity.College;
import com.calmquest.entity.User;
import com.calmquest.entity.Notification;
import com.calmquest.entity.PostReport;
import com.calmquest.repository.PostReportRepository;
import com.calmquest.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CollegeAdminService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PostReportRepository postReportRepository;
    private final CommunityService communityService;

    public List<User> getPendingUsers(User admin) {
        if (admin.getCommunityStatus() != User.CommunityStatus.APPROVED) {
            throw new RuntimeException("You must be verified by the Super Admin to view pending users");
        }
        return userRepository.findByCollegeAndCommunityStatus(admin.getCollege(), User.CommunityStatus.PENDING)
                .stream()
                .filter(user -> user.getRole() == User.Role.STUDENT || user.getRole() == User.Role.DOCTOR)
                .toList();
    }

    @Transactional
    public User verifyUser(Long userId, boolean isApproved, User admin, String reason) {
        if (admin.getCommunityStatus() != User.CommunityStatus.APPROVED) {
            throw new RuntimeException("You must be verified by the Super Admin to verify users");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getCollege().getId().equals(admin.getCollege().getId())) {
            throw new RuntimeException("You do not have permission to verify users from other colleges");
        }

        if (user.getRole() != User.Role.STUDENT && user.getRole() != User.Role.DOCTOR) {
            throw new RuntimeException("User is not a Student or Doctor");
        }

        user.setCommunityStatus(isApproved ? User.CommunityStatus.APPROVED : User.CommunityStatus.REJECTED);
        User savedUser = userRepository.save(user);

        String statusString = isApproved ? "approved" : "declined";
        String message = "Your verification request has been " + statusString + " by your College Admin.";
        if (reason != null && !reason.trim().isEmpty()) {
            message += " Reason: " + reason;
        }

        notificationService.createNotification(
                savedUser,
                message,
                Notification.NotificationType.VERIFICATION_RESULT,
                "/dashboard/profile"
        );

        return savedUser;
    }

    public List<PostReport> getReportedPosts(User admin) {
        if (admin.getCommunityStatus() != User.CommunityStatus.APPROVED) {
            throw new RuntimeException("You must be verified by the Super Admin to view reported posts");
        }
        return postReportRepository.findByPostCollegeAndStatusOrderByCreatedAtDesc(admin.getCollege(), PostReport.ReportStatus.PENDING);
    }

    @Transactional
    public PostReport dismissReport(Long reportId, User admin) {
        if (admin.getCommunityStatus() != User.CommunityStatus.APPROVED) {
            throw new RuntimeException("You must be verified by the Super Admin to dismiss reports");
        }

        PostReport report = postReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        if (!report.getPost().getCollege().getId().equals(admin.getCollege().getId())) {
            throw new RuntimeException("You do not have permission to dismiss reports from other colleges");
        }

        report.setStatus(PostReport.ReportStatus.DISMISSED);
        return postReportRepository.save(report);
    }

    @Transactional
    public void deleteReportedPost(Long postId, User admin) {
        communityService.deletePost(postId, admin);
    }
}
