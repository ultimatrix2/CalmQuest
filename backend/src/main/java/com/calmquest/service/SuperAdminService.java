package com.calmquest.service;

import com.calmquest.entity.User;
import com.calmquest.entity.Notification;
import com.calmquest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<User> getPendingAdmins() {
        return userRepository.findByRoleAndCommunityStatus(User.Role.COLLEGE_ADMIN, User.CommunityStatus.PENDING);
    }

    @Transactional
    public User verifyAdmin(Long adminId, boolean isApproved, String reason) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getRole() != User.Role.COLLEGE_ADMIN) {
            throw new RuntimeException("User is not a College Admin");
        }

        admin.setCommunityStatus(isApproved ? User.CommunityStatus.APPROVED : User.CommunityStatus.REJECTED);
        User savedAdmin = userRepository.save(admin);

        String statusString = isApproved ? "approved" : "declined";
        String message = "Your verification request has been " + statusString + " by the Super Admin.";
        if (reason != null && !reason.trim().isEmpty()) {
            message += " Reason: " + reason;
        }

        notificationService.createNotification(
                savedAdmin,
                message,
                Notification.NotificationType.VERIFICATION_RESULT,
                "/dashboard"
        );

        return savedAdmin;
    }
}
