package com.calmquest.repository;

import com.calmquest.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByEmailAndOtpCodeAndVerifiedFalse(String email, String otpCode);

    Optional<EmailVerificationToken> findTopByEmailOrderByCreatedAtDesc(String email);

    @Modifying
    @Transactional
    void deleteByEmail(String email);
}
