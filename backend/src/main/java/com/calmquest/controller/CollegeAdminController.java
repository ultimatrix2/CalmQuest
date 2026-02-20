package com.calmquest.controller;

import com.calmquest.entity.User;
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
}
