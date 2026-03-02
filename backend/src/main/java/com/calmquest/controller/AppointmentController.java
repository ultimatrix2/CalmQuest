package com.calmquest.controller;

import com.calmquest.dto.AppointmentRequest;
import com.calmquest.dto.AppointmentResponse;
import com.calmquest.dto.AppointmentStatusUpdate;
import com.calmquest.entity.User;
import com.calmquest.repository.UserRepository;
import com.calmquest.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AppointmentResponse> requestAppointment(
            @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User student = getUser(userDetails);
        return ResponseEntity.ok(appointmentService.requestAppointment(student, request));
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<AppointmentResponse>> getStudentAppointments(
            @AuthenticationPrincipal UserDetails userDetails) {
        User student = getUser(userDetails);
        return ResponseEntity.ok(appointmentService.getStudentAppointments(student));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(
            @AuthenticationPrincipal UserDetails userDetails) {
        User doctor = getUser(userDetails);
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctor));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AppointmentResponse> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestBody AppointmentStatusUpdate update,
            @AuthenticationPrincipal UserDetails userDetails) {
        User doctor = getUser(userDetails);
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, doctor, update));
    }
}
