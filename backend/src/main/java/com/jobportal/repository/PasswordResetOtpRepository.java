package com.jobportal.repository;

import com.jobportal.entity.PasswordResetOtp;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findByEmail(String email);

    @Modifying
    @Transactional
    void deleteByEmail(String email);
}
