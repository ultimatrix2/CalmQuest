package com.calmquest.config;

import com.calmquest.entity.User;
import com.calmquest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.superadmin.email:admin@calmquest.com}")
    private String superAdminEmail;

    @Value("${app.superadmin.password:admin123}")
    private String superAdminPassword;

    @Value("${app.superadmin.name:System Admin}")
    private String superAdminName;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Checking for existing Super Admin...");
        
        List<User> superAdmins = userRepository.findByRoleAndCommunityStatus(User.Role.SUPER_ADMIN, User.CommunityStatus.APPROVED);
        
        if (superAdmins.isEmpty() && !userRepository.existsByEmail(superAdminEmail)) {
            log.info("No Super Admin found. Creating default Super Admin...");
            
            User superAdmin = new User();
            superAdmin.setFullName(superAdminName);
            superAdmin.setEmail(superAdminEmail);
            superAdmin.setPassword(passwordEncoder.encode(superAdminPassword));
            superAdmin.setRole(User.Role.SUPER_ADMIN);
            superAdmin.setCommunityStatus(User.CommunityStatus.APPROVED);
            superAdmin.setIsVerified(true);
            superAdmin.setIsActive(true);
            
            userRepository.save(superAdmin);
            log.info("Default Super Admin created successfully. Email: {}", superAdminEmail);
        } else {
            log.info("Super Admin already exists. Skipping creation.");
        }
    }
}
