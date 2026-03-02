package com.calmquest.controller;

import com.calmquest.entity.User;
import com.calmquest.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    @GetMapping("/pending-admins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<User>> getPendingAdmins() {
        return ResponseEntity.ok(superAdminService.getPendingAdmins());
    }

    @PutMapping("/verify-admin/{adminId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<User> verifyAdmin(
            @PathVariable Long adminId, 
            @RequestParam boolean isApproved,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(superAdminService.verifyAdmin(adminId, isApproved, reason));
    }
}
