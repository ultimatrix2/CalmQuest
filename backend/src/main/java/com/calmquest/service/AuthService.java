package com.calmquest.service;

import com.calmquest.dto.AuthResponse;
import com.calmquest.dto.LoginRequest;
import com.calmquest.dto.SignupRequest;
import com.calmquest.entity.*;
import com.calmquest.repository.*;
import com.calmquest.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final DoctorRepository doctorRepository;
    private final CollegeAdminRepository collegeAdminRepository;
    private final CollegeRepository collegeRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = request.getEmail().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            User existingUser = userRepository.findByEmail(email).get();
            if (Boolean.TRUE.equals(existingUser.getIsVerified())) {
                throw new RuntimeException("Email is already registered");
            } else {
                // User exists but is not verified. Update their password/name and resend OTP
                existingUser.setFullName(request.getFullName());
                existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(existingUser);

                sendVerificationOtp(existingUser.getEmail(), existingUser.getFullName());
                return AuthResponse.builder()
                        .email(existingUser.getEmail())
                        .fullName(existingUser.getFullName())
                        .role(existingUser.getRole().name())
                        .id(existingUser.getId())
                        .emailVerificationRequired(true)
                        .build();
            }
        }

        // Handle College (Find or Create)
        College college = collegeRepository.findByName(request.getCollegeName())
                .orElseGet(() -> collegeRepository.save(College.builder().name(request.getCollegeName()).build()));

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
                user = new User();
                break;
        }

        user.setFullName(request.getFullName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setCollege(college);
        user.setIsVerified(false); // User must verify email first
        
        if (role != User.Role.SUPER_ADMIN) {
            user.setCommunityStatus(User.CommunityStatus.PENDING);
        }

        user = userRepository.save(user);

        // Send notifications based on hierarchy
        if (role == User.Role.STUDENT || role == User.Role.DOCTOR) {
            List<User> collegeAdmins = userRepository.findByCollegeAndRole(college, User.Role.COLLEGE_ADMIN);
            for (User ca : collegeAdmins) {
                notificationService.createNotification(
                        ca,
                        "New verification request from " + user.getFullName() + " (" + role.name() + ")",
                        Notification.NotificationType.VERIFICATION_REQUEST,
                        "/dashboard/profile?userId=" + user.getId());
            }
        } else if (role == User.Role.COLLEGE_ADMIN) {
            List<User> superAdmins = userRepository.findByRole(User.Role.SUPER_ADMIN);
            for (User superAdmin : superAdmins) {
                notificationService.createNotification(
                        superAdmin,
                        "New verification request from College Admin: " + user.getFullName() + " (" + college.getName()
                                + ")",
                        Notification.NotificationType.VERIFICATION_REQUEST,
                        "/dashboard/profile?userId=" + user.getId());
            }
        }

        // Send OTP for email verification instead of returning JWT
        sendVerificationOtp(email, user.getFullName());

        // Return response WITHOUT token — email verification required
        return AuthResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .id(user.getId())
                .emailVerificationRequired(true)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase();
        // Check if user exists and is verified
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!Boolean.TRUE.equals(user.getIsVerified()) && user.getRole() != User.Role.SUPER_ADMIN) {
            // Resend OTP for convenience
            sendVerificationOtp(user.getEmail(), user.getFullName());
            return AuthResponse.builder()
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole() != null ? user.getRole().name() : null)
                    .id(user.getId())
                    .emailVerificationRequired(true)
                    .build();
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token, user);
    }

    /**
     * Generate and send a 6-digit OTP to the user's email.
     */
    @Transactional
    public void sendVerificationOtp(String email, String userName) {
        email = email.toLowerCase();
        // Delete any existing tokens for this email
        verificationTokenRepository.deleteByEmail(email);

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save token with 10 minute expiry
        EmailVerificationToken token = EmailVerificationToken.builder()
                .email(email)
                .otpCode(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .verified(false)
                .build();
        verificationTokenRepository.save(token);

        // Send OTP email
        emailService.sendOtpEmail(email, otp, userName);
        log.info("OTP sent to: {}", email);
    }

    /**
     * Verify the OTP code and mark the user as verified.
     */
    @Transactional
    public AuthResponse verifyOtp(String email, String otpCode) {
        email = email.toLowerCase();
        EmailVerificationToken token = verificationTokenRepository
                .findByEmailAndOtpCodeAndVerifiedFalse(email, otpCode)
                .orElseThrow(() -> new RuntimeException("Invalid OTP code"));

        if (token.isExpired()) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        // Mark token as verified
        token.setVerified(true);
        verificationTokenRepository.save(token);

        // Mark user as verified
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsVerified(true);
        userRepository.save(user);

        // Send welcome email
        emailService.sendWelcomeEmail(email, user.getFullName());

        // Generate JWT and return full auth response
        String jwtToken = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(jwtToken, user);
    }

    /**
     * Resend OTP for email verification.
     */
    @Transactional
    public void resendOtp(String email) {
        email = email.toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new RuntimeException("Email is already verified");
        }

        sendVerificationOtp(email, user.getFullName());
    }

    /**
     * Generate a password reset token and send email.
     */
    @Transactional
    public void forgotPassword(String email) {
        email = email.toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete any existing tokens for this user
        passwordResetTokenRepository.deleteByUser(user);

        // Generate UUID token
        String token = java.util.UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), token, user.getFullName());
        log.info("Password reset email sent to: {}", email);
    }

    /**
     * Reset the user's password using the token.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired password reset token"));

        if (resetToken.isExpired()) {
            throw new RuntimeException("Password reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Invalidate token after use
        passwordResetTokenRepository.deleteByUser(user);
        log.info("Password reset successful for user: {}", user.getEmail());
    }
}
