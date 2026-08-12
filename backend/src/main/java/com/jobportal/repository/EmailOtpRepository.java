package com.jobportal.repository;

import com.jobportal.entity.EmailOtp;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Optional;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    Optional<EmailOtp> findByEmail(String email);

    @Modifying
    @Transactional
    void deleteByEmail(String email);
}
