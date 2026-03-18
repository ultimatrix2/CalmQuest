package com.calmquest.controller;

import com.calmquest.entity.User;
import com.calmquest.entity.PostReport;
import com.calmquest.service.CollegeAdminService;
import com.calmquest.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import com.calmquest.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/college-admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class CollegeAdminController {

    private final CollegeAdminService collegeAdminService;
    private final UserRepository userRepository;

    @GetMapping("/pending-students")
    @PreAuthorize("hasRole('COLLEGE_ADMIN')")
    public ResponseEntity<List<User>> getPendingStudents(@AuthenticationPrincipal UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        return ResponseEntity.ok(collegeAdminService.getPendingUsers(admin));
    }

    @PutMapping("/verify-student/{studentId}")
    @PreAuthorize("hasRole('COLLEGE_ADMIN')")
    public ResponseEntity<User> verifyStudent(@PathVariable Long studentId, 
                                              @RequestParam boolean isApproved,
                                              @RequestParam(required = false) String reason,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        return ResponseEntity.ok(collegeAdminService.verifyUser(studentId, isApproved, admin, reason));
    }

    @GetMapping("/reported-posts")
    @PreAuthorize("hasRole('COLLEGE_ADMIN')")
    public ResponseEntity<List<PostReport>> getReportedPosts(@AuthenticationPrincipal UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        return ResponseEntity.ok(collegeAdminService.getReportedPosts(admin));
    }

    @PutMapping("/reported-posts/{reportId}/dismiss")
    @PreAuthorize("hasRole('COLLEGE_ADMIN')")
    public ResponseEntity<PostReport> dismissReport(@PathVariable Long reportId,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        return ResponseEntity.ok(collegeAdminService.dismissReport(reportId, admin));
    }

    @DeleteMapping("/reported-posts/{postId}")
    @PreAuthorize("hasRole('COLLEGE_ADMIN')")
    public ResponseEntity<Void> deleteReportedPost(@PathVariable Long postId,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        collegeAdminService.deleteReportedPost(postId, admin);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/emergency-contacts")
    @PreAuthorize("hasRole('COLLEGE_ADMIN')")
    public ResponseEntity<java.util.Map<String, String>> getEmergencyContacts(@AuthenticationPrincipal UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        return ResponseEntity.ok(collegeAdminService.getEmergencyContacts(admin));
    }

    @PutMapping("/emergency-contacts")
    @PreAuthorize("hasRole('COLLEGE_ADMIN')")
    public ResponseEntity<java.util.Map<String, String>> updateEmergencyContacts(
            @RequestBody java.util.Map<String, String> contacts,
            @AuthenticationPrincipal UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        return ResponseEntity.ok(collegeAdminService.updateEmergencyContacts(contacts.get("emergencyPhone"), contacts.get("emergencyEmail"), admin));
    }
}
