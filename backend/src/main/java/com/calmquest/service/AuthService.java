package com.calmquest.service;

import com.calmquest.dto.AuthResponse;
import com.calmquest.dto.LoginRequest;
import com.calmquest.dto.SignupRequest;
import com.calmquest.entity.*;
import com.calmquest.repository.*;  
import com.calmquest.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final DoctorRepository doctorRepository;
    private final CollegeAdminRepository collegeAdminRepository;
    private final CollegeRepository collegeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final NotificationService notificationService;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        // Handle College (Find or Create)
        College college = collegeRepository.findByName(request.getCollegeName())
                .orElseGet(() -> collegeRepository.save(new College(null, request.getCollegeName(), null, null)));

        User user;
        String roleStr = request.getRole().toUpperCase();
        User.Role role;

        try {
            role = User.Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + roleStr);
        }

        switch (role) {
            case STUDENT:
                Student student = new Student();
                student.setRegistrationNumber(request.getRegistrationNumber());
                student.setCourse(request.getCourse());
                student.setStudentYear(request.getStudentYear());
                user = student;
                break;
            case DOCTOR:
                Doctor doctor = new Doctor();
                doctor.setSpecialization(request.getSpecialization());
                doctor.setLicenseNumber(request.getLicenseNumber());
                user = doctor;
                break;
            case COLLEGE_ADMIN:
                CollegeAdmin admin = new CollegeAdmin();
                admin.setCollegeIdNumber(request.getCollegeIdNumber());
                user = admin;
                break;
            case SUPER_ADMIN:
                user = new User();
                user.setCommunityStatus(User.CommunityStatus.APPROVED);
                break;
            default:
                 // Fallback to basic user if role is not specific (though we expect specific roles)
                 user = new User();
                 break;
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setCollege(college);

        user = userRepository.save(user);

        // Send notifications based on hierarchy
        if (role == User.Role.STUDENT || role == User.Role.DOCTOR) {
            // Students and Doctors notify their College Admin
            List<User> collegeAdmins = userRepository.findByCollegeAndRole(college, User.Role.COLLEGE_ADMIN);
            for (User admin : collegeAdmins) {
                notificationService.createNotification(
                        admin,
                        "New verification request from " + user.getFullName() + " (" + role.name() + ")",
                        Notification.NotificationType.VERIFICATION_REQUEST,
                        "/dashboard/profile?userId=" + user.getId()
                );
            }
        } else if (role == User.Role.COLLEGE_ADMIN) {
            // College Admins notify Super Admins
            List<User> superAdmins = userRepository.findByRole(User.Role.SUPER_ADMIN);
            for (User superAdmin : superAdmins) {
                notificationService.createNotification(
                        superAdmin,
                        "New verification request from College Admin: " + user.getFullName() + " (" + college.getName() + ")",
                        Notification.NotificationType.VERIFICATION_REQUEST,
                        "/dashboard/profile?userId=" + user.getId()
                );
            }
        }
        
        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user);
    }
}
