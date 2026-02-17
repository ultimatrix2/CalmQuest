package com.calmquest.controller;

import com.calmquest.dto.ProfileDTO;
import com.calmquest.entity.*;
import com.calmquest.repository.NotificationRepository;
import com.calmquest.repository.UserRepository;
import com.calmquest.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Transactional
public class UserController {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final CloudinaryService cloudinaryService;

    @GetMapping("/me")
    public ResponseEntity<ProfileDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ProfileDTO.fromEntity(user));
    }

    @PutMapping(value = "/me", consumes = {"multipart/form-data"})
    public ResponseEntity<ProfileDTO> updateCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestPart("data") ProfileDTO profileDTO,
            @RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFullName(profileDTO.getFullName());
        
        if (user instanceof Student student) {
            student.setRegistrationNumber(profileDTO.getRegistrationNumber());
            student.setCourse(profileDTO.getCourse());
            student.setStudentYear(profileDTO.getStudentYear());
        } else if (user instanceof Doctor doctor) {
             doctor.setSpecialization(profileDTO.getSpecialization());
             doctor.setLicenseNumber(profileDTO.getLicenseNumber());
        } else if (user instanceof CollegeAdmin admin) {
            admin.setCollegeIdNumber(profileDTO.getCollegeIdNumber());
        }
        
        // Handle file upload
        if (file != null && !file.isEmpty()) {
            String imageUrl = cloudinaryService.uploadFile(file);
            user.setProfilePicture(imageUrl);
        }

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(ProfileDTO.fromEntity(updatedUser));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ProfileDTO> getUserProfile(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        // Access control: 
        // 1. User viewing themselves (already covered by /me but good to have)
        // 2. College Admin viewing user from same college
        if (!currentUser.getId().equals(userId)) {
            boolean isCollegeAdmin = currentUser.getRole() == User.Role.COLLEGE_ADMIN;
            boolean sameCollege = currentUser.getCollege() != null && 
                                  targetUser.getCollege() != null && 
                                  currentUser.getCollege().getId().equals(targetUser.getCollege().getId());
                                  
            if (!isCollegeAdmin || !sameCollege) {
                return ResponseEntity.status(403).build();
            }
        }

        return ResponseEntity.ok(ProfileDTO.fromEntity(targetUser));
    }

    @PostMapping("/verification/request")
    public ResponseEntity<?> requestVerification(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCollege() == null) {
            return ResponseEntity.badRequest().body("User must be affiliated with a college to request verification.");
        }

        user.setCommunityStatus(User.CommunityStatus.PENDING);
        userRepository.save(user);

        // Notify College Admin(s)
        List<User> admins = userRepository.findByCollegeAndRole(user.getCollege(), User.Role.COLLEGE_ADMIN);
        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .recipient(admin)
                    .message("New verification request from " + user.getFullName())
                    .type(Notification.NotificationType.VERIFICATION_REQUEST)
                    .link("/dashboard/profile?userId=" + user.getId())
                    .build();
            notificationRepository.save(notification);
        }

        return ResponseEntity.ok("Verification requested successfully.");
    }

    @PostMapping("/verification/{userId}/approve")
    public ResponseEntity<?> approveVerification(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        if (admin.getRole() != User.Role.COLLEGE_ADMIN) {
             return ResponseEntity.status(403).body("Only College Admins can approve verification.");
        }

        User userToVerify = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Ensure admin belongs to same college
        if (!admin.getCollege().getId().equals(userToVerify.getCollege().getId())) {
             return ResponseEntity.status(403).body("You can only verify users from your college.");
        }

        userToVerify.setCommunityStatus(User.CommunityStatus.APPROVED);
        userToVerify.setIsVerified(true);
        userRepository.save(userToVerify);

        // Notify User
        Notification notification = Notification.builder()
                .recipient(userToVerify)
                .message("Your verification request has been APPROVED by " + admin.getFullName())
                .type(Notification.NotificationType.VERIFICATION_RESULT)
                .link("/dashboard/profile")
                .build();
        notificationRepository.save(notification);

        return ResponseEntity.ok("User approved successfully.");
    }

    @PostMapping("/verification/{userId}/reject")
    public ResponseEntity<?> rejectVerification(
            @PathVariable Long userId,
            @RequestBody(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails) {

        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getRole() != User.Role.COLLEGE_ADMIN) {
            return ResponseEntity.status(403).body("Only College Admins can reject verification.");
        }

        User userToVerify = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!admin.getCollege().getId().equals(userToVerify.getCollege().getId())) {
            return ResponseEntity.status(403).body("You can only verify users from your college.");
        }

        userToVerify.setCommunityStatus(User.CommunityStatus.REJECTED);
        userRepository.save(userToVerify);

        // Notify User
        String message = "Your verification request was REJECTED.";
        if (reason != null && !reason.isEmpty()) {
            message += " Reason: " + reason;
        }

        Notification notification = Notification.builder()
                .recipient(userToVerify)
                .message(message)
                .type(Notification.NotificationType.VERIFICATION_RESULT)
                .link("/dashboard/profile")
                .build();
        notificationRepository.save(notification);

        return ResponseEntity.ok("User verification rejected.");
    }
    
    @GetMapping("/verification/pending")
    public ResponseEntity<List<ProfileDTO>> getPendingVerifications(@AuthenticationPrincipal UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getRole() != User.Role.COLLEGE_ADMIN) {
            return ResponseEntity.status(403).build();
        }
        
        if (admin.getCollege() == null) {
             return ResponseEntity.badRequest().build();
        }

        List<User> pendingUsers = userRepository.findByCollegeAndCommunityStatus(admin.getCollege(), User.CommunityStatus.PENDING);
        List<ProfileDTO> profileDTOs = pendingUsers.stream()
                .map(ProfileDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(profileDTOs);
    }
}
