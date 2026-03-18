package com.calmquest.controller;

import com.calmquest.entity.User;
import com.calmquest.repository.UserRepository;
import com.calmquest.service.SosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
public class SosController {

    private final SosService sosService;
    private final UserRepository userRepository;

    @PostMapping("/trigger")
    public ResponseEntity<?> triggerSos(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        sosService.triggerSos(user);

        return ResponseEntity.ok(Map.of("success", true, "message", "SOS alert triggered successfully"));
    }
}
