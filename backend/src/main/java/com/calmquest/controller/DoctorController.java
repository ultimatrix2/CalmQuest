package com.calmquest.controller;

import com.calmquest.entity.Doctor;
import com.calmquest.entity.User;
import com.calmquest.repository.DoctorRepository;
import com.calmquest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    @GetMapping("/college")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Doctor>> getDoctorsInCollege(@AuthenticationPrincipal UserDetails userDetails) {
        User student = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Doctor> doctors = doctorRepository.findAll().stream()
                .filter(d -> d.getCollege() != null && d.getCollege().getId().equals(student.getCollege().getId()))
                .toList();

        return ResponseEntity.ok(doctors);
    }
}
